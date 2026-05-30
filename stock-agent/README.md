# Stock Analysis Agent

A small, hostable agent that analyzes stocks using technical indicators and
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
Analyze a single ticker.

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
Analyze a basket and get ranked recommendations (best opportunities first).

```bash
curl -X POST "http://localhost:8000/recommend" \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["AAPL", "MSFT", "TSLA", "NVDA"], "period": "6mo", "top": 3}'
```

Tickers that fail to download are reported in the `errors` map rather than
failing the whole request.

## Monitoring & notifications

Beyond on-demand analysis, the agent can **watch a list of tickers, scan them on
a schedule, and notify you only when a recommendation meaningfully changes**
(e.g. `HOLD → BUY`).

### Watchlist

A watchlist is persisted in SQLite (path set by `DATABASE_PATH`). Manage it via
the API:

```bash
# Add / update a ticker (optional per-ticker score thresholds)
curl -X PUT "http://localhost:8000/watchlist/AAPL"
curl -X PUT "http://localhost:8000/watchlist/NVDA?buy_threshold=0.5&sell_threshold=-0.4"

# List what's being watched
curl "http://localhost:8000/watchlist"

# Stop watching a ticker
curl -X DELETE "http://localhost:8000/watchlist/AAPL"
```

### Scanning

A scan analyzes every watched ticker, compares each result with the last one
stored, fires notifications for changes, and persists the new state.

* **On demand:** `POST /scan` returns the analyses plus any `alerts` that fired.
* **In-process scheduler:** set `SCHEDULER_ENABLED=true` to run scans every
  `SCAN_INTERVAL_MINUTES` (default 60) inside the service.
* **External scheduler (recommended for serverless):** run `python -m app.scan`
  from cron, GitHub Actions, Cloud Run Jobs, Railway cron, etc.

### Change detection

By default an alert fires whenever a ticker's label changes (and on the first
observation if it lands on BUY or SELL). Set `ALERT_ON_BUY_ONLY=true` to be
notified only when a ticker newly becomes a **BUY**. Per-ticker
`buy_threshold` / `sell_threshold` override the global ±0.3 cut-offs.

### Notification channels

Pick a channel with `NOTIFIER`:

| `NOTIFIER` | Required configuration                                              |
| ---------- | ------------------------------------------------------------------ |
| `console`  | none (default — alerts are logged)                                 |
| `slack`    | `SLACK_WEBHOOK_URL` (works for Slack **or** Discord webhooks)       |
| `email`    | `SMTP_HOST`, `SMTP_PORT`, `EMAIL_FROM`, `EMAIL_TO`, and optionally `SMTP_USERNAME` / `SMTP_PASSWORD` / `SMTP_USE_TLS` |

If a channel is misconfigured the agent logs a warning and falls back to the
console so scans never crash.

### Configuration reference

| Variable                | Default          | Purpose                                   |
| ----------------------- | ---------------- | ----------------------------------------- |
| `DATABASE_PATH`         | `stock_agent.db` | SQLite file for the watchlist + state     |
| `DEFAULT_WATCHLIST`     | _(empty)_        | Comma-separated tickers seeded on first run|
| `SCAN_PERIOD`           | `6mo`            | History window used during scans          |
| `SCAN_INTERVAL`         | `1d`             | Sampling interval used during scans       |
| `SCHEDULER_ENABLED`     | `false`          | Run the in-process scheduler              |
| `SCAN_INTERVAL_MINUTES` | `60`             | Scheduler frequency                       |
| `ALERT_ON_BUY_ONLY`     | `false`          | Only alert on new BUY signals             |
| `NOTIFIER`              | `console`        | `console`, `slack`, or `email`            |

## Running the tests

```bash
cd stock-agent
pip install -r requirements.txt -r requirements-dev.txt
pytest
```

The analysis, store and monitoring logic are decoupled from the network, so the
test suite runs fully offline using synthetic price series.

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
│   ├── analysis.py       # indicators + scoring (network-free, unit-tested)
│   ├── config.py         # settings from environment variables
│   ├── data.py           # yfinance data access
│   ├── main.py           # FastAPI app / HTTP endpoints + lifespan
│   ├── models.py         # Pydantic request/response models
│   ├── monitor.py        # watchlist scan + change detection
│   ├── notifications.py  # pluggable notifiers (console/slack/email)
│   ├── scan.py           # `python -m app.scan` one-shot scan for cron
│   ├── scheduler.py      # in-process APScheduler periodic scans
│   └── store.py          # SQLite watchlist + recommendation state
├── tests/                # offline unit + API tests
├── Dockerfile
├── requirements.txt
└── requirements-dev.txt
```

## Extending

- Add fundamental data (P/E, earnings growth) as additional signals in
  `score_indicators`.
- Swap or add a data provider in `app/data.py`.
- Add a notification channel by implementing the `Notifier` protocol in
  `app/notifications.py` and wiring it into `build_notifier`.
