import logging

import httpx

from app.core.config import Settings

log = logging.getLogger(__name__)

_COPY = {
    "fr": ("Votre lien de connexion Soon Finance", "Voici votre lien de connexion à Soon Finance.", "Se connecter", "Il est valable 15 minutes."),
    "en": ("Your Soon Finance sign-in link", "Here is your Soon Finance sign-in link.", "Sign in", "It is valid for 15 minutes."),
}


class EmailError(Exception):
    pass


def send_login_link(email: str, link: str, locale: str, settings: Settings) -> None:
    if not settings.resend_api_key:
        log.info("Login link for %s: %s", email, link)  # dev only: no key means no real mail
        return
    subject, intro, button, validity = _COPY.get(locale, _COPY["fr"])
    html = (
        f'<p>{intro}</p><p><a href="{link}" style="display:inline-block;padding:12px 20px;'
        f'background:#111;color:#fff;border-radius:8px;text-decoration:none">{button}</a></p><p>{validity}</p>'
    )
    try:
        httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={"from": settings.email_from, "to": [email], "subject": subject, "html": html, "text": f"{intro}\n{link}\n{validity}"},
            timeout=10,
        ).raise_for_status()
    except httpx.HTTPError as exc:
        # Message not propagated: it may include request details.
        raise EmailError(type(exc).__name__) from None
