"""Shared pytest fixtures and configuration for URL Shortener tests."""

import pytest


@pytest.fixture(autouse=True, scope="function")
def cleanup_global_database_state(monkeypatch):
    """Reset global database engine state before each test to prevent leaks."""
    monkeypatch.setattr("database._engine", None)
