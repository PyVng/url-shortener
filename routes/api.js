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

// Пользовательские ссылки (требуют аутентификации)
// GET /api/links - получение списка ссылок пользователя
router.get('/links', AuthController.requireAuth, UrlController.getUserLinks);

// PUT /api/links/:id - обновление ссылки пользователя
router.put('/links/:id', AuthController.requireAuth, UrlController.updateUserLink);

// DELETE /api/links/:id - удаление ссылки пользователя
router.delete('/links/:id', AuthController.requireAuth, UrlController.deleteUserLink);

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

// OAuth аутентификация
// GET /api/auth/providers - получение доступных OAuth провайдеров
router.get('/auth/providers', AuthController.getOAuthProviders);

// GET /api/auth/status - проверка статуса аутентификации (для отладки)
router.get('/auth/status', (req, res) => {
  const { supabase } = require('../db/supabase');
  res.json({
    success: true,
    data: {
      supabaseConfigured: !!supabase,
      hasUrl: !!process.env.SUPABASE_URL,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      activeDatabase: process.env.ACTIVE_DATABASE
    }
  });
});

// POST /api/auth/oauth/:provider - инициация OAuth входа
router.post('/auth/oauth/:provider', AuthController.oauthLogin);

// GET /api/auth/callback - callback для OAuth (для server-side обработки)
router.get('/auth/callback', AuthController.oauthCallback);

// Обработка перенаправлений - этот маршрут должен быть в главном server.js
// GET /:shortCode - перенаправление на оригинальный URL

module.exports = router;
