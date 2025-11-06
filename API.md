# API Documentation - URL Shortener

## Обзор

URL Shortener API предоставляет RESTful интерфейс для создания и управления короткими ссылками. API построен на Flask и использует JSON для обмена данными.

## Базовый URL

```
https://your-domain.com
```

## Аутентификация

В текущей версии MVP аутентификация не требуется. Все эндпоинты доступны публично.

## Аутентификация

API поддерживает аутентификацию пользователей через JWT токены. Для доступа к защищенным ресурсам необходимо передавать токен в заголовке `Authorization: Bearer <token>`.

## Эндпоинты

### 1. Регистрация пользователя

**POST** `/api/auth/register`

Регистрация нового пользователя.

#### Запрос

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Ответ

**Успешный ответ (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2025-01-01T12:00:00"
  }
}
```

### 2. Аутентификация пользователя

**POST** `/api/auth/login`

Вход в систему.

#### Запрос

**Body:**
```json
{
  "username_or_email": "john_doe",
  "password": "securepassword123"
}
```

#### Ответ

**Успешный ответ (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2025-01-01T12:00:00"
  }
}
```

### 3. Информация о текущем пользователе

**GET** `/api/auth/me`

Получение информации о текущем аутентифицированном пользователе.

#### Запрос

**Headers:**
```
Authorization: Bearer <access_token>
```

#### Ответ

**Успешный ответ (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "created_at": "2025-01-01T12:00:00"
}
```

### 4. Создание короткого URL

**POST** `/api/shorten`

Создает новый короткий URL из предоставленного оригинального URL.

#### Запрос

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "original_url": "https://example.com/very/long/url"
}
```

**Параметры:**
- `original_url` (string, required): Оригинальный URL для сокращения. Должен начинаться с `http://` или `https://` и быть не длиннее 2000 символов.

#### Ответ

**Успешный ответ (201 Created):**
```json
{
  "id": 1,
  "short_code": "abc123",
  "original_url": "https://example.com/very/long/url",
  "short_url": "https://your-domain.com/abc123",
  "created_at": "2025-01-01T12:00:00"
}
```

**Ошибки:**

**400 Bad Request:**
```json
{
  "error": "original_url is required"
}
```

**400 Bad Request (невалидный URL):**
```json
{
  "error": "URL должен начинаться с http:// или https://"
}
```

### 2. Получение информации о коротком URL

**GET** `/api/info/{short_code}`

Возвращает информацию о коротком URL, включая статистику кликов.

#### Параметры пути

- `short_code` (string, required): Короткий код URL (6 символов)

#### Ответ

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "data": {
    "short_code": "abc123",
    "original_url": "https://example.com/very/long/url",
    "click_count": 42,
    "created_at": "2025-01-01T12:00:00"
  }
}
```

**Ошибки:**

**404 Not Found:**
```json
{
  "error": "Короткий URL не найден"
}
```

### 3. Редирект на оригинальный URL (с умной маршрутизацией)

**GET** `/{short_code}`

Перенаправляет пользователя на оригинальный URL или альтернативный URL на основе правил маршрутизации. Логирует посещение для аналитики.

#### Параметры пути

- `short_code` (string, required): Короткий код URL (6 символов)

#### Особенности

- **Умная маршрутизация**: Применяет правила по гео, устройству, времени, рефереру
- **A/B тестирование**: Поддерживает распределение трафика по весам
- **Аналитика**: Асинхронное логирование IP, User-Agent, геолокации
- **Кэширование**: Использует Redis для быстрого доступа

#### Ответ

**302 Found (редирект):**
```
Location: https://example.com/very/long/url
```

**Ошибки:**

**404 Not Found:**
```json
{
  "error": "Короткий URL не найден"
}
```

### 4. Получение версии приложения

**GET** `/api/version`

Возвращает информацию о версии и окружении приложения.

#### Ответ

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "version": "1.0.0",
  "name": "url-shortener",
  "environment": "production",
  "platform": "render"
}
```

### 5. Детальная аналитика кликов

**GET** `/api/analytics/{short_code}`

Возвращает детальную аналитику по кликам для короткого URL.

#### Запрос

**Headers:**
```
Authorization: Bearer <access_token> (для приватных URL)
```

#### Параметры пути

- `short_code` (string, required): Короткий код URL

