"""
Jobs taken straight from the career pages of employers that hold a Skilled Worker
licence, instead of from a general job board.

Why: general boards return a thin, repetitive slice of the market, and the employer
name on a board often doesn't match the legal name on the Home Office register.
Here each employer is listed by hand with its exact register entry, and that entry is
checked against the live register every time the jobs are refreshed. If an employer
drops off the register its jobs disappear from results.

Coverage today is tech, fintech and AI employers that publish through Greenhouse,
Lever, Ashby or SmartRecruiters. It does not cover banks, consultancies, retailers or
the NHS: those use other systems and still come from Reed and Adzuna.
"""
import html as html_lib
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

import requests
from bs4 import BeautifulSoup, NavigableString

REFRESH_SECONDS = 6 * 60 * 60

# register: the exact organisation name(s) on the register, lower case.
# Only employers whose legal entity was checked against the register by hand are listed.
BOARDS = [
    {"name": "Monzo", "provider": "greenhouse", "token": "monzo", "register": ["monzo bank ltd"]},
    {"name": "Stripe", "provider": "greenhouse", "token": "stripe", "register": ["stripe payments uk ltd"]},
    {"name": "Anthropic", "provider": "greenhouse", "token": "anthropic", "register": ["anthropic limited"]},
    {"name": "Databricks", "provider": "greenhouse", "token": "databricks", "register": ["databricks uk limited"]},
    {"name": "Deliveroo", "provider": "greenhouse", "token": "deliveroo", "register": ["roofoods ltd t/a deliveroo"]},
    {"name": "THG", "provider": "greenhouse", "token": "thehutgroup", "register": ["thg plc"]},
    {"name": "Graphcore", "provider": "greenhouse", "token": "graphcore", "register": ["graphcore limited"]},
    {"name": "SumUp", "provider": "greenhouse", "token": "sumup", "register": ["sumup payments limited"]},
    {"name": "Anaplan", "provider": "greenhouse", "token": "anaplan", "register": ["anaplan limited"]},
    {"name": "Isomorphic Labs", "provider": "greenhouse", "token": "isomorphiclabs", "register": ["isomorphic labs limited"]},
    {"name": "Tide", "provider": "greenhouse", "token": "tide", "register": ["tide platform ltd"]},
    {"name": "Elastic", "provider": "greenhouse", "token": "elastic", "register": ["elasticsearch limited"]},
    {"name": "Datadog", "provider": "greenhouse", "token": "datadog", "register": ["datadog ireland limited"]},
    {"name": "Figma", "provider": "greenhouse", "token": "figma", "register": ["figma uk limited"]},
    {"name": "Vercel", "provider": "greenhouse", "token": "vercel", "register": ["vercel uk limited"]},
    {"name": "Reddit", "provider": "greenhouse", "token": "reddit", "register": ["reddit uk ltd"]},
    {"name": "Contentful", "provider": "greenhouse", "token": "contentful", "register": ["contentful (uk) limited"]},
    {"name": "Twilio", "provider": "greenhouse", "token": "twilio", "register": ["twilio uk limited"]},
    {"name": "MongoDB", "provider": "greenhouse", "token": "mongodb", "register": ["mongodb uk limited"]},
    {"name": "Okta", "provider": "greenhouse", "token": "okta", "register": ["okta uk ltd"]},
    {"name": "Autotrader", "provider": "greenhouse", "token": "autotrader", "register": ["autotrader limited"]},
    {"name": "GoCardless", "provider": "greenhouse", "token": "gocardless", "register": ["gocardless limited"]},
    {"name": "Adyen", "provider": "greenhouse", "token": "adyen", "register": ["adyen n.v. london branch"]},
    {"name": "The Trade Desk", "provider": "greenhouse", "token": "thetradedesk", "register": ["the uk trade desk ltd"]},
    {"name": "Robinhood", "provider": "greenhouse", "token": "robinhood", "register": ["robinhood u.k ltd."]},
    {"name": "Webflow", "provider": "greenhouse", "token": "webflow", "register": ["webflow europe uk ltd"]},
    {"name": "Airbnb", "provider": "greenhouse", "token": "airbnb", "register": ["airbnb uk limited"]},
    {"name": "Pinterest", "provider": "greenhouse", "token": "pinterest", "register": ["pinterest uk"]},
    {"name": "Asana", "provider": "greenhouse", "token": "asana", "register": ["asana software uk limited"]},
    {"name": "TrueLayer", "provider": "greenhouse", "token": "truelayer", "register": ["truelayer limited"]},
    {"name": "Octopus Energy", "provider": "lever", "token": "octoenergy", "register": ["octopus energy limited"]},
    {"name": "Palantir", "provider": "lever", "token": "palantir", "register": ["palantir technologies uk limited"]},
    {"name": "Zopa", "provider": "lever", "token": "zopa", "register": ["zopa bank limited"]},
    {"name": "Spotify", "provider": "lever", "token": "spotify", "register": ["spotify limited"]},
    {"name": "Sophos", "provider": "lever", "token": "sophos", "register": ["sophos limited"]},
    {"name": "Farfetch", "provider": "lever", "token": "farfetch", "register": ["farfetch uk limited"]},
    {"name": "MOO", "provider": "lever", "token": "moo", "register": ["moo print limited"]},
    {"name": "Faculty", "provider": "ashby", "token": "faculty", "register": ["faculty science limited"]},
    {"name": "Lendable", "provider": "ashby", "token": "lendable", "register": ["lendable operations ltd"]},
    {"name": "Wayve", "provider": "ashby", "token": "wayve", "register": ["wayve technologies ltd"]},
    {"name": "Trainline", "provider": "ashby", "token": "trainline", "register": ["trainline.com ltd"]},
    {"name": "Synthesia", "provider": "ashby", "token": "synthesia", "register": ["synthesia limited"]},
    {"name": "OpenAI", "provider": "ashby", "token": "openai", "register": ["openai uk ltd"]},
    {"name": "Multiverse", "provider": "ashby", "token": "multiverse", "register": ["multiverse group limited"]},
    {"name": "Cohere", "provider": "ashby", "token": "cohere", "register": ["cohere uk ltd"]},
    {"name": "Pleo", "provider": "ashby", "token": "pleo", "register": ["pleo technologies limited"]},
    {"name": "Paddle", "provider": "ashby", "token": "paddle", "register": ["paddle.com market limited"]},
    {"name": "Lovable", "provider": "ashby", "token": "lovable", "register": ["lovable labs uk limited"]},
    {"name": "Quantexa", "provider": "ashby", "token": "quantexa", "register": ["quantexa ltd"]},
    {"name": "Ramp", "provider": "ashby", "token": "ramp", "register": ["ramp business uk ltd"]},
    {"name": "Marshmallow", "provider": "ashby", "token": "marshmallow", "register": ["marshmallow technology ltd"]},
    {"name": "OakNorth", "provider": "ashby", "token": "oaknorth", "register": ["oaknorth bank plc"]},
    {"name": "Improbable", "provider": "ashby", "token": "improbable", "register": ["improbable worlds ltd"]},
    {"name": "Beamery", "provider": "ashby", "token": "beamery", "register": ["beamery ltd"]},
    {"name": "Plaid", "provider": "ashby", "token": "plaid", "register": ["plaid financial ltd"]},
    {"name": "Wayflyer", "provider": "ashby", "token": "wayflyer", "register": ["wayflyer uk limited"]},
    {"name": "Mollie", "provider": "ashby", "token": "mollie", "register": ["mollie b.v."]},
    {"name": "Snyk", "provider": "ashby", "token": "snyk", "register": ["snyk limited"]},
    {"name": "Wise", "provider": "smartrecruiters", "token": "wise", "register": ["wise payments limited"]},
    {"name": "ASOS", "provider": "smartrecruiters", "token": "asos", "register": ["asos.com"]},
    {"name": "Legal & General", "provider": "smartrecruiters", "token": "legalandgeneral", "register": ["legal & general resources ltd"]},
    {"name": "Gousto", "provider": "smartrecruiters", "token": "gousto", "register": ["sca investments t/a gousto"]},
]

