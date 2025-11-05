# API Documentation - URL Shortener

## Обзор

URL Shortener API предоставляет RESTful интерфейс для создания и управления короткими ссылками. API построен на Flask и использует JSON для обмена данными.

## Базовый URL

```
https://your-domain.com
```

## Аутентификация

В текущей версии MVP аутентификация не требуется. Все эндпоинты доступны публично.

## Эндпоинты

### 1. Создание короткого URL

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

### 3. Редирект на оригинальный URL

**GET** `/{short_code}`

Перенаправляет пользователя на оригинальный URL и увеличивает счетчик кликов.

#### Параметры пути

- `short_code` (string, required): Короткий код URL (6 символов)

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

### 5. Главная страница

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

### Редирект

```bash
curl -I https://your-domain.com/abc123
```

## Замечания по реализации

- База данных инициализируется лениво при первом запросе
- Короткие коды генерируются случайным образом с проверкой уникальности
- Счетчик кликов увеличивается синхронно при каждом редиректе
- Поддержка как SQLite (разработка), так и PostgreSQL (продакшен)
