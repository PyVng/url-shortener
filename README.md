# URL Shortener - Flask Edition

Современный сервис сокращения URL, построенный на Flask, SQLAlchemy и PostgreSQL. MVP версия с простым функционалом создания и редиректа коротких ссылок.

## 🚀 Возможности

### Базовый функционал
- **Flask Backend**: Легковесный REST API с поддержкой CORS
- **SQLAlchemy ORM**: Надежные операции с базой данных
- **PostgreSQL/SQLite**: Поддержка PostgreSQL (продакшен) и SQLite (разработка)
- **Валидация URL**: Проверка формата и длины URL
- **Отслеживание кликов**: Подсчет переходов по коротким ссылкам
- **Отзывчивый интерфейс**: Чистый современный веб-интерфейс
- **Аутентификация пользователей**: JWT токены, регистрация и логин

### Продвинутые функции 🚀
- **🗺️ Умная маршрутизация**: Условные редиректы по гео/устройству/рефереру/времени
- **⚖️ A/B тестирование**: Распределение трафика по вариантам с весами
- **📊 Детальная аналитика**: Логирование IP, геолокации, устройств, браузеров
- **⚡ Redis кэширование**: Быстрый доступ к данным, SLA <50мс
- **🔄 Celery фоновые задачи**: Асинхронная обработка аналитики
- **🌍 Гео-таргетинг**: Автоматическое определение страны по IP
- **📱 Адаптивная маршрутизация**: Разные URL для мобильных/десктопов
- **⏰ Временные правила**: Разные редиректы в зависимости от времени суток

## 🛠️ Технологии

- **Backend**: Flask, SQLAlchemy, Pydantic
- **Frontend**: Flask Templates (Jinja2), HTMX, Tailwind CSS
- **Database**: PostgreSQL (продакшен) / SQLite (разработка)
- **Deployment**: Render
- **Testing**: Playwright (E2E)

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

5. **Initialize database**
   ```bash
   npm run init-db
   ```

6. **Run locally (basic)**
   ```bash
   python main.py
   ```

   Visit `http://localhost:8001`

## 🚀 Запуск с продвинутыми функциями

Для использования умной маршрутизации, A/B тестирования и детальной аналитики:

### 1. Запуск Redis (требуется для кэширования)
```bash
# На macOS с Homebrew
brew install redis
brew services start redis

# Или в Docker
docker run -d -p 6379:6379 redis:alpine
```

### 2. Инициализация базы данных
```bash
npm run init-db
```

### 3. Создание тестовых правил маршрутизации
```bash
npm run create-test-rules
```

### 4. Запуск Celery воркера (в отдельном терминале)
```bash
npm run worker
```

### 5. Запуск Flask приложения
```bash
npm run dev
```

### 6. Тестирование умной маршрутизации

Пример тестового URL с правилами:
```bash
# Получить короткий код из вывода create-test-rules
curl http://localhost:8001/{SHORT_CODE}

# Тестирование гео-таргетинга (Франция)
curl -H "X-Forwarded-For: 90.90.90.90" http://localhost:8001/{SHORT_CODE}

# Тестирование мобильных устройств
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15" http://localhost:8001/{SHORT_CODE}

# Тестирование реферера (Google)
curl -H "Referer: https://google.com/search" http://localhost:8001/{SHORT_CODE}
```

### Примеры правил маршрутизации

Система поддерживает следующие типы правил:

- **🌍 Гео-таргетинг**: `FR` → французская версия сайта
- **📱 Устройства**: `mobile` → мобильная оптимизация
- **⏰ Время суток**: `09:00-18:00` → бизнес-версия
- **🔍 Реферер**: `google.com` → SEO-лендинг
- **⚖️ A/B тесты**: `0.5` вес → альтернативная версия (50% трафика)

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

### Render Deployment

1. **Connect to Render**
   - Создайте аккаунт на [Render](https://render.com)
   - Подключите GitHub репозиторий

2. **Environment Variables for Render**
   ```
   DATABASE_URL=postgresql://...
   ENVIRONMENT=production
   RENDER_ENV=production
   ```

### Environment Variables

Общие переменные окружения:

- `DATABASE_URL`: PostgreSQL connection string (для продакшена)
- `POSTGRES_URL`: Альтернативный PostgreSQL URL
- `ENVIRONMENT`: `production` для продакшена
- `RENDER_ENV`: `production` для Render

## 📚 Документация

- **[Архитектура](ARCHITECTURE.md)** - подробное описание архитектуры MVP
- **[API Documentation](API.md)** - полная техническая документация API

## 📡 API Endpoints

Основные эндпоинты API:

- `POST /api/shorten` - создание короткого URL
- `GET /api/info/{short_code}` - получение информации о URL
- `GET /{short_code}` - редирект на оригинальный URL
- `GET /api/version` - информация о версии
- `GET /` - главная страница

Подробная документация API доступна в [API.md](API.md)

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
├── main.py              # Flask application (main entry point)
├── database.py          # Database connection and session management
├── models.py            # SQLAlchemy models + Rules/Visits
├── schemas.py           # Pydantic schemas
├── cache.py             # Redis cache management
├── celery_app.py        # Celery configuration
├── tasks.py             # Asynchronous tasks (analytics logging)
├── run_worker.py        # Celery worker launcher
├── create_test_rules.py # Test routing rules creator
├── templates/           # Jinja2 templates
│   ├── base.html        # Base layout template
│   ├── home.html        # Home page
│   ├── my_links.html    # User links page
│   ├── navbar.html      # Navigation component
│   ├── auth_modal.html  # Authentication modal
│   ├── url_form.html    # URL shortening form
│   └── ...              # Other components
├── ARCHITECTURE.md      # Архитектура MVP
├── API.md              # Документация API
├── local.db             # Local SQLite database (created automatically)
├── requirements.txt     # Python dependencies
├── package.json         # Node.js dependencies for testing
├── playwright.config.js # Playwright configuration
├── tests/               # E2E tests
│   └── url-shortener.spec.js
├── data/                # Data directory
├── playwright-report/   # Test reports
├── test-results/        # Test results
└── .env                 # Environment variables
```

### Adding New Features

1. **API Endpoints**: Add routes in `main.py`
2. **Database Models**: Define in `models.py`
3. **Validation**: Create Pydantic schemas in `schemas.py`
4. **Frontend Components**: Add/modify templates in `templates/` directory
5. **Tests**: Add tests in `tests/` directory

## 📈 Performance

- **Flask**: Легковесный и эффективный фреймворк
- **SQLAlchemy**: Эффективный ORM с connection pooling
- **PostgreSQL/Render**: Управляемая PostgreSQL с автоматическим масштабированием
- **Ленивая инициализация**: База данных инициализируется при первом запросе

## 🔒 Security

- Валидация входных данных с Pydantic
- Защита от SQL-инъекций через SQLAlchemy ORM
- CORS защита
- Проверка URL формата и длины

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
