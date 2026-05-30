"""API tests using a stubbed data layer (no network access)."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app import data, main
from app import monitor
from app.data import DataFetchError


def _series(start: float, end: float, n: int = 120) -> pd.DataFrame:
    idx = pd.date_range("2024-01-01", periods=n, freq="D")
    prices = np.linspace(start, end, n)
    return pd.DataFrame({"Close": prices}, index=idx)


@pytest.fixture
def client(monkeypatch, tmp_path):
    def fake_fetch(ticker, period="6mo", interval="1d"):
        if ticker.upper() == "BADTICKER":
            raise DataFetchError("no price data returned for BADTICKER")
        if ticker.upper() == "DOWN":
            return _series(200.0, 100.0)
        return _series(100.0, 200.0)

    # Use an isolated database for each test run.
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "test.db"))
    monkeypatch.setattr(main, "fetch_history", fake_fetch)
    monkeypatch.setattr(data, "fetch_history", fake_fetch)
    # monitor binds fetch_history at import time; patch its default too.
    monkeypatch.setattr(monitor, "default_fetch_history", fake_fetch)
    with TestClient(main.app) as test_client:
        yield test_client


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_analyze_endpoint(client):
    resp = client.get("/analyze/UP")
    assert resp.status_code == 200
    body = resp.json()
    assert body["ticker"] == "UP"
    assert body["score"] > 0


def test_analyze_bad_ticker_returns_502(client):
    resp = client.get("/analyze/BADTICKER")
    assert resp.status_code == 502


def test_recommend_ranks_and_collects_errors(client):
    resp = client.post(
        "/recommend",
        json={"tickers": ["DOWN", "UP", "BADTICKER"], "period": "6mo"},
    )
    assert resp.status_code == 200
    body = resp.json()
    tickers = [r["ticker"] for r in body["results"]]
    assert tickers == ["UP", "DOWN"]  # ranked best-first
    assert "BADTICKER" in body["errors"]


def test_recommend_top_n(client):
    resp = client.post(
        "/recommend",
        json={"tickers": ["DOWN", "UP"], "top": 1},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["results"]) == 1
    assert body["results"][0]["ticker"] == "UP"


def test_watchlist_crud_and_scan(client):
    # Initially empty.
    assert client.get("/watchlist").json()["items"] == []

    # Add two tickers.
    assert client.put("/watchlist/up").status_code == 200
    assert client.put("/watchlist/down").status_code == 200
    tickers = [i["ticker"] for i in client.get("/watchlist").json()["items"]]
    assert tickers == ["DOWN", "UP"]

    # Scan should analyse both and alert on the first actionable observation.
    resp = client.post("/scan")
    assert resp.status_code == 200
    body = resp.json()
    recs = {r["ticker"]: r["recommendation"] for r in body["results"]}
    assert recs["UP"] == "BUY"
    assert recs["DOWN"] == "SELL"
    assert len(body["alerts"]) == 2

    # A second scan with unchanged data fires no alerts.
    assert client.post("/scan").json()["alerts"] == []

    # Remove a ticker.
    assert client.delete("/watchlist/up").status_code == 200
    assert client.delete("/watchlist/up").status_code == 404
    tickers = [i["ticker"] for i in client.get("/watchlist").json()["items"]]
    assert tickers == ["DOWN"]


def test_watchlist_threshold_override(client):
    # A high buy threshold keeps an uptrend from triggering BUY.
    client.put("/watchlist/up", params={"buy_threshold": 0.95})
    body = client.post("/scan").json()
    recs = {r["ticker"]: r["recommendation"] for r in body["results"]}
    assert recs["UP"] in {"HOLD", "SELL"}
