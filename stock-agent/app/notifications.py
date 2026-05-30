"""Pluggable notification channels.

A notifier takes an :class:`Alert` and delivers it somewhere. The default
``ConsoleNotifier`` simply logs, which keeps the service usable with zero
configuration. Slack/Discord webhook and SMTP email notifiers are selected via
configuration.
"""

from __future__ import annotations

import json
import logging
import smtplib
import urllib.request
from dataclasses import dataclass
from email.message import EmailMessage
from typing import List, Protocol

from .config import Settings

logger = logging.getLogger("stock_agent.notifications")


@dataclass
class Alert:
    """A notification describing a recommendation change for a ticker."""

    ticker: str
    old_recommendation: str | None
    new_recommendation: str
    score: float
    rationale: List[str]

    def title(self) -> str:
        if self.old_recommendation:
            return (
                f"{self.ticker}: {self.old_recommendation} → "
                f"{self.new_recommendation}"
            )
        return f"{self.ticker}: {self.new_recommendation}"

    def body(self) -> str:
        lines = [
            self.title(),
            f"Score: {self.score:+.3f}",
        ]
        if self.rationale:
            lines.append("")
            lines.extend(f"- {reason}" for reason in self.rationale)
        return "\n".join(lines)


class Notifier(Protocol):
    """Protocol implemented by every notification channel."""

    def send(self, alert: Alert) -> None:  # pragma: no cover - interface
        ...


class ConsoleNotifier:
    """Logs alerts. Always available; the safe default."""

    def send(self, alert: Alert) -> None:
        logger.info("ALERT %s", alert.body().replace("\n", " | "))


class SlackNotifier:
    """Posts alerts to a Slack or Discord incoming webhook."""

    def __init__(self, webhook_url: str, timeout: float = 10.0) -> None:
        if not webhook_url:
            raise ValueError("a webhook URL is required for SlackNotifier")
        self._url = webhook_url
        self._timeout = timeout

    def send(self, alert: Alert) -> None:
        payload = json.dumps({"text": alert.body()}).encode("utf-8")
        request = urllib.request.Request(
            self._url,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=self._timeout) as resp:
            if resp.status >= 400:  # pragma: no cover - network dependent
                raise RuntimeError(f"webhook returned status {resp.status}")


class EmailNotifier:
    """Sends alerts as plain-text email over SMTP."""

    def __init__(self, settings: Settings) -> None:
        if not settings.smtp_host:
            raise ValueError("SMTP_HOST is required for EmailNotifier")
        if not settings.email_from or not settings.email_to:
            raise ValueError("EMAIL_FROM and EMAIL_TO are required for EmailNotifier")
        self._s = settings

    def send(self, alert: Alert) -> None:
        msg = EmailMessage()
        msg["Subject"] = f"[Stock Agent] {alert.title()}"
        msg["From"] = self._s.email_from
        msg["To"] = ", ".join(self._s.email_to)
        msg.set_content(alert.body())

        with smtplib.SMTP(self._s.smtp_host, self._s.smtp_port) as server:
            if self._s.smtp_use_tls:
                server.starttls()
            if self._s.smtp_username:
                server.login(self._s.smtp_username, self._s.smtp_password)
            server.send_message(msg)


def build_notifier(settings: Settings) -> Notifier:
    """Construct a notifier from settings, falling back to the console.

    If the selected channel is misconfigured, a warning is logged and the
    console notifier is returned so scans never crash on delivery setup.
    """
    choice = (settings.notifier or "console").lower()
    try:
        if choice == "slack":
            return SlackNotifier(settings.slack_webhook_url)
        if choice == "email":
            return EmailNotifier(settings)
    except ValueError as exc:
        logger.warning("notifier '%s' misconfigured (%s); using console", choice, exc)
        return ConsoleNotifier()

    if choice != "console":
        logger.warning("unknown notifier '%s'; using console", choice)
    return ConsoleNotifier()
