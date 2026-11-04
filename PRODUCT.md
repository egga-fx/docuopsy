# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Tauri v2 (Rust 2021 Core Backend + Tokio Async Runtime) + React 18 / TypeScript (Vite) + Tailwind CSS + CodeMirror 6 + PDF.js (`pdfjs-dist`) + `markdown-it` + `DOMPurify` on Windows Desktop (WebView2).

## Users

- **Primary Users:** General writers, academics, researchers, and technical authors working on Windows desktop environments who spend hours daily taking structured notes, reading academic or reference PDFs, and drafting or editing Markdown and plain-text documents with AI assistance.
- **Secondary Users:** Developers and knowledge workers inspecting logs, configuration files, and source code alongside documentation who require instant startup and crash-proof scratch buffers.

## Product Purpose

Docuopsy (*Document + Autopsy*) is a high-performance, local-first, multi-format desktop document viewer and text editor. It exists to unify deep reading (PDF and rendered Markdown) and focused writing (Markdown, plain text, and code) in a single lightweight workspace where unsaved work is never lost and AI assistance flows directly into the active document without bloat or latency.

Success means:
- Sub-1.5-second cold startup and 60 FPS scrolling even on massive documents or multi-hundred-page PDFs.
- Zero lost keystrokes across sudden crashes, power loss, or restarts via automatic forensic-grade draft persistence.
- Seamless daily transitions between writing, side-by-side reviewing, and full-screen reading across both long night sessions and bright daylight environments.

## Positioning

Unlike heavy Electron-based note apps (which suffer from high RAM overhead and slow boot times) or barebones system text editors (which lack native PDF reading, live sanitized GFM preview, crash-proof draft recovery, and inline AI streaming), Docuopsy pairs a native Rust atomic persistence and security engine (~10 MB binary footprint) with a virtualized CodeMirror 6 + PDF.js studio and non-blocking KIE AI (`claude-haiku-5-5`) streaming.

## Operating Context

