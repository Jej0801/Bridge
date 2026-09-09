"""add shared_content table

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-28

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    platform_enum = postgresql.ENUM("instagram", "tiktok", "unknown", name="sourceplatform")
    status_enum = postgresql.ENUM("pending", "enriched", "failed", name="sharestatus")

    op.create_table(
        "shared_content",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("original_url", sa.String(2048), nullable=False),
        sa.Column("platform", platform_enum, nullable=False, server_default="unknown"),
        sa.Column("status", status_enum, nullable=False, server_default="pending"),
        sa.Column("title", sa.String(500), nullable=True),
        sa.Column("author_name", sa.String(255), nullable=True),
        sa.Column("thumbnail_url", sa.String(2048), nullable=True),
        sa.Column("embed_html", sa.Text, nullable=True),
        sa.Column("raw_metadata", postgresql.JSONB, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("enriched_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_shared_content_user_id", "shared_content", ["user_id"])


def downgrade() -> None:
    op.drop_table("shared_content")
    op.execute("DROP TYPE IF EXISTS sharestatus")
    op.execute("DROP TYPE IF EXISTS sourceplatform")
