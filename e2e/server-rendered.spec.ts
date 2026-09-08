import { expect, test } from '@playwright/test';

/**
 * The defect this project exists to fix: the previous site shipped an empty HTML
 * shell and produced all content with JavaScript, so a visitor with a blocked or
 * failed bundle got nothing. These tests fail if that regresses.
 *
 * Contact information is the specific thing that must survive, because it is what
 * someone reaches for when they are in a hurry.
 */
test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the homepage renders its heading and contact numbers', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Copernicus' })).toBeVisible();
    await expect(page.getByRole('link', { name: '58 764 01 00' })).toBeVisible();
  });

  test('the phone number is in the HTML the server sent, not added later', async ({ request }) => {
    const response = await request.get('/');

    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('58 764 01 00');
    expect(html).toContain('<h1');
  });
});

test('the served HTML declares the page language (3.1.1 Language of Page)', async ({ request }) => {
  const response = await request.get('/');
  const html = await response.text();

  expect(html).toMatch(/<html[^>]+lang="pl"/);
});
