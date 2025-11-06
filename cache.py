"""
Redis cache management for URL Shortener
"""

import json
import os
from typing import Any, Dict, Optional

import redis
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Redis configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CACHE_TTL = int(os.getenv("CACHE_TTL", "3600"))  # 1 hour default


class Cache:
    """Redis cache wrapper"""

    def __init__(self):
        try:
            self.redis_client = redis.from_url(REDIS_URL)
        except Exception as e:
            print(f"Redis connection failed: {e}")
            self.redis_client = None

    def get_url_data(self, short_code: str) -> Optional[Dict[str, Any]]:
        """Get URL data from cache"""
        if not self.redis_client:
            return None

        try:
            key = f"url:{short_code}"
            data = self.redis_client.get(key)  # type: ignore
            if data:
                return json.loads(data.decode("utf-8"))  # type: ignore
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    def set_url_data(self, short_code: str, data: Dict[str, Any], ttl: int = CACHE_TTL):
        """Set URL data in cache"""
        if not self.redis_client:
            return

        try:
            key = f"url:{short_code}"
            self.redis_client.setex(key, ttl, json.dumps(data))
        except Exception as e:
            print(f"Cache set error: {e}")

    def invalidate_url(self, short_code: str):
        """Remove URL from cache"""
        if not self.redis_client:
            return

        try:
            key = f"url:{short_code}"
            self.redis_client.delete(key)
        except Exception as e:
            print(f"Cache delete error: {e}")

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if not self.redis_client:
            return {"error": "Redis not connected"}

        try:
            info = self.redis_client.info()
            return {
                "connected_clients": info.get("connected_clients", 0),
                "used_memory": info.get("used_memory_human", "0B"),
                "total_keys": self.redis_client.dbsize(),
            }
        except Exception as e:
            print(f"Cache stats error: {e}")
            return {"error": str(e)}

    def increment_counter(self, key: str, amount: int = 1) -> int:
        """Increment a counter in cache"""
        if not self.redis_client:
            return 0

        try:
            return int(self.redis_client.incrby(key, amount))
        except Exception as e:
            print(f"Counter increment error: {e}")
            return 0

    def get_counter(self, key: str) -> int:
        """Get counter value from cache"""
        if not self.redis_client:
            return 0

        try:
            value = self.redis_client.get(key)
            return int(value.decode("utf-8")) if value else 0
        except Exception as e:
            print(f"Counter get error: {e}")
            return 0


# Global cache instance
cache = Cache()
