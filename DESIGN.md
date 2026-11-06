---
version: alpha
name: Forensics Dark System
description: A restrained, high-contrast dark product system with precise typography, soft borders, and one electric accent.
colors:
  primary: "#7170ff"
  secondary: "#e5e5e6"
  tertiary: "#9aa0a6"
  neutral: "#08090a"
  surface: "#0f1011"
  on-surface: "#f7f8f8"
  error: "#ff5a67"
  border: "#ffffff14"
  border-strong: "#ffffff1f"
  muted: "#8a9099"
  overlay: "#00000066"
typography:
  headline-display:
    fontFamily: "Inter Variable"
    fontSize: 72px
    fontWeight: 510
    lineHeight: 86px
    letterSpacing: -1.408px
    fontVariation: '"wght" 510'
  headline-lg:
    fontFamily: "Inter Variable"
    fontSize: 49px
    fontWeight: 510
    lineHeight: 72px
    letterSpacing: -1.584px
    fontVariation: '"wght" 510'
  headline-md:
    fontFamily: "Inter Variable"
    fontSize: 33px
    fontWeight: 510
    lineHeight: 40px
    letterSpacing: -0.24px
    fontVariation: '"wght" 510'
  headline-sm:
    fontFamily: "Inter Variable"
    fontSize: 22px
    fontWeight: 510
    lineHeight: 28px
    letterSpacing: 0px
    fontVariation: '"wght" 510'
  body-lg:
    fontFamily: "Inter Variable"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: -0.165px
  body-md:
    fontFamily: "Inter Variable"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: -0.165px
  body-sm:
    fontFamily: "Inter Variable"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: -0.08px
  label-lg:
    fontFamily: "Inter Variable"
    fontSize: 16px
    fontWeight: 510
    lineHeight: 24px
    letterSpacing: -0.12px
    fontVariation: '"wght" 510'
  label-md:
    fontFamily: "Inter Variable"
    fontSize: 14px
    fontWeight: 510
    lineHeight: 20px
    letterSpacing: -0.08px
    fontVariation: '"wght" 510'
  label-sm:
    fontFamily: "Inter Variable"
    fontSize: 12px
    fontWeight: 510
    lineHeight: 16px
    letterSpacing: 0px
    fontVariation: '"wght" 510'
  code-md:
    fontFamily: "Berkeley Mono"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  code-sm:
    fontFamily: "Berkeley Mono"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0px
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 9px
  xl: 14px
  full: 9999px
spacing:
  xs: 8px
  sm: 20px
  md: 30px
  lg: 40px
  xl: 78px
components:
  button-primary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: 14px 20px
    height: 44px
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: 14px 20px
    height: 44px
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.none}"
    padding: 0px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 12px 16px 16px
  input:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 12px 14px
  chip:
    backgroundColor: "#0b0c0d"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    padding: 6px 10px
---

# Linear Dark System

## Overview
This system feels disciplined, technical, and premium, with a strong product-led personality rather than a marketing-heavy one. The interface is intentionally dense in utility areas but spacious in the hero treatment, creating a calm sense of control. It targets teams that value speed, clarity, and software confidence, with a subtle futuristic tone reinforced by the single electric accent.

