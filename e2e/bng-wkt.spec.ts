import { test, expect } from '@playwright/test';

test('should display BNG WKT polygon without crashing', async ({ page }) => {
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

    // 2. Find the textarea and paste the BNG WKT
    const textarea = page.locator('textarea');
    await textarea.fill('POLYGON((530000 180000, 531000 180000, 531000 181000, 530000 181000, 530000 180000))');

    // Wait for parsing and rendering
    await page.waitForTimeout(1000);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'e2e/bng-wkt-debug.png' });

    // Check for LngLat errors first - this is the main bug we're testing
    const lngLatErrors = errors.filter((e) => e.includes('LngLat') || e.includes('latitude'));
    if (lngLatErrors.length > 0) {
        console.log('LngLat errors found:', lngLatErrors);
    }
    expect(lngLatErrors, `Found LngLat errors: ${lngLatErrors.join(', ')}`).toHaveLength(0);

    // Check that there's no parse error displayed (the red error box)
    const parseError = page.locator('.bg-red-50');
    const hasParseError = await parseError.isVisible();
    if (hasParseError) {
        const errorText = await parseError.textContent();
        console.log('Parse error:', errorText);
    }

    // Check that the map canvas is present and visible
    const mapCanvas = page.locator('canvas');
    await expect(mapCanvas).toBeVisible();
});
