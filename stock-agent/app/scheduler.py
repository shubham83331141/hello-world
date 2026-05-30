"""Background scheduler that periodically scans the watchlist.

Uses APScheduler's ``BackgroundScheduler`` so scans run in a separate thread
inside the same process. Hosting platforms that prefer external scheduling can
instead disable this and call the ``/scan`` endpoint (or run ``python -m
app.scan``) on a cron.
"""

from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from .config import Settings
from .monitor import scan_watchlist
from .notifications import Notifier
from .store import WatchlistStore

logger = logging.getLogger("stock_agent.scheduler")


class ScanScheduler:
    """Wraps a BackgroundScheduler running periodic watchlist scans."""

    def __init__(
        self, store: WatchlistStore, notifier: Notifier, settings: Settings
    ) -> None:
        self._store = store
        self._notifier = notifier
        self._settings = settings
        self._scheduler = BackgroundScheduler(daemon=True)

    def _run_scan(self) -> None:
        try:
            result = scan_watchlist(self._store, self._notifier, self._settings)
            logger.info(
                "scan complete: %d analysed, %d alerts, %d errors",
                len(result.analyses),
                len(result.alerts),
                len(result.errors),
            )
        except Exception:  # noqa: BLE001 - keep the scheduler alive
            logger.exception("scheduled scan failed")

    def start(self) -> None:
        interval = max(1, self._settings.scan_interval_minutes)
        self._scheduler.add_job(
            self._run_scan,
            trigger="interval",
            minutes=interval,
            id="watchlist_scan",
            replace_existing=True,
        )
        self._scheduler.start()
        logger.info("scheduler started: scanning every %d minute(s)", interval)

    def shutdown(self) -> None:
        if self._scheduler.running:
            self._scheduler.shutdown(wait=False)
            logger.info("scheduler stopped")
