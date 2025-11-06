"""
Unit tests for URL Shortener models
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime

from models import Base, Url, Rule, Visit


@pytest.fixture(scope="function")
def test_db():
    """Create a test database in memory"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
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


class TestUrlModel:
    """Test cases for Url model"""

    def test_generate_short_code(self):
        """Test short code generation"""
        code1 = Url.generate_short_code()
        code2 = Url.generate_short_code()

        assert len(code1) == 6
        assert len(code2) == 6
        assert code1 != code2  # Should be different (with high probability)

        # Should contain only letters and digits
        import string
        allowed_chars = string.ascii_letters + string.digits
        assert all(c in allowed_chars for c in code1)
        assert all(c in allowed_chars for c in code2)

    def test_generate_short_code_custom_length(self):
        """Test short code generation with custom length"""
        code = Url.generate_short_code(length=8)
        assert len(code) == 8

    def test_create_short_url_success(self, test_db):
        """Test successful creation of short URL"""
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"

        url_obj = Url.create_short_url(test_db, original_url, base_url)

        assert url_obj.short_code is not None
        assert url_obj.original_url == original_url
        assert url_obj.short_url == f"{base_url}/{url_obj.short_code}"
        assert url_obj.click_count == 0
        assert url_obj.user_id is None

    def test_create_short_url_with_user_id(self, test_db):
        """Test creation of short URL with user ID"""
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        user_id = "user123"

        url_obj = Url.create_short_url(test_db, original_url, base_url, user_id)

        assert url_obj.user_id == user_id

    def test_create_short_url_invalid_protocol(self, test_db):
        """Test creation fails with invalid URL protocol"""
        base_url = "http://localhost:8000"
        invalid_url = "ftp://example.com/test"

        error_msg = "URL должен начинаться с http:// или https://"
        with pytest.raises(ValueError, match=error_msg):
            Url.create_short_url(test_db, invalid_url, base_url)

    def test_create_short_url_too_long(self, test_db):
        """Test creation fails with URL that's too long"""
        base_url = "http://localhost:8000"
        long_url = "https://example.com/" + "a" * 2000

        with pytest.raises(ValueError, match="URL слишком длинный"):
            Url.create_short_url(test_db, long_url, base_url)

    def test_get_by_short_code_exists(self, test_db):
        """Test getting URL by existing short code"""
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"

        created_url = Url.create_short_url(test_db, original_url, base_url)
        retrieved_url = Url.get_by_short_code(test_db, created_url.short_code)

        assert retrieved_url is not None
        assert retrieved_url.id == created_url.id
        assert retrieved_url.short_code == created_url.short_code
        assert retrieved_url.original_url == original_url

    def test_get_by_short_code_not_exists(self, test_db):
        """Test getting URL by non-existing short code"""
        retrieved_url = Url.get_by_short_code(test_db, "nonexistent")

        assert retrieved_url is None

    def test_get_original_url_and_increment_clicks(self, test_db):
        """Test getting original URL and click count increment"""
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"

        created_url = Url.create_short_url(test_db, original_url, base_url)

        # First access
        result1 = Url.get_original_url(test_db, created_url.short_code)
        assert result1 == original_url

        # Check click count incremented
        updated_url = Url.get_by_short_code(test_db, created_url.short_code)
        assert updated_url.click_count == 1

        # Second access
        result2 = Url.get_original_url(test_db, created_url.short_code)
        assert result2 == original_url

        # Check click count incremented again
        updated_url = Url.get_by_short_code(test_db, created_url.short_code)
        assert updated_url.click_count == 2

    def test_get_original_url_not_exists(self, test_db):
        """Test getting original URL for non-existing short code"""
        result = Url.get_original_url(test_db, "nonexistent")
        assert result is None

    def test_to_dict(self, test_db):
        """Test conversion to dictionary"""
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"

        url_obj = Url.create_short_url(test_db, original_url, base_url)

        data = url_obj.to_dict()

        assert data["id"] == str(url_obj.id)
        assert data["short_code"] == url_obj.short_code
        assert data["original_url"] == original_url
        assert data["short_url"] == url_obj.short_url
        assert data["user_id"] is None
        assert data["click_count"] == 0
        assert data["created_at"] is not None


