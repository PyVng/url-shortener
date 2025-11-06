#!/usr/bin/env python3
"""
Script to run Celery worker for URL Shortener
"""
import os

from celery_app import celery_app

if __name__ == "__main__":
    # Set environment variables for Celery
    os.environ.setdefault("C_FORCE_ROOT", "true")  # Allow running as root in containers

    # Start the worker
    celery_app.worker_main(
        [
            "worker",
            "--loglevel=info",
            "--concurrency=2",  # Number of worker processes
            "--pool=prefork",  # Process pool type
            "--hostname=url-shortener@%h",  # Worker hostname
            "--queues=visits,analytics,default",  # Queues to consume
        ]
    )
