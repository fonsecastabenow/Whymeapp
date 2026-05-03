import logging
import uuid

import boto3
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_session
from models.candidate import Candidate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/candidates", tags=["resumes"])

ALLOWED_CONTENT_TYPES = {"application/pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


# --- Request/Response Models ---


class ResumeResponse(BaseModel):
    candidate_id: str
    resume_url: str | None
    resume_text: str | None


# --- R2 Helpers ---


def _get_r2_client():
    """Create a boto3 S3 client configured for Cloudflare R2."""
    endpoint_url = f"https://{settings.r2_account_id}.r2.cloudflarestorage.com"
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=settings.r2_access_key,
        aws_secret_access_key=settings.r2_secret_key,
        region_name="auto",
    )


def _r2_object_key(candidate_id: str, filename: str) -> str:
    """Generate the R2 object key for a candidate's resume."""
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "pdf"
    return f"resumes/{candidate_id}/resume.{ext}"


# --- PDF Parsing Helper ---


def _extract_pdf_text(file_bytes: bytes) -> str:
    """Extract text from a PDF file using pymupdf (fitz)."""
    try:
        import fitz  # pymupdf

        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_parts: list[str] = []
        for page in doc:
            text_parts.append(page.get_text())
        doc.close()
        return "\n".join(text_parts).strip()
    except Exception as exc:
        logger.warning("Failed to extract PDF text: %s", exc)
        return ""


# --- Endpoints ---


@router.post("/{candidate_id}/resume/upload", response_model=ResumeResponse)
async def upload_resume(
    candidate_id: str,
    file: UploadFile,
    session: AsyncSession = Depends(get_session),
):
    # Validate candidate_id
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid candidate_id format",
        )

    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only PDF files are allowed",
        )

    # Read file content
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File too large (max 10 MB)",
        )

    # Fetch candidate
    result = await session.execute(select(Candidate).where(Candidate.id == cand_uuid))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    # Upload to R2
    filename = file.filename or "resume.pdf"
    object_key = _r2_object_key(candidate_id, filename)

    try:
        r2 = _get_r2_client()
        r2.put_object(
            Bucket=settings.r2_bucket_name,
            Key=object_key,
            Body=file_bytes,
            ContentType=file.content_type,
        )
    except Exception as exc:
        logger.error("Failed to upload to R2: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to upload file to storage",
        )

    # Generate public URL
    resume_url = f"https://{settings.r2_bucket_name}.{settings.r2_account_id}.r2.cloudflarestorage.com/{object_key}"

    # Extract text from PDF
    resume_text = _extract_pdf_text(file_bytes)

    # Save to database
    candidate.resume_url = resume_url
    candidate.resume_text = resume_text
    await session.flush()
    await session.refresh(candidate)

    return ResumeResponse(
        candidate_id=str(candidate.id),
        resume_url=candidate.resume_url,
        resume_text=candidate.resume_text,
    )


@router.get("/{candidate_id}/resume", response_model=ResumeResponse)
async def get_resume(
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

    return ResumeResponse(
        candidate_id=str(candidate.id),
        resume_url=candidate.resume_url,
        resume_text=candidate.resume_text,
    )


@router.delete("/{candidate_id}/resume", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
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

    # Delete from R2 if we have a URL
    if candidate.resume_url:
        try:
            # Extract object key from URL
            object_key = candidate.resume_url.split(
                f"{settings.r2_account_id}.r2.cloudflarestorage.com/"
            )[-1]
            r2 = _get_r2_client()
            r2.delete_object(Bucket=settings.r2_bucket_name, Key=object_key)
        except Exception as exc:
            logger.warning("Failed to delete resume from R2: %s", exc)
            # Don't fail — just log and clear DB fields

    # Clear database fields
    candidate.resume_url = None
    candidate.resume_text = None
    await session.flush()
