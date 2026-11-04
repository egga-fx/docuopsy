---
name: Docuopsy
description: High-performance, local-first multi-format desktop manuscript studio, PDF reader, and forensic-grade text editor.
colors:
  verdigris-primary: "#0E9F8A"
  verdigris-deep: "#0B7A6A"
  kie-violet: "#7C5CFC"
  amber-dirty: "#D97706"
  crimson-alert: "#DC2626"
  emerald-verified: "#059669"
  obsidian-canvas: "#0B0F14"
  slate-shell: "#111722"
  slate-surface: "#18202F"
  slate-border: "#243044"
  parchment-light: "#ECF2F8"
  slate-muted: "#94A6BE"
  vellum-canvas: "#FAF7F0"
  vellum-shell: "#F0ECE1"
  vellum-surface: "#E5DFD0"
  vellum-border: "#CFC7B4"
  forensic-ink: "#12161F"
  ink-muted: "#4A5568"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible Next, Segoe UI Variable Display, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Atkinson Hyperlegible Next, Segoe UI Variable Display, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Atkinson Hyperlegible Next, Segoe UI Variable Text, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Literata, Source Serif 4, Charter, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0em"
  label:
    fontFamily: "JetBrains Mono, Cascadia Code, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  none: "0px"
  xs: "3px"
  sm: "6px"
  md: "8px"
  pill: "9999px"
spacing:
  2xs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.verdigris-primary}"
    textColor: "{colors.obsidian-canvas}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.verdigris-deep}"
    textColor: "{colors.parchment-light}"
  button-ghost:
    backgroundColor: "{colors.slate-surface}"
    textColor: "{colors.parchment-light}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "6px 12px"
    height: "28px"
  tab-active:
    backgroundColor: "{colors.obsidian-canvas}"
    textColor: "{colors.parchment-light}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0px 14px"
    height: "36px"
  tab-inactive:
    backgroundColor: "{colors.slate-shell}"
    textColor: "{colors.slate-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0px 14px"
    height: "36px"
  input-command:
    backgroundColor: "{colors.slate-surface}"
    textColor: "{colors.parchment-light}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
    height: "42px"
  chip-status:
    backgroundColor: "{colors.slate-surface}"
    textColor: "{colors.slate-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.xs}"
    padding: "2px 8px"
    height: "20px"
---

# Design System: Docuopsy

## Overview

**Creative North Star: "The Archival Forensics Studio"**

Docuopsy unifies two worlds that rarely coexist with equal craft: the calm, tactile legibility of a scholar's archival reading room and the uncompromising precision of a forensic laboratory instrument. Built for general writers, academics, researchers, and developers who spend hours reading dense PDFs and drafting Markdown manuscripts, the interface rejects bloated toolbars and decorative chrome. Application surfaces act as a quiet, calibrated frame (`slate-shell` at night, `vellum-shell` by day) that recedes immediately so the manuscript column, code buffer, or PDF canvas commands full attention.

Density is deliberate and bimodal. The structural perimeter—the 36px top tab bar, the 4px interactive split-pane divider, and the 26px telemetry status bar—operates with compact, tabular precision so zero vertical viewport is wasted. Inside the workspace panes, the rhythm expands generously: Markdown previews and academic reading columns breathe at a 65–72ch measure with warm editorial serif typography (`Literata`), while the CodeMirror 6 editor maintains crisp line-number alignment and instant virtualized scrolling.

The system rejects generic gray-on-gray SaaS templates, neon cyberpunk gimmicks, decorative glassmorphism over reading surfaces, and single-theme bias. Both **Dark Forensics** (nocturnal obsidian slate) and **High-Contrast Light** (daylight archival vellum) are engineered as first-class semantic poles from day one.

