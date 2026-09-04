import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from main import is_sponsor
from unittest.mock import patch, Mock


def test_matches_trainline_legal_name():
    # Arrange - set out your ingredients
    sponsors = {"trainline.com ltd"}

    # Act - do the one thing you're testing
    result = is_sponsor("Trainline", sponsors)

    # Assert - taste it, check it's actually right
    assert result == True



def test_bae_critical_skills_correctly_unconfirmed():
    # Arrange - BAE Critical Skills is an internal team name, not the
    # real registered entity. No shared text with the real sponsor name.
    sponsors = {"bae systems plc"}

    # Act
    result = is_sponsor("BAE Critical Skills", sponsors)

    # Assert - this MUST stay False. A "yes" here would be a false
    # promise about visa sponsorship, worse than a missed match.
    assert result == False


def test_capital_one_uk_correctly_unconfirmed():
    # Arrange - same story, different company
    sponsors = {"capital one (europe) plc"}

    # Act
    result = is_sponsor("Capital One UK", sponsors)

    # Assert
    assert result == False


def test_no_sponsors_loaded_returns_false():
    # Arrange - the sponsor list failed to load, exactly like the
    # government CSV filename bug. An empty set, not None, not a crash.
    sponsors = set()

    # Act
    result = is_sponsor("Trainline", sponsors)

    # Assert - must fail safe, never accidentally say "yes" when we
    # have zero real data to check against
    assert result == False


@patch("main.http_requests.get")
def test_reed_rescue_matches_when_company_name_found(mock_get):
    # Arrange - build a fake Reed response, the stunt double.
    # This is exactly the shape Reed's real API returns, we just
    # control what's inside it ourselves instead of asking the internet.
    fake_response = Mock()
    fake_response.status_code = 200
    fake_response.json.return_value = {
        "results": [
            {"jobTitle": "Project Manager", "employerName": "Carrington West"}
        ]
    }
    mock_get.return_value = fake_response

    from main import rescue_sponsor_via_reed

    # Act - this now hits our fake response, not the real internet
    result = rescue_sponsor_via_reed("Project Manager", "Carrington West Ltd", "london")

    # Assert - did our function correctly pull the company name out
    # of the fake response?
    assert result == "Carrington West"


def test_matches_regardless_of_casing_and_whitespace():
    # Arrange — the "annoying customer" input: extra spaces, weird casing
    sponsors = {"trainline.com ltd"}

    # Act
    result = is_sponsor("   TRAINLINE   ", sponsors)

    # Assert — the .strip().lower() logic should handle this cleanly
    assert result == True


def test_empty_company_name_does_not_crash():
    # Arrange — what if a job listing has a blank/missing company name?
    sponsors = {"trainline.com ltd"}

    # Act
    result = is_sponsor("", sponsors)

    # Assert — must return False safely, never throw an error
    assert result == False