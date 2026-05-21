# CI Insights Engine
**Blue Shield of California — Competitive Intelligence Capstone Project**

An automated insights engine that scrapes, summarizes, and surfaces competitive intelligence from earnings call transcripts, SEC filings, and news articles across 10 major health insurance competitors.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.11+ |
| Vector DB | ChromaDB + BM25 hybrid search |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| LLM | Anthropic Claude (claude-haiku-4-5) |
| Scheduler | APScheduler (auto-refresh every 6h) |

---

## Project Structure

```
capstone-engine/
├── backend/
│   ├── main.py              # FastAPI app + all API endpoints
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # UI components
│   └── lib/                 # API client, types
├── src/
│   ├── ingestion/           # Document loading and cleaning
│   ├── scraper/             # News scraper and deduplicator
│   ├── retrieval/           # Hybrid search (BM25 + vector)
│   ├── vector_store/        # ChromaDB wrapper
│   ├── llm/                 # Claude client and prompts
│   └── utils/               # Helpers, summary cache
├── scripts/
│   └── auto_update.py       # Scrape + summarize pipeline
├── data/
│   ├── raw/                 # Earnings transcripts, SEC filings
│   └── topics.json          # User-defined tracked topics
├── config.py                # Env vars and company config
├── start.sh                 # Start both backend + frontend
└── .env                     # Your API key (not committed)
```

---

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/shweta2812/Capstone-Insight-Seacrh-Engine
cd Capstone-Insight-Seacrh-Engine
```

### 2. Add your Anthropic API key
Create a `.env` file in the project root:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at: https://console.anthropic.com

### 3. Install Python dependencies
```bash
pip install -r backend/requirements.txt
```

### 4. Install frontend dependencies
```bash
cd frontend && npm install && cd ..
```

### 5. Start the engine
```bash
bash start.sh
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/docs

---

## Tracked Competitors

Elevance Health, UnitedHealth Group, Aetna (CVS Health), Cigna Group, Humana, Centene, Molina Healthcare, Oscar Health, Kaiser Permanente, Blue Cross (Anthem CA)
