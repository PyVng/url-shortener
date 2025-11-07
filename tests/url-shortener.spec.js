import { test, expect } from '@playwright/test';

test.describe('URL Shortener', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/URL Shortener/);
    await expect(page.locator('h1')).toContainText('Сократите длинные ссылки в короткие и удобные');
  });

  test('should create short URL successfully', async ({ page }) => {
    // Make direct API call instead of UI interaction
    const response = await page.request.post('/api/shorten', {
      data: { original_url: 'https://example.com/test-url' }
    });

    expect(response.status()).toBe(201);
    const responseData = await response.json();
    expect(responseData).toHaveProperty('short_code');
    expect(responseData).toHaveProperty('short_url');
    expect(responseData.original_url).toBe('https://example.com/test-url');
  });

  test('should show error for invalid URL', async ({ page }) => {
    // Make direct API call with invalid URL
    const response = await page.request.post('/api/shorten', {
      data: { original_url: 'invalid-url' }
    });

    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toContain('Invalid URL format');
  });

  test('should show error for empty URL', async ({ page }) => {
    // Make direct API call with empty URL
    const response = await page.request.post('/api/shorten', {
      data: { original_url: '' }
    });

    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toContain('original_url is required');
  });
});
