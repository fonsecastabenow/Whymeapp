import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from models.candidate import Candidate
from models.company import Company
from models.job import Job
from models.match import Match

router = APIRouter(prefix="/candidates", tags=["reports"])

OCEAN_LABELS: dict[str, str] = {
    "openness": "Abertura",
    "conscientiousness": "Conscienciosidade",
    "extraversion": "Extroversão",
    "agreeableness": "Amabilidade",
    "neuroticism": "Neuroticismo",
}

OCEAN_COLORS: dict[str, str] = {
    "openness": "#3B82F6",
    "conscientiousness": "#22C55E",
    "extraversion": "#F97316",
    "agreeableness": "#A855F7",
    "neuroticism": "#EF4444",
}


def _score_color(score: float) -> str:
    if score >= 0.8:
        return "#10B981"
    if score >= 0.6:
        return "#3B82F6"
    if score >= 0.4:
        return "#F59E0B"
    return "#EF4444"


def _format_skills(skills: dict | None) -> str:
    """Format skills dict as inline tag-like badges."""
    if not skills:
        return "<span style='color:#9CA3AF;'>Nenhuma habilidade registrada</span>"
    if isinstance(skills, list):
        items = skills
    else:
        # Try common structures: dict of categories, or flat list
        items = []
        for val in skills.values():
            if isinstance(val, list):
                items.extend(val)
            elif isinstance(val, str):
                items.append(val)
        if not items:
            items = list(skills.keys())
    badges = "".join(
        f'<span style="display:inline-block;background:#F3F4F6;color:#374151;'
        f'border-radius:9999px;padding:2px 10px;font-size:12px;'
        f'margin:2px 4px 2px 0;white-space:nowrap;">{s}</span>'
        for s in items[:20]
    )
    return badges


