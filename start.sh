#!/bin/bash
cd "$(dirname "$0")"

echo "========================================"
echo "  CI Insights Engine — Blue Shield CA"
echo "========================================"

# Check .env
if [ ! -f ".env" ]; then
  echo ""
  echo "ERROR: .env file not found."
  echo "Run: cp .env.example .env"
  echo "Then add your ANTHROPIC_API_KEY to .env and run this script again."
  echo ""
  exit 1
fi

if ! grep -q "ANTHROPIC_API_KEY=sk-" .env 2>/dev/null; then
  echo ""
  echo "WARNING: ANTHROPIC_API_KEY looks empty or invalid in .env"
  echo "AI features (search, summaries, topic refresh) will not work."
  echo "Get a key at https://console.anthropic.com and add it to .env"
  echo ""
fi

# Install Python dependencies
echo ""
echo "→ Installing Python dependencies..."
pip install -r backend/requirements.txt -q

# Install frontend dependencies
echo "→ Installing frontend dependencies..."
cd frontend && npm install -q && cd ..

# Build vector DB on first run
VECTOR_DB="data/vector_db/chroma.sqlite3"
if [ ! -f "$VECTOR_DB" ]; then
  echo "→ Vector DB not found. Building index (this takes 5-15 min on first run)..."
  python scripts/ingest_and_index.py
  echo "✓ Index built"
else
  echo "✓ Vector DB found, skipping index build"
fi

# Start backend (run from project root so all imports resolve correctly)
echo "→ Starting FastAPI backend on :8000"
PYTHONPATH=. uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "→ Starting Next.js frontend on :3000"
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✓ Backend:  http://localhost:8000"
echo "✓ Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