## Colors
- **Primary (#7170ff):** A vivid indigo accent used for highlights, active states, icon marks, and small product cues. It provides energy without breaking the overall restraint.
- **Secondary (#e5e5e6):** A soft near-white used for the most prominent button fill and subtle bright UI treatments. It reads as clean metal against the dark background.
- **Tertiary (#9aa0a6):** A muted cool gray for secondary text, metadata, and supporting navigation. It helps preserve hierarchy without introducing noise.
- **Neutral (#08090a):** The near-black base canvas that dominates the page. It creates the deep, immersive dark mode foundation.
- **Surface (#0f1011):** The slightly lifted panel color used for cards and embedded UI containers. It separates nested content from the background with minimal contrast.
- **On-surface (#f7f8f8):** The high-contrast text color for primary copy and button text. It stays crisp and neutral rather than stark blue-white.
- **Error (#ff5a67):** A reserved alert tone for destructive or invalid states. It should remain rare and clearly separated from the brand accent.
- **Border (#ffffff14):** A faint translucent edge used for card outlines and separators. It gives structure without making components feel boxed in.
- **Border-strong (#ffffff1f):** A slightly more visible divider for active boundaries and emphasis. Use sparingly where the interface needs extra definition.
- **Muted (#8a9099):** A softer gray for sublabels, timestamps, and low-priority metadata. It supports the editorial hierarchy in the app shell.
- **Overlay (#00000066):** A dimming layer for modal or contextual elevation. It preserves the dark atmosphere while signaling focus.

## Typography
Inter Variable is the primary voice across the system, delivering a modern, neutral, highly legible feel. Headings use a medium-weight variable setting around 510 with tight negative letter spacing, which gives the large copy a confident, compact rhythm. Body text stays lighter and more open, while labels and navigation lean slightly stronger to improve scanability in dense product areas.

Headlines scale from `headline-display` down through `headline-sm` for a clear hierarchy that works well in both marketing hero sections and in-product panels. Body styles are tuned for long reading on dark backgrounds, with 24px line height for comfort and slight negative tracking to avoid a washed-out look. `Berkeley Mono` is reserved for code-like snippets, IDs, and technical references, reinforcing the product’s developer-friendly tone.

Uppercase is not a dominant convention; instead, the interface prefers sentence case and compact labels. When visual emphasis is needed, weight and spacing do the work rather than aggressive casing.

## Layout
The page uses a wide, centered composition with a generous hero zone above a large embedded product screenshot. Content is structured in broad horizontal bands rather than a strict card grid, which keeps the experience editorial and spacious. Inner application content is denser, with narrow sidebars and multi-column information architecture that reflects a real working product.

Spacing follows a restrained rhythm based on 8px increments and larger jumps at 20px, 30px, 40px, and 78px for section separation. Major sections rely on breathing room rather than decorative framing, and cards typically use compact internal padding so more information can fit without feeling crowded. Containers are wide, but text blocks remain controlled so the main headline retains focus.

## Elevation & Depth
Depth is subtle and mostly tonal rather than shadow-driven. The system uses thin translucent borders, slightly lighter surface fills, and carefully stacked panels to establish hierarchy. Shadows are minimal and restrained, with the strongest effect being a faint one-pixel edge and a soft inset highlight.

This flat-but-layered approach keeps the UI feeling fast and modern. Components become distinct through contrast and enclosure instead of heavy blur or dramatic drop shadow. The result is a crisp interface that feels precise and engineered.

## Shapes
The shape language is rounded but disciplined. Large action buttons use fully pill-shaped corners, while cards and panels use modest radii around 8px to 9px. This combination makes primary actions feel friendly and approachable while keeping the product chrome structured and technical.

Avoid overly soft or bubbly corners. The system benefits from controlled roundness that feels deliberate, not playful.

## Components
Buttons are the clearest expression of the brand. `button-primary` is a light-filled pill with dark text, sized for confident CTA use and padded at 14px 20px with a 44px height. `button-secondary` is the inverse utility action: transparent fill, light text, and a subtle border treatment that reads well on dark surfaces. `button-link` should remain minimal, with no fill and no extra framing, for inline navigation or tertiary actions.

Cards use the `card` token with the `surface` color, a faint border, and compact padding. They should feel like embedded modules, not floating blocks. Keep card content dense but readable, and preserve the subtle edge contrast that distinguishes each panel from the background.

Inputs should follow the same quiet aesthetic: dark fill, soft border, and clear text contrast. Focus states should be noticeable through border or outline changes, not heavy glow. Placeholder and helper text should sit in the muted gray range so typed content remains dominant.

Chips and pills should be small, rounded, and compact, with restrained color usage. Use the primary accent for status dots or active markers rather than filling the entire chip unless the state is meant to stand out. Inline code, badges, and technical identifiers should use `code-sm` or `code-md` with the mono face to preserve the product’s engineering flavor.

Navigation and icon buttons should stay lightweight, with text and iconography aligned tightly and sized for utility over decoration. Lists and activity feeds should use subtle separators, muted timestamps, and occasional accent marks to indicate state without overwhelming the content.

## Do's and Don'ts
- Do keep the interface dark, quiet, and high-contrast, with most surfaces staying close to the core black palette.
- Do use the primary accent sparingly for active states, status dots, and small highlights.
- Do rely on typography scale and subtle borders to create hierarchy instead of heavy shadows.
- Do prefer pill buttons for major actions and compact rounded rectangles for cards and panels.
- Don't introduce bright, saturated secondary colors that compete with the indigo accent.
- Don't use large border radii on cards or containers; keep the shape language restrained.
- Don't make body text too light or too small on dark backgrounds, or readability will suffer.
- Don't add decorative gradients or glossy effects that break the product-first, engineered feel.
