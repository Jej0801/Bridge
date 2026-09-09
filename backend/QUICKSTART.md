# Backend Quick Start

## Local Development (Docker)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. (Optional) Add Instagram access token to .env
# Get from: https://developers.facebook.com/apps/
# INSTAGRAM_ACCESS_TOKEN=your-token-here

# 3. Start backend
docker compose up --build

# 4. Test it's working
curl http://localhost:8000/
# Should return: {"service":"Bridge Share Intent Service","status":"running"}

curl http://localhost:8000/health/ready
# Should return: {"status":"healthy", ...}
```

## Local Development (Python)

```bash
# 1. Install Python 3.12+
# macOS: brew install python@3.12
# Ubuntu: apt install python3.12

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up PostgreSQL
# Option A: Use Docker just for Postgres
docker run -d \
  --name bridge-postgres \
  -e POSTGRES_USER=bridge \
  -e POSTGRES_PASSWORD=bridge \
  -e POSTGRES_DB=bridge_reviews \
  -p 5432:5432 \
  postgres:16-alpine

# Option B: Install PostgreSQL locally
# macOS: brew install postgresql
# Ubuntu: apt install postgresql

# 5. Run migrations
alembic upgrade head

# 6. Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Production Deployment

### Railway (Recommended)

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add PostgreSQL
railway add --plugin postgresql

# 5. Deploy
railway up

# 6. Set environment variables in Railway dashboard:
# - INSTAGRAM_ACCESS_TOKEN
# - CORS_ORIGINS (your production domain)

# 7. Get URL
railway open
# Copy the URL and add to React Native .env:
# EXPO_PUBLIC_REVIEW_SERVICE_URL=https://your-app.railway.app
```

### Render.com

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repo
4. Settings:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add PostgreSQL database (Render dashboard)
6. Add environment variables:
   - `INSTAGRAM_ACCESS_TOKEN`
   - `CORS_ORIGINS`
7. Copy deployed URL to React Native `.env`

## Testing

```bash
# Test share intent endpoint
curl -X POST http://localhost:8000/share \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "url": "https://www.tiktok.com/@user/video/123"
  }'

# Check enrichment status
curl http://localhost:8000/share/{id}
```

## Troubleshooting

### Port 8000 already in use
```bash
lsof -ti:8000 | xargs kill -9
```

### Database connection failed
```bash
# Check PostgreSQL is running
docker compose ps

# View logs
docker compose logs -f db
```

### Instagram oEmbed not working
- Check `INSTAGRAM_ACCESS_TOKEN` is set
- Verify token at: https://developers.facebook.com/tools/debug/accesstoken/
- Ensure "Instagram Basic Display" product is enabled

## Logs

```bash
# Docker Compose
docker compose logs -f api

# Railway
railway logs

# Local Python
# Shows in terminal where uvicorn is running
```
