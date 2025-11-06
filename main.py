"""URL Shortener API built with Flask for Render."""
from flask import Flask, request, jsonify, redirect, send_file, g, render_template
from flask_cors import CORS
from flask_wtf.csrf import CSRFProtect, generate_csrf
import os
import jwt
from datetime import datetime, timedelta
from sqlalchemy import text

# Import our modules
from database import init_db, get_db
from models import Url, User, Rule
from schemas import (UrlCreate, UrlResponse, UserCreate, UserLogin,
                     UserResponse, TokenResponse)
from cache import cache
from tasks import log_visit
from datetime import datetime
import random

# Create Flask app
app = Flask(__name__)

# Enable CORS
CORS(app)

# Enable CSRF protection (disabled for API routes)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['WTF_CSRF_ENABLED'] = False
csrf = CSRFProtect(app)

# Add custom Jinja2 filters
@app.template_filter('strftime')
def strftime_filter(date, format_string):
    """Format datetime object with strftime"""
    if date:
        return date.strftime(format_string)
    return ''

# JWT Secret Key
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Database will be initialized lazily on first request
_db_initialized = False


def create_access_token(user_id: int) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode = {"sub": str(user_id), "exp": expire}
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str):
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
        return user_id
    except jwt.ExpiredSignatureError:
        return None
    except jwt.JWTError:
        return None


