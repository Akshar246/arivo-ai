"""
A first, honest check of whether a job's published salary can meet the Skilled Worker
salary rules. It compares the salary with the fixed figures on gov.uk and says plainly
what it cannot confirm.

What it does NOT do: look up the going rate for the job's occupation code. The real test
is "the higher of the general minimum or the going rate for the occupation", and the going
rate can be above the general minimum. Mapping a job title to a government occupation code
reliably is a separate problem, so every positive result says the going rate may be higher.
It is information with a source, not immigration advice.

Figures and conditions come from these gov.uk pages and must be re-checked when the rules
change (the date they were last checked is shown to students):
  https://www.gov.uk/skilled-worker-visa/your-job
  https://www.gov.uk/skilled-worker-visa/when-you-can-be-paid-less
"""
import re

RULES_CHECKED_ON = "2026-10-14"
GENERAL_MINIMUM = 41700   # the higher of this or the occupation's going rate
REDUCED_FLOOR = 33400     # floor for the 70%-of-going-rate routes
REDUCED_PERCENT = 70
SOURCES = {
    "job_and_salary": "https://www.gov.uk/skilled-worker-visa/your-job",
    "paid_less": "https://www.gov.uk/skilled-worker-visa/when-you-can-be-paid-less",
}

# Visa types a student can choose in Arivo (see frontend constants/profileOptions.js)
REDUCED_ROUTE_VISAS = {"Student visa", "Graduate visa"}


def _money(n):
    return f"£{int(round(n)):,}"


def parse_salary(text):
    """Turn a salary string such as '£50,000 - £65,000', '£45K+' or 'Up to £55K' into
    (low, high). Either may be None. Returns (None, None) for text it cannot read."""
    t = str(text or "")
    if not t or re.search(r"not specified|not listed|competitive|negotiable", t, re.I):
        return None, None

    def amount(m):
        n = float(m.group(1).replace(",", ""))
        if m.group(2) and m.group(2).lower() == "k":
            n *= 1000
        return n

    nums = [amount(m) for m in re.finditer(r"[£$€]\s?(\d[\d,]*(?:\.\d+)?)\s?([kK])?", t)]
    if not nums:
        return None, None
    if re.search(r"up to", t, re.I) and len(nums) == 1:
        return None, nums[0]
    if len(nums) >= 2:
        lo, hi = sorted(nums[:2])
        return (lo or None), hi  # a floor of zero is a missing minimum, not a salary
    if t.strip().endswith("+"):
        return nums[0], None
    return nums[0], nums[0]


def assess(salary_text, visa_type="", salary_is_predicted=False):
    """Compare a job's salary with the Skilled Worker figures. Returns a dict the frontend
    can show as a badge plus an explanation. `status` is one of:
    meets_general, graduate_route, depends, below, estimate, unknown, not_needed."""
    base = {"rules_checked_on": RULES_CHECKED_ON, "source": SOURCES["job_and_salary"]}
    if visa_type == "UK citizen / settled":
        return {**base, "status": "not_needed", "label": "", "detail": ""}

    reduced_ok = visa_type in REDUCED_ROUTE_VISAS
    lo, hi = parse_salary(salary_text)

    if salary_is_predicted:
        return {
            **base, "status": "estimate", "label": "Estimated salary",
            "detail": "This salary is an estimate by the job site, not a figure from the employer, so it can't be checked against the visa minimum. Ask the employer for the real salary.",
        }
    if lo is None and hi is None:
        return {
            **base, "status": "unknown", "label": "Salary not published",
            "detail": f"No salary is listed, so it can't be checked. The usual Skilled Worker minimum is {_money(GENERAL_MINIMUM)} a year"
                      + (f", or {_money(REDUCED_FLOOR)} on the graduate route" if reduced_ok else "")
                      + ". Ask the employer before you apply.",
        }
    top = hi if hi is not None else lo
    if top < 1000:  # day or hourly rates and similar: not comparable with an annual minimum
        return {
            **base, "status": "unknown", "label": "Salary not annual",
            "detail": "The salary looks like a daily or hourly rate, so it can't be compared with the annual visa minimum.",
        }

    going = "The going rate for this job's occupation can be higher, so confirm the exact requirement with the employer."
    if lo is not None and lo >= GENERAL_MINIMUM:
        return {
            **base, "status": "meets_general", "label": f"Clears {_money(GENERAL_MINIMUM)}",
            "detail": f"The listed salary is at or above the general Skilled Worker minimum of {_money(GENERAL_MINIMUM)} a year. {going}",
        }
    if top >= GENERAL_MINIMUM:
        return {
            **base, "status": "depends", "label": "Range crosses the minimum",
            "detail": f"The salary range includes the general Skilled Worker minimum of {_money(GENERAL_MINIMUM)} a year. Whether you qualify depends on where in the range you are offered. {going}",
        }
    # The top of the range is below the general minimum
    if reduced_ok and top >= REDUCED_FLOOR:
        return {
            **base, "status": "graduate_route", "label": "May qualify (graduate route)",
            "detail": f"This is below the general minimum of {_money(GENERAL_MINIMUM)}, but people on a Student or Graduate visa can be paid {REDUCED_PERCENT}% of the going rate if the salary is at least {_money(REDUCED_FLOOR)}. "
                      f"Whether this job qualifies depends on the going rate for its occupation. Total UK stay on this route is capped at 4 years, including Graduate visa time. {going}",
            "source": SOURCES["paid_less"],
        }
    floor = REDUCED_FLOOR if reduced_ok else GENERAL_MINIMUM
    return {
        **base, "status": "below", "label": "Below visa minimum",
        "detail": f"The listed salary is below {_money(floor)}, which is the lowest figure for most Skilled Worker jobs. Some jobs follow different rules, such as healthcare and education pay scales, so confirm with the employer if you're interested.",
    }


def rules_summary():
    return {
        "checked_on": RULES_CHECKED_ON,
        "general_minimum": GENERAL_MINIMUM,
        "reduced_floor": REDUCED_FLOOR,
        "reduced_percent": REDUCED_PERCENT,
        "sources": SOURCES,
    }
