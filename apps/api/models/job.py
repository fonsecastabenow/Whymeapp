import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSON, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    ocean_ideal: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    hard_skills_required: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    education_level_min: Mapped[str | None] = mapped_column(String(100), nullable=True)
    education_course_required: Mapped[str | None] = mapped_column(String(255), nullable=True)
    education_course_is_flexible: Mapped[bool | None] = mapped_column(Boolean, nullable=True, default=True)
    hard_skills_min_match: Mapped[int | None] = mapped_column(Integer, nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    acceptance_radius_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    experience_years_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    work_model: Mapped[str | None] = mapped_column(String(50), nullable=True)
    salary_min: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    salary_max: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    company = relationship("Company", backref="jobs")

    def __repr__(self) -> str:
        return f"<Job {self.title} ({self.status})>"
