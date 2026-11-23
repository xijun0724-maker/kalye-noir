# Architecture Overview

## Frontend (Astro + Tailwind, static)

- Pages: Home, Products index, Product detail, Cart (with inline
  checkout), Contact, Incident report, 404.
- `nanostores` persistent atoms keep the cart, order note and selected
  shipping zone in `localStorage`.
- Islands: header cart button, cart rows + checkout form on `/cart`,
  PDP zoom and add-to-cart.
- Build output is static (`dist/`); no server runtime on Netlify.

## Backend (Cloudflare Worker)

- `POST /api/submit-order` — multipart form in, validation, Telegram
  out, `303` redirect to `/cart?success=1&ref=<ORDER_REF>` on success,
  JSON error with an actionable message otherwise.
- Only same-origin POSTs are accepted; `OPTIONS` preflight is answered
  for CORS.
- Worker code lives in `worker/src` (`index.ts`, `telegram.ts`);
  entry validation flows through the shared package below.

## Shared logic

- `shared/` is a local package (`kalye-noir-shared`, `file:` dependency
  in both the site and the Worker) holding `validation.ts`
  (`parseOrderSubmission`, `formatOrderDetails`, types),
  `shipping.ts` (zones, fee calculation, terms) and `catalog.ts`
  (products, prices, variants).
- The Astro site re-exports what it needs through
  `src/lib/orderSubmission.ts`, so both sides validate identically.

## Notifications

- Telegram Bot API → the owner's private chat/channel.
- The formatted order detail message is HTML and chunked at 4096
  characters.
- Optional GCash / Maya payment slips are forwarded as documents
  (photos as fallback).

## Payment

- No payment collection at checkout: Cash on Delivery by default, or
  manual GCash / Maya transfer with a 13-digit reference and optional
  slip upload. The Worker verifies payload size and file type/size
  limits before forwarding.

## Deployment

- Frontend: Netlify static build (`netlify.toml` → `dist/`).
- Worker: Cloudflare Workers free tier; secrets `BOT_TOKEN` and
  `CHAT_ID` via `wrangler secret put`.
- The site learns the Worker endpoint from `WORKER_SUBMIT_ORDER_URL`
  (Netlify env var, local `.env`, fallback in `src/config/worker.ts`).
