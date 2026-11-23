---
name: Kalye Noir
description: Manila screen-print streetwear on cream paper.
dial: 'ENERGY 2 / RHYTHM 2 / MOTION 2'
colors:
  registration-red: '#c8202a'
  paper-stock: '#f4ede2'
  ink-black: '#111110'
  densitometer-gray: '#6d6459'
  plate-line: '#e2d8c8'
  control-line: '#8d8073'
typography:
  display:
    fontFamily: 'Anton, Impact, system-ui, sans-serif'
    fontSize: 'clamp(2.25rem, 6vw, 6rem)'
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
  button-primary: { backgroundColor: '{colors.ink-black}', textColor: '{colors.paper-stock}', rounded: '{rounded.square}' }
  field: { backgroundColor: 'transparent', textColor: '{colors.ink-black}', rounded: '{rounded.square}' }
  brand-tab: { backgroundColor: '{colors.registration-red}', textColor: '{colors.paper-stock}', rounded: '{rounded.tab-edge}' }
---

# Design System: Kalye Noir

<!-- impeccable:design-map -->
Name: Kalye Noir
Colors: registration-red #c8202a, paper-stock #f4ede2, ink-black #111110, densitometer-gray #6d6459, plate-line #e2d8c8, control-line #8d8073
Fonts: Anton (display, headline); Barlow Condensed (title, label); Archivo (body)
Spacing: xs 4px, sm 8px, md 16px, lg 24px, xl 40px, section 56px
Radius: square 0px, tab-edge 6px, badge 9999px
North Star: "The Kalye Print Room"
Full: .impeccable/design-full.md
