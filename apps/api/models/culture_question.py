import uuid

from sqlalchemy import Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class CultureQuestion(Base):
    __tablename__ = "culture_questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    question_pt: Mapped[str] = mapped_column(Text, nullable=False)
    question_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    dimension: Mapped[str] = mapped_column(String(30), nullable=False)
    direction: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    sort_order: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)

    def __repr__(self) -> str:
        return f"<CultureQuestion {self.dimension} dir={self.direction}>"
