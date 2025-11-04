"""
Serve static HTML page for Vercel
"""
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main HTML page"""
    with open("public/index.html", "r", encoding="utf-8") as f:
        return f.read()

# Vercel handler
def handler(request, context):
    """Vercel serverless function handler"""
    from mangum import Mangum
    handler = Mangum(app)
    return handler(request, context)
