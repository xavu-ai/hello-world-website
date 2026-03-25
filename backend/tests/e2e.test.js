import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Hello World E2E Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Collect console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[Browser Console Error] ${msg.text()}`);
      }
    });
  });

  test('page loads without JavaScript errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    expect(consoleErrors, 'Page should have no console errors').toHaveLength(0);
  });

  test('page title is "Hello World"', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle('Hello World');
  });

  test('heading "#greeting" contains "Hello World" and is visible', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const heading = page.locator('#greeting');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Hello World');
  });

  test('heading "#greeting" is centered', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const heading = page.locator('#greeting');
    const textAlign = await heading.evaluate(el => window.getComputedStyle(el).textAlign);
    expect(textAlign, 'Heading text-align should be center').toBe('center');
  });

  test('date/time display "#timestamp" is populated on load', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const timestamp = page.locator('#timestamp');
    await expect(timestamp).toBeVisible();
    const text = await timestamp.textContent();
    expect(text, 'Timestamp should not be empty').not.toBe('');
    expect(text, 'Timestamp should contain "Page loaded at:"').toContain('Page loaded at:');
  });

  test('no 404 errors for CSS or JS resources', async ({ page }) => {
    const failedRequests = [];
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      if ((url.includes('.css') || url.includes('.js')) && status === 404) {
        failedRequests.push({ url, status });
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    expect(failedRequests, 'No 404s for CSS/JS resources').toHaveLength(0);
  });

  test('layout renders correctly at 375px viewport width (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Greeting should still be visible at mobile
    const heading = page.locator('#greeting');
    await expect(heading).toBeVisible();

    // Card should be visible
    const card = page.locator('.card');
    await expect(card).toBeVisible();

    // Timestamp should be visible
    const timestamp = page.locator('#timestamp');
    await expect(timestamp).toBeVisible();
  });

  test('static CSS file returns 200', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/css/styles.css`);
    expect(response?.status(), 'CSS file should return 200').toBe(200);
  });

  test('static JS file returns 200', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/js/app.js`);
    expect(response?.status(), 'JS file should return 200').toBe(200);
  });

});
