# Telegram Bot + Cloudflare Workers Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Netlify Functions + Netlify Email API with a free Telegram Bot + Cloudflare Workers solution for order notifications, while simplifying the page structure from 8 pages to ~3 core pages.

**Architecture:**

- Cloudflare Worker replaces Netlify Function for order submission endpoint
- Telegram Bot API sends formatted order messages to store owner's chat (replaces dual email flow)
- Astro static pages remain, but checkout becomes a modal/drawer on cart page (eliminates separate checkout page)
- Order-thank-you page merges into cart drawer confirmation state
- Contact and incident report pages kept but simplified

**Tech Stack:** Astro 7.x, Tailwind CSS 4.x, nanostores, Cloudflare Workers (TypeScript), Telegram Bot API, Wrangler CLI

**Spec:** This plan implements the user's selection of Option 1 from the discussion: "Refactor the current project to use Telegram + Cloudflare Workers"

## Global Constraints

- All existing design system tokens (colors, fonts, spacing, radius) from DESIGN.md must be preserved
- Philippine shipping zones (NCR, Luzon, VisMin, Palawan) with free shipping on 3+ items must work identically
- Order-by-request model (no payment collection at checkout, COD or GCash/Maya manual transfer) unchanged
- Product catalog (3 products, S–L ₱253 and XL–2XL ₱265, S-2XL variants) unchanged
- nanostores cart persistence via localStorage unchanged
- All existing components (Header, Footer, ProductCard, ProductGrid, CartDrawer, CartButton, ProvinceSelect, AddToCartForm) reused where possible
- Zero runtime dependencies added to Astro build (Telegram only called from Cloudflare Worker)

## Review Focus

1. **Telegram message formatting** — Order details must be readable in Telegram (markdown/HTML), include all fields from `formatOrderDetails()`, handle long messages (>4096 chars) via chunking
2. **Cloudflare Worker CORS** — Must accept form submissions from the Astro domain (both localhost and production) without breaking existing form validation
3. **Payment slip handling** — File uploads (optional receipt) must be forwarded to Telegram as document/photo, not base64 in message
4. **Error UX parity** — Checkout form validation errors (client + server) must surface identically to current Netlify function behavior
5. **Cart/checkout modal state** — Merging checkout into cart drawer must not lose orderNote, shippingZoneId, shippingProvince persistence across page reloads

---

### Task 1: Create Telegram Bot and Get Credentials

**Files:**

- Create: `docs/telegram-setup.md` (setup guide for user)
- No code changes

**Interfaces:**

- Produces: `BOT_TOKEN` (string), `CHAT_ID` (string) — user provides these via Cloudflare Worker secrets

- [ ] **Step 1: Write setup guide**

Create `docs/telegram-setup.md` with exact steps:

1. Message @BotFather on Telegram → `/newbot` → name it "Kalye Noir Orders" → username "kalyenoir_orders_bot"
2. Copy the BOT_TOKEN from BotFather response
3. Add bot to a private channel/group or DM it
4. Get CHAT_ID: send a message to bot, then visit `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates` → find `"chat":{"id":<CHAT_ID>}`
5. Test: `curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/sendMessage" -d "chat_id=<CHAT_ID>" -d "text=Test from Kalye Noir"`

- [ ] **Step 2: User runs setup and provides credentials**

User executes steps, saves BOT_TOKEN and CHAT_ID for Task 3.

---

### Task 2: Create Cloudflare Worker Project Structure

**Files:**

- Create: `worker/package.json`
- Create: `worker/wrangler.toml`
- Create: `worker/src/index.ts`
- Create: `worker/src/types.ts`
- Create: `worker/src/telegram.ts`
- Create: `worker/src/validation.ts`

**Interfaces:**

- Consumes: Order submission form data (multipart/form-data) from checkout form
- Produces: HTTP endpoint at `/api/submit-order` returning JSON or redirect

- [ ] **Step 1: Write failing test for worker entry point**

```bash
# Test command (run after implementation)
npx vitest run worker/src/index.test.ts
```

Expected: FAIL — worker not implemented

- [ ] **Step 2: Create worker/package.json**

```json
{
	"name": "kalye-noir-worker",
	"version": "1.0.0",
	"type": "module",
	"scripts": {
		"dev": "wrangler dev",
		"deploy": "wrangler deploy",
		"test": "vitest run"
	},
	"devDependencies": {
		"@cloudflare/workers-types": "^4.20240101.0",
		"vitest": "^2.0.0",
		"wrangler": "^3.80.0"
	}
}
```

