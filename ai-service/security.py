"""
Security for the AI service.

The service used to be completely open: anyone who found its address could call every endpoint,
spend the language-model and job-API quotas, and ask it to fetch any URL. This module closes that.

- Authentication: a request must carry either the signed login token the app already has
  (Authorization: Bearer ...) or, for our own backend, a shared service key (X-Service-Key).
  Enforcement switches on as soon as JWT_SECRET is configured on the service, so the rollout
  can be done in a safe order (see docs/security.md). Without it the service runs open, as it
  does on a developer's laptop, and says so in its health response.
- Rate limits per caller, so one account or one address cannot drain the quotas.
- safe_get: the only way the service fetches a URL supplied by a client. HTTPS only, only the
  job sites we scrape, every redirect re-checked, and never to private or internal addresses.
"""
import hmac
import ipaddress
import os
import socket
import threading
import time
from urllib.parse import urljoin, urlparse

import jwt
import requests
from fastapi import HTTPException, Request

PUBLIC_PATHS = {"/"}


def auth_enabled():
    return bool(os.getenv("JWT_SECRET"))


# ───────────────────────── authentication ─────────────────────────
async def require_auth(request: Request):
    """Dependency applied to every route."""
    if request.method == "OPTIONS" or request.url.path in PUBLIC_PATHS:
        return
    if not auth_enabled():
        request.state.caller = f"anon:{_client_ip(request)}"
        return

    service_key = os.getenv("AI_SERVICE_KEY", "")
    given = request.headers.get("x-service-key", "")
    if service_key and given and hmac.compare_digest(given, service_key):
        request.state.caller = "service"
        return

    header = request.headers.get("authorization", "")
    if header.lower().startswith("bearer "):
        try:
            payload = jwt.decode(header[7:], os.environ["JWT_SECRET"], algorithms=["HS256"])
            if payload.get("id"):
                request.state.caller = f"user:{payload['id']}"
                return
        except jwt.PyJWTError:
            pass
    raise HTTPException(status_code=401, detail="Not authorised")


def _client_ip(request: Request):
    # Behind the host's proxy the real address is the first X-Forwarded-For entry
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ───────────────────────── rate limiting ─────────────────────────
class _Limiter:
    def __init__(self):
        self.hits = {}
        self.lock = threading.Lock()

    def allow(self, key, limit, window):
        now = time.time()
        with self.lock:
            stamps = [t for t in self.hits.get(key, []) if now - t < window]
            if len(stamps) >= limit:
                self.hits[key] = stamps
                return False
            stamps.append(now)
            self.hits[key] = stamps
            if len(self.hits) > 5000:  # keep memory bounded
                for k in [k for k, v in self.hits.items() if not v or now - v[-1] > window]:
                    self.hits.pop(k, None)
        return True


_limiter = _Limiter()
USER_LIMIT_PER_MINUTE = int(os.getenv("AI_RATE_LIMIT_PER_MINUTE", "40"))


async def rate_limit(request: Request):
    """Dependency applied to every route, after authentication."""
    if request.method == "OPTIONS" or request.url.path in PUBLIC_PATHS:
        return
    caller = getattr(request.state, "caller", f"anon:{_client_ip(request)}")
    # Our own backend serves many students, so it gets a far higher ceiling
    limit = USER_LIMIT_PER_MINUTE * (15 if caller == "service" else 1)
    if not _limiter.allow(caller, limit, 60):
        raise HTTPException(status_code=429, detail="Too many requests. Please slow down.")


# ───────────────────────── safe outbound fetching ─────────────────────────
ALLOWED_FETCH_HOSTS = ("reed.co.uk", "adzuna.co.uk", "adzuna.com")
MAX_REDIRECTS = 3
MAX_BYTES = 2_000_000


def _host_allowed(host):
    host = (host or "").lower().rstrip(".")
    return any(host == h or host.endswith("." + h) for h in ALLOWED_FETCH_HOSTS)


def _is_public(ip):
    a = ipaddress.ip_address(ip)
    return not (a.is_private or a.is_loopback or a.is_link_local or a.is_multicast or a.is_reserved or a.is_unspecified)


def validate_fetch_url(url):
    """Return the URL if it is safe to fetch, otherwise raise ValueError."""
    parts = urlparse(str(url or "").strip())
    if parts.scheme != "https":
        raise ValueError("only https links are allowed")
    if parts.username or parts.password:
        raise ValueError("credentials in links are not allowed")
    if parts.port not in (None, 443):
        raise ValueError("unexpected port")
    if not _host_allowed(parts.hostname):
        raise ValueError("this site is not one we read job descriptions from")
    try:
        addresses = {info[4][0] for info in socket.getaddrinfo(parts.hostname, 443, proto=socket.IPPROTO_TCP)}
    except socket.gaierror:
        raise ValueError("could not resolve the address")
    if not addresses or not all(_is_public(a) for a in addresses):
        raise ValueError("address is not public")
    return parts.geturl()


def safe_get(url, headers=None, timeout=8):
    """GET a client-supplied URL without letting it reach anything but the job sites.
    Redirects are followed by hand so that every hop is checked, not just the first."""
    current = validate_fetch_url(url)
    for _ in range(MAX_REDIRECTS + 1):
        resp = requests.get(current, headers=headers, timeout=timeout, allow_redirects=False, stream=True)
        if resp.status_code in (301, 302, 303, 307, 308) and resp.headers.get("location"):
            resp.close()
            current = validate_fetch_url(urljoin(current, resp.headers["location"]))
            continue
        body = resp.raw.read(MAX_BYTES + 1, decode_content=True)
        resp.close()
        if len(body) > MAX_BYTES:
            raise ValueError("page too large")
        resp._content = body  # lets callers use resp.text and resp.status_code as usual
        resp._content_consumed = True
        return resp
    raise ValueError("too many redirects")
