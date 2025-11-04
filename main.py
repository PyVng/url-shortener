"""URL Shortener API built with FastAPI for Render."""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse, HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

# Import our modules
from database import init_db, get_db
from models import Url
from schemas import UrlCreate, UrlResponse

# Create FastAPI app
app = FastAPI(
    title="URL Shortener API",
    description="A simple URL shortener service",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main HTML page."""
    return FileResponse("index.html", media_type="text/html")


@app.post("/api/shorten", response_model=UrlResponse, status_code=201)
async def shorten_url(url_data: UrlCreate, request: Request):
    """Create a short URL."""
    ensure_db_initialized()
    db = next(get_db())

    try:
        # Get base URL from request
        protocol = request.headers.get('x-forwarded-proto', request.url.scheme)
        host = request.headers.get('x-forwarded-host',
                                   request.headers.get('host',
                                                       request.url.hostname))
        base_url = f"{protocol}://{host}"

        # Create short URL
        short_url = Url.create_short_url(db, url_data.original_url, base_url)

        return UrlResponse(
            id=short_url.id,
            short_code=short_url.short_code,
            original_url=short_url.original_url,
            short_url=short_url.short_url,
            created_at=short_url.created_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/info/{short_code}")
async def get_url_info(short_code: str):
    """Get information about a short URL."""
    ensure_db_initialized()
    db = next(get_db())

    try:
        url = Url.get_by_short_code(db, short_code)
        if not url:
            raise HTTPException(status_code=404, detail="Короткий URL не найден")

        return {
            "success": True,
            "data": {
                "short_code": url.short_code,
                "original_url": url.original_url,
                "click_count": url.click_count,
                "created_at": url.created_at
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/{short_code}")
async def redirect_to_url(short_code: str):
    """Redirect to the original URL."""
    ensure_db_initialized()
    db = next(get_db())

    try:
        original_url = Url.get_original_url(db, short_code)
        if not original_url:
            raise HTTPException(status_code=404, detail="Короткий URL не найден")

        return RedirectResponse(url=original_url, status_code=302)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/version")
async def get_version():
    """Get application version and build info."""
    return {
        "success": True,
        "version": "1.0.0",
        "name": "url-shortener",
        "environment": os.getenv("RENDER_ENV",
                                 os.getenv("ENVIRONMENT", "local")),
        "platform": "render"
    }

# Local development server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