- [ ] **Step 3: Create worker/wrangler.toml**

```toml
name = "kalye-noir-orders"
main = "src/index.ts"
compatibility_date = "2024-11-23"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"

# Secrets set via: wrangler secret put BOT_TOKEN / CHAT_ID
```

- [ ] **Step 4: Create worker/src/types.ts**

```typescript
export interface OrderLine {
	title: string;
	variant: string;
	quantity: number;
	unitPrice: number;
}

export interface OrderSubmission {
	customer: {
		name: string;
		email: string;
		phone: string;
		street: string;
		city: string;
		province: string;
		zip: string;
		note: string;
	};
	lines: OrderLine[];
	itemCount: number;
	paymentMethod: 'cod' | 'gcash';
	paymentReference: string;
	paymentSlip?: File;
	deliveryWindow: string;
	subtotal: number;
	shippingFee: number;
	grandTotal: number;
}

export interface Env {
	BOT_TOKEN: string;
	CHAT_ID: string;
}
```

- [ ] **Step 5: Create worker/src/validation.ts**

Port validation logic from `src/lib/orderSubmission.ts`:

- `parseOrderSubmission(formData: FormData): Promise<OrderSubmissionResult>`
- `validatePaymentSlip(formData: FormData): Promise<...>`
- `readText()`, `invalid()`, `formatOrderDetails()` (adapted for Telegram)
- Reuse `shippingZones`, `calculateShippingFee`, `courier`, `FREE_SHIPPING_THRESHOLD`, `products`, `variantsBySku` from shared data (see Task 4)

- [ ] **Step 6: Create worker/src/telegram.ts**

```typescript
export async function sendOrderToTelegram(
	order: OrderSubmission,
	orderReference: string,
	env: Env,
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
	// 1. Format order details using formatOrderDetails()
	// 2. Send main message via sendMessage (HTML parse_mode)
	// 3. If paymentSlip exists, send via sendDocument/sendPhoto
	// 4. Handle >4096 char limit by chunking
	// 5. Return success/failure
}
```

- [ ] **Step 7: Create worker/src/index.ts**

```typescript
export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		// CORS headers
		// Only accept POST multipart/form-data
		// Parse formData
		// Validate via parseOrderSubmission()
		// Generate orderReference (UUID v4 uppercase)
		// Call sendOrderToTelegram()
		// On success: return redirect to /cart?success=1&ref=<orderReference>
		// On failure: return JSON error with status
	},
} satisfies ExportedHandler<Env>;
```

- [ ] **Step 8: Run test to verify worker compiles**

```bash
cd worker && npm install && npm run test
```

Expected: PASS (basic compile check)

- [ ] **Step 9: Commit**

```bash
git add worker/
git commit -m "feat: add Cloudflare Worker project structure"
```

---

### Task 3: Deploy Cloudflare Worker and Configure Secrets

**Files:**

- No new files (deployment only)

**Interfaces:**

- Consumes: `worker/` from Task 2, `BOT_TOKEN`, `CHAT_ID` from Task 1
- Produces: Live Worker URL (e.g., `https://kalye-noir-orders.<subdomain>.workers.dev`)

- [ ] **Step 1: Install Wrangler and login**

```bash
cd worker && npm install
npx wrangler login
```

- [ ] **Step 2: Set secrets**

```bash
npx wrangler secret put BOT_TOKEN
# paste BOT_TOKEN from Task 1
npx wrangler secret put CHAT_ID
# paste CHAT_ID from Task 1
```

- [ ] **Step 3: Deploy worker**

```bash
npx wrangler deploy
```

Record the deployed URL.

- [ ] **Step 4: Test endpoint manually**

```bash
curl -X POST "https://<worker-url>/api/submit-order" \
  -F "name=Test User" \
  -F "email=test@example.com" \
  -F "phone=09171234567" \
  -F "street=123 Test St" \
  -F "city=Manila" \
  -F "province=Manila" \
  -F "zip=1000" \
  -F "payment-type=cod" \
  -F "payment-ref=" \
  -F "cart-items=[{\"sku\":\"kalyenoir-tee-m\",\"qty\":1}]"
```

Expected: Redirect to /cart?success=1&ref=... and Telegram message received

- [ ] **Step 5: Commit deployment URL to docs**

Add worker URL to `docs/telegram-setup.md` for reference.

