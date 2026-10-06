import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import sponsor_boards as sb

BOARD = {"name": "Acme", "provider": "greenhouse", "token": "acme", "register": ["acme uk ltd"]}


def test_only_boards_on_the_register_are_used():
    kept, dropped = sb.verified_boards({"monzo bank ltd", "  Stripe Payments UK Ltd "})
    names = {b["name"] for b in kept}
    assert names == {"Monzo", "Stripe"}
    assert "Anthropic" in dropped


def test_register_matching_ignores_case_and_spaces():
    kept, _ = sb.verified_boards({" MONZO BANK LTD "})
    assert [b["name"] for b in kept] == ["Monzo"]


def test_every_curated_board_names_its_register_entry():
    for b in sb.BOARDS:
        assert b["register"] and all(r == r.lower() for r in b["register"]), b["name"]
        assert b["provider"] in ("greenhouse", "lever", "ashby", "smartrecruiters")


def test_uk_locations():
    assert sb.is_uk_location("London, UK")
    assert sb.is_uk_location("Remote - United Kingdom")
    assert sb.is_uk_location("Edinburgh")
    assert not sb.is_uk_location("San Francisco, CA")
    assert not sb.is_uk_location("Dublin, Ireland")
    assert not sb.is_uk_location("")


def test_greenhouse_keeps_uk_jobs_only_and_cleans_html():
    data = {"jobs": [
        {"title": "Data Analyst", "location": {"name": "London"}, "absolute_url": "https://x/1",
         "content": "&lt;p&gt;Build &amp;amp; ship&lt;/p&gt;&lt;ul&gt;&lt;li&gt;SQL&lt;/li&gt;&lt;li&gt;Python&lt;/li&gt;&lt;/ul&gt;",
         "first_published": "2026-09-01T10:00:00Z",
         "pay_input_ranges": [{"min_cents": 5000000, "max_cents": 6500000, "currency_type": "GBP"}]},
        {"title": "Engineer", "location": {"name": "New York"}, "absolute_url": "https://x/2", "content": ""},
    ]}
    jobs = sb.parse_greenhouse(BOARD, data)
    assert len(jobs) == 1
    j = jobs[0]
    assert j["visa_sponsor"] is True and j["direct"] is True and j["source"] == "greenhouse"
    assert j["salary"] == "£50,000 - £65,000"
    assert "• SQL" in j["description_full"] and "• Python" in j["description_full"]
    assert "Build & ship" in j["description_full"]
    assert j["created"] == "2026-09-01"


def test_lever_and_ashby_parsing():
    lever = [{"text": "Junior Analyst", "hostedUrl": "https://l/1", "categories": {"location": "London (GB)", "commitment": "Full-time"},
              "descriptionPlain": "Do analysis", "createdAt": 1790000000000},
             {"text": "Elsewhere", "hostedUrl": "https://l/2", "categories": {"location": "Berlin"}, "descriptionPlain": ""}]
    out = sb.parse_lever(BOARD, lever)
    assert len(out) == 1 and out[0]["contract_time"] == "full_time" and out[0]["seniority"] == "entry"

    ashby = {"jobs": [{"title": "Designer", "location": "UK - London", "jobUrl": "https://a/1", "descriptionPlain": "Design", "isRemote": False,
                       "publishedAt": "2026-07-09T00:00:00Z"},
                      {"title": "Designer", "location": "Paris", "jobUrl": "https://a/2", "descriptionPlain": ""}]}
    out = sb.parse_ashby(BOARD, ashby)
    assert len(out) == 1 and out[0]["location"] == "UK - London"


def test_seniority_from_title():
    assert sb.seniority("Graduate Data Analyst") == "entry"
    assert sb.seniority("Software Engineer Intern") == "entry"
    assert sb.seniority("Associate Product Manager") == "entry"
    assert sb.seniority("Associate Director, Finance") == "senior"
    assert sb.seniority("Senior Software Engineer") == "senior"
    assert sb.seniority("Data Analyst") == "mid"


def _job(title, desc="", loc="London", mode="onsite", created="2026-09-01"):
    return {"title": title, "description_full": desc, "location": loc, "work_mode": mode,
            "created": created, "seniority": sb.seniority(title)}


def test_search_prefers_the_exact_phrase_and_early_career():
    jobs = [_job("Product Analytics Manager"), _job("Product Manager"), _job("Senior Product Manager"), _job("Associate Product Manager")]
    titles = [j["title"] for j in sb.search(jobs, "product manager", "london")]
    assert titles[0] in ("Associate Product Manager", "Product Manager")
    assert titles.index("Senior Product Manager") > titles.index("Product Manager")
    assert titles.index("Product Analytics Manager") > titles.index("Product Manager")


def test_search_ignores_unrelated_jobs_and_respects_location():
    jobs = [_job("Chef"), _job("Data Analyst", loc="Edinburgh"), _job("Data Analyst", loc="London")]
    out = sb.search(jobs, "data analyst", "london")
    assert [j["location"] for j in out] == ["London"]
    assert len(sb.search(jobs, "data analyst", "uk")) == 2
    assert sb.search(jobs, "", "london") == []


def test_refresh_without_register_keeps_cache():
    before = dict(sb._state)
    assert sb.refresh(set()) == before["stats"]
    assert sb._state["jobs"] == before["jobs"]


def test_zero_salary_floor_is_shown_as_up_to():
    data = {"jobs": [{"title": "Analyst", "location": "London", "jobUrl": "https://a/3", "descriptionPlain": "x",
                      "compensation": {"scrapeableCompensationSalarySummary": "£0 - £55K"}}]}
    assert sb.parse_ashby(BOARD, data)[0]["salary"] == "Up to £55K"
