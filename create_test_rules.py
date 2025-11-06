#!/usr/bin/env python3
"""
Script to create test routing rules for demonstration
"""
from database import init_db, get_db_session
from models import Url, Rule

def create_test_rules():
    """Create test URL with routing rules"""
    print("Creating test routing rules...")

    # Initialize database
    init_db()

    db = get_db_session()

    try:
        # Create a test URL
        test_url = Url.create_short_url(
            db,
            "https://example.com/original",
            "http://localhost:8001",
            None  # No user
        )

        print(f"Created test URL: {test_url.short_code} -> {test_url.original_url}")

        # Create routing rules for different scenarios

        # 1. Country-based routing (France -> French version)
        rule_fr = Rule(
            url_id=test_url.id,
            rule_type='country',
            condition_value='FR',
            target_url='https://example.com/french-version',
            priority=10,
            is_active=1
        )
        db.add(rule_fr)

        # 2. Device-based routing (Mobile -> Mobile optimized)
        rule_mobile = Rule(
            url_id=test_url.id,
            rule_type='device',
            condition_value='mobile',
            target_url='https://example.com/mobile-version',
            priority=9,
            is_active=1
        )
        db.add(rule_mobile)

        # 3. Time-based routing (Business hours -> Promo page)
        rule_business = Rule(
            url_id=test_url.id,
            rule_type='time',
            condition_value='09:00-18:00',
            target_url='https://example.com/business-promo',
            priority=8,
            is_active=1
        )
        db.add(rule_business)

        # 4. Referrer-based routing (From Google -> SEO landing)
        rule_google = Rule(
            url_id=test_url.id,
            rule_type='referrer',
            condition_value='google.com',
            target_url='https://example.com/seo-landing',
            priority=7,
            is_active=1
        )
        db.add(rule_google)

        # 5. A/B testing (50% chance -> Alternative version)
        rule_ab = Rule(
            url_id=test_url.id,
            rule_type='weight',
            condition_value='0.5',  # 50% weight
            target_url='https://example.com/alternative-version',
            weight=0.5,
            priority=5,
            is_active=1
        )
        db.add(rule_ab)

        db.commit()

        print("✅ Created test routing rules:")
        print(f"   Short code: {test_url.short_code}")
        print("   Rules:")
        print("   - FR (France) -> French version")
        print("   - Mobile devices -> Mobile version")
        print("   - Business hours (9-18) -> Business promo")
        print("   - From Google -> SEO landing")
        print("   - 50% A/B test -> Alternative version")
        print()
        print("Test the rules:")
        print(f"curl -H 'X-Forwarded-For: 1.2.3.4' http://localhost:8001/{test_url.short_code}")
        print(f"curl -H 'User-Agent: Mozilla/5.0 (iPhone...' http://localhost:8001/{test_url.short_code}")
        print(f"curl -H 'Referer: https://google.com' http://localhost:8001/{test_url.short_code}")

    except Exception as e:
        print(f"❌ Error creating test rules: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_rules()
