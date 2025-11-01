const UrlModel = require('../models/url');

class UrlController {
  // Создание короткого URL
  static async shortenUrl(req, res) {
    try {
      const { originalUrl } = req.body;

      if (!originalUrl) {
        return res.status(400).json({
          success: false,
          error: 'Необходимо указать originalUrl'
        });
      }

      // Определяем базовый URL динамически для Vercel
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers['x-forwarded-host'] || req.headers.host || req.hostname;
      const baseUrl = `${protocol}://${host}`;

      // Получаем userId из аутентифицированного пользователя (если есть)
      const userId = req.user ? req.user.id : null;

      const result = await UrlModel.createShortUrl(originalUrl, baseUrl, userId);

      res.status(201).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Ошибка при создании короткого URL:', error);

      // Определяем тип ошибки для соответствующего HTTP статуса
      let statusCode = 500;
      if (error.message.includes('URL должен') ||
          error.message.includes('слишком длинный') ||
          error.message.includes('Неверный формат')) {
        statusCode = 400;
      }

      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  // Перенаправление на оригинальный URL
  static async redirectToOriginal(req, res) {
    try {
      const { shortCode } = req.params;

      const originalUrl = await UrlModel.getOriginalUrl(shortCode);

      // Перенаправление на оригинальный URL
      res.redirect(302, originalUrl);

    } catch (error) {
      console.error('Ошибка при перенаправлении:', error);

      if (error.message === 'Короткий URL не найден') {
        return res.status(404).json({
          success: false,
          error: 'Короткий URL не найден'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера'
      });
    }
  }

  // Получение информации о коротком URL (для отладки)
  static async getUrlInfo(req, res) {
    try {
      const { shortCode } = req.params;

      const originalUrl = await UrlModel.getOriginalUrl(shortCode);

      res.json({
        success: true,
        data: {
          shortCode,
          originalUrl,
          shortUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/${shortCode}`
        }
      });

    } catch (error) {
      console.error('Ошибка при получении информации о URL:', error);

      if (error.message === 'Короткий URL не найден') {
        return res.status(404).json({
          success: false,
          error: 'Короткий URL не найден'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера'
      });
    }
  }
}

module.exports = UrlController;
