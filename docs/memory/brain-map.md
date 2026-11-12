# Brain Map & Architecture State Graph

> **Notice for all Agents:** This document is the shared mental model of Docuopsy. Before starting any task, read this document to understand the active invariants, module dependencies, and completed milestones. Update it whenever architectural changes occur.

---

## 1. High-Level System State & Mental Model

> **Production audit override — 2026-11-05:** NO-GO; historical Completed/Verified module labels below describe implementation milestones, not production acceptance. See `docs/audits/2026-11-05-production-readiness.md`. Regular gates pass (26 frontend / 15 Rust, TypeScript, Clippy, frontend build), but four isolated audit probes fail: cross-tab draft persistence, Undo/store synchronization, Undo history after theme change, and dirty close protection. Credentials exist in source/history; clean session file hydration, PDF local loading, file authorization bounds, theme parity, and accessibility also require remediation. No application fixes or push were performed by this audit. HEAD changed concurrently from `264ee69` to `5ad56a0`; use a frozen release snapshot for acceptance.

```
+-------------------------------------------------------------------------------+
|                            DOCUOPSY DESKTOP SYSTEM                            |
+-------------------------------------------------------------------------------+
| FRONTEND LAYER (React + Vite + Tailwind + CodeMirror 6 + PDF.js + Bun)        |
|                                                                               |
|  [Tab Store (Zustand)] <---> [Layout Engine (Split/FullEditor/FullPreview)]   |
|         ^                                     ^                               |
|         |                                     |                               |
|  [CodeMirror 6 View]                [Preview Engine (Markdown/PDF)]           |
|         |                                     |                               |
|  [AIPalette (Ctrl+K)]                         |                               |
+---------+-------------------------------------+-------------------------------+
          | Tauri IPC Invokes & Event Listeners
+---------+-------------------------------------+-------------------------------+
| BACKEND CORE LAYER (Rust Tauri v2 + Tokio)                                    |
|                                                                               |
|  [State Persistence Engine]  <--->  [Atomic Tempfile Swap]                    |
|   - session.json (%APPDATA%)        - drafts/<tab-id>.draft                   |
|                                                                               |
|  [Safe File System Service]  <--->  [Path Canonicalization & Sandbox]         |
|                                                                               |
|  [KIE AI Streaming Gateway]  <--->  [reqwest SSE to deepseek-v4-1-flash]     |
|                                                                               |
|  [Unified Tracing Engine]    <--->  [Rolling file appender + stdout + sanit.] |
+-----------------------------------------------+-------------------------------+
```

---

## 2. Active Architectural Invariants (Non-Negotiable)