def _build_html(
    candidate: Candidate,
    matches: list[tuple[Match, Job, Company]],
) -> str:
    """Generate a self-contained HTML document for PDF conversion."""

    now = datetime.now(timezone.utc)
    date_str = now.strftime("%d/%m/%Y")
    time_str = now.strftime("%H:%M")

    # Candidate info
    name = candidate.name or "—"
    headline = candidate.headline or ""
    location = candidate.location or ""
    exp_years = candidate.experience_years
    exp_str = f"{exp_years:.0f} anos" if exp_years is not None else ""
    skills_html = _format_skills(candidate.skills)

    # OCEAN bars
    ocean_scores = candidate.ocean_scores or {}
    ocean_bars_html = ""
    for key, label in OCEAN_LABELS.items():
        val = ocean_scores.get(key, 0)
        if isinstance(val, (int, float)):
            num_val = val if val <= 1 else val / 100.0
        else:
            num_val = 0.0
        pct = round(num_val * 100)
        color = OCEAN_COLORS.get(key, "#3B82F6")
        ocean_bars_html += f"""
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
            <span style="font-weight:600;color:#374151;">{label}</span>
            <span style="font-weight:700;color:#6B7280;">{pct}%</span>
          </div>
          <div style="height:14px;width:100%;overflow:hidden;border-radius:9999px;background:#E5E7EB;">
            <div style="height:100%;border-radius:9999px;width:{pct}%;background:{color};"></div>
          </div>
        </div>"""

    # Matches table
    matches_rows_html = ""
    if matches:
        for m, job, company in matches:
            score_pct = round((m.score or 0.0) * 100)
            sc_color = _score_color(m.score or 0.0)
            status_map = {
                "pending": "Pendente",
                "accepted": "Aceito",
                "rejected": "Rejeitado",
            }
            status_label = status_map.get(m.status, m.status)
            matches_rows_html += f"""
            <tr>
              <td style="padding:10px 8px;border-bottom:1px solid #E5E7EB;font-weight:600;">{company.name}</td>
              <td style="padding:10px 8px;border-bottom:1px solid #E5E7EB;color:#6B7280;">{job.title}</td>
              <td style="padding:10px 8px;border-bottom:1px solid #E5E7EB;text-align:right;">
                <span style="font-weight:700;color:{sc_color};">{score_pct}%</span>
              </td>
              <td style="padding:10px 8px;border-bottom:1px solid #E5E7EB;text-align:right;color:#6B7280;text-transform:capitalize;">{status_label}</td>
            </tr>"""
    else:
        matches_rows_html = """
        <tr>
          <td colspan="4" style="padding:32px;text-align:center;color:#9CA3AF;">
            Nenhum match encontrado até o momento.
          </td>
        </tr>"""

    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>
  @page {{
    margin: 32px 40px;
    @bottom-center {{
      content: "Gerado por Whyme — Página " counter(page);
      font-size: 10px;
      color: #9CA3AF;
    }}
  }}
  body {{
    font-family: 'Helvetica', 'Arial', sans-serif;
    color: #111827;
    margin: 0;
    padding: 0;
    font-size: 14px;
    line-height: 1.5;
  }}
  table {{ border-collapse: collapse; width: 100%; }}
  th {{ text-align: left; font-weight: 500; color: #6B7280; font-size: 13px; padding: 8px; border-bottom: 2px solid #D1D5DB; }}
  td {{ font-size: 13px; }}
</style>
</head>
<body>

  <!-- HEADER -->
  <div style="border-bottom:2px solid #E5E7EB;padding-bottom:20px;margin-bottom:28px;">
    <h1 style="font-size:26px;font-weight:700;margin:0 0 4px 0;color:#111827;">
      Whyme — Relatório de Compatibilidade
    </h1>
    <p style="margin:0;font-size:13px;color:#6B7280;">
      Gerado em {date_str} às {time_str}
    </p>
  </div>

  <!-- CANDIDATE DATA -->
  <div style="margin-bottom:28px;">
    <h2 style="font-size:18px;font-weight:600;margin:0 0 12px 0;color:#111827;">{name}</h2>
    <table style="width:100%;font-size:13px;">
      <tr>
        {f'<td style="width:50%;vertical-align:top;padding-right:16px;"><span style="font-weight:500;color:#6B7280;">Cargo:</span><p style="margin:2px 0 0 0;">{headline}</p></td>' if headline else ''}
        {f'<td style="width:50%;vertical-align:top;"><span style="font-weight:500;color:#6B7280;">Localização:</span><p style="margin:2px 0 0 0;">{location}</p></td>' if location else ''}
      </tr>
      <tr>
        {f'<td style="width:50%;vertical-align:top;padding-right:16px;padding-top:8px;"><span style="font-weight:500;color:#6B7280;">Experiência:</span><p style="margin:2px 0 0 0;">{exp_str}</p></td>' if exp_str else ''}
      </tr>
    </table>
    <!-- Skills -->
    <div style="margin-top:12px;">
      <span style="font-weight:500;color:#6B7280;font-size:13px;">Habilidades:</span>
      <div style="margin-top:4px;">{skills_html}</div>
    </div>
  </div>

  <!-- OCEAN PROFILE -->
  <div style="margin-bottom:28px;">
    <h2 style="font-size:16px;font-weight:600;margin:0 0 12px 0;color:#111827;">Perfil OCEAN</h2>
    <div style="border:1px solid #E5E7EB;border-radius:12px;padding:20px;background:#F9FAFB;">
      {ocean_bars_html}
    </div>
  </div>

  <!-- MATCHES TABLE -->
  <div style="margin-bottom:20px;">
    <h2 style="font-size:16px;font-weight:600;margin:0 0 12px 0;color:#111827;">
      Matches Encontrados {'(' + str(len(matches)) + ')' if matches else ''}
    </h2>
    <table style="width:100%;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#F9FAFB;">
          <th>Empresa</th>
          <th>Vaga</th>
          <th style="text-align:right;">Compatibilidade</th>
          <th style="text-align:right;">Status</th>
        </tr>
      </thead>
      <tbody>
        {matches_rows_html}
      </tbody>
    </table>
  </div>

  <!-- FOOTER (spacer) -->
  <div style="margin-top:40px;border-top:1px solid #E5E7EB;padding-top:12px;text-align:center;font-size:11px;color:#9CA3AF;">
    <p style="margin:0 0 2px 0;">Whyme — Recrutamento por Valores</p>
    <p style="margin:0;">Este relatório é baseado no perfil OCEAN do candidato e nos matches ativos.</p>
  </div>

</body>
</html>"""
    return html


@router.get("/{candidate_id}/report/pdf")
async def generate_report_pdf(
    candidate_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Generate a PDF report for a candidate with OCEAN profile and matches."""
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid candidate_id format",
        )

    # Fetch candidate
    result = await session.execute(select(Candidate).where(Candidate.id == cand_uuid))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    # Fetch matches with job and company info
    matches_result = await session.execute(
        select(Match, Job, Company)
        .join(Job, Match.job_id == Job.id)
        .join(Company, Job.company_id == Company.id)
        .where(Match.candidate_id == cand_uuid)
        .order_by(Match.score.desc())
    )
    matches = matches_result.all()

    # Generate HTML
    html_content = _build_html(candidate, matches)

    # Convert to PDF
    try:
        from weasyprint import HTML as WeasyHTML

        pdf_bytes = WeasyHTML(string=html_content).write_pdf()
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF generation library (weasyprint) is not installed",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(exc)}",
        )

    filename = f"relatorio_{candidate_id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )
