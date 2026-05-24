import os
import re
from datetime import datetime, timedelta

import pytest
import requests


# Core API flow tests for auth, pairing, dashboard, messages, bently, journal, missions, calendar, settings.


def _read_credentials() -> dict:
    path = "/app/memory/test_credentials.md"
    if not os.path.exists(path):
        pytest.skip("Missing /app/memory/test_credentials.md")
    content = open(path, "r", encoding="utf-8").read()

    a_match = re.search(r"Web paired account A:\s*`([^`]+)`\s*/\s*`([^`]+)`", content)
    b_match = re.search(r"Web paired account B:\s*`([^`]+)`\s*/\s*`([^`]+)`", content)
    if not a_match or not b_match:
        pytest.skip("Paired test credentials missing in /app/memory/test_credentials.md")

    return {
        "a": {"email": a_match.group(1), "password": a_match.group(2)},
        "b": {"email": b_match.group(1), "password": b_match.group(2)},
    }


@pytest.fixture(scope="session")
def base_url() -> str:
    backend_path = os.environ.get("REACT_APP_BACKEND_URL")
    frontend_origin = os.environ.get("FRONTEND_ORIGIN")
    if not backend_path:
        pytest.skip("REACT_APP_BACKEND_URL is not set")

    backend_path = backend_path.rstrip("/")
    if backend_path.startswith("http"):
        return backend_path

    if not frontend_origin:
        pytest.skip("FRONTEND_ORIGIN is required when REACT_APP_BACKEND_URL is relative")

    return f"{frontend_origin.rstrip('/')}{backend_path}"


@pytest.fixture(scope="session")
def api_client() -> requests.Session:
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def creds() -> dict:
    return _read_credentials()


def _login(api_client: requests.Session, base_url: str, email: str, password: str) -> dict:
    response = api_client.post(
        f"{base_url}/auth/login",
        json={"email": email, "password": password},
        timeout=20,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data.get("token"), str) and data["token"]
    assert data["user"]["email"].lower() == email.lower()
    return data


def test_health(base_url: str, api_client: requests.Session):
    response = api_client.get(f"{base_url}/health", timeout=20)
    assert response.status_code == 200
    assert response.json().get("status") == "ok"


def test_auth_login_paired_account_a(base_url: str, api_client: requests.Session, creds: dict):
    data = _login(api_client, base_url, creds["a"]["email"], creds["a"]["password"])
    assert data["user"].get("id")


def test_auth_login_paired_account_b(base_url: str, api_client: requests.Session, creds: dict):
    data = _login(api_client, base_url, creds["b"]["email"], creds["b"]["password"])
    assert data["user"].get("id")


@pytest.fixture()
def auth_a(api_client: requests.Session, base_url: str, creds: dict) -> dict:
    data = _login(api_client, base_url, creds["a"]["email"], creds["a"]["password"])
    return {"Authorization": f"Bearer {data['token']}"}


def test_pair_invite_status(base_url: str, api_client: requests.Session, auth_a: dict):
    response = api_client.get(f"{base_url}/pairs/invite-status", headers=auth_a, timeout=20)
    assert response.status_code == 200
    data = response.json()
    assert "pair" in data
    assert "invite" in data


def test_dashboard_payload(base_url: str, api_client: requests.Session, auth_a: dict):
    response = api_client.get(f"{base_url}/dashboard", headers=auth_a, timeout=20)
    assert response.status_code == 200
    data = response.json()
    assert "user" in data
    if data.get("pair"):
        assert "state" in data and "metrics" in data["state"]
        assert "stats" in data and isinstance(data["stats"].get("messages"), int)


def test_messages_get(base_url: str, api_client: requests.Session, auth_a: dict):
    response = api_client.get(f"{base_url}/messages", headers=auth_a, timeout=20)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert isinstance(data["items"], list)


def test_messages_post(base_url: str, api_client: requests.Session, auth_a: dict):
    get_response = api_client.get(f"{base_url}/messages", headers=auth_a, timeout=20)
    assert get_response.status_code == 200
    pair_exists = bool(get_response.json().get("pair"))
    if not pair_exists:
        pytest.skip("Account A not paired; skipping message create")

    marker = f"TEST_API_{datetime.utcnow().isoformat()}"
    post_response = api_client.post(
        f"{base_url}/messages",
        headers=auth_a,
        json={"content": marker},
        timeout=20,
    )
    assert post_response.status_code == 200
    item = post_response.json().get("item", {})
    assert item.get("content") == marker

    verify_response = api_client.get(f"{base_url}/messages", headers=auth_a, timeout=20)
    assert verify_response.status_code == 200
    messages = verify_response.json().get("items", [])
    assert any(m.get("content") == marker for m in messages)