UK_WORDS = (
    "london", "united kingdom", "england", "scotland", "wales", "northern ireland", "manchester",
    "edinburgh", "cambridge", "bristol", "glasgow", "leeds", "birmingham", "oxford", "cardiff",
    "newcastle", "belfast", "reading", "sheffield", "nottingham", "liverpool", "abingdon", "hatfield",
)

_UA = {"User-Agent": "ArivoAI/1.0 (job discovery for international students)"}


def is_uk_location(text):
    t = f" {str(text or '').lower()} "
    return " uk " in t or " gb " in t or any(w in t for w in UK_WORDS)


def clean_html(raw):
    """Job descriptions arrive as HTML, sometimes escaped twice. Return readable paragraphs."""
    if not raw:
        return ""
    text = html_lib.unescape(str(raw))
    if "<" not in text:
        return re.sub(r"[ \t]+", " ", text).strip()
    soup = BeautifulSoup(text, "html.parser")
    for li in soup.find_all("li"):
        li.replace_with(NavigableString("\n• " + li.get_text(" ", strip=True) + "\n"))
    for br in soup.find_all("br"):
        br.replace_with("\n")
    out = soup.get_text("\n")
    out = re.sub(r"[ \t ]+", " ", out)
    out = re.sub(r"\n\s*\n+", "\n\n", out)
    return out.strip()


