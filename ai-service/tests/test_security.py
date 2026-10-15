import sys
import os
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import jwt
import pytest
from fastapi.testclient import TestClient

import main
import security

SECRET = "test-secret-" + "x" * 40
client = TestClient(main.app)
CHEAP = "/jobs/sponsor-boards/status"  # a route that does no heavy work


@pytest.fixture(autouse=True)
def _env(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", SECRET)
    monkeypatch.setenv("AI_SERVICE_KEY", "service-key-" + "y" * 30)
    security._limiter.hits.clear()


def token(uid="u1", secret=SECRET, **extra):
    return jwt.encode({"id": uid, **extra}, secret, algorithm="HS256")


def bearer(t):
    return {"Authorization": f"Bearer {t}"}


# ───────────── authentication ─────────────
def test_health_check_is_public_and_reports_auth_state():
    r = client.get("/")
    assert r.status_code == 200 and r.json()["auth"] == "on"


def test_no_credentials_is_refused():
    assert client.get(CHEAP).status_code == 401


def test_valid_login_token_is_accepted():
    assert client.get(CHEAP, headers=bearer(token())).status_code == 200


def test_token_signed_with_another_secret_is_refused():
    assert client.get(CHEAP, headers=bearer(token(secret="another-secret-" + "z" * 40))).status_code == 401


def test_expired_token_is_refused():
    assert client.get(CHEAP, headers=bearer(token(exp=int(time.time()) - 60))).status_code == 401


def test_unsigned_none_algorithm_token_is_refused():
    forged = jwt.encode({"id": "attacker"}, key=None, algorithm="none")
    assert client.get(CHEAP, headers=bearer(forged)).status_code == 401


def test_token_without_a_user_id_is_refused():
    assert client.get(CHEAP, headers=bearer(jwt.encode({"foo": "bar"}, SECRET, algorithm="HS256"))).status_code == 401


def test_garbage_authorization_header_is_refused():
    assert client.get(CHEAP, headers={"Authorization": "Bearer not.a.jwt"}).status_code == 401
    assert client.get(CHEAP, headers={"Authorization": "Basic abc"}).status_code == 401


def test_service_key_is_accepted_and_a_wrong_one_is_not():
    assert client.get(CHEAP, headers={"X-Service-Key": os.environ["AI_SERVICE_KEY"]}).status_code == 200
    assert client.get(CHEAP, headers={"X-Service-Key": "wrong"}).status_code == 401


def test_without_a_configured_secret_the_service_stays_open_for_local_development(monkeypatch):
    monkeypatch.delenv("JWT_SECRET")
    assert client.get(CHEAP).status_code == 200
    assert client.get("/").json()["auth"] == "off"


def test_every_data_route_requires_auth():
    # Guards against adding a new route and forgetting to protect it
    open_routes = []
    for route in main.app.routes:
        path = getattr(route, "path", "")
        methods = getattr(route, "methods", set()) or set()
        if path in ("/", "/docs", "/openapi.json", "/redoc", "/docs/oauth2-redirect") or "OPTIONS" in methods and len(methods) == 1:
            continue
        for m in methods - {"HEAD", "OPTIONS"}:
            r = client.request(m, path, json={})
            if r.status_code != 401:
                open_routes.append((m, path, r.status_code))
    assert open_routes == []


# ───────────── rate limiting ─────────────
def test_rate_limit_is_per_caller(monkeypatch):
    monkeypatch.setattr(security, "USER_LIMIT_PER_MINUTE", 3)
    a = bearer(token("alice"))
    assert [client.get(CHEAP, headers=a).status_code for _ in range(4)] == [200, 200, 200, 429]
    assert client.get(CHEAP, headers=bearer(token("bob"))).status_code == 200  # others unaffected


def test_the_backend_service_gets_a_higher_ceiling(monkeypatch):
    monkeypatch.setattr(security, "USER_LIMIT_PER_MINUTE", 2)
    h = {"X-Service-Key": os.environ["AI_SERVICE_KEY"]}
    assert all(client.get(CHEAP, headers=h).status_code == 200 for _ in range(10))


# ───────────── input limits ─────────────
def test_oversized_request_bodies_are_refused():
    r = client.post("/jobs/search", headers={**bearer(token()), "Content-Type": "application/json"}, content=b'{"query":"' + b"a" * 1_200_000 + b'"}')
    assert r.status_code == 413


def test_overlong_fields_are_rejected():
    r = client.post("/chat", headers=bearer(token()), json={"message": "x" * 5000, "session_id": "s", "mode": "general"})
    assert r.status_code == 422


def test_pdf_upload_must_really_be_a_pdf():
    r = client.post("/extract-pdf", headers=bearer(token()), files={"file": ("cv.pdf", b"<html>not a pdf</html>", "application/pdf")})
    assert r.status_code == 400


# ───────────── CORS ─────────────
def test_cors_allows_the_real_site_and_not_strangers():
    ok = client.options(CHEAP, headers={"Origin": "https://arivo-ai-xi.vercel.app", "Access-Control-Request-Method": "GET"})
    assert ok.headers.get("access-control-allow-origin") == "https://arivo-ai-xi.vercel.app"
    assert "access-control-allow-credentials" not in ok.headers
    bad = client.options(CHEAP, headers={"Origin": "https://evil.example.com", "Access-Control-Request-Method": "GET"})
    assert bad.headers.get("access-control-allow-origin") is None


# ───────────── server-side request forgery ─────────────
@pytest.fixture
def public_dns(monkeypatch):
    monkeypatch.setattr(security.socket, "getaddrinfo", lambda *a, **k: [(2, 1, 6, "", ("93.184.216.34", 443))])


@pytest.mark.parametrize(
    "url",
    [
        "http://www.reed.co.uk/jobs/1",  # not https
        "https://169.254.169.254/latest/meta-data/",  # cloud metadata address
        "https://localhost/admin",
        "https://127.0.0.1/",
        "https://evil.example.com/?u=www.reed.co.uk",
        "https://reed.co.uk.evil.com/jobs/1",  # looks like the real host
        "https://www.reed.co.uk@evil.com/",  # credentials trick
        "https://www.reed.co.uk:8443/",  # unexpected port
        "file:///etc/passwd",
        "gopher://www.reed.co.uk/",
        "",
    ],
)
def test_unsafe_urls_are_refused(url, public_dns):
    with pytest.raises(ValueError):
        security.validate_fetch_url(url)


def test_job_site_urls_are_allowed(public_dns):
    assert security.validate_fetch_url("https://www.reed.co.uk/jobs/data-analyst/12345").startswith("https://www.reed.co.uk/")
    assert security.validate_fetch_url("https://www.adzuna.co.uk/jobs/details/99").startswith("https://www.adzuna.co.uk/")


def test_an_allowed_host_that_resolves_to_an_internal_address_is_refused(monkeypatch):
    monkeypatch.setattr(security.socket, "getaddrinfo", lambda *a, **k: [(2, 1, 6, "", ("10.0.0.5", 443))])
    with pytest.raises(ValueError):
        security.validate_fetch_url("https://www.reed.co.uk/jobs/1")


def test_a_redirect_to_an_internal_address_is_refused(monkeypatch, public_dns):
    class Redirect:
        status_code = 302
        headers = {"location": "https://169.254.169.254/latest/meta-data/"}

        def close(self):
            pass

    monkeypatch.setattr(security.requests, "get", lambda *a, **k: Redirect())
    with pytest.raises(ValueError):
        security.safe_get("https://www.reed.co.uk/jobs/1")


def test_scrape_endpoint_does_not_reach_internal_addresses(monkeypatch):
    called = []
    monkeypatch.setattr(security.requests, "get", lambda *a, **k: called.append(a) or None)
    r = client.post("/jobs/scrape-description", headers=bearer(token()), json={"url": "https://169.254.169.254/latest/meta-data/", "source": "adzuna"})
    assert r.status_code == 200 and r.json()["success"] is False
    assert called == []  # no outbound request was even attempted
