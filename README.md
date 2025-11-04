# URL Shortener - FastAPI Edition

A modern URL shortener service built with FastAPI, SQLAlchemy, and Vercel Postgres.

## 🚀 Features

- **FastAPI Backend**: High-performance async API with automatic OpenAPI/Swagger docs
- **SQLAlchemy ORM**: Robust database operations with PostgreSQL support
- **Vercel Deployment**: Optimized for serverless deployment on Vercel
- **URL Validation**: Built-in URL format validation
- **Click Tracking**: Track URL click counts
- **Responsive UI**: Clean, modern web interface

## 🛠️ Tech Stack

- **Backend**: FastAPI, Uvicorn, SQLAlchemy, Pydantic
- **Database**: Vercel Postgres (production) / SQLite (development)
- **Frontend**: HTML, CSS, JavaScript
- **Deployment**: Vercel Functions
- **Testing**: Pytest, Playwright

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd url-shortener
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies (for testing)**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   The project uses `.env` file for configuration. Copy the existing `.env` file and modify as needed.

5. **Run locally**
   ```bash
   python3 main.py
   ```

   Visit `http://localhost:8000`

## 🧪 Testing

### Unit Tests
```bash
python -m pytest -v
```

### E2E Tests
```bash
npm test
```

Or run with headed browser:
```bash
npm run test:headed
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   vercel login
   vercel link
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment Variables for Vercel

Set these in your Vercel dashboard:

- `DATABASE_URL`: PostgreSQL connection string
- `POSTGRES_URL`: Alternative PostgreSQL URL
- `ENVIRONMENT`: Set to `production`

## 📡 API Endpoints

### Create Short URL
```http
POST /api/shorten
Content-Type: application/json

{
  "original_url": "https://example.com/very/long/url"
}
```

Response:
```json
{
  "id": 1,
  "short_code": "abc123",
  "original_url": "https://example.com/very/long/url",
  "short_url": "https://your-domain.com/abc123",
  "created_at": "2023-01-01T00:00:00Z"
}
```

### Get URL Info
```http
GET /api/info/{short_code}
```

### Redirect to Original URL
```http
GET /{short_code}
```

## 🗄️ Database Schema

```sql
CREATE TABLE urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    short_code VARCHAR(20) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    user_id VARCHAR(100),
    title VARCHAR(255),
    click_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Development

### Project Structure
```
├── main.py              # FastAPI application (main entry point)
├── database.py          # Database connection and session management
├── models.py            # SQLAlchemy models
├── schemas.py           # Pydantic schemas
├── index.html           # Frontend HTML
├── local.db             # Local SQLite database (created automatically)
├── requirements.txt     # Python dependencies
├── vercel.json          # Vercel configuration
├── package.json         # Node.js dependencies for testing
├── playwright.config.js # Playwright configuration
├── tests/               # E2E tests
│   └── url-shortener.spec.js
└── .env                 # Environment variables
```

### Adding New Features

1. **API Endpoints**: Add routes in `main.py`
2. **Database Models**: Define in `models.py`
3. **Validation**: Create Pydantic schemas in `schemas.py`
4. **Frontend**: Modify `index.html`
5. **Tests**: Add tests in `tests/` directory

## 📈 Performance

- **FastAPI**: High-performance async framework
- **SQLAlchemy**: Efficient ORM with connection pooling
- **Vercel Postgres**: Managed PostgreSQL with automatic scaling
- **CDN**: Static assets served via Vercel's CDN

## 🔒 Security

- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy
- CORS protection
- Rate limiting ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For issues and questions, please open a GitHub issue.
