"""
Unit tests for URL Shortener Pydantic schemas
"""

import pytest
from pydantic import ValidationError

from schemas import UrlCreate, UrlInfo, UrlResponse


class TestUrlCreate:
    """Test cases for UrlCreate schema"""

    def test_valid_url_create(self):
        """Test valid URL creation"""
        data = {"original_url": "https://example.com/test"}
        url_create = UrlCreate(**data)

        assert url_create.original_url == "https://example.com/test"

    def test_url_create_with_http(self):
        """Test URL creation with HTTP protocol"""
        data = {"original_url": "http://example.com/test"}
        url_create = UrlCreate(**data)

        assert url_create.original_url == "http://example.com/test"

    def test_url_create_invalid_protocol(self):
        """Test URL creation fails with invalid protocol"""
        data = {"original_url": "ftp://example.com/file"}

        with pytest.raises(ValidationError):
            UrlCreate(**data)

    def test_url_create_no_protocol(self):
        """Test URL creation fails without protocol"""
        data = {"original_url": "example.com"}

        with pytest.raises(ValidationError):
            UrlCreate(**data)

    def test_url_create_empty_string(self):
        """Test URL creation fails with empty string"""
        data = {"original_url": ""}

        with pytest.raises(ValidationError):
            UrlCreate(**data)


class TestUrlResponse:
    """Test cases for UrlResponse schema"""

    def test_valid_url_response(self):
        """Test valid URL response creation"""
        from datetime import datetime

        data = {
            "id": 1,
            "short_code": "abc123",
            "original_url": "https://example.com/test",
            "short_url": "http://localhost:8000/abc123",
            "created_at": datetime(2023, 1, 1, 12, 0, 0),
        }

        url_response = UrlResponse(**data)

        assert url_response.id == 1
        assert url_response.short_code == "abc123"
        assert url_response.original_url == "https://example.com/test"
        assert url_response.short_url == "http://localhost:8000/abc123"
        assert url_response.created_at == datetime(2023, 1, 1, 12, 0, 0)

    def test_url_response_missing_required_field(self):
        """Test URL response fails with missing required field"""
        data = {
            "id": 1,
            "short_code": "abc123",
            "original_url": "https://example.com/test",
            "short_url": "http://localhost:8000/abc123",
            # missing created_at
        }

        with pytest.raises(ValidationError):
            UrlResponse(**data)


class TestUrlInfo:
    """Test cases for UrlInfo schema"""

    def test_valid_url_info(self):
        """Test valid URL info creation"""
        from datetime import datetime

        data = {
            "short_code": "abc123",
            "original_url": "https://example.com/test",
            "click_count": 42,
            "created_at": datetime(2023, 1, 1, 12, 0, 0),
        }

        url_info = UrlInfo(**data)

        assert url_info.short_code == "abc123"
        assert url_info.original_url == "https://example.com/test"
        assert url_info.click_count == 42
        assert url_info.created_at == datetime(2023, 1, 1, 12, 0, 0)

    def test_url_info_zero_clicks(self):
        """Test URL info with zero clicks"""
        from datetime import datetime

        data = {
            "short_code": "abc123",
            "original_url": "https://example.com/test",
            "click_count": 0,
            "created_at": datetime(2023, 1, 1, 12, 0, 0),
        }

        url_info = UrlInfo(**data)
        assert url_info.click_count == 0

    def test_url_info_missing_required_field(self):
        """Test URL info fails with missing required field"""
        data = {
            "short_code": "abc123",
            "original_url": "https://example.com/test",
            "click_count": 42,
            # missing created_at
        }

        with pytest.raises(ValidationError):
            UrlInfo(**data)
