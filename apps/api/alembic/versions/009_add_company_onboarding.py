"""Add company onboarding fields, job matching fields, culture_questions table."""
revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade() -> None:
    # Extend companies
    op.add_column("companies", sa.Column("size", sa.String(50), nullable=True))
    op.add_column("companies", sa.Column("website", sa.String(512), nullable=True))
    op.add_column("companies", sa.Column("linkedin_url", sa.String(512), nullable=True))

    # Extend jobs with structured matching fields
    op.add_column("jobs", sa.Column("hard_skills_required", postgresql.JSONB, nullable=True, server_default=sa.text("'[]'::jsonb")))
    op.add_column("jobs", sa.Column("education_level_min", sa.String(100), nullable=True))
    op.add_column("jobs", sa.Column("experience_years_min", sa.Integer, nullable=True))
    op.add_column("jobs", sa.Column("work_model", sa.String(50), nullable=True))
    op.add_column("jobs", sa.Column("salary_min", sa.Numeric(12, 2), nullable=True))
    op.add_column("jobs", sa.Column("salary_max", sa.Numeric(12, 2), nullable=True))
    op.add_column("jobs", sa.Column("location", sa.String(255), nullable=True))

    # Culture questions table
    op.create_table(
        "culture_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("question_pt", sa.Text, nullable=False),
        sa.Column("question_en", sa.Text, nullable=True),
        sa.Column("dimension", sa.String(30), nullable=False),
        sa.Column("direction", sa.Integer, nullable=False, server_default="1"),
        sa.Column("sort_order", sa.Integer, nullable=True, server_default="0"),
    )

    op.execute("""
        INSERT INTO culture_questions (question_pt, dimension, direction, sort_order) VALUES
        ('Sua empresa incentiva a experimentação e novas ideias, mesmo que envolvam riscos?', 'openness', 1, 1),
        ('Na sua empresa, processos claros e prazos definidos são prioridade?', 'conscientiousness', 1, 2),
        ('O ambiente de trabalho é colaborativo e as pessoas interagem frequentemente?', 'extraversion', 1, 3),
        ('A empresa valoriza um ambiente harmonioso onde conflitos são evitados?', 'agreeableness', 1, 4),
        ('A pressão por resultados e a competitividade interna são características da sua empresa?', 'neuroticism', 1, 5),
        ('A liderança da empresa aceita mudanças de direção com facilidade?', 'openness', 1, 6),
        ('Existe um alto nível de autonomia e responsabilidade individual?', 'conscientiousness', 1, 7),
        ('Eventos sociais e integração entre equipes são comuns?', 'extraversion', 1, 8),
        ('A empresa prioriza o bem-estar dos funcionários acima de métricas agressivas?', 'agreeableness', -1, 9),
        ('O ritmo de trabalho é intenso e há cobrança constante por entregas?', 'neuroticism', -1, 10)
    """)


def downgrade() -> None:
    op.drop_table("culture_questions")
    op.drop_column("jobs", "location")
    op.drop_column("jobs", "salary_max")
    op.drop_column("jobs", "salary_min")
    op.drop_column("jobs", "work_model")
    op.drop_column("jobs", "experience_years_min")
    op.drop_column("jobs", "education_level_min")
    op.drop_column("jobs", "hard_skills_required")
    op.drop_column("companies", "linkedin_url")
    op.drop_column("companies", "website")
    op.drop_column("companies", "size")
