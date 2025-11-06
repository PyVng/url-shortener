"""
Celery configuration for URL Shortener
"""

import os

from celery import Celery
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Redis URL for Celery broker and backend
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "url_shortener", broker=REDIS_URL, backend=REDIS_URL, include=["tasks"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "tasks.log_visit": {"queue": "visits"},
        "tasks.process_analytics": {"queue": "analytics"},
    },
    task_default_queue="default",
    task_default_exchange="url_shortener",
    task_default_routing_key="url_shortener",
)

if __name__ == "__main__":
    celery_app.start()
