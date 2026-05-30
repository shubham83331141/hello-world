"""API tests using a stubbed data layer (no network access)."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app import data, main
from app.data import DataFetchError


def _series(start: float, end: float, n: int = 120) -> pd.DataFrame:
    idx = pd.date_range("2024-01-01", periods=n, freq="D")
    prices = np.linspace(start, end, n)
    return pd.DataFrame({"Close": prices}, index=idx)


@pytest.fixture
def client(monkeypatch):
    def fake_fetch(ticker, period="6mo", interval="1d"):
        if ticker.upper() == "BADTICKER":
            raise DataFetchError("no price data returned for BADTICKER")
        if ticker.upper() == "DOWN":
            return _series(200.0, 100.0)
        return _series(100.0, 200.0)

    monkeypatch.setattr(main, "fetch_history", fake_fetch)
    monkeypatch.setattr(data, "fetch_history", fake_fetch)
    return TestClient(main.app)


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
