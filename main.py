"""URL Shortener API built with Flask for Render."""
from flask import Flask, request, jsonify, redirect, send_file, g
from flask_cors import CORS
import os
import jwt
from datetime import datetime, timedelta
from sqlalchemy import text

# Import our modules
from database import init_db, get_db
from models import Url, User
from schemas import (UrlCreate, UrlResponse, UserCreate, UserLogin,
                     UserResponse, TokenResponse)

# Create Flask app
app = Flask(__name__)

# Enable CORS
CORS(app)

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
def read_root():
    """Serve the main HTML page."""
    return send_file("index.html", mimetype="text/html")


@app.route("/my-links")
def my_links_page():
    """Serve the my links HTML page."""
    return send_file("my-links.html", mimetype="text/html")


@app.route("/api/shorten", methods=["POST"])
def shorten_url():
    """Create a short URL."""
    ensure_db_initialized()
    db = next(get_db())

    try:
        data = request.get_json()
        if not data or "original_url" not in data:
            return jsonify({"error": "original_url is required"}), 400

        url_data = UrlCreate(original_url=data["original_url"])

        # Get base URL from request
        protocol = request.headers.get('x-forwarded-proto', request.scheme)
        host = request.headers.get('x-forwarded-host',
                                   request.headers.get('host', request.host))
        base_url = f"{protocol}://{host}"

        # Get current user if authenticated
        current_user = get_current_user()
        user_id = str(current_user.id) if current_user else None

        # Create short URL
        short_url = Url.create_short_url(db, url_data.original_url, base_url, user_id)

        response = UrlResponse(
            id=short_url.id,
            short_code=short_url.short_code,
            original_url=short_url.original_url,
            short_url=short_url.short_url,
            created_at=short_url.created_at
        )

        return jsonify({
            "id": response.id,
            "short_code": response.short_code,
            "original_url": response.original_url,
            "short_url": response.short_url,
            "created_at": response.created_at.strftime("%Y-%m-%dT%H:%M:%S")
        }), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
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
    """Redirect to the original URL."""
    ensure_db_initialized()
    db = next(get_db())

    try:
        original_url = Url.get_original_url(db, short_code)
        if not original_url:
            return jsonify({"error": "Короткий URL не найден"}), 404

        return redirect(original_url, code=302)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


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
        return jsonify({"success": False, "error": str(e)}), 500


# Local development server
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
