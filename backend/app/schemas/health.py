from typing import Literal

from pydantic import BaseModel, Field


class LivenessResponse(BaseModel):
    """
    Tier 1 — Liveness: 'is the process alive at all?'
    No dependency checks here on purpose — k8s uses this to decide whether
    to restart the pod, so it must stay cheap and never block on the DB.
    """
    status: Literal["alive"] = "alive"


class ReadinessCheck(BaseModel):
    name: str
    healthy: bool
    detail: str | None = None


class ReadinessResponse(BaseModel):
    """
    Tier 2 — Readiness: 'can this pod currently serve traffic?'
    Checks live dependencies (DB, workspace disk). k8s pulls the pod out
    of the service's load-balancer rotation if this reports unhealthy.
    """
    status: Literal["ready", "not_ready"]
    checks: list[ReadinessCheck]


class StartupResponse(BaseModel):
    """
    Tier 3 — Startup: 'has initialization finished?'
    Covers slower one-time setup (pending migrations, workspace dir
    creation). k8s waits for this before liveness/readiness probes even
    start firing, so it protects slow-booting containers from being
    killed prematurely.
    """
    status: Literal["started", "starting"]
    migrations_applied: bool
    workspace_ready: bool
    detail: str = Field(default="")
