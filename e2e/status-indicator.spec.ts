import { test, expect } from '@playwright/test';

test.describe('Status Indicator', () => {
    test('should show detected format and projection for GeoJSON', async ({ page }) => {
        await page.goto('/');

        // Type GeoJSON input
        const textarea = page.locator('textarea');
        await textarea.fill('{"type": "Point", "coordinates": [-0.1, 51.5]}');

        // Wait for parsing
        await page.waitForTimeout(500);

        // Check status indicator shows detected format (inline with title)
        const formatBadge = page.locator('span.font-medium', { hasText: 'GeoJSON' });
        await expect(formatBadge).toBeVisible();

        // Check projection is detected as WGS84 (full label is "WGS84 (lat/lon)")
        const projectionBadge = page.locator('span.font-medium', { hasText: /WGS84/ });
        await expect(projectionBadge).toBeVisible();

        // Check green success icon is visible
        const successIcon = page.locator('svg.text-green-600, svg.text-green-400');
        await expect(successIcon).toBeVisible();
    });

    test('should show detected BNG projection for large coordinates', async ({ page }) => {
        await page.goto('/');

        // Type BNG coordinates
        const textarea = page.locator('textarea');
        await textarea.fill('530000, 180000');

        // Wait for parsing
        await page.waitForTimeout(500);

        // Check status indicator shows CSV format
        const formatBadge = page.locator('span.font-medium', { hasText: 'CSV' });
        await expect(formatBadge).toBeVisible();

        // Check projection is detected as BNG
        const projectionBadge = page.locator('span.font-medium', { hasText: /British National Grid/ });
        await expect(projectionBadge).toBeVisible();

        // Check green success icon is visible
        const successIcon = page.locator('svg.text-green-600, svg.text-green-400');
        await expect(successIcon).toBeVisible();
    });

    test('should show green icon when specific format selected and parsing succeeds', async ({ page }) => {
        await page.goto('/');

        // Select specific format (not auto)
        const formatSelect = page.locator('select').first();
        await formatSelect.selectOption('geojson');

        // Type valid GeoJSON input
        const textarea = page.locator('textarea');
        await textarea.fill('{"type": "Point", "coordinates": [0, 0]}');

        // Wait for parsing
        await page.waitForTimeout(500);

        // Green success icon should still be visible even with manual format selection
        const successIcon = page.locator('svg.text-green-600, svg.text-green-400');
        await expect(successIcon).toBeVisible();
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
