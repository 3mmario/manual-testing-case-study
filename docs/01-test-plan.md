# Test plan: Swag Labs web shop (saucedemo.com)

Structure follows ISTQB / ISO 29119-3 test plan content. No schedule is given on purpose: this is a one-person case study, and dates are in the [summary report](06-test-summary-report.md).

| | |
|---|---|
| **Test object** | https://www.saucedemo.com, a public demo shop by Sauce Labs made for testing practice |
| **Author** | Ammar Alkhatib |
| **Version** | 1.0 |

## 1. Introduction and objectives

The site has no written specification. The objectives are to:

1. Derive testable requirements from observed behaviour and normal e-commerce expectations ([traceability matrix](04-traceability-matrix.md)).
2. Show that the main purchase flow works for the standard user.
3. Find and report defects for the faulty user profiles with reproducible evidence.
4. Make every claim in the reports traceable to a real test run.

## 2. Scope

| In scope | Notes |
|---|---|
| Login for all six user types and the error messages | decision table in [test design](03-test-design.md) |
| Product list: names, prices, images, sorting | |
| Product detail page | |
| Cart: add, remove, badge, persistence | |
| Checkout: step one validation, overview totals, completion | equivalence partitioning and boundary values |
| Logout, session protection, Reset App State | |
| Visual consistency and login speed across profiles | basic checks only |

## 3. Out of scope

- Performance and load testing beyond a single-user login timing check.
- Security testing beyond basic injection input on the login form and direct URL access.
- Accessibility audit, localisation, cross-browser and real-device testing (Chromium desktop only; a 375 px viewport was checked once for overflow in exploratory testing).
- Payment: the site has no real payment step.
- The site's own source code and hosting; it is treated as a black box.

## 4. Test approach

| Level / type | How |
|---|---|
| Level | System-level, black-box functional testing through the UI (SIT style: end-to-end flows across login, catalogue, cart, checkout). |
| Prioritisation | Risk-based, see [risk analysis](02-risk-analysis.md). Critical-risk areas get happy path, business-rule and negative cases; low-risk areas get fewer. |
| Design techniques | Equivalence partitioning and boundary value analysis (checkout form), decision table (login), state transition testing (cart and checkout), plus error guessing from past experience. See [test design](03-test-design.md). |
| Experience-based | Two time-boxed exploratory sessions with charters: [exploratory testing](05-exploratory-testing.md). |
| Execution | Manual-style cases executed by a Playwright helper ([scripts/run-cases.js](../scripts/run-cases.js)) that drives the browser, records the actual result and takes an evidence screenshot per case. Evidence for defects is taken by [scripts/verify-bugs.js](../scripts/verify-bugs.js). |
| Test cases | Written before execution, kept minimal: no case that only repeats another one. 41 cases in [test-cases/](../test-cases/test-cases.md). |
| Defects | One report per defect with severity, priority, steps, expected vs actual, evidence ([bug-reports/](../bug-reports/README.md)). Failures that need a product decision are recorded as findings, not defects. |
| Regression | The two scripts are re-run on every push by CI, which proves the reported defects stay reproducible. |

## 5. Test environment

| Item | Value |
|---|---|
| Application | https://www.saucedemo.com (production demo build, no staging) |
| Browser | Chromium bundled with Playwright 1.65.1, headless in CI, 1280x900 viewport |
| OS | Windows 11 (local), Ubuntu (CI) |
| Network | Public internet; local runs through a corporate network |
| Test data | Public demo accounts: `standard_user`, `locked_out_user`, `problem_user`, `performance_glitch_user`, `error_user`, `visual_user`, password `secret_sauce`. Checkout data is synthetic. |
| Isolation | A fresh browser context (no shared cookies or storage) for every case |

## 6. Entry criteria

- The site is reachable and the login page renders.
- All six demo accounts can reach the login form.
- Test cases are written and linked to requirements.
- Node.js and Playwright Chromium are installed.

## 7. Exit criteria

- 100% of planned cases executed, with actual result and evidence stored.
- No open Critical defect on the standard-user path.
- Every failed case is traced to a defect or a finding.
- Summary report published with real counts.

Suspension: stop and re-plan if the site is unavailable or its behaviour changes in a way that invalidates the expected results.

## 8. Test deliverables

Test plan, risk analysis, test design, test cases (CSV, Markdown, XLSX), traceability matrix, evidence screenshots, bug reports, exploratory charters and notes, test summary report, CI workflow.

## 9. Risks to the test effort

| Risk | Mitigation |
|---|---|
| No specification, so "expected" is my interpretation | Requirements labelled as derived; ambiguous items go to findings, not defects |
| The demo site changes (faulty behaviour is intentional and may be updated) | CI re-verifies defects on every push; failures flag stale reports |
| Random behaviour (visual_user prices, timing noise) | Compare against standard_user instead of fixed values; use thresholds for timing |
| Single browser and single tester | Stated limitation; no coverage claim beyond Chromium |
| Public site availability and network speed | Generous timeouts; timing tests judged by order of magnitude |

## 10. Roles

Test lead, designer, executor and reporter: Ammar Alkhatib.
