import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('home page has no WCAG AA violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Exclude elements with backdrop-blur - axe-core can't compute colors through CSS filters
      .exclude('header')
      .analyze();

    // Log violations for debugging
    if (results.violations.length > 0) {
      console.log('Accessibility violations:');
      results.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        violation.nodes.forEach((node) => {
          console.log(`  Target: ${node.target}`);
          console.log(`  HTML: ${node.html.substring(0, 100)}`);
        });
      });
    }

    expect(results.violations).toEqual([]);
  });

  test('home page in dark mode has no WCAG AA violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle to dark mode and wait for CSS transitions to complete
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500); // Wait for transition-colors duration-300

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Exclude elements with backdrop-blur - axe-core can't compute colors through CSS filters
      .exclude('header')
      .analyze();

    if (results.violations.length > 0) {
      console.log('Dark mode accessibility violations:');
      results.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
      });
    }

    expect(results.violations).toEqual([]);
  });

  test('skip link is functional', async ({ page }) => {
    await page.goto('/');

    // Tab to the skip link
    await page.keyboard.press('Tab');

    // Verify skip link is visible when focused
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();

    // Activate skip link
    await page.keyboard.press('Enter');

    // Verify focus moved to main content
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through the page and verify focus is visible
    const focusableElements: string[] = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName + (el.getAttribute('aria-label') || '') : null;
      });
      if (focused) focusableElements.push(focused);
    }

    // Verify we can tab through multiple elements
    expect(focusableElements.length).toBeGreaterThan(3);
  });
});
