import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from main import is_sponsor


def yes(company, *register):
    return is_sponsor(company, set(register)) is True


def no(company, *register):
    return is_sponsor(company, set(register)) is False


def test_tiny_register_entries_never_match_inside_other_words():
    # "alt" sits inside "healthcare"; "ark" inside "park"; "pi" inside "pinpoint"
    assert no("Aria Healthcare Services", "alt")
    assert no("Menlo Park", "ark")
    assert no("Pinpoint Group Recruitment Ltd", "pi")
    assert no("Absolute Recruit", "abs")


def test_placeholder_employer_names_never_match():
    assert no("Unknown", "agency unknown")
    assert no("", "anything ltd")
    assert no("Confidential", "confidential ltd")


def test_a_different_company_sharing_a_first_word_does_not_match():
    assert no("Ramp", "ramp swaps limited")
    assert no("Reed", "h reed limited")
    assert no("Shelter", "infoshelter limited", "shelter tech uk ltd")


def test_legal_endings_and_case_are_ignored():
    assert yes("Robert Half", "robert half limited")
    assert yes("  ROBERT   HALF LTD  ", "robert half limited")
    assert yes("Trainline", "trainline.com ltd")


def test_trading_as_names_match_either_side():
    assert yes("Deliveroo", "roofoods ltd t/a deliveroo")
    assert yes("Roofoods Ltd", "roofoods ltd t/a deliveroo")


def test_generic_descriptor_words_do_not_change_the_company():
    assert yes("Monzo", "monzo bank ltd")
    assert yes("Mastercard", "mastercard uk management services ltd")
    assert yes("ASDA", "asda stores ltd")
    assert yes("Heathrow Airport", "heathrow airport holdings ltd")


def test_a_job_name_that_adds_words_needs_a_distinctive_register_name():
    assert yes("Agincare Group", "agincare uk limited")  # 8 letters: distinctive
    assert no("Curve Group", "curve limited")  # 5 letters: could be another company


def test_exact_short_names_still_match():
    assert yes("IQPC", "iqpc limited")
    assert yes("VML", "vml(uk) limited")


def test_region_words_keep_names_unconfirmed():
    # Documented trade-off: a register entry with a region word may be a different legal entity,
    # so the safe answer is "not confirmed", never a wrong "on the register"
    assert no("Starbucks", "starbucks emea ltd")
    assert no("Capital One UK", "capital one (europe) plc")


def test_index_is_rebuilt_for_a_different_register():
    assert yes("Alpha Widgets", "alpha widgets ltd")
    assert no("Alpha Widgets", "beta widgets ltd")
