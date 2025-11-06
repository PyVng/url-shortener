"""
Unit tests for smart routing functionality
"""

from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import (
    apply_routing_rules,
    get_client_info,
    get_country_code,
    get_current_time_slot,
    get_device_type,
)
from models import Base, Rule, Url


@pytest.fixture(scope="function")
def test_db():
    """Create a test database in memory"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    # Create tables
    Base.metadata.create_all(bind=engine)

    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


class TestClientInfo:
    """Test cases for client information extraction"""

    @patch("main.request")
    def test_get_client_info_complete(self, mock_request):
        """Test extracting complete client information"""
        mock_request.headers = {
            "X-Forwarded-For": "192.168.1.1, 10.0.0.1",
            "X-Real-IP": "192.168.1.1",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://google.com/search",
        }
        mock_request.remote_addr = "127.0.0.1"

        result = get_client_info()

        assert result["ip_address"] == "192.168.1.1"
        assert (
            result["user_agent"]
            == "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        assert result["referrer"] == "https://google.com/search"

    @patch("main.request")
    def test_get_client_info_minimal(self, mock_request):
        """Test extracting minimal client information"""
        mock_request.headers = {}
        mock_request.remote_addr = "127.0.0.1"

        result = get_client_info()

        assert result["ip_address"] == "127.0.0.1"
        assert result["user_agent"] == ""
        assert result["referrer"] == ""


class TestDeviceDetection:
    """Test cases for device type detection"""

    def test_get_device_type_desktop(self):
        """Test desktop device detection"""
        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        result = get_device_type(ua)
        assert result == "desktop"

    def test_get_device_type_mobile(self):
        """Test mobile device detection"""
        ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15"
        result = get_device_type(ua)
        assert result == "mobile"

    def test_get_device_type_tablet(self):
        """Test tablet device detection"""
        ua = "Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15"
        result = get_device_type(ua)
        assert result == "tablet"

    def test_get_device_type_unknown(self):
        """Test fallback for unknown device"""
        ua = "Unknown User Agent"
        result = get_device_type(ua)
        assert result == "desktop"  # fallback


class TestGeoLocation:
    """Test cases for geolocation"""

    @patch("main.geoip2")
    def test_get_country_code_success(self, mock_geoip2):
        """Test successful country code retrieval"""
        mock_reader = MagicMock()
        mock_response = MagicMock()
        mock_response.country.iso_code = "US"

        mock_reader.country.return_value = mock_response
        mock_geoip2.database.Reader.return_value.__enter__.return_value = mock_reader

        with patch("os.path.exists", return_value=True):
            result = get_country_code("192.168.1.1")

        assert result == "US"

    @patch("main.geoip2")
    def test_get_country_code_no_db(self, mock_geoip2):
        """Test country code when GeoIP DB is not available"""
        with patch("os.path.exists", return_value=False):
            result = get_country_code("192.168.1.1")

        assert result == "XX"

    @patch("main.geoip2")
    def test_get_country_code_error(self, mock_geoip2):
        """Test country code retrieval error handling"""
        mock_geoip2.database.Reader.side_effect = Exception("GeoIP error")

        with patch("os.path.exists", return_value=True):
            result = get_country_code("192.168.1.1")

        assert result == "XX"


class TestTimeSlots:
    """Test cases for time slot detection"""

    @patch("main.datetime")
    def test_get_current_time_slot_business(self, mock_datetime):
        """Test business hours time slot"""
        mock_datetime.now.return_value.hour = 14  # 2 PM
        result = get_current_time_slot()
        assert result == "09:00-18:00"

    @patch("main.datetime")
    def test_get_current_time_slot_evening(self, mock_datetime):
        """Test evening time slot"""
        mock_datetime.now.return_value.hour = 20  # 8 PM
        result = get_current_time_slot()
        assert result == "18:00-22:00"

    @patch("main.datetime")
    def test_get_current_time_slot_night(self, mock_datetime):
        """Test night time slot"""
        mock_datetime.now.return_value.hour = 2  # 2 AM
        result = get_current_time_slot()
        assert result == "22:00-09:00"


class TestRoutingRules:
    """Test cases for routing rules application"""

    def test_apply_routing_rules_no_rules(self, test_db):
        """Test routing when no rules are defined"""
        # Create a test URL
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        client_info = {
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0)",
            "referrer": "https://google.com",
        }

        result = apply_routing_rules(test_db, url_obj.id, client_info)

        assert result == original_url

    def test_apply_routing_rules_country_match(self, test_db):
        """Test country-based routing rule matching"""
        # Create a test URL
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        # Create a country rule
        rule = Rule(
            url_id=url_obj.id,
            rule_type="country",
            condition_value="FR",
            target_url="https://example.com/french",
            priority=10,
            is_active=1,
        )
        test_db.add(rule)
        test_db.commit()

        client_info = {
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0)",
            "referrer": "https://google.com",
        }

        # Mock country detection to return 'FR'
        with patch("main.get_country_code", return_value="FR"):
            result = apply_routing_rules(test_db, url_obj.id, client_info)

        assert result == "https://example.com/french"

    def test_apply_routing_rules_device_match(self, test_db):
        """Test device-based routing rule matching"""
        # Create a test URL
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        # Create a device rule
        rule = Rule(
            url_id=url_obj.id,
            rule_type="device",
            condition_value="mobile",
            target_url="https://example.com/mobile",
            priority=9,
            is_active=1,
        )
        test_db.add(rule)
        test_db.commit()

        client_info = {
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)",
            "referrer": "https://google.com",
        }

        result = apply_routing_rules(test_db, url_obj.id, client_info)

        assert result == "https://example.com/mobile"

    def test_apply_routing_rules_time_match(self, test_db):
        """Test time-based routing rule matching"""
        # Create a test URL
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        # Create a time rule
        rule = Rule(
            url_id=url_obj.id,
            rule_type="time",
            condition_value="09:00-18:00",
            target_url="https://example.com/business",
            priority=8,
            is_active=1,
        )
        test_db.add(rule)
        test_db.commit()

        client_info = {
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0)",
            "referrer": "https://google.com",
        }

        # Mock time slot to return business hours
        with patch("main.get_current_time_slot", return_value="09:00-18:00"):
            result = apply_routing_rules(test_db, url_obj.id, client_info)

        assert result == "https://example.com/business"

    def test_apply_routing_rules_referrer_match(self, test_db):
        """Test referrer-based routing rule matching"""
        # Create a test URL
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        # Create a referrer rule
        rule = Rule(
            url_id=url_obj.id,
            rule_type="referrer",
            condition_value="google.com",
            target_url="https://example.com/seo-landing",
            priority=7,
            is_active=1,
        )
        test_db.add(rule)
        test_db.commit()

        client_info = {
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0)",
            "referrer": "https://google.com/search?q=test",
        }

        result = apply_routing_rules(test_db, url_obj.id, client_info)

        assert result == "https://example.com/seo-landing"

    def test_apply_routing_rules_weight_ab_testing(self, test_db):
        """Test weight-based A/B testing routing"""
        # Create a test URL
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        # Create a weight rule (50% chance)
        rule = Rule(
            url_id=url_obj.id,
            rule_type="weight",
            condition_value="0.5",
            target_url="https://example.com/variant-b",
            weight=0.5,
            priority=5,
            is_active=1,
        )
        test_db.add(rule)
        test_db.commit()

        client_info = {
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0)",
            "referrer": "direct",
        }

        # Mock random to return value < 0.5 (should match rule)
        with patch("main.random.random", return_value=0.3):
            result = apply_routing_rules(test_db, url_obj.id, client_info)

        assert result == "https://example.com/variant-b"

    def test_apply_routing_rules_no_match(self, test_db):
        """Test routing when no rules match"""
        # Create a test URL
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        # Create a rule that won't match
        rule = Rule(
            url_id=url_obj.id,
            rule_type="country",
            condition_value="JP",  # Japan
            target_url="https://example.com/japanese",
            priority=10,
            is_active=1,
        )
        test_db.add(rule)
        test_db.commit()

        client_info = {
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0)",
            "referrer": "direct",
        }

        # Mock country to return US (not JP)
        with patch("main.get_country_code", return_value="US"):
            result = apply_routing_rules(test_db, url_obj.id, client_info)

        # Should return original URL since rule doesn't match
        assert result == original_url

    def test_apply_routing_rules_priority_order(self, test_db):
        """Test that rules are applied in priority order"""
        # Create a test URL
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        # Create two rules with different priorities
        high_priority_rule = Rule(
            url_id=url_obj.id,
            rule_type="country",
            condition_value="US",
            target_url="https://example.com/us-high-priority",
            priority=20,  # Higher priority
            is_active=1,
        )

        low_priority_rule = Rule(
            url_id=url_obj.id,
            rule_type="country",
            condition_value="US",
            target_url="https://example.com/us-low-priority",
            priority=10,  # Lower priority
            is_active=1,
        )

        test_db.add(high_priority_rule)
        test_db.add(low_priority_rule)
        test_db.commit()

        client_info = {
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0)",
            "referrer": "direct",
        }

        # Mock country to return US (matches both rules)
        with patch("main.get_country_code", return_value="US"):
            result = apply_routing_rules(test_db, url_obj.id, client_info)

        # Should return URL from high priority rule
        assert result == "https://example.com/us-high-priority"

    def test_apply_routing_rules_inactive_ignored(self, test_db):
        """Test that inactive rules are ignored"""
        # Create a test URL
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        # Create an inactive rule
        inactive_rule = Rule(
            url_id=url_obj.id,
            rule_type="country",
            condition_value="US",
            target_url="https://example.com/us-inactive",
            priority=10,
            is_active=0,  # Inactive
        )
        test_db.add(inactive_rule)
        test_db.commit()

        client_info = {
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0)",
            "referrer": "direct",
        }

        # Mock country to return US
        with patch("main.get_country_code", return_value="US"):
            result = apply_routing_rules(test_db, url_obj.id, client_info)

        # Should return original URL since rule is inactive
        assert result == original_url
