---
name: Kalye Noir
description: Manila streetwear printed, not extruded — a screen-print room on cream paper stock.
colors:
  registration-red: '#c8202a'
  paper-stock: '#f4ede2'
  ink-black: '#111110'
  densitometer-gray: '#6d6459'
  plate-line: '#e2d8c8'
typography:
  display:
    fontFamily: 'Anton, Impact, system-ui, sans-serif'
    fontSize: 'clamp(2.25rem, 6vw, 6rem)'
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: '-0.025em'
  headline:
    fontFamily: 'Anton, Impact, system-ui, sans-serif'
    fontSize: 'clamp(2.25rem, 4vw, 3rem)'
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: '-0.025em'
  title:
    fontFamily: '"Barlow Condensed", Archivo, system-ui, sans-serif'
    fontSize: '0.8125rem'
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: '0.12em'
  body:
    fontFamily: 'Archivo, system-ui, Segoe UI, Helvetica Neue, Arial, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: '"Barlow Condensed", Archivo, system-ui, sans-serif'
    fontSize: '0.6875rem'
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: '0.28em'
rounded:
  square: '0px'
  tab-edge: '6px'
  badge: '9999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '16px'
  lg: '24px'
  xl: '40px'
  section: '56px'
components:
  button-primary:
    backgroundColor: '{colors.ink-black}'
    textColor: '{colors.paper-stock}'
    rounded: '{rounded.square}'
    padding: '12px 24px'
    typography: '{typography.label}'
  button-primary-hover:
    backgroundColor: '{colors.registration-red}'
    textColor: '{colors.paper-stock}'
  button-invert:
    backgroundColor: '{colors.paper-stock}'
    textColor: '{colors.ink-black}'
    rounded: '{rounded.square}'
    padding: '12px 24px'
    typography: '{typography.label}'
  button-invert-hover:
    backgroundColor: '{colors.registration-red}'
    textColor: '{colors.paper-stock}'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.paper-stock}'
    rounded: '{rounded.square}'
    padding: '12px 24px'
    typography: '{typography.label}'
  button-ghost-hover:
    backgroundColor: '{colors.paper-stock}'
    textColor: '{colors.ink-black}'
  chip-variant:
    backgroundColor: 'transparent'
    textColor: '{colors.ink-black}'
    rounded: '{rounded.square}'
    padding: '8px 12px'
  chip-variant-selected:
    backgroundColor: '{colors.ink-black}'
    textColor: '{colors.paper-stock}'
  field:
    backgroundColor: 'transparent'
    textColor: '{colors.ink-black}'
    rounded: '{rounded.square}'
    padding: '12px 16px'
  brand-tab:
    backgroundColor: '{colors.registration-red}'
    textColor: '{colors.paper-stock}'
    rounded: '{rounded.tab-edge}'
    padding: '20px 10px'
    typography: '{typography.label}'
---

# Design System: Kalye Noir

## Overview

**Creative North Star: "The Kalye Print Room"**

Kalye Noir is a screen-print room running after hours: cream stock on the table, ink still wet, one red registration mark per sheet. The interface *is* the paper. Surfaces are flat stock and are never panels floating above it — separation comes from a hairline rule or a barely-tinted band, the way a printer divides a sheet rather than a card. Nothing is extruded. Nothing glows.

The density is studio-clean editorial. One idea per band, generous cream space around it, and the type carries the whole load: Anton for the shout, Barlow Condensed for every label and control, Archivo for the single lowercase voice in the system. The artwork does the selling — posters and product photography sit at full width on white grounds with nothing laid over them, no badges, no gradient scrims, no "shop now" pasted on the print.

The system refuses a second accent, paper textures that pretend to be linen, and any depth that isn't a state change. Restraint is what makes the red land: it appears on maybe two elements per screen, and the eye goes straight to it every time.

