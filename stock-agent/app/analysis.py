"""Technical analysis engine.

The functions here are intentionally free of any network or framework
dependencies so they can be unit-tested in isolation. They operate on a
:class:`pandas.DataFrame` that contains at least a ``Close`` column.
"""

from __future__ import annotations

from typing import List, Tuple

import pandas as pd

from .models import Analysis, Indicators


def simple_moving_average(close: pd.Series, window: int) -> pd.Series:
    """Return the simple moving average over ``window`` periods."""
    return close.rolling(window=window, min_periods=window).mean()


def relative_strength_index(close: pd.Series, period: int = 14) -> pd.Series:
    """Return the Wilder-smoothed Relative Strength Index (RSI)."""
    delta = close.diff()
    gain = delta.clip(lower=0.0)
    loss = -delta.clip(upper=0.0)

    avg_gain = gain.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1.0 / period, min_periods=period, adjust=False).mean()

    rs = avg_gain / avg_loss
    rsi = 100.0 - (100.0 / (1.0 + rs))
    # When there are no losses the RSI is defined as 100.
    rsi = rsi.where(avg_loss != 0.0, 100.0)
    return rsi


def macd(
    close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
) -> Tuple[pd.Series, pd.Series]:
    """Return the MACD line and its signal line."""
    ema_fast = close.ewm(span=fast, adjust=False).mean()
    ema_slow = close.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    return macd_line, signal_line


def _last(series: pd.Series) -> float | None:
    """Return the last non-NaN value of a series, or ``None``."""
    cleaned = series.dropna()
    if cleaned.empty:
        return None
    return float(cleaned.iloc[-1])


def compute_indicators(
    df: pd.DataFrame,
    short_window: int = 20,
    long_window: int = 50,
    rsi_period: int = 14,
) -> Indicators:
    """Compute a snapshot of indicators from a price history frame."""
    if "Close" not in df.columns:
        raise ValueError("price history must contain a 'Close' column")

    close = df["Close"].astype(float)
    if close.dropna().empty:
        raise ValueError("price history contains no usable 'Close' values")

    macd_line, signal_line = macd(close)
    returns = close.pct_change()

    momentum = None
    last_price = _last(close)
    if last_price is not None and len(close.dropna()) > short_window:
        past = close.dropna().iloc[-(short_window + 1)]
        if past:
            momentum = float((last_price - past) / past)

    volatility = None
    vol = returns.dropna()
    if not vol.empty:
        volatility = float(vol.std())

    return Indicators(
        last_price=last_price,
        sma_short=_last(simple_moving_average(close, short_window)),
        sma_long=_last(simple_moving_average(close, long_window)),
        rsi=_last(relative_strength_index(close, rsi_period)),
        macd=_last(macd_line),
        macd_signal=_last(signal_line),
        momentum=momentum,
        volatility=volatility,
    )


def score_indicators(ind: Indicators) -> Tuple[float, List[str]]:
    """Convert indicators into a composite score and human-readable rationale.

    The score is the average of several individual signals, each in the
    range ``[-1, 1]``. Positive values lean bullish, negative bearish.
    """
    signals: List[float] = []
    rationale: List[str] = []

    # Trend: short SMA above long SMA is bullish.
    if ind.sma_short is not None and ind.sma_long is not None:
        if ind.sma_short > ind.sma_long:
            signals.append(1.0)
            rationale.append(
                "Short-term trend is above long-term trend (bullish crossover)."
            )
        else:
            signals.append(-1.0)
            rationale.append(
                "Short-term trend is below long-term trend (bearish crossover)."
            )

    # Price relative to long SMA.
    if ind.last_price is not None and ind.sma_long is not None and ind.sma_long:
        if ind.last_price > ind.sma_long:
            signals.append(0.5)
            rationale.append("Price is trading above its long-term average.")
        else:
            signals.append(-0.5)
            rationale.append("Price is trading below its long-term average.")

    # RSI: oversold is bullish, overbought is bearish.
    if ind.rsi is not None:
        if ind.rsi < 30:
            signals.append(1.0)
            rationale.append(f"RSI is oversold ({ind.rsi:.1f}).")
        elif ind.rsi > 70:
            signals.append(-1.0)
            rationale.append(f"RSI is overbought ({ind.rsi:.1f}).")
        else:
            # Linear tilt: below 50 mildly bullish, above 50 mildly bearish.
            signals.append((50.0 - ind.rsi) / 40.0)
            rationale.append(f"RSI is neutral ({ind.rsi:.1f}).")

    # MACD above its signal line is bullish.
    if ind.macd is not None and ind.macd_signal is not None:
        if ind.macd > ind.macd_signal:
            signals.append(1.0)
            rationale.append("MACD is above its signal line (bullish momentum).")
        else:
            signals.append(-1.0)
            rationale.append("MACD is below its signal line (bearish momentum).")

    # Recent momentum.
    if ind.momentum is not None:
        signals.append(max(-1.0, min(1.0, ind.momentum * 5.0)))
        rationale.append(f"Recent momentum is {ind.momentum * 100:.1f}%.")

    if not signals:
        return 0.0, ["Not enough data to form a recommendation."]

    score = sum(signals) / len(signals)
    return float(max(-1.0, min(1.0, score))), rationale


def recommend_from_score(score: float) -> str:
    """Map a composite score to a BUY/HOLD/SELL label."""
    if score >= 0.3:
        return "BUY"
    if score <= -0.3:
        return "SELL"
    return "HOLD"


def analyze(ticker: str, df: pd.DataFrame) -> Analysis:
    """Produce a full :class:`Analysis` for a ticker given its price history."""
    indicators = compute_indicators(df)
    score, rationale = score_indicators(indicators)
    recommendation = recommend_from_score(score)
    confidence = round(abs(score), 4)
    return Analysis(
        ticker=ticker.upper(),
        recommendation=recommendation,
        score=round(score, 4),
        confidence=confidence,
        rationale=rationale,
        indicators=indicators,
    )
