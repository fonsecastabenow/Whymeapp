import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from models.company import Company

router = APIRouter(prefix="/companies", tags=["companies"])


class CompanyOut(BaseModel):
    id: str
    user_id: str
    name: str
    description: str | None
    industry: str | None
    created_at: str


@router.get("/{company_id}", response_model=CompanyOut)
async def get_company(
    company_id: str,
    session: AsyncSession = Depends(get_session),
):
    try:
        company_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid company_id format",
        )

    result = await session.execute(
        select(Company).where(Company.id == company_uuid)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    return CompanyOut(
        id=str(company.id),
        user_id=str(company.user_id),
        name=company.name,
        description=company.description,
        industry=company.industry,
        created_at=company.created_at.isoformat(),
    )
