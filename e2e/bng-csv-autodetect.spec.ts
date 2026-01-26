import { test, expect } from '@playwright/test';

test('should auto-detect BNG projection for coordinates like 40000 40000', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to load
    await page.waitForSelector('textarea');

    // Type BNG-like coordinates
    await page.locator('textarea').fill('40000 40000');

    // Wait a moment for parsing and rendering
    await page.waitForTimeout(1000);

    // Take screenshot for debugging
    await page.screenshot({ path: 'e2e/bng-csv-debug.png', fullPage: true });

    // Check for any error messages
    const redErrorBoxes = await page.locator('.text-red-700, .text-red-300').allTextContents();
    console.log('Red error boxes:', redErrorBoxes);

    // Check for latitude/longitude error
    const pageContent = await page.content();
    const hasLatError = pageContent.includes('latitude') || pageContent.includes('Latitude');
    const hasCoordError = pageContent.includes('Coordinates out of range');
    console.log('Has latitude error:', hasLatError);
    console.log('Has coord error:', hasCoordError);

    // Should NOT show coordinate errors
    expect(hasCoordError).toBe(false);
});
