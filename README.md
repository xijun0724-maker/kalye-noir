# Kalye Noir

Manila streetwear. An Astro storefront: editorial landing page, a catalogue of collections, product detail pages, a cart (drawer + full page), and an enquiry-based checkout.

No prices are shown on the site — every order is confirmed by message, so the cart and checkout collect the request rather than a payment.

## Stack

- [Astro](https://astro.build) (static output)
- Plain CSS design tokens (`src/styles/`) — no CSS framework
- Vanilla JS for the cart (`src/scripts/cart.js`), persisted in `localStorage`

## Structure

```
src/
  data/products.js        # products + collections (single source of truth)
  pages/
    index.astro           # landing
    products.astro        # catalogue
    products/[slug].astro # product detail
    cart.astro            # cart + checkout
  components/             # header, footer, cart drawer, buttons, ...
  layouts/Page.astro      # shell; loads the cart module on every page
  scripts/cart.js         # cart state, rendering, checkout sync
public/assets/images/brand/  # artwork used on the site
```

## Local development

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # output in dist/
npm run preview  # preview the build
```

## Deploy

Configured for Netlify via `netlify.toml` (`npm run build` → `dist/`). Connect the repo in Netlify and it deploys on push.

The checkout form posts to Netlify Forms (form name `order`, redirect to `/order-thank-you`), so form submissions appear under **Site → Forms** in the Netlify dashboard.

## Assets

Brand artwork lives in `public/assets/images/brand/`. The original working `Assets/` folder is not tracked.
