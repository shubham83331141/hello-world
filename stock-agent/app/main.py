"""FastAPI application exposing the stock analysis agent over HTTP."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException

from . import __version__
from .analysis import analyze
from .data import DataFetchError, fetch_history
from .models import Analysis, RecommendRequest, RecommendResponse

app = FastAPI(
    title="Stock Analysis Agent",
    version=__version__,
    description=(
        "A hostable agent that analyses stocks using technical indicators and "
        "returns BUY / HOLD / SELL recommendations."
    ),
)


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok", "version": __version__}


@app.get("/analyze/{ticker}", response_model=Analysis)
def analyze_ticker(
    ticker: str, period: str = "6mo", interval: str = "1d"
) -> Analysis:
    """Analyse a single ticker and return a recommendation."""
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
    """Analyse a basket of tickers and return ranked recommendations."""
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
