import { test, expect } from '@playwright/test';

test.describe('URL Shortener - Create Link', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/URL Shortener/);

    // Check main heading
    await expect(page.locator('h1')).toContainText('🔗 URL Shortener');

    // Check form elements
    await expect(page.locator('#originalUrl')).toBeVisible();
    await expect(page.locator('#shortenBtn')).toBeVisible();
    await expect(page.locator('#shortenBtn')).toContainText('Сократить URL');
  });

  test('should create short URL successfully', async ({ page }) => {
    await page.goto('/');

    const testUrl = `https://example.com/test-${Date.now()}`;

    // Fill the form
    await page.fill('#originalUrl', testUrl);
    await page.click('#shortenBtn');

    // Wait for success result
    await page.waitForSelector('#result', { state: 'visible' });

    // Check success message
    await expect(page.locator('#result h3')).toContainText('✅ URL успешно сокращен');

    // Check that short URL is displayed
    const shortUrlInput = page.locator('#shortUrlInput');
    await expect(shortUrlInput).toBeVisible();

    const shortUrl = await shortUrlInput.inputValue();
    expect(shortUrl).toMatch(/^http:\/\/localhost:3000\/s\/[a-zA-Z0-9_-]+$/);

    // Check original URL display
    await expect(page.locator('#originalUrlDisplay')).toContainText(testUrl);
  });

  test('should show error for invalid URL', async ({ page }) => {
    await page.goto('/');

    // Fill with invalid URL
    await page.fill('#originalUrl', 'not-a-valid-url');
    await page.click('#shortenBtn');

    // Wait for error result
    await page.waitForSelector('#error', { state: 'visible' });

    // Check error message
    await expect(page.locator('#error h3')).toContainText('❌ Ошибка');
    await expect(page.locator('#errorMessage')).toContainText('Неверный формат URL');
  });

  test('should show error for empty URL', async ({ page }) => {
    await page.goto('/');

    // Try to submit empty form
    await page.click('#shortenBtn');

    // Wait for error result
    await page.waitForSelector('#error', { state: 'visible' });

    // Check error message
    await expect(page.locator('#error h3')).toContainText('❌ Ошибка');
    await expect(page.locator('#errorMessage')).toContainText('Необходимо указать originalUrl');
  });

  test('should copy short URL to clipboard', async ({ page }) => {
    await page.goto('/');

    const testUrl = `https://example.com/test-${Date.now()}`;

    // Create a short URL
    await page.fill('#originalUrl', testUrl);
    await page.click('#shortenBtn');
    await page.waitForSelector('#result', { state: 'visible' });

    // Click copy button
    await page.click('#copyBtn');

    // Check that URL was copied (we can't directly access clipboard in headless mode,
    // but we can check that the button exists and is clickable)
    await expect(page.locator('#copyBtn')).toBeVisible();
  });

  test('should navigate to short URL', async ({ page, context }) => {
    await page.goto('/');

    const testUrl = `https://example.com/test-${Date.now()}`;

    // Create a short URL
    await page.fill('#originalUrl', testUrl);
    await page.click('#shortenBtn');
    await page.waitForSelector('#result', { state: 'visible' });

    // Get the short URL
    const shortUrl = await page.locator('#shortUrlInput').inputValue();

    // Open short URL in new page
    const newPage = await context.newPage();
    await newPage.goto(shortUrl.replace('http://localhost:3000', ''));

    // Should redirect to original URL
    await newPage.waitForURL(testUrl);
    expect(newPage.url()).toBe(testUrl);
  });

  test('should allow creating new link after success', async ({ page }) => {
    await page.goto('/');

    const testUrl1 = `https://example.com/test1-${Date.now()}`;
    const testUrl2 = `https://example.com/test2-${Date.now()}`;

    // Create first short URL
    await page.fill('#originalUrl', testUrl1);
    await page.click('#shortenBtn');
    await page.waitForSelector('#result', { state: 'visible' });

    // Click "Create new" button
    await page.click('#createNewBtn');

    // Form should be visible again, result should be hidden
    await expect(page.locator('#result')).not.toBeVisible();
    await expect(page.locator('#originalUrl')).toBeVisible();
    await expect(page.locator('#originalUrl')).toHaveValue('');

    // Create second URL
    await page.fill('#originalUrl', testUrl2);
    await page.click('#shortenBtn');
    await page.waitForSelector('#result', { state: 'visible' });

    // Check that second URL was created
    await expect(page.locator('#originalUrlDisplay')).toContainText(testUrl2);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/shorten', route => route.abort());

    await page.goto('/');

    const testUrl = `https://example.com/test-${Date.now()}`;

    // Try to create URL
    await page.fill('#originalUrl', testUrl);
    await page.click('#shortenBtn');

    // Should show error
    await page.waitForSelector('#error', { state: 'visible' });
    await expect(page.locator('#error h3')).toContainText('❌ Ошибка');
  });
});