1. **Priority Rule:** Speed > Security > Features.
2. **AI Model Boundary:** Menggunakan provider **KIE AI** dengan model **`deepseek-v4-1-flash`** (`https://kie.ai/deepseek-v4-1-Flash`, endpoint `/openai/v1/responses`). Sama sekali TIDAK menggunakan provider di luar KIE AI.
3. **Crash-Resilience Rule:** A buffer marked `is_dirty = true` must have an atomic draft snapshot persisted to `%APPDATA%\Docuopsy\drafts\` within 500ms debounce. The draft queue is **per tab** (`pendingDrafts`/`draftDebounceTimers` maps) — a shared timer that lets one tab's edit cancel another tab's draft write violates this rule. A dirty tab is never closed through a draft-deleting path: `closeTab` persists the draft unless the caller passes `{ discard: true }`, and UI close paths route through `requestCloseTab` → `CloseTabDialog` (Save & Close / Discard / Cancel). A save is acknowledged per **revision**: `markClean(id, path, expectedRevision)` must keep the tab dirty if `revision` advanced while the write was in flight, and a failed save keeps the tab dirty with a visible Retry (audit #08).
4. **Log Sanitization Rule:** No raw document text or plaintext API keys may ever appear in logs.
5. **Sandboxing Rule:** Paths must be canonicalized and checked for path traversal (`..`) before any filesystem read or write, and every read/save/byte-read must pass `ensure_authorized` — an in-memory allowlist populated only by native pickers, drag-drops, and restored session tabs, plus the app's internal config root. The allowlist is process-local, so restored session paths are re-authorized (`allow_paths`) on boot before hydration (audit #09).
6. **Preview Safety Rule:** All rendered HTML in markdown preview must be sanitized via `DOMPurify`.
7. **Open Source Rule:** 100% of dependencies must use permissive licenses (MIT, Apache-2.0, BSD, ISC).
8. **Package Manager & Runtime Rule:** Frontend dependencies and dev scripts strictly use **`bun`** (`bun install`, `bun run dev`, `bun run build`, `bun run test`, `bun run tsc --noEmit`).
9. **Impeccable Design & Dual-Theme Rule:** Must enforce *The Archival Forensics Studio* design system (`PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`) with day-one semantic parity between **Dark Forensics** (`#0B0F14`) and **High-Contrast Light** (`#FAF7F0`), `tabular-nums` on all numeric telemetry, 65ch–72ch scholarly reading measure, and WCAG 2.1 AA/AAA contrast.
10. **Dynamic Window Size Rule:** On startup, the desktop window size must dynamically calculate and adjust to 70% of the active display monitor's physical resolution (`0.70x width`, `0.70x height`) and center itself cleanly.
11. **Custom Chrome Rule:** The window runs with `decorations: false`, so minimize / fullscreen / close and the `data-tauri-drag-region` strips in `TabBar` are the only window affordances. Any new window or webview IPC call must be granted explicitly in `src-tauri/capabilities/default.json`, and every close path (button, Alt+F4, taskbar) must pass through the awaited persistence flush.
12. **Drop Trust Rule:** Dropped paths are checked in TypeScript for usability only (absolute path, allow-listed extension, batch cap); the authoritative gates (traversal, symlink type-swap, allowlist membership, atomic writes) live in `src-tauri/src/services/fs.rs`. A dropped path is registered via `allow_paths` before it is opened.
13. **Frameless Drag Rule:** The grip box in `TabBar` (left of `leftAddon`) is the designated window drag handle; any element added to the header must not cover it, and child icons inside a drag region need `pointer-events-none` or Tauri will not start the drag.
14. **Lazy Grammar Rule:** Editor grammars resolve through a `Compartment` fed by `resolveLanguageExtension`, which must `await description.load()` before reading `.extension` — `description.support` is `undefined` until then. The name handed to the resolver is `filePath` when the tab is backed by a file (a renamed tab title is a display label, not a grammar), and resolutions are cached per name behind an applied-name guard so re-configuring an identical extension never forces a full re-parse.
15. **No Credential in Source Rule:** Keys exist only in gitignored `.env` / `src-tauri/.env.dev` / `.secret/`. Browser-dev AI goes through the Vite `/api/omniroute` proxy (`OMNIROUTE_API_KEY`, loaded Node-side, never a `VITE_` var) so nothing secret is inlined into `dist/`; release Rust builds take `KIE_AI_API_KEY` from the environment.
16. **Editor Longevity Rule:** `EditorPane` owns exactly one `EditorView` for its lifetime. Theme changes go through a `themeCompartment.reconfigure` dispatch; tab changes swap per-tab `EditorState` objects cached in the module-scoped `editorStatesByTab` map (which also survives FullPreview unmounts). Never destroy/recreate the view on theme or tab change — that throws away the undo history (audit P1 #06).
17. **PDF Byte Rule:** PDFs are parsed from raw bytes (`read_document_bytes` → `tauri::ipc::Response`) by a locally bundled PDF.js worker (`?url`, no CDN), never from a `file://` URL, so rendering works offline and under the app CSP. `PreviewContainer` lazy-loads `PdfViewer` (code-split); the viewer destroys its loading task/document on tab switch and unmount (audit #07).
18. **AI Stream Lifecycle Rule:** Every stream chunk is filtered by `streamId`; `isStreaming` is finalized in a `finally` so a dropped terminal event can never wedge the input; the backend never emits `completed` after an `error`; prior turns are forwarded so multi-turn context survives (audit #12).

---

## 3. Module Index & Status

| Module | Location | Status | Owner Role |
|---|---|---|---|
| **Product & Design System** | `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json` | Completed & Verified (`impeccable doctor`) | Architect / Design Director |
| **Specifications & PRD** | `docs/superpowers/specs/`, `DESIGN.md` | Completed & Approved | Architect |
| **Agent Protocols & Memory**| `AGENTS.md`, `GEMINI.md`, `docs/memory/`| Active | Architect |
| **Implementation Plan** | `docs/superpowers/plans/` | Completed & Fully Implemented | Architect |
| **Project Scaffolding** | `src-tauri/`, `src/` | Completed & Verified | Rust / Frontend Agents |
| **Tracing & Log Bridge** | `src-tauri/src/logging.rs`, `src/api/logger.ts` | Completed & Tested | Rust Core Agent |
| **Path Security & FS & Dialog** | `src-tauri/src/services/fs.rs`, `rfd` | Completed & Tested | Rust Core Agent |
| **Session Persistence** | `src-tauri/src/services/persistence.rs` | Completed & Tested | Rust Core Agent |
| **KIE AI Streaming Gateway**| `src-tauri/src/services/ai.rs` | Completed & Tested | Rust Core Agent |
| **Tab State Store** | `src/store/tabStore.ts` | Completed & Tested | Frontend UI Agent |
| **App Menu Toolbar** | `src/components/AppMenu.tsx` | Completed & Tested | Frontend UI Agent |
| **Layout Switcher** | `src/components/LayoutManager.tsx` | Completed & Tested | Frontend UI Agent |
| **CodeMirror 6 Editor** | `src/components/EditorPane.tsx` | Completed & Tested | Frontend UI Agent |
| **Format-Aware Preview**| `src/components/PreviewContainer.tsx` | Completed & Tested | Frontend UI Agent |
| **Markdown Preview** | `src/components/MarkdownPreview.tsx` | Completed & Tested | Frontend UI Agent |
| **PDF.js Viewer** | `src/components/PdfViewer.tsx` | Completed & Tested | Frontend UI Agent |
| **Code/Text Preview** | `src/components/CodePreview.tsx` | Completed & Tested | Frontend UI Agent |
| **AI Stream Chat & Recent Tasks** | `src/components/AIPalette.tsx` | Completed & Tested | Frontend UI Agent |
| **Root Assembly** | `src/App.tsx`, `src-tauri/src/lib.rs` | Completed & Verified | Frontend / Rust Core |
| **File Drop Open (DnD)** | `src/api/dnd.ts`, `src/hooks/useFileDropOpen.ts` | Completed & Tested (native + browser paths) | Frontend UI Agent |
| **Tab Fast Rename** | `src/components/TabBar.tsx`, `useTabStore.renameTab` | Completed & Tested | Frontend UI Agent |
| **Custom Window Chrome** | `src/components/WindowControls.tsx`, `src/api/window.ts` | Completed & Tested (fake `__TAURI_INTERNALS__`); live undecorated boot not yet verified | Frontend UI Agent |
| **Close-Flush Guard** | `handleCloseRequest` (`src/api/window.ts`), `flushPersistence` (`src/store/tabStore.ts`) | Completed & Tested | Frontend / Rust Core |
| **Symlink Type-Swap Guard** | `src-tauri/src/services/fs.rs` (`validate_symlink_type`) | Implemented; tests skip on Windows without developer mode | Rust Core Agent |
| **Window Grip & Tab Panning** | `src/components/TabBar.tsx`, `.scrollbar-none` (`src/index.css`) | Completed & Tested (DOM-level; native drag unverified) | Frontend UI Agent |
| **Lazy Syntax Grammars** | `src/editor/extensions.ts` (`resolveLanguageExtension`), `@codemirror/language-data` | Completed & Tested; verified live for Python and fenced Markdown | Frontend UI Agent |
| **Recent Sessions Bubble** | `src/components/AIPalette.tsx` | Completed & Tested | Frontend UI Agent |
| **Dirty-Close Guard Dialog** | `src/components/CloseTabDialog.tsx`, `useTabStore.requestCloseTab` | Completed & Tested (6 component tests + probes) | Frontend UI Agent |
| **E2E & Quality Gate** | `src/__tests__/`, `src-tauri/src/tests/` | 100% Passed (17 Vitest files / 81 tests + 23 Cargo tests + 7 audit probes; `bun audit` 0 vulns) | QA / Reviewer Agent |

---

## 4. Key Cross-Boundary Types (IPC Contracts)

```typescript
// Session Persistence Schema
export interface AppSession {
  version: number;
  activeTabId: string;
  layoutMode: 'Split' | 'FullEditor' | 'FullPreview';
  splitRatio: number;
  theme?: string;
  accentColor?: string;
  isAiSidebarOpen?: boolean;
  aiSidebarWidth?: number;
  tabs: Omit<TabState, 'content'>[];
}

export interface TabState {
  id: string;
  filePath: string | null;
  title: string;
  isDirty: boolean;
  cursorLine: number;
  cursorCol: number;
  scrollTop: number;
  draftPath: string | null;
  content: string;
}

// AI Streaming Event Payload
export interface AIStreamChunk {
  streamId: string;
  delta: string;
  isDone: boolean;
  error?: string;
}
```

### Latest audit snapshot — 05e0937

The concurrent editor fix closes the stale-closure Undo/store mismatch; its audit probe now passes. Three audit probes still fail (cross-tab draft cancellation, theme-change Undo loss, dirty-close deletion). Clean-file restoration still lacks disk hydration. Current audit has 15 open findings (4 P0, 8 P1, 3 P2), plus one resolved finding. This update supersedes the earlier 4/4 failure count above; verdict remains NO-GO. See the report and latest probe evidence.
