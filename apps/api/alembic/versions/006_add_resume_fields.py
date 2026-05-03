"""Add resume_url and resume_text columns to candidates table."""
# pylint: disable=invalid-name, redefined-builtin

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    op.add_column(
        "candidates",
        sa.Column("resume_url", sa.String(512), nullable=True),
    )
    op.add_column(
        "candidates",
        sa.Column("resume_text", sa.Text, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("candidates", "resume_text")
    op.drop_column("candidates", "resume_url")
