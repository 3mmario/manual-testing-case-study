/**
 * Builds the test-case deliverables (CSV, Markdown, XLSX), the traceability matrix and the
 * test summary report from scripts/cases.js + test-cases/results.json + bug-reports/*.json.
 * Usage: node scripts/build-docs.js   (run scripts/run-cases.js first)
 */
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { ROOT } = require('./lib');
const { cases } = require('./cases');

const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const { runDate, results } = read('test-cases/results.json');
const reqs = read('test-cases/requirements.json');
const bugs = read('bug-reports/bugs.json');
const findings = read('bug-reports/findings.json');

const rows = cases.map((c) => ({
  'TC ID': c.id, Category: c.category, Requirement: c.req, Scenario: c.scenario, 'Pre-conditions': c.pre,
  Steps: c.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'), 'Test Data': c.data, Expected: c.expected,
  Actual: results[c.id].actual, Status: results[c.id].status, Priority: c.priority,
}));
const cols = Object.keys(rows[0]);
const write = (rel, text) => { fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true }); fs.writeFileSync(path.join(ROOT, rel), text); };
const count = (arr, f) => arr.reduce((m, x) => ((m[f(x)] = (m[f(x)] || 0) + 1), m), {});
const md = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, '<br>');

// ---- CSV ----
const csv = (v) => `"${String(v).replace(/"/g, '""')}"`;
write('test-cases/test-cases.csv', [cols.map(csv).join(','), ...rows.map((r) => cols.map((c) => csv(r[c])).join(','))].join('\n') + '\n');

// ---- Markdown ----
const bugOf = (a) => (a.match(/(BUG-\d+|F-\d+)/) || [''])[0];
let tcMd = `# Test cases\n\nExecuted ${runDate} against https://www.saucedemo.com with \`scripts/run-cases.js\` (Playwright, Chromium). Actual and Status come from that run; evidence is in [\`docs/evidence/cases/\`](../docs/evidence/cases/). Machine-readable copies: [CSV](test-cases.csv), [XLSX](test-cases.xlsx).\n\nOrder: happy path, business rules, negative / edge.\n`;
for (const cat of ['Happy path', 'Business rules', 'Negative / edge']) {
  tcMd += `\n## ${cat}\n\n| TC ID | Req | Scenario | Pre-conditions | Steps | Test data | Expected | Actual | Status | Priority |\n|---|---|---|---|---|---|---|---|---|---|\n`;
  for (const r of rows.filter((x) => x.Category === cat)) {
    tcMd += `| ${r['TC ID']} | ${r.Requirement} | ${md(r.Scenario)} | ${md(r['Pre-conditions'])} | ${md(r.Steps)} | ${md(r['Test Data'])} | ${md(r.Expected)} | ${md(r.Actual)} | ${r.Status === 'Pass' ? 'PASS' : '**FAIL**'} | ${r.Priority} |\n`;
  }
}
write('test-cases/test-cases.md', tcMd);

// ---- Traceability matrix ----
let rtm = `# Requirements traceability matrix\n\nThe site has no written specification, so the requirements below are **derived from observed behaviour and normal e-commerce expectations** (R-12 is an assumed target). Every requirement has at least one test case; every test case traces to a requirement.\n\n| Req | Area | Requirement | Test cases | Result | Defects / findings |\n|---|---|---|---|---|---|\n`;
for (const r of reqs) {
  const tcs = cases.filter((c) => c.req === r.id);
  const fails = tcs.filter((c) => results[c.id].status === 'Fail');
  const refs = [...new Set(fails.map((c) => bugOf(results[c.id].actual)).filter(Boolean))];
  rtm += `| ${r.id} | ${r.area} | ${r.text} | ${tcs.map((c) => c.id).join(', ')} | ${tcs.length - fails.length}/${tcs.length} pass | ${refs.length ? refs.map((x) => (x.startsWith('BUG') ? `[${x}](../bug-reports/${x}.md)` : x)).join(', ') : '-'} |\n`;
}
rtm += `\nFindings (F-xx) are described in [bug-reports/README.md](../bug-reports/README.md#additional-findings-not-filed-as-defects).\n`;
write('docs/04-traceability-matrix.md', rtm);

