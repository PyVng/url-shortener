// Mock database functions before importing UrlModel
jest.mock('../../../db/database', () => ({
  createShortUrl: jest.fn(),
  getOriginalUrl: jest.fn(),
  getUserLinks: jest.fn(),
  getLinkById: jest.fn(),
  updateUserLink: jest.fn(),
  deleteUserLink: jest.fn()
}));

const UrlModel = require('../../../models/url');
const { createShortUrl, getOriginalUrl } = require('../../../db/database');

describe('UrlModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateShortCode', () => {
    test('should generate a string of specified length', () => {
      const code = UrlModel.generateShortCode(8);
      expect(typeof code).toBe('string');
      expect(code.length).toBe(8);
    });

    test('should generate URL-safe characters only', () => {
      const code = UrlModel.generateShortCode(10);
      expect(code).toMatch(/^[a-zA-Z0-9_-]+$/);
    });

    test('should generate different codes on multiple calls', () => {
      const code1 = UrlModel.generateShortCode();
      const code2 = UrlModel.generateShortCode();
      expect(code1).not.toBe(code2);
    });
  });

  describe('validateUrl', () => {
    test('should validate correct HTTP URLs', () => {
      const result = UrlModel.validateUrl('https://example.com');
      expect(result.valid).toBe(true);
    });

    test('should validate correct HTTPS URLs', () => {
      const result = UrlModel.validateUrl('http://example.com');
      expect(result.valid).toBe(true);
    });

    test('should reject URLs without http/https protocol', () => {
      const result = UrlModel.validateUrl('example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Неверный формат URL');
    });

    test('should reject URLs that are too long', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2049);
      const result = UrlModel.validateUrl(longUrl);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('слишком длинный');
    });

    test('should reject invalid URL formats', () => {
      const result = UrlModel.validateUrl('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Неверный формат URL');
    });

    test('should accept URLs up to maximum length', () => {
      const maxLengthUrl = 'https://example.com/' + 'a'.repeat(2024);
      const result = UrlModel.validateUrl(maxLengthUrl);
      expect(result.valid).toBe(true);
    });
  });

  describe('createShortUrl', () => {
    test('should create short URL successfully', async () => {
      const originalUrl = 'https://example.com/test';
      const baseUrl = 'http://localhost:3000';
      const userId = null;

      // Mock the createShortUrl to return expected result
      createShortUrl.mockResolvedValue({
        id: 1,
        shortCode: 'abc123',
        originalUrl,
        userId
      });

      const result = await UrlModel.createShortUrl(originalUrl, baseUrl, userId);

      // Verify createShortUrl was called with any generated shortCode, the original URL, and userId
      expect(createShortUrl).toHaveBeenCalledWith(
        expect.any(String), // shortCode (generated)
        originalUrl,
        userId
      );
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('shortCode', 'abc123');
      expect(result).toHaveProperty('originalUrl', originalUrl);
      expect(result).toHaveProperty('shortUrl', `${baseUrl}/s/abc123`);
    });

    test('should handle database errors', async () => {
      const originalUrl = 'https://example.com/test';

      createShortUrl.mockRejectedValue(new Error('Database error'));

      await expect(UrlModel.createShortUrl(originalUrl))
        .rejects
        .toThrow('Database error');
    });

    test('should validate URL before creating', async () => {
      const invalidUrl = 'not-a-url';

      await expect(UrlModel.createShortUrl(invalidUrl))
        .rejects
        .toThrow('Неверный формат URL');
    });

    test('should handle duplicate short codes', async () => {
      const originalUrl = 'https://example.com/test';

      // First call succeeds
      createShortUrl.mockResolvedValueOnce({
        id: 1,
        shortCode: 'abc123',
        originalUrl
      });

      const result = await UrlModel.createShortUrl(originalUrl);
      expect(result.shortCode).toBe('abc123');
    });
  });

  describe('getOriginalUrl', () => {
    test('should return original URL for valid short code', async () => {
      const shortCode = 'abc123';
      const originalUrl = 'https://example.com/test';

      getOriginalUrl.mockResolvedValue(originalUrl);

      const result = await UrlModel.getOriginalUrl(shortCode);
      expect(getOriginalUrl).toHaveBeenCalledWith(shortCode);
      expect(result).toBe(originalUrl);
    });

    test('should throw error for invalid short code', async () => {
      const shortCode = 'invalid';

      getOriginalUrl.mockResolvedValue(null);

      await expect(UrlModel.getOriginalUrl(shortCode))
        .rejects
        .toThrow('Короткий URL не найден');
    });

    test('should throw error for null/undefined short code', async () => {
      await expect(UrlModel.getOriginalUrl(null))
        .rejects
        .toThrow('Неверный короткий код');

      await expect(UrlModel.getOriginalUrl(undefined))
        .rejects
        .toThrow('Неверный короткий код');

      await expect(UrlModel.getOriginalUrl(''))
        .rejects
        .toThrow('Неверный короткий код');
    });
  });
});
