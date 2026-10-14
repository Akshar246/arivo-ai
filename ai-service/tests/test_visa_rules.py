import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import visa_rules as vr


def test_parse_common_salary_formats():
    assert vr.parse_salary("£50,000 - £65,000") == (50000, 65000)
    assert vr.parse_salary("£50K - £65K") == (50000, 65000)
    assert vr.parse_salary("£45,000+") == (45000, None)
    assert vr.parse_salary("Up to £55K") == (None, 55000)
    assert vr.parse_salary("£42,000") == (42000, 42000)
    assert vr.parse_salary("£0 - £55K") == (None, 55000)


def test_parse_unreadable_salary():
    assert vr.parse_salary("Salary not specified") == (None, None)
    assert vr.parse_salary("") == (None, None)
    assert vr.parse_salary(None) == (None, None)
    assert vr.parse_salary("Competitive") == (None, None)


def test_clears_general_minimum():
    r = vr.assess("£50,000 - £60,000", "Graduate visa")
    assert r["status"] == "meets_general"
    assert "going rate" in r["detail"]  # never claims a guarantee


def test_exact_threshold_counts():
    assert vr.assess("£41,700", "Graduate visa")["status"] == "meets_general"
    assert vr.assess("£41,699", "Skilled Worker visa")["status"] == "below"


def test_graduate_route_between_the_two_figures():
    r = vr.assess("£36,000 - £40,000", "Graduate visa")
    assert r["status"] == "graduate_route"
    assert "70%" in r["detail"] and "£33,400" in r["detail"] and "4 years" in r["detail"]
    assert r["source"] == vr.SOURCES["paid_less"]


def test_same_salary_is_below_for_someone_not_on_a_student_or_graduate_visa():
    assert vr.assess("£36,000", "Skilled Worker visa")["status"] == "below"
    assert vr.assess("£36,000", "Other")["status"] == "below"
    assert vr.assess("£36,000", "Student visa")["status"] == "graduate_route"


def test_below_the_floor_even_on_the_reduced_route():
    r = vr.assess("£28,000 - £30,000", "Graduate visa")
    assert r["status"] == "below"
    assert "£33,400" in r["detail"]


def test_range_that_crosses_the_minimum():
    assert vr.assess("£38,000 - £48,000", "Graduate visa")["status"] == "depends"
    assert vr.assess("Up to £55K", "Graduate visa")["status"] == "depends"


def test_estimated_and_missing_salaries_are_not_judged():
    assert vr.assess("£60,000", "Graduate visa", salary_is_predicted=True)["status"] == "estimate"
    assert vr.assess("Salary not specified", "Graduate visa")["status"] == "unknown"


def test_daily_rates_are_not_compared_with_an_annual_minimum():
    assert vr.assess("£400 - £500", "Graduate visa")["status"] == "unknown"


def test_citizens_need_no_check():
    r = vr.assess("£20,000", "UK citizen / settled")
    assert r["status"] == "not_needed" and r["label"] == ""


def test_every_result_carries_the_rule_date_and_a_source():
    for sal in ["£50,000", "£30,000", "", "£36,000"]:
        r = vr.assess(sal, "Graduate visa")
        assert r["rules_checked_on"] == vr.RULES_CHECKED_ON
        assert r["source"].startswith("https://www.gov.uk/")
