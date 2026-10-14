"""
The Sponsorship Scout's reasoning: read a posting for what it says about sponsorship, score how
well a role fits a student, and pick a short list with the evidence for each pick.

Design rules, in line with the rest of Arivo:
- Wording is found with plain patterns, not guessed by a model. Every result carries the exact
  sentence from the posting, so nothing is invented and the student can check it.
- "unclear" is the default. A posting that says nothing about sponsorship is not a "no".
- Only employers on the register are picked, and the reason for each pick lists facts only.
- A posting is not a promise. Nothing here says a role will sponsor; it says what the text says.
"""
import re

# ───────────────────────── sponsorship wording ─────────────────────────
_NEG = [
    r"\b(?:unable|not able|cannot|can't|can not|won't|will not|do not|don't|does not|doesn't|not in a position)\b[^.\n]{0,70}\bsponsor",
    r"\bno\s+(?:visa\s+)?sponsorship\b",
    r"\bsponsorship\b[^.\n]{0,25}\b(?:is\s+)?(?:not|unavailable)\b",
    r"\bnot\b[^.\n]{0,30}\b(?:offer|provid|support)\w*[^.\n]{0,30}\bsponsor",
    r"\bwithout\s+(?:the\s+need\s+for\s+|requiring\s+|needing\s+|any\s+)?(?:visa\s+|employer\s+)?sponsorship\b",
    r"\bsponsorship\b[^.\n]{0,40}\b(?:will not|cannot|can't|won't)\s+be\s+(?:offered|provided|available)\b",
]
_POS = [
    r"\b(?:visa\s+)?sponsorship\b[^.\n]{0,25}\b(?:is\s+|are\s+)?(?:available|offered|provided|possible|supported)\b",
    r"\b(?:we|company|employer)\b[^.\n]{0,40}\b(?:can|will|are able to|may|do|offer|provide|happy to)\b[^.\n]{0,40}\bsponsor",
    r"\blicen[cs]ed\s+(?:visa\s+)?sponsor\b",
    r"\bskilled worker\b[^.\n]{0,60}\bsponsor|\bsponsor\b[^.\n]{0,60}\bskilled worker\b",
]
_RTW = [r"\bright to work\s+(?:in|within)\s+the\s+(?:uk|united kingdom)\b"]
# Wording that sounds like sponsorship but only helps people who already hold permission to
# work: transferring a visa sponsored elsewhere, internal moves, or "you will not need sponsorship".
_EXISTING = [
    r"\btransfer\w*\s+(?:of\s+)?(?:an?\s+)?(?:existing\s+)?(?:visa\s+)?sponsorship\b",
    r"\binternal\s+visas?\b",
    r"\b(?:not|never)\s+(?:need|require)\w*\b[^.\n]{0,40}\bsponsor",
]


def _compile(patterns):
    return [re.compile(p, re.I) for p in patterns]


NEG, POS, RTW, EXISTING = _compile(_NEG), _compile(_POS), _compile(_RTW), _compile(_EXISTING)


def _sentences(text):
    parts = re.split(r"(?<=[.!?])\s+|\n+", str(text or ""))
    return [p.strip(" •-•\t") for p in parts if len(p.strip()) > 3]


def _clauses(sentence):
    # "We cannot offer relocation but we can sponsor visas" says two different things
    return [c for c in re.split(r"\bbut\b|;|\s[-\u2013\u2014]\s", sentence, flags=re.I) if c.strip()]


def _first(patterns, sentences):
    for s in sentences:
        if any(p.search(c) for c in _clauses(s) for p in patterns):
            return s[:240]
    return None


def sponsorship_wording(text):
    """What the posting says about sponsorship.
    status: no_sponsorship | sponsorship_offered | right_to_work_required | unclear.
    `quote` is the exact sentence. A clear 'no' beats everything else, because a posting
    that says sponsorship is not available is not worth a student's time."""
    sents = _sentences(text)
    neg = _first(NEG, sents)
    if neg:
        return {"status": "no_sponsorship", "quote": neg}
    existing = _first(EXISTING, sents)
    if existing:
        return {"status": "right_to_work_required", "quote": existing}
    pos = _first(POS, sents)
    if pos:
        return {"status": "sponsorship_offered", "quote": pos}
    rtw = _first(RTW, sents)
    if rtw:
        # Common boilerplate. It does not rule sponsorship out, and a Graduate visa holder
        # already has the right to work, so it is shown as a note, not a rejection.
        return {"status": "right_to_work_required", "quote": rtw}
    return {"status": "unclear", "quote": ""}


