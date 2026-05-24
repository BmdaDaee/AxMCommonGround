import os
from pathlib import Path

import pytest
import requests


# Module: auth and session bootstrap for protected endpoints
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
ADMIN_EMAIL = "test.1779652002@example.com"
ADMIN_PASSWORD = "Password123!"


def _assert_no_mongo_id(payload):
    text = str(payload)
    assert "'_id'" not in text
    assert '"_id"' not in text


@pytest.fixture(scope="session", autouse=True)
def load_frontend_env_if_missing():
    if os.environ.get("REACT_APP_BACKEND_URL"):
        return
    env_path = Path("/app/frontend/.env")
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            os.environ["REACT_APP_BACKEND_URL"] = line.split("=", 1)[1].strip()


@pytest.fixture(scope="session")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def auth_session(api_client):
    base_url = os.environ.get("REACT_APP_BACKEND_URL")
    assert base_url, "REACT_APP_BACKEND_URL is required for API testing"

    response = api_client.post(
        f"{base_url.rstrip('/')}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=30,
    )
    if response.status_code != 200:
        pytest.skip(f"Auth failed with status {response.status_code}: {response.text}")
    payload = response.json()
    token = payload.get("session_token")
    if not token:
        pytest.skip("Auth response missing session_token")

    api_client.headers.update({"Authorization": f"Bearer {token}"})
    return {"token": token, "user": payload.get("user", {})}


# Module: authentication verification
def test_login_admin_success(api_client):
    base_url = os.environ.get("REACT_APP_BACKEND_URL")
    response = api_client.post(
        f"{base_url.rstrip('/')}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=30,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == ADMIN_EMAIL
    assert isinstance(data.get("session_token"), str) and len(data["session_token"]) > 10
    _assert_no_mongo_id(data)


# Module: AI assets and avatar integration
def test_ai_assets_shape(auth_session, api_client):
    base_url = os.environ.get("REACT_APP_BACKEND_URL")
    response = api_client.get(f"{base_url.rstrip('/')}/api/ai/assets", timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert "user_avatar" in data
    assert "couple_portrait" in data
    assert "module_art" in data
    assert isinstance(data["module_art"], list)
    assert "image_url" in data["couple_portrait"]
    _assert_no_mongo_id(data)


def test_avatar_generation_auto_creates_couple(auth_session, api_client):
    base_url = os.environ.get("REACT_APP_BACKEND_URL")
    payload = {
        "prompt": "TEST_SDET strong calm relational aesthetic",
        "zodiac_sign": "Aquarius",
        "style": "editorial mystical portrait",
    }
    response = api_client.post(f"{base_url.rstrip('/')}/api/ai/avatar", json=payload, timeout=120)
    assert response.status_code == 200
    data = response.json()
    assert data["avatar"]["asset_type"] == "user_avatar"
    assert data["couple_portrait"]["asset_type"] == "couple_portrait"
    assert data["couple_portrait"].get("auto_generated") is True
    assert data["avatar"]["image_url"].startswith("data:image/")
    assert data["couple_portrait"]["image_url"].startswith("data:image/")
    _assert_no_mongo_id(data)


# Module: horoscope generation
def test_horoscope_generation_sections(auth_session, api_client):
    base_url = os.environ.get("REACT_APP_BACKEND_URL")
    payload = {"zodiac_sign": "Aquarius", "partner_zodiac_sign": "Leo", "focus": "communication"}
    response = api_client.post(f"{base_url.rstrip('/')}/api/ai/horoscope", json=payload, timeout=90)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data.get("daily"), str) and len(data["daily"]) > 10
    assert isinstance(data.get("couple"), str) and len(data["couple"]) > 10
    assert isinstance(data.get("timing"), str) and len(data["timing"]) > 10
    _assert_no_mongo_id(data)


# Module: core repo page API coverage
@pytest.mark.parametrize(
    "endpoint",
    [
        "/api/messages",
        "/api/bently",
        "/api/deeplyus",
        "/api/journal",
        "/api/calendar",
        "/api/xp",
        "/api/missions",
        "/api/settings",
    ],
)
def test_repo_pages_related_api_availability(auth_session, api_client, endpoint):
    base_url = os.environ.get("REACT_APP_BACKEND_URL")
    # deeplyus page maps to /api/vault on backend
    final_endpoint = "/api/vault" if endpoint == "/api/deeplyus" else endpoint

    if final_endpoint == "/api/bently":
        response = api_client.post(
            f"{base_url.rstrip('/')}{final_endpoint}",
            json={"message": "TEST_SDET bently check", "mode": "solo"},
            timeout=120,
        )
    else:
        response = api_client.get(f"{base_url.rstrip('/')}{final_endpoint}", timeout=30)

    assert response.status_code in [200, 400]
    data = response.json()
    _assert_no_mongo_id(data)
