import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from models.company import Company
from models.job import Job

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobOut(BaseModel):
    id: str
    company_id: str
    company_name: Optional[str] = None
    company_industry: Optional[str] = None
    title: str
    description: Optional[str]
    status: str
    ocean_ideal: Optional[dict]
    hard_skills_required: Optional[list]
    education_level_min: Optional[str]
    experience_years_min: Optional[int]
    work_model: Optional[str]
    salary_min: Optional[float]
    salary_max: Optional[float]
    location: Optional[str]
    created_at: str


class JobCreate(BaseModel):
    company_id: str
    title: str
    description: Optional[str] = None
    ocean_ideal: Optional[dict] = None
    hard_skills_required: Optional[list[str]] = None
    education_level_min: Optional[str] = None
    experience_years_min: Optional[int] = None
    work_model: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    location: Optional[str] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    ocean_ideal: Optional[dict] = None
    hard_skills_required: Optional[list[str]] = None
    education_level_min: Optional[str] = None
    experience_years_min: Optional[int] = None
    work_model: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    location: Optional[str] = None


class JobStatusUpdate(BaseModel):
    status: str


def _job_to_out(j: Job, company: Company | None = None) -> JobOut:
    return JobOut(
        id=str(j.id),
        company_id=str(j.company_id),
        company_name=company.name if company else None,
        company_industry=company.industry if company else None,
        title=j.title,
        description=j.description,
        status=j.status,
        ocean_ideal=j.ocean_ideal,
        hard_skills_required=j.hard_skills_required,
        education_level_min=j.education_level_min,
        experience_years_min=j.experience_years_min,
        work_model=j.work_model,
        salary_min=float(j.salary_min) if j.salary_min is not None else None,
        salary_max=float(j.salary_max) if j.salary_max is not None else None,
        location=j.location,
        created_at=j.created_at.isoformat(),
    )


def _parse_uuid(value: str, field: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid {field} format",
        )


@router.get("", response_model=list[JobOut])
async def list_public_jobs(
    session: AsyncSession = Depends(get_session),
):
    """List all active jobs publicly (no auth needed)."""
    result = await session.execute(
        select(Job, Company)
        .join(Company, Job.company_id == Company.id)
        .where(Job.status == "active")
        .order_by(Job.created_at.desc())
    )
    rows = result.all()
    return [_job_to_out(j, c) for j, c in rows]


@router.get("/company/{company_id}", response_model=list[JobOut])
async def list_jobs_for_company(
    company_id: str,
    session: AsyncSession = Depends(get_session),
):
    company_uuid = _parse_uuid(company_id, "company_id")
    result = await session.execute(
        select(Job, Company)
        .join(Company, Job.company_id == Company.id)
        .where(Job.company_id == company_uuid)
        .order_by(Job.created_at.desc())
    )
    rows = result.all()
    return [_job_to_out(j, c) for j, c in rows]


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
async def create_job(
    body: JobCreate,
    session: AsyncSession = Depends(get_session),
):
    company_uuid = _parse_uuid(body.company_id, "company_id")
    job = Job(
        company_id=company_uuid,
        title=body.title,
        description=body.description,
        ocean_ideal=body.ocean_ideal,
        hard_skills_required=body.hard_skills_required,
        education_level_min=body.education_level_min,
        experience_years_min=body.experience_years_min,
        work_model=body.work_model,
        salary_min=body.salary_min,
        salary_max=body.salary_max,
        location=body.location,
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)
    return _job_to_out(job)


@router.get("/{job_id}", response_model=JobOut)
async def get_job(
    job_id: str,
    session: AsyncSession = Depends(get_session),
):
    job_uuid = _parse_uuid(job_id, "job_id")
    result = await session.execute(select(Job).where(Job.id == job_uuid))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return _job_to_out(job)


@router.put("/{job_id}", response_model=JobOut)
async def update_job(
    job_id: str,
    body: JobUpdate,
    session: AsyncSession = Depends(get_session),
):
    job_uuid = _parse_uuid(job_id, "job_id")
    result = await session.execute(select(Job).where(Job.id == job_uuid))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if body.title is not None:
        job.title = body.title
    if body.description is not None:
        job.description = body.description
    if body.ocean_ideal is not None:
        job.ocean_ideal = body.ocean_ideal
    if body.hard_skills_required is not None:
        job.hard_skills_required = body.hard_skills_required
    if body.education_level_min is not None:
        job.education_level_min = body.education_level_min
    if body.experience_years_min is not None:
        job.experience_years_min = body.experience_years_min
    if body.work_model is not None:
        job.work_model = body.work_model
    if body.salary_min is not None:
        job.salary_min = body.salary_min
    if body.salary_max is not None:
        job.salary_max = body.salary_max
    if body.location is not None:
        job.location = body.location
    await session.commit()
    await session.refresh(job)
    return _job_to_out(job)


@router.patch("/{job_id}/status", response_model=JobOut)
async def update_job_status(
    job_id: str,
    body: JobStatusUpdate,
    session: AsyncSession = Depends(get_session),
):
    if body.status not in ("active", "draft"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="status must be 'active' or 'draft'",
        )
    job_uuid = _parse_uuid(job_id, "job_id")
    result = await session.execute(select(Job).where(Job.id == job_uuid))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    job.status = body.status
    await session.commit()
    await session.refresh(job)
    return _job_to_out(job)
