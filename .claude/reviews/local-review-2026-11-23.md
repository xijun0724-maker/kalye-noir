# Local Code Review: kalye-noir (2026-11-23)

**Reviewed**: 2026-11-23  
**Branch**: main (uncommitted changes)  
**Decision**: **APPROVE** with comments  

---

## Summary

This is a substantial architectural refactor migrating order processing from Netlify Functions to Cloudflare Workers, extracting shared validation logic into a workspace package (`kalye-noir-shared`), and consolidating the checkout flow into the cart page. All validation commands pass (build, type-check, tests). The changes are well-structured with strong security practices: server-side order recalculation, magic-byte file verification, honeypot spam protection, and CSRF origin verification.

---

## Findings

### CRITICAL
None.

### HIGH
None.

### MEDIUM

| # | File | Line(s) | Issue | Suggested Fix |
|---|------|---------|-------|---------------|
| 1 | `worker/src/index.ts` | 151-155 | CORS allows all origins (`Access-Control-Allow-Origin: *`). While the endpoint validates the `Origin` header for CSRF, the permissive CORS header could allow credentialed requests from unexpected origins in some edge cases. | Restrict `Access-Control-Allow-Origin` to the known production domain(s) or echo the verified origin back. |
| 2 | `src/pages/cart.astro` | 371 | Unused variable `grandTotal` declared but never used (TypeScript hints this). | Remove the unused destructuring or use the variable. |
| 3 | `src/pages/cart.astro` | ~1165 lines | File exceeds 800-line guideline. Contains embedded checkout form, cart rendering, province selection, payment handling, and form submission logic. | Split into smaller components: `CheckoutForm.astro`, `CartSummary.astro`, `ProvinceSelector.astro`, `PaymentMethodToggle.astro`. |
| 4 | `worker/src/telegram.ts` | 99 | Returns hardcoded `messageId: 1` instead of actual last message ID from Telegram response. | Track and return the actual `message_id` from the last successful `sendMessage` call. |

### LOW

| # | File | Line(s) | Issue | Suggested Fix |
|---|------|---------|-------|---------------|
| 5 | `worker/src/index.ts` | 74-78 | Content-length check uses `ORDER_REQUEST_MAX_BYTES` comment but hardcodes `5 * 1024 * 1024`. | Import `ORDER_REQUEST_MAX_BYTES` from `kalye-noir-shared/validation` for consistency. |
| 6 | `worker/src/telegram.ts` | 65-96 | Fallback from `sendDocument` to `sendPhoto` on failure could silently succeed with wrong API if document fails for non-image reasons. | Check file type before deciding which API to call, or log the specific failure reason. |
| 7 | `src/lib/orderSubmission.ts` | — | Re-export file adds indirection; could import directly from `kalye-noir-shared/validation` in consumer files. | Consider removing this re-export unless it serves a future abstraction purpose. |
| 8 | `src/data/shipping.ts` | — | `FREE_SHIPPING_THRESHOLD = 3` is a magic number without context comment. | Add comment explaining business rationale (e.g., "Free shipping at 3+ items to encourage bundle purchases"). |
| 9 | `src/stores/cartStore.ts` | — | `shippingZoneId` and `shippingProvince` atoms are separate but related; no validation that they match. | Consider a derived atom or validation that ensures selected province belongs to the selected zone. |

---

## Validation Results

| Check | Result |
|-------|--------|
| Type check (`npm run type-check`) | **Pass** (1 hint: unused `grandTotal` in cart.astro:371) |
| Build (`npm run build`) | **Pass** (3.72s, 9 pages) |
| Tests (`npm test` in worker) | **Pass** (12 tests, all passing) |
| Tests (`npm test` in root) | **Pass** (6 tests passing) |
| Lint | Not configured (no ESLint/Prettier in root or worker) |

---

## Files Reviewed

### Application Code (Modified)
- `src/pages/cart.astro` — Consolidated checkout page (~1165 lines)
- `src/lib/orderSubmission.ts` — Thin re-export from shared validation
- `src/config/worker.ts` — Worker URL configuration
- `src/data/catalog.ts` — Product catalog (3 products, 5 sizes each)
- `src/data/shipping.ts` — Shipping zones and fees
- `src/stores/cartStore.ts` — nanostores persistent cart state

### Worker Code (Added/Modified)
- `worker/src/index.ts` — Cloudflare Worker entry point (CORS, CSRF, validation, Telegram)
- `worker/src/telegram.ts` — Telegram Bot integration (chunked messages, document/photo fallback)
- `worker/src/validation.ts` — Re-export from shared validation
- `worker/src/index.test.ts` — 12 comprehensive tests (validation, security, file signatures)
- `worker/package.json` — Worker dependencies and scripts

### Shared Package (External Dependency)
- `kalye-noir-shared/validation` — Core validation logic (used via workspace:* dependency)

### Configuration
- `.env.example` — Environment variables template
- `.github/agents/*.agent.md` — Agent definitions
- `.github/skills/impeccable/*` — Skill system (large addition, not application code)

---

## Security Assessment

**Strengths:**
- Server-side order recalculation from catalog/province data (client totals not trusted)
- Magic-byte file signature verification (PNG, JPEG, WebP, PDF)
- Honeypot field on checkout form for spam protection
- CSRF protection via `Origin` header verification
- Content-length limit (5MB) and content-type validation (multipart/form-data)
- Payment reference validation (13-digit for GCash/Maya)
- File size limit (4MB) enforced on both client and server

**Areas to Monitor:**
- CORS `*` origin (see MEDIUM #1)
- Telegram bot token and chat ID must be kept secret (stored in Cloudflare Worker secrets)
- No rate limiting on `/api/submit-order` endpoint (consider Cloudflare Workers rate limiting rules)

---

## Recommendation

**APPROVE** with comments.

The refactor is well-executed with strong security foundations. The MEDIUM issues are code quality/maintainability concerns, not bugs or vulnerabilities. The LOW issues are minor polish items.

**Priority fixes before next release:**
1. Restrict CORS origin in worker (MEDIUM #1)
2. Remove unused `grandTotal` variable (MEDIUM #2)
3. Consider splitting `cart.astro` into components (MEDIUM #3)

**Nice-to-have:**
- Address LOW findings at convenience
- Add ESLint/Prettier for consistent code style
- Consider adding rate limiting on the order submission endpoint