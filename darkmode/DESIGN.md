---
name: Fluid Velocity Dark
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#181c23'
  surface-container: '#1c2027'
  surface-container-high: '#272a32'
  surface-container-highest: '#32353d'
  on-surface: '#e0e2ec'
  on-surface-variant: '#c1c6d6'
  inverse-surface: '#e0e2ec'
  inverse-on-surface: '#2d3038'
  outline: '#8b90a0'
  outline-variant: '#414754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e68'
  primary-container: '#4a8eff'
  on-primary-container: '#00285c'
  inverse-primary: '#005bc0'
  secondary: '#b7c8e1'
  on-secondary: '#213145'
  secondary-container: '#3a4a5f'
  on-secondary-container: '#a9bad3'
  tertiary: '#ffb68b'
  on-tertiary: '#522300'
  tertiary-container: '#e4700e'
  on-tertiary-container: '#481e00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbc8'
  tertiary-fixed-dim: '#ffb68b'
  on-tertiary-fixed: '#321300'
  on-tertiary-fixed-variant: '#743400'
  background: '#10131a'
  on-background: '#e0e2ec'
  surface-variant: '#32353d'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style
The design system is a high-performance, dark-mode aesthetic designed for speed and precision. It targets a sophisticated audience that values a "pro" feel—think developer tools, fintech dashboards, or high-end automotive interfaces. 

The style merges **Modern Minimalism** with **Glassmorphism**. It evokes a sense of technical excellence and "sexy" industrial design. By using deep midnight tones contrasted with vibrant, luminescent accents, the UI feels expansive and immersive. The emotional response is one of calm control, high velocity, and premium quality.

## Colors
The palette is rooted in a deep midnight charcoal (`#0B0E14`), providing a void-like canvas that minimizes eye strain and maximizes depth. 

- **Primary**: A tuned Vibrant Blue (`#3385FF`). This is slightly desaturated from a pure neon to ensure it doesn't "vibrate" against the dark background while maintaining high visibility.
- **Surface Tiers**: We use a layered approach. The base is `#0B0E14`. Surface containers use `#161B22`.
- **Interactions**: Hover states should utilize a subtle glow or "bloom" effect rather than simple lighten/darken shifts.
- **On-Surface**: Text uses a range of off-whites (Slate-50 to Slate-400) to maintain hierarchy without the harshness of pure white.

## Typography
This design system utilizes **Inter** exclusively to lean into a systematic, utilitarian aesthetic. 

The typographic hierarchy relies heavily on weight and tracking. Display and Headline styles use tighter letter spacing (`-0.02em`) to feel modern and "locked-in." Labels use uppercase with slight letter spacing to differentiate themselves from body text. Use `Slate-400` for secondary body text to ensure clear information architecture through contrast.

## Layout & Spacing
The layout follows a **Fluid Grid** model based on an 8px square system. 

- **Desktop**: 12-column grid with 24px gutters. Margins are generous (40px) to allow the "Glass" containers to breathe.
- **Mobile**: 4-column grid with 16px gutters and 16px margins.
- **Rhythm**: Vertical rhythm is strictly enforced in multiples of 8. Components like cards should use 24px internal padding (`stack-lg`) to maintain a premium, spacious feel.

## Elevation & Depth
Depth is created through **Glassmorphism** and **Tonal Layering** rather than traditional shadows.

1.  **Backdrop Blur**: All floating panels, modals, and navigation bars must use a 12px-20px blur radius with a semi-transparent surface color (`rgba(22, 27, 34, 0.7)`).
2.  **Inner Glow**: Instead of drop shadows, use a 1px inner border (stroke) with a light opacity (`white` at 0.1) on the top and left edges to simulate a light source hitting the "glass" edge.
3.  **Tonal Stacking**: Elements closer to the user are lighter in color. 
    - Level 0: `#0B0E14` (Background)
    - Level 1: `#161B22` (Cards/Content)
    - Level 2: `#1C2128` (Inputs/Popovers)

## Shapes
The shape language is defined by **Round Eight** (`roundedness: 2`). This provides a 0.5rem (8px) base radius for buttons and inputs, and up to 1.5rem (24px) for large cards.

This radius strikes a balance between the precision of sharp corners and the friendliness of fully rounded shapes. It feels architectural and intentional. Interactive elements like checkboxes and radio buttons should maintain this consistent rounding rather than being fully circular.

## Components
Consistent styling instructions for the core library:

- **Buttons**: Primary buttons are solid `#3385FF` with white text. Secondary buttons use a "Ghost" glass style: a 1px border of `#30363D` with a subtle background hover fill.
- **Inputs**: Use the `#1C2128` surface color. On focus, the border transitions to Primary Blue with a subtle 4px outer "bloom" (spread shadow) of the same color at 20% opacity.
- **Cards**: Must include a 1px stroke of `#30363D`. For high-priority cards, add a very subtle linear gradient (Top-Left to Bottom-Right) from a slightly lighter surface tint to the base surface color.
- **Chips**: Use a subtle blue tint for active states (`rgba(51, 133, 255, 0.1)`) with primary-colored text.
- **Lists**: Items are separated by 1px dividers of `#1C2128`. Hover states should use a slight background tint rather than a border change.
- **Navigation**: Always fixed at the top or side with a heavy backdrop blur (20px) to maintain the sense of fluid velocity as content scrolls beneath it.