"""SQLite-backed persistence for the watchlist and last-seen recommendations.

The store keeps two tables:

* ``watchlist`` — the tickers to monitor and optional per-ticker score
  thresholds that override the global BUY/SELL cut-offs.
* ``recommendation_state`` — the last recommendation/score recorded for each
  ticker, used for change detection between scans.
"""

from __future__ import annotations

import sqlite3
import threading
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class WatchItem:
    """A ticker being monitored, with optional score thresholds."""

    ticker: str
    buy_threshold: Optional[float] = None
    sell_threshold: Optional[float] = None


@dataclass
class RecommendationState:
    """The last recommendation recorded for a ticker."""

    ticker: str
    recommendation: str
    score: float
    updated_at: str


class WatchlistStore:
    """Thread-safe SQLite store for the watchlist and recommendation state."""

    def __init__(self, path: str = "stock_agent.db") -> None:
        self._path = path
        # check_same_thread=False so the connection can be shared across the
        # FastAPI request threads and the scheduler thread; a lock serialises
        # access to keep writes safe.
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._lock = threading.Lock()
        self._create_schema()

    def _create_schema(self) -> None:
        with self._lock:
            self._conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS watchlist (
                    ticker TEXT PRIMARY KEY,
                    buy_threshold REAL,
                    sell_threshold REAL,
                    added_at TEXT DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS recommendation_state (
                    ticker TEXT PRIMARY KEY,
                    recommendation TEXT NOT NULL,
                    score REAL NOT NULL,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            self._conn.commit()

    # -- Watchlist -------------------------------------------------------

    def add(
        self,
        ticker: str,
        buy_threshold: Optional[float] = None,
        sell_threshold: Optional[float] = None,
    ) -> WatchItem:
        """Add or update a ticker on the watchlist."""
        ticker = ticker.upper()
        with self._lock:
            self._conn.execute(
                """
                INSERT INTO watchlist (ticker, buy_threshold, sell_threshold)
                VALUES (?, ?, ?)
                ON CONFLICT(ticker) DO UPDATE SET
                    buy_threshold=excluded.buy_threshold,
                    sell_threshold=excluded.sell_threshold
                """,
                (ticker, buy_threshold, sell_threshold),
            )
            self._conn.commit()
        return WatchItem(ticker, buy_threshold, sell_threshold)

    def remove(self, ticker: str) -> bool:
        """Remove a ticker from the watchlist. Returns True if it existed."""
        ticker = ticker.upper()
        with self._lock:
            cur = self._conn.execute(
                "DELETE FROM watchlist WHERE ticker = ?", (ticker,)
            )
            self._conn.execute(
                "DELETE FROM recommendation_state WHERE ticker = ?", (ticker,)
            )
            self._conn.commit()
            return cur.rowcount > 0

    def list(self) -> List[WatchItem]:
        """Return all watched tickers ordered alphabetically."""
        with self._lock:
            rows = self._conn.execute(
                "SELECT ticker, buy_threshold, sell_threshold "
                "FROM watchlist ORDER BY ticker"
            ).fetchall()
        return [
            WatchItem(r["ticker"], r["buy_threshold"], r["sell_threshold"])
            for r in rows
        ]

    def get(self, ticker: str) -> Optional[WatchItem]:
        """Return a single watch item, or ``None`` if not present."""
        ticker = ticker.upper()
        with self._lock:
            row = self._conn.execute(
                "SELECT ticker, buy_threshold, sell_threshold "
                "FROM watchlist WHERE ticker = ?",
                (ticker,),
            ).fetchone()
        if row is None:
            return None
        return WatchItem(row["ticker"], row["buy_threshold"], row["sell_threshold"])

    # -- Recommendation state -------------------------------------------

    def get_state(self, ticker: str) -> Optional[RecommendationState]:
        """Return the last recorded recommendation for a ticker."""
        ticker = ticker.upper()
        with self._lock:
            row = self._conn.execute(
                "SELECT ticker, recommendation, score, updated_at "
                "FROM recommendation_state WHERE ticker = ?",
                (ticker,),
            ).fetchone()
        if row is None:
            return None
        return RecommendationState(
            row["ticker"], row["recommendation"], row["score"], row["updated_at"]
        )

    def set_state(self, ticker: str, recommendation: str, score: float) -> None:
        """Record the latest recommendation/score for a ticker."""
        ticker = ticker.upper()
        with self._lock:
            self._conn.execute(
                """
                INSERT INTO recommendation_state (ticker, recommendation, score, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(ticker) DO UPDATE SET
                    recommendation=excluded.recommendation,
                    score=excluded.score,
                    updated_at=CURRENT_TIMESTAMP
                """,
                (ticker, recommendation, score),
            )
            self._conn.commit()

    def close(self) -> None:
        """Close the underlying database connection."""
        with self._lock:
            self._conn.close()