**Key Characteristics:**
- Flat paper surfaces divided by hairlines and 8% tonal bands, never by cards.
- Exactly one accent — registration red — on under 5% of any given screen.
- Squared corners throughout; the only curves are the cart badge and the outer edge of the reviews tab.
- Three faces with one job each: Anton displays, Barlow Condensed labels and controls, Archivo reads.
- The artwork leads. Photography sits on a pure white ground with no decoration on top of it.
- One authored motion per page (a staggered rise), plus transform-only hover states.
- Type case is a system rule, not a style choice: display and labels are uppercase, body is the only lowercase.

## Colors

A warm cream stock, one near-black ink, and a single registration red — the palette of a two-colour press plus paper.

### Primary
- **Registration Red** (#c8202a): The only accent. It marks the thing to notice and nothing else — the marquee band, the hover state of every button and link, the active star row, the corner rule over a poster on hover, the reviews tab. Used on fewer than 5% of the pixels in any viewport.

### Neutral
- **Paper Stock** (#f4ede2): The ground for every page, form field and panel. Also the foreground wherever ink is the surface.
- **Ink Black** (#111110): All body and display text, the primary button fill, and the 2px rules that set a section's edge. Subdued text on an ink ground is paper at partial opacity over whatever is beneath, never a second gray.
- **Densitometer Gray** (#6d6459): Secondary text only — meta lines, variants, breadcrumb crumbs, field labels. Measured at 4.98:1 on paper stock, so there is very little headroom: do not lighten it.
- **Plate Line** (#e2d8c8): The hairline. Every divider, field border, chip outline and grid rule. At 20% over paper stock it becomes the tonal band that alternates sections.

### Named Rules
**The One Mark Rule.** Registration red is a registration mark, not a theme color. If a screen needs a second red element to feel finished, the layout is unfinished.

**The Paper Rule.** Every surface is paper stock. Pure white (#ffffff) exists in exactly one place — under product photography — because a white ground is what the shirt was shot on, not a UI surface.

## Typography

**Display Font:** Anton (with Impact, system-ui fallback)
**Body Font:** Archivo (with system-ui, Segoe UI, Helvetica Neue, Arial fallback)
**Label/Mono Font:** Barlow Condensed — used for every label, control, nav item, meta line and button.

**Character:** A poster face over a workhorse grotesque, mediated by a condensed signage face. Anton is the print; Barlow Condensed is the studio's hand-lettered labelling; Archivo is the one voice that speaks in sentences.

### Hierarchy
- **Display** (400, `clamp(2.25rem, 6vw, 6rem)`, line-height 0.88): Page and hero headlines only, always uppercase via the `.display` class. The 0.88 leading is deliberate — the caps stack tight like set type.
- **Headline** (400, `2.25rem` → `3rem`): Section headings inside a page ("The drop", "Kalye's Tee").
- **Title** (600, `0.8125rem`, tracking 0.12em, uppercase): Product names in cart lines, drawer lines and checkout summaries. Never larger than 14px.
- **Body** (400, `1rem`, line-height 1.6): Product blurbs and explanatory paragraphs, held to a `max-w-md`/`max-w-prose` measure. Sets in ink black for primary copy and densitometer gray when subordinate.
- **Label** (500, `0.6875rem`, tracking 0.28em, uppercase): The `.label` and `.meta` classes. Buttons, field labels, breadcrumbs, captions, table headers, everything structural.

### Named Rules
**The Caps Rule.** Display and labels are uppercase; body is the only lowercase. A sentence in Anton is a bug, and a caps body paragraph is a bug.

**The Tracking Rule.** Tracking is a function of case, never of taste: 0.28em on 11px labels, 0.12–0.14em on 13px product titles, 0.24em on buttons, and a floor of −0.025em on display. Nothing goes past −0.04em.

## Layout

A single container class, `.wrap`, sets the page: `max-width: 1280px` centred with `16px / 24px / 32px` gutters at the `sm` / `lg` breaks. Content never escapes it, including full-bleed bands — the band's background bleeds, its contents stay in the wrap.

Pages alternate between paper stock and an `8%` plate-line band to separate major sections, and every section is closed by a hairline rule rather than a card. Vertical rhythm is `56px` on phones and `96px` at `lg` (`py-14 lg:py-24`); interior stacks run on a `4 / 8 / 16 / 24 / 40px` scale, with `40px` reserved for the gap between a section heading and its content.

Two structural patterns carry most screens:
- **The split** — a content column against a fixed-width sidebar (`1fr / 20rem` on checkout) that sticks below the header at `lg` (`lg:sticky lg:top-24`).
- **The print wall** — a 2-up grid on phones and 3-up at `md`, with one tile deliberately offset (`lg:mt-16`) so the row never reads as a table of equal cards.

### Named Rules
**The Band Rule.** Separate with a hairline or an 8% band. Never with a card, never with a nested container.

**The Breaks Rule.** One breakpoint set — `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Mobile is the design, not the fallback; every layout is authored at 360px first.

## Elevation & Depth

**There is no shadow at rest.** Depth is entirely planar, which is the point: this is paper. A surface's importance is set by its order in the stack — paper stock, then a plate-line band, then ink black — never by lifting it off the page. The primary button reads as pressed because it is a 2px ink border around solid ink, not because it floats.

Two exceptions exist and both are overlays that genuinely sit above the page: the cart drawer and the reviews panel (`0 25px 50px -12px rgba(0,0,0,0.25)`), and the fixed reviews tab, which carries a one-off lift.

### Shadow Vocabulary
- **Overlay** (`0 25px 50px -12px rgba(0, 0, 0, 0.25)`): The cart drawer and the reviews slide-over, and nothing else.
- **Poster** (`0 40px 80px -40px rgba(0, 0, 0, 0.9)`): The hero poster on the dark ground, where a physical sheet catching the room light is the intent.
- **Tab** (`0 14px 35px -14px rgba(0, 0, 0, 0.65)`): The fixed reviews tab only.

### Named Rules
**The Flat-At-Rest Rule.** Everything is flat until it is above the page. A panel, card or summary block that gains a shadow has taken on a state it did not earn.

**The One Or The Other Rule.** Declare separation once — a hairline *or* a band *or* ink. A bordered block with a shadow underneath is the ghost card and does not belong in this system.

## Shapes

Squared. The corner radius is `0` on every button, field, chip, panel, tile and band, which makes the system read as cut rather than moulded. The only curves in the whole interface are the cart count badge (`9999px`) and the outer edge of the fixed reviews tab (`6px 0 0 6px`), both of which exist because a tab and a badge are physical objects with a rounded edge.

Borders carry the form language: `1px` plate line for fields, hairlines, chips and grid rules; `2px` ink for buttons and for the rule under a section heading. Nothing is clipped, masked or rounded, and no element uses a border-left accent stripe.

Signature geometry, all of it screen-print derived: a barcode built from a `repeating-linear-gradient` at 1px/3px/5px steps; a rotated square as the marquee separator; 1px red rule marks standing vertically at a page edge; and a red rule that wipes left-to-right across a poster on hover (`width: 0 → 100%`).

### Named Rules
**The Squared Rule.** Radius is 0 unless the element is a badge or a tab edge. A rounded card is a different brand.

**The Cut Rule.** Geometry comes from print: barcodes, rules, registration marks, rotated squares. Anything that would read as a browser default — a pill, a rounded panel, a glow — is replaced with a cut or a rule.

## Components

### Buttons
- **Shape:** Squared (`border-radius: 0`), 2px ink border, `12px 24px` padding, inline-flex with an 8px gap for an icon.
- **Primary:** Solid ink (`#111110`) with paper stock text. The single most important action on a screen, and there is only ever one.
- **Invert:** Paper stock fill with ink text — the primary inverted, for use on the dark hero.
- **Ghost:** Transparent with a `paper/40` border and paper text, only on dark grounds, where it must never compete with the invert button beside it.
- **Hover / Focus:** Registration red replaces both border and fill on hover — the whole button flips, no tint. Focus is the global ring: 2px registration red at a 2px offset.
- **Type:** Every button is `.btn` plus Barlow Condensed 11–12px, semibold, uppercase, 0.24em tracking.

### Chips (variant pills)
- **Style:** Transparent with a 1px plate-line border, ink text, `8px 12px`, squared. Size and (historically) colour options on the product page.
- **State:** Selected flips to solid ink with paper text and an ink border — the same mechanism as the primary button, so the language stays consistent. Out of stock sits at 40% opacity and is `disabled`, never hidden.

### Cards / Containers
- **Corner Style:** None.
- **Background:** Paper stock, or an `8%` plate-line band when it needs to alternate.
- **Shadow Strategy:** None at rest — see Elevation & Depth.
- **Border:** Hairline plate line, or 2px ink when the block leads a section.
- **Internal Padding:** `24px` on phones, `36px` at `sm` for boxed panels (the incident-report form), `20px` for overlay panel bodies.

### Inputs / Fields
- **Style:** Transparent background over paper stock, 1px plate-line border, squared, `12px 16px`, 14px Archivo.
- **Focus:** The border shifts to ink black. Where a field also carries `outline-none`, this is the *only* focus signal — 1px is thin, and the intended treatment is the global 2px registration ring on top of it.
- **Labels:** Always a real `<label>` with a `.label`-styled span in plate-line-adjacent densitometer gray. Never a placeholder standing in for a label.

### Navigation
- **Style:** Sticky at the top (`z-40`), 64px tall, `paper/95` with a backdrop blur and a hairline under it.
- **Type:** Barlow Condensed 11px semibold uppercase at 0.26em tracking, densitometer gray, flipping to registration red on hover.
- **Active state:** None — with three destinations, the current page is not marked. Below `lg` the nav collapses into a native `<details>` disclosure rather than a JS menu.

### Signature: Product tile
Product photography sits on a pure white ground (`#ffffff`) with `8px` of padding, squared, and no border. The white is the studio backdrop, not a surface — on the cart, in the drawer and on the product page, the same tile appears at three sizes.

### Signature: Reviews tab and wall
A fixed vertical tab at the right edge — registration red, paper text, `writing-mode: vertical-rl`, a 6px outer radius, flipping to ink on hover, opening a slide-over panel. At the foot of the cart, the wall: an `8%` band with a hairline on top, the star row in registration red at 0.24em tracking, and a 2-up/4-up grid of square customer photos that scale 1.05 under a red rule wipe on hover. Empty is a first-class state — no invented counts, no placeholder reviews.

## Do's and Don'ts

### Do:
- **Do** separate with a hairline (`1px #e2d8c8`) or an `8%` band, and never with a card or a nested container.
- **Do** keep registration red under 5% of a viewport, and let hover be the moment it appears.
- **Do** set every label, button, nav item and meta line in Barlow Condensed uppercase at ⊃ 0.12em tracking.
- **Do** keep 0 radius on buttons, fields, chips and panels, and reserve `9999px` for the cart badge alone.
- **Do** hold product photography on a pure white ground with nothing layered over it.
- **Do** author around four breakpoints only (`sm 640`, `md 768`, `lg 1024`, `xl 1280`) and check every layout at 360px.
- **Do** keep subdued and meta copy at densitometer gray or darker — it measures 4.98:1 on paper stock and has almost no headroom.
- **Do** treat the empty state as a designed state: an honest zero with a way forward, never a fabricated number.

### Don't:
- **Don't** introduce a second accent, a gradient, a glass panel or a glow. The press has two inks and the paper is the third colour.
- **Don't** publish a number the brand can't stand behind — prices, stock counts, delivery promises or review totals. This is a product-level commitment, not just a visual one.
- **Don't** put a shadow on a bordered block, or add a border to a shadowed one.
- **Don't** set a sentence in Anton or a paragraph in caps; case is part of the system.
- **Don't** use `text-paper/45` or lighter on the ink ground — it measures 4.05:1 and fails AA.
- **Don't** ship a control below a 44px touch target, and don't let a fixed element cover content at 360px.
- **Don't** publish a red "sale"-style token name or a "browse the sale" line — nothing on this site is ever discounted, and the token is named `registration-red` precisely so nobody reintroduces the claim.
