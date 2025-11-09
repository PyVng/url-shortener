"""SQLAlchemy models for URL Shortener."""

import hashlib
import random
import secrets
import string
from typing import Optional

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Session, declarative_base, relationship

Base = declarative_base()


class User(Base):
    """User model."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=func.now())

    # Relationship with URLs
    urls = relationship("Url", backref="user")

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using SHA-256 with salt."""
        salt = secrets.token_hex(16)  # 32 hex chars
        hash_obj = hashlib.sha256()
        hash_obj.update(f"{salt}{password}".encode('utf-8'))
        return hash_obj.hexdigest() + salt

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify password against hash."""
        if len(password_hash) != 96:  # 64 hash + 32 salt
            return False
        hash_part = password_hash[:64]
        salt = password_hash[64:]
        hash_obj = hashlib.sha256()
        hash_obj.update(f"{salt}{password}".encode('utf-8'))
        return hash_obj.hexdigest() == hash_part

    @classmethod
    def create_user(
        cls, db_session: Session, username: str, email: str, password: str
    ) -> "User":
        """Create a new user."""
        if (
            db_session.query(cls)
            .filter((cls.username == username) | (cls.email == email))
            .first()
        ):
            raise ValueError("Пользователь с таким именем или email уже существует")

        user = cls(
            username=username, email=email, password_hash=cls.hash_password(password)
        )

        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        return user

    @classmethod
    def authenticate(
        cls, db_session: Session, username_or_email: str, password: str
    ) -> Optional["User"]:
        """Authenticate user by username/email and password."""
        user = (
            db_session.query(cls)
            .filter(
                (cls.username == username_or_email) | (cls.email == username_or_email)
            )
            .first()
        )

        if user and cls.verify_password(password, user.password_hash):
            return user
        return None

    def to_dict(self):
        """Convert to dictionary (without password)."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": (
                self.created_at.strftime("%Y-%m-%dT%H:%M:%S")
                if self.created_at
                else None
            ),
        }


class Url(Base):
    """URL model."""

    __tablename__ = "urls"

    id = Column(Integer, primary_key=True, index=True)
    short_code = Column(String(20), unique=True, index=True, nullable=False)
    original_url = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    click_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

    @staticmethod
    def generate_short_code(length: int = 6) -> str:
        """Generate a random short code."""
        chars = string.ascii_letters + string.digits
        return "".join(random.choice(chars) for _ in range(length))

    @classmethod
    def create_short_url(
        cls, db_session, original_url: str, base_url: str, user_id=None
    ) -> "Url":
        """Create a new short URL."""
        # Convert HttpUrl to string if needed
        url_str = str(original_url)

        # Validate URL format
        if not url_str.startswith(("http://", "https://")):
            raise ValueError("URL должен начинаться с http:// или https://")

        if len(url_str) > 2000:
            raise ValueError("URL слишком длинный")

        # Generate unique short code
        max_attempts = 10
        for _ in range(max_attempts):
            short_code = cls.generate_short_code()
            existing = (
                db_session.query(cls).filter(cls.short_code == short_code).first()
            )
            if not existing:
                break
        else:
            raise ValueError("Не удалось сгенерировать уникальный короткий код")

        # Create new URL
        url_obj = cls(short_code=short_code, original_url=url_str, user_id=user_id)

        db_session.add(url_obj)
        db_session.commit()
        db_session.refresh(url_obj)

        # Add short_url property
        url_obj.short_url = f"{base_url}/{short_code}"

        return url_obj

    @classmethod
    def get_by_short_code(cls, db_session, short_code: str) -> "Url | None":
        """Get URL by short code."""
        return db_session.query(cls).filter(cls.short_code == short_code).first()

    @classmethod
    def get_original_url(cls, db_session, short_code: str) -> str | None:
        """Get original URL and increment click count."""
        url_obj = cls.get_by_short_code(db_session, short_code)
        if not url_obj:
            return None

        # Increment click count
        url_obj.click_count += 1
        db_session.commit()

        return url_obj.original_url

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "short_code": self.short_code,
            "original_url": self.original_url,
            "short_url": getattr(self, "short_url", ""),
            "user_id": self.user_id,
            "click_count": self.click_count,
            "created_at": (
                self.created_at.strftime("%Y-%m-%dT%H:%M:%S")
                if self.created_at
                else None
            ),
        }


class Rule(Base):
    """Rule model for conditional redirects."""

    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    url_id = Column(Integer, ForeignKey("urls.id"), index=True, nullable=False)
    rule_type = Column(
        String(50), nullable=False
    )  # 'country', 'device', 'referrer', 'time', 'weight'
    condition_value = Column(String(100))  # 'US', 'mobile', 'google.com', '09:00-18:00'
    target_url = Column(Text, nullable=False)
    weight = Column(Float, default=0.0)  # For A/B testing (0.0-1.0)
    priority = Column(Integer, default=0)  # Rule priority (higher = checked first)
    is_active = Column(Integer, default=1)  # 1 = active, 0 = inactive
    created_at = Column(DateTime, default=func.now())

    # Relationship with URL
    url = relationship("Url", backref="rules")

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "url_id": self.url_id,
            "rule_type": self.rule_type,
            "condition_value": self.condition_value,
            "target_url": self.target_url,
            "weight": self.weight,
            "priority": self.priority,
            "is_active": bool(self.is_active),
            "created_at": (
                self.created_at.strftime("%Y-%m-%dT%H:%M:%S")
                if self.created_at
                else None
            ),
        }


class Visit(Base):
    """Visit model for click analytics."""

    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    url_id = Column(Integer, ForeignKey("urls.id"), index=True, nullable=False)
    ip_address = Column(String(45))  # IPv4/IPv6 support
    user_agent = Column(Text)
    referrer = Column(Text)
    country_code = Column(String(2))  # ISO 3166-1 alpha-2
    device_type = Column(String(20))  # 'mobile', 'tablet', 'desktop'
    browser = Column(String(50))
    os_name = Column(String(50))  # Renamed to avoid conflict with 'os' import
    final_url = Column(Text)  # URL where user was redirected
    created_at = Column(DateTime, default=func.now())

    # Relationship with URL
    url = relationship("Url", backref="visits")

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "url_id": self.url_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "referrer": self.referrer,
            "country_code": self.country_code,
            "device_type": self.device_type,
            "browser": self.browser,
            "os": self.os_name,
            "final_url": self.final_url,
            "created_at": (
                self.created_at.strftime("%Y-%m-%dT%H:%M:%S")
                if self.created_at
                else None
            ),
        }
