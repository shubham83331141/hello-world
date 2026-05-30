"""Tests for the watchlist store, change detection and notifiers."""

from __future__ import annotations

import numpy as np
import pandas as pd

from app.config import Settings
from app.monitor import detect_change, evaluate_recommendation, scan_watchlist
from app.notifications import Alert, ConsoleNotifier, build_notifier
from app.store import RecommendationState, WatchlistStore


def _frame(start: float, end: float, n: int = 120) -> pd.DataFrame:
    idx = pd.date_range("2024-01-01", periods=n, freq="D")
    return pd.DataFrame({"Close": np.linspace(start, end, n)}, index=idx)


# -- Store ---------------------------------------------------------------


def test_store_add_list_remove(tmp_path):
    store = WatchlistStore(str(tmp_path / "t.db"))
    store.add("aapl")
    store.add("MSFT", buy_threshold=0.5)
    items = store.list()
    assert [i.ticker for i in items] == ["AAPL", "MSFT"]
    assert store.get("MSFT").buy_threshold == 0.5

    assert store.remove("AAPL") is True
    assert store.remove("AAPL") is False
    assert [i.ticker for i in store.list()] == ["MSFT"]
    store.close()


def test_store_upsert_updates_thresholds(tmp_path):
    store = WatchlistStore(str(tmp_path / "t.db"))
    store.add("NVDA", buy_threshold=0.3)
    store.add("NVDA", buy_threshold=0.6, sell_threshold=-0.4)
    item = store.get("NVDA")
    assert item.buy_threshold == 0.6
    assert item.sell_threshold == -0.4
    store.close()


def test_store_state_roundtrip(tmp_path):
    store = WatchlistStore(str(tmp_path / "t.db"))
    assert store.get_state("AAPL") is None
    store.set_state("AAPL", "BUY", 0.5)
    state = store.get_state("AAPL")
    assert state.recommendation == "BUY"
    assert state.score == 0.5
    store.close()


# -- Change detection ----------------------------------------------------


def test_evaluate_recommendation_default_and_overrides():
    assert evaluate_recommendation(0.4) == "BUY"
    assert evaluate_recommendation(-0.4) == "SELL"
    assert evaluate_recommendation(0.0) == "HOLD"
    # Custom thresholds make BUY harder to reach.
    assert evaluate_recommendation(0.4, buy_threshold=0.6) == "HOLD"
    assert evaluate_recommendation(0.7, buy_threshold=0.6) == "BUY"


def test_detect_change_label_transitions():
    prev = RecommendationState("AAPL", "HOLD", 0.1, "now")
    assert detect_change(prev, "BUY", buy_only=False) is True
    assert detect_change(prev, "HOLD", buy_only=False) is False


def test_detect_change_first_observation():
    assert detect_change(None, "BUY", buy_only=False) is True
    assert detect_change(None, "HOLD", buy_only=False) is False


def test_detect_change_buy_only():
    hold = RecommendationState("AAPL", "HOLD", 0.1, "now")
    buy = RecommendationState("AAPL", "BUY", 0.5, "now")
    assert detect_change(hold, "BUY", buy_only=True) is True
    assert detect_change(buy, "BUY", buy_only=True) is False
    assert detect_change(hold, "SELL", buy_only=True) is False


# -- Notifiers -----------------------------------------------------------


def test_build_notifier_defaults_to_console():
    assert isinstance(build_notifier(Settings()), ConsoleNotifier)


def test_build_notifier_falls_back_when_misconfigured():
    # slack selected but no webhook url -> console fallback
    settings = Settings(notifier="slack", slack_webhook_url="")
    assert isinstance(build_notifier(settings), ConsoleNotifier)


def test_alert_body_contains_transition():
    alert = Alert("AAPL", "HOLD", "BUY", 0.42, ["bullish crossover"])
    body = alert.body()
    assert "HOLD" in body and "BUY" in body
    assert "AAPL" in body


# -- Scan integration (injected fetch/analyze) ---------------------------


class _RecordingNotifier:
    def __init__(self):
        self.alerts = []

    def send(self, alert):
        self.alerts.append(alert)


def test_scan_watchlist_fires_and_persists(tmp_path):
    store = WatchlistStore(str(tmp_path / "t.db"))
    store.add("UP")
    store.add("DOWN")
    notifier = _RecordingNotifier()
    settings = Settings()

    def fake_fetch(ticker, period, interval):
        return _frame(100.0, 200.0) if ticker == "UP" else _frame(200.0, 100.0)

    result = scan_watchlist(store, notifier, settings, fetch_history=fake_fetch)

    recs = {a.ticker: a.recommendation for a in result.analyses}
    assert recs["UP"] == "BUY"
    assert recs["DOWN"] == "SELL"
    assert len(notifier.alerts) == 2  # both are first-time actionable

    # Second scan with identical data should produce no new alerts.
    notifier.alerts.clear()
    result2 = scan_watchlist(store, notifier, settings, fetch_history=fake_fetch)
    assert notifier.alerts == []
    assert result2.alerts == []

    # State persisted.
    assert store.get_state("UP").recommendation == "BUY"
    store.close()


def test_scan_records_fetch_errors(tmp_path):
    from app.data import DataFetchError

    store = WatchlistStore(str(tmp_path / "t.db"))
    store.add("BAD")
    settings = Settings()

    def failing_fetch(ticker, period, interval):
        raise DataFetchError("no data")

    result = scan_watchlist(
        store, ConsoleNotifier(), settings, fetch_history=failing_fetch
    )
    assert "BAD" in result.errors
    assert result.analyses == []
    store.close()
