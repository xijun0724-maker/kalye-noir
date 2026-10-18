# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing Astro 4 site (Odyssey theme base), static build via Netlify. Cart is localStorage; orders post through a Netlify form. No backend, no live payment.

## Users

Manila / Philippine streetwear buyers — largely late-teens to early-thirties — who find the label through Facebook and Instagram promos. They shop on phones, message-first, and expect to confirm sizes, prices and payment in a reply rather than at a checkout counter.

## Product Purpose

Sell small-batch Manila streetwear: three heavyweight graphic tees. Success is a filled order request — cart contents plus contact and sizing — that the brand can follow up on.

## Positioning

"Classy Kalye" — street culture from Manila's streets (kalye) rendered with a designer's eye and a noir edge. Local, small-batch, made for late nights and early dreams. Neighboring drops copy the graphic; this one carries a whole identity program.

## Operating Context

- Orders run through the site form and through Facebook / Instagram promos in parallel.
- Pricing is established at ₱325 per print across all Batch 001 designs.
- Sizes S–2XL, black only.
- Payment methods supported: Cash On Delivery (COD) and instant GCash / Maya QR with slip upload.
- Garments are sourced small-batch (Taytay and Divisoria referenced in existing copy).

## Capabilities and Constraints

- Working: product browsing, size selection, localStorage cart with slide-in drawer, order form handoff with COD/GCash QR support, post-submit thank-you page.
- Confirmed pricing: ₱325 per tee; Delivery Parcel Express courier dispatch. Not to be invented: arbitrary discounts, fake stock counts, or fabricated customer testimonials.

## Brand Commitments

- Name: **Kalye Noir**. Established line mood: black garments, cream/ink poster art, a single registration red.
- Language already in use: "NASA KALYE NANGANGARAP", "MANILA NEVER SLEEPS", "LATE NIGHTS. EARLY DREAMS. REAL STREETS. REAL STORIES.", "STREET WEAR • MANILA", "NOT YOUR MYTH", "BEAUTY IN CHAOS / FEARED BY MANY / LEGENDS NEVER DIE", "EST. 2026", coordinates 14.5995° N — 120.9842° E.
- Three shirt designs: **KALYENOIR**, **MEDUSA**, **MANILA**.

## Evidence on Hand

Brand artwork lives in `Assets/` (dev-only); the versions the site builds from live in `src/assets/images/`:

- `design/kalyenoir-poster.jpg`, `design/medusa-poster.jpg`, `design/manila-poster.jpg` — the print posters
- `brand/tee-kalyenoir.png`, `brand/tee-medusa.png`, `brand/tee-manila.png` — tee front/back mockups

Batch 001 pricing is ₱325 per garment. Stock counts and customer review counts are not fabricated.

## Product Principles

1. The street is the brand: Manila specificity over generic streetwear.
2. Small-batch and local is the proof — show the real garments, not stock models.
3. Order-by-conversation: keep the path from looking to a sent request short and human.
4. The artwork is the salesperson; let the posters carry the storefront.
5. Never publish a number we cannot stand behind.

## Accessibility & Inclusion

Standard web expectations: keyboard-operable nav, cart and form; visible focus; body text ≥ 4.5:1 on the paper ground.