def _money(amount, currency="GBP"):
    sym = {"GBP": "£", "USD": "$", "EUR": "€"}.get(str(currency).upper(), "")
    return f"{sym}{int(round(amount)):,}"


def _range_text(lo, hi, currency="GBP"):
    if lo and hi and lo != hi:
        return f"{_money(lo, currency)} - {_money(hi, currency)}"
    if lo or hi:
        return f"{_money(lo or hi, currency)}+" if not hi else _money(hi, currency)
    return "Salary not specified"


def _work_mode(text, remote_flag=None):
    t = str(text or "").lower()
    if "hybrid" in t:
        return "hybrid"
    if remote_flag or "remote" in t:
        return "remote"
    return "onsite"


def _contract(text):
    t = str(text or "").lower().replace("-", " ").replace("_", " ")
    if "part time" in t:
        return "part_time", ""
    if "full time" in t or "permanent" in t:
        return "full_time", "permanent" if "permanent" in t else ""
    if "contract" in t or "fixed term" in t:
        return "", "contract"
    return "", ""


_ENTRY = re.compile(r"\b(graduate|junior|jr|intern|internship|trainee|apprentice|entry[- ]level|early careers?|placement)\b", re.I)
_ASSOCIATE = re.compile(r"\bassociate\b", re.I)
_SENIOR = re.compile(r"\b(senior|sr|lead|principal|staff|head of|director|vp|vice president|chief|distinguished|fellow)\b", re.I)


def seniority(title):
    """Read from the job title only: 'entry', 'senior' or 'mid'. A hint for ranking, not a promise."""
    t = str(title or "")
    if _ENTRY.search(t):
        return "entry"
    if _SENIOR.search(t):
        return "senior"
    # "Associate Product Manager" is early-career; "Associate Director" is not (caught above)
    if _ASSOCIATE.search(t):
        return "entry"
    return "mid"


def _job(board, title, location, url, desc, created, salary, contract_text="", remote_flag=None, work_text=""):
    ct, cty = _contract(contract_text)
    desc = desc or ""
    short = desc[:300]
    if len(desc) > 300:
        short = short.rsplit(" ", 1)[0].rstrip(".,;: ") + "…"
    return {
        "company": board["name"],
        "title": str(title or "").strip(),
        "seniority": seniority(title),
        "location": location or "UK",
        "salary": salary or "Salary not specified",
        "salary_is_predicted": False,
        "visa_sponsor": True,
        "sponsor_verified_via": "register",
        "url": url,
        "source": board["provider"],
        "direct": True,
        "fetched_at": datetime.now().strftime("%Y-%m-%d"),
        "description": short,
        "description_full": desc,
        "created": created or "",
        "contract_time": ct,
        "contract_type": cty,
        "work_mode": _work_mode(f"{title} {location} {work_text}", remote_flag),
    }


# ───────────────────────── providers ─────────────────────────
def parse_greenhouse(board, data):
    jobs = []
    for j in data.get("jobs", []):
        loc = (j.get("location") or {}).get("name", "")
        if not is_uk_location(loc):
            continue
        salary = "Salary not specified"
        ranges = j.get("pay_input_ranges") or []
        if ranges:
            r = ranges[0]
            lo, hi = (r.get("min_cents") or 0) / 100, (r.get("max_cents") or 0) / 100
            salary = _range_text(lo, hi, r.get("currency_type") or "GBP")
        jobs.append(
            _job(board, j.get("title"), loc, j.get("absolute_url"), clean_html(j.get("content")),
                 (j.get("first_published") or j.get("updated_at") or "")[:10], salary)
        )
    return jobs