---

### Task 4: Share Validation Logic Between Astro and Worker

**Files:**

- Create: `shared/validation.ts` (new shared module)
- Modify: `src/lib/orderSubmission.ts` → re-export from shared
- Modify: `worker/src/validation.ts` → import from shared

**Interfaces:**

- Produces: Single source of truth for `parseOrderSubmission`, `formatOrderDetails`, shipping constants, product catalog

- [ ] **Step 1: Create shared/package.json**

```json
{
	"name": "kalye-noir-shared",
	"version": "1.0.0",
	"type": "module",
	"main": "./validation.ts",
	"exports": {
		".": "./validation.ts",
		"./shipping": "./shipping.ts",
		"./catalog": "./catalog.ts"
	}
}
```

- [ ] **Step 2: Create shared/validation.ts**

Move all validation logic from `src/lib/orderSubmission.ts` here:

- `parseOrderSubmission()`, `validatePaymentSlip()`, `formatOrderDetails()`
- `readText()`, `invalid()`, `paymentSlipTypes`, `variantsBySku`
- Import `products`, `shippingZones`, `calculateShippingFee`, `courier`, `FREE_SHIPPING_THRESHOLD` from `./shipping` and `./catalog`

- [ ] **Step 3: Create shared/shipping.ts**

Copy `src/data/shipping.ts` here (pure TS, no Astro imports).

- [ ] **Step 4: Create shared/catalog.ts**

Copy `src/data/catalog.ts` here (pure TS, no Astro imports).

- [ ] **Step 5: Update src/lib/orderSubmission.ts**

```typescript
export {
	parseOrderSubmission,
	formatOrderDetails,
	PAYMENT_SLIP_MAX_BYTES,
	ORDER_REQUEST_MAX_BYTES,
	type OrderSubmission,
	type OrderSubmissionResult,
	type OrderLine,
} from 'kalye-noir-shared/validation';
```

- [ ] **Step 6: Update worker/src/validation.ts**

```typescript
import {
	parseOrderSubmission,
	formatOrderDetails,
	type OrderSubmission,
	type OrderSubmissionResult,
} from 'kalye-noir-shared/validation';
```

- [ ] **Step 7: Update worker/package.json dependencies**

Add `"kalye-noir-shared": "file:../shared"` to dependencies.

- [ ] **Step 8: Update Astro package.json dependencies**

Add `"kalye-noir-shared": "file:../shared"` to dependencies.

- [ ] **Step 9: Run Astro build to verify**

```bash
npm run build
```

Expected: PASS (no TypeScript errors)

- [ ] **Step 10: Run worker tests**

