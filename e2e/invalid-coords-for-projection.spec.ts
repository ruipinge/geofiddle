import { test, expect } from '@playwright/test';

test('should show error instead of crashing when WGS84 selected with BNG coordinates', async ({ page }) => {
    // Capture console errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
        errors.push(error.message);
    });
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });

    // 1. Open the site
    await page.goto('/');

    // Wait for the page to load
    await expect(page.locator('text=GeoFiddle')).toBeVisible();

    // 2. Select WGS84 projection explicitly (find the projection select by its label)
    const projectionSelect = page.locator('select[aria-label*="Projection"]').first();
    await projectionSelect.selectOption('EPSG:4326');

    // 3. Paste BNG coordinates (which are invalid for WGS84)
    const textarea = page.locator('textarea');
    await textarea.fill('POLYGON((530000 180000, 531000 180000, 531000 181000, 530000 181000, 530000 180000))');

    // Wait for parsing and rendering attempt
    await page.waitForTimeout(1000);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'e2e/invalid-coords-debug.png' });

    // The app should NOT crash with LngLat errors
    const lngLatErrors = errors.filter((e) => e.includes('LngLat') || e.includes('latitude'));
    expect(lngLatErrors, `App crashed with: ${lngLatErrors.join(', ')}`).toHaveLength(0);

    // Instead, it should show a user-friendly error in the status indicator
    // The error badge uses bg-red-100 (light) or bg-red-900/50 (dark)
    const errorBadge = page.locator('.bg-red-100, [class*="bg-red-900"]');
    await expect(errorBadge, 'Should display an error message to the user').toBeVisible();

    // The map canvas should still be present (app didn't crash)
    const mapCanvas = page.locator('canvas');
    await expect(mapCanvas).toBeVisible();
});
