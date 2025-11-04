import { test, expect } from '@playwright/test';

test.describe('My Links Page Tests', () => {
  test('should load my-links page with header and footer components', async ({ page }) => {
    await page.goto('/my-links');

    // Check page loads successfully
    await expect(page).toHaveTitle(/Мои ссылки/);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check header is loaded (now static in HTML)
    await expect(page.locator('nav.top-nav')).toBeVisible();

    // Check footer is loaded (now static in HTML)
    await expect(page.locator('footer')).toBeVisible();

    // Check footer contains version info
    await expect(page.locator('#version-info')).toBeVisible();

    // Check main content title is visible
    await expect(page.locator('h1')).toContainText('🔗 Мои ссылки');
  });

  test('should show auth required message when not authenticated', async ({ page }) => {
    await page.goto('/my-links');

    // Wait for page to load and auth check to complete
    await page.waitForTimeout(2000);

    // Check if auth required message is shown
    const authContainer = page.locator('.auth-required-container');
    const isVisible = await authContainer.isVisible();

    if (!isVisible) {
      // If not visible, check what is actually shown
      const bodyText = await page.locator('body').textContent();
      console.log('Page content:', bodyText);

      // Check if dashboard is visible instead
      const dashboardVisible = await page.locator('.dashboard-main').isVisible();
      if (dashboardVisible) {
        console.log('Dashboard is visible, auth check may have failed');
      }
    }

    // Should show auth required message
    await expect(page.locator('.auth-required-container')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Требуется авторизация');

    // Main dashboard content should be hidden
    await expect(page.locator('.dashboard-main')).not.toBeVisible();
  });

  test('should have working navigation links in header', async ({ page }) => {
    await page.goto('/my-links');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check navigation links exist
    await expect(page.locator('a[href="/"]')).toBeVisible();
    await expect(page.locator('a[href="/my-links"]')).toBeVisible();

    // Test homepage link
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('should have create new link button (when authenticated)', async ({ page }) => {
    // Note: This test would need authentication to pass
    // For now, we just check that the element exists in DOM
    await page.goto('/my-links');

    // Check create button exists in DOM (but may be hidden)
    await expect(page.locator('#createNewBtn')).toBeAttached();
    await expect(page.locator('#createNewBtn')).toContainText('Создать новую ссылку');
  });

  test('should have search and filter controls (when authenticated)', async ({ page }) => {
    // Note: This test would need authentication to pass
    await page.goto('/my-links');

    // Check search input exists in DOM (but may be hidden)
    await expect(page.locator('#searchInput')).toBeAttached();
    await expect(page.locator('#searchInput')).toHaveAttribute('placeholder', 'Поиск по ссылкам...');

    // Check sort select exists in DOM (but may be hidden)
    await expect(page.locator('#sortSelect')).toBeAttached();
    await expect(page.locator('#sortSelect')).toContainText('Сначала новые');
  });

  test('should show loading state initially (when authenticated)', async ({ page }) => {
    // Note: This test would need authentication to pass
    await page.goto('/my-links');

    // Check loading state exists in DOM (but may be hidden)
    await expect(page.locator('.loading-state')).toBeAttached();
    await expect(page.locator('.loading-state')).toContainText('Загружаем ваши ссылки...');
  });

  test('should have modal dialogs for edit and delete', async ({ page }) => {
    await page.goto('/my-links');

    // Check modals exist but are hidden
    await expect(page.locator('#editModal')).not.toBeVisible();
    await expect(page.locator('#deleteModal')).not.toBeVisible();

    // Check modal structure exists
    const editModal = page.locator('#editModal');
    await expect(editModal.locator('.modal-header h3')).toContainText('Редактировать ссылку');

    const deleteModal = page.locator('#deleteModal');
    await expect(deleteModal.locator('.modal-header h3')).toContainText('Удалить ссылку');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure for version endpoint
    await page.route('**/api/version', route => route.abort());

    await page.goto('/my-links');

    // Page should still load despite API failure
    await expect(page.locator('h1')).toContainText('🔗 Мои ссылки');

    // Footer should show fallback version text
    await page.waitForSelector('#version-info');
    const versionText = await page.locator('#version-info').textContent();
    expect(versionText).toBeTruthy();
  });

  test('should allow language switching', async ({ page }) => {
    await page.goto('/my-links');

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
});
