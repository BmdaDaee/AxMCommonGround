import os
import re

import pytest
import requests


# Pair setup utility test for UI regression prerequisites.


def _creds() -> tuple[dict, dict]:
    content = open('/app/memory/test_credentials.md', 'r', encoding='utf-8').read()
    a = re.search(r"Web paired account A:\s*`([^`]+)`\s*/\s*`([^`]+)`", content)
    b = re.search(r"Web paired account B:\s*`([^`]+)`\s*/\s*`([^`]+)`", content)
    if not a or not b:
        pytest.skip('Missing paired creds')
    return (
        {'email': a.group(1), 'password': a.group(2)},
        {'email': b.group(1), 'password': b.group(2)},
    )


def _base_url() -> str:
    backend_path = os.environ.get('REACT_APP_BACKEND_URL')
    origin = os.environ.get('FRONTEND_ORIGIN')
    if not backend_path:
        pytest.skip('REACT_APP_BACKEND_URL is not set')
    backend_path = backend_path.rstrip('/')
    if backend_path.startswith('http'):
        return backend_path
    if not origin:
        pytest.skip('FRONTEND_ORIGIN is required when REACT_APP_BACKEND_URL is relative')
    return f"{origin.rstrip('/')}{backend_path}"


def _login(client: requests.Session, base_url: str, creds: dict) -> str:
    resp = client.post(f"{base_url}/auth/login", json=creds, timeout=20)
    assert resp.status_code == 200, resp.text
    token = resp.json().get('token')
    assert token
    return token


def test_setup_pair_for_accounts_a_b():
    base_url = _base_url()
    a, b = _creds()
    client = requests.Session()

    token_a = _login(client, base_url, a)
    token_b = _login(client, base_url, b)
    headers_a = {'Authorization': f'Bearer {token_a}', 'Content-Type': 'application/json'}
    headers_b = {'Authorization': f'Bearer {token_b}', 'Content-Type': 'application/json'}

    dash_a = client.get(f"{base_url}/dashboard", headers=headers_a, timeout=20)
    assert dash_a.status_code == 200
    if dash_a.json().get('pair'):
        assert dash_a.json()['pair'].get('status') in ['ACTIVE', 'PENDING', 'DISSOLVED']
        if dash_a.json()['pair'].get('status') == 'ACTIVE':
            return

    invite_resp = client.post(f"{base_url}/pairs/invite", headers=headers_a, timeout=20)
    assert invite_resp.status_code == 200
    code = invite_resp.json().get('code')
    assert isinstance(code, str) and len(code) == 8

    join_resp = client.post(f"{base_url}/pairs/join", headers=headers_b, json={'code': code}, timeout=20)
    assert join_resp.status_code == 200, join_resp.text
    pair = join_resp.json().get('pair', {})
    assert pair.get('status') == 'ACTIVE'
