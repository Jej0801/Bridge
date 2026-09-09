# Python Backend Integration Guide

This document explains the Python FastAPI backend integration for the Bridge share intent pipeline, which combines oEmbed metadata fetching with AI-powered spot extraction.

---

## Overview

The **hybrid share intent pipeline** works in 5 stages:

```
User shares TikTok/Instagram → Bridge app
    ↓
1. METADATA: Python backend fetches oEmbed (title, author, thumbnail)
    ↓
2. AI EXTRACTION: Claude/OpenAI extracts structured spot data
    ↓
3. ENRICHMENT: Tavily web search for missing details (optional)
    ↓
4. GEOCODING: Google Maps converts address to coordinates
    ↓
5. SAVING: Combined data saved to Supabase
```

### Benefits of This Approach

- ✅ **Secure oEmbed fetching** - Instagram/TikTok tokens stay server-side
- ✅ **Better metadata** - Official APIs provide accurate thumbnails, titles, authors
- ✅ **Graceful degradation** - If backend fails, AI extraction still works
- ✅ **Database persistence** - Shared content tracked in PostgreSQL
- ✅ **Background processing** - oEmbed fetching doesn't block UI
- ✅ **Future-proof** - Can add more backend features (caching, rate limiting, etc.)

---

## Architecture

### Stack

**Backend:**
- FastAPI 0.115.0 (async Python web framework)
- SQLAlchemy 2.0 (async ORM)
- PostgreSQL 16 (database)
- Alembic (migrations)
- HTTPX (HTTP client for oEmbed APIs)
- Docker + Docker Compose (deployment)

**Frontend Integration:**
- `src/lib/shareService.ts` - HTTP client for Python backend
- `src/store/shareStore.ts` - Zustand store (optional, not currently used)
- `app/share-intent.tsx` - Hybrid processing screen

### Data Flow

```typescript
// 1. React Native calls Python backend
const created = await submitSharedLink(userId, url);

// 2. Python backend:
//    - Detects platform (TikTok/Instagram)
//    - Saves to DB with status="pending"
//    - Spawns background task to call oEmbed API
//    - Returns immediately

// 3. React Native polls for completion
const enriched = await waitForEnrichment(created.id);
// enriched = { title, author_name, thumbnail_url, embed_html, ... }

// 4. React Native uses enriched data for AI extraction
const aiResult = await extractSpotFromCaption(
  enriched.title || url,
  platform,
  url
);

// 5. Combined result saved to Supabase
```

---

## Setup Instructions

### Step 1: Backend Environment Variables

Create `backend/.env`:

```bash
# Database (local development)
DATABASE_URL=postgresql+asyncpg://bridge:bridge@db:5432/bridge_reviews

# CORS (allow requests from Expo)
CORS_ORIGINS=*

# Instagram oEmbed (required for Instagram share intent)
# Get from: https://developers.facebook.com/apps/
INSTAGRAM_ACCESS_TOKEN=your-meta-app-access-token

# Workspace directory (for code review features - not used by share intent)
WORKSPACE_DIR=/tmp/bridge-workspaces

# Environment
ENV=development
```

**How to get Instagram Access Token:**

1. Go to https://developers.facebook.com/apps/
2. Create a new app (type: Business)
3. Add "Instagram Basic Display" product
4. Generate an access token
5. Copy the token to `.env`

**Note:** TikTok oEmbed is public and requires no token.

### Step 2: Start the Backend

**Option A: Docker Compose (Recommended)**

```bash
cd backend
docker compose up --build
```

This will:
- Build the Docker image (Python + PostgreSQL)
- Run Alembic migrations
- Start the API on `http://localhost:8000`

**Option B: Local Python (Development)**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Verify backend is running:**

```bash
curl http://localhost:8000/
# Should return: {"service":"Bridge Code Review Service","status":"running"}

curl http://localhost:8000/health/ready
# Should return: {"status":"healthy", ...}
```

### Step 3: React Native Environment Variables

Add to `.env`:

```bash
# Python backend URL
EXPO_PUBLIC_REVIEW_SERVICE_URL=http://localhost:8000

# Instagram token (same as backend)
INSTAGRAM_ACCESS_TOKEN=your-meta-app-access-token

# Existing AI/geocoding variables
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_MAPS_API_KEY=AIza...
TAVILY_API_KEY=tvly-...
```

**Important:** `EXPO_PUBLIC_*` prefix means the variable is exposed in the client bundle. The `INSTAGRAM_ACCESS_TOKEN` is NOT prefixed because it's only used server-side (Python backend).

### Step 4: Test the Integration

1. **Start the Python backend:**
   ```bash
   cd backend
   docker compose up
   ```

2. **Start Expo:**
   ```bash
   npm start
   ```

3. **Test share intent:**
   - Open TikTok or Instagram on your phone
   - Find a date spot post
   - Tap Share → Bridge
   - Watch the processing stages:
     - ✅ Metadata (fetching from Python backend)
     - ✅ AI Extraction (Claude/OpenAI)
     - ✅ Enrichment (Tavily web search)
     - ✅ Geocoding (Google Maps)
     - ✅ Saving (Supabase)

