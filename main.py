"""
URL Shortener API built with FastAPI
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="public"), name="static")

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main HTML page"""
    with open("public/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/api/shorten", response_model=UrlResponse, status_code=201)
async def shorten_url(url_data: UrlCreate, request: Request):
    """Create a short URL"""
    db = next(get_db())

    try:
        # Get base URL from request
        protocol = request.headers.get('x-forwarded-proto', request.url.scheme)
        host = request.headers.get('x-forwarded-host', request.headers.get('host', request.url.hostname))
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
    """Get information about a short URL"""
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
    """Redirect to the original URL"""
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
    """Get application version and build info"""
    return {
        "success": True,
        "version": "1.0.0",
        "name": "url-shortener",
        "environment": os.getenv("VERCEL_ENV", "local")
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.getenv("ENVIRONMENT") != "production" else False
    )
