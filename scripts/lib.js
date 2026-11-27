const fs = require('fs');
const path = require('path');

const BASE = 'https://www.saucedemo.com';
const PASSWORD = 'secret_sauce'; // public demo credential published on the site's login page
const ROOT = path.join(__dirname, '..');
const EVIDENCE = path.join(ROOT, 'docs', 'evidence');

/** Fresh isolated browser context with a login page; captures JS dialogs. */
async function openSite(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.dialogs = [];
  page.on('dialog', async (d) => { page.dialogs.push(d.message()); await d.dismiss(); });
  await page.goto(BASE);
  return page;
}

async function submitLogin(page, user, password = PASSWORD) {
  await page.fill('#user-name', user);
  await page.fill('#password', password);
  await page.click('#login-button');
}

/** Logs in and waits for the product list. Returns the elapsed login time in ms. */
async function login(browser, user) {
  const page = await openSite(browser);
  const t0 = Date.now();
  await submitLogin(page, user);
  await page.waitForSelector('.inventory_list', { timeout: 30000 });
  page.loginMs = Date.now() - t0;
  return page;
}

const names = (p) => p.$$eval('.inventory_item_name', (e) => e.map((i) => i.textContent));
const prices = (p) => p.$$eval('.inventory_item_price', (e) => e.map((i) => i.textContent));
const badge = (p) => p.locator('.shopping_cart_badge').textContent({ timeout: 1500 }).catch(() => '');
const num = (s) => parseFloat(String(s).replace(/[^0-9.]/g, ''));

async function openCart(page) {
  await page.click('.shopping_cart_link');
  await page.waitForSelector('.cart_list', { state: 'attached' });
}

async function fillCheckout(page, first, last, zip) {
  await page.fill('#first-name', first);
  await page.fill('#last-name', last);
  await page.fill('#postal-code', zip);
}

/** Goes cart -> checkout step one. */
async function startCheckout(page) {
  await openCart(page);
  await page.click('[data-test="checkout"]');
  await page.waitForURL(/checkout-step-one/);
}

async function shot(page, relPath, highlight) {
  const file = path.join(EVIDENCE, relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (highlight) {
    await page.evaluate((sel) => document.querySelectorAll(sel).forEach((e) => {
      e.style.outline = '3px solid #e11d48'; e.style.outlineOffset = '2px';
    }), highlight);
  }
  await page.screenshot({ path: file });
  return relPath.replace(/\\/g, '/');
}

module.exports = { PASSWORD, BASE, ROOT, EVIDENCE, openSite, submitLogin, login, names, prices, badge, num, openCart, fillCheckout, startCheckout, shot };

