"""
Unit tests for Redis cache functionality
"""
import pytest
from unittest.mock import Mock, patch
from cache import Cache


class TestCache:
    """Test cases for Cache class"""

    @patch('redis.from_url')
    def test_cache_initialization_success(self, mock_redis_from_url):
        """Test successful cache initialization"""
        mock_redis = Mock()
        mock_redis_from_url.return_value = mock_redis

        cache = Cache()

        assert cache.redis_client is not None
        mock_redis_from_url.assert_called_once()

    @patch('redis.from_url')
    def test_cache_initialization_failure(self, mock_redis_from_url):
        """Test cache initialization with Redis failure"""
        mock_redis_from_url.side_effect = Exception("Redis connection failed")

        cache = Cache()

        assert cache.redis_client is None

    @patch('redis.from_url')
    def test_get_url_data_success(self, mock_redis_from_url):
        """Test successful URL data retrieval from cache"""
        mock_redis = Mock()
        mock_redis_from_url.return_value = mock_redis

        # Mock Redis get response
        mock_redis.get.return_value = b'{"id": 1, "original_url": "https://example.com"}'

        cache = Cache()
        result = cache.get_url_data("abc123")

        assert result == {"id": 1, "original_url": "https://example.com"}
        mock_redis.get.assert_called_once_with("url:abc123")

    @patch('redis.from_url')
    def test_get_url_data_not_found(self, mock_redis_from_url):
        """Test URL data not found in cache"""
        mock_redis = Mock()
        mock_redis_from_url.return_value = mock_redis
        mock_redis.get.return_value = None

        cache = Cache()
        result = cache.get_url_data("nonexistent")

        assert result is None

    @patch('redis.from_url')
    def test_get_url_data_redis_failure(self, mock_redis_from_url):
        """Test cache failure handling"""
        mock_redis = Mock()
        mock_redis_from_url.return_value = mock_redis
        mock_redis.get.side_effect = Exception("Redis error")

        cache = Cache()
        result = cache.get_url_data("abc123")

        assert result is None

    @patch('redis.from_url')
    def test_get_url_data_no_redis(self):
        """Test cache behavior when Redis is not available"""
        cache = Cache()
        cache.redis_client = None

        result = cache.get_url_data("abc123")

        assert result is None

    @patch('redis.from_url')
    def test_set_url_data_success(self, mock_redis_from_url):
        """Test successful URL data storage in cache"""
        mock_redis = Mock()
        mock_redis_from_url.return_value = mock_redis

        cache = Cache()
        test_data = {"id": 1, "original_url": "https://example.com"}

        cache.set_url_data("abc123", test_data)

        mock_redis.setex.assert_called_once()
        args, kwargs = mock_redis.setex.call_args
        assert args[0] == "url:abc123"
        assert args[1] == 3600  # Default TTL
        assert '"id": 1' in args[2]  # JSON string contains our data

    @patch('redis.from_url')
    def test_set_url_data_custom_ttl(self, mock_redis_from_url):
        """Test URL data storage with custom TTL"""
        mock_redis = Mock()
        mock_redis_from_url.return_value = mock_redis

        cache = Cache()
        test_data = {"id": 1, "original_url": "https://example.com"}

        cache.set_url_data("abc123", test_data, ttl=1800)

        args, kwargs = mock_redis.setex.call_args
        assert args[1] == 1800

    @patch('redis.from_url')
    def test_set_url_data_no_redis(self):
        """Test cache set behavior when Redis is not available"""
        cache = Cache()
        cache.redis_client = None

        # Should not raise exception
        cache.set_url_data("abc123", {"test": "data"})

    @patch('redis.from_url')
    def test_invalidate_url_success(self, mock_redis_from_url):
        """Test successful URL cache invalidation"""
        mock_redis = Mock()
        mock_redis_from_url.return_value = mock_redis

        cache = Cache()
        cache.invalidate_url("abc123")

        mock_redis.delete.assert_called_once_with("url:abc123")

    @patch('redis.from_url')
    def test_invalidate_url_no_redis(self):
        """Test cache invalidation when Redis is not available"""
        cache = Cache()
        cache.redis_client = None

        # Should not raise exception
        cache.invalidate_url("abc123")

    @patch('redis.from_url')
    def test_get_cache_stats_success(self, mock_redis_from_url):
        """Test successful cache statistics retrieval"""
        mock_redis = Mock()
        mock_redis_from_url.return_value = mock_redis

        # Mock Redis info response
        mock_redis.info.return_value = {
            "connected_clients": "5",
            "used_memory_human": "1.2M",
            "total_keys": 150
        }
        mock_redis.dbsize.return_value = 150

        cache = Cache()
        stats = cache.get_cache_stats()

        assert stats["connected_clients"] == "5"
        assert stats["used_memory"] == "1.2M"
        assert stats["total_keys"] == 150

    @patch('redis.from_url')
    def test_get_cache_stats_no_redis(self):
        """Test cache stats when Redis is not available"""
        cache = Cache()
        cache.redis_client = None

        stats = cache.get_cache_stats()

        assert stats == {"error": "Redis not connected"}

    @patch('redis.from_url')
    def test_increment_counter_success(self, mock_redis_from_url):
        """Test successful counter increment"""
        mock_redis = Mock()
        mock_redis_from_url.return_value = mock_redis
        mock_redis.incrby.return_value = 5

        cache = Cache()
        result = cache.increment_counter("test_counter", 2)

        assert result == 5
        mock_redis.incrby.assert_called_once_with("test_counter", 2)

    @patch('redis.from_url')
    def test_increment_counter_no_redis(self):
        """Test counter increment when Redis is not available"""
        cache = Cache()
        cache.redis_client = None

        result = cache.increment_counter("test_counter")

        assert result == 0

    @patch('redis.from_url')
    def test_get_counter_success(self, mock_redis_from_url):
        """Test successful counter retrieval"""
        mock_redis = Mock()
        mock_redis_from_url.return_value = mock_redis
        mock_redis.get.return_value = b"42"

        cache = Cache()
        result = cache.get_counter("test_counter")

        assert result == 42
        mock_redis.get.assert_called_once_with("test_counter")

    @patch('redis.from_url')
    def test_get_counter_not_found(self, mock_redis_from_url):
        """Test counter retrieval when key doesn't exist"""
        mock_redis = Mock()
        mock_redis_from_url.return_value = mock_redis
        mock_redis.get.return_value = None

        cache = Cache()
        result = cache.get_counter("nonexistent_counter")

        assert result == 0

    @patch('redis.from_url')
    def test_get_counter_no_redis(self):
        """Test counter retrieval when Redis is not available"""
        cache = Cache()
        cache.redis_client = None

        result = cache.get_counter("test_counter")

        assert result == 0
