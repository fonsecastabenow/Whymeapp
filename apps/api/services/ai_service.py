import json
import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_API_BASE = "https://api.deepseek.com/v1"
DEFAULT_MODEL = "deepseek-chat"

SYSTEM_CULTURE_PROMPT = """Você é um especialista em cultura organizacional e psicologia OCEAN (Big Five).

Seu objetivo é entrevistar o fundador/gestor de uma empresa para entender a cultura organizacional dela.
Você faz perguntas abertas e naturais, uma de cada vez.

Seu objetivo final é gerar:
1. Um **culture_vector** OCEAN (5 dimensões normalizadas 0-1) representando a cultura da empresa
   - O = Abertura a mudanças (inovação, criatividade, experimentação)
   - C = Conscienciosidade (organização, planejamento, processos)
   - E = Extroversão (comunicação, colaboração, energia social)
   - A = Amabilidade (cooperação, empatia, harmonia)
   - N = Neuroticismo (aversão a risco, estabilidade emocional)
2. Um **resumo cultural** (2-3 frases) descrevendo a empresa

REGRAS:
- Faça perguntas curtas, diretas e em português
- Limite a no máximo 5-6 perguntas no total
- Após respostas suficientes, retorne APENAS um JSON no formato:
  {"done": true, "culture_vector": {"o": 0.XX, "c": 0.XX, "e": 0.XX, "a": 0.XX, "n": 0.XX}, "summary": "Resumo da cultura"}
- Se ainda precisar de mais informações, retorne:
  {"done": false, "question": "Sua próxima pergunta aqui"}
- Não repita perguntas já feitas
- Adapte as perguntas ao setor/indústria da empresa
- Valores OCEAN devem ser entre 0 e 1, com 2 casas decimais
- Um N (neuroticismo) baixo (ex: 0.2) indica ambiente estável e seguro
- Um N alto (ex: 0.8) indica ambiente estressante e de alta pressão"""

SYSTEM_JOB_PROMPT = """Você é um especialista em recrutamento e seleção, especializado em matching por perfil OCEAN (Big Five).

Você recebe:
- O **vetor cultural da empresa** (culture_vector) — representando a cultura organizacional
- O **resumo da cultura** da empresa
- O **título da vaga**
- A **descrição da vaga**

Com base nessas informações, você deve sugerir o **perfil OCEAN ideal** para essa vaga, considerando:
1. A cultura da empresa (a vaga deve ser compatível com quem já trabalha lá)
2. As melhores práticas de mercado para aquele cargo/função
3. O que a literatura de psicologia organizacional diz sobre perfis de sucesso para cada tipo de vaga

REGRAS:
- Valores OCEAN devem ser entre 0 e 1, com 2 casas decimais
- Considere que o candidato ideal deve ter um perfil que se adapte bem à cultura existente
- Uma venda B2B agressiva pede E alto, uma vaga de análise de dados pede O médio e C alto
- Retorne APENAS um JSON no formato:
  {"o": 0.XX, "c": 0.XX, "e": 0.XX, "a": 0.XX, "n": 0.XX, "justificativa": "Explicação curta do perfil sugerido"}
- A justificativa deve ser em português, 1-2 frases
- NUNCA retorne nada além do JSON"""


async def ask_deepseek(
    messages: list[dict],
    system: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> str:
    """Call Deepseek API with the given messages."""
    if not DEEPSEEK_API_KEY:
        raise ValueError("DEEPSEEK_API_KEY not configured")

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }

    payload: dict = {
        "model": DEFAULT_MODEL,
        "messages": [],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    if system:
        payload["messages"].append({"role": "system", "content": system})

    payload["messages"].extend(messages)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{DEEPSEEK_API_BASE}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            logger.debug("Deepseek response: %s", content[:200])
            return content
    except httpx.HTTPStatusError as e:
        logger.error("Deepseek HTTP error: %s - %s", e.response.status_code, e.response.text)
        raise
    except Exception as e:
        logger.error("Deepseek error: %s", str(e))
        raise


async def start_culture_interview(
    company_name: str,
    industry: Optional[str] = None,
    description: Optional[str] = None,
) -> dict:
    """Start the culture interview. Returns the first question."""
    context = f"Empresa: {company_name}"
    if industry:
        context += f"\nSetor/Indústria: {industry}"
    if description:
        context += f"\nDescrição: {description}"

    user_msg = (
        f"Inicie a entrevista de cultura para a seguinte empresa:\n\n{context}\n\n"
        "Faça a primeira pergunta para conhecer a cultura organizacional."
    )

    content = await ask_deepseek(
        messages=[{"role": "user", "content": user_msg}],
        system=SYSTEM_CULTURE_PROMPT,
        temperature=0.7,
    )

    try:
        result = json.loads(content)
        return result
    except json.JSONDecodeError:
        return {"done": False, "question": content}


async def continue_culture_interview(
    history: list[dict],
    company_name: str,
    industry: Optional[str] = None,
    description: Optional[str] = None,
) -> dict:
    """Continue the interview with the user's last answer."""
    context = f"Empresa: {company_name}"
    if industry:
        context += f"\nSetor: {industry}"
    if description:
        context += f"\nDescrição: {description}"

    messages = [
        {
            "role": "user",
            "content": (
                f"Contexto da empresa:\n{context}\n\n"
                "Conduza a entrevista de cultura. "
                "Faça perguntas e, quando tiver informações suficientes, retorne o JSON final."
            ),
        }
    ]
    messages.extend(history)

    content = await ask_deepseek(
        messages=messages,
        system=SYSTEM_CULTURE_PROMPT,
        temperature=0.7,
    )

    try:
        result = json.loads(content)
        return result
    except json.JSONDecodeError:
        return {"done": False, "question": content}


async def suggest_ocean_profile(
    culture_vector: dict,
    culture_summary: str,
    job_title: str,
    job_description: str,
) -> dict:
    """Suggest the ideal OCEAN profile for a job based on company culture."""
    user_msg = (
        f"Cultura da empresa (culture_vector): {json.dumps(culture_vector)}\n"
        f"Resumo da cultura: {culture_summary}\n\n"
        f"Vaga: {job_title}\n"
        f"Descrição: {job_description}\n\n"
        "Sugira o perfil OCEAN ideal para esta vaga."
    )

    content = await ask_deepseek(
        messages=[{"role": "user", "content": user_msg}],
        system=SYSTEM_JOB_PROMPT,
        temperature=0.3,
        max_tokens=512,
    )

    try:
        result = json.loads(content)
        return result
    except json.JSONDecodeError:
        logger.error("Failed to parse Deepseek suggestion: %s", content)
        return {"error": "Falha ao processar sugestão da IA"}
