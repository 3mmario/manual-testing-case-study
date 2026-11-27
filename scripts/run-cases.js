/**
 * Executes every test case against saucedemo.com, saves one evidence screenshot per case
 * and writes test-cases/results.json (the single source of truth for Actual / Status).
 * Usage: node scripts/run-cases.js [--headed]
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const L = require('./lib');
const { cases } = require('./cases');

(async () => {
  const browser = await chromium.launch({ headless: !process.argv.includes('--headed') });
  const results = {};
  for (const c of cases) {
    let r;
    try { r = await c.run(browser); } catch (e) { r = { pass: false, actual: `Script error: ${e.message.split('\n')[0]}`, page: null }; }
    let evidence = '';
    if (r.page) { evidence = await L.shot(r.page, `cases/${c.id}.png`); await r.page.context().close(); }
    results[c.id] = { actual: r.actual, status: r.pass ? 'Pass' : 'Fail', evidence };
    console.log(`${c.id} ${results[c.id].status.padEnd(4)} ${r.actual}`);
  }
  await browser.close();
  fs.mkdirSync(path.join(L.ROOT, 'test-cases'), { recursive: true });
  fs.writeFileSync(path.join(L.ROOT, 'test-cases', 'results.json'), JSON.stringify({ runDate: new Date().toISOString().slice(0, 10), results }, null, 2));
  const fails = Object.values(results).filter((x) => x.status === 'Fail').length;
  console.log(`\n${cases.length} executed: ${cases.length - fails} passed, ${fails} failed`);
})();
