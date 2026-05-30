"""One-shot watchlist scan for cron / platform schedulers.

Run with ``python -m app.scan``. It loads settings from the environment, scans
the persisted watchlist once, sends any alerts, and exits. This is the
recommended approach on platforms that provide their own scheduler (Cloud Run
Jobs, Railway cron, GitHub Actions, plain crontab, ...).
"""

from __future__ import annotations

import logging

from .config import get_settings
from .monitor import scan_watchlist
from .notifications import build_notifier
from .store import WatchlistStore


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    settings = get_settings()
    store = WatchlistStore(settings.database_path)
    notifier = build_notifier(settings)
    try:
        result = scan_watchlist(store, notifier, settings)
        logging.getLogger("stock_agent.scan").info(
            "scan complete: %d analysed, %d alerts, %d errors",
            len(result.analyses),
            len(result.alerts),
            len(result.errors),
        )
    finally:
        store.close()


if __name__ == "__main__":
    main()
