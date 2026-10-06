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

/**
 * /wazne-telefony is the route the redesign starts with, and the one the audit found
 * broken: eleven collapsed groups showing no numbers at all. These assertions are the
 * acceptance criteria from design/screens/wazne-telefony.md, 1, 2 and 4.
 */
test.describe('/wazne-telefony without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the served HTML carries 112, the emergency department and all five switchboards', async ({
    request,
  }) => {
    const response = await request.get('/wazne-telefony');
    expect(response.status()).toBe(200);
    const html = await response.text();

    for (const number of [
      '112', // always correct, and the one number that is never a facility's
      '58 764 01 16', // Szpitalny Oddzial Ratunkowy
      '58 764 01 00', // Kopernik
      '58 768 40 00', // sw. Wojciech
      '58 732 48 78', // WCO: the phone, not the fax
      '58 520 38 37', // Stomatologia
      '58 300 56 76', // Profilaktyka
    ]) {
      expect(html, `${number} is missing from the server-rendered HTML`).toContain(number);
    }
  });

  test('no primary content hides behind a disclosure', async ({ request }) => {
    const html = await (await request.get('/wazne-telefony')).text();

    expect(html).not.toContain('<details');
    expect(html).not.toContain('aria-expanded');
    expect(html).not.toContain('role="grid"');
  });

  test("WCO's fax is never something to dial", async ({ request }) => {
    // The current site lists 58 341 93 48 as WCO's contact number. It is a fax.
    const html = await (await request.get('/wazne-telefony')).text();

    expect(html).not.toContain('tel:+48583419348');
  });

  test('the filter form returns a filtered list from the server', async ({ page }) => {
    await page.goto('/wazne-telefony');

    await page.getByLabel('Szukaj numeru').fill('diagnostyki');
    await page.getByRole('button', { name: 'Filtruj' }).click();

    await expect(page).toHaveURL(/q=diagnostyki/);
    await expect(page.getByRole('link', { name: '58 764 02 00' })).toBeVisible();
    await expect(page.getByRole('link', { name: '58 772 39 50' })).toHaveCount(0);
  });

  test('a query with no matches keeps the urgent numbers and announces the result', async ({
    page,
  }) => {
    await page.goto('/wazne-telefony?q=kardiologia');

    await expect(page.getByRole('status')).toContainText('Nie znaleziono');
    // Pilne survives: that is the whole point of selecting it without the filter.
    await expect(page.getByRole('link', { name: '112' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: '58 764 01 16' })).toBeVisible();
  });

  test('a row with no number of its own shows the switchboard, labelled', async ({ page }) => {
    await page.goto('/wazne-telefony');

    const outOfHours = page.getByRole('listitem').filter({ hasText: 'Nocna i świąteczna' });
    await expect(outOfHours).toContainText('numer w przygotowaniu');
    await expect(outOfHours.getByRole('link', { name: '58 764 01 00' })).toBeVisible();
  });

  test('a contact point with unknown hours says so rather than showing a blank', async ({
    page,
  }) => {
    await page.goto('/wazne-telefony');

    await expect(page.getByText('Godziny do potwierdzenia').first()).toBeVisible();
  });
});

/**
 * Every internal link resolves. This exists because the fallback card on /wazne-telefony
 * shipped pointing at two routes that did not exist yet, one of them the "report an
 * accessibility problem" action: a dead end is a poor answer to someone who already could
 * not use the page.
 */
test('no internal link on any route leads to a 404', async ({ page, request }) => {
  const routes = ['/', '/wazne-telefony', '/kontakt', '/zglos-problem-dostepnosci'];
  const broken: string[] = [];

  for (const route of routes) {
    await page.goto(route);

    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href^="/"]')).map(
        (a) => a.getAttribute('href') ?? '',
      ),
    );

    for (const href of new Set(hrefs)) {
      const target = href.split('#')[0] ?? '';
      if (target === '') continue;
      const response = await request.get(target);
      if (response.status() !== 200) broken.push(`${route} -> ${href} (${response.status()})`);
    }
  }

  expect(broken, `Dead internal links:\n${broken.join('\n')}`).toEqual([]);
});
