import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from models.candidate import Candidate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/candidates", tags=["accessibility"])


# --- Request/Response Models ---


class AccommodationsModel(BaseModel):
    visual: bool = False
    auditory: bool = False
    motor: bool = False
    cognitive: bool = False
    large_text: bool = False
    high_contrast: bool = False
    reduced_animations: bool = False
    extra_time: bool = False


class AccommodationsResponse(BaseModel):
    candidate_id: str
    accommodations: AccommodationsModel | None


class UpdateAccommodationsRequest(BaseModel):
    accommodations: AccommodationsModel


# --- Endpoints ---


@router.get("/{candidate_id}/accommodations", response_model=AccommodationsResponse)
async def get_accommodations(
    candidate_id: str,
    session: AsyncSession = Depends(get_session),
):
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid candidate_id format",
        )

    result = await session.execute(select(Candidate).where(Candidate.id == cand_uuid))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    opts = candidate.accommodations or {}
    accommodations = AccommodationsModel(**opts) if opts else None

    return AccommodationsResponse(
        candidate_id=str(candidate.id),
        accommodations=accommodations,
    )


@router.patch("/{candidate_id}/accommodations", response_model=AccommodationsResponse)
async def update_accommodations(
    candidate_id: str,
    request: UpdateAccommodationsRequest,
    session: AsyncSession = Depends(get_session),
):
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid candidate_id format",
        )

    result = await session.execute(select(Candidate).where(Candidate.id == cand_uuid))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    candidate.accommodations = request.accommodations.model_dump()
    await session.flush()
    await session.refresh(candidate)

    return AccommodationsResponse(
        candidate_id=str(candidate.id),
        accommodations=request.accommodations,
    )