**Key Characteristics:**
- **Dual-Pole Day-One Themes:** *Dark Forensics* (`#0B0F14` obsidian ground) for low-glare nocturnal drafting and *High-Contrast Light* (`#FAF7F0` archival vellum ground) for daylight academic reading and PDF study.
- **Bimodal Density:** Compact, tabular-numeral instrument perimeter (36px Tab Bar, 26px Status Bar) framing a generous, distraction-free manuscript interior.
- **Forensic State Honesty:** Unsaved buffer mutations (`•`), atomic draft persistence status, path sandbox verification, and KIE AI token streaming are surfaced through unambiguous semantic beacons rather than modal interruptions.
- **Custom Browser Surfaces:** Carets, text selection highlights, scrollbars, focus rings, and tabular status counters are explicitly themed from the system palette—never left to raw OS/WebView defaults.

## Colors

The palette pairs hue-tinted architectural neutrals (deep blue-slate for *Dark Forensics* and warm archival stone/vellum for *High-Contrast Light*) with purposeful, high-signal semantic accents that communicate workspace state at a glance.

### Primary
- **Forensic Verdigris** (`#0E9F8A`): Primary interactive accent used for the active tab top-border bar (2px), primary confirmation buttons, keyboard `:focus-visible` rings, and synchronized scroll-lock indicators.
- **Deep Verdigris** (`#0B7A6A`): Hover and pressed state for primary controls, and the primary accent anchor on *High-Contrast Light* vellum surfaces to guarantee ≥ 4.5:1 contrast.

### Secondary
- **KIE Neural Violet** (`#7C5CFC`): Dedicated exclusively to the `Ctrl+K` In-Editor AI Command Palette, active SSE token-streaming cursor pulses, and inline generative preview highlights. Never used on standard file or layout chrome.

### Tertiary
- **Dirty Buffer Amber** (`#D97706`): Indicates unsaved buffer modifications (`is_dirty = true`) on tab badges and signals active 500ms atomic draft snapshotting in the status bar.
- **Security Alert Crimson** (`#DC2626`): Reserved for blocked directory traversal attempts (`AppError::SecurityViolation`), malformed session recovery warnings, and network stream disconnects.
- **Sanitized Emerald** (`#059669`): Confirms completed atomic disk saves and verified `DOMPurify` Markdown preview sanitization.

### Neutral
- **Obsidian Canvas** (`#0B0F14`): Primary editor and preview background in *Dark Forensics* mode.
- **Slate Shell** (`#111722`): Recessed structural perimeter (Top Tab Bar, inactive tabs, and bottom Status Bar) in *Dark Forensics* mode.
- **Slate Surface** (`#18202F`): Elevated interactive surface for floating command palettes, hover states, and code blocks in *Dark Forensics* mode.
- **Slate Hairline** (`#243044`): Crisp 1px structural border separating panes, tabs, and toolbars in *Dark Forensics* mode.
- **Parchment Light** (`#ECF2F8`): Primary reading and editing foreground ink in *Dark Forensics* mode (≥ 14.5:1 contrast against Obsidian Canvas).
- **Slate Muted** (`#94A6BE`): Hue-tinted secondary text for line numbers, inactive tab titles, and status bar telemetry in *Dark Forensics* mode (≥ 6.2:1 contrast against Obsidian Canvas).
- **Archival Vellum Canvas** (`#FAF7F0`): Primary editor and document reading ground in *High-Contrast Light* mode, calibrated to eliminate white-screen glare during multi-hour PDF and manuscript study.
- **Vellum Shell** (`#F0ECE1`): Structural perimeter (Top Tab Bar, inactive tabs, Status Bar) in *High-Contrast Light* mode.
- **Vellum Surface** (`#E5DFD0`): Interactive control hover state and code block surface in *High-Contrast Light* mode.
- **Vellum Hairline** (`#CFC7B4`): 1px structural divider in *High-Contrast Light* mode.
- **Forensic Ink** (`#12161F`): Primary body and code foreground in *High-Contrast Light* mode (≥ 15.2:1 contrast against Archival Vellum Canvas).
- **Ink Muted** (`#4A5568`): Hue-tinted secondary text and line-number gutter ink in *High-Contrast Light* mode (≥ 6.5:1 contrast against Archival Vellum Canvas).

### Named Rules
**The Dual-Pole Calibration Rule.** Both *Dark Forensics* and *High-Contrast Light* themes are primary citizens. Never implement light mode by inverting dark mode CSS filters; every surface maps to its dedicated semantic token (`--bg-canvas`, `--bg-shell`, `--bg-surface`, `--border-subtle`, `--text-primary`, `--text-muted`).

