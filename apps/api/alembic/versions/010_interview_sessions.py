"""Add interview_sessions table for Telegram OCEAN interview flow."""
revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade() -> None:
    op.create_table(
        "interview_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("candidate_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token", sa.String(64), nullable=False, unique=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("current_question", sa.Integer, nullable=False, server_default="0"),
        sa.Column("answers", postgresql.JSONB, nullable=True, server_default=sa.text("'[]'::jsonb")),
        sa.Column("telegram_chat_id", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_index("ix_interview_sessions_candidate", "interview_sessions", ["candidate_id"], if_not_exists=True)


def downgrade() -> None:
    op.drop_table("interview_sessions")