---

## API Endpoints

### Share Intent Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /share` | POST | Submit shared URL for enrichment |
| `GET /share/{id}` | GET | Get shared content by ID |
| `GET /share?user_id={uuid}` | GET | List all shared content for user |

### Health Check Endpoints (Kubernetes-ready)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health/live` | GET | Liveness probe (is process alive?) |
| `GET /health/ready` | GET | Readiness probe (can handle traffic?) |
| `GET /health/startup` | GET | Startup probe (migrations applied?) |

### Example: Submit Shared Link

```bash
curl -X POST http://localhost:8000/share \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "url": "https://www.tiktok.com/@user/video/123"
  }'

# Response:
{
  "id": "987fcdeb-51a2-43f8-9c1e-654321abcdef",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "original_url": "https://www.tiktok.com/@user/video/123",
  "platform": "tiktok",
  "status": "pending",
  "title": null,
  "author_name": null,
  "thumbnail_url": null,
  "embed_html": null,
  "error_message": null,
  "created_at": "2026-09-03T22:00:00Z",
  "enriched_at": null
}
```

### Example: Poll for Enrichment

```bash
curl http://localhost:8000/share/987fcdeb-51a2-43f8-9c1e-654321abcdef

# Response (after enrichment completes):
{
  "id": "987fcdeb-51a2-43f8-9c1e-654321abcdef",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "original_url": "https://www.tiktok.com/@user/video/123",
  "platform": "tiktok",
  "status": "enriched",
  "title": "Amazing sushi spot in LA 🍣",
  "author_name": "foodie_explorer",
  "thumbnail_url": "https://p16-sign-va.tiktokcdn.com/...",
  "embed_html": "<blockquote class=\"tiktok-embed\">...</blockquote>",
  "error_message": null,
  "created_at": "2026-09-03T22:00:00Z",
  "enriched_at": "2026-09-03T22:00:02Z"
}
```

---

## Database Schema

### `shared_content` Table

```sql
CREATE TABLE shared_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Original data
    original_url VARCHAR(2048) NOT NULL,
    platform VARCHAR(20) NOT NULL,  -- 'instagram' | 'tiktok' | 'unknown'
    status VARCHAR(20) NOT NULL,    -- 'pending' | 'enriched' | 'failed'

    -- oEmbed enriched fields
    title VARCHAR(500),
    author_name VARCHAR(255),
    thumbnail_url VARCHAR(2048),
    embed_html TEXT,
    raw_metadata JSONB,
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    enriched_at TIMESTAMPTZ,

    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);
```

**Note:** This table is separate from Supabase `ideas` table. It only stores oEmbed metadata for tracking purposes. The final idea is saved to Supabase `ideas` with combined data.

---

## Production Deployment

### Option 1: Railway (Easiest)

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Deploy:**
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```

3. **Get URL:**
   ```bash
   railway open
   # Copy the deployed URL (e.g., https://bridge-backend-production.up.railway.app)
   ```

4. **Update `.env`:**
   ```bash
   EXPO_PUBLIC_REVIEW_SERVICE_URL=https://bridge-backend-production.up.railway.app
   ```

5. **Add environment variables in Railway dashboard:**
   - `DATABASE_URL` (automatically provided by Railway Postgres addon)
   - `INSTAGRAM_ACCESS_TOKEN`
   - `CORS_ORIGINS=*` (or specific domain for production)

### Option 2: Render.com

1. **Push backend to GitHub**

2. **Create new Web Service on Render:**
   - Connect GitHub repo
   - Build command: `pip install -r requirements.txt`
   - Start command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Add Postgres database** (via Render dashboard)

4. **Add environment variables:**
   - `INSTAGRAM_ACCESS_TOKEN`
   - `CORS_ORIGINS`

5. **Get URL and update `.env`**

### Option 3: AWS/GCP/Azure

Use the provided `Dockerfile` for container deployment:

```bash
docker build -t bridge-backend .
docker push your-registry/bridge-backend:latest
```

Deploy to:
- AWS ECS
- GCP Cloud Run
- Azure Container Apps

---

## Code Structure

### Backend (`backend/`)

```
backend/
├── app/
│   ├── main.py                    # FastAPI app entry point
│   ├── api/
│   │   └── routes/
│   │       ├── share.py           # Share intent endpoints
│   │       ├── health.py          # Health check endpoints
│   │       └── reviews.py         # Code review (not used by Bridge)
│   ├── models/
│   │   ├── shared_content.py      # SQLAlchemy model
│   │   └── user.py                # User model
│   ├── schemas/
│   │   └── share.py               # Pydantic schemas
│   ├── services/
│   │   └── oembed.py              # TikTok/Instagram oEmbed client
│   └── core/
│       ├── config.py              # Settings (env vars)
│       └── database.py            # SQLAlchemy setup
├── alembic/
│   └── versions/
│       └── 0002_add_shared_content.py  # Migration
├── requirements.txt               # Python dependencies
├── Dockerfile                     # Container image
└── docker-compose.yml             # Local orchestration
```

### Frontend Integration (`src/`)

```
src/
├── lib/
│   └── shareService.ts            # HTTP client for Python backend
└── store/
    └── shareStore.ts              # Zustand store (optional)