**The No-Dead-Gray Rule.** Secondary text, line numbers, and borders must always carry the temperature of their ground (cool slate blue in Dark Forensics; warm stone-ink in High-Contrast Light). Pure achromatic grays (`#808080`, `#CCCCCC`) are forbidden.

**The Semantic Beacon Rule.** High-chroma colors (`#0E9F8A`, `#7C5CFC`, `#D97706`, `#DC2626`) appear only when signaling active state, focus, AI generation, or dirty-buffer status—occupying less than 8% of the viewport so the document remains calm.

## Typography

**Display & UI Font:** `Atkinson Hyperlegible Next` (with `Segoe UI Variable Display`, `system-ui`, `sans-serif` fallbacks)
**Reading & Manuscript Body Font:** `Literata` (with `Source Serif 4`, `Charter`, `Georgia`, `serif` fallbacks)
**Editor & Telemetry Mono Font:** `JetBrains Mono` (with `Cascadia Code`, `Consolas`, `monospace` fallbacks)

**Character:** `Atkinson Hyperlegible Next` gives application chrome, headings, and dialogs unmistakable glyph distinction at small sizes; `Literata` lends rendered Markdown previews the warmth and sustained readability of an academic press; `JetBrains Mono` anchors the CodeMirror 6 buffer and status bar with razor-sharp ligature-free character grids and tabular numerals.

### Hierarchy
- **Display** (`700`, `2.25rem` / `36px`, `line-height: 1.15`, `letter-spacing: -0.025em`): Top-level document title (`<h1>`) in Markdown Preview and empty-workspace welcome header.
- **Headline** (`600`, `1.5rem` / `24px`, `line-height: 1.25`, `letter-spacing: -0.015em`): Major section headers (`<h2>`) in rendered Markdown with `24px` top spacing and `8px` bottom spacing.
- **Title** (`600`, `1.0625rem` / `17px`, `line-height: 1.35`, `letter-spacing: -0.01em`): Sub-sections (`<h3>`), dialog titles, and the `Ctrl+K` AI Command Palette prompt input.
- **Body** (`400`, `1.0625rem` / `17px`, `line-height: 1.7`, `max-width: 68ch`): Long-form rendered Markdown prose, blockquotes, and academic notes.
- **Label / Mono** (`500`, `0.75rem` / `12px`, `line-height: 1.4`, `letter-spacing: 0.02em`, `font-variant-numeric: tabular-nums`): Top Tab Bar titles, status bar cursor coordinates (`Ln 42, Col 12`), zoom percentages (`125%`), and keyboard shortcut badges.

### Named Rules
**The Tabular Telemetry Rule.** Every numeric counter in the UI—line numbers, cursor coordinates, byte sizes, PDF page counters, and debounce timers—must enforce `font-variant-numeric: tabular-nums` so digits never jitter horizontally during rapid typing or scrolling.

**The Scholar's Measure Rule.** In Full Preview and Split Preview modes, rendered Markdown prose is constrained to `65ch–72ch` centered within its pane with generous margin breathing room, never stretching edge-to-edge across ultrawide monitors.

## Layout

Docuopsy occupies a single full-viewport desktop window (`100vw × 100vh`, `overflow: hidden` on the root shell) divided into three deterministic horizontal bands:

1. **Top Tab & Mode Bar (`height: 36px`, fixed):** Houses the scrollable tab strip on the left (`min-width: 120px`, `max-width: 220px` per tab), the New Tab (`+`) button, and the Tri-Mode Layout & Theme Switcher cluster on the right.
2. **Primary Workspace Canvas (`flex: 1 1 auto`, `min-height: 0`):** Hosted by `LayoutManager.tsx` and dynamically configured into one of three modes:
   - **Split Mode (`Ctrl+\`):** Left pane mounts `EditorPane` (CodeMirror 6); right pane mounts `MarkdownPreview` or `PdfViewer`. Separated by a `4px` interactive drag handle (`splitRatio` default `0.50`, clamped between `0.20` and `0.80`).
   - **Full Editor Mode (`Ctrl+Shift+E`):** Left pane occupies `100%` width; right pane is cleanly unmounted to free memory. Editor text column centers softly with comfortable horizontal padding (`24px–48px`).
   - **Full Preview Mode (`Ctrl+Shift+P`):** Right pane occupies `100%` width; editor is unmounted. Automatically engaged when opening `.pdf` documents.
3. **Forensic Status Bar (`height: 26px`, fixed):** Displays document encoding (`UTF-8`), atomic persistence state (`Saved` / `Draft cached •`), cursor coordinates (`Ln X, Col Y`), active layout mode, theme toggle (`Dark Forensics` / `Archival Light`), and KIE AI engine status (`Haiku 5.5 Ready`).

**Spacing Scale:** Built on a strict `4px` base unit (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`). Related toolbar controls group tightly with `4px` gaps; distinct functional clusters separate by `16px` and a `1px` vertical hairline divider.

## Elevation & Depth

Docuopsy uses **structural tonal layering by default** and reserves cast shadows strictly for floating overlay surfaces (`AIPalette` and context menus). Static workspace panes (Tab Bar, Editor, Preview, Status Bar) sit flat at rest (`z-index: 1`) and establish hierarchy through luminance contrast (`slate-shell` `#111722` framing `obsidian-canvas` `#0B0F14` in dark mode; `vellum-shell` `#F0ECE1` framing `vellum-canvas` `#FAF7F0` in light mode) and crisp `1px` solid borders.

### Shadow Vocabulary
- **Floating Command Elevation** (`box-shadow: 0 12px 32px -4px rgba(5, 8, 14, 0.55), 0 4px 12px -2px rgba(5, 8, 14, 0.35)`): Applied exclusively to the `Ctrl+K` In-Editor AI Command Palette and modal file recovery alerts so they float unmistakably above the document buffer.
- **PDF Page Sheet Elevation** (`box-shadow: 0 4px 16px rgba(11, 15, 20, 0.18)`): Applied around rendered PDF canvas pages inside `PdfViewer` to give physical page boundaries clear figure-ground separation against the viewer well.

### Named Rules
**The Flat-At-Rest Workspace Rule.** Workspace panes, tabs, and status bars never cast drop shadows onto the document buffer. Depth in the primary shell is achieved solely through tonal surface steps and `1px` borders.

## Shapes

The form language is **architectural and instrument-grade**:
- **Shell & Tabs (`0px` radius):** The Top Tab Bar, individual tabs, workspace panes, and Status Bar use flush `0px` corners with `1px` structural borders so adjacent regions interlock without visual gaps.
- **Active Tab Accent (`2px` top bar):** Active tabs are distinguished by a `2px` solid top border in `#0E9F8A` (Forensic Verdigris) and a seamless bottom merge into the active canvas ground.
- **Interactive Controls & Inputs (`3px` to `6px` radius):** Toolbar icon buttons, status chips, and shortcut keycaps use a crisp `3px` (`rounded.xs`) radius; primary action buttons and inputs use `6px` (`rounded.sm`).
- **Floating Overlays (`8px` radius):** The `Ctrl+K` AI Command Palette uses an `8px` (`rounded.md`) outer radius with a `1px` border (`#243044` in dark mode, `#CFC7B4` in light mode).

## Components

### Buttons
- **Shape:** Crisp `6px` radius (`rounded.sm`) for primary actions; `3px` radius (`rounded.xs`) for compact toolbar and status bar controls.
- **Primary:** Background `#0E9F8A` (`verdigris-primary`), text `#0B0F14` (`obsidian-canvas`), padding `8px 16px`, height `32px`, `JetBrains Mono` `12px` medium weight.
- **Hover / Focus:** Transitions in `120ms cubic-bezier(0.22, 1, 0.36, 1)` to `#0B7A6A` (`verdigris-deep`) with `#ECF2F8` text; keyboard focus renders a `2px` offset ring in `#0E9F8A`.
- **Ghost / Toolbar:** Background transparent at rest, shifting to `#18202F` (`slate-surface`) in dark mode or `#E5DFD0` (`vellum-surface`) in light mode on hover, height `28px`, padding `6px 10px`.

