# Changelog

All notable changes to the **Docuopsy** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [0.3.1] - 2026-11-13

### Changed
- **Appearance in Options:** theme switching, the six accent presets, and the custom accent color moved
  from the workspace toolbar into Application Menu → Options. Preferences and Ctrl/Cmd+Shift+L are
  unchanged. (`src/components/AppMenu.tsx`, `src/components/LayoutManager.tsx`)
- **Release Tooling:** NSIS-only `tauri:build`, a static MSVC runtime guard (`verify:runtime`), and a
  dual-distribution packager (`release:package`) producing the installer, portable ZIP, and SHA256 sums.
  (`scripts/check-static-runtime.mjs`, `scripts/package-release.mjs`)

### Fixed
- **Tab Header Dragging:** empty tab-strip space now moves the window without breaking tab panning; drag
  surfaces use the normal arrow cursor and the top-left grip icon sits at 50% opacity.
  (`src/components/TabBar.tsx`)
- **Single Focus Edge:** inputs, textareas, and selects share one inset accent outline instead of stacked
  border, ring, and offset outline; focused controls keep their normal border radius. (`src/index.css`)

## [0.3.0] - 2026-11-12

### Added
- **Drag & Drop File Opening:** files dropped from the OS file manager open directly in a new tab.
  Native Tauri webview drop events supply absolute paths in the desktop build; the browser dev server
  falls back to HTML5 `DataTransfer` files. Duplicate drops activate the already-open tab, batch drops
  are capped at 10 files, and a per-file failure never aborts the rest of the batch.
  (`src/api/dnd.ts`, `src/hooks/useFileDropOpen.ts`)
- **Fast Tab Rename:** double-clicking a tab turns its title into an inline input with the filename
  stem pre-selected; `Enter` or blur commits, `Escape` cancels, and tab shortcuts stay suppressed
  while renaming. Renames persist through the session store and survive a save back to the same file.
  (`src/components/TabBar.tsx`, `useTabStore.renameTab`)
- **Custom Window Chrome for the Undecorated Window:** the native title bar is removed
  (`decorations: false`) and replaced by an icon-only minimize / fullscreen / close cluster at the
  right end of the tab strip, plus `data-tauri-drag-region` strips so the window stays movable and
  double-click-maximizable. `F11` toggles fullscreen. (`src/components/WindowControls.tsx`, `src/api/window.ts`)
- **Window Grip:** a dotted grip box sits left of the app menu as the unmistakable drag handle.
  (`src/components/TabBar.tsx`)
- **Hold-and-Move Tab Panning:** the tab strip scrolls by dragging sideways (or with the wheel)
  instead of showing a scrollbar trough; a pan suppresses the click that would otherwise switch tabs.
  (`src/components/TabBar.tsx`, `.pan-scroller` in `src/index.css`)
- **Recent Sessions Bubble:** the Recent control opens a bubble listing up to five session titles with a
  Show all sessions toggle, replacing the drawer that used to squeeze the chat thread.
  (`src/components/AIPalette.tsx`)
- **Broad Syntax Highlighting:** the editor resolves ~50 additional grammars lazily through
  `@codemirror/language-data`, and fenced code inside Markdown is now highlighted in its own language.
  (`src/editor/extensions.ts`, `src/components/EditorPane.tsx`)

### Changed
- The AI sidebar toggle signals its active state through a filled icon rather than a border, the
  New Session button no longer paints a focus ring on click, the send control is a plain arrow-right
  icon button, and the empty state drops its decorative icon and keeps three quick prompts that
  fill the input instead of firing the request.

### Changed
- `flushPersistence()` is now awaited and covers both the atomic draft and `session.json`, so a quit
  inside the 500 ms debounce window cannot drop the last keystrokes.
- Closing the window via Alt+F4 or the taskbar now also runs the flush, through a `tauri://close-requested`
  guard that prevents the close, awaits the writes, then force-destroys the window.

