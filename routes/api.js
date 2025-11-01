const express = require('express');
const UrlController = require('../controllers/urlController');

const router = express.Router();

// Middleware для парсинга JSON
router.use(express.json());

// API маршруты для URL shortener

// POST /api/shorten - создание короткого URL
router.post('/shorten', UrlController.shortenUrl);

// GET /api/info/:shortCode - получение информации о коротком URL (для отладки)
router.get('/info/:shortCode', UrlController.getUrlInfo);

// Обработка перенаправлений - этот маршрут должен быть в главном server.js
// GET /:shortCode - перенаправление на оригинальный URL

module.exports = router;