### Chips
- **Style:** Compact `20px`-tall telemetry pills (`3px` radius, `2px 8px` padding) set in `JetBrains Mono` `11px` with `tabular-nums`.
- **State:** Clean state uses subtle surface fill; dirty buffer state tints border and dot with `#D97706` (`amber-dirty`); active AI streaming pulses border in `#7C5CFC` (`kie-violet`).

### Cards / Containers
- **Corner Style:** `6px` radius for Markdown callout blocks and code fences; `8px` radius for the floating `AIPalette`.
- **Background:** `#18202F` (`slate-surface`) in Dark Forensics; `#F0ECE1` (`vellum-shell`) in High-Contrast Light.
- **Shadow Strategy:** Flat `0px` shadow for inline document containers; `Floating Command Elevation` for `AIPalette`.
- **Border:** `1px solid` (`#243044` dark / `#CFC7B4` light).
- **Internal Padding:** `16px` (`spacing.md`) for code blocks and callouts; `12px` (`spacing.sm`) for floating command palettes.

### Inputs / Fields
- **Style:** `6px` radius, `1px solid` structural border, `#18202F` background (dark) / `#FAF7F0` background (light), `10px 14px` padding.
- **Focus:** Border transitions to `#0E9F8A` (standard inputs) or `#7C5CFC` (inside `AIPalette`) with a `0 0 0 2px rgba(124, 92, 252, 0.25)` focus ring.
- **Error / Disabled:** Error state shifts border to `#DC2626` (`crimson-alert`) with an explicit inline recovery message below; disabled state reduces opacity to `0.45` with `cursor: not-allowed`.

