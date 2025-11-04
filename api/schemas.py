"""
Pydantic schemas for URL Shortener API
"""
from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class UrlCreate(BaseModel):
    """Schema for creating a new short URL"""
    original_url: HttpUrl

    class Config:
        schema_extra = {
            "example": {
                "original_url": "https://example.com/very/long/url"
            }
        }

class UrlResponse(BaseModel):
    """Schema for URL response"""
    id: int
    short_code: str
    original_url: str
    short_url: str
    created_at: datetime

    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "id": "1",
                "short_code": "abc123",
                "original_url": "https://example.com/very/long/url",
                "short_url": "http://localhost:8000/abc123",
                "created_at": "2023-01-01T00:00:00Z"
            }
        }

class UrlInfo(BaseModel):
    """Schema for URL information"""
    short_code: str
    original_url: str
    click_count: int
    created_at: datetime

    class Config:
        from_attributes = True