#### Ответ

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "analytics": {
    "total_clicks": 150,
    "unique_visitors": 89,
    "countries": {
      "US": 45,
      "FR": 23,
      "DE": 12
    },
    "devices": {
      "mobile": 67,
      "desktop": 78,
      "tablet": 5
    },
    "browsers": {
      "Chrome": 89,
      "Safari": 34,
      "Firefox": 27
    },
    "referrers": {
      "google.com": 45,
      "facebook.com": 23,
      "direct": 82
    },
    "hourly_stats": [
      {"hour": "09", "clicks": 12},
      {"hour": "10", "clicks": 18}
    ]
  }
}
```

### 6. Управление правилами маршрутизации

**POST** `/api/rules`

Создает правило маршрутизации для URL.

#### Запрос

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "url_id": 1,
  "rule_type": "country",
  "condition_value": "FR",
  "target_url": "https://example.com/french-version",
  "priority": 10
}
```

#### Ответ

**Успешный ответ (201 Created):**
```json
{
  "id": 1,
  "url_id": 1,
  "rule_type": "country",
  "condition_value": "FR",
  "target_url": "https://example.com/french-version",
  "priority": 10,
  "is_active": true
}
```

### 7. Главная страница

**GET** `/`

Возвращает HTML страницу пользовательского интерфейса.

#### Ответ

**200 OK:**
```
Content-Type: text/html
```

Возвращает содержимое `index.html` - одностраничное приложение для создания коротких ссылок.

## Типы данных

### UrlCreate
```json
{
  "original_url": "string (HttpUrl)"
}
```

### UrlResponse
```json
{
  "id": "integer",
  "short_code": "string",
  "original_url": "string",
  "short_url": "string",
  "created_at": "datetime"
}
```

### UrlInfo
```json
{
  "short_code": "string",
  "original_url": "string",
  "click_count": "integer",
  "created_at": "datetime"
}
```

### RuleCreate
```json
{
  "url_id": "integer",
  "rule_type": "string (country|device|time|referrer|weight)",
  "condition_value": "string",
  "target_url": "string",
  "priority": "integer (default: 0)",
  "weight": "float (default: 0.0, for A/B testing)"
}
```

### RuleResponse
```json
{
  "id": "integer",
  "url_id": "integer",
  "rule_type": "string",
  "condition_value": "string",
  "target_url": "string",
  "priority": "integer",
  "weight": "float",
  "is_active": "boolean",
  "created_at": "datetime"
}
```

### AnalyticsResponse
```json
{
  "total_clicks": "integer",
  "unique_visitors": "integer",
  "countries": "object (country_code -> count)",
  "devices": "object (device_type -> count)",
  "browsers": "object (browser -> count)",
  "referrers": "object (referrer -> count)",
  "hourly_stats": "array of objects"
}
```

## Ограничения

- Максимальная длина оригинального URL: 2000 символов
- Короткий код: 6 символов (буквы и цифры)
- Поддерживаемые протоколы: HTTP и HTTPS

## Обработка ошибок

API возвращает ошибки в формате JSON:

```json
{
  "error": "Описание ошибки"
}
```

Коды HTTP статусов:
- `200` - Успешный запрос
- `201` - Ресурс создан
- `302` - Редирект
- `400` - Неверный запрос
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

## Примеры использования

### Создание короткого URL

```bash
curl -X POST https://your-domain.com/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"original_url": "https://example.com/long/url"}'
```

### Получение информации

```bash
curl https://your-domain.com/api/info/abc123
```

### Редирект с умной маршрутизацией

```bash
# Базовый редирект
curl -I https://your-domain.com/abc123

# Редирект из Франции (гео-таргетинг)
curl -H "X-Forwarded-For: 90.90.90.90" -I https://your-domain.com/abc123

# Редирект с мобильного устройства
curl -H "User-Agent: Mozilla/5.0 (iPhone..." -I https://your-domain.com/abc123

# Редирект из Google (реферер)
curl -H "Referer: https://google.com" -I https://your-domain.com/abc123
```

### Создание правила маршрутизации

```bash
curl -X POST https://your-domain.com/api/rules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url_id": 1,
    "rule_type": "country",
    "condition_value": "FR",
    "target_url": "https://example.com/french",
    "priority": 10
  }'
```

### Получение аналитики

```bash
curl https://your-domain.com/api/analytics/abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Замечания по реализации

- **Кэширование**: Redis используется для кэширования URL данных (TTL 1 час)
- **Асинхронная аналитика**: Celery логирует посещения в фоне для производительности
- **Умная маршрутизация**: Правила применяются по приоритету (выше = раньше)
- **A/B тестирование**: Весовые правила распределяют трафик случайным образом
- **Геолокация**: GeoIP2 определяет страну по IP (требует базы данных)
- **Анализ устройств**: user-agents парсит User-Agent строки
- База данных инициализируется лениво при первом запросе
- Короткие коды генерируются случайным образом с проверкой уникальности
- Счетчик кликов увеличивается асинхронно через Celery
- Поддержка как SQLite (разработка), так и PostgreSQL (продакшен)
