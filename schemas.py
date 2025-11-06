"""Pydantic schemas for URL Shortener API."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, HttpUrl, field_validator


class UrlCreate(BaseModel):
    """Schema for creating a new short URL."""

    original_url: str

    @field_validator("original_url")
    @classmethod
    def validate_url(cls, v):
        """Validate that URL has http or https protocol and is not too long."""
        if not isinstance(v, str) or not v.strip():
            raise ValueError("URL is required")

        try:
            url_obj = HttpUrl(v)
            if url_obj.scheme not in ["http", "https"]:
                raise ValueError("URL must use http or https protocol")
            if len(str(url_obj)) > 2000:
                raise ValueError("URL is too long (max 2000 characters)")
        except Exception:
            raise ValueError("Invalid URL format")

        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"original_url": "https://example.com/very/long/url"}
        }
    )


class UrlResponse(BaseModel):
    """Schema for URL response."""

    id: int
    short_code: str
    original_url: str
    short_url: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "1",
                "short_code": "abc123",
                "original_url": "https://example.com/very/long/url",
                "short_url": "http://localhost:8000/abc123",
                "created_at": "2023-01-01T00:00:00Z",
            }
        },
    )


class UrlInfo(BaseModel):
    """Schema for URL information."""

    short_code: str
    original_url: str
    click_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    """Schema for creating a new user."""

    username: str
    email: str
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "john_doe",
                "email": "john@example.com",
                "password": "securepassword123",
            }
        }
    )


class UserLogin(BaseModel):
    """Schema for user login."""

    username_or_email: str
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username_or_email": "john_doe",
                "password": "securepassword123",
            }
        }
    )


class UserResponse(BaseModel):
    """Schema for user response."""

    id: int
    username: str
    email: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "username": "john_doe",
                "email": "john@example.com",
                "created_at": "2025-01-01T12:00:00",
            }
        },
    )


class TokenResponse(BaseModel):
    """Schema for authentication token response."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": 1,
                    "username": "john_doe",
                    "email": "john@example.com",
                    "created_at": "2025-01-01T12:00:00",
                },
            }
        }
    )
