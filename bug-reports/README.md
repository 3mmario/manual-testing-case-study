# Bug reports

8 defects, all reproduced against https://www.saucedemo.com on 2026-11-27. They come from the site's intentionally faulty user profiles and are written up as if they were production defects.

**Severity** is the technical and business impact (Critical = blocks a purchase or shows wrong money, Major = main feature broken with no workaround, Minor = cosmetic). **Priority** is how soon to fix it.

| ID | Title | Profile | Severity | Priority |
|---|---|---|---|---|
| [BUG-03](BUG-03.md) | problem_user: Last Name field does not accept input, checkout is blocked | `problem_user` | Critical | High |
| [BUG-05](BUG-05.md) | error_user: order cannot be completed, Finish does nothing and Last Name is silently dropped | `error_user` | Critical | High |
| [BUG-06](BUG-06.md) | visual_user: product prices differ from the catalogue and change on every login | `visual_user` | Critical | High |
| [BUG-01](BUG-01.md) | problem_user: all six products show the same placeholder image | `problem_user` | Major | High |
| [BUG-02](BUG-02.md) | problem_user: sort dropdown has no effect on the product list | `problem_user` | Major | Medium |
| [BUG-04](BUG-04.md) | problem_user: third Add to cart is ignored and Remove does nothing | `problem_user` | Major | High |
| [BUG-08](BUG-08.md) | performance_glitch_user: login takes about 5 to 7 seconds | `performance_glitch_user` | Major | Medium |
| [BUG-07](BUG-07.md) | visual_user: Add to cart button of the last product is misaligned | `visual_user` | Minor | Low |

## Template

Every report uses the same layout: header table (severity, priority, status, environment, profile, test case), steps to reproduce, expected result, actual result, impact, evidence screenshot with the defect outlined in red, notes.

## Additional findings (not filed as defects)

These failed a test case but are requirement gaps or low-impact quirks that need a decision first. Screenshots are in [docs/evidence/](../docs/evidence/).

| ID | Profile | Test case | Finding | Why not filed |
|---|---|---|---|---|
| F-01 | `standard_user` | TC-015 | Checkout can be started and completed to the overview with an empty cart ([screenshot](../docs/evidence/F-01.png)) | Not filed as a defect: no written requirement says an empty cart must block checkout. Common e-commerce expectation; needs a product-owner decision. |
| F-02 | `standard_user` | TC-030 | Whitespace-only first name passes checkout validation ([screenshot](../docs/evidence/F-02.png)) | Not filed as a defect: validation rules are not specified. Recommended: trim input before the required-field check. |
| F-03 | `problem_user` | TC-041 | Clicking Sauce Labs Backpack opens the Sauce Labs Fleece Jacket detail page ([screenshot](../docs/evidence/F-03.png)) | Same root-cause family as the other problem_user defects (product-specific behaviour is broken). Kept as a finding to stay within the 8 reports; would be a Major defect in a real project. |
| F-04 | `standard_user` | TC-013 | Reset App State clears the badge but leaves Remove buttons on the product page until reload ([screenshot](../docs/evidence/F-04.png)) | Minor UI-state inconsistency. Not filed: the demo app documents Reset App State as a tester helper, not a customer feature. |