```

---

## Troubleshooting

### Backend Not Starting

**Problem:** `docker compose up` fails with database connection error

**Solution:**
```bash
docker compose down -v  # Remove volumes
docker compose up --build
```

### Instagram oEmbed Failing

**Problem:** Instagram links return `status: "failed"` with error message

**Solution:**
1. Verify `INSTAGRAM_ACCESS_TOKEN` is set in backend `.env`
2. Check token is valid: https://developers.facebook.com/tools/debug/accesstoken/
3. Ensure "Instagram Basic Display" product is added to Meta app

### TikTok oEmbed Failing

**Problem:** TikTok links return `status: "failed"`

**Solution:**
- TikTok oEmbed is public but rate-limited
- Check if TikTok is blocking requests (they occasionally change policies)
- Fallback: AI extraction will still work with URL only

### React Native Can't Connect to Backend

**Problem:** `fetch failed` or `Network request failed`

**Solution:**

**iOS Simulator:**
```bash
EXPO_PUBLIC_REVIEW_SERVICE_URL=http://localhost:8000
```

**Android Emulator:**
```bash
EXPO_PUBLIC_REVIEW_SERVICE_URL=http://10.0.2.2:8000
```

**Physical Device:**
```bash
# Find your computer's local IP:
ifconfig | grep inet
# Use that IP:
EXPO_PUBLIC_REVIEW_SERVICE_URL=http://192.168.1.100:8000
```

### Polling Timeout

**Problem:** `waitForEnrichment` throws timeout error

**Solution:**
- Increase timeout in `app/share-intent.tsx:74`
  ```typescript
  const enriched = await waitForEnrichment(created.id, {
    intervalMs: 1000,
    timeoutMs: 20000  // Increase to 20 seconds
  });
  ```
- Check backend logs for errors:
  ```bash
  docker compose logs -f api
  ```

---

## Monitoring & Logs

### Backend Logs

```bash
# Docker Compose
docker compose logs -f api

# Railway
railway logs

# Render
# View in dashboard: https://dashboard.render.com/
```

### Health Checks

```bash
# Liveness
curl http://localhost:8000/health/live

# Readiness (checks DB connection)
curl http://localhost:8000/health/ready

# Startup (checks migrations)
curl http://localhost:8000/health/startup
```

### Database Inspection

```bash
# Connect to local PostgreSQL
docker compose exec db psql -U bridge -d bridge_reviews

# List shared content
SELECT id, platform, status, title, created_at FROM shared_content ORDER BY created_at DESC LIMIT 10;
```

---

## Future Enhancements

### Move AI Extraction to Backend

Currently AI extraction (Claude/OpenAI) runs client-side. To move it server-side:

1. **Add AI endpoints:**
   ```python
   # backend/app/api/routes/ai.py
   @router.post("/ai/extract")
   async def extract_spot(url: str, caption: str | None = None):
       # Call Claude/OpenAI
       # Return structured spot data
   ```

2. **Update client:**
   ```typescript
   // src/lib/aiService.ts
   const extracted = await fetch(`${API_URL}/ai/extract`, {
     method: 'POST',
     body: JSON.stringify({ url, caption })
   });
   ```

**Benefits:**
- ✅ API keys server-side (secure)
- ✅ Caching possible (reduce costs)
- ✅ Rate limiting
- ✅ Better error handling

### Add Caching

Cache oEmbed responses to avoid repeated API calls:

```python
# backend/app/services/oembed.py
import redis

cache = redis.Redis()

async def fetch_oembed_cached(url: str, platform: str):
    cached = cache.get(f"oembed:{url}")
    if cached:
        return json.loads(cached)

    result = await fetch_oembed(url, platform)
    cache.setex(f"oembed:{url}", 86400, json.dumps(result))  # 24h TTL
    return result
```

### Add Analytics

Track share intent usage:

```python
# backend/app/models/analytics.py
class ShareEvent(Base):
    __tablename__ = "share_events"

    id = Column(UUID, primary_key=True)
    user_id = Column(UUID, ForeignKey("users.id"))
    platform = Column(String)
    success = Column(Boolean)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
```

---

## Summary

The Python backend integration provides:

1. ✅ **Secure oEmbed fetching** - Tokens stay server-side
2. ✅ **Better metadata** - Official APIs for thumbnails/titles
3. ✅ **Graceful degradation** - Falls back to AI-only if backend fails
4. ✅ **Future-proof architecture** - Easy to add caching, rate limiting, etc.
5. ✅ **Production-ready** - Docker, health checks, migrations

**Next Steps:**

1. Start backend: `cd backend && docker compose up --build`
2. Test locally with share intent
3. Deploy to Railway/Render
4. Update `EXPO_PUBLIC_REVIEW_SERVICE_URL` in production `.env`
5. (Optional) Move AI extraction to backend for full server-side processing

---

**Questions or Issues?**

- Check logs: `docker compose logs -f api`
- Verify health: `curl http://localhost:8000/health/ready`
- Test endpoints: See "API Endpoints" section above
