# Simplify Page Structure: Merge Checkout into Cart Drawer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the separate checkout page into the cart page to reduce from 8 pages to ~4 pages, eliminating checkout.astro and order-thank-you.astro while keeping all order functionality (Telegram notification via Cloudflare Worker).

**Architecture:** The cart page currently links to `/checkout`. The checkout page contains a form that POSTs to the Cloudflare Worker. We'll inline the checkout form into the cart page as a conditional section that appears when the cart has items, replacing the "Checkout" button. On successful submission, the Worker redirects to `/cart?success=1&ref=ORDER_REF` which we'll handle to show an inline success state instead of redirecting to a separate thank-you page.

**Tech Stack:** Astro 7.x, Tailwind CSS 4.x, nanostores, Cloudflare Workers (TypeScript)

**Spec:** Project memory (telegram bot + cloudflare workers refactor, page simplification)

## Global Constraints

- All existing Philippine shipping logic must work unchanged
- Payment methods: COD (default) and GCash/Maya manual transfer
- Payment slip upload (JPG, PNG, WebP, PDF, ≤4MB)
- Worker endpoint at `worker.submitOrderUrl` (from `WORKER_SUBMIT_ORDER_URL` env)
- Order reference returned via redirect query params
- Cart state persists via localStorage (nanostores persistentAtom)
- Design system: Anton/Barlow Condensed/Archivo fonts, registration-red/paper-stock/ink-black, 4px base spacing

## Review Focus

1. **Empty cart state** — When cart is empty, show only "Browse Drop 001" CTA, no checkout form
2. **Form validation** — All required fields (name, email, phone, street, province, city, zip) must validate inline before submit
3. **Payment method switch** — GCash panel shows/hides correctly, reference required only for GCash
4. **Worker error handling** — Network errors, validation errors from Worker, and Telegram failures show user-friendly messages
5. **Success state** — After Worker redirects back with `?success=1&ref=`, clear cart and show confirmation with order reference

---

### Task 1: Add checkout form section to cart.astro

**Files:**

- Modify: `src/pages/cart.astro` (replace checkout link with inline form)
- Test: Manual verification via `npm run dev`

**Interfaces:**

- Consumes: `worker` from `../config/worker`, shipping data, catalog data, cart stores
- Produces: Inline checkout form with all fields from current checkout.astro

- [ ] **Step 1: Add imports and config to cart.astro frontmatter**
  - Import `worker` from `../config/worker`
  - Import `deliveryLines`, `orderTerms`, `courier`, `calculateShippingFee`, `FREE_SHIPPING_THRESHOLD`, `zoneById` from `../data/shipping`
  - Import `ITEM_PRICE`, `products` from `../data/catalog`
  - Import `contact` from `../config/site`
  - Import `PAYMENT_SLIP_MAX_BYTES` from `../lib/orderSubmission`

- [ ] **Step 2: Add checkout form HTML section after the cart items**
  - Create a form with `action={worker.submitOrderUrl}`, `method="POST"`, `enctype="multipart/form-data"`, `data-order-form`
  - Include all fields from checkout.astro: hidden cart-items, honeypot, contact (name, email, phone), delivery address (street, province select, city, zip), order note, payment method (COD/GCash), GCash panel (reference, receipt upload), terms, error box, submit button
  - Keep ProvinceSelect component for province field
  - Use same CSS classes and structure as checkout.astro

- [ ] **Step 3: Add checkout form JavaScript logic (inline script)**
  - Copy the entire script from checkout.astro (lines 376-794)
  - Adapt to work within cart page context
  - Handle success redirect: on `?success=1&ref=`, clear cart, show success message with order reference
  - Update cart count/subtotal when items change (already subscribed)

- [ ] **Step 4: Conditionally render checkout form**
  - Only show checkout form when `cartItems.get().length > 0`
  - When empty, keep current "Your Slip Is Empty" state with "Browse Drop 001" button
  - Remove the separate "Checkout" button/link that navigates to /checkout

- [ ] **Step 5: Test cart page with inline checkout**
  - Run `npm run dev`
  - Add items to cart, verify checkout form appears
  - Test form validation, payment method toggle, province selection
  - Verify form submits to Worker endpoint

---

### Task 2: Handle success state on cart page

**Files:**

- Modify: `src/pages/cart.astro` (add success state handling)
- Test: Manual verification via `npm run dev`

**Interfaces:**

- Consumes: URL search params (`success`, `ref`)
- Produces: Inline success UI, cart clearing

- [ ] **Step 1: Add success state detection in frontmatter or script**
  - Check `Astro.url.searchParams.get('success') === '1'` in frontmatter
  - Pass `orderRef = Astro.url.searchParams.get('ref')` to template
  - Or handle entirely in client-side script on load

- [ ] **Step 2: Add success UI section**
  - Show when `success=1` in URL
  - Display: "Order request received" heading, order reference, confirmation message
  - Include "Explore Batch 001" button linking to /products
  - Match style of current order-thank-you.astro

- [ ] **Step 3: Clear cart on success**
  - Call `clearCart()` from cartStore when success detected
  - Ensure this happens before render so empty state shows

---

### Task 3: Remove checkout.astro and order-thank-you.astro

**Files:**

- Delete: `src/pages/checkout.astro`
- Delete: `src/pages/order-thank-you.astro`
- Test: `npm run build` should pass

- [ ] **Step 1: Delete checkout.astro**
  - Verify no other files import or link to it (search for "/checkout")
  - Update any remaining references

- [ ] **Step 2: Delete order-thank-you.astro**
  - Verify incident-report.astro still works (it POSTs to /order-thank-you?incident=1)
  - Update incident-report.astro to use a different success handling (can stay as-is since it's a separate Netlify Forms endpoint, or change to redirect to /contact?incident=1)

---

### Task 4: Update incident-report.astro for new success flow

**Files:**

- Modify: `src/pages/incident-report.astro`
- Test: Manual verification

**Interfaces:**

- Consumes: Form submission
- Produces: Redirect to /contact?incident=1 (or similar)

- [ ] **Step 1: Change form action**
  - Current: `action="/order-thank-you?incident=1"` with Netlify Forms
  - New: Since we removed Netlify Functions, either:
    a) Keep Netlify Forms for this (if still on Netlify) - change to redirect to /contact?incident=1
    b) Or create a simple Worker endpoint for incident reports (out of scope for this task)
  - For simplicity: change action to `/contact?incident=1` and handle display on contact page

- [ ] **Step 2: Update contact.astro to show incident success**
  - Add check for `?incident=1` in URL
  - Show "Incident report received" message when present

---

### Task 5: Verify build and clean up

**Files:**

- Test: `npm run build`, `npm run check`

- [ ] **Step 1: Run build**
  - `npm run build` - should complete without errors
  - `npm run check` - TypeScript should pass

- [ ] **Step 2: Verify no dead imports**
  - Ensure no imports of deleted pages
  - Check all internal links work

---

### Task 6: Update navigation and documentation

**Files:**

- Modify: Any header/footer components with hardcoded /checkout links
- Modify: README.md if it references old page structure

- [ ] **Step 1: Check for /checkout references**
  - Search codebase for "/checkout" or "checkout.astro"
  - Update any navigation components

- [ ] **Step 2: Update README.md page count**
  - Update from 8 pages to ~4 pages (index, products/[slug], products/index, cart, contact, incident-report, 404)
