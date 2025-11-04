"""
Simple test for FastAPI URL Shortener
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_main():
    """Test main page"""
    response = client.get("/")
    assert response.status_code == 200
    assert "URL Shortener" in response.text

def test_create_short_url():
    """Test creating a short URL"""
    response = client.post(
        "/api/shorten",
        json={"original_url": "https://example.com/test"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "short_code" in data
    assert "short_url" in data
    assert "original_url" in data
    assert "created_at" in data

def test_get_url_info():
    """Test getting URL info"""
    # First create a URL
    create_response = client.post(
        "/api/shorten",
        json={"original_url": "https://example.com/info-test"}
    )
    assert create_response.status_code == 201
    short_code = create_response.json()["short_code"]

    # Then get info
    info_response = client.get(f"/api/info/{short_code}")
    assert info_response.status_code == 200
    data = info_response.json()
    assert data["success"] is True
    assert data["data"]["short_code"] == short_code
    assert data["data"]["original_url"] == "https://example.com/info-test"

def test_redirect():
    """Test URL redirection"""
    # First create a URL
    create_response = client.post(
        "/api/shorten",
        json={"original_url": "https://example.com/redirect-test"}
    )
    assert create_response.status_code == 201
    short_code = create_response.json()["short_code"]

    # Then test redirect
    redirect_response = client.get(f"/{short_code}", follow_redirects=False)
    assert redirect_response.status_code == 302
    assert redirect_response.headers["location"] == "https://example.com/redirect-test"

def test_invalid_url():
    """Test invalid URL handling"""
    response = client.post(
        "/api/shorten",
        json={"original_url": "invalid-url"}
    )
    assert response.status_code == 422  # FastAPI validation error

def test_nonexistent_url():
    """Test nonexistent URL handling"""
    response = client.get("/api/info/nonexistent")
    assert response.status_code == 404

    redirect_response = client.get("/nonexistent", follow_redirects=False)
    assert redirect_response.status_code == 404

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