// ---- Test summary report ----
const total = rows.length; const passed = rows.filter((r) => r.Status === 'Pass').length; const failed = total - passed;
const byCat = count(rows, (r) => r.Category);
const failedByCat = count(rows.filter((r) => r.Status === 'Fail'), (r) => r.Category);
const sev = count(bugs, (b) => b.severity);
const failedStd = rows.filter((r) => r.Status === 'Fail' && !/problem_user|error_user|visual_user|performance_glitch_user/.test(r.Scenario + r['Test Data']));
let sum = `# Test summary report\n\n**Product under test:** https://www.saucedemo.com (public Sauce Labs demo shop)  \n**Execution date:** ${runDate}  \n**Execution:** \`scripts/run-cases.js\`, Chromium, 1280x900, fresh browser context per case  \n**Tester:** Ammar Alkhatib\n\n## Results\n\n| Metric | Value |\n|---|---|\n| Test cases designed and executed | ${total} |\n| Passed | ${passed} |\n| Failed | ${failed} |\n| Blocked / not run | 0 |\n| Pass rate | ${Math.round((passed / total) * 100)}% |\n| Defects filed | ${bugs.length} |\n| Additional findings (not filed) | ${findings.length} |\n\n| Category | Executed | Failed |\n|---|---|---|\n${Object.keys(byCat).map((k) => `| ${k} | ${byCat[k]} | ${failedByCat[k] || 0} |`).join('\n')}\n\n## Defects by severity\n\n| Severity | Count | IDs |\n|---|---|---|\n${['Critical', 'Major', 'Minor'].map((s) => `| ${s} | ${sev[s] || 0} | ${bugs.filter((b) => b.severity === s).map((b) => `[${b.id}](../bug-reports/${b.id}.md)`).join(', ') || '-'} |`).join('\n')}\n\n| ID | Title | Severity | Priority |\n|---|---|---|---|\n${bugs.map((b) => `| [${b.id}](../bug-reports/${b.id}.md) | ${b.title} | ${b.severity} | ${b.priority} |`).join('\n')}\n\n## Interpretation\n\n- The core path for **standard_user** (login, catalogue, sort, cart, checkout, totals, logout) passed. The ${failedStd.length} failed standard_user cases (${failedStd.map((r) => r['TC ID']).join(', ')}) are validation gaps, not broken flows: see findings F-01, F-02 and F-04.\n- All ${bugs.length} defects belong to the intentionally faulty profiles (\`problem_user\`, \`error_user\`, \`visual_user\`, \`performance_glitch_user\`). They are expected by the site's design; they are reported here as if they were production defects to demonstrate the reporting process.\n- Three defects are **Critical** because they stop a purchase (BUG-03, BUG-05) or show wrong prices (BUG-06).\n- Each filed defect is re-checked by \`scripts/verify-bugs.js\` on every push (see CI), so reproducibility is proven, not claimed.\n\n## Coverage against requirements\n\nSee the [traceability matrix](04-traceability-matrix.md): ${reqs.length} requirements, all with at least one test case. Coverage is of *these derived requirements only*. Not covered: other browsers and mobile viewports, accessibility, the server-side behaviour (the site is a client-side demo), and load testing.\n\n## Exit-criteria check (from the [test plan](01-test-plan.md))\n\n| Criterion | Met? |\n|---|---|\n| All planned cases executed | Yes (${total}/${total}) |\n| No open Critical defect on the standard path | Yes, none found on standard_user |\n| Every failure traced to a defect or finding | Yes |\n| Evidence stored for every case | Yes, [docs/evidence/cases/](evidence/cases/) |\n\n## Recommendation\n\n**Release the standard_user experience; do not release for the other four profiles until the Critical defects are fixed.** If the faulty profiles stand for real customer segments (for example a browser, a locale or an account type), BUG-03, BUG-05 and BUG-06 are release blockers: customers either cannot pay or see wrong prices. Fix order: BUG-03 and BUG-05 (checkout), BUG-06 (prices), BUG-04 and BUG-01 (cart and images), then BUG-02, BUG-08, BUG-07. Ask the product owner to decide F-01 and F-02 (empty-cart checkout, whitespace names), which are cheap to fix.\n\n## Limitations and honesty notes\n\n- One run, one browser. The failing results were reproduced in at least two runs; the performance timing varies (observed roughly 5 to 7 seconds) and visual_user prices are random on each login.\n- The 2 second login target and the 8% tax rate are assumptions taken from observed behaviour, not from a specification.\n`;
write('docs/06-test-summary-report.md', sum);

// ---- XLSX ----
(async () => {
  const wb = new ExcelJS.Workbook(); wb.creator = 'Ammar Alkhatib';
  const ws = wb.addWorksheet('Test cases', { views: [{ state: 'frozen', ySplit: 1 }] });
  const widths = [9, 15, 11, 38, 30, 48, 34, 44, 52, 9, 10];
  ws.columns = cols.map((c, i) => ({ header: c, key: c, width: widths[i] }));
  rows.forEach((r) => ws.addRow(r));
  ws.getRow(1).eachCell((c) => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3A5F' } }; c.alignment = { vertical: 'middle' }; });
  ws.eachRow((row, n) => {
    row.alignment = { vertical: 'top', wrapText: true };
    if (n > 1) {
      const s = row.getCell('Status'); const pass = s.value === 'Pass';
      s.font = { bold: true, color: { argb: pass ? 'FF166534' : 'FF991B1B' } };
      s.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pass ? 'FFDCFCE7' : 'FFFEE2E2' } };
    }
  });
  ws.autoFilter = { from: 'A1', to: { row: 1, column: cols.length } };
  await wb.xlsx.writeFile(path.join(ROOT, 'test-cases', 'test-cases.xlsx'));
  console.log(`Built docs for ${total} cases (${passed} pass, ${failed} fail)`);
})();
