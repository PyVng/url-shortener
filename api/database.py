"""
Database connection and session management for URL Shortener
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database URL - use Vercel Postgres for production, SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")

# Always use SQLite for local development (unless explicitly set to Postgres)
if not DATABASE_URL or os.getenv("ENVIRONMENT") != "production":
    DATABASE_URL = "sqlite:///./local.db"

# Create engine
if DATABASE_URL.startswith("sqlite"):
    # SQLite specific configuration
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )
else:
    # PostgreSQL configuration
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        echo=False
    )

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize database and create tables"""
    from models import Base
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully")

def get_db() -> Session:
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_session() -> Session:
    """Get database session (for synchronous operations)"""
    return SessionLocal()
