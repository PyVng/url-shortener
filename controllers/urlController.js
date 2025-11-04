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
      console.log('🔗 shortenUrl: Creating URL for userId:', userId, 'originalUrl:', originalUrl);

      const result = await UrlModel.createShortUrl(originalUrl, baseUrl, userId);
      console.log('🔗 shortenUrl: Created URL result:', result);

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
          shortUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/s/${shortCode}`
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

  // Получение списка ссылок пользователя
  static async getUserLinks(req, res) {
    try {
      console.log('🔍🔍🔍 getUserLinks CONTROLLER CALLED - SERVER LOGS 🔍🔍🔍');
      console.log('🔍 getUserLinks controller called');
      console.log('🔍 req.user exists:', !!req.user);
      console.log('🔍 req.supabaseAuth exists:', !!req.supabaseAuth);
      console.log('🔍 req.headers.authorization exists:', !!req.headers.authorization);

      if (!req.user) {
        console.log('❌ No user in request');
        return res.status(401).json({
          success: false,
          error: 'Необходима аутентификация'
        });
      }

      const userId = req.user.id;
      console.log('🔍 User ID:', userId);
      console.log('🔍 User object:', req.user);

      const options = {
        authToken: req.supabaseAuth?.token,
        supabaseClient: req.supabaseAuth?.client,
      };

      console.log('🔍 Options for getUserLinks:', {
        hasAuthToken: !!options.authToken,
        hasSupabaseClient: !!options.supabaseClient
      });

      console.log('🔍 Calling UrlModel.getUserLinks with userId:', userId);
      const links = await UrlModel.getUserLinks(userId, options);
      console.log('🔍 UrlModel.getUserLinks returned:', typeof links, Array.isArray(links) ? links.length : 'not array');

      console.log('✅ getUserLinks successful, returning', links.length, 'links');

      res.json({
        success: true,
        data: {
          links
        }
      });

    } catch (error) {
      console.error('❌ Error in getUserLinks controller:', error.message);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n')[0]
      });

      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера'
      });
    }
  }

  // Обновление ссылки пользователя
  static async updateUserLink(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Необходима аутентификация'
        });
      }

      const { id } = req.params;
      const { title, original_url, short_code } = req.body;
      const userId = req.user.id;

      // Проверяем, что ссылка принадлежит пользователю
      const link = await UrlModel.getLinkById(id);
      if (!link) {
        return res.status(404).json({
          success: false,
          error: 'Ссылка не найдена'
        });
      }

      if (link.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Нет доступа к этой ссылке'
        });
      }

      const updatedLink = await UrlModel.updateUserLink(id, {
        title,
        original_url,
        short_code
      });

      res.json({
        success: true,
        data: updatedLink
      });

    } catch (error) {
      console.error('Ошибка при обновлении ссылки:', error);

      let statusCode = 500;
      if (error.message.includes('уже существует') ||
          error.message.includes('Неверный формат')) {
        statusCode = 400;
      }

      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  // Удаление ссылки пользователя
  static async deleteUserLink(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Необходима аутентификация'
        });
      }

      const { id } = req.params;
      const userId = req.user.id;

      // Проверяем, что ссылка принадлежит пользователю
      const link = await UrlModel.getLinkById(id);
      if (!link) {
        return res.status(404).json({
          success: false,
          error: 'Ссылка не найдена'
        });
      }

      if (link.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Нет доступа к этой ссылке'
        });
      }

      await UrlModel.deleteUserLink(id);

      res.json({
        success: true,
        message: 'Ссылка успешно удалена'
      });

    } catch (error) {
      console.error('Ошибка при удалении ссылки:', error);
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера'
      });
    }
  }
}

module.exports = UrlController;
