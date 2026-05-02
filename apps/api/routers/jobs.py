import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from models.job import Job

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobOut(BaseModel):
    id: str
    company_id: str
    title: str
    description: Optional[str]
    status: str
    ocean_ideal: Optional[dict]
    created_at: str


class JobCreate(BaseModel):
    company_id: str
    title: str
    description: Optional[str] = None
    ocean_ideal: Optional[dict] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    ocean_ideal: Optional[dict] = None


class JobStatusUpdate(BaseModel):
    status: str


def _job_to_out(j: Job) -> JobOut:
    return JobOut(
        id=str(j.id),
        company_id=str(j.company_id),
        title=j.title,
        description=j.description,
        status=j.status,
        ocean_ideal=j.ocean_ideal,
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


@router.get("/company/{company_id}", response_model=list[JobOut])
async def list_jobs_for_company(
    company_id: str,
    session: AsyncSession = Depends(get_session),
):
    company_uuid = _parse_uuid(company_id, "company_id")
    result = await session.execute(
        select(Job).where(Job.company_id == company_uuid).order_by(Job.created_at.desc())
    )
    jobs = result.scalars().all()
    return [_job_to_out(j) for j in jobs]


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
