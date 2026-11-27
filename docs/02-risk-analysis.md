# Risk-based analysis

The goal is to decide where to test first and how deeply. Each product area is scored for **likelihood of failure** and **impact if it fails**, both 1 (low) to 3 (high). The product is the risk score, which maps to a test priority.

## Scoring

| Score | Likelihood (will it break?) | Impact (what does it cost?) |
|---|---|---|
| 1 | Simple, stable, standard component | Cosmetic or easy workaround |
| 2 | Some logic or state | Feature degraded, user can continue another way |
| 3 | Complex logic, many states or known faulty profiles | User cannot buy, or money / security is wrong |

| Risk score (L x I) | Test priority | Test depth |
|---|---|---|
| 8 to 9 | Critical | Happy path, business rules, negative and edge cases, run first |
| 6 | High | Happy path and main negative cases |
| 3 to 4 | Medium | Happy path plus one negative case |
| 1 to 2 | Low | One check or exploratory only |

## Risk register

| # | Area | Risk | L | I | Score | Priority | Requirement | Test cases |
|---|---|---|---|---|---|---|---|---|
| 1 | Checkout form | Valid customer cannot enter details or the form accepts bad data | 3 | 3 | 9 | Critical | R-08 | TC-015, TC-025 to TC-032, TC-035 |
| 2 | Order completion | Order cannot be placed or no confirmation | 3 | 3 | 9 | Critical | R-10 | TC-008, TC-037 |
| 3 | Totals and tax | Wrong money shown to the customer | 2 | 3 | 6 | High | R-09 | TC-010 |
| 4 | Prices across profiles | Different users see different prices | 3 | 3 | 9 | Critical | R-13 | TC-038 |
| 5 | Cart | Wrong contents, cannot add or remove | 3 | 3 | 9 | Critical | R-07, R-11 | TC-006, TC-007, TC-011 to TC-013, TC-036 |
| 6 | Login and access control | Valid users blocked, invalid users let in | 2 | 3 | 6 | High | R-01, R-02, R-03 | TC-001, TC-009, TC-014, TC-016 to TC-024 |
| 7 | Catalogue content | Wrong images or details shown | 3 | 2 | 6 | High | R-04, R-06 | TC-002, TC-005, TC-033, TC-041 |
| 8 | Sorting | Sort does nothing or sorts wrongly | 3 | 2 | 6 | High | R-05 | TC-003, TC-004, TC-034 |
| 9 | Login speed | Slow login drives users away | 2 | 2 | 4 | Medium | R-12 | TC-040 |
| 10 | Layout | Misaligned elements | 2 | 1 | 2 | Low | R-13 | TC-039 |

## Risk matrix

Rows are likelihood, columns are impact. Numbers refer to the register above.

| Likelihood \ Impact | 1 Low | 2 Medium | 3 High |
|---|---|---|---|
| **3 High** | | 7, 8 (score 6, High) | 1, 2, 4, 5 (score 9, Critical) |
| **2 Medium** | 10 (score 2, Low) | 9 (score 4, Medium) | 3, 6 (score 6, High) |
| **1 Low** | | | |

## How the analysis was used

- Critical areas (checkout, order completion, prices, cart) have the most cases and cover all three groups: happy path, business rules, negative and edge.
- The likelihood for the cart, checkout and catalogue is scored high because three of the five special user profiles exist precisely to break them. This is product knowledge, not a guess.
- Layout and login speed have one case each. A single misaligned button does not justify a long case list.
- After execution the scores were checked against results: the three Critical defects (BUG-03, BUG-05, BUG-06) all sit in areas scored 9, and the one Minor defect (BUG-07) in the area scored 2. The ranking held.
