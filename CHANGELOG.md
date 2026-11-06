# Changelog

All notable changes to the **Docuopsy** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [0.2.0] - 2026-11-06

### Added
- **Multi-Platform Release Architecture (Windows, Linux, macOS):**
  - Automated GitHub Actions matrix CI/CD release workflow (`.github/workflows/release.yml`) producing:
    - **Windows:** NSIS installer `.exe` and `.msi` (`x86_64-pc-windows-msvc`).
    - **Linux:** `.deb` and `.AppImage` packages (`x86_64-unknown-linux-gnu`) with full WebKit2GTK dependencies.
    - **macOS:** Universal Apple Silicon (`aarch64-apple-darwin`) and Intel (`x86_64-apple-darwin`) `.dmg` and `.app` bundles.
  - Automated pull request and push verification CI workflow (`.github/workflows/ci.yml`).
- **Universal Keyboard Shortcut Parity:**
  - Dynamic modifier key detection (`Cmd ⌘` on macOS, `Ctrl` on Windows and Linux) for all keybindings:
    - `Mod+N`: New Tab / Document
    - `Mod+O`: Open File Dialog
    - `Mod+S`: Save Active Document
    - `Mod+Shift+S`: Save As with New Path
    - `Mod+W`: Close Active Tab
    - `Mod+Tab`: Cycle Document Tabs
    - `Mod+\`: Toggle Split / FullEditor Layout
    - `Mod+Shift+E`: Full Editor Mode
    - `Mod+Shift+P`: Full Preview Mode
    - `Mod+Shift+L`: Toggle Theme
    - `Mod+K`: Toggle AI Assistant Sidebar
  - Platform-adaptive shortcut labels in the App Menu (`⌘` on macOS, `Ctrl` on Windows/Linux).
- **Dynamic Context-Aware AI System Prompt & Runtime Metadata:**
  - Real-time client date, time, and timezone awareness (`Current Date & Time`) injected into every AI completion.
  - Full application awareness: Docuopsy identity and supported file formats (`.md`, `.pdf`, `.txt`, `.rs`, `.ts`, `.json`, etc.).
  - Active document tracking dynamically identifying the current working file in the editor buffer.
- **Unconstrained User-Driven AI Output Formatting:**
  - Eliminated rigid syntax constraints; AI format output now strictly and dynamically conforms to user instructions (plain text, single sentence, bullet points, raw code, JSON, or GFM).
  - Absolute user compliance guardrails: zero preachiness, moralizing, or unwarranted refusals.
- **AI Assistant UX Polishing:**
  - Smooth `requestAnimationFrame` typewriter unspooling engine eliminating bursty layout jitter.
  - Animated glowing electric accent stream caret (`.stream-caret`).
  - Interactive "New Session" header trigger with clean filled `Sparkles` icon.
  - Minimalist left-arrow (`ArrowLeft`) cursor insert button.
- **Forensics Dark Product System Redesign:**
  - Unified `#7170ff` electric accent, Inter Variable typography, and Berkeley Mono code accents.
  - Flawless dual-theme parity between *Dark Forensics* (`#08090a`) and *Light Vellum* (`#f7f8f8`) with zero dark leaks.

### Security
- Hardened Content Security Policy (CSP) whitelisting `https://api.kie.ai` and `https://api.eggafx.space`.
- Sandboxed directory traversal prevention and DOMPurify HTML sanitization.

---

## [0.1.0] - 2026-11-05

### Added
- **Docked Right-Sidebar AI Assistant:**
  - Integrated right-docked `<aside>` panel in the workspace with interactive left border resizing (300px–560px clamped width).
  - Multi-turn conversational streaming chat with real-time markdown formatting.
  - Context-aware dynamic progress indicators (`Thinking`, `Reasoning`, `Generating`) adapting dynamically to user task domains (culinary, coding, summarization, grammar).
  - Recent tasks drawer with `localStorage` persistence, enabling one-click task re-execution.
  - "Insert at Cursor" direct text insertion into active CodeMirror 6 document and one-click response copy.
  - Low-latency streaming integration with KIE AI (`deepseek-v4-1-flash`) via Server-Sent Events (SSE).
- **In-Editor CodeMirror 6 Engine:**
  - Virtualized text rendering for high-performance handling of large documents with minimal memory consumption.
  - Full syntax highlighting support for Markdown, JSON, Rust, JavaScript, TypeScript, and Plain Text.
  - Continuous atomic synchronization between editor buffer, selection/cursor coordinates, and the reactive Zustand tab store.
- **Archival Forensics Design System & Customizable Accent:**
  - Day-One dual-theme support (*The Archival Forensics Studio*) with 100% Light Mode parity and zero dark leaks:
    - **Dark Forensics:** High-depth obsidian slate (`#0B0F14`) canvas with muted border contrast.
    - **Light Vellum:** High-contrast archival parchment (`#FAF7F0`) with deep charcoal ink (`#12161F`, >15:1 AAA contrast) and `Literata` scholarly reading measure (65ch–72ch).
  - Semantic CSS token mapping (`--bg-canvas`, `--bg-shell`, `--bg-surface`, `--border-subtle`, `--text-primary`, `--text-muted`, `--app-accent`).
  - Header Accent Color Picker popover with 6 curated presets (*Verdigris*, *Violet*, *Amber*, *Cyan*, *Rose*, *Monochrome*) and a native hex color input.
