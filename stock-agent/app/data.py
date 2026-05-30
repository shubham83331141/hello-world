"""Market data access layer.

Price history is fetched with `yfinance`. The fetching is isolated here so the
analysis engine stays free of network dependencies and remains easy to test.
"""

from __future__ import annotations

import pandas as pd


class DataFetchError(RuntimeError):
    """Raised when price history cannot be retrieved for a ticker."""


def fetch_history(ticker: str, period: str = "6mo", interval: str = "1d") -> pd.DataFrame:
    """Fetch OHLCV history for ``ticker`` and return it as a DataFrame.

    Raises:
        DataFetchError: if no data is returned or the download fails.
    """
    try:
        import yfinance as yf
    except ImportError as exc:  # pragma: no cover - import guard
        raise DataFetchError(
            "yfinance is not installed; run 'pip install -r requirements.txt'"
        ) from exc

    try:
        data = yf.download(
            ticker,
            period=period,
            interval=interval,
            progress=False,
            auto_adjust=True,
        )
    except Exception as exc:  # noqa: BLE001 - surface any download failure uniformly
        raise DataFetchError(f"failed to download data for {ticker}: {exc}") from exc

    if data is None or data.empty:
        raise DataFetchError(f"no price data returned for {ticker}")

    # yfinance can return a MultiIndex on the columns when several tickers are
    # requested; flatten to the first level so 'Close' is always accessible.
    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)

    return data
