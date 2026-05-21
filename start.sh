#!/bin/bash
# Start both backend (FastAPI) and frontend (Next.js) concurrently

cd "$(dirname "$0")"

echo "Starting CI Insights Engine..."

# Install Python dependencies
echo "→ Installing Python dependencies..."
pip install -r backend/requirements.txt -q

# Build vector DB on first run
VECTOR_DB="data/vector_db/chroma.sqlite3"
if [ ! -f "$VECTOR_DB" ]; then
  echo "→ Vector DB not found. Building index (this takes 5–15 min on first run)..."
  python scripts/ingest_and_index.py
  echo "✓ Index built"
else
  echo "✓ Vector DB found, skipping index build"
fi

# Backend
echo "→ Starting FastAPI backend on :8000"
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Frontend
echo "→ Starting Next.js frontend on :3000"
cd frontend
npm install -q
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✓ Backend:  http://localhost:8000"
echo "✓ Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
