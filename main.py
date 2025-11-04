"""URL Shortener API built with Flask for Render."""
from flask import Flask, request, jsonify, redirect, send_file
from flask_cors import CORS
import os

# Import our modules
from database import init_db, get_db
from models import Url
from schemas import UrlCreate, UrlResponse

# Create Flask app
app = Flask(__name__)

# Enable CORS
CORS(app)

# Database will be initialized lazily on first request
_db_initialized = False


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


@app.route("/")
def read_root():
    """Serve the main HTML page."""
    return send_file("index.html", mimetype="text/html")


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

        # Create short URL
        short_url = Url.create_short_url(db, url_data.original_url, base_url)

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
            "created_at": response.created_at.isoformat()
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
                "created_at": url.created_at.isoformat()
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
        "platform": "render"
    })


# Local development server
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
