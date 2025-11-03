const crypto = require('crypto');
const { createShortUrl, getOriginalUrl, getUserLinks: dbGetUserLinks, getLinkById: dbGetLinkById, updateUserLink: dbUpdateUserLink, deleteUserLink: dbDeleteUserLink } = require('../db/database');

class UrlModel {
  // Генерация короткого кода
  static generateShortCode(length = 8) {
    return crypto.randomBytes(length).toString('base64url').substring(0, length);
  }

  // Валидация URL
  static validateUrl(url) {
    try {
      const urlObj = new URL(url);
      // Проверяем, что это HTTP или HTTPS
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'URL должен начинаться с http:// или https://' };
      }
      // Проверяем максимальную длину
      if (url.length > 2048) {
        return { valid: false, error: 'URL слишком длинный (максимум 2048 символов)' };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Неверный формат URL' };
    }
  }

  // Создание короткого URL
  static async createShortUrl(originalUrl, baseUrl = null, userId = null) {
    // Валидация URL
    const validation = this.validateUrl(originalUrl);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Генерация уникального короткого кода
    let shortCode;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      shortCode = this.generateShortCode();
      attempts++;

      try {
        const result = await createShortUrl(shortCode, originalUrl);
        // Используем переданный baseUrl или fallback к environment переменной
        const finalBaseUrl = baseUrl || process.env.BASE_URL || 'http://localhost:3000';
        return {
          id: result.id,
          shortCode: result.shortCode,
          originalUrl: result.originalUrl,
          shortUrl: `${finalBaseUrl}/s/${result.shortCode}`
        };
      } catch (error) {
        // Если код уже существует, попробуем сгенерировать новый
        if (error.code === 'SQLITE_CONSTRAINT' && attempts < maxAttempts) {
          continue;
        }
        throw error;
      }
    } while (attempts < maxAttempts);

    throw new Error('Не удалось сгенерировать уникальный короткий код');
  }

  // Получение оригинального URL
  static async getOriginalUrl(shortCode) {
    if (!shortCode || typeof shortCode !== 'string') {
      throw new Error('Неверный короткий код');
    }

    const originalUrl = await getOriginalUrl(shortCode);
    if (!originalUrl) {
      throw new Error('Короткий URL не найден');
    }

    return originalUrl;
  }

  // Получение списка ссылок пользователя
  static async getUserLinks(userId) {
    if (!userId) {
      throw new Error('Необходим userId');
    }

    return await dbGetUserLinks(userId);
  }

  // Получение ссылки по ID
  static async getLinkById(id) {
    if (!id) {
      throw new Error('Необходим ID ссылки');
    }

    return await dbGetLinkById(id);
  }

  // Обновление ссылки пользователя
  static async updateUserLink(id, updates) {
    if (!id) {
      throw new Error('Необходим ID ссылки');
    }

    const { title, original_url, short_code } = updates;

    // Валидация URL если он обновляется
    if (original_url) {
      const validation = this.validateUrl(original_url);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    // Валидация short_code если он обновляется
    if (short_code) {
      if (short_code.length < 3 || short_code.length > 20) {
        throw new Error('Короткий код должен содержать от 3 до 20 символов');
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(short_code)) {
        throw new Error('Короткий код может содержать только буквы, цифры, дефисы и подчеркивания');
      }
    }

    return await dbUpdateUserLink(id, updates);
  }

  // Удаление ссылки пользователя
  static async deleteUserLink(id) {
    if (!id) {
      throw new Error('Необходим ID ссылки');
    }

    return await dbDeleteUserLink(id);
  }
}

module.exports = UrlModel;