```bash
cd worker && npm run test
```

Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add shared/ src/lib/orderSubmission.ts worker/
git commit -m "feat: extract shared validation logic"
```

---

### Task 5: Update Checkout Form to Call Cloudflare Worker

**Files:**

- Modify: `src/pages/checkout.astro` (form action, submit handler)
- Modify: `src/pages/cart.astro` (later, for modal integration — see Task 7)

**Interfaces:**

- Consumes: Worker URL from Task 3
- Produces: Form submits to Worker endpoint, handles redirect response

- [ ] **Step 1: Update form action in checkout.astro**

Change line 40 from:

```astro
action="/.netlify/functions/submit-order"
```

to:

```astro
action="https://<worker-url>/api/submit-order"
```

(Use environment variable for worker URL — see step 2)

- [ ] **Step 2: Add worker URL to site config**

Create `src/config/worker.ts`:

```typescript
export const worker = {
	submitOrderUrl:
		import.meta.env.WORKER_SUBMIT_ORDER_URL ??
		'https://<worker-url>/api/submit-order',
} as const;
```

Add `WORKER_SUBMIT_ORDER_URL` to `.env.example` and Netlify/Cloudflare Pages env vars.

- [ ] **Step 3: Update checkout.astro to import worker config**

```astro
import {worker} from '../config/worker';
```

Use `worker.submitOrderUrl` in form action.

- [ ] **Step 4: Update submit handler for Worker response**

In checkout.astro script section, the fetch already handles `response.redirected` — Worker returns 303 redirect to `/cart?success=1&ref=<orderReference>`. No change needed if Worker matches this.

- [ ] **Step 5: Test checkout flow**

Run `npm run dev`, add item to cart, go to checkout, submit order.
Expected: Redirect to cart with success params, Telegram message received.

- [ ] **Step 6: Commit**

```bash
git add src/pages/checkout.astro src/config/worker.ts .env.example
git commit -m "feat: switch checkout to Cloudflare Worker endpoint"
```

---

### Task 6: Remove Netlify Function and Email Dependencies

**Files:**

- Delete: `netlify/functions/submit-order.mts`
- Delete: `netlify/functions/` directory (if empty)
- Modify: `package.json` (remove `@netlify/functions`)
- Modify: `netlify.toml` (remove function config if any)
- Modify: `.env.example` (remove RESEND_API_KEY, RESEND_FROM)

**Interfaces:**

- No interfaces — cleanup only

- [ ] **Step 1: Delete Netlify function**

```bash
rm netlify/functions/submit-order.mts
rmdir netlify/functions
```

- [ ] **Step 2: Update package.json**

Remove `"@netlify/functions": "^6.1.1"` from devDependencies.

- [ ] **Step 3: Update netlify.toml**

Remove any function-related config (none currently, but verify).

- [ ] **Step 4: Update .env.example**

Remove RESEND_API_KEY and RESEND_FROM lines.

- [ ] **Step 5: Run build to verify**

```bash
npm run build
```

Expected: PASS (no import errors)

- [ ] **Step 6: Commit**

```bash
git add -u netlify/ package.json .env.example
git commit -m "chore: remove Netlify Functions and Email API dependencies"
```

---

### Task 7: Simplify Page Structure — Merge Checkout into Cart Drawer

**Files:**

- Modify: `src/pages/cart.astro` (add checkout form as modal/drawer section)
- Modify: `src/components/CartDrawer.astro` (add checkout step state)
- Modify: `src/components/CartButton.astro` (trigger cart drawer)
- Delete: `src/pages/checkout.astro`
- Delete: `src/pages/order-thank-you.astro`
- Modify: `src/stores/cartStore.ts` (add checkout UI state atoms)

**Interfaces:**

- Consumes: Existing cart store, Worker endpoint from Task 5
- Produces: Single `/cart` page with embedded checkout flow (stepper: Cart → Address/Payment → Confirmation)

- [ ] **Step 1: Add checkout UI state to cartStore.ts**

```typescript
export type CheckoutStep = 'cart' | 'checkout' | 'success';
export const checkoutStep = persistentAtom<CheckoutStep>(
	'kalye-noir-checkout-step',
	'cart',
);
export const lastOrderRef = persistentAtom<string>('kalye-noir-last-ref', '');
```

- [ ] **Step 2: Update CartDrawer.astro**

Add conditional rendering based on `checkoutStep`:

- Step 'cart': current cart rows + checkout button
- Step 'checkout': checkout form (moved from checkout.astro)
- Step 'success': thank you message with order reference + "Continue Shopping" button

- [ ] **Step 3: Move checkout form HTML to CartDrawer.astro**

Copy form from `src/pages/checkout.astro` lines 36-306 into CartDrawer, wrapped in `{checkoutStep.get() === 'checkout' && (...) }`.

- [ ] **Step 4: Move checkout form script logic to CartDrawer.astro**

Copy script from checkout.astro lines 375-793, adapt to:

- Submit to Worker endpoint
- On success: `checkoutStep.set('success')`, `lastOrderRef.set(ref)`, `clearCart()`
- Back button: `checkoutStep.set('cart')`

- [ ] **Step 5: Update cart.astro**

Remove duplicate cart rows rendering (now in CartDrawer).
Keep: page title, breadcrumb, empty state fallback.
CartDrawer handles all interactivity.

- [ ] **Step 6: Update CartButton.astro**

Ensure it opens CartDrawer (already does via `isCartOpen` atom).

- [ ] **Step 7: Delete checkout.astro and order-thank-you.astro**

```bash
rm src/pages/checkout.astro src/pages/order-thank-you.astro
```

- [ ] **Step 8: Update navigation links**

In Header.astro, Footer.astro, Product pages: change `/checkout` links to `/cart` (CartDrawer handles checkout step).

- [ ] **Step 9: Test full flow**

Run `npm run dev`:

1. Add item → cart button opens drawer (step: cart)
2. Click "Checkout" → drawer shows form (step: checkout)
3. Fill form, submit → Worker called → drawer shows success (step: success)
4. Click "Continue Shopping" → drawer closes, step resets to 'cart', cart cleared

- [ ] **Step 10: Commit**

```bash
git add src/pages/cart.astro src/components/CartDrawer.astro src/components/CartButton.astro src/stores/cartStore.ts src/components/Header.astro src/components/Footer.astro
git rm src/pages/checkout.astro src/pages/order-thank-you.astro
git commit -m "feat: merge checkout into cart drawer, remove 2 pages"
```

---

### Task 8: Simplify Contact and Incident Report Pages (Optional)

**Files:**

- Modify: `src/pages/contact.astro` (simplify, keep essential info)
- Modify: `src/pages/incident-report.astro` (optionally convert to Netlify Forms → Worker, or keep as-is)
- No deletions required

**Interfaces:**

- Consumes: Existing contact config
- Produces: Cleaner contact page, incident report optionally via Worker

- [ ] **Step 1: Simplify contact.astro**

Remove duplicate info, keep: phone, email, Facebook, incident report link. Already minimal — verify no changes needed.

- [ ] **Step 2: Decide on incident-report.astro**

Option A: Keep as Netlify Form (current) — simplest, no Worker needed.
Option B: Convert to Worker endpoint (like orders) — unified backend.
Recommendation: **Option A** — incident reports are low volume, Netlify Forms free tier handles them.

- [ ] **Step 3: Commit (if any changes)**

```bash
git commit -m "chore: simplify contact page"
```

---

### Task 9: Update Build Config and Deploy

**Files:**

- Modify: `astro.config.mjs` (ensure no Netlify function integration)
- Modify: `netlify.toml` (add Worker URL as environment variable for build)
- Modify: `package.json` (verify scripts)

**Interfaces:**

- Consumes: Worker URL from Task 3
- Produces: Production build deploying to Netlify/Pages with Worker endpoint configured

- [ ] **Step 1: Verify astro.config.mjs**

No `@astrojs/netlify` adapter needed (static output). Current config should work.

- [ ] **Step 2: Add Worker URL to Netlify environment**

In Netlify dashboard → Site settings → Environment variables:

- `WORKER_SUBMIT_ORDER_URL` = deployed Worker URL from Task 3

- [ ] **Step 3: Test production build locally**

```bash
npm run build
npm run preview
```

Test full flow on preview URL.

- [ ] **Step 4: Deploy to Netlify**

Push to main branch, verify Netlify deploy succeeds.

- [ ] **Step 5: Test production flow**

Visit live site, place test order, verify Telegram notification.

- [ ] **Step 6: Commit**

```bash
git commit -m "chore: configure production Worker URL"
```

---

### Task 10: Documentation and Cleanup

**Files:**

- Create: `docs/architecture.md` (updated architecture diagram)
- Modify: `README.md` (update setup instructions)
- Modify: `AGENTS.md` (if needed)

**Interfaces:**

- None — documentation only

- [ ] **Step 1: Update README.md**

- Update "Order Emails" section → "Order Notifications via Telegram"
- Add Cloudflare Worker setup section
- Update local dev instructions (run `npm run dev` + `cd worker && npm run dev`)

- [ ] **Step 2: Create docs/architecture.md**

```markdown
# Architecture Overview

