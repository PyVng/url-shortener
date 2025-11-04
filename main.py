"""
URL Shortener API built with FastAPI for Vercel
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse, HTMLResponse
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
    """Ensure database is initialized before handling requests"""
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
    """Serve the main HTML page"""
    with open("index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/api/shorten", response_model=UrlResponse, status_code=201)
async def shorten_url(url_data: UrlCreate, request: Request):
    """Create a short URL"""
    ensure_db_initialized()
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
    """Redirect to the original URL"""
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
    """Get application version and build info"""
    return {
        "success": True,
        "version": "1.0.0",
        "name": "url-shortener",
        "environment": os.getenv("VERCEL_ENV", "local")
    }

# Robust Vercel handler for testing
def handler(request, context):
    """Vercel serverless function handler with comprehensive error handling"""
    try:
        # Check if we're in Vercel environment
        import os
        vercel_env = os.getenv('VERCEL_ENV')

        # Get request path
        path = request.get('path', '/')

        # Handle API routes
        if path.startswith('/api/'):
            if path == '/api/version':
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': '{"version": "1.0.0", "status": "ok"}'
                }
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': '{"message": "API endpoint not implemented"}'
            }

        # Handle root path - serve HTML
        if path == '/' or path == '':
            try:
                # Try multiple possible paths for index.html
                possible_paths = ['index.html', './index.html']
                html_content = None
                file_found = None

                for path_option in possible_paths:
                    try:
                        with open(path_option, 'r', encoding='utf-8') as f:
                            html_content = f.read()
                            file_found = path_option
                            break
                    except FileNotFoundError:
                        continue
                    except Exception as file_error:
                        # Log file read errors but continue trying
                        print(f"Error reading {path_option}: {file_error}")
                        continue

                if html_content and file_found:
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'text/html',
                            'Cache-Control': 'public, max-age=300'
                        },
                        'body': html_content
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'text/plain'},
                        'body': f'HTML file not found. Tried: {", ".join(possible_paths)}'
                    }

            except Exception as e:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'text/plain'},
                    'body': f'File system error: {str(e)}'
                }

        # Handle short URL redirects (would need database)
        # For now, return not found
        if len(path.strip('/')) > 0 and not path.startswith('/api/'):
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'text/plain'},
                'body': f'Short URL not found: {path}'
            }

        # Default response for unhandled paths
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'text/plain'},
            'body': f'Path not handled: {path}'
        }

    except Exception as e:
        # Catch-all error handler
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'text/plain'},
            'body': f'Handler error: {str(e)}'
        }

# Local development server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
