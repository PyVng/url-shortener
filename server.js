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

// Маршрут для перенаправления коротких URL
app.get('/:shortCode', UrlController.redirectToOriginal);

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 URL Shortener сервер запущен на http://localhost:${PORT}`);
  console.log(`📱 Веб-интерфейс доступен по адресу: http://localhost:${PORT}`);
  console.log(`🔗 API доступно по адресу: http://localhost:${PORT}/api`);
});

module.exports = app;