def test_bently_endpoint(base_url: str, api_client: requests.Session, auth_a: dict):
    prompt = "Give one concise relationship grounding tip."
    response = api_client.post(
        f"{base_url}/bently",
        headers=auth_a,
        json={"message": prompt},
        timeout=40,
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data.get("response"), str) and len(data["response"].strip()) > 0
    assert isinstance(data.get("xp"), int)
    assert isinstance(data.get("rank"), str)


def test_journal_create_and_get(base_url: str, api_client: requests.Session, auth_a: dict):
    marker = f"TEST Journal {datetime.utcnow().isoformat()}"
    create_response = api_client.post(
        f"{base_url}/journal",
        headers=auth_a,
        json={"prompt": "What felt true today?", "content": marker, "mood": "Reflective"},
        timeout=20,
    )
    assert create_response.status_code == 200
    created = create_response.json().get("item", {})
    assert created.get("content") == marker

    get_response = api_client.get(f"{base_url}/journal", headers=auth_a, timeout=20)
    assert get_response.status_code == 200
    items = get_response.json().get("items", [])
    assert any(entry.get("content") == marker for entry in items)


def test_missions_get_and_complete(base_url: str, api_client: requests.Session, auth_a: dict):
    get_response = api_client.get(f"{base_url}/missions", headers=auth_a, timeout=20)
    assert get_response.status_code == 200
    items = get_response.json().get("items", [])
    assert isinstance(items, list)
    if not items:
        pytest.skip("No missions available; likely no active pair")

    target = next((item for item in items if not item.get("completed")), items[0])
    patch_response = api_client.patch(f"{base_url}/missions/{target['id']}", headers=auth_a, timeout=20)
    assert patch_response.status_code == 200
    updated = patch_response.json().get("item", {})
    assert updated.get("id") == target["id"]
    assert updated.get("completed") is True

    verify_response = api_client.get(f"{base_url}/missions", headers=auth_a, timeout=20)
    assert verify_response.status_code == 200
    verify_items = verify_response.json().get("items", [])
    verify_target = next((item for item in verify_items if item.get("id") == target["id"]), None)
    assert verify_target is not None
    assert verify_target.get("completed") is True


def test_calendar_get_and_create(base_url: str, api_client: requests.Session, auth_a: dict):
    get_response = api_client.get(f"{base_url}/calendar", headers=auth_a, timeout=20)
    assert get_response.status_code == 200
    initial_items = get_response.json().get("items", [])
    if initial_items == []:
        dashboard = api_client.get(f"{base_url}/dashboard", headers=auth_a, timeout=20).json()
        if not dashboard.get("pair"):
            pytest.skip("No active pair; calendar create requires pair")

    now = datetime.utcnow().replace(second=0, microsecond=0)
    later = now + timedelta(hours=1)
    title = f"TEST event {now.isoformat()}"
    create_response = api_client.post(
        f"{base_url}/calendar",
        headers=auth_a,
        json={
            "title": title,
            "description": "Created by pytest",
            "location": "Test Room",
            "startDate": now.isoformat(),
            "endDate": later.isoformat(),
            "eventType": "CHECK_IN",
        },
        timeout=20,
    )
    assert create_response.status_code == 200
    created = create_response.json().get("item", {})
    assert created.get("title") == title

    verify_response = api_client.get(f"{base_url}/calendar", headers=auth_a, timeout=20)
    assert verify_response.status_code == 200
    verify_items = verify_response.json().get("items", [])
    assert any(event.get("title") == title for event in verify_items)


def test_settings_get_and_save(base_url: str, api_client: requests.Session, auth_a: dict):
    get_response = api_client.get(f"{base_url}/settings", headers=auth_a, timeout=20)
    assert get_response.status_code == 200
    settings = get_response.json().get("settings")
    assert isinstance(settings, dict)

    updated = {
        "notifications": bool(settings.get("notifications", True)),
        "weeklyDigest": not bool(settings.get("weeklyDigest", True)),
        "language": settings.get("language", "English"),
        "theme": settings.get("theme", "Editorial Earth"),
    }
    put_response = api_client.put(f"{base_url}/settings", headers=auth_a, json=updated, timeout=20)
    assert put_response.status_code == 200
    saved = put_response.json().get("settings", {})
    assert saved.get("weeklyDigest") == updated["weeklyDigest"]

    verify = api_client.get(f"{base_url}/settings", headers=auth_a, timeout=20)
    assert verify.status_code == 200
    assert verify.json().get("settings", {}).get("weeklyDigest") == updated["weeklyDigest"]
