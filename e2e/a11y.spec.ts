import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Conformance target is WCAG 2.2 level AA. AAA is tracked as an advisory gap report
 * so the remaining distance stays measurable; set A11Y_LEVEL=aaa to make it blocking.
 *
 * Axe catches roughly a third of WCAG issues, so a green run is a floor, not a
 * certificate: docs/accessibility.md lists what still requires manual verification.
 */
const LEVEL = (process.env.A11Y_LEVEL ?? 'aa').toLowerCase();

const AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const AAA_TAGS = ['wcag2aaa', 'wcag21aaa'];

const ROUTES = ['/'];

function summarise(
  violations: {
    id: string;
    impact?: string | null;
    help: string;
    nodes: { target: unknown[] }[];
  }[],
) {
  return violations
    .map(
      (v) =>
        `${v.id} (${v.impact ?? 'unknown'}): ${v.help}\n  ${v.nodes
          .map((n) => n.target.join(' '))
          .join('\n  ')}`,
    )
    .join('\n\n');
}

for (const route of ROUTES) {
  test(`no AA axe violations on ${route}`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page }).withTags(AA_TAGS).analyze();

    if (results.violations.length > 0) {
      console.error(summarise(results.violations));
    }

    expect(results.violations).toEqual([]);
  });

  test(`colour contrast holds in dark mode on ${route}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(route);

    const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();

    expect(results.violations).toEqual([]);
  });

  test(`AAA gap report for ${route}`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page })
      .withTags(AAA_TAGS)
      .withRules(['color-contrast-enhanced'])
      .analyze();

    if (results.violations.length > 0) {
      const report = summarise(results.violations);
      console.warn(`AAA gap (advisory at level ${LEVEL}):\n${report}`);
      test.info().annotations.push({ type: 'aaa-gap', description: report });
    }

    // Advisory by default: this test records the distance to AAA without blocking a
    // release that only claims AA. Flip A11Y_LEVEL to aaa to enforce it.
    if (LEVEL === 'aaa') {
      expect(results.violations).toEqual([]);
    }
  });
}
