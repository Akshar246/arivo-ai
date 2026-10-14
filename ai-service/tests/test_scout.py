import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import scout


def status(text):
    return scout.sponsorship_wording(text)["status"]


def test_hard_no_phrases():
    for t in [
        "Unfortunately we are unable to offer visa sponsorship for this role.",
        "We cannot sponsor candidates at this time.",
        "No sponsorship available.",
        "Sponsorship is not available for this position.",
        "You must be eligible to work in the UK without sponsorship.",
        "We do not provide sponsorship.",
        "This employer is not able to support visa sponsorship.",
        "Visa sponsorship will not be offered.",
    ]:
        assert status(t) == "no_sponsorship", t


def test_positive_phrases():
    for t in [
        "Visa sponsorship is available for the right candidate.",
        "We can sponsor Skilled Worker visas.",
        "We are a licensed sponsor and happy to support applicants.",
        "Sponsorship offered.",
    ]:
        assert status(t) == "sponsorship_offered", t


def test_right_to_work_alone_is_a_note_not_a_rejection():
    r = scout.sponsorship_wording("Candidates must have the right to work in the UK.")
    assert r["status"] == "right_to_work_required"
    assert "right to work" in r["quote"]


def test_a_clear_no_beats_a_soft_note():
    t = "You must have the right to work in the UK. Sponsorship is not available for this role."
    r = scout.sponsorship_wording(t)
    assert r["status"] == "no_sponsorship"
    assert r["quote"] == "Sponsorship is not available for this role."


def test_silence_is_unclear_not_no():
    assert status("We are looking for a data analyst to join our growing team. SQL required.") == "unclear"
    assert status("") == "unclear"
    assert status(None) == "unclear"


def test_unrelated_do_not_sentences_do_not_trigger_a_no():
    t = "We do not discriminate on any grounds. Visa sponsorship is available."
    assert status(t) == "sponsorship_offered"


def test_quote_is_a_sentence_from_the_posting():
    text = "About us. We build things.\n\nWe are unable to offer visa sponsorship.\nApply today."
    r = scout.sponsorship_wording(text)
    assert r["quote"] in text


def test_skills_matched_as_whole_words():
    assert scout.skills_in("Experience with SQL and Python", ["SQL", "Python", "R"]) == ["SQL", "Python"]
    assert scout.skills_in("We use PostgreSQL daily", ["SQL"]) == []
    assert scout.skills_in("Knowledge of C++ and C#", ["C++"]) == ["C++"]


def job(title, company="Acme", desc="", sponsor=True, **kw):
    return {"title": title, "company": company, "description_full": desc, "visa_sponsor": sponsor,
            "url": f"https://x/{title}-{company}", "seniority": kw.pop("seniority", "mid"), **kw}


def test_pick_keeps_only_sponsors_new_and_on_topic():
    jobs = [
        job("Data Analyst", desc="SQL and Python needed."),
        job("Data Analyst", "NoLicence", sponsor=False),
        job("Chef"),
        job("Data Analyst", "Seen Co"),
    ]
    seen = [scout.job_key(jobs[3])]
    picks, skipped = scout.pick(jobs, "Data Analyst", ["SQL", "Python"], seen=seen)
    assert [p["company"] for p in picks] == ["Acme"]
    assert picks[0]["skills_hit"] == ["SQL", "Python"]
    assert skipped == 0


def test_pick_skips_roles_that_say_no_and_counts_them():
    jobs = [job("Data Analyst", "Closed", desc="Unfortunately we cannot offer sponsorship."), job("Data Analyst", "Open")]
    picks, skipped = scout.pick(jobs, "Data Analyst", [])
    assert [p["company"] for p in picks] == ["Open"]
    assert skipped == 1


def test_pick_ranks_early_career_and_skill_matches_higher():
    jobs = [
        job("Senior Data Analyst", "A", desc="SQL Python", seniority="senior"),
        job("Graduate Data Analyst", "B", desc="SQL Python", seniority="entry"),
        job("Data Analyst", "C", desc="Excel"),
    ]
    picks, _ = scout.pick(jobs, "Data Analyst", ["SQL", "Python"])
    assert picks[0]["company"] == "B"
    assert picks[-1]["company"] in ("A", "C")


def test_pick_reason_lists_only_facts_and_respects_limit():
    jobs = [job(f"Data Analyst {i}", f"Co{i}", desc="SQL") for i in range(8)]
    picks, _ = scout.pick(jobs, "Data Analyst", ["SQL"], limit=3)
    assert len(picks) == 3
    assert "sponsor register" in picks[0]["reason"]
    assert "will sponsor" not in picks[0]["reason"].lower()


def test_short_previews_are_marked_as_previews():
    picks, _ = scout.pick([job("Data Analyst", desc="Short preview text.")], "Data Analyst", [])
    assert picks[0]["wording_basis"] == "preview"


def test_you_will_not_need_sponsorship_is_not_an_offer():
    t = "You have the right to work in the UK for the internship and would not require visa sponsorship if offered a permanent position."
    assert status(t) == "right_to_work_required"


def test_transfer_of_existing_sponsorship_is_not_an_offer_to_a_new_graduate():
    assert status("For local candidates we are able to support transfer of visa sponsorship.") == "right_to_work_required"


def test_two_clauses_are_read_separately():
    t = "Unfortunately we cannot offer relocation for this type of role but we can sponsor internal VISAs."
    assert status(t) == "right_to_work_required"
    assert status("We cannot offer relocation, but we can sponsor visas for the right person.") == "sponsorship_offered"
    assert status("We offer free lunches but we are unable to sponsor visas.") == "no_sponsorship"


def test_reason_keeps_the_capitalisation_of_names():
    picks, _ = scout.pick([job("Data Analyst", "Monzo", desc="We use Python and SQL.")], "Data Analyst", ["Python", "SQL"])
    r = picks[0]["reason"]
    assert r.startswith("Names 2 of your skills (Python, SQL)")
    assert "Monzo is on the sponsor register" in r


def test_senior_roles_are_never_picked():
    jobs = [job("Lead Data Analyst", "A", desc="SQL", seniority="senior"), job("Data Analyst", "B", desc="SQL")]
    picks, _ = scout.pick(jobs, "Data Analyst", ["SQL"])
    assert [p["company"] for p in picks] == ["B"]
