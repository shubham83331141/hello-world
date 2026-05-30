"""Pydantic models describing API requests and responses."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class Indicators(BaseModel):
    """Snapshot of the technical indicators computed for a ticker."""

    last_price: float
    sma_short: Optional[float] = None
    sma_long: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    momentum: Optional[float] = None
    volatility: Optional[float] = None


class Analysis(BaseModel):
    """Recommendation produced for a single ticker."""

    ticker: str
    recommendation: str = Field(..., description="BUY, HOLD or SELL")
    score: float = Field(..., description="Composite score in the range [-1, 1]")
    confidence: float = Field(..., description="Confidence in the range [0, 1]")
    rationale: List[str] = Field(default_factory=list)
    indicators: Optional[Indicators] = None


class RecommendRequest(BaseModel):
    """Request body for the /recommend endpoint."""

    tickers: List[str] = Field(..., min_length=1)
    period: str = Field("6mo", description="History window, e.g. 1mo, 6mo, 1y")
    interval: str = Field("1d", description="Sampling interval, e.g. 1d, 1wk")
    top: Optional[int] = Field(
        None, description="If set, only return the top N ranked BUY/HOLD candidates"
    )


class RecommendResponse(BaseModel):
    """Response body for the /recommend endpoint."""

    results: List[Analysis]
    errors: dict[str, str] = Field(default_factory=dict)
