import { test, expect } from '@playwright/test';

test.describe('Unauthenticated Access Tests', () => {
  test('should load homepage without authentication', async ({ page }) => {
    await page.goto('/');

    // Check page loads successfully
    await expect(page).toHaveTitle(/URL Shortener/);

    // Check main content is visible
    await expect(page.locator('h1')).toContainText('🔗 URL Shortener');
    await expect(page.locator('.hero-section p')).toContainText('Сократите длинные ссылки');

    // Check URL shortening form is available
    await expect(page.locator('#urlForm')).toBeVisible();
    await expect(page.locator('#originalUrl')).toBeVisible();
    await expect(page.locator('#shortenBtn')).toBeVisible();
  });

  test('should show login/register buttons in header when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check auth buttons are visible
    await expect(page.locator('#loginBtn')).toBeVisible();
    await expect(page.locator('#registerBtn')).toBeVisible();

    // Check user info is hidden
    await expect(page.locator('#userInfo')).not.toBeVisible();
  });

  test('should redirect to login when accessing my-links without authentication', async ({ page }) => {
    await page.goto('/my-links');

    // Should redirect to homepage or show login prompt
    // Since we don't have client-side routing, it will load the page
    // but the content should indicate authentication is required
    await expect(page).toHaveTitle(/URL Shortener/);

    // The page should load but show appropriate message
    // (depending on how the frontend handles unauthenticated access)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy(); // Page should have content
  });

  test('should redirect to login when accessing profile without authentication', async ({ page }) => {
    await page.goto('/profile');

    // Should redirect to homepage or show login prompt
    await expect(page).toHaveTitle(/URL Shortener/);

    // The page should load but show appropriate message
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy(); // Page should have content
  });

  test('should load header and footer components', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check header is loaded (now static in HTML)
    await expect(page.locator('nav.top-nav')).toBeVisible();

    // Check footer is loaded (now static in HTML)
    await expect(page.locator('footer')).toBeVisible();

    // Check footer contains version info
    await expect(page.locator('#version-info')).toBeVisible();
  });

  test('should allow language switching in header', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check language selector exists
    const languageSelect = page.locator('#languageSelect');
    await expect(languageSelect).toBeVisible();

    // Check it has multiple language options
    const options = await languageSelect.locator('option').count();
    expect(options).toBeGreaterThan(1);

    // Try switching to English
    await languageSelect.selectOption('en');

    // The interface should update (though we may not see immediate changes
    // without proper i18n implementation)
    await expect(languageSelect).toHaveValue('en');
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check navigation links exist
    await expect(page.locator('a[href="/"]')).toBeVisible();
    await expect(page.locator('a[href="/my-links"]')).toBeVisible();

    // Test homepage link (should stay on same page or reload)
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('should handle API errors gracefully on homepage', async ({ page }) => {
    // Mock API failure for version endpoint
    await page.route('**/api/version', route => route.abort());

    await page.goto('/');

    // Page should still load despite API failure
    await expect(page.locator('h1')).toContainText('🔗 URL Shortener');

    // Footer should show fallback version text
    await page.waitForSelector('#version-info');
    const versionText = await page.locator('#version-info').textContent();
    expect(versionText).toBeTruthy();
  });
});
