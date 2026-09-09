"""initial schema: users, repos, pull_requests, reviews

Revision ID: 0001
Revises:
Create Date: 2026-08-16

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("supabase_user_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("display_name", sa.String(120), nullable=True),
        sa.Column("github_username", sa.String(120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_supabase_user_id", "users", ["supabase_user_id"])
    op.create_index("ix_users_email", "users", ["email"])

    build_system_enum = postgresql.ENUM("maven", "gradle", "unknown", name="buildsystem")
    op.create_table(
        "repos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("clone_url", sa.String(500), nullable=False),
        sa.Column("default_branch", sa.String(120), nullable=False, server_default="main"),
        sa.Column("build_system", build_system_enum, nullable=False, server_default="unknown"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_repos_owner_id", "repos", ["owner_id"])
    op.create_index("ix_repos_full_name", "repos", ["full_name"])

    pr_status_enum = postgresql.ENUM("open", "merged", "closed", name="pullrequeststatus")
    op.create_table(
        "pull_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("repo_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("repos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("number", sa.Integer, nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("source_branch", sa.String(255), nullable=False),
        sa.Column("target_branch", sa.String(255), nullable=False),
        sa.Column("head_sha", sa.String(40), nullable=False),
        sa.Column("status", pr_status_enum, nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_pull_requests_repo_id", "pull_requests", ["repo_id"])

    review_status_enum = postgresql.ENUM("pending", "running", "completed", "failed", name="reviewstatus")
    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("pull_request_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pull_requests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", review_status_enum, nullable=False, server_default="pending"),
        sa.Column("ai_summary", sa.Text, nullable=True),
        sa.Column("static_analysis_results", postgresql.JSONB, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_reviews_pull_request_id", "reviews", ["pull_request_id"])


def downgrade() -> None:
    op.drop_table("reviews")
    op.execute("DROP TYPE IF EXISTS reviewstatus")
    op.drop_table("pull_requests")
    op.execute("DROP TYPE IF EXISTS pullrequeststatus")
    op.drop_table("repos")
    op.execute("DROP TYPE IF EXISTS buildsystem")
    op.drop_table("users")
