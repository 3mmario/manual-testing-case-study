const L = require('./lib');

const STD = 'standard_user';
const ERR_REQ = { first: 'Error: First Name is required', last: 'Error: Last Name is required', zip: 'Error: Postal Code is required' };
const err = (p) => p.locator('[data-test="error"]').textContent({ timeout: 2000 }).catch(() => '(no error shown)');
const ok = (pass, actual) => ({ pass, actual });
const sameList = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const addFirst = (p, n) => p.$$('[data-test^="add-to-cart"]').then(async (b) => { for (const x of b.slice(0, n)) await x.click(); });

async function loginAttempt(browser, user, pw) {
  const p = await L.openSite(browser);
  await L.submitLogin(p, user, pw);
  await p.waitForTimeout(500);
  return p;
}

/** Checkout step one with a given form, expecting either overview or an error. */
async function checkoutWith(browser, f, l, z, user = STD) {
  const p = await L.login(browser, user);
  await addFirst(p, 1);
  await L.startCheckout(p);
  await L.fillCheckout(p, f, l, z);
  await p.click('#continue');
  await p.waitForTimeout(500);
  return p;
}

const cases = [
  // ---------- Happy path ----------
  {
    id: 'TC-001', category: 'Happy path', req: 'R-01', priority: 'High',
    scenario: 'Valid standard user logs in',
    pre: 'Login page open', steps: ['Enter username and password', 'Click Login'],
    data: 'standard_user / secret_sauce',
    expected: 'Products page opens and lists 6 products',
    run: async (b) => { const p = await L.login(b, STD); const n = (await L.names(p)).length; return { ...ok(/inventory/.test(p.url()) && n === 6, `Products page opened, ${n} products listed`), page: p }; },
  },
  {
    id: 'TC-002', category: 'Happy path', req: 'R-04', priority: 'High',
    scenario: 'Catalogue shows name, price and a distinct image for every product',
    pre: 'Logged in as standard_user', steps: ['Open the products page', 'Inspect each product tile'],
    data: 'standard_user',
    expected: '6 tiles; each has a name, a price and its own product image (6 different image files)',
    run: async (b) => {
      const p = await L.login(b, STD);
      const imgs = await p.$$eval('.inventory_item_img img', (e) => e.map((i) => i.getAttribute('src')));
      const distinct = new Set(imgs).size;
      return { ...ok(distinct === 6 && (await L.prices(p)).length === 6, `${imgs.length} tiles, ${distinct} distinct images`), page: p };
    },
  },
  {
    id: 'TC-003', category: 'Happy path', req: 'R-05', priority: 'Medium',
    scenario: 'Sort products by name Z to A',
    pre: 'Logged in as standard_user', steps: ['Open the sort dropdown', 'Select "Name (Z to A)"'],
    data: 'standard_user',
    expected: 'Products are listed in reverse alphabetical order',
    run: async (b) => {
      const p = await L.login(b, STD); await p.selectOption('.product_sort_container', 'za');
      const n = await L.names(p); const exp = [...n].sort((a, c) => c.localeCompare(a));
      return { ...ok(sameList(n, exp), `First product: "${n[0]}"; last: "${n[n.length - 1]}"`), page: p };
    },
  },
  {
    id: 'TC-004', category: 'Happy path', req: 'R-05', priority: 'Medium',
    scenario: 'Sort products by price low to high',
    pre: 'Logged in as standard_user', steps: ['Select "Price (low to high)"'],
    data: 'standard_user',
    expected: 'Prices are in ascending numeric order',
    run: async (b) => {
      const p = await L.login(b, STD); await p.selectOption('.product_sort_container', 'lohi');
      const pr = await L.prices(p); const v = pr.map(L.num);
      return { ...ok(sameList(v, [...v].sort((a, c) => a - c)), `Prices: ${pr.join(', ')}`), page: p };
    },
  },
  {
    id: 'TC-005', category: 'Happy path', req: 'R-06', priority: 'Medium',
    scenario: 'Product detail page matches the product that was clicked',
    pre: 'Logged in as standard_user', steps: ['Note name and price of the first product', 'Click its name', 'Compare detail page'],
    data: 'standard_user, first product',
    expected: 'Detail page shows the same name and price',
    run: async (b) => {
      const p = await L.login(b, STD);
      const n = (await L.names(p))[0]; const pr = (await L.prices(p))[0];
      await p.click('.inventory_item_name >> nth=0'); await p.waitForSelector('.inventory_details_name');
      const dn = await p.textContent('.inventory_details_name'); const dp = await p.textContent('.inventory_details_price');
      return { ...ok(dn === n && dp === pr, `Detail shows "${dn}" ${dp}`), page: p };
    },
  },
  {
    id: 'TC-006', category: 'Happy path', req: 'R-07', priority: 'High',
    scenario: 'Add three products to the cart',
    pre: 'Logged in as standard_user, cart empty', steps: ['Click Add to cart on the first three products', 'Open the cart'],
    data: 'standard_user',
    expected: 'Badge shows 3, buttons turn into Remove, cart lists the 3 products',
    run: async (b) => {
      const p = await L.login(b, STD); await addFirst(p, 3); const bd = await L.badge(p);
      const removes = await p.locator('[data-test^="remove"]').count();
      await L.openCart(p); const items = (await L.names(p)).length;
      return { ...ok(bd === '3' && removes === 3 && items === 3, `Badge ${bd || 'empty'}, ${removes} Remove buttons, ${items} items in cart`), page: p };
    },
  },
  {
    id: 'TC-007', category: 'Happy path', req: 'R-07', priority: 'High',
    scenario: 'Remove a product from the cart page',
    pre: 'standard_user with 2 products in cart', steps: ['Open the cart', 'Click Remove on the first product'],
    data: 'standard_user',
    expected: 'Product disappears from the cart and the badge drops to 1',
    run: async (b) => {
      const p = await L.login(b, STD); await addFirst(p, 2); await L.openCart(p);
      await p.click('[data-test^="remove"] >> nth=0'); await p.waitForTimeout(300);
      const items = (await L.names(p)).length; const bd = await L.badge(p);
      return { ...ok(items === 1 && bd === '1', `${items} item left, badge ${bd || 'empty'}`), page: p };
    },
  },
  {
    id: 'TC-008', category: 'Happy path', req: 'R-10', priority: 'Critical',
    scenario: 'Complete a purchase end to end',
    pre: 'Logged in as standard_user', steps: ['Add one product', 'Open cart, Checkout', 'Enter first name, last name, postal code', 'Continue, then Finish'],
    data: 'standard_user; Ammar / Tester / 11181',
    expected: '"Thank you for your order!" is shown and the cart badge is cleared',
    run: async (b) => {
      const p = await L.login(b, STD); await addFirst(p, 1); await L.startCheckout(p);
      await L.fillCheckout(p, 'Ammar', 'Tester', '11181'); await p.click('#continue'); await p.click('#finish');
      await p.waitForSelector('[data-test="complete-header"]', { timeout: 5000 }).catch(() => {});
      const h = await p.locator('[data-test="complete-header"]').textContent().catch(() => '(not shown)'); const bd = await L.badge(p);
      return { ...ok(h === 'Thank you for your order!' && bd === '', `Header "${h}", badge ${bd || 'empty'}`), page: p };
    },
  },
  {
    id: 'TC-009', category: 'Happy path', req: 'R-03', priority: 'High',
    scenario: 'Logout ends the session',
    pre: 'Logged in as standard_user', steps: ['Open menu, click Logout', 'Request /inventory.html directly'],
    data: 'standard_user',
    expected: 'Login page shown; the direct request is refused with a "must be logged in" message',
    run: async (b) => {
      const p = await L.login(b, STD); await p.click('#react-burger-menu-btn'); await p.click('#logout_sidebar_link');
      await p.waitForSelector('#login-button'); await p.goto(L.BASE + '/inventory.html'); const e = await err(p);
      return { ...ok(/must be logged in|when you are logged in/.test(e), `Message: ${e}`), page: p };
    },
  },

  // ---------- Business rules ----------
  {
    id: 'TC-010', category: 'Business rules', req: 'R-09', priority: 'Critical',
    scenario: 'Order overview totals: item total, 8% tax, grand total',
    pre: 'standard_user, two products in cart', steps: ['Add the first two products', 'Go through checkout to the overview', 'Compare item total, tax and total with the product prices'],
    data: 'standard_user; $29.99 + $9.99 (tax rate 8% is observed behaviour, rounded to cents)',
    expected: 'Item total = sum of prices; tax = 8% rounded to 2 decimals; total = item total + tax',
    run: async (b) => {
      const p = await L.login(b, STD); await addFirst(p, 2);
      const sum = (await L.prices(p)).slice(0, 2).map(L.num).reduce((a, c) => a + c, 0); // list order == add order for first two
      await L.startCheckout(p); await L.fillCheckout(p, 'A', 'B', '1'); await p.click('#continue');
      await p.waitForSelector('.summary_info');
      const item = L.num(await p.textContent('.summary_subtotal_label')); const tax = L.num(await p.textContent('.summary_tax_label')); const tot = L.num(await p.textContent('.summary_total_label'));
      const pass = Math.abs(item - sum) < 0.005 && Math.abs(tax - Math.round(item * 8) / 100) < 0.005 && Math.abs(tot - (item + tax)) < 0.005;
      return { ...ok(pass, `Item total $${item}, tax $${tax}, total $${tot} (expected item total $${sum.toFixed(2)})`), page: p };
    },
  },
  {
    id: 'TC-011', category: 'Business rules', req: 'R-11', priority: 'Medium',
    scenario: 'Cart contents survive navigation to a detail page and back',
    pre: 'Logged in as standard_user', steps: ['Add the first product', 'Open its detail page', 'Click Back to products'],
    data: 'standard_user',
    expected: 'Badge still shows 1 and the product still offers Remove',
    run: async (b) => {
      const p = await L.login(b, STD); await addFirst(p, 1); await p.click('.inventory_item_name >> nth=0');
      await p.click('[data-test="back-to-products"]'); await p.waitForSelector('.inventory_list');
      const bd = await L.badge(p); const rm = await p.locator('[data-test^="remove"]').count();
      return { ...ok(bd === '1' && rm === 1, `Badge ${bd || 'empty'}, ${rm} Remove button`), page: p };
    },
  },
  {
    id: 'TC-012', category: 'Business rules', req: 'R-11', priority: 'Medium',
    scenario: 'Cancel on checkout step one returns to the cart with items intact',
    pre: 'standard_user, one product in cart', steps: ['Open checkout step one', 'Click Cancel'],
    data: 'standard_user',
    expected: 'Cart page opens and still lists the product',
    run: async (b) => {
      const p = await L.login(b, STD); await addFirst(p, 1); await L.startCheckout(p); await p.click('[data-test="cancel"]');
      await p.waitForSelector('.cart_list', { state: 'attached' }); const n = (await L.names(p)).length;
      return { ...ok(/cart/.test(p.url()) && n === 1, `URL ${p.url().replace(L.BASE, '')}, ${n} item`), page: p };
    },
  },
  {
    id: 'TC-013', category: 'Business rules', req: 'R-11', priority: 'Medium',
    scenario: 'Reset App State empties the cart',
    pre: 'standard_user, two products in cart', steps: ['Open menu', 'Click Reset App State'],
    data: 'standard_user',
    expected: 'Badge disappears and all buttons show Add to cart',
    run: async (b) => {
      const p = await L.login(b, STD); await addFirst(p, 2); await p.click('#react-burger-menu-btn'); await p.click('#reset_sidebar_link');
      await p.click('#react-burger-menu-close-btn').catch(() => {}); await p.waitForTimeout(400);
      const bd = await L.badge(p); const adds = await p.locator('[data-test^="add-to-cart"]').count();
      return { ...ok(bd === '' && adds === 6, `Badge ${bd || 'empty'}; ${adds} of 6 buttons show Add to cart, the rest still show Remove until reload${adds === 6 ? '' : '. See F-04'}`), page: p };
    },
  },
  {
    id: 'TC-014', category: 'Business rules', req: 'R-03', priority: 'High',
    scenario: 'Protected page cannot be opened without logging in',
    pre: 'No session', steps: ['Open /inventory.html directly in a new browser context'],
    data: '-',
    expected: 'Redirected to login with an "only access when logged in" message',
    run: async (b) => {
      const p = await L.openSite(b); await p.goto(L.BASE + '/inventory.html'); const e = await err(p);
      return { ...ok(/logged in/.test(e) && !/inventory/.test(p.url()), `Message: ${e}`), page: p };
    },
  },
  {
    id: 'TC-015', category: 'Business rules', req: 'R-08', priority: 'High',
    scenario: 'Checkout is not possible with an empty cart',
    pre: 'standard_user, cart empty', steps: ['Open the cart', 'Click Checkout', 'Enter valid details and continue'],
    data: 'standard_user; Ammar / Tester / 11181',
    expected: 'Checkout is blocked or the user is told the cart is empty',
    run: async (b) => {
      const p = await L.login(b, STD); await L.openCart(p); await p.click('[data-test="checkout"]'); const reached = /checkout-step-one/.test(p.url());
      if (reached) { await L.fillCheckout(p, 'Ammar', 'Tester', '11181'); await p.click('#continue'); await p.waitForTimeout(500); }
      const n = (await L.names(p)).length;
      return { ...ok(!reached || /cart/.test(p.url()), `Checkout step one ${reached ? 'opened' : 'blocked'}; overview reached with ${n} items (${p.url().replace(L.BASE, '')}). See F-01`), page: p };
    },
  },
  {
    id: 'TC-016', category: 'Business rules', req: 'R-02', priority: 'High',
    scenario: 'Locked out user cannot log in',
    pre: 'Login page open', steps: ['Enter locked-out credentials', 'Click Login'],
    data: 'locked_out_user / secret_sauce',
    expected: 'Stays on login; message "Sorry, this user has been locked out."',
    run: async (b) => { const p = await loginAttempt(b, 'locked_out_user'); const e = await err(p); return { ...ok(/locked out/.test(e) && !/inventory/.test(p.url()), `Message: ${e}`), page: p }; },
  },

  // ---------- Negative / edge: login decision table ----------
  {
    id: 'TC-017', category: 'Negative / edge', req: 'R-02', priority: 'High',
    scenario: 'Valid username, wrong password',
    pre: 'Login page open', steps: ['Enter username and a wrong password', 'Click Login'],
    data: 'standard_user / wrong_pass',
    expected: 'Generic message "Username and password do not match any user in this service" (no hint which field is wrong)',
    run: async (b) => { const p = await loginAttempt(b, STD, 'wrong_pass'); const e = await err(p); return { ...ok(/do not match any user/.test(e), `Message: ${e}`), page: p }; },
  },
  {
    id: 'TC-018', category: 'Negative / edge', req: 'R-02', priority: 'Medium',
    scenario: 'Unknown username, valid password',
    pre: 'Login page open', steps: ['Enter an unknown username and the valid password', 'Click Login'],
    data: 'nobody_here / secret_sauce',
    expected: 'Same generic "do not match" message as TC-017',
    run: async (b) => { const p = await loginAttempt(b, 'nobody_here'); const e = await err(p); return { ...ok(/do not match any user/.test(e), `Message: ${e}`), page: p }; },
  },
  {
    id: 'TC-019', category: 'Negative / edge', req: 'R-02', priority: 'Medium',
    scenario: 'Empty username',
    pre: 'Login page open', steps: ['Leave username empty, enter password', 'Click Login'],
    data: '(empty) / secret_sauce',
    expected: '"Username is required"',
    run: async (b) => { const p = await loginAttempt(b, '', undefined); const e = await err(p); return { ...ok(/Username is required/.test(e), `Message: ${e}`), page: p }; },
  },
  {
    id: 'TC-020', category: 'Negative / edge', req: 'R-02', priority: 'Medium',
    scenario: 'Empty password',
    pre: 'Login page open', steps: ['Enter username, leave password empty', 'Click Login'],
    data: 'standard_user / (empty)',
    expected: '"Password is required"',
    run: async (b) => { const p = await loginAttempt(b, STD, ''); const e = await err(p); return { ...ok(/Password is required/.test(e), `Message: ${e}`), page: p }; },
  },
  {
    id: 'TC-021', category: 'Negative / edge', req: 'R-02', priority: 'Low',
    scenario: 'Both fields empty: username error takes precedence',
    pre: 'Login page open', steps: ['Click Login with both fields empty'],
    data: '(empty) / (empty)',
    expected: '"Username is required" (first missing field is reported)',
    run: async (b) => { const p = await loginAttempt(b, '', ''); const e = await err(p); return { ...ok(/Username is required/.test(e), `Message: ${e}`), page: p }; },
  },
  {
    id: 'TC-022', category: 'Negative / edge', req: 'R-02', priority: 'Medium',
    scenario: 'Username is case sensitive',
    pre: 'Login page open', steps: ['Enter username in a different case', 'Click Login'],
    data: 'Standard_User / secret_sauce',
    expected: 'Login rejected with the "do not match" message',
    run: async (b) => { const p = await loginAttempt(b, 'Standard_User'); const e = await err(p); return { ...ok(/do not match any user/.test(e), `Message: ${e}`), page: p }; },
  },
  {
    id: 'TC-023', category: 'Negative / edge', req: 'R-02', priority: 'Medium',
    scenario: 'Username with a leading space is not silently trimmed',
    pre: 'Login page open', steps: ['Enter " standard_user" with a leading space', 'Click Login'],
    data: '" standard_user" / secret_sauce',
    expected: 'Login rejected with the "do not match" message',
    run: async (b) => { const p = await loginAttempt(b, ' standard_user'); const e = await err(p); return { ...ok(/do not match any user/.test(e), `Message: ${e}`), page: p }; },
  },
  {
    id: 'TC-024', category: 'Negative / edge', req: 'R-02', priority: 'High',
    scenario: 'SQL-injection style input is rejected safely',
    pre: 'Login page open', steps: ['Enter an injection string as username', 'Click Login'],
    data: `' OR '1'='1' -- / secret_sauce`,
    expected: 'Login rejected with the normal message; no error page, no access',
    run: async (b) => { const p = await loginAttempt(b, "' OR '1'='1' --"); const e = await err(p); return { ...ok(/do not match any user/.test(e) && !/inventory/.test(p.url()), `Message: ${e}`), page: p }; },
  },

  // ---------- Negative / edge: checkout form (EP + BVA) ----------
  {
    id: 'TC-025', category: 'Negative / edge', req: 'R-08', priority: 'High',
    scenario: 'First name empty (invalid partition)',
    pre: 'standard_user at checkout step one', steps: ['Leave first name empty, fill the others', 'Click Continue'],
    data: '"" / Tester / 11181',
    expected: `"${ERR_REQ.first}" and no navigation`,
    run: async (b) => { const p = await checkoutWith(b, '', 'Tester', '11181'); const e = await err(p); return { ...ok(e === ERR_REQ.first && /step-one/.test(p.url()), `Message: ${e}`), page: p }; },
  },
  {
    id: 'TC-026', category: 'Negative / edge', req: 'R-08', priority: 'High',
    scenario: 'Last name empty (invalid partition)',
    pre: 'standard_user at checkout step one', steps: ['Leave last name empty, fill the others', 'Click Continue'],
    data: 'Ammar / "" / 11181',
    expected: `"${ERR_REQ.last}" and no navigation`,
    run: async (b) => { const p = await checkoutWith(b, 'Ammar', '', '11181'); const e = await err(p); return { ...ok(e === ERR_REQ.last && /step-one/.test(p.url()), `Message: ${e}`), page: p }; },
  },
  {
    id: 'TC-027', category: 'Negative / edge', req: 'R-08', priority: 'High',
    scenario: 'Postal code empty (invalid partition)',
    pre: 'standard_user at checkout step one', steps: ['Leave postal code empty, fill the others', 'Click Continue'],
    data: 'Ammar / Tester / ""',
    expected: `"${ERR_REQ.zip}" and no navigation`,
    run: async (b) => { const p = await checkoutWith(b, 'Ammar', 'Tester', ''); const e = await err(p); return { ...ok(e === ERR_REQ.zip && /step-one/.test(p.url()), `Message: ${e}`), page: p }; },
  },
  {
    id: 'TC-028', category: 'Negative / edge', req: 'R-08', priority: 'Low',
    scenario: 'All three fields empty: first-name error takes precedence',
    pre: 'standard_user at checkout step one', steps: ['Click Continue with an empty form'],
    data: '"" / "" / ""',
    expected: `"${ERR_REQ.first}"`,
    run: async (b) => { const p = await checkoutWith(b, '', '', ''); const e = await err(p); return { ...ok(e === ERR_REQ.first, `Message: ${e}`), page: p }; },
  },
  {
    id: 'TC-029', category: 'Negative / edge', req: 'R-08', priority: 'Medium',
    scenario: 'Lower boundary: one-character values are accepted',
    pre: 'standard_user at checkout step one', steps: ['Enter 1 character in every field', 'Click Continue'],
    data: 'A / B / 1',
    expected: 'Overview page opens',
    run: async (b) => { const p = await checkoutWith(b, 'A', 'B', '1'); return { ...ok(/step-two/.test(p.url()), `URL ${p.url().replace(L.BASE, '')}`), page: p }; },
  },
  {
    id: 'TC-030', category: 'Negative / edge', req: 'R-08', priority: 'Medium',
    scenario: 'Whitespace-only first name is treated as empty',
    pre: 'standard_user at checkout step one', steps: ['Enter three spaces as first name, valid last name and postal code', 'Click Continue'],
    data: '"   " / Tester / 11181',
    expected: `"${ERR_REQ.first}" and no navigation`,
    run: async (b) => { const p = await checkoutWith(b, '   ', 'Tester', '11181'); return { ...ok(/step-one/.test(p.url()), `Moved on to ${p.url().replace(L.BASE, '')} with a blank first name. See F-02`), page: p }; },
  },
  {
    id: 'TC-031', category: 'Negative / edge', req: 'R-08', priority: 'Low',
    scenario: 'Very long first name (300 characters) does not break the flow',
    pre: 'standard_user at checkout step one', steps: ['Enter 300 "A" as first name', 'Continue and inspect the overview'],
    data: '300 x "A" / Tester / 11181',
    expected: 'Either a clear length error, or the overview opens with an intact layout',
    run: async (b) => { const p = await checkoutWith(b, 'A'.repeat(300), 'Tester', '11181'); const okFlow = /step-two/.test(p.url()) || /(?:characters|length|too long)/i.test(await err(p)); return { ...ok(okFlow, `${/step-two/.test(p.url()) ? 'Accepted, overview opened; no maximum length enforced (observation)' : await err(p)}`), page: p }; },
  },
  {
    id: 'TC-032', category: 'Negative / edge', req: 'R-08', priority: 'Low',
    scenario: 'Alphanumeric postal code with a space is accepted',
    pre: 'standard_user at checkout step one', steps: ['Enter a UK-style postal code', 'Click Continue'],
    data: 'Ammar / Tester / SW1A 1AA',
    expected: 'Overview page opens (postal codes are not always numeric)',
    run: async (b) => { const p = await checkoutWith(b, 'Ammar', 'Tester', 'SW1A 1AA'); return { ...ok(/step-two/.test(p.url()), `URL ${p.url().replace(L.BASE, '')}`), page: p }; },
  },

  // ---------- Negative / edge: special user profiles ----------
  {
    id: 'TC-033', category: 'Negative / edge', req: 'R-04', priority: 'High',
    scenario: 'problem_user: every product shows its own image',
    pre: 'Login page open', steps: ['Log in as problem_user', 'Inspect product images'],
    data: 'problem_user',
    expected: '6 different product images',
    run: async (b) => { const p = await L.login(b, 'problem_user'); const imgs = await p.$$eval('.inventory_item_img img', (e) => e.map((i) => i.getAttribute('src'))); const d = new Set(imgs).size; return { ...ok(d === 6, `${d} distinct image file(s) across ${imgs.length} tiles. See BUG-01`), page: p }; },
  },
  {
    id: 'TC-034', category: 'Negative / edge', req: 'R-05', priority: 'High',
    scenario: 'problem_user: sorting Name (Z to A) reorders the list',
    pre: 'Logged in as problem_user', steps: ['Select "Name (Z to A)"'],
    data: 'problem_user',
    expected: 'Products listed in reverse alphabetical order',
    run: async (b) => { const p = await L.login(b, 'problem_user'); await p.selectOption('.product_sort_container', 'za'); const n = await L.names(p); return { ...ok(sameList(n, [...n].sort((a, c) => c.localeCompare(a))), `First product after sort: "${n[0]}". See BUG-02`), page: p }; },
  },
  {
    id: 'TC-035', category: 'Negative / edge', req: 'R-08', priority: 'Critical',
    scenario: 'problem_user: last name field accepts typed text',
    pre: 'problem_user with one product in cart', steps: ['Open checkout step one', 'Type "Tester" in Last Name', 'Click Continue'],
    data: 'problem_user; Ammar / Tester / 11181',
    expected: 'Last name shows "Tester"; Continue opens the overview',
    run: async (b) => {
      const p = await L.login(b, 'problem_user'); await p.click('[data-test="add-to-cart-sauce-labs-backpack"]'); await L.startCheckout(p);
      await L.fillCheckout(p, 'Ammar', 'Tester', '11181'); const v = await p.inputValue('#last-name'); await p.click('#continue'); await p.waitForTimeout(400);
      return { ...ok(v === 'Tester' && /step-two/.test(p.url()), `Last name field contains "${v}"; message: ${await err(p)}. See BUG-03`), page: p };
    },
  },
  {
    id: 'TC-036', category: 'Negative / edge', req: 'R-07', priority: 'High',
    scenario: 'problem_user: add three products, then remove one',
    pre: 'Logged in as problem_user', steps: ['Click Add to cart on the first three products', 'Click Remove on the first product'],
    data: 'problem_user',
    expected: 'Badge shows 3 after adding and 2 after removing',
    run: async (b) => {
      const p = await L.login(b, 'problem_user'); await addFirst(p, 3); const afterAdd = await L.badge(p);
      await p.click('[data-test="remove-sauce-labs-backpack"]').catch(() => {}); const afterRemove = await L.badge(p);
      return { ...ok(afterAdd === '3' && afterRemove === '2', `Badge after add: ${afterAdd || 'empty'}; after remove: ${afterRemove || 'empty'}. See BUG-04`), page: p };
    },
  },
  {
    id: 'TC-037', category: 'Negative / edge', req: 'R-10', priority: 'Critical',
    scenario: 'error_user: complete a purchase',
    pre: 'Logged in as error_user', steps: ['Add one product', 'Checkout with Ammar / Tester / 11181', 'Click Finish'],
    data: 'error_user; Ammar / Tester / 11181',
    expected: '"Thank you for your order!" is shown',
    run: async (b) => {
      const p = await L.login(b, 'error_user'); await p.click('[data-test="add-to-cart-sauce-labs-backpack"]'); await L.startCheckout(p);
      await L.fillCheckout(p, 'Ammar', 'Tester', '11181'); await p.click('#continue'); await p.waitForTimeout(400);
      if (/step-two/.test(p.url())) { await p.click('#finish'); await p.waitForTimeout(1000); }
      const done = await p.locator('[data-test="complete-header"]').count();
      return { ...ok(done === 1, `Final URL ${p.url().replace(L.BASE, '')}; confirmation ${done ? 'shown' : 'not shown'}. See BUG-05`), page: p };
    },
  },
  {
    id: 'TC-038', category: 'Negative / edge', req: 'R-13', priority: 'High',
    scenario: 'visual_user: prices equal the standard catalogue prices',
    pre: 'Login page open', steps: ['Log in as standard_user, note prices', 'Log in as visual_user, compare'],
    data: 'standard_user vs visual_user',
    expected: 'Identical prices for each product',
    run: async (b) => { const s = await L.login(b, STD); const p = await L.login(b, 'visual_user'); const sp = await L.prices(s); const vp = await L.prices(p); return { ...ok(sameList(sp, vp), `standard: ${sp.join(' ')} | visual: ${vp.join(' ')}. See BUG-06`), page: p }; },
  },
  {
    id: 'TC-039', category: 'Negative / edge', req: 'R-13', priority: 'Medium',
    scenario: 'visual_user: layout matches the standard layout',
    pre: 'Login page open', steps: ['Compare Add to cart button positions of all tiles for both users'],
    data: 'standard_user vs visual_user, 1280x900',
    expected: 'Every button is at the same position as for standard_user',
    run: async (b) => {
      const pos = (p) => p.$$eval('.inventory_item', (e) => e.map((i) => { const r = i.querySelector('button').getBoundingClientRect(); return `${Math.round(r.x)},${Math.round(r.y)}`; }));
      const s = await L.login(b, STD); const p = await L.login(b, 'visual_user'); const sp = await pos(s); const vp = await pos(p);
      const diff = vp.map((v, i) => (v === sp[i] ? null : `tile ${i + 1}: ${v} vs ${sp[i]}`)).filter(Boolean);
      return { ...ok(diff.length === 0, diff.length ? `Shifted button(s): ${diff.join('; ')}. See BUG-07` : 'No differences'), page: p };
    },
  },
  {
    id: 'TC-040', category: 'Negative / edge', req: 'R-12', priority: 'Medium',
    scenario: 'performance_glitch_user: login completes within 2 seconds',
    pre: 'Login page open', steps: ['Log in as performance_glitch_user', 'Measure click-to-product-list time'],
    data: 'performance_glitch_user; threshold 2000 ms (assumed, no SLA published)',
    expected: 'Product list visible in 2000 ms or less',
    run: async (b) => { const p = await L.login(b, 'performance_glitch_user'); return { ...ok(p.loginMs <= 2000, `Login took ${p.loginMs} ms. See BUG-08`), page: p }; },
  },
  {
    id: 'TC-041', category: 'Negative / edge', req: 'R-06', priority: 'Medium',
    scenario: 'problem_user: clicking a product opens that product',
    pre: 'Logged in as problem_user', steps: ['Click "Sauce Labs Backpack"', 'Read the detail page title'],
    data: 'problem_user',
    expected: 'Detail page for Sauce Labs Backpack',
    run: async (b) => { const p = await L.login(b, 'problem_user'); await p.click('text=Sauce Labs Backpack'); await p.waitForSelector('.inventory_details_name'); const n = await p.textContent('.inventory_details_name'); return { ...ok(n === 'Sauce Labs Backpack', `Detail page shows "${n}". See F-03`), page: p }; },
  },
];

module.exports = { cases };
