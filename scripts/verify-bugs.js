/**
 * Reproduces every reported defect/finding and saves an annotated evidence screenshot to docs/evidence/.
 * Each check asserts that the defect is STILL present, so a green run proves the bug report is reproducible
 * (and a red run means the site changed and the report needs a retest).
 * Usage: node scripts/verify-bugs.js [--headed]
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const L = require('./lib');

const imgs = (p) => p.$$eval('.inventory_item_img img', (e) => e.map((i) => i.getAttribute('src')));

const checks = {
  'BUG-01': async (b) => {
    const p = await L.login(b, 'problem_user'); const d = new Set(await imgs(p));
    await L.shot(p, 'BUG-01.png', '.inventory_item_img img');
    return [d.size === 1, `${d.size} distinct image across 6 products`];
  },
  'BUG-02': async (b) => {
    const p = await L.login(b, 'problem_user'); await p.selectOption('.product_sort_container', 'za');
    const first = (await L.names(p))[0]; await L.shot(p, 'BUG-02.png', '.product_sort_container, .inventory_item:first-child .inventory_item_name');
    return [first === 'Sauce Labs Backpack', `Name (Z to A) selected, first product still "${first}"`];
  },
  'BUG-03': async (b) => {
    const p = await L.login(b, 'problem_user'); await p.click('[data-test="add-to-cart-sauce-labs-backpack"]'); await L.startCheckout(p);
    await L.fillCheckout(p, 'Ammar', 'Tester', '11181'); const v = await p.inputValue('#last-name'); await p.click('#continue');
    await p.waitForSelector('[data-test="error"]');
    await L.shot(p, 'BUG-03.png', '#last-name, [data-test="error"]');
    return [v === '', `Last name field value after typing "Tester": "${v}"`];
  },
  'BUG-04': async (b) => {
    const p = await L.login(b, 'problem_user'); await p.$$('[data-test^="add-to-cart"]').then(async (x) => { for (const e of x.slice(0, 3)) await e.click(); });
    const added = await L.badge(p); await p.click('[data-test="remove-sauce-labs-backpack"]'); const afterRemove = await L.badge(p);
    await L.shot(p, 'BUG-04.png', '.shopping_cart_badge, [data-test="add-to-cart-sauce-labs-bolt-t-shirt"]');
    return [added === '2' && afterRemove === '2', `Clicked Add on 3 products, badge ${added}; clicked Remove, badge ${afterRemove}`];
  },
  'BUG-05': async (b) => {
    const p = await L.login(b, 'error_user'); await p.click('[data-test="add-to-cart-sauce-labs-backpack"]'); await L.startCheckout(p);
    await L.fillCheckout(p, 'Ammar', 'Tester', '11181'); await p.click('#continue'); await p.waitForURL(/step-two/);
    await p.click('#finish'); await p.waitForTimeout(1500);
    await L.shot(p, 'BUG-05.png', '#finish');
    const stuck = /step-two/.test(p.url());
    return [stuck, `After Finish the URL is still ${p.url().replace(L.BASE, '')}`];
  },
  'BUG-06': async (b) => {
    const s = await L.login(b, 'standard_user'); const p = await L.login(b, 'visual_user');
    const sp = await L.prices(s); const vp = await L.prices(p);
    await L.shot(p, 'BUG-06.png', '.inventory_item_price');
    return [JSON.stringify(sp) !== JSON.stringify(vp), `standard ${sp.join(' ')} | visual ${vp.join(' ')}`];
  },
  'BUG-07': async (b) => {
    const p = await L.login(b, 'visual_user');
    const x = await p.$$eval('[data-test^="add-to-cart"]', (e) => e.map((i) => Math.round(i.getBoundingClientRect().x)));
    await L.shot(p, 'BUG-07.png', '[data-test="add-to-cart-test.allthethings()-t-shirt-(red)"]');
    return [x[5] !== x[3], `Add to cart x-position: tile 4 = ${x[3]}px, tile 6 = ${x[5]}px`];
  },
  'BUG-08': async (b) => {
    const p = await L.openSite(b); await p.fill('#user-name', 'performance_glitch_user'); await p.fill('#password', L.PASSWORD);
    const t0 = Date.now(); await p.click('#login-button', { noWaitAfter: true });
    await p.waitForTimeout(1500); const listShown = await p.locator('.inventory_list').count();
    await L.shot(p, 'BUG-08.png');
    await p.waitForSelector('.inventory_list', { timeout: 30000 }); const ms = Date.now() - t0;
    return [listShown === 0 && ms > 2000, `1.5 s after clicking Login the products page is still empty; product list appeared after ${ms} ms`];
  },
  'F-01': async (b) => {
    const p = await L.login(b, 'standard_user'); await L.openCart(p); await p.click('[data-test="checkout"]');
    await L.fillCheckout(p, 'Ammar', 'Tester', '11181'); await p.click('#continue'); await p.waitForURL(/step-two/);
    await L.shot(p, 'F-01.png', '.cart_list');
    return [true, 'Overview reached with an empty cart'];
  },
  'F-02': async (b) => {
    const p = await L.login(b, 'standard_user'); await p.click('[data-test="add-to-cart-sauce-labs-backpack"]'); await L.startCheckout(p);
    await L.fillCheckout(p, '   ', 'Tester', '11181'); await p.click('#continue'); await p.waitForURL(/step-two/);
    await L.shot(p, 'F-02.png', '.summary_info');
    return [true, 'Blank first name accepted'];
  },
  'F-03': async (b) => {
    const p = await L.login(b, 'problem_user'); await p.click('text=Sauce Labs Backpack'); await p.waitForSelector('.inventory_details_name');
    const n = await p.textContent('.inventory_details_name'); await L.shot(p, 'F-03.png', '.inventory_details_name');
    return [n !== 'Sauce Labs Backpack', `Opened "${n}"`];
  },
  'F-04': async (b) => {
    const p = await L.login(b, 'standard_user'); await p.$$('[data-test^="add-to-cart"]').then(async (x) => { for (const e of x.slice(0, 2)) await e.click(); });
    await p.click('#react-burger-menu-btn'); await p.click('#reset_sidebar_link'); await p.click('#react-burger-menu-close-btn').catch(() => {}); await p.waitForTimeout(400);
    const rm = await p.locator('[data-test^="remove"]').count(); const bd = await L.badge(p);
    await L.shot(p, 'F-04.png', '[data-test^="remove"]');
    return [bd === '' && rm > 0, `Badge cleared but ${rm} button(s) still show Remove`];
  },
};

(async () => {
  const browser = await chromium.launch({ headless: !process.argv.includes('--headed') });
  const out = {}; let failed = 0;
  for (const [id, fn] of Object.entries(checks)) {
    let ctx;
    try {
      const [reproduced, detail] = await fn({ newContext: (o) => (ctx = browser.newContext(o)) && ctx, ...bindBrowser(browser) });
      out[id] = { reproduced, detail };
    } catch (e) { out[id] = { reproduced: false, detail: `Script error: ${e.message.split('\n')[0]}` }; }
    if (!out[id].reproduced) failed++;
    console.log(`${id} ${out[id].reproduced ? 'REPRODUCED' : 'NOT REPRODUCED'}  ${out[id].detail}`);
  }
  await browser.close();
  fs.writeFileSync(path.join(L.EVIDENCE, 'verification.json'), JSON.stringify(out, null, 2));
  if (failed) { console.error(`${failed} defect(s) not reproduced`); process.exit(1); }
})();

function bindBrowser(browser) { return { newContext: (o) => browser.newContext(o) }; }




