"""Add accommodations column to candidates table for accessibility preferences."""
# pylint: disable=invalid-name, redefined-builtin

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade() -> None:
    op.add_column(
        "candidates",
        sa.Column("accommodations", postgresql.JSON, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("candidates", "accommodations")
