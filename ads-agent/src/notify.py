"""Email alerts/reports over SMTP (e.g. Gmail with an app password).

Env: SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASSWORD, ALERT_FROM, ALERT_TO
(comma-separated). If SMTP isn't configured, or dry_run is set, prints instead.
"""
from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage


def send(subject: str, body: str, dry_run: bool = False) -> bool:
    host = os.environ.get("SMTP_HOST")
    to = [a.strip() for a in os.environ.get("ALERT_TO", "").split(",") if a.strip()]
    if dry_run or not host or not to:
        print(f"--- EMAIL (not sent{' - dry run' if dry_run else ' - SMTP not configured'}) ---")
        print(f"Subject: {subject}\n\n{body}\n---")
        return False
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = os.environ.get("ALERT_FROM") or os.environ.get("SMTP_USER", "")
    msg["To"] = ", ".join(to)
    msg.set_content(body)
    with smtplib.SMTP(host, int(os.environ.get("SMTP_PORT", "587")), timeout=30) as s:
        s.starttls()
        if os.environ.get("SMTP_USER"):
            s.login(os.environ["SMTP_USER"], os.environ.get("SMTP_PASSWORD", ""))
        s.send_message(msg)
    return True