def get_current_user():
    """Get current user from JWT token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None

    token = auth_header.split(' ')[1]
    user_id = verify_token(token)

    if user_id:
        db = next(get_db())
        return db.query(User).get(user_id)
    return None


def ensure_db_initialized():
    """Ensure database is initialized before handling requests."""
    global _db_initialized
    if not _db_initialized:
        try:
            init_db()
            _db_initialized = True
        except Exception as e:
            print(f"Database initialization failed: {e}")
            # Don't crash the app, just log the error
            # The app can still serve the HTML page


def get_client_info():
    """Extract client information from request."""
    # Get IP address
    ip_address = (request.headers.get('X-Forwarded-For', '').split(',')[0].strip() or
                  request.headers.get('X-Real-IP', '') or
                  request.remote_addr or '127.0.0.1')

    # Get User-Agent
    user_agent_str = request.headers.get('User-Agent', '')

    # Get referrer
    referrer = request.headers.get('Referer', '')

    return {
        'ip_address': ip_address,
        'user_agent': user_agent_str,
        'referrer': referrer
    }


def get_device_type(user_agent_str: str) -> str:
    """Determine device type from User-Agent."""
    try:
        import user_agents
        ua = user_agents.parse(user_agent_str)
        if ua.is_mobile:
            return 'mobile'
        elif ua.is_tablet:
            return 'tablet'
        else:
            return 'desktop'
    except Exception:
        return 'desktop'


def get_country_code(ip_address: str) -> str:
    """Get country code from IP address."""
    try:
        import geoip2.database
        geo_db_path = os.getenv("GEOIP_DB_PATH", "/usr/share/GeoIP/GeoLite2-Country.mmdb")
        if os.path.exists(geo_db_path):
            with geoip2.database.Reader(geo_db_path) as reader:
                response = reader.country(ip_address)
                return response.country.iso_code
    except Exception:
        pass
    return 'XX'  # Unknown


def get_current_time_slot() -> str:
    """Get current time slot (e.g., '09:00-18:00')."""
    now = datetime.now()
    hour = now.hour
    if 9 <= hour < 18:
        return '09:00-18:00'  # Business hours
    elif 18 <= hour < 22:
        return '18:00-22:00'  # Evening
    else:
        return '22:00-09:00'  # Night


def apply_routing_rules(db, url_id: int, client_info: dict) -> str:
    """
    Apply routing rules and return the target URL.
    Returns the original URL if no rules apply.
    """
    try:
        # Get active rules for this URL, ordered by priority
        rules = db.query(Rule).filter(
            Rule.url_id == url_id,
            Rule.is_active == 1
        ).order_by(Rule.priority.desc()).all()

        if not rules:
            # No rules, return original URL
            url = db.query(Url).filter(Url.id == url_id).first()
            return url.original_url if url else None

        # Analyze client
        country_code = get_country_code(client_info['ip_address'])
        device_type = get_device_type(client_info['user_agent'])
        time_slot = get_current_time_slot()
        referrer = client_info['referrer']

        # Apply rules in priority order
        for rule in rules:
            rule_matches = False

            if rule.rule_type == 'country':
                rule_matches = rule.condition_value.upper() == country_code
            elif rule.rule_type == 'device':
                rule_matches = rule.condition_value.lower() == device_type
            elif rule.rule_type == 'time':
                rule_matches = rule.condition_value == time_slot
            elif rule.rule_type == 'referrer':
                rule_matches = rule.condition_value.lower() in referrer.lower()
            elif rule.rule_type == 'weight':
                # A/B testing - random selection based on weight
                if random.random() < rule.weight:
                    rule_matches = True

            if rule_matches:
                return rule.target_url

        # No rules matched, return original URL
        url = db.query(Url).filter(Url.id == url_id).first()
        return url.original_url if url else None

    except Exception as e:
        print(f"Error applying routing rules: {e}")
        # Fallback to original URL
        url = db.query(Url).filter(Url.id == url_id).first()
        return url.original_url if url else None


@app.route("/api/auth/register", methods=["POST"])
def register_user():
    """Register a new user."""
    ensure_db_initialized()
    db = next(get_db())

    try:
        data = request.get_json()
        user_data = UserCreate(**data)

        user = User.create_user(db, user_data.username, user_data.email, user_data.password)

        # Create access token
        access_token = create_access_token(user.id)

        user_response = UserResponse.from_orm(user)
        token_response = TokenResponse(
            access_token=access_token,
            user=user_response
        )

        return jsonify({
            "access_token": token_response.access_token,
            "token_type": token_response.token_type,
            "user": {
                "id": user_response.id,
                "username": user_response.username,
                "email": user_response.email,
                "created_at": user_response.created_at.strftime("%Y-%m-%dT%H:%M:%S")
            }
        }), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/auth/login", methods=["POST"])
def login_user():
    """Authenticate user and return token."""
    ensure_db_initialized()
    db = next(get_db())

    try:
        data = request.get_json()
        login_data = UserLogin(**data)

        user = User.authenticate(db, login_data.username_or_email, login_data.password)

        if not user:
            return jsonify({"error": "Неверное имя пользователя/email или пароль"}), 401

        # Create access token
        access_token = create_access_token(user.id)

        user_response = UserResponse.from_orm(user)

        return jsonify({
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_response.id,
                "username": user_response.username,
                "email": user_response.email,
                "created_at": user_response.created_at.strftime("%Y-%m-%dT%H:%M:%S")
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/auth/me")
def get_current_user_info():
    """Get current user information."""
    ensure_db_initialized()

    user = get_current_user()
    if not user:
        return jsonify({"error": "Не авторизован"}), 401

    user_response = UserResponse.from_orm(user)

    return jsonify({
        "id": user_response.id,
        "username": user_response.username,
        "email": user_response.email,
        "created_at": user_response.created_at.strftime("%Y-%m-%dT%H:%M:%S")
    }), 200


@app.route("/")
def home():
    """Serve the main page."""
    return render_template("home.html")


@app.route("/my-links")
def my_links_page():
    """Serve the my links page."""
    return render_template("my_links.html")


@app.route("/info/<short_code>")
def url_info(short_code):
    """Serve the URL info page."""
    return render_template("url_info.html", short_code=short_code)


@app.route("/auth/login")
def login_page():
    """Serve the login page."""
    return render_template("login.html")


@app.route("/auth/register")
def register_page():
    """Serve the register page."""
    return render_template("register.html")


@app.route("/auth/me")
def profile_page():
    """Serve the user profile page."""
    return render_template("profile.html")


@app.route("/rules")
def rules_page():
    """Serve the rules management page."""
    return render_template("rules.html")


@app.route("/analytics/<short_code>")
def analytics_page(short_code):
    """Serve the analytics dashboard page."""
    return render_template("analytics.html", short_code=short_code)


@app.route("/logout")
def logout():
    """Logout user and redirect to home."""
    # This would be handled by JavaScript, but we provide a fallback
    return redirect("/")


@app.route("/api/shorten", methods=["POST"])
def shorten_url():
    """Create a short URL."""
    ensure_db_initialized()
    db = next(get_db())

    try:
        data = request.get_json()
        if not data or "original_url" not in data:
            # Return HTML fragment for HTMX
            if request.headers.get('HX-Request'):
                return render_template("error_card.html", error_message="URL обязателен"), 400
            return jsonify({"error": "original_url is required"}), 400

        url_data = UrlCreate(original_url=data["original_url"])

        # Get base URL from request
        protocol = request.headers.get('x-forwarded-proto', request.scheme)
        host = request.headers.get('x-forwarded-host',
                                   request.headers.get('host', request.host))
        base_url = f"{protocol}://{host}"

        # Get current user if authenticated
        current_user = get_current_user()
        user_id = current_user.id if current_user else None

        # Create short URL
        short_url = Url.create_short_url(db, url_data.original_url, base_url, user_id)

        response = UrlResponse(
            id=short_url.id,
            short_code=short_url.short_code,
            original_url=short_url.original_url,
            short_url=short_url.short_url,
            created_at=short_url.created_at
        )

        # Return HTML fragment for HTMX
        if request.headers.get('HX-Request'):
            return render_template("result_card.html",
                                 original_url=response.original_url,
                                 short_url=response.short_url)

        return jsonify({
            "id": response.id,
            "short_code": response.short_code,
            "original_url": response.original_url,
            "short_url": response.short_url,
            "created_at": response.created_at.strftime("%Y-%m-%dT%H:%M:%S")
        }), 201

    except ValueError as e:
        # Return HTML fragment for HTMX
        if request.headers.get('HX-Request'):
            return render_template("error_card.html", error_message=str(e)), 400
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        # Return HTML fragment for HTMX
        if request.headers.get('HX-Request'):
            return render_template("error_card.html", error_message="Произошла ошибка при сокращении URL"), 400
        return jsonify({"error": str(e)}), 400


@app.route("/api/info/<short_code>")
def get_url_info(short_code):
    """Get information about a short URL."""
    ensure_db_initialized()
    db = next(get_db())

    try:
        url = Url.get_by_short_code(db, short_code)
        if not url:
            return jsonify({"error": "Короткий URL не найден"}), 404

        return jsonify({
            "success": True,
            "data": {
                "short_code": url.short_code,
                "original_url": url.original_url,
                "click_count": url.click_count,
                "created_at": url.created_at.strftime("%Y-%m-%dT%H:%M:%S")
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/<short_code>")
def redirect_to_url(short_code):
    """Redirect to the original URL with smart routing and analytics."""
    ensure_db_initialized()
    db = next(get_db())

    try:
        # Try to get URL data from cache first
        cached_data = cache.get_url_data(short_code)
        url_id = None
        target_url = None

        if cached_data:
            # Use cached data
            url_id = cached_data.get('id')
            target_url = cached_data.get('original_url')
        else:
            # Get from database
            url = Url.get_by_short_code(db, short_code)
            if not url:
                return jsonify({"error": "Короткий URL не найден"}), 404

            url_id = url.id
            target_url = url.original_url

            # Cache the URL data
            cache.set_url_data(short_code, {
                'id': url.id,
                'original_url': url.original_url,
                'user_id': url.user_id,
                'click_count': url.click_count
            })

        # Get client information for routing rules and analytics
        client_info = get_client_info()

        # Apply routing rules if URL has rules configured
        final_url = apply_routing_rules(db, url_id, client_info)

        if not final_url:
            return jsonify({"error": "URL не найден"}), 404

        # Log visit asynchronously via Celery
        try:
            log_visit.delay(url_id, client_info, final_url)
        except Exception as e:
            print(f"Failed to queue visit logging: {e}")
            # Continue with redirect even if logging fails

        # Update click count in cache for faster access
        cache.increment_counter(f"url_clicks:{short_code}")

        return redirect(final_url, code=302)

    except Exception as e:
        print(f"Redirect error: {e}")
        return jsonify({"error": "Произошла ошибка при редиректе"}), 500


@app.route("/api/version")
def get_version():
    """Get application version and build info."""
    return jsonify({
        "success": True,
        "version": "1.0.0",
        "name": "url-shortener",
        "environment": os.getenv("RENDER_ENV", os.getenv("ENVIRONMENT", "local")),
        "platform": "render",
        "database_url": os.getenv("DATABASE_URL", "NOT_SET")[:50] + "..." if os.getenv("DATABASE_URL") else "NOT_SET"
    })


@app.route("/api/init-db")
def init_database():
    """Initialize database tables (for debugging)."""
    try:
        init_db()
        return jsonify({"success": True, "message": "Database initialized"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/test-db")
def test_database():
    """Test database connection."""
    try:
        db = next(get_db())
        # Try a simple query
        result = db.execute(text("SELECT 1")).fetchone()
        return jsonify({"success": True, "message": "Database connected", "test": result[0]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/my-links")
def get_my_links():
    """Get current user's links."""
    ensure_db_initialized()

    user = get_current_user()
    if not user:
        # Return HTML fragment for HTMX
        if request.headers.get('HX-Request'):
            return render_template("empty_state.html",
                                 title="Требуется авторизация",
                                 message="Пожалуйста, войдите в систему для просмотра ваших ссылок",
                                 action_url="/auth/login",
                                 action_text="Войти"), 401
        return jsonify({"error": "Не авторизован"}), 401

    db = next(get_db())

    try:
        # Get user's URLs ordered by creation date (newest first)
        urls = db.query(Url).filter(Url.user_id == user.id).order_by(Url.created_at.desc()).all()

        # Get base URL for constructing short URLs
        protocol = request.headers.get('x-forwarded-proto', request.scheme)
        host = request.headers.get('x-forwarded-host',
                                   request.headers.get('host', request.host))
        base_url = f"{protocol}://{host}"

        # Return HTML fragment for HTMX
        if request.headers.get('HX-Request'):
            if not urls:
                return render_template("empty_state.html",
                                     title="У вас пока нет ссылок",
                                     message="Создайте свою первую короткую ссылку",
                                     action_url="/",
                                     action_text="Создать ссылку")

            # Render link cards
            links_html = ""
            for url in urls:
                url.short_url = f"{base_url}/{url.short_code}"
                links_html += render_template("link_card.html",
                                            id=url.id,
                                            short_url=url.short_url,
                                            original_url=url.original_url,
                                            click_count=url.click_count,
                                            created_at=url.created_at)

            return links_html

        # JSON response for API
        links = []
        for url in urls:
            url.short_url = f"{base_url}/{url.short_code}"
            links.append({
                "id": url.id,
                "short_code": url.short_code,
                "original_url": url.original_url,
                "short_url": url.short_url,
                "click_count": url.click_count,
                "created_at": url.created_at.strftime("%Y-%m-%dT%H:%M:%S")
            })

        return jsonify({"success": True, "links": links}), 200

    except Exception as e:
        # Return HTML fragment for HTMX
        if request.headers.get('HX-Request'):
            return render_template("empty_state.html",
                                 title="Ошибка",
                                 message="Не удалось загрузить ссылки"), 500
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/rules", methods=["POST"])
def create_rule():
    """Create a new routing rule."""
    ensure_db_initialized()

    user = get_current_user()
    if not user:
        return jsonify({"error": "Не авторизован"}), 401

    db = next(get_db())

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Данные не предоставлены"}), 400

        # Validate required fields
        required_fields = ['url_id', 'rule_type', 'condition_value', 'target_url']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Поле '{field}' обязательно"}), 400

        # Check if URL belongs to user
        url = db.query(Url).filter(Url.id == data['url_id'], Url.user_id == user.id).first()
        if not url:
            return jsonify({"error": "Ссылка не найдена или не принадлежит вам"}), 404

        # Validate rule type
        valid_rule_types = ['country', 'device', 'time', 'referrer', 'weight']
        if data['rule_type'] not in valid_rule_types:
            return jsonify({"error": f"Неверный тип правила. Допустимые: {', '.join(valid_rule_types)}"}), 400

        # Validate condition value based on rule type
        if data['rule_type'] == 'weight':
            try:
                weight = float(data['condition_value'])
                if not 0 <= weight <= 1:
                    return jsonify({"error": "Вес должен быть между 0 и 1"}), 400
            except ValueError:
                return jsonify({"error": "Вес должен быть числом"}), 400

        # Create rule
        rule = Rule(
            url_id=data['url_id'],
            rule_type=data['rule_type'],
            condition_value=data['condition_value'],
            target_url=data['target_url'],
            priority=data.get('priority', 0),
            is_active=1
        )

        db.add(rule)
        db.commit()

        return jsonify({
            "success": True,
            "message": "Правило создано успешно",
            "rule": {
                "id": rule.id,
                "url_id": rule.url_id,
                "rule_type": rule.rule_type,
                "condition_value": rule.condition_value,
                "target_url": rule.target_url,
                "priority": rule.priority,
                "is_active": rule.is_active,
                "created_at": rule.created_at.strftime("%Y-%m-%dT%H:%M:%S")
            }
        }), 201

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/rules/<int:url_id>")
def get_rules(url_id):
    """Get rules for a specific URL."""
    ensure_db_initialized()

    user = get_current_user()
    if not user:
        return jsonify({"error": "Не авторизован"}), 401

    db = next(get_db())

    try:
        # Check if URL belongs to user
        url = db.query(Url).filter(Url.id == url_id, Url.user_id == user.id).first()
        if not url:
            return jsonify({"error": "Ссылка не найдена или не принадлежит вам"}), 404

        # Get rules for this URL
        rules = db.query(Rule).filter(Rule.url_id == url_id).order_by(Rule.priority.desc()).all()

        rules_data = []
        for rule in rules:
            rules_data.append({
                "id": rule.id,
                "url_id": rule.url_id,
                "rule_type": rule.rule_type,
                "condition_value": rule.condition_value,
                "target_url": rule.target_url,
                "priority": rule.priority,
                "is_active": rule.is_active,
                "created_at": rule.created_at.strftime("%Y-%m-%dT%H:%M:%S")
            })

        return jsonify({"success": True, "rules": rules_data}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/rules/<int:rule_id>", methods=["DELETE"])
def delete_rule(rule_id):
    """Delete a routing rule."""
    ensure_db_initialized()

    user = get_current_user()
    if not user:
        return jsonify({"error": "Не авторизован"}), 401

    db = next(get_db())

    try:
        # Find rule and check ownership through URL
        rule = db.query(Rule).join(Url).filter(
            Rule.id == rule_id,
            Url.user_id == user.id
        ).first()

        if not rule:
            return jsonify({"error": "Правило не найдено или не принадлежит вам"}), 404

        db.delete(rule)
        db.commit()

        return jsonify({"success": True, "message": "Правило удалено"}), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/urls/<int:url_id>", methods=["DELETE"])
def delete_url(url_id):
    """Delete a URL and all its associated rules."""
    ensure_db_initialized()

    user = get_current_user()
    if not user:
        return jsonify({"error": "Не авторизован"}), 401

    db = next(get_db())

    try:
        # Find URL and check ownership
        url = db.query(Url).filter(Url.id == url_id, Url.user_id == user.id).first()
        if not url:
            return jsonify({"error": "Ссылка не найдена или не принадлежит вам"}), 404

        # Delete all rules associated with this URL
        db.query(Rule).filter(Rule.url_id == url_id).delete()

        # Delete the URL
        db.delete(url)
        db.commit()

        return jsonify({"success": True, "message": "Ссылка и все связанные правила удалены"}), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500


# Local development server
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001, debug=True)
