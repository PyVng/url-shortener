const express = require('express');
const UrlController = require('../controllers/urlController');
const AuthController = require('../controllers/authController');

const router = express.Router();

// Middleware для парсинга JSON
router.use(express.json());

// API маршруты для URL shortener

// POST /api/shorten - создание короткого URL
router.post('/shorten', AuthController.requireAuth, UrlController.shortenUrl);

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

// POST /api/auth/refresh - обновление токена
router.post('/auth/refresh', AuthController.refreshToken);

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

// GET /api/version - получение версии приложения
router.get('/version', (req, res) => {
  const packageJson = require('../package.json');

  // Получаем информацию о git коммите (работает локально)
  const { execSync } = require('child_process');
  let gitInfo = {
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    branch: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
    timestamp: process.env.VERCEL_GIT_COMMIT_AUTHOR_DATE || new Date().toISOString()
  };

  console.log('Environment check - VERCEL:', !!process.env.VERCEL);
  console.log('Vercel env vars:', {
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
    VERCEL_GIT_COMMIT_AUTHOR_DATE: process.env.VERCEL_GIT_COMMIT_AUTHOR_DATE
  });

  // Если не на Vercel, пытаемся получить git информацию локально
  if (!process.env.VERCEL) {
    try {
      console.log('Trying to get git info locally...');
      // Получаем короткий хэш последнего коммита
      gitInfo.commit = execSync('git rev-parse --short HEAD').toString().trim();
      // Получаем текущую ветку
      gitInfo.branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
      // Получаем timestamp последнего коммита
      const commitDate = execSync('git log -1 --format=%ci').toString().trim();
      gitInfo.timestamp = new Date(commitDate).toISOString();
      console.log('Git info retrieved locally:', gitInfo);
    } catch (error) {
      console.warn('Could not get git info locally:', error.message);
    }
  } else {
    console.log('On Vercel, using env vars for git info:', gitInfo);
  }

  res.json({
    success: true,
    version: packageJson.version,
    git: gitInfo,
    buildTime: new Date().toISOString(),
    name: packageJson.name,
    environment: process.env.VERCEL ? 'vercel' : 'local'
  });
});

// GET /api/env-check - проверка переменных окружения (для отладки)
router.get('/env-check', (req, res) => {
  const envVars = {
    // Database
    ACTIVE_DATABASE: process.env.ACTIVE_DATABASE,
    // Supabase
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
    // Vercel
    VERCEL: process.env.VERCEL ? 'TRUE' : 'FALSE',
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    // Other
    NODE_ENV: process.env.NODE_ENV,
  };

  console.log('🔍 Environment check requested');
  console.log('🔍 Environment variables:', envVars);

  res.json({
    success: true,
    data: {
      environment: envVars,
      timestamp: new Date().toISOString(),
      hostname: require('os').hostname(),
      platform: process.platform,
      nodeVersion: process.version
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
