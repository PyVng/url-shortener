"""Database connection and session management for URL Shortener."""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Load environment variables
load_dotenv()

# Database URL - use Vercel Postgres for production, SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")

# Always use SQLite for local development (unless explicitly set to Postgres)
# Check for Vercel environment or explicit ENVIRONMENT setting
vercel_env = os.getenv("VERCEL_ENV")
is_production = (vercel_env == "production") or (
    os.getenv("ENVIRONMENT") == "production"
)

if not DATABASE_URL or not is_production:
    DATABASE_URL = "sqlite:///./local.db"
else:
    # Ensure PostgreSQL URL uses the correct scheme for SQLAlchemy 2.0
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # Clean up Supabase-specific parameters that psycopg2 doesn't understand
    from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

    parsed = urlparse(DATABASE_URL)
    query_params = parse_qs(parsed.query)

    # Remove Supabase-specific parameters
    supabase_params = ["supa", "pgbouncer"]
    cleaned_params = {k: v for k, v in query_params.items() if k not in supabase_params}

    # Reconstruct URL without invalid parameters
    if cleaned_params:
        parsed = parsed._replace(query=urlencode(cleaned_params, doseq=True))
    else:
        parsed = parsed._replace(query="")

    DATABASE_URL = urlunparse(parsed)


# Create engine lazily
_engine = None


def get_engine():
    """Get database engine, creating it if necessary."""
    global _engine
    if _engine is None:
        if DATABASE_URL.startswith("sqlite"):
            # SQLite specific configuration
            _engine = create_engine(
                DATABASE_URL,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
                echo=False,
            )
        else:
            # PostgreSQL configuration with connection pooling
            _engine = create_engine(
                DATABASE_URL,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
                pool_timeout=30,
                echo=False,
            )
    return _engine


# Create SessionLocal class - bind will be set when session is created
SessionLocal = sessionmaker(autocommit=False, autoflush=False)


def init_db():
    """Initialize database and create tables."""
    from models import Base

    Base.metadata.create_all(bind=get_engine())
    print("Database initialized successfully")


def get_db() -> Session:
    """Get database session."""
    db = SessionLocal(bind=get_engine())
    try:
        yield db
    finally:
        db.close()


def get_db_session() -> Session:
    """Get database session (for synchronous operations)."""
    return SessionLocal(bind=get_engine())
