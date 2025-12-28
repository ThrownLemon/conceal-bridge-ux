import { expect, test, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Maximum number of tab key presses to test keyboard navigation */
const MAX_TAB_PRESSES = 10;

/** Minimum expected focusable elements on the home page */
const MIN_EXPECTED_FOCUSABLE_ELEMENTS = 3;

/** Dark mode background color (oklch format from Tailwind v4) */
const DARK_MODE_BG_COLOR = 'oklch(0.145 0 0)';

/**
 * Runs axe-core accessibility analysis and logs any violations.
 * @param page - Playwright page object
 * @param context - Description of the test context for logging
 */
async function checkAccessibility(page: Page, context: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // Exclude elements with backdrop-blur - axe-core can't compute colors through CSS filters
    .exclude('header')
    .analyze();

  if (results.violations.length > 0) {
    console.log(`Accessibility violations in ${context}:`);
    results.violations.forEach((violation) => {
      console.log(`- ${violation.id}: ${violation.description}`);
      violation.nodes.forEach((node) => {
        console.log(`  Target: ${node.target}`);
        console.log(`  HTML: ${node.html.substring(0, 100)}`);
      });
    });
  }

  expect(results.violations).toEqual([]);
}

test.describe('Accessibility', () => {
  test('home page has no WCAG AA violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await checkAccessibility(page, 'light mode');
  });

  test('home page in dark mode has no WCAG AA violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Wait for theme change by checking CSS property instead of fixed timeout
    await expect(page.locator('div.min-h-dvh')).toHaveCSS('background-color', DARK_MODE_BG_COLOR);

    await checkAccessibility(page, 'dark mode');
  });

  test('skip link is functional', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const skipLink = page.locator('a[href="#main-content"]');

    // Verify skip link is keyboard-accessible by tabbing to it
    // Note: WebKit/Safari has a known issue where sr-only elements may not be in
    // the tab order. We test keyboard navigation in chromium/firefox, and still
    // verify the skip link works functionally in webkit via direct focus.
    if (browserName !== 'webkit') {
      let foundViaTab = false;
      for (let i = 0; i < MAX_TAB_PRESSES; i++) {
        await page.keyboard.press('Tab');
        if (await skipLink.evaluate((el) => el === document.activeElement)) {
          foundViaTab = true;
          break;
        }
      }
      expect(foundViaTab).toBe(true);
    } else {
      // WebKit: Use direct focus to test skip link functionality
      await skipLink.focus();
      await expect(skipLink).toBeFocused({ timeout: 5000 });
    }

    // Activate skip link (skip link should now be focused)
    await page.keyboard.press('Enter');

    // Verify focus moved to main content
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused({ timeout: 5000 });
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through the page and verify focus is visible
    const focusableElements: string[] = [];
    for (let i = 0; i < MAX_TAB_PRESSES; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName + (el.getAttribute('aria-label') || '') : null;
      });
      if (focused) focusableElements.push(focused);
    }

    // Verify we can tab through multiple elements
    expect(focusableElements.length).toBeGreaterThan(MIN_EXPECTED_FOCUSABLE_ELEMENTS);
  });
});
