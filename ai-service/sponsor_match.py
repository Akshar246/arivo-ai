"""
Matching a job's employer name to the Home Office register of licensed sponsors.

Why this exists: the original rule said "a company is a sponsor if its name contains a register
entry, or a register entry contains its name". The register has tiny entries such as "alt", "ark",
"pi" and "abs", so any company with "alt" inside a word ("healthcare") was shown as being on the
register. About a third of the loose matches in a real sample were wrong. A wrong "on the
register" badge is the worst mistake this product can make, so this matcher is strict:

- Names are normalised (case, punctuation, legal endings such as Ltd and PLC, "t/a" aliases).
- Two names match when they are equal after that, or when one is the other plus only generic
  descriptor words ("Group", "Holdings", "Services"). "Ramp" does not match "Ramp Swaps Limited".
- A fragment never matches by itself: the shorter name must be at least 5 characters, unless the
  two names are equal.
- Placeholders such as "Unknown" never match.

Leaving a real sponsor as "not confirmed" is the safe mistake. Claiming one that isn't is not.
"""
import re

# Endings that say what kind of company it is, not which one
LEGAL = {"ltd", "limited", "plc", "llp", "llc", "lp", "inc", "incorporated", "corp", "corporation", "co", "company", "uk", "gb"}

# Words that can be added to or dropped from a name without changing which company it is.
# Region words (Europe, Ireland, EMEA) are deliberately not here: they often mean a different
# legal entity, and an earlier test keeps "Capital One UK" unconfirmed against "Capital One (Europe)".
GENERIC = {
    "group", "holdings", "holding", "services", "service", "international", "global", "worldwide",
    "management", "operations", "trading", "technologies", "technology", "solutions", "systems",
    "bank", "recruitment", "consulting", "stores", "partners", "partnership",
}

PLACEHOLDERS = {"unknown", "confidential", "anonymous", "private", "undisclosed", "various", "n/a", "na", "tbc", "company"}

_ALIAS_SPLIT = re.compile(r"\s+(?:t/a|trading as|trading under|\(trading as)\s+", re.I)
_DOMAIN_TAIL = re.compile(r"\.(?:com|co\.uk|org|uk|net|io)$")
# The shorter name must have at least this many characters. The job's name may add generic
# words to a register name ("Agincare Group" for "Agincare") only when that name is longer,
# because a short brand plus "Group" is more often a different company.
MIN_CHARS_REGISTER_LONGER = 4
MIN_CHARS_JOB_LONGER = 7


def _tokens(text):
    text = str(text or "").lower().replace("&", " and ")
    out = []
    for raw in re.split(r"[^a-z0-9.+#]+", text):
        t = _DOMAIN_TAIL.sub("", raw.strip("."))
        if t and t not in LEGAL:
            out.append(t)
    if out and out[0] == "the":
        out = out[1:]
    return tuple(out)


def aliases(name):
    """Every name an organisation goes by: 'Roofoods Ltd t/a Deliveroo' is both."""
    parts = _ALIAS_SPLIT.split(str(name or "").strip(" ()"))
    return [t for t in (_tokens(p) for p in parts) if t]


def build_index(sponsor_names):
    """Map each normalised register name to True, and index them by first word for fast lookup."""
    exact, by_first = set(), {}
    for name in sponsor_names:
        for toks in aliases(name):
            exact.add(toks)
            by_first.setdefault(toks[0], set()).add(toks)
    return exact, by_first


def _extends(shorter, longer, min_chars):
    """True when `longer` is `shorter` followed only by generic descriptor words."""
    n = len(shorter)
    if len(longer) <= n or longer[:n] != shorter:
        return False
    if len("".join(shorter)) < min_chars:
        return False
    return all(t in GENERIC for t in longer[n:])


def match(company, index):
    """Return the register name (as tokens) a company matches, or None."""
    name = str(company or "").strip()
    if not name or name.lower() in PLACEHOLDERS:
        return None
    exact, by_first = index
    for mine in aliases(name) or []:
        if mine in exact:
            return mine
        for theirs in by_first.get(mine[0], ()):
            # register name = job name + generic words, or the job name adds them (stricter)
            if _extends(mine, theirs, MIN_CHARS_REGISTER_LONGER) or _extends(theirs, mine, MIN_CHARS_JOB_LONGER):
                return theirs
        # The register name may be the shorter one and start with a different first word only
        # when "The" or a legal word was dropped; first-word indexing already covers that.
    return None
