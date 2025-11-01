const express = require('express');
const UrlController = require('../controllers/urlController');
const AuthController = require('../controllers/authController');

const router = express.Router();

// Middleware для парсинга JSON
router.use(express.json());

// API маршруты для URL shortener

// POST /api/shorten - создание короткого URL
router.post('/shorten', UrlController.shortenUrl);

// GET /api/info/:shortCode - получение информации о коротком URL (для отладки)
router.get('/info/:shortCode', UrlController.getUrlInfo);

// Аутентификация маршруты
// POST /api/auth/register - регистрация пользователя
router.post('/auth/register', AuthController.register);

// POST /api/auth/login - вход пользователя
router.post('/auth/login', AuthController.login);

// POST /api/auth/logout - выход пользователя
router.post('/auth/logout', AuthController.logout);

// GET /api/auth/me - получение текущего пользователя
router.get('/auth/me', AuthController.getCurrentUser);

// PUT /api/auth/profile - обновление профиля пользователя
router.put('/auth/profile', AuthController.requireAuth, AuthController.updateProfile);

// Обработка перенаправлений - этот маршрут должен быть в главном server.js
// GET /:shortCode - перенаправление на оригинальный URL

module.exports = router;
