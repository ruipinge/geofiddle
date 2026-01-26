import { test, expect } from '@playwright/test';

test.describe('Status Indicator', () => {
    test('should show detected format and projection for GeoJSON', async ({ page }) => {
        await page.goto('/');

        // Type GeoJSON input
        const textarea = page.locator('textarea');
        await textarea.fill('{"type": "Point", "coordinates": [-0.1, 51.5]}');

        // Wait for parsing
        await page.waitForTimeout(500);

        // Check status indicator shows detected format (look for the badge specifically)
        const formatBadge = page.locator('span.font-medium', { hasText: 'GeoJSON' });
        await expect(formatBadge).toBeVisible();

        // Check projection is detected as WGS84 (full label is "WGS84 (lat/lon)")
        const projectionBadge = page.locator('span.font-medium', { hasText: /WGS84/ });
        await expect(projectionBadge).toBeVisible();
    });

    test('should show detected BNG projection for large coordinates', async ({ page }) => {
        await page.goto('/');

        // Type BNG coordinates
        const textarea = page.locator('textarea');
        await textarea.fill('530000, 180000');

        // Wait for parsing
        await page.waitForTimeout(500);

        // Check status indicator shows CSV format (look for the badge specifically)
        const formatBadge = page.locator('span.font-medium', { hasText: 'CSV' });
        await expect(formatBadge).toBeVisible();

        // Check projection is detected as BNG
        const projectionBadge = page.locator('span.font-medium', { hasText: /British National Grid/ });
        await expect(projectionBadge).toBeVisible();
    });

    test('should show error indicator for invalid input', async ({ page }) => {
        await page.goto('/');

        // Type invalid input
        const textarea = page.locator('textarea');
        await textarea.fill('this is not valid geometry');

        // Wait for parsing
        await page.waitForTimeout(500);

        // Check that an error is shown (red background)
        const errorBadge = page.locator('.bg-red-100, .bg-red-900\\/50');
        await expect(errorBadge).toBeVisible();
    });

    test('should show output area even with errors', async ({ page }) => {
        await page.goto('/');

        // Type invalid input
        const textarea = page.locator('textarea');
        await textarea.fill('invalid input here');

        // Wait for parsing
        await page.waitForTimeout(500);

        // Check that output area (pre element) is still visible
        const outputArea = page.locator('pre').first();
        await expect(outputArea).toBeVisible();
    });
});
