"""
OCEAN similarity computation with ML microservice fallback.

Plus pre‑filters: education, location, hard_skills.

Score convention: all functions return values in [0, 1] range.
Filtros são eliminatórios — se qualquer um falhar o match não é criado.
Filtros não preenchidos na vaga são ignorados (backward compatible).
"""
import logging
import math
from typing import Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)

OCEAN_DIMS = [
    "openness",
    "conscientiousness",
    "extraversion",
    "agreeableness",
    "neuroticism",
]

_SHORTHAND: dict[str, str] = {
    "o": "openness",
    "c": "conscientiousness",
    "e": "extraversion",
    "a": "agreeableness",
    "n": "neuroticism",
}

_WEIGHTS: dict[str, float] = {
    "openness": 1.0,
    "conscientiousness": 1.0,
    "extraversion": 0.8,
    "agreeableness": 0.9,
    "neuroticism": 1.1,
}

_TOTAL_WEIGHT = sum(_WEIGHTS.values())

ML_SERVICE_URL = getattr(settings, "ml_service_url", "http://localhost:8001")

MATCH_THRESHOLD = 0.6

# Níveis de educação ordenados (do menor para o maior)
EDUCATION_ORDER = [
    "Fundamental",
    "Ensino Médio",
    "Técnico",
    "Graduação",
    "Pós-graduação",
    "Mestrado",
    "Doutorado",
]


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _expand_and_normalize(scores: dict) -> dict[str, float]:
    """Expand shorthand keys and normalize values to [0, 1]."""
    expanded: dict[str, float] = {}
    for k, v in scores.items():
        key = _SHORTHAND.get(k.lower(), k.lower())
        expanded[key] = float(v)

    # If any value exceeds 1.0, assume 0-100 scale and convert
    if expanded and max(expanded.values()) > 1.0:
        expanded = {k: v / 100.0 for k, v in expanded.items()}

    # Fill missing dimensions with 0.5 (neutral midpoint)
    return {dim: expanded.get(dim, 0.5) for dim in OCEAN_DIMS}


def _education_level_score(candidate_level: str | None, job_level: str | None) -> float:
    """Compare education levels. Returns 1.0 if candidate meets or exceeds minimum."""
    if not job_level:
        return 1.0  # no filter
    if not candidate_level:
        return 0.5  # unknown — soft pass

    try:
        c_idx = EDUCATION_ORDER.index(candidate_level)
        j_idx = EDUCATION_ORDER.index(job_level)
    except ValueError:
        return 0.5  # unknown level — soft pass

    return 1.0 if c_idx >= j_idx else 0.0


# ─── Filtro 1: Formação ──────────────────────────────────────────────────────


def check_education_filter(
    candidate_education: dict | None,
    job_education_level_min: str | None,
    job_education_course_required: str | None,
    job_education_course_is_flexible: bool | None,
) -> bool:
    """
    Verifica se o candidato atende aos requisitos de formação da vaga.
    Retorna True se passar no filtro (ou se a vaga não tiver requisito).
    """
    # Se a vaga não exige nada, passa
    if not job_education_level_min and not job_education_course_required:
        return True

    candidate_level = None
    candidate_course = None
    if candidate_education:
        candidate_level = candidate_education.get("level")
        candidate_course = candidate_education.get("course", "").lower() if candidate_education.get("course") else None

    # 1. Nível mínimo de educação
    if job_education_level_min:
        score = _education_level_score(candidate_level, job_education_level_min)
        if score < 1.0:
            return False

    # 2. Curso exigido
    if job_education_course_required and candidate_course:
        required = job_education_course_required.lower()
        is_flexible = job_education_course_is_flexible if job_education_course_is_flexible is not None else True

        if required not in candidate_course:
            # Se não é flexível, reprova
            if not is_flexible:
                return False
            # Se é flexível, passa com ressalva (mas ainda passa)

    return True


# ─── Filtro 2: Localização ───────────────────────────────────────────────────


