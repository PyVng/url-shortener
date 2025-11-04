import { test, expect } from '@playwright/test';

test.describe('URL Shortener', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/URL Shortener/);
    await expect(page.locator('h1')).toContainText('URL Shortener');
  });

  test('should create short URL successfully', async ({ page }) => {
    await page.goto('/');

    // Fill the URL input
    await page.fill('input[name="originalUrl"]', 'https://example.com/test-url');

    // Click the shorten button
    await page.click('button[type="submit"]');

    // Wait for the result to appear
    await page.waitForSelector('.result', { state: 'visible' });

    // Check that result is displayed
    await expect(page.locator('.result h3')).toContainText('URL успешно сокращен');

    // Check that short URL input has a value
    const shortUrlInput = page.locator('#shortUrlInput');
    await expect(shortUrlInput).not.toBeEmpty();
  });

  test('should show error for invalid URL', async ({ page }) => {
    await page.goto('/');

    // Fill with invalid URL
    await page.fill('input[name="originalUrl"]', 'invalid-url');

    // Click the shorten button
    await page.click('button[type="submit"]');

    // Wait for the error to appear
    await page.waitForSelector('.error', { state: 'visible' });

    // Check that error is displayed
    await expect(page.locator('.error h3')).toContainText('Ошибка');
  });

  test('should show error for empty URL', async ({ page }) => {
    await page.goto('/');

    // Click the shorten button without filling the input
    await page.click('button[type="submit"]');

    // Wait for the error to appear
    await page.waitForSelector('.error', { state: 'visible' });

    // Check that error is displayed
    await expect(page.locator('.error h3')).toContainText('Ошибка');
  });
});
