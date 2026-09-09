import os

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, check_db_connection
from app.schemas.health import (
    LivenessResponse,
    ReadinessResponse,
    ReadinessCheck,
    StartupResponse,
)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live", response_model=LivenessResponse)
async def liveness() -> LivenessResponse:
    """k8s livenessProbe target. Always cheap, never touches the DB."""
    return LivenessResponse()


@router.get("/ready", response_model=ReadinessResponse)
async def readiness() -> ReadinessResponse:
    """k8s readinessProbe target. Verifies dependencies are reachable."""
    checks: list[ReadinessCheck] = []

    db_ok = await check_db_connection()
    checks.append(ReadinessCheck(name="database", healthy=db_ok, detail=None if db_ok else "cannot reach Postgres"))

    workspace_ok = os.path.isdir(settings.WORKSPACE_DIR) and os.access(settings.WORKSPACE_DIR, os.W_OK)
    checks.append(
        ReadinessCheck(
            name="workspace_dir",
            healthy=workspace_ok,
            detail=None if workspace_ok else f"{settings.WORKSPACE_DIR} missing or not writable",
        )
    )

    overall = "ready" if all(c.healthy for c in checks) else "not_ready"
    return ReadinessResponse(status=overall, checks=checks)


@router.get("/startup", response_model=StartupResponse)
async def startup() -> StartupResponse:
    """k8s startupProbe target. Confirms one-time init has completed."""
    migrations_applied = False
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version_num FROM alembic_version"))
            migrations_applied = result.first() is not None
    except Exception:
        migrations_applied = False

    workspace_ready = os.path.isdir(settings.WORKSPACE_DIR)
    if not workspace_ready:
        try:
            os.makedirs(settings.WORKSPACE_DIR, exist_ok=True)
            workspace_ready = True
        except OSError:
            workspace_ready = False

    started = migrations_applied and workspace_ready
    return StartupResponse(
        status="started" if started else "starting",
        migrations_applied=migrations_applied,
        workspace_ready=workspace_ready,
        detail="" if started else "waiting on migrations and/or workspace directory",
    )
