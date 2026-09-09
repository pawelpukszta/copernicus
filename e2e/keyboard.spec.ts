import { expect, test, type Page } from '@playwright/test';

/**
 * Conformance target is WCAG 2.2 level AA.
 *
 * Target size: 2.5.8 (AA) requires 24 x 24 CSS px, 2.5.5 (AAA) requires 44 x 44.
 * The AA figure is enforced; anything between 24 and 44 is reported as the AAA gap.
 * Set A11Y_LEVEL=aaa to make the 44 px figure blocking.
 *
 * Both criteria exempt inline targets, meaning links inside a sentence or block of
 * text, because their size is determined by the text flow. The inlineException check
 * below implements that exemption; without it every body-copy link is a false positive.
 *
 * Engine differences are handled by capability, not by a list of browser names:
 * Safari leaves links out of Tab traversal unless the user turns on Full Keyboard
 * Access, and touch profiles have no Tab key at all. Assertions that depend on Tab
 * are gated; everything that can be verified without it runs everywhere.
 */
const LEVEL = (process.env.A11Y_LEVEL ?? 'aa').toLowerCase();
const MIN_TARGET_AA = 24;
const MIN_TARGET_AAA = 44;

/**
 * Does this engine include links in Tab traversal? Probed on neutral content on
 * purpose: probing our own skip link would let a real regression in the page make
 * the assertion skip itself instead of failing.
 */
async function tabsToLinks(page: Page): Promise<boolean> {
  await page.setContent('<a href="#probe">probe</a>');
  await page.keyboard.press('Tab');
  return page.evaluate(() => document.activeElement?.tagName === 'A');
}

test('the skip link is hidden until focused, then visible (2.4.1 Bypass Blocks)', async ({
  page,
}) => {
  await page.goto('/');

  const skipLink = page.locator('.cp-skip-link');
  await expect(skipLink).not.toBeInViewport();

  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
});

test('the skip link is the first Tab stop (2.4.3 Focus Order)', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'Tab traversal is not an input path on a touch profile');
  test.skip(
    !(await tabsToLinks(page)),
    'This engine leaves links out of Tab traversal (Safari default)',
  );

  await page.goto('/');
  await page.keyboard.press('Tab');

  await expect(page.locator('.cp-skip-link')).toBeFocused();
});

test('interactive targets meet 2.5.8 (AA) and report the gap to 2.5.5 (AAA)', async ({ page }) => {
  await page.goto('/');

  const targets = page.locator('a, button, input, select, textarea, [role="button"]');
  const count = await targets.count();
  expect(count).toBeGreaterThan(0);

  const belowAa: string[] = [];
  const belowAaa: string[] = [];
  const exempt: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const target = targets.nth(i);
    if (!(await target.isVisible())) continue;

    const box = await target.boundingBox();
    if (!box) continue;

    const { label, inlineException } = await target.evaluate((el) => {
      const display = window.getComputedStyle(el).display;
      const parentText = el.parentElement?.textContent?.trim() ?? '';
      const ownText = el.textContent?.trim() ?? '';
      return {
        label: ownText || el.outerHTML.slice(0, 80),
        // Inline element whose parent carries text beyond the target itself: the
        // target sits in a sentence, so 2.5.8 and 2.5.5 do not apply to it.
        inlineException: display.startsWith('inline') && parentText.length > ownText.length,
      };
    });

    const size = `${label} -> ${Math.round(box.width)}x${Math.round(box.height)}`;

    if (inlineException) {
      exempt.push(size);
      continue;
    }

    if (box.width < MIN_TARGET_AA || box.height < MIN_TARGET_AA) belowAa.push(size);
    else if (box.width < MIN_TARGET_AAA || box.height < MIN_TARGET_AAA) belowAaa.push(size);
  }

  if (exempt.length > 0) {
    console.log(`Inline targets exempt from 2.5.8 and 2.5.5:\n${exempt.join('\n')}`);
  }

  if (belowAaa.length > 0) {
    const report = belowAaa.join('\n');
    console.warn(
      `Targets below ${MIN_TARGET_AAA}px (AAA gap, advisory at level ${LEVEL}):\n${report}`,
    );
    test.info().annotations.push({ type: 'aaa-gap', description: report });
  }

  expect(belowAa, `Targets below ${MIN_TARGET_AA}px (AA):\n${belowAa.join('\n')}`).toEqual([]);

  if (LEVEL === 'aaa') {
    expect(belowAaa, `Targets below ${MIN_TARGET_AAA}px (AAA):\n${belowAaa.join('\n')}`).toEqual(
      [],
    );
  }
});

test('everything the keyboard reaches shows a focus indicator (2.4.7)', async ({
  page,
  isMobile,
}) => {
  test.skip(!!isMobile, 'Tab traversal is not an input path on a touch profile');

  await page.goto('/');

  let visited = 0;

  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab');

    const indicator = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        outlineWidth: Number.parseFloat(style.outlineWidth),
        outlineStyle: style.outlineStyle,
        boxShadow: style.boxShadow,
      };
    });

    if (!indicator) break;

    const hasIndicator =
      (indicator.outlineStyle !== 'none' && indicator.outlineWidth >= 2) ||
      (indicator.boxShadow !== 'none' && indicator.boxShadow !== '');

    expect(hasIndicator, `No visible focus indicator on ${indicator.tag}`).toBe(true);
    visited += 1;
  }

  // Without this the test would pass by reaching nothing at all, which is how an
  // engine that ignores Tab turns a real check into a green tick.
  expect(visited, 'The keyboard reached no element, so nothing was asserted').toBeGreaterThan(0);
});

test('content stays usable at 200% zoom (1.4.4 Resize Text)', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 720 });
  await page.goto('/');
  // Doubling the root font size emulates a 200% text-only zoom.
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px';
  });

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );

  expect(horizontalOverflow, 'Page scrolls horizontally at 200% text size').toBe(false);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