def parse_lever(board, data):
    jobs = []
    for j in data if isinstance(data, list) else []:
        cat = j.get("categories") or {}
        loc = cat.get("location") or ", ".join(cat.get("allLocations") or [])
        if not is_uk_location(loc):
            continue
        sr = j.get("salaryRange") or {}
        salary = _range_text(sr.get("min"), sr.get("max"), sr.get("currency") or "GBP") if sr else "Salary not specified"
        created = ""
        if j.get("createdAt"):
            created = datetime.fromtimestamp(j["createdAt"] / 1000).strftime("%Y-%m-%d")
        body = j.get("descriptionPlain") or clean_html(j.get("description"))
        for lst in j.get("lists") or []:
            body += f"\n\n{lst.get('text', '')}\n{clean_html(lst.get('content'))}"
        jobs.append(
            _job(board, j.get("text"), loc, j.get("hostedUrl"), body.strip(), created, salary,
                 cat.get("commitment", ""), work_text=j.get("workplaceType", ""))
        )
    return jobs


def parse_ashby(board, data):
    jobs = []
    for j in data.get("jobs", []):
        loc = str(j.get("location") or "")
        country = ((j.get("address") or {}).get("postalAddress") or {}).get("addressCountry", "")
        if not (is_uk_location(loc) or str(country).lower() in ("united kingdom", "gb", "uk")):
            continue
        comp = j.get("compensation") or {}
        salary = comp.get("scrapeableCompensationSalarySummary") or comp.get("compensationTierSummary") or "Salary not specified"
        # Some feeds publish a floor of zero ("£0 - £55K"), which is a missing minimum, not a salary
        salary = re.sub(r"^([£$€])\s?0(?:\.0+)?[kK]?\s*[-–]\s*", "Up to ", salary)
        jobs.append(
            _job(board, j.get("title"), loc, j.get("jobUrl"), j.get("descriptionPlain") or clean_html(j.get("descriptionHtml")),
                 str(j.get("publishedAt") or "")[:10], salary, j.get("employmentType", ""),
                 remote_flag=j.get("isRemote"))
        )
    return jobs


def _fetch_smartrecruiters(board):
    base = f"https://api.smartrecruiters.com/v1/companies/{board['token']}/postings"
    items, offset = [], 0
    while offset < 400:
        r = requests.get(base, params={"limit": 100, "offset": offset, "country": "gb"}, headers=_UA, timeout=20)
        r.raise_for_status()
        content = r.json().get("content", [])
        items += content
        if len(content) < 100:
            break
        offset += 100

    def detail(item):
        try:
            d = requests.get(f"{base}/{item['id']}", headers=_UA, timeout=20).json()
            sections = (d.get("jobAd") or {}).get("sections") or {}
            text = "\n\n".join(clean_html((sections.get(k) or {}).get("text")) for k in
                               ("companyDescription", "jobDescription", "qualifications", "additionalInformation"))
            return item, d, text.strip()
        except Exception:
            return item, {}, ""

    with ThreadPoolExecutor(8) as ex:
        return list(ex.map(detail, items))


def parse_smartrecruiters(board, detailed):
    jobs = []
    for item, d, text in detailed:
        loc_obj = item.get("location") or {}
        loc = ", ".join(x for x in (loc_obj.get("city"), loc_obj.get("country", "").upper()) if x)
        if str(loc_obj.get("country", "")).lower() != "gb" or not item.get("name"):
            continue
        emp = ((item.get("typeOfEmployment") or {}).get("label")) or ""
        jobs.append(
            _job(board, item.get("name"), loc, d.get("postingUrl") or d.get("applyUrl") or item.get("ref"), text,
                 str(item.get("releasedDate") or "")[:10], "Salary not specified", emp,
                 remote_flag=loc_obj.get("remote"))
        )
    return jobs


def fetch_board(board):
    p, t = board["provider"], board["token"]
    if p == "greenhouse":
        r = requests.get(f"https://boards-api.greenhouse.io/v1/boards/{t}/jobs", params={"content": "true", "pay_transparency": "true"}, headers=_UA, timeout=40)
        r.raise_for_status()
        return parse_greenhouse(board, r.json())
    if p == "lever":
        r = requests.get(f"https://api.lever.co/v0/postings/{t}", params={"mode": "json"}, headers=_UA, timeout=40)
        r.raise_for_status()
        return parse_lever(board, r.json())
    if p == "ashby":
        r = requests.get(f"https://api.ashbyhq.com/posting-api/job-board/{t}", params={"includeCompensation": "true"}, headers=_UA, timeout=40)
        r.raise_for_status()
        return parse_ashby(board, r.json())
    if p == "smartrecruiters":
        return parse_smartrecruiters(board, _fetch_smartrecruiters(board))
    return []


