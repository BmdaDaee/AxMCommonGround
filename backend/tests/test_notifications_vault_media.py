import os
import re
from pathlib import Path

import pytest
import requests


# Notifications + vault media upload API regression tests.


def _read_frontend_env_base_url() -> str | None:
    env_path = Path("/app/frontend/.env")
    if not env_path.exists():
        return None
    content = env_path.read_text(encoding="utf-8")
    match = re.search(r"^REACT_APP_BACKEND_URL=(.+)$", content, flags=re.MULTILINE)
    return match.group(1).strip() if match else None


def _read_credentials() -> tuple[dict, dict]:
    creds_path = Path("/app/memory/test_credentials.md")
    if not creds_path.exists():
        pytest.skip("Missing /app/memory/test_credentials.md")

    content = creds_path.read_text(encoding="utf-8")
    a_match = re.search(r"Web paired account A:\s*`([^`]+)`\s*/\s*`([^`]+)`", content)
    b_match = re.search(r"Web paired account B:\s*`([^`]+)`\s*/\s*`([^`]+)`", content)
    if not a_match or not b_match:
        pytest.skip("Paired test credentials missing in /app/memory/test_credentials.md")

    return (
        {"email": a_match.group(1), "password": a_match.group(2)},
        {"email": b_match.group(1), "password": b_match.group(2)},
    )


@pytest.fixture(scope="session")
def base_url() -> str:
    value = os.environ.get("REACT_APP_BACKEND_URL") or _read_frontend_env_base_url()
    if not value:
        pytest.skip("REACT_APP_BACKEND_URL is not available")
    return value.rstrip("/")


@pytest.fixture(scope="session")
def client() -> requests.Session:
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def _login(client: requests.Session, base_url: str, creds: dict) -> dict:
    response = client.post(f"{base_url}/api/auth/login", json=creds, timeout=30)
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data.get("token"), str) and data["token"]
    assert data.get("user", {}).get("email", "").lower() == creds["email"].lower()
    return data


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _ensure_pair(client: requests.Session, base_url: str, headers_a: dict, headers_b: dict) -> None:
    dash_a = client.get(f"{base_url}/api/dashboard", headers=headers_a, timeout=30)
    assert dash_a.status_code == 200, dash_a.text
    if dash_a.json().get("pair"):
        return

    invite_resp = client.post(f"{base_url}/api/pairs/invite", headers=headers_a, timeout=30)
    assert invite_resp.status_code == 200, invite_resp.text
    invite = invite_resp.json()
    assert isinstance(invite.get("code"), str) and len(invite["code"]) == 8

    join_resp = client.post(
        f"{base_url}/api/pairs/join",
        headers=headers_b,
        json={"code": invite["code"]},
        timeout=30,
    )
    assert join_resp.status_code == 200, join_resp.text
    pair = join_resp.json().get("pair", {})
    assert pair.get("status") == "ACTIVE"


@pytest.fixture(scope="module")
def paired_auth(client: requests.Session, base_url: str) -> dict:
    creds_a, creds_b = _read_credentials()
    login_a = _login(client, base_url, creds_a)
    login_b = _login(client, base_url, creds_b)
    headers_a = _auth_headers(login_a["token"])
    headers_b = _auth_headers(login_b["token"])
    _ensure_pair(client, base_url, headers_a, headers_b)
    return {"a": headers_a, "b": headers_b, "user_a": login_a["user"], "user_b": login_b["user"]}


def test_notifications_summary_unread_increments_for_receiver(client: requests.Session, base_url: str, paired_auth: dict):
    marker = "TEST unread marker"
    post_response = client.post(
        f"{base_url}/api/messages",
        headers=paired_auth["b"],
        json={"content": marker},
        timeout=30,
    )
    assert post_response.status_code == 200, post_response.text
    posted = post_response.json().get("item", {})
    assert posted.get("content") == marker

    summary_response = client.get(f"{base_url}/api/notifications/summary", headers=paired_auth["a"], timeout=30)
    assert summary_response.status_code == 200, summary_response.text
    summary = summary_response.json()
    assert isinstance(summary.get("unreadMessages"), int)
    assert summary["unreadMessages"] >= 1
    assert summary.get("latestUnread", {}).get("content") == marker
    assert isinstance(summary.get("partnerPresence"), dict)
    assert summary["partnerPresence"].get("name") == paired_auth["user_b"]["name"]


def test_opening_messages_marks_unread_as_read(client: requests.Session, base_url: str, paired_auth: dict):
    before_response = client.get(f"{base_url}/api/notifications/summary", headers=paired_auth["a"], timeout=30)
    assert before_response.status_code == 200, before_response.text
    unread_before = before_response.json().get("unreadMessages", 0)

    open_messages_response = client.get(f"{base_url}/api/messages", headers=paired_auth["a"], timeout=30)
    assert open_messages_response.status_code == 200, open_messages_response.text
    assert isinstance(open_messages_response.json().get("items"), list)

    after_response = client.get(f"{base_url}/api/notifications/summary", headers=paired_auth["a"], timeout=30)
    assert after_response.status_code == 200, after_response.text
    unread_after = after_response.json().get("unreadMessages", 0)
    assert unread_after <= unread_before
    assert unread_after == 0


def test_vault_upload_stores_media_and_returns_relative_media_url(client: requests.Session, base_url: str, paired_auth: dict):
    title = "TEST media memory"
    description = "Uploaded by pytest"
    image_bytes = b"\xff\xd8\xff\xdb\x00C\x00"  # tiny jpeg header bytes for multipart smoke test

    upload_response = requests.post(
        f"{base_url}/api/vault",
        headers={"Authorization": paired_auth["a"]["Authorization"]},
        data={"title": title, "description": description, "kind": "MOMENT"},
        files=[("files", ("test-upload.jpg", image_bytes, "image/jpeg"))],
        timeout=30,
    )
    assert upload_response.status_code == 200, upload_response.text
    payload = upload_response.json()
    item = payload.get("item", {})
    assert item.get("title") == title
    assert item.get("description") == description
    assert isinstance(item.get("media"), list) and len(item["media"]) >= 1
    media = item["media"][0]
    assert media.get("name") == "test-upload.jpg"
    assert media.get("contentType") == "image/jpeg"
    assert isinstance(media.get("url"), str) and media["url"].startswith("/api/media/")


def test_vault_media_url_is_fetchable_and_entry_persists(client: requests.Session, base_url: str, paired_auth: dict):
    vault_response = client.get(f"{base_url}/api/vault", headers=paired_auth["a"], timeout=30)
    assert vault_response.status_code == 200, vault_response.text
    items = vault_response.json().get("items", [])
    with_media = next((entry for entry in items if entry.get("media")), None)
    assert with_media is not None

    media = with_media["media"][0]
    assert media.get("url", "").startswith("/api/media/")

    media_response = client.get(f"{base_url}{media['url']}", timeout=30)
    assert media_response.status_code == 200
    assert media_response.headers.get("content-type", "").startswith(("image/", "audio/", "application/octet-stream"))
