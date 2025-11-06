"""
Unit tests for Celery tasks
"""

from unittest.mock import MagicMock, Mock, patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from models import Base, Url, Visit
from tasks import cleanup_old_visits, log_visit, process_analytics


@pytest.fixture(scope="function")
def test_db():
    """Create a test database in memory"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
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


class TestLogVisitTask:
    """Test cases for log_visit Celery task"""

    @patch("tasks.get_db_session")
    def test_log_visit_success(self, mock_get_db_session, test_db):
        """Test successful visit logging"""
        # Create a test URL in our test DB
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        # Mock the database session
        mock_db = MagicMock()
        mock_get_db_session.return_value = mock_db

        # Mock URL query
        mock_url = MagicMock()
        mock_url.id = url_obj.id
        mock_url.click_count = 5
        mock_db.query.return_value.filter.return_value.first.return_value = mock_url

        # Mock visit creation
        mock_visit = MagicMock()
        mock_visit.id = 123
        mock_db.add.return_value = None
        mock_db.commit.return_value = None

        # Test data
        request_data = {
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "referrer": "https://google.com",
        }

        # Mock the task instance
        task_instance = log_visit()
        task_instance.retry = Mock()

        # Mock geoip and user_agents
        with patch("tasks.geoip2") as mock_geoip2, patch(
            "tasks.user_agents"
        ) as mock_ua, patch("os.path.exists", return_value=False):

            # Setup mocks
            mock_ua.parse.return_value.is_mobile = False
            mock_ua.parse.return_value.is_tablet = False
            mock_ua.parse.return_value.browser.family = "Chrome"
            mock_ua.parse.return_value.os.family = "Windows"

            # Execute task
            result = task_instance(
                url_id=url_obj.id, request_data=request_data, final_url=original_url
            )

            # Verify result
            assert result["status"] == "success"
            assert result["visit_id"] == 123

            # Verify database calls
            mock_db.add.assert_called()
            mock_db.commit.assert_called()

    @patch("tasks.get_db_session")
    def test_log_visit_geoip_success(self, mock_get_db_session, test_db):
        """Test visit logging with GeoIP database available"""
        # Create a test URL
        base_url = "http://localhost:8000"
        original_url = "https://example.com/test"
        url_obj = Url.create_short_url(test_db, original_url, base_url)

        # Mock the database session
        mock_db = MagicMock()
        mock_get_db_session.return_value = mock_db

        # Mock URL query
        mock_url = MagicMock()
        mock_url.id = url_obj.id
        mock_url.click_count = 5
        mock_db.query.return_value.filter.return_value.first.return_value = mock_url

        # Test data
        request_data = {
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)",
            "referrer": "https://google.com",
        }

        # Mock the task instance
        task_instance = log_visit()
        task_instance.retry = Mock()

        # Mock geoip with database available
        with patch("tasks.geoip2") as mock_geoip2, patch(
            "tasks.user_agents"
        ) as mock_ua, patch("os.path.exists", return_value=True):

            # Setup GeoIP mock
            mock_reader = MagicMock()
            mock_response = MagicMock()
            mock_response.country.iso_code = "FR"
            mock_reader.country.return_value = mock_response
            mock_geoip2.database.Reader.return_value.__enter__.return_value = (
                mock_reader
            )

            # Setup user agent mock
            mock_ua.parse.return_value.is_mobile = True
            mock_ua.parse.return_value.is_tablet = False
            mock_ua.parse.return_value.browser.family = "Safari"
            mock_ua.parse.return_value.os.family = "iOS"

            # Execute task
            result = task_instance(
                url_id=url_obj.id, request_data=request_data, final_url=original_url
            )

            # Verify result
            assert result["status"] == "success"

    @patch("tasks.get_db_session")
    def test_log_visit_retry_on_failure(self, mock_get_db_session):
        """Test task retry on database failure"""
        mock_get_db_session.side_effect = Exception("Database connection failed")

        task_instance = log_visit()
        task_instance.retry = Mock()

        request_data = {
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0",
            "referrer": "direct",
        }

        result = task_instance(
            url_id=1, request_data=request_data, final_url="https://example.com"
        )

        # Should retry on failure
        task_instance.retry.assert_called_once()
        assert result["status"] == "error"


class TestProcessAnalyticsTask:
    """Test cases for process_analytics Celery task"""

    def test_process_analytics_placeholder(self):
        """Test that process_analytics task exists and runs without error"""
        # This is currently a placeholder task
        result = process_analytics(url_id=1)

        # Should complete without error
        assert result is None


class TestCleanupOldVisitsTask:
    """Test cases for cleanup_old_visits Celery task"""

    @patch("tasks.get_db_session")
    @patch("tasks.timedelta")
    def test_cleanup_old_visits_success(self, mock_timedelta, mock_get_db_session):
        """Test successful cleanup of old visits"""
        # Mock database session
        mock_db = MagicMock()
        mock_get_db_session.return_value = mock_db

        # Mock query and delete
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value.delete.return_value = 42  # 42 records deleted

        # Mock timedelta
        mock_timedelta.return_value = MagicMock()

        # Execute task
        result = cleanup_old_visits(days=90)

        # Verify result
        assert result["status"] == "success"
        assert result["deleted"] == 42

        # Verify database calls
        mock_db.commit.assert_called_once()

    @patch("tasks.get_db_session")
    def test_cleanup_old_visits_error(self, mock_get_db_session):
        """Test cleanup task error handling"""
        mock_get_db_session.side_effect = Exception("Database error")

        result = cleanup_old_visits(days=30)

        assert result["status"] == "error"
        assert "Database error" in result["error"]
