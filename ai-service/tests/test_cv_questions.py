import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from main import _ground_cv_questions

CV = """Data Analyst Intern, FinServe Analytics
- Built a Power BI dashboard tracking loan defaults, used by a team of 12 analysts
- Cleaned and merged 4 SQL datasets, reducing report preparation time by 30%
"""


def item(question, basis):
    return {"question": question, "cv_basis": basis, "why": "w", "tip": "t"}


def test_keeps_question_whose_quote_is_in_the_cv():
    out = _ground_cv_questions([item("Walk me through the dashboard?", "Built a Power BI dashboard tracking loan defaults")], CV, 4)
    assert len(out) == 1
    assert out[0]["type"] == "cv"


def test_quote_matches_despite_line_breaks_and_bullets():
    quote = "Cleaned and merged 4 SQL datasets, reducing report preparation time by 30%"
    assert len(_ground_cv_questions([item("How did you measure the 30%?", quote)], CV, 4)) == 1


def test_drops_question_with_invented_quote():
    out = _ground_cv_questions([item("Tell me about managing your team of 40?", "Managed a team of 40 engineers at Google")], CV, 4)
    assert out == []


def test_drops_question_with_no_or_tiny_quote():
    assert _ground_cv_questions([item("Why?", "")], CV, 4) == []
    assert _ground_cv_questions([item("Why?", "SQL")], CV, 4) == []


def test_ignores_malformed_items_and_respects_count():
    items = ["junk", None, item("Q1?", "Built a Power BI dashboard tracking loan defaults"), item("Q2?", "reducing report preparation time by 30%")]
    assert len(_ground_cv_questions(items, CV, 1)) == 1
    assert _ground_cv_questions("not a list", CV, 4) == []
