import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    headline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    experience_years: Mapped[float | None] = mapped_column(Float, nullable=True)
    skills: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ocean_scores: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    accommodations: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    resume_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    resume_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Onboarding fields
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    education: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    languages: Mapped[list | None] = mapped_column(JSON, nullable=True)
    hard_skills: Mapped[list | None] = mapped_column(JSON, nullable=True)
    city: Mapped[str | None] = mapped_column(String(255), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    salary_expectation: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    work_model: Mapped[str | None] = mapped_column(String(50), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    portfolio_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    professional_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = relationship("User", backref="candidate", uselist=False)

    def __repr__(self) -> str:
        return f"<Candidate {self.name}>"
