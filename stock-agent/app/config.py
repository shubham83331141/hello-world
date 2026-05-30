"""Runtime configuration sourced from environment variables.

All settings are optional and have sensible defaults so the service runs
out-of-the-box. Notification channels stay disabled until their credentials are
provided.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import List


def _split(value: str | None) -> List[str]:
    if not value:
        return []
    return [item.strip().upper() for item in value.split(",") if item.strip()]


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _as_int(value: str | None, default: int) -> int:
    try:
        return int(value) if value is not None else default
    except (TypeError, ValueError):
        return default


@dataclass
class Settings:
    """Application settings loaded from the environment."""

    # Persistence
    database_path: str = "stock_agent.db"

    # Default watchlist seeded on first run (comma-separated tickers).
    default_watchlist: List[str] = field(default_factory=list)

    # Analysis window applied during scheduled scans.
    scan_period: str = "6mo"
    scan_interval: str = "1d"

    # Scheduler
    scheduler_enabled: bool = False
    scan_interval_minutes: int = 60

    # Alerting behaviour
    alert_on_buy_only: bool = False  # if True, only BUY transitions notify

    # Notification channel: "console", "slack", or "email".
    notifier: str = "console"

    # Slack / Discord incoming webhook URL.
    slack_webhook_url: str = ""

    # Email (SMTP)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    email_from: str = ""
    email_to: List[str] = field(default_factory=list)

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            database_path=os.getenv("DATABASE_PATH", "stock_agent.db"),
            default_watchlist=_split(os.getenv("DEFAULT_WATCHLIST")),
            scan_period=os.getenv("SCAN_PERIOD", "6mo"),
            scan_interval=os.getenv("SCAN_INTERVAL", "1d"),
            scheduler_enabled=_as_bool(os.getenv("SCHEDULER_ENABLED"), False),
            scan_interval_minutes=_as_int(os.getenv("SCAN_INTERVAL_MINUTES"), 60),
            alert_on_buy_only=_as_bool(os.getenv("ALERT_ON_BUY_ONLY"), False),
            notifier=os.getenv("NOTIFIER", "console").strip().lower(),
            slack_webhook_url=os.getenv("SLACK_WEBHOOK_URL", ""),
            smtp_host=os.getenv("SMTP_HOST", ""),
            smtp_port=_as_int(os.getenv("SMTP_PORT"), 587),
            smtp_username=os.getenv("SMTP_USERNAME", ""),
            smtp_password=os.getenv("SMTP_PASSWORD", ""),
            smtp_use_tls=_as_bool(os.getenv("SMTP_USE_TLS"), True),
            email_from=os.getenv("EMAIL_FROM", ""),
            email_to=_split(os.getenv("EMAIL_TO")),
        )


def get_settings() -> "Settings":
    """Return settings loaded from the current environment."""
    return Settings.from_env()
