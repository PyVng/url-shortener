"""
Celery tasks for URL Shortener
"""
from celery_app import celery_app
from database import get_db_session
from models import Visit, Url
import geoip2.database
import user_agents
import os
from datetime import datetime, timedelta


@celery_app.task(bind=True)
def log_visit(self, url_id: int, request_data: dict, final_url: str):
    """
    Log a visit to a URL with analytics data
    """
    try:
        db = get_db_session()

        # Extract data from request
        ip_address = request_data.get("ip_address", "")
        user_agent_str = request_data.get("user_agent", "")
        referrer = request_data.get("referrer", "")

        # Determine country from IP
        country_code = None
        try:
            # Use GeoLite2-Country.mmdb if available
            geo_db_path = os.getenv("GEOIP_DB_PATH", "/usr/share/GeoIP/GeoLite2-Country.mmdb")
            if os.path.exists(geo_db_path):
                with geoip2.database.Reader(geo_db_path) as reader:
                    response = reader.country(ip_address)
                    country_code = response.country.iso_code
        except Exception as e:
            # Log error but continue without country
            print(f"GeoIP lookup failed: {e}")

        # Parse User-Agent
        device_type = "desktop"
        browser = ""
        os_name = ""

        try:
            ua = user_agents.parse(user_agent_str)
            device_type = "mobile" if ua.is_mobile else ("tablet" if ua.is_tablet else "desktop")
            browser = ua.browser.family
            os_name = ua.os.family
        except Exception as e:
            print(f"User-Agent parsing failed: {e}")

        # Create visit record
        visit = Visit(
            url_id=url_id,
            ip_address=ip_address,
            user_agent=user_agent_str,
            referrer=referrer,
            country_code=country_code,
            device_type=device_type,
            browser=browser,
            os_name=os_name,
            final_url=final_url
        )

        db.add(visit)
        db.commit()

        # Update URL click count
        url = db.query(Url).filter(Url.id == url_id).first()
        if url:
            url.click_count += 1
            db.commit()

        return {"status": "success", "visit_id": visit.id}

    except Exception as e:
        print(f"Error logging visit: {e}")
        # Retry the task
        self.retry(countdown=60, max_retries=3)
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@celery_app.task
def process_analytics(url_id: int):
    """
    Process analytics data for a URL (future enhancement)
    """
    # Placeholder for future analytics processing
    # Could calculate daily stats, update caches, etc.
    pass


@celery_app.task
def cleanup_old_visits(days: int = 90):
    """
    Clean up old visit records (older than specified days)
    """
    try:
        db = get_db_session()
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        deleted_count = db.query(Visit).filter(
            Visit.created_at < cutoff_date
        ).delete()

        db.commit()
        return {"status": "success", "deleted": deleted_count}

    except Exception as e:
        print(f"Error cleaning up visits: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()