- **Forensic-Grade Session Persistence & Crash Resilience:**
  - Dual-tier persistence engine: instant synchronous `localStorage` snapshot cache (for zero-flicker boot hydration) paired with debounced atomic state serialization to `%APPDATA%\Docuopsy\session.json`.
  - Comprehensive workspace restoration: open tabs, active tab, cursor line/col, scroll offset, split ratio, layout mode, theme, accent color, and AI sidebar state.
  - Atomic scratch draft autosave (`tempfile` swap to `%APPDATA%\Docuopsy\drafts\<tab-id>.draft`) guaranteeing zero lost edits across ungraceful app terminations.
  - Automatic clean-file disk hydration on application boot via `readDocument`.
- **Format-Aware Multi-Document Previews:**
  - GitHub Flavored Markdown (GFM) renderer with typographic headers (`h1`–`h6`), code blocks, bullet/numbered lists, blockquotes, and tables.
  - Mozilla PDF.js canvas viewer with page-level lazy rendering, zoom in/out scaling (50%–300%), and page navigation.
  - Read-only syntax-highlighted code/text inspector for `.txt`, `.json`, `.rs`, `.ts`, and configuration files.
  - Auto-layout switching to `FullPreview` when opening PDF files.
- **Dynamic 3-Mode Layout Engine:**
  - `Split Mode` (side-by-side editing and preview with draggable 4px separator).
  - `Full Editor Mode` (distraction-free writing space).
  - `Full Preview Mode` (scholarly reading and PDF inspection).
  - Accessible keyboard shortcuts: `Ctrl+\`, `Ctrl+Shift+E`, `Ctrl+Shift+P`, `Ctrl+Shift+L`.
- **Top Document Tab Workspace:**
  - Fast tab strip supporting multiple simultaneous scratch documents and file buffers.
  - File format-specific SVG icons, dirty buffer status indicators (`•`), and close buttons.
  - Full keyboard tab navigation: `Ctrl+N` (New Tab), `Ctrl+W` (Close Tab), `Ctrl+Tab` (Cycle Tabs).
- **Application Menu Bar (AppMenu):**
  - Dropdown hamburger menu offering complete File, Edit, and View workflows.
  - Integrated native file dialogs via Rust (`rfd`) for `Open File` (`Ctrl+O`), `Save` (`Ctrl+S`), and `Save As` (`Ctrl+Shift+S`).
- **Dynamic Screen Resolution Adaptability:**
  - On application startup, automatically detects the active monitor's physical resolution and dynamically sets window size to `0.70x width` and `0.70x height`, centered on screen.
- **Unified Tracing & Logging Infrastructure:**
  - Rust `tracing` engine with daily rolling file appenders (`%APPDATA%\Docuopsy\logs\`).
  - Frontend-to-backend IPC logging bridge (`log_event`).
  - Sensitive token and document content regex redaction (zero plain API keys or user document text in disk logs).

### Changed
- Migrated AI generation backend to KIE AI DeepSeek V4.1 Flash (`deepseek-v4-1-flash`) with low reasoning effort configuration (`"reasoning": { "effort": "low" }`), reducing latency from multi-minute timeouts to sub-second token delivery.
- Relocated AI Assistant button to the workspace header toolbar next to the Light/Dark theme toggle.
- Redesigned AI toggle button as a clean icon-only composite (`MessageSquare` + `Sparkles`).
- Removed all AI model name strings and branding badges across the interface for clean visual neutrality.
- Replaced all hardcoded dark styling classes with CSS semantic variables.

### Fixed
- Fixed stale closure in CodeMirror update listener where clearing editor content to an empty string did not synchronize to the active tab store.
- Fixed Markdown preview retaining the last entered character when editor buffer was emptied.
- Fixed Light Mode dark leaks where menu, tabs, PDF controls, code preview, and status bar displayed hardcoded dark obsidian colors.
- Fixed indefinite `THINKING` hang caused by missing Tauri v2 ACL capabilities by providing `src-tauri/capabilities/default.json` with `core:event:allow-listen`.
- Fixed hamburger menu dropdown expanding the tab bar scroll area by decoupling dropdown popup stacking context.
- Fixed Cargo temp directory allocation errors on Windows MSVC builds by binding `$env:TEMP` / `$env:TMP`.

### Security
- Comprehensive directory traversal protection (`..` canonicalization checks) preventing arbitrary filesystem reads or writes outside sanctioned bounds.
- Strict DOMPurify sanitization applied to all rendered Markdown HTML, neutralizing malicious `<script>` tags and `onerror` attributes.
- Environment-based credentials isolation with `.env` and `.env.example` support, preventing hardcoded production API keys.
- Automatic key redaction in logging outputs.
