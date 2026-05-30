"""FastAPI application exposing the stock analysis agent over HTTP."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from . import __version__
from .analysis import analyze
from .config import get_settings
from .data import DataFetchError, fetch_history
from .models import (
    Analysis,
    AlertModel,
    RecommendRequest,
    RecommendResponse,
    ScanResponse,
    WatchItemModel,
    WatchlistResponse,
)
from .monitor import scan_watchlist
from .notifications import build_notifier
from .scheduler import ScanScheduler
from .store import WatchlistStore

logger = logging.getLogger("stock_agent")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise shared resources and the optional background scheduler."""
    settings = get_settings()
    store = WatchlistStore(settings.database_path)

    # Seed a default watchlist on first run.
    if settings.default_watchlist and not store.list():
        for ticker in settings.default_watchlist:
            store.add(ticker)

    notifier = build_notifier(settings)

    app.state.settings = settings
    app.state.store = store
    app.state.notifier = notifier
    app.state.scheduler = None

    if settings.scheduler_enabled:
        scheduler = ScanScheduler(store, notifier, settings)
        scheduler.start()
        app.state.scheduler = scheduler

    try:
        yield
    finally:
        if app.state.scheduler is not None:
            app.state.scheduler.shutdown()
        store.close()


app = FastAPI(
    title="Stock Analysis Agent",
    version=__version__,
    description=(
        "A hostable agent that analyzes stocks using technical indicators and "
        "returns BUY / HOLD / SELL recommendations, with a monitored watchlist "
        "and notifications on meaningful changes."
    ),
    lifespan=lifespan,
)


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok", "version": __version__}


@app.get("/analyze/{ticker}", response_model=Analysis)
def analyze_ticker(
    ticker: str, period: str = "6mo", interval: str = "1d"
) -> Analysis:
    """Analyze a single ticker and return a recommendation."""
    try:
        history = fetch_history(ticker, period=period, interval=interval)
    except DataFetchError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    try:
        return analyze(ticker, history)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest) -> RecommendResponse:
    """Analyze a basket of tickers and return ranked recommendations."""
    results: list[Analysis] = []
    errors: dict[str, str] = {}

    for ticker in req.tickers:
        try:
            history = fetch_history(
                ticker, period=req.period, interval=req.interval
            )
            results.append(analyze(ticker, history))
        except (DataFetchError, ValueError) as exc:
            errors[ticker.upper()] = str(exc)

    # Rank best opportunities first.
    results.sort(key=lambda a: a.score, reverse=True)

    if req.top is not None:
        results = results[: req.top]

    return RecommendResponse(results=results, errors=errors)


# -- Watchlist management ------------------------------------------------


@app.get("/watchlist", response_model=WatchlistResponse)
def get_watchlist() -> WatchlistResponse:
    """List the tickers currently being monitored."""
    items = [
        WatchItemModel(
            ticker=i.ticker,
            buy_threshold=i.buy_threshold,
            sell_threshold=i.sell_threshold,
        )
        for i in app.state.store.list()
    ]
    return WatchlistResponse(items=items)


@app.put("/watchlist/{ticker}", response_model=WatchItemModel)
def upsert_watchlist(
    ticker: str,
    buy_threshold: float | None = None,
    sell_threshold: float | None = None,
) -> WatchItemModel:
    """Add a ticker to the watchlist, or update its thresholds."""
    item = app.state.store.add(ticker, buy_threshold, sell_threshold)
    return WatchItemModel(
        ticker=item.ticker,
        buy_threshold=item.buy_threshold,
        sell_threshold=item.sell_threshold,
    )


@app.delete("/watchlist/{ticker}")
def delete_watchlist(ticker: str) -> dict[str, str]:
    """Remove a ticker from the watchlist."""
    removed = app.state.store.remove(ticker)
    if not removed:
        raise HTTPException(status_code=404, detail=f"{ticker.upper()} not watched")
    return {"status": "removed", "ticker": ticker.upper()}


@app.post("/scan", response_model=ScanResponse)
def scan() -> ScanResponse:
    """Scan the watchlist now, sending notifications for any changes."""
    result = scan_watchlist(
        app.state.store, app.state.notifier, app.state.settings
    )
    alerts = [
        AlertModel(
            ticker=a.ticker,
            old_recommendation=a.old_recommendation,
            new_recommendation=a.new_recommendation,
            score=a.score,
        )
        for a in result.alerts
    ]
    return ScanResponse(
        results=result.analyses, alerts=alerts, errors=result.errors
    )