# ───────────────────────── fit and picking ─────────────────────────
_STOP = {"and", "the", "of", "for", "in", "a", "an", "to", "with", "uk", "london"}


def _tokens(text):
    out = set()
    for w in re.findall(r"[a-z0-9+#.]+", str(text).lower()):
        w = w.strip(".")
        if len(w) > 3 and w.endswith("s") and not w.endswith("ss"):
            w = w[:-1]
        if w and w not in _STOP:
            out.add(w)
    return out


def skills_in(text, skills):
    """Skills from the student's profile that the posting names, whole words only."""
    hits = []
    for name in skills:
        n = str(name).strip()
        if len(n) < 2:
            continue
        if re.search(rf"(^|[^a-z0-9]){re.escape(n)}($|[^a-z0-9])", str(text), re.I):
            hits.append(n)
    return hits


def job_key(job):
    return job.get("url") or f"{job.get('title', '')}|{job.get('company', '')}"


def _fit(job, role, skills):
    body = job.get("description_full") or job.get("description") or ""
    role_tokens = _tokens(role)
    title_tokens = _tokens(job.get("title", ""))
    title_hits = len(role_tokens & title_tokens)
    hits = skills_in(body, skills)
    score = title_hits * 3 + min(len(hits), 5)
    score += {"entry": 2, "senior": -3}.get(job.get("seniority"), 0)
    if job.get("direct"):
        score += 1
    return score, title_hits, hits


def _reason(job, hits, check):
    bits = []
    if hits:
        bits.append(f"names {len(hits)} of your skills ({', '.join(hits[:4])})")
    if job.get("seniority") == "entry":
        bits.append("early-career role")
    bits.append(f"{job.get('company', 'the employer')} is on the sponsor register")
    if job.get("direct"):
        bits.append("taken from the employer's own job board")
    if check and check.get("status") in ("meets_general", "graduate_route"):
        bits.append("the published salary may meet the visa minimum")
    text = "; ".join(bits)
    return text[0].upper() + text[1:] + "."  # not str.capitalize(), which lowercases names


def pick(jobs, role, skills, seen=(), limit=5):
    """Choose the best new roles. Returns (picks, skipped_no_sponsorship)."""
    seen = set(seen)
    ranked, skipped = [], 0
    for job in jobs:
        if job_key(job) in seen or not job.get("visa_sponsor"):
            continue
        if job.get("seniority") == "senior":  # Senior, Lead and Principal roles rarely suit a student
            continue
        score, title_hits, hits = _fit(job, role, skills)
        if title_hits == 0:  # not the kind of role the student asked for
            continue
        text = job.get("description_full") or job.get("description") or ""
        wording = sponsorship_wording(text)
        if wording["status"] == "no_sponsorship":
            skipped += 1
            continue
        ranked.append((score, job, hits, wording, text))
    ranked.sort(key=lambda r: r[0], reverse=True)

    picks = []
    for score, job, hits, wording, text in ranked[:limit]:
        check = job.get("salary_check")
        picks.append(
            {
                "key": job_key(job),
                "title": job.get("title", ""),
                "company": job.get("company", ""),
                "location": job.get("location", ""),
                "url": job.get("url", ""),
                "salary": job.get("salary", ""),
                "source": job.get("source", ""),
                "direct": bool(job.get("direct")),
                "seniority": job.get("seniority", ""),
                "created": job.get("created", ""),
                "skills_hit": hits,
                "reason": _reason(job, hits, check),
                "wording": wording,
                # A short preview cannot show a "no sponsorship" line that sits further down
                "wording_basis": "full" if job.get("direct") or len(text) > 600 else "preview",
                "salary_check": check,
                "score": score,
            }
        )
    return picks, skipped
