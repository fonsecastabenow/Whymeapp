"""Tests for email_service, template_service, and notification_service email integration."""

import smtplib
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch, patch as _patch

import pytest

import services.notification_service as notification_service_mod
from services.email_service import send_email
from services.template_service import render_template, _cache


# ---------------------------------------------------------------------------
# email_service tests
# ---------------------------------------------------------------------------


def test_send_email_skips_when_no_credentials():
    """Returns False and does not open an SMTP connection when credentials are empty."""
    with patch("services.email_service.settings") as mock_settings:
        mock_settings.smtp_username = ""
        mock_settings.smtp_password = ""

        with patch("smtplib.SMTP") as mock_smtp:
            result = send_email("user@example.com", "Test", "<p>hello</p>")

    assert result is False
    mock_smtp.assert_not_called()


def test_send_email_returns_true_on_success():
    """Returns True and calls SMTP methods in the right order."""
    with patch("services.email_service.settings") as mock_settings:
        mock_settings.smtp_host = "smtp.gmail.com"
        mock_settings.smtp_port = 587
        mock_settings.smtp_username = "user@gmail.com"
        mock_settings.smtp_password = "secret"
        mock_settings.smtp_from_email = "noreply@whymeapp.io"
        mock_settings.smtp_from_name = "Whyme"

        with patch("smtplib.SMTP") as mock_smtp_cls:
            # MagicMock supports context manager protocol automatically;
            # __enter__ returns mock_smtp_cls.return_value.__enter__.return_value
            mock_server = mock_smtp_cls.return_value.__enter__.return_value
            result = send_email("dest@example.com", "Subject", "<p>body</p>")

    assert result is True
    mock_server.starttls.assert_called_once()
    mock_server.login.assert_called_once_with("user@gmail.com", "secret")
    mock_server.sendmail.assert_called_once()


def test_send_email_returns_false_on_smtp_exception():
    """Returns False and does not raise when SMTP raises an exception."""
    with patch("services.email_service.settings") as mock_settings:
        mock_settings.smtp_host = "smtp.gmail.com"
        mock_settings.smtp_port = 587
        mock_settings.smtp_username = "user@gmail.com"
        mock_settings.smtp_password = "secret"
        mock_settings.smtp_from_email = "noreply@whymeapp.io"
        mock_settings.smtp_from_name = "Whyme"

        with patch("smtplib.SMTP", side_effect=smtplib.SMTPConnectError(111, "refused")):
            result = send_email("dest@example.com", "Subject", "<p>body</p>")

    assert result is False


def test_send_email_returns_false_on_network_error():
    """Returns False when a network OSError is raised."""
    with patch("services.email_service.settings") as mock_settings:
        mock_settings.smtp_host = "smtp.gmail.com"
        mock_settings.smtp_port = 587
        mock_settings.smtp_username = "user@gmail.com"
        mock_settings.smtp_password = "secret"
        mock_settings.smtp_from_email = "noreply@whymeapp.io"
        mock_settings.smtp_from_name = "Whyme"

        with patch("smtplib.SMTP", side_effect=OSError("connection refused")):
            result = send_email("dest@example.com", "Subject", "<p>body</p>")

    assert result is False


# ---------------------------------------------------------------------------
# template_service tests
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def clear_template_cache():
    """Clear the module-level template cache between tests."""
    _cache.clear()
    yield
    _cache.clear()


def test_render_template_candidate(tmp_path: Path):
    """match_candidate.html is rendered and injected into base.html."""
    templates_dir = tmp_path / "templates" / "emails"
    templates_dir.mkdir(parents=True)

    (templates_dir / "base.html").write_text(
        "<html><body>${content}</body></html>", encoding="utf-8"
    )
    (templates_dir / "match_candidate.html").write_text(
        "<p>Vaga: ${job_title} @ ${company_name}</p>", encoding="utf-8"
    )

    with patch("services.template_service._TEMPLATES_DIR", templates_dir):
        html = render_template(
            "match_candidate.html",
            {"job_title": "Engenheiro de Software", "company_name": "Acme"},
        )

    assert "Engenheiro de Software" in html
    assert "Acme" in html
    assert "<html>" in html


def test_render_template_company(tmp_path: Path):
    """match_company.html substitutes candidate_name and job_title."""
    templates_dir = tmp_path / "templates" / "emails"
    templates_dir.mkdir(parents=True)

    (templates_dir / "base.html").write_text("${content}", encoding="utf-8")
    (templates_dir / "match_company.html").write_text(
        "${candidate_name} aplicou para ${job_title}", encoding="utf-8"
    )

    with patch("services.template_service._TEMPLATES_DIR", templates_dir):
        html = render_template(
            "match_company.html",
            {"candidate_name": "Maria Silva", "job_title": "Designer"},
        )

    assert "Maria Silva" in html
    assert "Designer" in html


