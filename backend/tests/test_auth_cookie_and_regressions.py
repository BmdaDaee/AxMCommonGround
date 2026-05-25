import os
import re
from pathlib import Path

import pytest
import requests


# Auth cookie + mobile token compatibility + key regression endpoint checks.


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
def creds() -> tuple[dict, dict]:
    return _read_credentials()


def test_auth_login_sets_cookie_and_returns_token_for_mobile_consumers(base_url: str, creds: tuple[dict, dict]):
    session = requests.Session()
    response = session.post(f"{base_url}/api/auth/login", json=creds[0], timeout=30)
    assert response.status_code == 200, response.text

    data = response.json()
    assert isinstance(data.get("token"), str) and data["token"]
    assert data.get("user", {}).get("email", "").lower() == creds[0]["email"].lower()

    cookie_header = response.headers.get("set-cookie", "")
    assert "cg_session=" in cookie_header
    assert "HttpOnly" in cookie_header


def test_auth_me_works_with_cookie_session(base_url: str, creds: tuple[dict, dict]):
    session = requests.Session()
    login = session.post(f"{base_url}/api/auth/login", json=creds[0], timeout=30)
    assert login.status_code == 200, login.text

    me = session.get(f"{base_url}/api/auth/me", timeout=30)
    assert me.status_code == 200, me.text
    payload = me.json()
    assert payload.get("user", {}).get("email", "").lower() == creds[0]["email"].lower()


def test_auth_logout_clears_cookie_and_auth_me_fails_after_logout(base_url: str, creds: tuple[dict, dict]):
    session = requests.Session()
    login = session.post(f"{base_url}/api/auth/login", json=creds[0], timeout=30)
    assert login.status_code == 200, login.text

    logout = session.post(f"{base_url}/api/auth/logout", timeout=30)
    assert logout.status_code == 200, logout.text
    assert logout.json().get("success") is True

    me_after = session.get(f"{base_url}/api/auth/me", timeout=30)
    assert me_after.status_code == 401


def test_auth_me_still_works_with_bearer_token_for_mobile_clients(base_url: str, creds: tuple[dict, dict]):
    login = requests.post(f"{base_url}/api/auth/login", json=creds[0], timeout=30)
    assert login.status_code == 200, login.text
    token = login.json().get("token")
    assert isinstance(token, str) and token

    me = requests.get(f"{base_url}/api/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=30)
    assert me.status_code == 200, me.text
    assert me.json().get("user", {}).get("email", "").lower() == creds[0]["email"].lower()


def test_invite_status_and_dashboard_still_work_for_connected_account(base_url: str, creds: tuple[dict, dict]):
    login = requests.post(f"{base_url}/api/auth/login", json=creds[0], timeout=30)
    assert login.status_code == 200, login.text
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    invite_status = requests.get(f"{base_url}/api/pairs/invite-status", headers=headers, timeout=30)
    assert invite_status.status_code == 200, invite_status.text
    assert "pair" in invite_status.json()
    assert "invite" in invite_status.json()

    dashboard = requests.get(f"{base_url}/api/dashboard", headers=headers, timeout=30)
    assert dashboard.status_code == 200, dashboard.text
    dashboard_data = dashboard.json()
    assert "user" in dashboard_data
    assert "notifications" in dashboard_data


def test_notifications_vault_and_bently_endpoints_regression(base_url: str, creds: tuple[dict, dict]):
    login = requests.post(f"{base_url}/api/auth/login", json=creds[0], timeout=30)
    assert login.status_code == 200, login.text
    token = login.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    notifications = requests.get(f"{base_url}/api/notifications/summary", headers=headers, timeout=30)
    assert notifications.status_code == 200, notifications.text
    summary = notifications.json()
    assert isinstance(summary.get("unreadMessages"), int)

    vault = requests.get(f"{base_url}/api/vault", headers=headers, timeout=30)
    assert vault.status_code == 200, vault.text
    assert isinstance(vault.json().get("items"), list)

    bently = requests.post(
        f"{base_url}/api/bently",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"message": "Share one short grounding suggestion."},
        timeout=45,
    )
    assert bently.status_code == 200, bently.text
    bently_payload = bently.json()
    assert isinstance(bently_payload.get("response"), str) and bently_payload["response"].strip()
    assert isinstance(bently_payload.get("xp"), int)
