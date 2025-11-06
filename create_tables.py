#!/usr/bin/env python3
"""
Script to create database tables for URL Shortener
"""
import os

from database import init_db

if __name__ == "__main__":
    print("Creating database tables...")
    try:
        init_db()
        print("✅ Tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