- **Daily Rituals:** Opening reference PDFs alongside active Markdown manuscripts or research notes; switching rapidly between **Split Mode** (side-by-side source + preview), **Full Editor Mode** (distraction-free drafting), and **Full Preview Mode** (academic PDF reading and manuscript review).
- **Lighting & Environment:** Used across prolonged academic reading and writing sessions in both dim/night study environments and bright daytime offices—requiring first-class dual-theme support (**Dark Forensics** and **High-Contrast Light**) from day one.
- **Input Ergonomics:** Keyboard-first workflow (`Ctrl+N`, `Ctrl+O`, `Ctrl+S`, `Ctrl+W`, `Ctrl+Tab`, `Ctrl+\`, `Ctrl+Shift+E`, `Ctrl+Shift+P`, `Ctrl+K`) paired with precision pointer interactions for split-pane resizing and PDF zoom/navigation.

## Capabilities and Constraints

- **Non-Negotiable Priority Hierarchy:** `Speed (Performance) > Security > Features`.
- **Multi-Format Workspace:**
  - Read & Write: `.md`, `.txt`, `.json`, `.log`, `.csv`, `.rs`, `.js`, `.ts`, and general text/code files via virtualized CodeMirror 6.
  - Live Sanitized Preview: GitHub Flavored Markdown (GFM tables, code blocks, math) via `markdown-it` + `DOMPurify`.
  - Read-Only Document Viewing: `.pdf` via lazy-rendered Mozilla `pdfjs-dist` canvas/SVG pages (auto-switching to Full Preview Mode on open).
- **Forensic-Grade Session & Draft Persistence:**
  - Session state (`%APPDATA%\Docuopsy\session.json`) tracks open tabs, active tab, layout mode, split ratio, cursor coordinates (`line`, `col`), and scroll offsets (`scrollTop`).
  - Dirty buffers (`is_dirty = true`) are debounced at 500ms and written atomically via tempfile-and-rename to `%APPDATA%\Docuopsy\drafts\<tab-id>.draft`.
- **In-Editor Generative AI (KIE AI):**
  - Rust backend streams Server-Sent Events (SSE) from `https://api.kie.ai/v1/chat/completions` using default model `claude-haiku-5-5` over Tauri IPC (`ai:stream:chunk`).
  - Inline command palette (`Ctrl+K`) supports *Continue Writing*, *Summarize*, *Fix Grammar / Rewrite*, and *Custom Prompt* with intact CodeMirror undo history.
- **Security & Privacy Constraints:**
  - Strict path canonicalization and directory traversal (`..`) rejection in Rust before any filesystem read/write.
  - Mandatory `DOMPurify` sanitization on all rendered Markdown HTML to prevent XSS.
  - Unified `tracing` observability (`%LOCALAPPDATA%\Docuopsy\logs\docuopsy-daily.log`) with strict redaction: zero raw document contents and zero plaintext API keys in logs.
- **Licensing Constraint:** 100% of dependencies must use permissive open-source licenses (`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`).
- **Explicit Non-Goals:** Direct PDF content editing and binary disk-image carving.

## Brand Commitments

- **Product Name:** Docuopsy (combining *Document* precision with *Autopsy* forensic reliability and structural clarity).
- **Dual-Theme Commitment (Day One):** Must ship with two equally crafted, first-class visual themes:
  1. **Dark Forensics (Default Dark):** High-focus, low-glare obsidian/slate instrument surface tailored for extended night writing, code inspection, and deep concentration.
  2. **High-Contrast Light (Editorial Daylight):** Crisp, warm archival paper/ink surface tailored for academic PDF reading, daytime manuscript drafting, and glare-free legibility.
- **Voice & Tone:** Precise, scholarly, calm, and trustworthy. Status indicators, error messages, and AI prompts use concise, unambiguous language without marketing fluff or intrusive chrome.

## Evidence on Hand

- Approved Product Requirement Document: [`docs/superpowers/specs/2026-11-04-docuopsy-prd.md`](file:///d:/@dev/docuopsy/docs/superpowers/specs/2026-11-04-docuopsy-prd.md)
- Technical Architecture & System Specification: [`DESIGN.md`](file:///d:/@dev/docuopsy/DESIGN.md)
- Core Implementation Plan: [`docs/superpowers/plans/2026-11-04-docuopsy-core.md`](file:///d:/@dev/docuopsy/docs/superpowers/plans/2026-11-04-docuopsy-core.md)
- Multi-Agent & AI Directives: [`AGENTS.md`](file:///d:/@dev/docuopsy/AGENTS.md), [`GEMINI.md`](file:///d:/@dev/docuopsy/GEMINI.md), [`INFRA.md`](file:///d:/@dev/docuopsy/INFRA.md), [` docs/memory/brain-map.md`](file:///d:/@dev/docuopsy/docs/memory/brain-map.md)
- **Absences Not to Fabricate:** No fake user testimonials, commercial pricing tiers, cloud sync claims, or telemetry dashboards.

## Product Principles

1. **Zero-Latency Flow:** Every interaction—from tab switching and split-pane dragging to 50,000-line scrolling and AI token streaming—must feel instantaneous and never block the main thread.
2. **Forensic Trust by Default:** Users never worry about saving or untrusted files; every keystroke is atomically journaled within 500ms, and every file path and HTML preview is strictly sanitized.
3. **Quiet Instrument, Foreground Manuscript:** The application chrome recedes so the writer's prose, Markdown typography, and PDF pages command primary visual attention.
4. **Dual-Light Ergonomics:** Academic reading and daily writing span day and night; both *Dark Forensics* and *High-Contrast Light* themes are primary citizens with calibrated contrast, never an inverted afterthought.
5. **Keyboard Sovereignty:** Every core workspace action—tabs, layout modes, saving, and AI invocation—is reachable without lifting hands from the keyboard.

## Accessibility & Inclusion

- **WCAG 2.1 AA Compliance Minimum (AAA Target for Body Prose):** All text, interactive controls, tab indicators, and status bar metrics must meet or exceed WCAG AA contrast ratios (≥ 4.5:1 for UI/body text, ≥ 7:1 for primary reading prose in both *Dark Forensics* and *High-Contrast Light* modes, and ≥ 3:1 for active borders/focus rings).
- **Keyboard-First Navigation & Visible Focus:** Logical tab order, explicit `:focus-visible` rings on all interactive controls, full shortcut coverage, and `Escape` dismissal for floating palettes (`AIPalette`).
- **Screen Reader & Semantic Structure:** Proper ARIA roles (`tablist`, `tab`, `tabpanel`, `toolbar`, `status`, `dialog`) and accessible labels (`aria-label`) on icon-only controls and dirty-state indicators.
- **Motion Sensitivity:** Respect `prefers-reduced-motion: reduce` across all layout transitions and AI streaming indicators.