## Frontend (Astro + Tailwind)

- Static pages: Home, Products, Product Detail, Cart (with embedded checkout)
- nanostores for cart/checkout state (localStorage persisted)
- Islands: Header, CartDrawer, Product interactions

## Backend (Cloudflare Worker)

- POST /api/submit-order — validates order, sends to Telegram
- Shared validation logic in `shared/validation.ts`

## Notifications

- Telegram Bot → private chat/channel
- Format: HTML message with order details
- Optional: payment slip as document attachment

## Deployment

- Frontend: Netlify (static)
- Worker: Cloudflare Workers (free tier)
```

- [ ] **Step 3: Verify no dead code**

Search for imports of deleted files, unused Netlify references.

- [ ] **Step 4: Final commit**

```bash
git add docs/ README.md
git commit -m "docs: update architecture and setup docs"
```

---

## Summary

**Pages reduced:** 8 → 4 (Home, Products index, Product detail, Cart-with-checkout)
**Backend:** Netlify Functions + Netlify Email API → Cloudflare Worker + Telegram Bot (both free tiers)
**Shared logic:** Extracted to `shared/` package for type-safe reuse
**Cart/Checkout UX:** Single drawer with stepper state, no page navigation during checkout
**Order confirmation:** Inline in drawer, clears cart on success

**Estimated effort:** 10 tasks × ~30-60 min each = 5-10 hours total
