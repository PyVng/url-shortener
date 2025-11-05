"""
SQLAlchemy models for URL Shortener
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, func, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import string
import random
import os
import hashlib
import secrets

Base = declarative_base()


class User(Base):
    """User model"""
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
        """Hash password using SHA-256 with salt"""
        salt = secrets.token_hex(16)
        return hashlib.sha256(f"{salt}{password}".encode()).hexdigest() + salt

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        if len(password_hash) < 64:
            return False
        hash_part = password_hash[:64]
        salt = password_hash[64:]
        return hashlib.sha256(f"{salt}{password}".encode()).hexdigest() == hash_part

    @classmethod
    def create_user(cls, db_session, username: str, email: str, password: str):
        """Create a new user"""
        if db_session.query(cls).filter(
            (cls.username == username) | (cls.email == email)
        ).first():
            raise ValueError("Пользователь с таким именем или email уже существует")

        user = cls(
            username=username,
            email=email,
            password_hash=cls.hash_password(password)
        )

        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        return user

    @classmethod
    def authenticate(cls, db_session, username_or_email: str, password: str):
        """Authenticate user"""
        user = db_session.query(cls).filter(
            (cls.username == username_or_email) | (cls.email == username_or_email)
        ).first()

        if user and cls.verify_password(password, user.password_hash):
            return user
        return None

    def to_dict(self):
        """Convert to dictionary (without password)"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.strftime("%Y-%m-%dT%H:%M:%S") if self.created_at else None
        }


class Url(Base):
    """URL model"""
    __tablename__ = "urls"

    id = Column(Integer, primary_key=True, index=True)
    short_code = Column(String(20), unique=True, index=True, nullable=False)
    original_url = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    click_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

    @staticmethod
    def generate_short_code(length: int = 6) -> str:
        """Generate a random short code"""
        chars = string.ascii_letters + string.digits
        return ''.join(random.choice(chars) for _ in range(length))

    @classmethod
    def create_short_url(cls, db_session, original_url: str, base_url: str, user_id=None):
        """Create a new short URL"""
        # Convert HttpUrl to string if needed
        url_str = str(original_url)

        # Validate URL format
        if not url_str.startswith(('http://', 'https://')):
            raise ValueError("URL должен начинаться с http:// или https://")

        if len(url_str) > 2000:
            raise ValueError("URL слишком длинный")

        # Generate unique short code
        max_attempts = 10
        for _ in range(max_attempts):
            short_code = cls.generate_short_code()
            existing = db_session.query(cls).filter(cls.short_code == short_code).first()
            if not existing:
                break
        else:
            raise ValueError("Не удалось сгенерировать уникальный короткий код")

        # Create new URL
        url_obj = cls(
            short_code=short_code,
            original_url=url_str,
            user_id=user_id
        )

        db_session.add(url_obj)
        db_session.commit()
        db_session.refresh(url_obj)

        # Add short_url property
        url_obj.short_url = f"{base_url}/{short_code}"

        return url_obj

    @classmethod
    def get_by_short_code(cls, db_session, short_code: str):
        """Get URL by short code"""
        return db_session.query(cls).filter(cls.short_code == short_code).first()

    @classmethod
    def get_original_url(cls, db_session, short_code: str) -> str:
        """Get original URL and increment click count"""
        url_obj = cls.get_by_short_code(db_session, short_code)
        if not url_obj:
            return None

        # Increment click count
        url_obj.click_count += 1
        db_session.commit()

        return url_obj.original_url

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "short_code": self.short_code,
            "original_url": self.original_url,
            "short_url": getattr(self, 'short_url', ''),
            "user_id": self.user_id,
            "click_count": self.click_count,
            "created_at": self.created_at.strftime("%Y-%m-%dT%H:%M:%S") if self.created_at else None
        }
