# Stock Analysis Agent

A small, hostable agent that analyses stocks using technical indicators and
returns **BUY / HOLD / SELL** recommendations. Give it a ticker (or a basket of
tickers) and it tells you which ones currently look most attractive.

> ⚠️ **Disclaimer:** This project is for educational purposes only. It is **not**
> financial advice. Technical indicators are heuristics, not guarantees. Do your
> own research before investing.

## How it works

```
HTTP request ──▶ FastAPI (app/main.py)
                    │
                    ├─▶ data.py        fetch price history (yfinance)
                    └─▶ analysis.py    indicators + scoring → recommendation
```

The agent computes several classic indicators and blends them into a single
composite score in the range `[-1, 1]`:

| Signal            | Bullish when…                                  |
| ----------------- | ---------------------------------------------- |
| SMA crossover     | short-term average > long-term average         |
| Price vs SMA      | price above its long-term average              |
| RSI (14)          | oversold (< 30); bearish when overbought (> 70)|
| MACD              | MACD line above its signal line                |
| Momentum          | positive recent return                         |

The score maps to a label: `score ≥ 0.3 → BUY`, `score ≤ -0.3 → SELL`,
otherwise `HOLD`. `confidence` is the absolute value of the score.

## Quick start

```bash
cd stock-agent
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is then available at <http://localhost:8000>, with interactive docs at
<http://localhost:8000/docs>.

### Endpoints

#### `GET /health`
Liveness probe.

#### `GET /analyze/{ticker}`
Analyse a single ticker.

```bash
curl "http://localhost:8000/analyze/AAPL?period=6mo&interval=1d"
```

```json
{
  "ticker": "AAPL",
  "recommendation": "BUY",
  "score": 0.55,
  "confidence": 0.55,
  "rationale": ["Short-term trend is above long-term trend (bullish crossover).", "..."],
  "indicators": { "last_price": 195.2, "rsi": 41.3, "macd": 1.2, "...": "..." }
}
```

#### `POST /recommend`
Analyse a basket and get ranked recommendations (best opportunities first).

```bash
curl -X POST "http://localhost:8000/recommend" \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["AAPL", "MSFT", "TSLA", "NVDA"], "period": "6mo", "top": 3}'
```

Tickers that fail to download are reported in the `errors` map rather than
failing the whole request.

## Running the tests

```bash
cd stock-agent
pip install -r requirements.txt -r requirements-dev.txt
pytest
```

The analysis engine is decoupled from the network, so the test suite runs fully
offline using synthetic price series.

## Hosting

### Docker

```bash
cd stock-agent
docker build -t stock-agent .
docker run -p 8000:8000 stock-agent
```

### Any container platform

The image listens on port `8000`. It runs anywhere that can run a container
(Render, Railway, Fly.io, AWS ECS, Google Cloud Run, Azure Container Apps, a VM,
etc.). No API keys are required because `yfinance` uses public data, though
hosting providers may rate-limit outbound requests.

## Project layout

```
stock-agent/
├── app/
│   ├── analysis.py   # indicators + scoring (network-free, unit-tested)
│   ├── data.py       # yfinance data access
│   ├── main.py       # FastAPI app / HTTP endpoints
│   └── models.py     # Pydantic request/response models
├── tests/            # offline unit + API tests
├── Dockerfile
├── requirements.txt
└── requirements-dev.txt
```

## Extending

- Add fundamental data (P/E, earnings growth) as additional signals in
  `score_indicators`.
- Swap or add a data provider in `app/data.py`.
- Persist results or schedule periodic scans to build watchlists.
