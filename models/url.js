const crypto = require('crypto');
const { createShortUrl, getOriginalUrl } = require('../db/database');

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
  static async createShortUrl(originalUrl) {
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
        return {
          id: result.id,
          shortCode: result.shortCode,
          originalUrl: result.originalUrl,
          shortUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/${result.shortCode}`
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
}

module.exports = UrlModel;