### Fixed
- **Per-tab draft persistence (audit P0 #04):** the draft debounce queue is now keyed per tab instead of
  a single global slot, so editing tab B within the debounce window no longer drops tab A's pending
  draft. `flushPersistence()` flushes every queued tab. (`src/store/tabStore.ts`)
- **Dirty-tab close guard (audit P0 #05):** closing a tab with unsaved changes opens a
  Save & Close / Discard / Cancel dialog (`src/components/CloseTabDialog.tsx`) wired through
  `requestCloseTab` for the tab X button, `Ctrl+W`, and the App menu. A dirty close without an explicit
  discard decision now persists the draft to disk instead of deleting it; the draft is removed only on
  Discard or after a successful save.
- **Undo history preservation (audit P1 #06):** `EditorPane` keeps one CodeMirror view for its lifetime —
  theme switches reconfigure through a `Compartment`, tab switches swap cached per-tab `EditorState`
  objects (including undo history and restored cursor position), and the cache lives above the component
  so FullPreview unmounts no longer destroy the edit history. (`src/components/EditorPane.tsx`)

### Tests
- Audit production probes re-instrumented without `vi.mock` (module mocking regressed under the current
  vitest 3.2.7 runtime; draft probes now assert on the real browser-fallback persistence path) and
  extended to 7 probes covering the fixes above — all passing.
- New `CloseTabDialog` component suite (6 tests) covering request/discard/cancel/save-and-close flows.

### Security
- **Credentials removed from tracked source and docs.** The OmniRoute key hardcoded as a fallback in
  `src/api/ipc.ts` and the KIE debug key in `src-tauri/src/services/ai.rs` are gone; AGENTS.md, GEMINI.md,
  INFRA.md and the superpowers specs/plans no longer quote them. The browser-dev request now goes through
  the Vite `/api/omniroute` proxy, which attaches `OMNIROUTE_API_KEY` (read Node-side from the gitignored
  `.env`) so nothing secret is inlined into `dist/`; debug Rust builds read `KIE_AI_API_KEY_DEV` from the
  environment or the gitignored `src-tauri/.env.dev`. Both keys still exist in git history and should be
  rotated.
- Dropped paths are rejected unless absolute, and `read_document` / `save_document` refuse a symlink
  whose resolved target carries a different extension than the link that was named (e.g. `notes.md`
  pointing at `secret.key`).
- Tauri capabilities are trimmed to the window commands the UI actually calls, with
  `core:window:allow-destroy` and `core:window:allow-internal-toggle-maximize` added for the new chrome.

### Audit remediation — batch 2 (findings #07–#16)

#### Fixed
- **Offline PDF rendering (audit #07).** PDFs now load through a new authorized `read_document_bytes`
  IPC command (binary `tauri::ipc::Response`, gated by `ensure_authorized`, read on a blocking thread)
  instead of a `file://` URL, and PDF.js ships its worker from the local bundle (`?url` import) rather
  than a CDN — so parsing works with no network and under the app CSP. The viewer destroys its loading
  task / document on tab switch and unmount so large PDFs no longer leak memory. Opening or restoring a
  `.pdf` skips the UTF-8 text read. (`src-tauri/src/commands/fs.rs`, `src/components/PdfViewer.tsx`,
  `src/App.tsx`)
- **Honest save status (audit #08).** Tabs carry a per-tab save status (`idle`/`saving`/`saved`/`error`)
  and an edit `revision`; `markClean` refuses to clear the dirty flag when the buffer changed while the
  write was in flight, and save failures are surfaced in the footer with a Retry button instead of only
  a console line. Draft drafts show "Draft cached" only after the write is acknowledged, and open-picker
  failures surface an inline dismissible message. (`src/store/tabStore.ts`, `src/App.tsx`,
  `src/types/index.ts`)
- **AI stream lifecycle (audit #12).** Chunks are filtered by `streamId` so a late event from a prior
  session cannot bleed into a new one; `isStreaming` is finalized in a `finally` block so a dropped
  terminal event can never leave the input disabled; the backend no longer emits a `completed` event
  after a stream error; and prior chat turns are forwarded to the gateway so follow-up prompts keep
  their conversation context. (`src/components/AIPalette.tsx`, `src/api/ipc.ts`,
  `src-tauri/src/services/ai.rs`)
- **Light-theme contrast leaks (audit #10).** Inline code uses a themed `--code-inline-fg`
  (dark violet on white in light mode, ~7:1) instead of a pale lavender tuned only for dark panels, and
  table striping uses a themed overlay. Light-mode `--text-muted` was darkened to pass AA.
  (`src/index.css`)
- **Keyboard & motion accessibility (audit #11).** Tabs are a roving-tabindex tablist with Arrow/Home/End
  selection; the splitter is focusable and keyboard-resizable with `aria-value*`; the close-tab dialog
  traps Tab, restores focus on close, and caps its height to the viewport; the AI prompt has an explicit
  label; a global `:focus-visible` ring and a `prefers-reduced-motion` block were added.
  (`src/components/TabBar.tsx`, `LayoutManager.tsx`, `CloseTabDialog.tsx`, `AIPalette.tsx`, `index.css`)

#### Changed
- **Rust filesystem containment boundary (audit #09).** A new in-memory allowlist (`authorize_path` /
  `ensure_authorized`) admits only user-authorized paths (native pickers, drops, restored session tabs)
  and the app's internal config root; text and byte reads plus atomic saves run through it. Restored
  session paths are re-authorized on boot before hydration.
- **Durability (audit #13).** `atomic_save_file` now calls `sync_all()` before the atomic rename so a
  power loss cannot leave a truncated file.
- **Log redaction (audit #14).** AI service log lines pass through `redact_secrets` so bearer tokens and
  raw 32-hex keys never reach the log sink.
- **Reproducible builds (audit #16).** `src-tauri/Cargo.lock` is now tracked (removed from `.gitignore`).
- **Smaller initial bundle (audit #13).** PDF.js is code-split behind `React.lazy`, shrinking the main
  chunk from ~1.3 MB to ~1.01 MB with a 369 kB `PdfViewer` chunk loaded only when a PDF opens.

#### Security
- **Test-toolchain advisories (audit #15).** Vitest upgraded 3.2.7 → 4.1.12 (Vite 6 compatible); the
  Tinypool prototype-pollution and Vitest mock-redirect advisories are gone — `bun audit` reports 0
  vulnerabilities across 358 packages. As a side benefit, `vi.mock` works again under the new runner.

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