def test_render_template_missing_variables_leaves_placeholder(tmp_path: Path):
    """safe_substitute leaves unknown placeholders intact instead of raising."""
    templates_dir = tmp_path / "templates" / "emails"
    templates_dir.mkdir(parents=True)

    (templates_dir / "base.html").write_text("${content}", encoding="utf-8")
    (templates_dir / "partial.html").write_text(
        "Hello ${name} and ${missing_var}", encoding="utf-8"
    )

    with patch("services.template_service._TEMPLATES_DIR", templates_dir):
        html = render_template("partial.html", {"name": "Lucas"})

    assert "Lucas" in html
    assert "${missing_var}" in html


def test_render_template_rejects_path_traversal():
    """render_template raises ValueError for names with path separators."""
    with pytest.raises(ValueError):
        render_template("../secret.html", {})

    with pytest.raises(ValueError):
        render_template("subdir/template.html", {})


def test_render_template_caches_on_second_read(tmp_path: Path):
    """Template content is read from disk only once."""
    templates_dir = tmp_path / "templates" / "emails"
    templates_dir.mkdir(parents=True)

    (templates_dir / "base.html").write_text("${content}", encoding="utf-8")
    tpl = templates_dir / "cached.html"
    tpl.write_text("v1", encoding="utf-8")

    with patch("services.template_service._TEMPLATES_DIR", templates_dir):
        first = render_template("cached.html", {})
        tpl.write_text("v2", encoding="utf-8")
        second = render_template("cached.html", {})

    assert first == second  # second read came from cache, not updated file


# ---------------------------------------------------------------------------
# notification_service email integration tests
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_send_email_notification_sends_for_candidate():
    """send_email_notification calls render_template with the candidate template."""
    user_id = uuid.uuid4()
    notif = MagicMock()
    notif.id = uuid.uuid4()
    notif.user_id = user_id
    notif.type = "match_candidate"

    mock_user = MagicMock()
    mock_user.email = "candidate@example.com"

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_user

    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)

    context = {
        "job_title": "Dev",
        "company_name": "Corp",
        "candidate_name": "Ana",
        "candidate_id": str(uuid.uuid4()),
        "company_id": str(uuid.uuid4()),
        "subject": "",
    }

    with patch.object(notification_service_mod, "render_template", return_value="<html/>") as mock_render:
        with patch("asyncio.to_thread", new=AsyncMock(return_value=True)):
            await notification_service_mod.send_email_notification(session, notif, context)

    mock_render.assert_called_once_with("match_candidate.html", context)


@pytest.mark.anyio
async def test_send_email_notification_skips_unknown_type():
    """send_email_notification does nothing for unknown notification types."""
    notif = MagicMock()
    notif.id = uuid.uuid4()
    notif.user_id = uuid.uuid4()
    notif.type = "system_alert"

    mock_user = MagicMock()
    mock_user.email = "user@example.com"
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_user

    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)

    with patch.object(notification_service_mod, "render_template") as mock_render:
        with patch("asyncio.to_thread", new=AsyncMock(return_value=False)):
            await notification_service_mod.send_email_notification(session, notif, {})

    mock_render.assert_not_called()


@pytest.mark.anyio
async def test_send_email_notification_skips_missing_user():
    """send_email_notification does nothing if user is not found in the DB."""
    notif = MagicMock()
    notif.user_id = uuid.uuid4()
    notif.type = "match_candidate"

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None

    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)

    with patch.object(notification_service_mod, "render_template") as mock_render:
        await notification_service_mod.send_email_notification(session, notif, {})

    mock_render.assert_not_called()


@pytest.mark.anyio
async def test_send_email_notification_handles_render_error():
    """send_email_notification does not raise if template rendering fails."""
    notif = MagicMock()
    notif.id = uuid.uuid4()
    notif.user_id = uuid.uuid4()
    notif.type = "match_candidate"

    mock_user = MagicMock()
    mock_user.email = "user@example.com"
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_user

    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)

    with patch.object(notification_service_mod, "render_template", side_effect=FileNotFoundError("not found")):
        with patch("asyncio.to_thread", new=AsyncMock()) as mock_thread:
            await notification_service_mod.send_email_notification(session, notif, {})

    mock_thread.assert_not_called()
