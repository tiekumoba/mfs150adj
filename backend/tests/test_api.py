import time

from fastapi.testclient import TestClient


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_health_needs_no_auth(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_me_without_token_is_401(client: TestClient) -> None:
    response = client.get("/api/v1/me")
    assert response.status_code == 401
    assert "clerk_user_id" not in response.text


def test_me_with_garbage_token_is_401(client: TestClient) -> None:
    assert client.get("/api/v1/me", headers=bearer("not-a-jwt")).status_code == 401


def test_me_with_valid_token_returns_clerk_user_id(client: TestClient, make_token) -> None:
    response = client.get("/api/v1/me", headers=bearer(make_token(sub="user_abc")))
    assert response.status_code == 200
    assert response.json() == {"clerk_user_id": "user_abc"}


def test_me_rejects_expired_token(client: TestClient, make_token) -> None:
    token = make_token(exp=int(time.time()) - 120)
    assert client.get("/api/v1/me", headers=bearer(token)).status_code == 401


def test_me_rejects_wrong_issuer(client: TestClient, make_token) -> None:
    token = make_token(iss="https://evil.example")
    assert client.get("/api/v1/me", headers=bearer(token)).status_code == 401


def test_me_accepts_allowed_authorized_party(client: TestClient, make_token) -> None:
    token = make_token(azp="http://localhost:5173")
    assert client.get("/api/v1/me", headers=bearer(token)).status_code == 200


def test_me_rejects_unknown_authorized_party(client: TestClient, make_token) -> None:
    token = make_token(azp="https://evil.example")
    assert client.get("/api/v1/me", headers=bearer(token)).status_code == 401


def test_cors_allows_configured_origin_only(client: TestClient) -> None:
    headers = {"Access-Control-Request-Method": "GET"}
    ok = client.options("/api/v1/me", headers={**headers, "Origin": "http://localhost:5173"})
    assert ok.headers["access-control-allow-origin"] == "http://localhost:5173"
    bad = client.options("/api/v1/me", headers={**headers, "Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in bad.headers
