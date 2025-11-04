import { test, expect } from '@playwright/test';

test.describe('Profile Page Tests', () => {
  test('should load profile page with header and footer components', async ({ page }) => {
    await page.goto('/profile');

    // Check page loads successfully
    await expect(page).toHaveTitle(/Профиль/);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check header is loaded (now static in HTML)
    await expect(page.locator('nav.top-nav')).toBeVisible();

    // Check footer is loaded (now static in HTML)
    await expect(page.locator('footer')).toBeVisible();

    // Check footer contains version info
    await expect(page.locator('#version-info')).toBeVisible();

    // Check main content is visible
    await expect(page.locator('h1')).toContainText('👤 Профиль пользователя');
    await expect(page.locator('.profile-main')).toBeVisible();
  });

  test('should show profile card with user information', async ({ page }) => {
    await page.goto('/profile');

    // Check profile card exists
    await expect(page.locator('.profile-card')).toBeVisible();

    // Check profile avatar
    await expect(page.locator('#profileAvatar')).toBeVisible();

    // Check profile info fields
    await expect(page.locator('#profileName')).toBeVisible();
    await expect(page.locator('#profileEmail')).toBeVisible();

    // Check stats section
    await expect(page.locator('#totalLinks')).toBeVisible();
    await expect(page.locator('#totalClicks')).toBeVisible();
    await expect(page.locator('#accountAge')).toBeVisible();
  });

  test('should have profile settings form', async ({ page }) => {
    await page.goto('/profile');

    // Check settings section exists
    await expect(page.locator('.profile-settings')).toBeVisible();
    await expect(page.locator('.profile-settings h3')).toContainText('⚙️ Настройки профиля');

    // Check form exists
    await expect(page.locator('#profileForm')).toBeVisible();

    // Check form inputs
    await expect(page.locator('#userName')).toBeVisible();
    await expect(page.locator('#userEmailInput')).toBeVisible();

    // Check save button
    await expect(page.locator('#saveProfileBtn')).toBeVisible();
  });

  test('should have account management actions', async ({ page }) => {
    await page.goto('/profile');

    // Check actions section exists
    await expect(page.locator('.profile-actions')).toBeVisible();
    await expect(page.locator('.profile-actions h3')).toContainText('🛠️ Управление аккаунтом');

    // Check action buttons
    await expect(page.locator('.action-buttons')).toBeVisible();

    // Check "My Links" button
    const myLinksBtn = page.locator('.action-buttons .btn').first();
    await expect(myLinksBtn).toContainText('Мои ссылки');

    // Check logout button
    await expect(page.locator('#logoutBtnMain')).toBeVisible();
    await expect(page.locator('#logoutBtnMain')).toContainText('Выйти из аккаунта');
  });

  test('should have working navigation links in header', async ({ page }) => {
    await page.goto('/profile');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check navigation links exist
    await expect(page.locator('a[href="/"]')).toBeVisible();
    await expect(page.locator('a[href="/my-links"]')).toBeVisible();

    // Test homepage link
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('should allow language switching', async ({ page }) => {
    await page.goto('/profile');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check language selector exists
    const languageSelect = page.locator('#languageSelect');
    await expect(languageSelect).toBeVisible();

    // Try switching to English
    await languageSelect.selectOption('en');

    // The interface should update
    await expect(languageSelect).toHaveValue('en');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure for version endpoint
    await page.route('**/api/version', route => route.abort());

    await page.goto('/profile');

    // Page should still load despite API failure
    await expect(page.locator('h1')).toContainText('👤 Профиль пользователя');

    // Footer should show fallback version text
    await page.waitForSelector('#version-info');
    const versionText = await page.locator('#version-info').textContent();
    expect(versionText).toBeTruthy();
  });

  test('should have proper form validation', async ({ page }) => {
    await page.goto('/profile');

    // Check form inputs have proper attributes
    const nameInput = page.locator('#userName');
    await expect(nameInput).toHaveAttribute('type', 'text');

    const emailInput = page.locator('#userEmailInput');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('readonly');
  });

  test('should have responsive design elements', async ({ page }) => {
    await page.goto('/profile');

    // Check main container has proper classes
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('.profile-main')).toBeVisible();

    // Check card layout
    await expect(page.locator('.profile-card')).toHaveClass(/profile-card/);
  });

  test('should load Supabase client', async ({ page }) => {
    await page.goto('/profile');

    // Check that Supabase script is loaded (from profile.html)
    const supabaseLoaded = await page.evaluate(() => {
      return typeof window.supabase !== 'undefined';
    });

    expect(supabaseLoaded).toBe(true);
  });
});
