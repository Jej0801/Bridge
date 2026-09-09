# Bridge Code Review Service

A standalone async backend that adds AI-powered code review to the Bridge
app. It runs alongside your existing Supabase backend rather than
replacing it — the Expo app calls Supabase for auth/data as usual, and
calls this service specifically to kick off and fetch code reviews.

## Stack

- **FastAPI** — async HTTP API
- **SQLAlchemy 2.0** (async, `Mapped`/`mapped_column` style) — ORM
- **PostgreSQL** + **Alembic** — versioned schema migrations
- **Pydantic v2** — settings and the 3-tier health check response models
- **Docker Compose** — local orchestration (API + Postgres)
- **Maven / Gradle + Checkstyle / PMD / SpotBugs** — Java static analysis,
  shelled out to from `app/services/java_analysis.py`

## Schema

`users` → `repos` → `pull_requests` → `reviews` (each review stores an
AI-generated summary plus a JSONB blob of static-analysis findings).

## Health checks (Kubernetes-ready)

- `GET /health/live` — process is alive (no dependency checks)
- `GET /health/ready` — DB + workspace dir reachable, pod can take traffic
- `GET /health/startup` — migrations applied + workspace initialized

## Running locally

```bash
docker compose up --build
```

This builds the image (Python + JDK 17 + Maven + Gradle), runs
`alembic upgrade head`, then starts the API on `localhost:8000`.

## Triggering a review

```
POST /reviews          { "pull_request_id": "<uuid>" }
GET  /reviews/{id}      -> status, ai_summary, static_analysis_results
GET  /reviews?pull_request_id=<uuid>
```

Review execution runs as a FastAPI background task: it detects whether
the checked-out PR uses Maven or Gradle, runs Checkstyle/PMD/SpotBugs
concurrently, parses each tool's XML report, and writes the combined
findings onto the `Review` row.

## Wiring into the Expo app

From `src/lib/`, add a thin client (mirroring how Supabase is called)
pointed at this service's base URL, and call `POST /reviews` when a PR
is opened, polling `GET /reviews/{id}` until `status == "completed"`.
