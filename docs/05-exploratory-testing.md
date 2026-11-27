# Exploratory testing

Two time-boxed sessions, each with a charter in the form *Explore X with Y to discover Z*. Observations were made on 2026-11-27 with a throw-away Playwright probe script that drove the browser step by step; screenshots of the confirmed findings are in the evidence folder. Notes use the PROOF style: Past, Results, Obstacles, Outlook, Feelings.

## Session 1: state and navigation, standard_user

| | |
|---|---|
| **Charter** | Explore cart and checkout state **with** back button, reload, logout/login, direct URLs and rapid clicks **to discover** broken or inconsistent states that scripted cases miss |
| **Tester / date** | Ammar Alkhatib, 2026-11-27 |
| **Time box** | 30 minutes (charter time box; the scripted probing itself finished sooner) |
| **User** | `standard_user`, Chromium desktop |

### Notes

| Idea tried | Observation | Verdict |
|---|---|---|
| Add a product, reload the page | Badge still shows 1 | OK |
| Log out, log in again with the same user | Cart still contains the product (badge 1) | Question: cart survives logout. Probably client-side storage. On a shared computer the next user of the same browser would see it. Raise with the team; not filed |
| Finish an order, press browser Back | URL is `/checkout-step-two.html`, overview page with 0 items and a Finish button, cart is empty | Issue: a finished order's page can be reopened with an empty cart. Same root cause as [F-01](../bug-reports/README.md#additional-findings-not-filed-as-defects) |
| Open `/checkout-step-two.html` directly while logged in with an empty cart | Overview opens with 0 items | Same as above |
| Open `/inventory-item.html?id=99` | Friendly "ITEM NOT FOUND" message, page does not crash | OK |
| Double-click Add to cart | Second click toggles the item back out: badge empty | Expected for a toggle button. Worth knowing for automation, not a defect |
| Direct URL after the locked-out user's failed login | "You can only access '/inventory.html' when you are logged in" | OK, session protection works |
| Narrow viewport (375 px wide) on the product list | No horizontal scrolling | OK (one check only, mobile is out of scope) |
| Reset App State after adding two products | Badge cleared, but two buttons still say Remove until reload | Minor, recorded as [F-04](../bug-reports/README.md#additional-findings-not-filed-as-defects) |

### Results

- Bugs: none new that block a flow. Two findings (empty-cart checkout reachable from several routes, stale Remove buttons after reset).
- Questions for a product owner: should the cart survive logout? Should the overview be reachable without items?
- Next: add a check that the cart is cleared on logout if the answer is yes.

## Session 2: faulty profiles, behaviour beyond the checkout

| | |
|---|---|
| **Charter** | Explore `error_user`, `problem_user` and `visual_user` **with** cart, sort and detail pages **to discover** failures beyond the ones already covered by the checkout cases |
| **Tester / date** | Ammar Alkhatib, 2026-11-27 |
| **Time box** | 30 minutes (charter time box) |

### Notes

| Idea tried | Observation | Verdict |
|---|---|---|
| `error_user`: choose any sort option | Browser alert "Sorting is broken! This error has been reported to Backtrace."; list order unchanged | Defect, same family as BUG-02. Not filed separately: the alert text itself names the problem |
| `error_user`: add the fourth product (Fleece Jacket) on the list | Badge stays empty, item not added | Related to BUG-04 behaviour (some Add buttons do nothing) |
| `error_user`: add a product from its detail page | Badge shows 1, add works | Shows the defect is specific to the list page; useful for the developer |
| `error_user`: fill checkout | Last Name does not keep its value, no validation error, overview opens; Finish does nothing | Filed as [BUG-05](../bug-reports/BUG-05.md) |
| `problem_user`: click "Sauce Labs Backpack" | Opens the Fleece Jacket detail page | Finding [F-03](../bug-reports/README.md#additional-findings-not-filed-as-defects) |
| `problem_user`: last name typed during checkout | Text appears in the First Name field | Added to [BUG-03](../bug-reports/BUG-03.md) |
| `visual_user`: log in repeatedly | Prices differ on every login and from standard_user | Filed as [BUG-06](../bug-reports/BUG-06.md). First attempt also showed a placeholder image on the first product; it did not recur |
| `visual_user`: compare button positions with standard_user | Last tile's Add to cart is 54 px to the right | Filed as [BUG-07](../bug-reports/BUG-07.md) |

### Results

- No new filed defects; this session refined BUG-03 (text lands in the First Name field) and BUG-05 (works on the detail page, fails on the list page), and confirmed BUG-06 and BUG-07. One new finding (F-03). The `error_user` sorting alert is documented but not filed.
- Lesson: a scripted case only checks what it was written to check. The "works on the detail page, fails on the list page" observation for error_user came only from exploring.
- Next charter ideas: keyboard-only checkout, browser zoom 200%, rapid repeated Finish clicks.

