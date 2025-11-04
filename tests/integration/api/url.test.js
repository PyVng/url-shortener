const request = require('supertest');
const app = require('../../../server');
const TestDatabase = require('../../setup/test-db');

describe('URL API Integration Tests', () => {
  beforeAll(async () => {
    await TestDatabase.setup();
  });

  afterAll(async () => {
    await TestDatabase.teardown();
  });

  afterEach(async () => {
    await TestDatabase.cleanTestData();
  });

  describe('POST /api/shorten', () => {
    test('should create short URL successfully', async () => {
      const testUrl = global.testUtils.generateTestUrl();

      const response = await request(app)
        .post('/api/shorten')
        .send({ originalUrl: testUrl })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('shortCode');
      expect(response.body.data).toHaveProperty('shortUrl');
      expect(response.body.data.originalUrl).toBe(testUrl);
    });
  });

  describe('GET /api/info/:shortCode', () => {
    test('should return 404 for non-existent short code', async () => {
      const response = await request(app)
        .get('/api/info/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Короткий URL не найден');
    });
  });

  describe('GET /s/:shortCode (redirect)', () => {
    test('should return 404 for non-existent short code', async () => {
      const response = await request(app)
        .get('/s/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Короткий URL не найден');
    });
  });

  describe('API endpoints availability', () => {
    test('should have auth endpoints available', async () => {
      const response = await request(app)
        .get('/api/auth/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('supabaseConfigured');
    });

    test('should have version endpoint available', async () => {
      const response = await request(app)
        .get('/api/version')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('version');
    });
  });
});
