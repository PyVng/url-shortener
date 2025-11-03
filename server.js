const express = require('express');
const cors = require('cors');
const path = require('path');
require('./db/database'); // Инициализация базы данных

const apiRoutes = require('./routes/api');
const UrlController = require('./controllers/urlController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// API маршруты
app.use('/api', apiRoutes);

// OAuth callback маршрут
app.get('/auth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).send('Authorization code is required');
    }

    // Импортируем Supabase клиент
    const { supabase } = require('./db/supabase');

    if (!supabase) {
      return res.status(503).send('Authentication service not configured');
    }

    // Обмениваем код на сессию
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('OAuth callback error:', error);
      return res.status(400).send('Authentication failed');
    }

    // Перенаправляем на страницу успеха с токенами
    const redirectUrl = new URL('/auth/success', `${req.protocol}://${req.get('host')}`);
    redirectUrl.searchParams.set('access_token', data.session.access_token);
    redirectUrl.searchParams.set('refresh_token', data.session.refresh_token);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('OAuth callback processing error:', error);
    res.status(500).send('Internal server error');
  }
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Страница "Мои ссылки"
app.get('/my-links', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'my-links.html'));
});

// Страница профиля
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Страница успеха аутентификации
app.get('/auth/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth-success.html'));
});

// Маршрут для перенаправления коротких URL (используем /s/ префикс)
app.get('/s/:shortCode', UrlController.redirectToOriginal);

// Обработка 404 для остальных маршрутов
app.use((req, res) => {
  // Проверяем, является ли запрос API запросом
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      success: false,
      error: 'API endpoint не найден'
    });
  } else {
    res.status(404).send('Страница не найдена');
  }
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Необработанная ошибка:', err);
  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера'
  });
});

// API маршрут для получения версии
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.2.0',
    lastUpdated: '2025-11-03',
    changes: [
      'Исправлена кнопка "Профиль" - теперь перенаправляет на страницу профиля',
      'Исправлено разлогинивание при переходе в "Мои ссылки"',
      'Улучшена система аутентификации с сохранением сессии',
      'Добавлена автоматическая пролонгация сессии при истечении токенов',
      'Создан файл components.js с общими компонентами header/footer',
      'Добавлена многоязычная поддержка в компоненты (15 языков)',
      'Обновлены все HTML/JS файлы для использования общих компонентов'
    ]
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 URL Shortener сервер запущен на http://localhost:${PORT}`);
  console.log(`📱 Веб-интерфейс доступен по адресу: http://localhost:${PORT}`);
  console.log(`🔗 API доступно по адресу: http://localhost:${PORT}/api`);
  console.log(`📋 Версия: 1.1.0`);
});

module.exports = app;
