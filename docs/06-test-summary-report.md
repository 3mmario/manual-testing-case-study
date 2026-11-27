# Test summary report

**Product under test:** https://www.saucedemo.com (public Sauce Labs demo shop)  
**Execution date:** 2026-11-27  
**Execution:** `scripts/run-cases.js`, Chromium, 1280x900, fresh browser context per case  
**Tester:** Ammar Alkhatib

## Results

| Metric | Value |
|---|---|
| Test cases designed and executed | 41 |
| Passed | 29 |
| Failed | 12 |
| Blocked / not run | 0 |
| Pass rate | 71% |
| Defects filed | 8 |
| Additional findings (not filed) | 4 |

| Category | Executed | Failed |
|---|---|---|
| Happy path | 9 | 0 |
| Business rules | 7 | 2 |
| Negative / edge | 25 | 10 |

## Defects by severity

| Severity | Count | IDs |
|---|---|---|
| Critical | 3 | [BUG-03](../bug-reports/BUG-03.md), [BUG-05](../bug-reports/BUG-05.md), [BUG-06](../bug-reports/BUG-06.md) |
| Major | 4 | [BUG-01](../bug-reports/BUG-01.md), [BUG-02](../bug-reports/BUG-02.md), [BUG-04](../bug-reports/BUG-04.md), [BUG-08](../bug-reports/BUG-08.md) |
| Minor | 1 | [BUG-07](../bug-reports/BUG-07.md) |

| ID | Title | Severity | Priority |
|---|---|---|---|
| [BUG-01](../bug-reports/BUG-01.md) | problem_user: all six products show the same placeholder image | Major | High |
| [BUG-02](../bug-reports/BUG-02.md) | problem_user: sort dropdown has no effect on the product list | Major | Medium |
| [BUG-03](../bug-reports/BUG-03.md) | problem_user: Last Name field does not accept input, checkout is blocked | Critical | High |
| [BUG-04](../bug-reports/BUG-04.md) | problem_user: third Add to cart is ignored and Remove does nothing | Major | High |
| [BUG-05](../bug-reports/BUG-05.md) | error_user: order cannot be completed, Finish does nothing and Last Name is silently dropped | Critical | High |
| [BUG-06](../bug-reports/BUG-06.md) | visual_user: product prices differ from the catalogue and change on every login | Critical | High |
| [BUG-07](../bug-reports/BUG-07.md) | visual_user: Add to cart button of the last product is misaligned | Minor | Low |
| [BUG-08](../bug-reports/BUG-08.md) | performance_glitch_user: login takes about 5 to 7 seconds | Major | Medium |

## Interpretation

- The core path for **standard_user** (login, catalogue, sort, cart, checkout, totals, logout) passed. The 3 failed standard_user cases (TC-013, TC-015, TC-030) are validation gaps, not broken flows: see findings F-01, F-02 and F-04.
- All 8 defects belong to the intentionally faulty profiles (`problem_user`, `error_user`, `visual_user`, `performance_glitch_user`). They are expected by the site's design; they are reported here as if they were production defects to demonstrate the reporting process.
- Three defects are **Critical** because they stop a purchase (BUG-03, BUG-05) or show wrong prices (BUG-06).
- Each filed defect is re-checked by `scripts/verify-bugs.js` on every push (see CI), so reproducibility is proven, not claimed.

## Coverage against requirements

See the [traceability matrix](04-traceability-matrix.md): 13 requirements, all with at least one test case. Coverage is of *these derived requirements only*. Not covered: other browsers and mobile viewports, accessibility, the server-side behaviour (the site is a client-side demo), and load testing.

## Exit-criteria check (from the [test plan](01-test-plan.md))

| Criterion | Met? |
|---|---|
| All planned cases executed | Yes (41/41) |
| No open Critical defect on the standard path | Yes, none found on standard_user |
| Every failure traced to a defect or finding | Yes |
| Evidence stored for every case | Yes, [docs/evidence/cases/](evidence/cases/) |

## Recommendation

**Release the standard_user experience; do not release for the other four profiles until the Critical defects are fixed.** If the faulty profiles stand for real customer segments (for example a browser, a locale or an account type), BUG-03, BUG-05 and BUG-06 are release blockers: customers either cannot pay or see wrong prices. Fix order: BUG-03 and BUG-05 (checkout), BUG-06 (prices), BUG-04 and BUG-01 (cart and images), then BUG-02, BUG-08, BUG-07. Ask the product owner to decide F-01 and F-02 (empty-cart checkout, whitespace names), which are cheap to fix.

## Limitations and honesty notes

- One run, one browser. The failing results were reproduced in at least two runs; the performance timing varies (observed roughly 5 to 7 seconds) and visual_user prices are random on each login.
- The 2 second login target and the 8% tax rate are assumptions taken from observed behaviour, not from a specification.
