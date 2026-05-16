import {
  test as base,
  chromium,
  expect,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import { existsSync, readFileSync } from 'fs';
import { createServer } from 'http';
import path from 'path';

const extensionPath = path.resolve(__dirname, '../../dist-chrome');
const fixturePath = path.resolve(__dirname, 'fixtures/test-page.html');

if (!existsSync(extensionPath)) {
  throw new Error(
    `Chrome extension not found at ${extensionPath}. Run "npm run build:chrome" first.`,
  );
}

/**
 * Custom Playwright fixture that launches Chromium with the hyper-link
 * extension loaded. The browser context is shared across tests in a worker
 * (for speed), while each test gets a fresh page.
 */
const test = base.extend<
  { page: Page },
  { extensionContext: BrowserContext; fixtureUrl: string }
>({
  extensionContext: [
    async ({}, use) => {
      const ctx = await chromium.launchPersistentContext('', {
        headless: false,
        args: [
          '--headless=new',
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
        ],
      });
      await use(ctx);
      await ctx.close();
    },
    { scope: 'worker' },
  ],
  fixtureUrl: [
    async ({ }, use) => {
      const html = readFileSync(fixturePath, 'utf-8');
      const server = createServer((_req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      });
      await new Promise<void>((resolve) => server.listen(0, resolve));
      const addr = server.address();
      const url = `http://localhost:${typeof addr === 'object' && addr ? addr.port : 0}`;
      await use(url);
      server.close();
    },
    { scope: 'worker' },
  ],
  page: async ({ extensionContext }, use) => {
    const page = await extensionContext.newPage();
    await use(page);
    await page.close();
  },
});

/**
 * Activate the overlay by pressing the trigger key ('/').
 * Retries to handle the content script loading delay.
 */
async function activateOverlay(page: Page): Promise<void> {
  const overlay = page.locator('#hyper-link-overlay');
  await expect(async () => {
    await page.keyboard.press('/');
    await expect(overlay).toBeAttached({ timeout: 500 });
  }).toPass({ timeout: 5000 });
}

test.describe('hyper-link extension', () => {
  test('trigger key shows overlay with labels for each link', async ({
    page,
    fixtureUrl,
  }) => {
    await page.goto(fixtureUrl);
    await activateOverlay(page);

    const overlay = page.locator('#hyper-link-overlay');
    // Sequential labels for 5 links: a, b, c, d, e
    for (const label of ['a', 'b', 'c', 'd', 'e']) {
      await expect(
        overlay.getByText(label, { exact: true }),
      ).toBeVisible();
    }
  });

  test('Escape dismisses the overlay', async ({ page, fixtureUrl }) => {
    await page.goto(fixtureUrl);
    await activateOverlay(page);

    await page.keyboard.press('Escape');
    await expect(
      page.locator('#hyper-link-overlay'),
    ).not.toBeAttached();
  });

  test('typing a label follows the corresponding link', async ({
    page,
    fixtureUrl,
  }) => {
    await page.goto(fixtureUrl);
    await activateOverlay(page);

    // Label 'a' → first link (#link1)
    await page.keyboard.press('a');

    await expect(page).toHaveURL(/.*#link1$/);
    await expect(
      page.locator('#hyper-link-overlay'),
    ).not.toBeAttached();
  });

  test('different label follows a different link', async ({
    page,
    fixtureUrl,
  }) => {
    await page.goto(fixtureUrl);
    await activateOverlay(page);

    // Label 'c' → third link (#link3)
    await page.keyboard.press('c');

    await expect(page).toHaveURL(/.*#link3$/);
  });

  test('Backspace with no typed chars deactivates overlay', async ({
    page,
    fixtureUrl,
  }) => {
    await page.goto(fixtureUrl);
    await activateOverlay(page);

    await page.keyboard.press('Backspace');
    await expect(
      page.locator('#hyper-link-overlay'),
    ).not.toBeAttached();
  });

  test('trigger key does not activate when an input is focused', async ({
    page,
    fixtureUrl,
  }) => {
    await page.goto(fixtureUrl);

    // Verify extension is loaded by activating and dismissing first
    await activateOverlay(page);
    await page.keyboard.press('Escape');
    await expect(
      page.locator('#hyper-link-overlay'),
    ).not.toBeAttached();

    // Focus the text input and try trigger key
    await page.locator('#test-input').focus();
    await page.keyboard.press('/');

    await page.waitForTimeout(300);
    await expect(
      page.locator('#hyper-link-overlay'),
    ).not.toBeAttached();
  });
});
