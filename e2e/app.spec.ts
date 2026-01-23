import { test, expect } from '@playwright/test';

test.describe('GeoFiddle', () => {
    test('loads the home page', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/GeoFiddle/);
    });

    test('displays the map', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.maplibregl-map')).toBeVisible();
    });
});
