"""Watchlist scanning with change detection.

This module ties together the data layer, the analysis engine, the persistence
store and the notifier. It is written so the data/analysis functions can be
injected, which keeps it fully testable without network access.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Callable, List, Optional

import pandas as pd

from .analysis import analyze as default_analyze
from .config import Settings
from .data import DataFetchError
from .data import fetch_history as default_fetch_history
from .models import Analysis
from .notifications import Alert, Notifier
from .store import RecommendationState, WatchItem, WatchlistStore

logger = logging.getLogger("stock_agent.monitor")

FetchFn = Callable[[str, str, str], pd.DataFrame]
AnalyzeFn = Callable[[str, pd.DataFrame], Analysis]


@dataclass
class ScanResult:
    """Outcome of scanning the whole watchlist."""

    analyses: List[Analysis]
    alerts: List[Alert]
    errors: dict[str, str]


def evaluate_recommendation(
    score: float,
    buy_threshold: Optional[float] = None,
    sell_threshold: Optional[float] = None,
) -> str:
    """Map a score to BUY/HOLD/SELL, honouring per-ticker thresholds.

    Falls back to the default global cut-offs (+0.3 / -0.3) when a per-ticker
    threshold is not supplied.
    """
    buy = buy_threshold if buy_threshold is not None else 0.3
    sell = sell_threshold if sell_threshold is not None else -0.3
    if score >= buy:
        return "BUY"
    if score <= sell:
        return "SELL"
    return "HOLD"


def detect_change(
    previous: Optional[RecommendationState],
    new_recommendation: str,
    buy_only: bool,
) -> bool:
    """Decide whether a recommendation change warrants an alert.

    * ``buy_only`` — alert only when a ticker newly becomes a BUY.
    * otherwise — alert whenever the recommendation label changes (including the
      first time a ticker is evaluated and lands on BUY or SELL).
    """
    old = previous.recommendation if previous else None

    if buy_only:
        return new_recommendation == "BUY" and old != "BUY"

    if old is None:
        # First observation: only notify if it's actionable.
        return new_recommendation in {"BUY", "SELL"}

    return new_recommendation != old


def scan_watchlist(
    store: WatchlistStore,
    notifier: Notifier,
    settings: Settings,
    fetch_history: Optional[FetchFn] = None,
    analyze: Optional[AnalyzeFn] = None,
) -> ScanResult:
    """Analyze every watched ticker and notify on meaningful changes."""
    # Resolve defaults at call time so they can be monkeypatched in tests and
    # so the module-level functions remain the single source of truth.
    fetch = fetch_history or default_fetch_history
    analyze_fn = analyze or default_analyze

    analyses: List[Analysis] = []
    alerts: List[Alert] = []
    errors: dict[str, str] = {}

    for item in store.list():
        try:
            history = fetch(
                item.ticker, settings.scan_period, settings.scan_interval
            )
            analysis = analyze_fn(item.ticker, history)
        except (DataFetchError, ValueError) as exc:
            errors[item.ticker] = str(exc)
            logger.warning("scan failed for %s: %s", item.ticker, exc)
            continue

        # Apply any per-ticker threshold overrides.
        recommendation = evaluate_recommendation(
            analysis.score, item.buy_threshold, item.sell_threshold
        )
        analysis.recommendation = recommendation
        analyses.append(analysis)

        previous = store.get_state(item.ticker)
        if detect_change(previous, recommendation, settings.alert_on_buy_only):
            alert = Alert(
                ticker=item.ticker,
                old_recommendation=previous.recommendation if previous else None,
                new_recommendation=recommendation,
                score=analysis.score,
                rationale=analysis.rationale,
            )
            try:
                notifier.send(alert)
                alerts.append(alert)
            except Exception as exc:  # noqa: BLE001 - delivery must not break scan
                errors[item.ticker] = f"notification failed: {exc}"
                logger.error("notification failed for %s: %s", item.ticker, exc)

        store.set_state(item.ticker, recommendation, analysis.score)

    return ScanResult(analyses=analyses, alerts=alerts, errors=errors)
