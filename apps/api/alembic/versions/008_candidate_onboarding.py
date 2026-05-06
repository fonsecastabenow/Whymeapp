"""Add candidate onboarding fields and reference tables."""
revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade() -> None:
    # Add columns to candidates
    op.add_column("candidates", sa.Column("phone", sa.String(30), nullable=True))
    op.add_column("candidates", sa.Column("education", postgresql.JSON, nullable=True))
    op.add_column("candidates", sa.Column("languages", postgresql.JSON, nullable=True))
    op.add_column("candidates", sa.Column("hard_skills", postgresql.JSON, nullable=True))
    op.add_column("candidates", sa.Column("city", sa.String(255), nullable=True))
    op.add_column("candidates", sa.Column("state", sa.String(100), nullable=True))
    op.add_column("candidates", sa.Column("country", sa.String(100), nullable=True))
    op.add_column("candidates", sa.Column("salary_expectation", postgresql.JSON, nullable=True))
    op.add_column("candidates", sa.Column("work_model", sa.String(50), nullable=True))
    op.add_column("candidates", sa.Column("linkedin_url", sa.String(512), nullable=True))
    op.add_column("candidates", sa.Column("portfolio_url", sa.String(512), nullable=True))
    op.add_column("candidates", sa.Column("professional_level", sa.String(50), nullable=True))
    op.add_column("candidates", sa.Column("onboarding_completed", sa.Boolean, server_default=sa.text("false"), nullable=False))

    # Create hard_skills_reference table
    op.create_table(
        "hard_skills_reference",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), unique=True, nullable=False),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # Create education_levels_reference table
    op.create_table(
        "education_levels_reference",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # Seed hard skills
    op.execute("""
        INSERT INTO hard_skills_reference (name, category) VALUES
        ('JavaScript', 'frontend'), ('TypeScript', 'frontend'), ('React', 'frontend'),
        ('Next.js', 'frontend'), ('Vue.js', 'frontend'), ('Angular', 'frontend'),
        ('HTML', 'frontend'), ('CSS', 'frontend'), ('Tailwind CSS', 'frontend'),
        ('SASS/SCSS', 'frontend'), ('Python', 'backend'), ('Node.js', 'backend'),
        ('Java', 'backend'), ('C#', 'backend'), ('Go', 'backend'), ('Rust', 'backend'),
        ('Ruby', 'backend'), ('PHP', 'backend'), ('Spring Boot', 'backend'),
        ('Django', 'backend'), ('FastAPI', 'backend'), ('Express.js', 'backend'),
        ('PostgreSQL', 'backend'), ('MySQL', 'backend'), ('MongoDB', 'backend'),
        ('Redis', 'backend'), ('GraphQL', 'backend'), ('REST API', 'backend'),
        ('Docker', 'devops'), ('Kubernetes', 'devops'), ('AWS', 'devops'),
        ('Azure', 'devops'), ('GCP', 'devops'), ('CI/CD', 'devops'),
        ('Terraform', 'devops'), ('Linux', 'devops'), ('Nginx', 'devops'),
        ('React Native', 'mobile'), ('Flutter', 'mobile'), ('Swift', 'mobile'),
        ('Kotlin', 'mobile'), ('SQL', 'data'), ('NoSQL', 'data'),
        ('Machine Learning', 'data'), ('Data Analysis', 'data'), ('Power BI', 'data'),
        ('Tableau', 'data'), ('Figma', 'design'), ('UI/UX Design', 'design'),
        ('Photoshop', 'design'), ('Git', 'devops'), ('Agile/Scrum', 'soft-skills'),
        ('Liderança', 'soft-skills'), ('Comunicação', 'soft-skills')
    """)

    # Seed education levels
    op.execute("""
        INSERT INTO education_levels_reference (name) VALUES
        ('Ensino Médio'), ('Técnico'), ('Graduação'),
        ('Pós-graduação'), ('Mestrado'), ('Doutorado')
    """)


def downgrade() -> None:
    op.drop_table("education_levels_reference")
    op.drop_table("hard_skills_reference")
    op.drop_column("candidates", "onboarding_completed")
    op.drop_column("candidates", "professional_level")
    op.drop_column("candidates", "portfolio_url")
    op.drop_column("candidates", "linkedin_url")
    op.drop_column("candidates", "work_model")
    op.drop_column("candidates", "salary_expectation")
    op.drop_column("candidates", "country")
    op.drop_column("candidates", "state")
    op.drop_column("candidates", "city")
    op.drop_column("candidates", "hard_skills")
    op.drop_column("candidates", "languages")
    op.drop_column("candidates", "education")
    op.drop_column("candidates", "phone")
