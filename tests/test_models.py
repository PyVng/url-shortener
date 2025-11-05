"""
Unit tests for URL Shortener models
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from models import Base, Url


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