class TestRuleModel:
    """Test cases for Rule model"""

    def test_create_rule_country(self, test_db):
        """Test creating a country-based rule"""
        # Create a test URL first
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        rule = Rule(
            url_id=url_obj.id,
            rule_type='country',
            condition_value='FR',
            target_url='https://example.com/french',
            priority=10,
            is_active=1
        )
        test_db.add(rule)
        test_db.commit()

        assert rule.id is not None
        assert rule.url_id == url_obj.id
        assert rule.rule_type == 'country'
        assert rule.condition_value == 'FR'
        assert rule.target_url == 'https://example.com/french'
        assert rule.priority == 10
        assert rule.is_active == 1

    def test_create_rule_device(self, test_db):
        """Test creating a device-based rule"""
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        rule = Rule(
            url_id=url_obj.id,
            rule_type='device',
            condition_value='mobile',
            target_url='https://example.com/mobile',
            priority=9,
            is_active=1
        )
        test_db.add(rule)
        test_db.commit()

        assert rule.rule_type == 'device'
        assert rule.condition_value == 'mobile'

    def test_create_rule_time(self, test_db):
        """Test creating a time-based rule"""
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        rule = Rule(
            url_id=url_obj.id,
            rule_type='time',
            condition_value='09:00-18:00',
            target_url='https://example.com/business',
            priority=8,
            is_active=1
        )
        test_db.add(rule)
        test_db.commit()

        assert rule.rule_type == 'time'
        assert rule.condition_value == '09:00-18:00'

    def test_create_rule_weight_ab_testing(self, test_db):
        """Test creating a weight-based rule for A/B testing"""
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        rule = Rule(
            url_id=url_obj.id,
            rule_type='weight',
            condition_value='0.5',
            target_url='https://example.com/variant-b',
            weight=0.5,
            priority=5,
            is_active=1
        )
        test_db.add(rule)
        test_db.commit()

        assert rule.rule_type == 'weight'
        assert rule.weight == 0.5

    def test_rule_to_dict(self, test_db):
        """Test Rule to_dict conversion"""
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        rule = Rule(
            url_id=url_obj.id,
            rule_type='country',
            condition_value='US',
            target_url='https://example.com/us',
            priority=1,
            is_active=1
        )
        test_db.add(rule)
        test_db.commit()

        data = rule.to_dict()

        assert data["id"] == rule.id
        assert data["url_id"] == url_obj.id
        assert data["rule_type"] == 'country'
        assert data["condition_value"] == 'US'
        assert data["target_url"] == 'https://example.com/us'
        assert data["priority"] == 1
        assert data["is_active"] is True


class TestVisitModel:
    """Test cases for Visit model"""

    def test_create_visit_basic(self, test_db):
        """Test creating a basic visit record"""
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        visit = Visit(
            url_id=url_obj.id,
            ip_address='192.168.1.1',
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            referrer='https://google.com',
            country_code='US',
            device_type='desktop',
            browser='Chrome',
            os_name='Windows',
            final_url='https://example.com/test'
        )
        test_db.add(visit)
        test_db.commit()

        assert visit.id is not None
        assert visit.url_id == url_obj.id
        assert visit.ip_address == '192.168.1.1'
        assert visit.country_code == 'US'
        assert visit.device_type == 'desktop'
        assert visit.browser == 'Chrome'
        assert visit.os_name == 'Windows'

    def test_create_visit_mobile(self, test_db):
        """Test creating a visit from mobile device"""
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        visit = Visit(
            url_id=url_obj.id,
            ip_address='10.0.0.1',
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
            referrer='',
            country_code='FR',
            device_type='mobile',
            browser='Safari',
            os_name='iOS',
            final_url='https://example.com/mobile-version'
        )
        test_db.add(visit)
        test_db.commit()

        assert visit.device_type == 'mobile'
        assert visit.country_code == 'FR'
        assert visit.final_url == 'https://example.com/mobile-version'

    def test_visit_to_dict(self, test_db):
        """Test Visit to_dict conversion"""
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        visit = Visit(
            url_id=url_obj.id,
            ip_address='127.0.0.1',
            user_agent='Test Agent',
            referrer='direct',
            country_code='XX',
            device_type='desktop',
            browser='Unknown',
            os_name='Unknown',
            final_url=original_url
        )
        test_db.add(visit)
        test_db.commit()

        data = visit.to_dict()

        assert data["id"] == visit.id
        assert data["url_id"] == url_obj.id
        assert data["ip_address"] == '127.0.0.1'
        assert data["country_code"] == 'XX'
        assert data["device_type"] == 'desktop'
        assert data["final_url"] == original_url
        assert data["created_at"] is not None