# ───────────────────────── register check ─────────────────────────
def verified_boards(sponsors):
    """Boards whose employer is on the live register. Returns (kept, dropped names)."""
    sset = {s.strip().lower() for s in sponsors}
    kept, dropped = [], []
    for b in BOARDS:
        (kept if any(r in sset for r in b["register"]) else dropped).append(b)
    return kept, [b["name"] for b in dropped]


# ───────────────────────── cache ─────────────────────────
_state = {"jobs": [], "at": 0.0, "stats": {}, "refreshing": False}
_lock = threading.Lock()
_ready = threading.Event()


def refresh(sponsors):
    """Fetch every verified board once. Never replaces a good cache with an empty one."""
    if not sponsors:
        return _state["stats"]  # cannot verify employers without the register
    boards, dropped = verified_boards(sponsors)
    jobs, failed = [], []

    def one(b):
        try:
            return b, fetch_board(b), None
        except Exception as e:  # one broken board must not take the rest down
            return b, [], str(e)

    with ThreadPoolExecutor(12) as ex:
        for b, found, err in ex.map(one, boards):
            if err:
                failed.append(b["name"])
            jobs += found
    if jobs:
        with _lock:
            _state["jobs"] = jobs
            _state["at"] = time.time()
            _state["stats"] = {
                "jobs": len(jobs),
                "employers": len({j["company"] for j in jobs}),
                "failed": failed,
                "not_on_register": dropped,
                "updated": datetime.now().isoformat(timespec="minutes"),
            }
    _ready.set()
    return _state["stats"]


def ensure_fresh(get_sponsors, wait=30):
    """Start a background refresh when the cache is empty or stale. The very first
    caller waits briefly so a cold start still returns direct jobs."""
    stale = time.time() - _state["at"] > REFRESH_SECONDS
    if stale and not _state["refreshing"]:
        _state["refreshing"] = True

        def run():
            try:
                refresh(get_sponsors())
            finally:
                _state["refreshing"] = False
                _ready.set()

        threading.Thread(target=run, daemon=True).start()
    if not _state["jobs"]:
        _ready.wait(wait)
    return _state["jobs"]


# ───────────────────────── search ─────────────────────────
_STOP = {"and", "the", "of", "for", "in", "a", "an", "to", "jobs", "job", "role", "roles", "uk", "london"}


def _tokens(text):
    out = []
    for w in re.findall(r"[a-z0-9+#.]+", str(text).lower()):
        w = w.strip(".")
        if len(w) > 3 and w.endswith("s") and not w.endswith("ss"):
            w = w[:-1]
        if w and w not in _STOP:
            out.append(w)
    return out


def search(jobs, query, location="london", limit=60):
    toks = _tokens(query)
    q = set(toks)
    if not q:
        return []
    phrase = " ".join(toks)
    loc = (location or "").strip().lower()
    anywhere = loc in ("", "uk", "united kingdom", "england", "anywhere")
    scored = []
    for j in jobs:
        if not anywhere and loc not in str(j["location"]).lower() and j["work_mode"] != "remote":
            continue
        title = set(_tokens(j["title"]))
        body = set(_tokens(j["description_full"][:800]))
        t_hits, b_hits = len(q & title), len(q & body)
        # A job qualifies when its title carries at least half the query words, or the title
        # carries one and the opening of the description carries the rest.
        if t_hits == 0 or (t_hits < len(q) / 2 and t_hits + b_hits < len(q)):
            continue
        score = t_hits * 3 + b_hits
        if phrase and phrase in " ".join(_tokens(j["title"])):
            score += 5  # the whole query appears in the title, e.g. "product manager"
        # Early-career roles suit students; senior ones rarely do
        score += {"entry": 2, "senior": -2}.get(j.get("seniority"), 0)
        scored.append((score, j.get("created", ""), j))
    scored.sort(key=lambda x: (x[0], x[1]), reverse=True)
    return [j for _, _, j in scored[:limit]]


def status():
    return dict(_state["stats"], age_minutes=round((time.time() - _state["at"]) / 60) if _state["at"] else None)
