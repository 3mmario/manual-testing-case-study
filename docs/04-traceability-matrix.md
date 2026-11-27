# Requirements traceability matrix

The site has no written specification, so the requirements below are **derived from observed behaviour and normal e-commerce expectations** (R-12 is an assumed target). Every requirement has at least one test case; every test case traces to a requirement.

| Req | Area | Requirement | Test cases | Result | Defects / findings |
|---|---|---|---|---|---|
| R-01 | Authentication | A valid user can log in and reaches the product list | TC-001 | 1/1 pass | - |
| R-02 | Authentication | Invalid, empty or locked-out credentials are rejected with a clear, non-revealing message | TC-016, TC-017, TC-018, TC-019, TC-020, TC-021, TC-022, TC-023, TC-024 | 9/9 pass | - |
| R-03 | Session | Protected pages require a session; logout ends it | TC-009, TC-014 | 2/2 pass | - |
| R-04 | Catalogue | Each product shows its own name, price and image | TC-002, TC-033 | 1/2 pass | [BUG-01](../bug-reports/BUG-01.md) |
| R-05 | Catalogue | Products can be sorted by name and by price in both directions | TC-003, TC-004, TC-034 | 2/3 pass | [BUG-02](../bug-reports/BUG-02.md) |
| R-06 | Catalogue | A product detail page shows the product that was selected | TC-005, TC-041 | 1/2 pass | F-03 |
| R-07 | Cart | Products can be added to and removed from the cart; the badge reflects the cart | TC-006, TC-007, TC-036 | 2/3 pass | [BUG-04](../bug-reports/BUG-04.md) |
| R-08 | Checkout | Checkout step one validates first name, last name and postal code, and cannot start with an empty cart | TC-015, TC-025, TC-026, TC-027, TC-028, TC-029, TC-030, TC-031, TC-032, TC-035 | 7/10 pass | F-01, F-02, [BUG-03](../bug-reports/BUG-03.md) |
| R-09 | Checkout | The overview shows correct item total, tax and grand total | TC-010 | 1/1 pass | - |
| R-10 | Checkout | A completed order shows a confirmation and clears the cart | TC-008, TC-037 | 1/2 pass | [BUG-05](../bug-reports/BUG-05.md) |
| R-11 | Cart / navigation | Cart state is kept across navigation; Cancel and Reset behave as labelled | TC-011, TC-012, TC-013 | 2/3 pass | F-04 |
| R-12 | Performance | Login completes within 2 seconds (assumed target; no SLA is published) | TC-040 | 0/1 pass | [BUG-08](../bug-reports/BUG-08.md) |
| R-13 | Visual consistency | Prices and layout are identical for every user profile | TC-038, TC-039 | 0/2 pass | [BUG-06](../bug-reports/BUG-06.md), [BUG-07](../bug-reports/BUG-07.md) |

Findings (F-xx) are described in [bug-reports/README.md](../bug-reports/README.md#additional-findings-not-filed-as-defects).
