"""Unit tests for the network-free analysis engine."""

from __future__ import annotations

import numpy as np
import pandas as pd

from app.analysis import (
    analyze,
    compute_indicators,
    recommend_from_score,
    relative_strength_index,
    score_indicators,
    simple_moving_average,
)


def _frame(prices: list[float]) -> pd.DataFrame:
    idx = pd.date_range("2024-01-01", periods=len(prices), freq="D")
    return pd.DataFrame({"Close": prices}, index=idx)


def _uptrend(n: int = 120) -> pd.DataFrame:
    # Steadily rising prices with mild noise.
    base = np.linspace(100.0, 200.0, n)
    noise = np.sin(np.linspace(0, 12, n)) * 1.5
    return _frame(list(base + noise))


def _downtrend(n: int = 120) -> pd.DataFrame:
    base = np.linspace(200.0, 100.0, n)
    noise = np.sin(np.linspace(0, 12, n)) * 1.5
    return _frame(list(base + noise))


def test_sma_matches_manual_average():
    s = pd.Series([1.0, 2.0, 3.0, 4.0, 5.0])
    sma = simple_moving_average(s, 3)
    assert sma.iloc[:2].isna().all()
    assert sma.iloc[2] == 2.0
    assert sma.iloc[4] == 4.0


def test_rsi_bounds_and_all_gains():
    rising = pd.Series(np.arange(1, 50, dtype=float))
    rsi = relative_strength_index(rising, 14).dropna()
    assert (rsi <= 100.0).all() and (rsi >= 0.0).all()
    # A monotonic rise should produce an RSI of 100 (no losses).
    assert rsi.iloc[-1] == 100.0


def test_compute_indicators_has_values():
    ind = compute_indicators(_uptrend())
    assert ind.last_price is not None
    assert ind.sma_short is not None
    assert ind.sma_long is not None
    assert ind.rsi is not None
    assert ind.macd is not None


def test_uptrend_is_bullish():
    result = analyze("UP", _uptrend())
    assert result.score > 0
    assert result.recommendation in {"BUY", "HOLD"}
    assert result.ticker == "UP"
    assert result.rationale


def test_downtrend_is_bearish():
    result = analyze("DOWN", _downtrend())
    assert result.score < 0
    assert result.recommendation in {"SELL", "HOLD"}


def test_recommend_thresholds():
    assert recommend_from_score(0.8) == "BUY"
    assert recommend_from_score(-0.8) == "SELL"
    assert recommend_from_score(0.0) == "HOLD"


def test_score_with_no_signals_is_neutral():
    ind = compute_indicators(_frame([100.0, 101.0, 102.0]))
    score, rationale = score_indicators(ind)
    assert -1.0 <= score <= 1.0
    assert rationale


def test_confidence_is_absolute_score():
    result = analyze("UP", _uptrend())
    assert result.confidence == round(abs(result.score), 4)
