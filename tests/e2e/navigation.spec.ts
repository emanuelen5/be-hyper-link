import { expect, test } from '@playwright/test';
import path from 'path';

const fixturePath = path.resolve(
  __dirname,
  'fixtures/test-page.html',
);
const fixtureUrl = `file://${fixturePath}`;

test.describe('hyper-link navigation', () => {
  test('fixture page loads with links', async ({ page }) => {
    await page.goto(fixtureUrl);
    const links = page.locator('a[href]');
    await expect(links).toHaveCount(5);
  });

  test('page title is correct', async ({ page }) => {
    await page.goto(fixtureUrl);
    await expect(page).toHaveTitle('hyper-link test page');
  });

  test('all links are visible', async ({ page }) => {
    await page.goto(fixtureUrl);
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`#link${i}`)).toBeVisible();
    }
  });

  test('links have correct text', async ({ page }) => {
    await page.goto(fixtureUrl);
    const expectedTexts = [
      'Link One',
      'Link Two',
      'Link Three',
      'Link Four',
      'Link Five',
    ];
    for (let i = 0; i < expectedTexts.length; i++) {
      const link = page.locator(`#link${i + 1}`);
      await expect(link).toHaveText(expectedTexts[i]);
    }
  });
});
