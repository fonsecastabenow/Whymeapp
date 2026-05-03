import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_session
from models.company import Company
from models.user import User

router = APIRouter(prefix="/companies", tags=["companies"])


class CompanyOut(BaseModel):
    id: str
    user_id: str
    name: str
    description: str | None
    industry: str | None
    culture_vector: str | None
    created_at: str


class CompanyUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    industry: str | None = None
    culture_vector: str | None = None


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
        culture_vector=company.culture_vector,
        created_at=company.created_at.isoformat(),
    )


@router.patch("/{company_id}", response_model=CompanyOut)
async def update_company(
    company_id: str,
    body: CompanyUpdateRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
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

    if company.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this company",
        )

    if body.name is not None:
        company.name = body.name
    if body.description is not None:
        company.description = body.description
    if body.industry is not None:
        company.industry = body.industry
    if body.culture_vector is not None:
        company.culture_vector = body.culture_vector

    await session.commit()
    await session.refresh(company)

    return CompanyOut(
        id=str(company.id),
        user_id=str(company.user_id),
        name=company.name,
        description=company.description,
        industry=company.industry,
        culture_vector=company.culture_vector,
        created_at=company.created_at.isoformat(),
    )