async def check_location_filter(
    candidate_postal_code: str | None,
    job_postal_code: str | None,
    job_acceptance_radius_km: float | None,
    job_work_model: str | None,
) -> bool:
    """
    Verifica se o candidato está dentro do raio de aceitação da vaga.
    Vagas remotas pulam o filtro.
    Retorna True se passar (ou se não houver dados suficientes).
    """
    # Vagas remotas pulam o filtro
    if job_work_model and job_work_model.lower() == "remoto":
        return True

    # Se a vaga não tem CEP ou raio, pula
    if not job_postal_code or not job_acceptance_radius_km:
        return True

    # Se o candidato não tem CEP, passa com ressalva
    if not candidate_postal_code:
        return True

    try:
        from services.geocode_service import distance_km

        dist = await distance_km(candidate_postal_code, job_postal_code)
        if dist is None:
            # Não conseguiu geocodificar — passa (soft fail)
            return True

        return dist <= job_acceptance_radius_km

    except Exception as exc:
        logger.warning("location filter error: %s", exc)
        return True  # soft fail


# ─── Filtro 3: Hard Skills ───────────────────────────────────────────────────


def check_hard_skills_filter(
    candidate_hard_skills: list | None,
    job_hard_skills_required: list | None,
    job_hard_skills_min_match: int | None,
) -> bool:
    """
    Verifica se o candidato atende ao mínimo de hard skills exigido.
    Retorna True se passar (ou se não houver requisito).
    """
    if not job_hard_skills_required or len(job_hard_skills_required) == 0:
        return True

    if not candidate_hard_skills or len(candidate_hard_skills) == 0:
        return False  # vaga exige skills, candidato não tem nenhuma

    # Normalizar pra lower case
    job_skills = {s.lower() for s in job_hard_skills_required if isinstance(s, str)}
    candidate_skills = {s.lower() for s in candidate_hard_skills if isinstance(s, str)}

    if not job_skills:
        return True

    match_count = len(job_skills & candidate_skills)
    match_pct = (match_count / len(job_skills)) * 100

    min_pct = job_hard_skills_min_match if job_hard_skills_min_match is not None else 50
    return match_pct >= min_pct


# ─── OCEAN (original) ────────────────────────────────────────────────────────


def compute_ocean_similarity(candidate_scores: dict, job_ideal: dict) -> float:
    """
    Compute OCEAN similarity between a candidate profile and a job ideal.

    Accepts flexible key formats (full names or single-letter shorthands o/c/e/a/n)
    and value ranges (0-1 or 0-100). Missing dimensions default to 0.5.

    Returns:
        Similarity in [0, 1]; higher is a better match.
    """
    c = _expand_and_normalize(candidate_scores)
    j = _expand_and_normalize(job_ideal)

    weighted_sq_sum = sum(_WEIGHTS[d] * (c[d] - j[d]) ** 2 for d in OCEAN_DIMS)
    rms_distance = math.sqrt(weighted_sq_sum / _TOTAL_WEIGHT)
    rms_distance = min(rms_distance, 1.0)

    return round(1.0 - rms_distance, 4)


def compute_ocean_breakdown(candidate_scores: dict, job_ideal: dict) -> dict[str, float]:
    """Per-dimension similarity in [0, 100] range."""
    c = _expand_and_normalize(candidate_scores)
    j = _expand_and_normalize(job_ideal)
    return {
        dim: round((1.0 - abs(c[dim] - j[dim])) * 100.0, 2)
        for dim in OCEAN_DIMS
    }


async def _call_ml_service(candidate_scores: dict, job_ideal: dict) -> Optional[dict]:
    """POST to /match on the ML microservice. Returns None on any error."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{ML_SERVICE_URL}/match",
                json={
                    "candidate_ocean": candidate_scores,
                    "company_ideal": job_ideal,
                },
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception as exc:
        logger.warning("ML service unavailable, using local fallback: %s", exc)
    return None


async def compute_match_score(
    candidate_scores: dict,
    job_ideal: dict,
) -> tuple[float, dict[str, float]]:
    """
    Compute (score, breakdown) using ML service when available, local fallback otherwise.

    Returns:
        score: float in [0, 1]
        breakdown: dict[dimension, float] in [0, 100]
    """
    result = await _call_ml_service(candidate_scores, job_ideal)
    if result is not None:
        score = result["score"] / 100.0
        breakdown = result.get("breakdown", {})
        return round(score, 4), breakdown

    score = compute_ocean_similarity(candidate_scores, job_ideal)
    breakdown = compute_ocean_breakdown(candidate_scores, job_ideal)
    return score, breakdown