### Navigation (Top Tab Bar & Layout Switcher)
- **Style & Typography:** Fixed `36px` horizontal bar (`role="tablist"`), set in `JetBrains Mono` `12px`. Each tab displays a 14px SVG file-format icon (`.md`, `.pdf`, `.txt`, code), truncated filename (`max-width: 160px`, `text-overflow: ellipsis`), dirty status indicator (`•` in `#D97706` with `aria-label="dirty-indicator"`), and a `18px × 18px` close button (`×`).
- **States:** Inactive tabs sit on `slate-shell` / `vellum-shell` with muted text; active tab sits flush with the canvas background and carries a `2px` top accent bar in `#0E9F8A`.
- **Layout Switcher Cluster:** Three segmented toggle buttons (`Split`, `Editor`, `Preview`) plus the `Theme Toggle` (`Dark Forensics` / `Archival Light`) anchored at the right edge of the Tab Bar with explicit shortcut tooltips (`Ctrl+\`, `Ctrl+Shift+E`, `Ctrl+Shift+P`).

### Signature Component: In-Editor AI Command Palette (`AIPalette`)
- **Character:** A fast, non-modal command instrument invoked via `Ctrl+K` that anchors near the active editor cursor without obscuring the surrounding paragraph.
- **Structure:** Top input bar (`42px` height) with a `#7C5CFC` KIE AI spark icon and live model badge (`claude-haiku-5-5`), followed by four keyboard-navigable preset actions (*Continue Writing*, *Summarize*, *Fix Grammar*, *Custom Prompt*).
- **Streaming Behavior:** While SSE chunks arrive via `ai:stream:chunk`, tokens insert directly into the CodeMirror 6 document transaction at the cursor while a subtle `#7C5CFC` status pill displays live token velocity and an `Esc to stop` affordance.

### Signature Component: Tri-Mode Split Divider & PDF Reader Toolbar
- **Split Divider:** A `4px` vertical seam between `EditorPane` and `PreviewPane` that highlights to `#0E9F8A` on hover/drag and supports double-click to reset `splitRatio` to `0.50`.
- **PDF Reader Toolbar:** A sticky `32px` sub-bar inside `PdfViewer` (`role="toolbar"`, `aria-label="pdf-controls"`) providing page stepping (`Prev` / `Next`), tabular page indicator (`Page 4 of 28`), and precision zoom controls (`-`, `100%`, `+`, `Fit Width`).

## Do's and Don'ts

### Do:
- **Do** enforce `font-variant-numeric: tabular-nums` on every line number, cursor coordinate (`Ln 42, Col 12`), PDF page counter, and byte-size indicator.
- **Do** maintain full semantic parity between **Dark Forensics** (`#0B0F14` canvas) and **High-Contrast Light** (`#FAF7F0` canvas) using CSS custom properties on `:root` / `[data-theme="light"]`.
- **Do** constrain rendered Markdown body text to `65ch–72ch` with `1.7` line-height so long academic manuscripts remain effortless to read.
- **Do** style browser-native surfaces—text selection (`::selection`), editor caret, scrollbars, and `:focus-visible` outlines—using the Forensic Verdigris (`#0E9F8A`) and Slate/Vellum tokens.
- **Do** sanitize every rendered Markdown HTML string through `DOMPurify.sanitize()` before mounting it in the preview DOM.

### Don't:
- **Don't** use pure achromatic grays (`#808080`, `#999999`) on dark or vellum surfaces; always tint secondary text and borders from the surface hue.
- **Don't** place eyebrow/kicker labels above Markdown headings or dialog titles; let the heading hierarchy carry its own weight.
- **Don't** use gradient text, decorative glassmorphism over reading columns, or zero-blur neobrutalist offset shadows (`box-shadow: 4px 4px 0`).
- **Don't** use Unicode characters or emojis as UI icons; use crisp 1.75px-stroke inline SVG / Lucide icons with explicit `aria-label` attributes.
- **Don't** block the UI thread during file saves, draft snapshots, or KIE AI streaming—all I/O and SSE parsing must execute asynchronously in the Rust Tokio backend.

---

## 9. System Vision & Runtime Architecture

**Docuopsy** is engineered as a lightweight, secure, and resilient multi-format document viewer and text editor for desktop environments. It bridges native system speed with modern document rendering capabilities and dual-theme scholarly ergonomics.

```
+--------------------------------------------------------------------------------+
|                               DOCUOPSY RUNTIME                                 |
+--------------------------------------------------------------------------------+
| USER INTERFACE LAYER (Webview2 + TypeScript + Tailwind CSS + Dual Theme)       |
|                                                                                |
|  [Tabs Container]  [Tabs: Document.md • | Notes.txt | Spec.pdf | [Split|Theme]]|
|  +-------------------------------------+-------------------------------------+ |
|  | LEFT PANEL: CodeMirror 6 Editor     | RIGHT PANEL: Preview Engine         | |
|  | - Virtualized DOM & line numbers    | - Markdown-it + DOMPurify (68ch)    | |
|  | - JetBrains Mono tabular gutter     | - Literata academic serif prose     | |
|  | - Cursor & scroll sync listener     | - PDF.js lazy Canvas/SVG viewer     | |
|  | - Ctrl+K AIPalette overlay          | - Zoom, fit-width, page navigation  | |
|  +-------------------------------------+-------------------------------------+ |
|  [Status Bar: UTF-8 | Draft Cached • | Ln 42, Col 12 | Split | KIE: Haiku 5.5] |
|  [Frontend Logger: captures warnings/errors and ships them to Rust Tracing]   |
+---------------------------------------+----------------------------------------+
                                        | Strongly Typed Tauri IPC (JSON / SSE)
+---------------------------------------+----------------------------------------+
| RUST CORE SUBSYSTEM (Native Speed, Safety, Async Tokio Runtime)                |
|                                                                                |
|  [Session Persistence Manager]        [Atomic FS & Watcher]                    |
|   - Session registry (session.json)    - Safe read/write with atomic temp swap |
|   - Dirty scratch store (drafts/)      - Notify crate for disk change events   |
|   - Cursor, scroll & theme state                                               |
|                                                                                |
|  [KIE AI Client Gateway]              [Security & Path Sanitizer]              |
|   - Provider: KIE AI (Haiku 5.5)       - Path traversal checks (canonicalize)  |
|   - Model: claude-haiku-5-5            - Strict Content Security Policy (CSP)  |
|   - Streaming SSE via reqwest          - Secure memory key management          |
|                                                                                |
|  [Unified Observability Engine]                                                |
|   - Tracing + Tracing Subscriber (stdout + rolling file appender)              |
|   - Redaction filter (strips API keys & raw document text from logs)           |
+--------------------------------------------------------------------------------+
```

---

## 10. Core Priorities & Guiding Principles

### 1. Speed (Performance First)
- **Zero Heavy Runtime Overheads:** Native backend written in Rust; lightweight webview renderer powered by OS-native WebView2 on Windows.
- **Virtualized Rendering:** CodeMirror 6 only renders DOM nodes visible in the active viewport, ensuring 60 FPS scrolling even with 50,000+ line documents.
- **Asynchronous Non-blocking I/O:** Disk reads, state writes, and AI streaming execute on background Tokio worker threads.

### 2. Security (Security by Design)
- **Local-First & Isolated:** No external network connections except explicit user-initiated KIE AI queries.
- **Path Traversal Protection:** Absolute and relative paths are canonicalized and verified against symlink attacks before opening or saving.
- **Sanitized Previews:** All Markdown HTML output is sanitized via `DOMPurify` to prevent DOM-based XSS when opening untrusted documents.
- **Zero Key & Data Leaks:** API keys reside in memory and local configuration, never bundled into public binary assets. Logs never record raw document text.

### 3. Features (Precision Tooling)
- Tab management with dirty-buffer tracking (`•` in `#D97706`).
- Tri-mode dynamic layout (`Split`, `FullEditor`, `FullPreview`) + Day-One Dual Theme (`dark` / `light`).
- Forensic-grade session recovery (restores dirty edits after crashes or restarts).
- In-editor generative AI assistance (`Ctrl+K`).

---

## 11. Technology Stack & Open Source Manifest

Every component and library in Docuopsy is strictly **100% Free and Open Source** under permissive licenses (`MIT`, `Apache-2.0`, `BSD`, or `ISC`).

| Component / Layer | Technology | License | Purpose & Justification |
|---|---|---|---|
| **Desktop Shell** | Tauri v2 (`tauri`, `tauri-build`) | Apache-2.0 / MIT | Tiny binary size (~10MB), ultra-low memory usage, native OS integration. |
| **System Language** | Rust (2021 Edition) | Apache-2.0 / MIT | Memory safety without garbage collection, high concurrency with Tokio. |
| **Async Runtime & HTTP**| `tokio`, `reqwest`, `eventsource-stream` | MIT | Asynchronous file I/O and streaming SSE client for KIE AI. |
| **Logging & Tracing** | `tracing`, `tracing-subscriber`, `tracing-appender` | MIT | Zero-cost structured logging with rolling file persistence. |
| **Serialization** | `serde`, `serde_json` | Apache-2.0 / MIT | High-speed JSON serialization for state persistence. |
| **File Watcher** | `notify` | CC0-1.0 / MIT | Detects external file modifications on disk. |
| **Frontend Framework** | React 18 / Vite / TypeScript | MIT / Apache-2.0 | Declarative UI, strict static type safety, instant HMR during dev. |
| **Styling & UI Tokens** | Tailwind CSS + Lucide Icons | MIT / ISC | Utility-first styling mapped to CSS custom property design tokens. |
| **Editor Core** | CodeMirror 6 | MIT | Extensible, modular, high-performance editor with virtual DOM scrolling. |
| **Markdown Parser** | `markdown-it` + `dompurify` | MIT / Apache-2.0 | Standard GFM parsing with hardened XSS sanitization. |
| **PDF Rendering Engine**| `pdfjs-dist` (Mozilla) | Apache-2.0 | Industry standard open-source PDF renderer without external C++ bindings. |
| **Frontend Testing** | `vitest`, `@testing-library/react` | MIT | Blazing fast TypeScript test runner and component testing. |
| **Backend Testing** | `tempfile`, `wiremock`, `tokio-test` | MIT / Apache-2.0 | Isolated disk test sandbox and mock HTTP servers for KIE AI testing. |

---

## 12. Subsystem Specifications

### 12.1. Session Persistence Engine (Forensic-Grade Recovery)
- **State File Location:** `%APPDATA%\Docuopsy\session.json`
- **Drafts Directory:** `%APPDATA%\Docuopsy\drafts\<tab-uuid>.draft`
- **Data Model:**
  ```rust
  #[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
  pub struct AppSession {
      pub version: u32,
      pub active_tab_id: String,
      pub layout_mode: LayoutMode, // Split | FullEditor | FullPreview
      pub split_ratio: f32,        // e.g. 0.50
      pub theme: Option<String>,   // "dark" (Dark Forensics) | "light" (High-Contrast Light)
      pub tabs: Vec<TabState>,
  }

  #[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
  pub struct TabState {
      pub id: String,
      pub file_path: Option<String>,
      pub title: String,
      pub is_dirty: bool,
      pub cursor_line: u32,
      pub cursor_col: u32,
      pub scroll_top: f64,
      pub draft_path: Option<String>,
  }
  ```
- **Crash Resilience:** When a buffer is dirty, its snapshot is debounced (500ms) and flushed using atomic file replacement (`tempfile` -> rename) to ensure no corrupted files occur on sudden power loss.

### 12.2. Layout Engine (3 Modes) & Dual Theme System
1. **Split Mode (Default for Markdown):** Left pane: CodeMirror 6; Right pane: Rendered Markdown preview with scroll-synchronization.
2. **Full Editor Mode:** Left pane occupies 100% width. Right pane unmounted.
3. **Full Preview Mode:** Right pane occupies 100% width. Left pane unmounted. Default for `.pdf` files.
4. **Dual Theme Engine:** Instant toggle between `dark` (*Dark Forensics*) and `light` (*High-Contrast Light*) persisted in session state and reflected on `<html data-theme="...">`.

### 12.3. KIE AI Integration Engine
- **Endpoint:** `https://api.kie.ai/v1/chat/completions`
- **Model:** `claude-haiku-5-5`
- **Authentication:** Configured via local `.env` (`KIE_AI_API_KEY`) or AppData config file; never hardcoded in client bundles.
- **Streaming Pipeline:** Non-blocking async SSE stream emitted token-by-token over Tauri IPC event `ai:stream:chunk`.

---

## 13. System Observability & Logging Architecture

### 13.1. Rust Backend Tracing System
- **Engine:** `tracing` + `tracing-subscriber` + `tracing-appender`.
- **Output Targets:**
  1. **Development Console (stdout):** Pretty-printed, ANSI colored, live timestamped events (`info`, `debug`, `trace`).
  2. **Rolling Disk File:** `%LOCALAPPDATA%\Docuopsy\logs\docuopsy-daily.log` (daily rotation, 7-day retention).
- **Privacy & Content Redaction Rules:**
  - **No Plaintext Document Leaks:** Logs record metadata only (`file_path`, `byte_size`, `tab_id`), NEVER document contents or buffer text.
  - **API Key Masking:** Any log line referencing authorization tokens automatically masks secrets (`e003...97b` / `[REDACTED]`).

### 13.2. Frontend Unified Log Bridge
- Frontend provides a lightweight logger (`src/api/logger.ts`) that routes warnings and unhandled exceptions to the Rust `log_event(level, message, context)` IPC command.

---

## 14. Development & Automated Testing Strategy

```
+---------------------------------------------------------------+
|                       TESTING PYRAMID                         |
+---------------------------------------------------------------+
| E2E / Smoke Test: Tauri dev instance boot & IPC ping           |
+---------------------------------------------------------------+
| Integration Tests:                                            |
| - Rust: Atomic draft recovery after mock sudden termination   |
| - Rust: Wiremock KIE AI SSE streaming simulation              |
| - Frontend: Vitest + @tauri-apps/api/mocks for IPC commands   |
+---------------------------------------------------------------+
| Unit Tests:                                                   |
| - Rust: Path canonicalization & directory traversal defense   |
| - Rust: Session serde serialization / deserialization         |
| - Frontend: Tab state reducer, layout switcher, sanitizer     |
+---------------------------------------------------------------+
```
