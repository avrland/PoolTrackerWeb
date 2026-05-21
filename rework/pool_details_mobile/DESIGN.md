---
name: Fluid Velocity
colors:
  surface: '#faf8ff'
  surface-dim: '#d8d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#ecedf9'
  surface-container-high: '#e6e7f3'
  surface-container-highest: '#e1e2ee'
  on-surface: '#191b24'
  on-surface-variant: '#424655'
  inverse-surface: '#2d3039'
  inverse-on-surface: '#eff0fc'
  outline: '#727787'
  outline-variant: '#c2c6d8'
  surface-tint: '#0057ce'
  primary: '#0057cd'
  on-primary: '#ffffff'
  primary-container: '#0d6efd'
  on-primary-container: '#ffffff'
  inverse-primary: '#b1c5ff'
  secondary: '#9e4300'
  on-secondary: '#ffffff'
  secondary-container: '#fe761c'
  on-secondary-container: '#5c2400'
  tertiary: '#405ba3'
  on-tertiary: '#ffffff'
  tertiary-container: '#5974be'
  on-tertiary-container: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b1c5ff'
  on-primary-fixed: '#001946'
  on-primary-fixed-variant: '#00419e'
  secondary-fixed: '#ffdbcb'
  secondary-fixed-dim: '#ffb691'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783100'
  tertiary-fixed: '#dae1ff'
  tertiary-fixed-dim: '#b3c5ff'
  on-tertiary-fixed: '#001849'
  on-tertiary-fixed-variant: '#26438a'
  background: '#faf8ff'
  on-background: '#191b24'
  surface-variant: '#e1e2ee'
  occupancy-low: '#198754'
  occupancy-medium: '#FFC107'
  occupancy-high: '#DC3545'
  surface-subtle: '#F6F9FF'
  chart-line-1: '#0D6EFD'
  chart-line-2: '#FF771D'
  chart-line-3: '#20C997'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.04em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
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
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The brand personality is **Dynamic, Precise, and Vital**. It bridges the gap between civic utility and athletic performance, ensuring that users can make quick, informed decisions about their leisure time. The target audience includes daily swimmers, families planning weekend outings, and fitness enthusiasts who value time efficiency.

The design style is **Corporate / Modern** with a **High-Contrast** edge. It utilizes generous whitespace and a systematic grid to handle data-heavy charts, while using bold color accents and refined geometry to evoke a "Sports Tech" aesthetic. The interface should feel like a performance dashboard—reliable, fast, and highly legible.

## Colors

The palette is anchored by a vibrant **Athletic Blue** and a high-energy **Action Orange**. 

- **Primary (Blue):** Used for primary actions, navigation branding, and "active" swimming facility states.
- **Secondary (Orange):** Used for high-visibility accents, countdowns, and performance warnings.
- **Tertiary (Deep Navy):** Reserved for high-level headings and structural text to provide maximum contrast against the white background.
- **Status Colors:** A semantic scale (Green/Yellow/Red) is used exclusively for occupancy percentages to provide immediate cognitive feedback.
- **Surface:** A very light blue-tinted gray (`#F6F9FF`) is used for the page background to reduce eye strain compared to pure white, while keeping card surfaces pure white.

## Typography

This design system uses **Inter** exclusively to achieve a clean, systematic, and highly legible look across all density levels. 

The hierarchy is driven by weight and capitalization:
- **Large Data Points:** Current occupancy numbers use the `data-display` style to act as the primary visual anchor of facility cards.
- **Section Headers:** Use `headline-sm` with uppercase styling to create clear horizontal divisions.
- **Mobile Adaptation:** Headlines scale down on mobile to maintain information density without overwhelming the viewport.

## Layout & Spacing

The design system utilizes a **12-column Fluid Grid** for desktop and a **Single Column Stack** for mobile.

- **Desktop:** Facilities are displayed in a responsive grid (3 columns at 1200px, 2 columns at 992px).
- **Mobile:** Elements span the full width minus the 16px side margins. 
- **Vertical Rhythm:** A strict 8px-based spacing system (`stack-sm`, `stack-md`, `stack-lg`) ensures consistent grouping of related data points within facility cards.
- **Density:** High density is preferred for data tables and charts, while larger margins are used to separate major sections (Instructions vs. Real-time Data).

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** Surface-subtle (`#F6F9FF`).
- **Level 1 (Cards/Tiles):** Pure white background with a 1px solid border (`#E0E4EC`). This creates a flat, professional "dashboard" feel without the visual clutter of heavy shadows.
- **Level 2 (Active/Hover):** When a user interacts with a chart or facility card, a soft, neutral shadow (10% opacity, 12px blur) is applied to provide tactile feedback.
- **Overlays:** Modals for opening hours use a semi-transparent backdrop blur (10px) to maintain context while focusing the user's attention.

## Shapes

The shape language is **Rounded**, reflecting the fluidity of water and the approachability of a community service.

- **Standard Elements:** 0.5rem (8px) radius for facility cards and input fields.
- **Large Elements:** 1.5rem (24px) radius for hero sections or prominent mobile navigation bars.
- **Buttons:** Fully rounded "pill" shapes for primary actions to distinguish them from the rectangular layout of the data cards.
- **Dividers:** Hairline strokes (1px) in a light neutral color used to separate time slots in scheduling tables.

## Components

### Buttons
- **Primary:** Pill-shaped, Solid Blue background, White text.
- **Secondary:** Pill-shaped, Ghost style (Blue border, transparent background).
- **Utility:** Small, square-rounded buttons for chart controls (e.g., zoom, full-screen).

### Facility Cards (Tiles)
- **Header:** Title on the left, occupancy % on the right (colored by status).
- **Body:** Large `data-display` number for current count, paired with a small progress bar.
- **Footer:** Secondary metadata (Address, Temperature) in `body-sm` with icon descriptors.

### Data Visualization
- **Charts:** Line charts with smooth interpolation (Bezier curves). Use the `chart-line` palette for multiple facilities.
- **Indicators:** Circular progress rings around occupancy numbers to provide a secondary visual cue for capacity.

### Status Chips
- Small, rounded-sm badges used for "Online" AI tracking or "Closed" facility status. High-contrast text on low-saturation background (e.g., Dark Green text on Light Green background).

### Input Fields
- Underlined or outlined with 8px rounded corners. Focus states must use a 2px Primary Blue border.