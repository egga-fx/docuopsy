# Brain Map & Architecture State Graph

> **Notice for all Agents:** This document is the shared mental model of Docuopsy. Before starting any task, read this document to understand the active invariants, module dependencies, and completed milestones. Update it whenever architectural changes occur.

---

## 1. High-Level System State & Mental Model

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
|  [KIE AI Streaming Gateway]  <--->  [reqwest SSE to claude-haiku-5-5]         |
|                                                                               |
|  [Unified Tracing Engine]    <--->  [Rolling file appender + stdout + sanit.] |
+-----------------------------------------------+-------------------------------+
```

---

## 2. Active Architectural Invariants (Non-Negotiable)

1. **Priority Rule:** Speed > Security > Features.
2. **AI Model Boundary:** Hanya menggunakan provider **KIE AI** dengan model **`claude-haiku-5-5`**. Sama sekali TIDAK menggunakan OpenAI Codex, Grok (xAI), ataupun model lain di luar KIE AI.
3. **Crash-Resilience Rule:** A buffer marked `is_dirty = true` must have an atomic draft snapshot persisted to `%APPDATA%\Docuopsy\drafts\` within 500ms debounce.
4. **Log Sanitization Rule:** No raw document text or plaintext API keys may ever appear in logs.
5. **Sandboxing Rule:** Paths must be canonicalized and checked for path traversal (`..`) before any filesystem read or write.
6. **Preview Safety Rule:** All rendered HTML in markdown preview must be sanitized via `DOMPurify`.
7. **Open Source Rule:** 100% of dependencies must use permissive licenses (MIT, Apache-2.0, BSD, ISC).
8. **Package Manager & Runtime Rule:** Frontend dependencies and dev scripts strictly use **`bun`** (`bun install`, `bun run dev`, `bun run build`, `bun run test`, `bun run tsc --noEmit`).
9. **Impeccable Design & Dual-Theme Rule:** Must enforce *The Archival Forensics Studio* design system (`PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`) with day-one semantic parity between **Dark Forensics** (`#0B0F14`) and **High-Contrast Light** (`#FAF7F0`), `tabular-nums` on all numeric telemetry, 65ch–72ch scholarly reading measure, and WCAG 2.1 AA/AAA contrast.

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
| **Path Security & FS** | `src-tauri/src/services/fs.rs` | Completed & Tested | Rust Core Agent |
| **Session Persistence** | `src-tauri/src/services/persistence.rs` | Completed & Tested | Rust Core Agent |
| **KIE AI Streaming Gateway**| `src-tauri/src/services/ai.rs` | Completed & Tested | Rust Core Agent |
| **Tab State Store** | `src/store/tabStore.ts` | Completed & Tested | Frontend UI Agent |
| **Layout Switcher** | `src/components/LayoutManager.tsx` | Completed & Tested | Frontend UI Agent |
| **CodeMirror 6 Editor** | `src/components/EditorPane.tsx` | Completed & Tested | Frontend UI Agent |
| **Markdown Preview** | `src/components/MarkdownPreview.tsx` | Completed & Tested | Frontend UI Agent |
| **PDF.js Viewer** | `src/components/PdfViewer.tsx` | Completed & Tested | Frontend UI Agent |
| **In-Editor AI UI** | `src/components/AIPalette.tsx` | Completed & Tested | Frontend UI Agent |
| **Root Assembly** | `src/App.tsx`, `src-tauri/src/lib.rs` | Completed & Tested | Frontend / Rust Core |
| **E2E & Quality Gate** | `src/__tests__/`, `src-tauri/src/tests/` | 100% Passed (All Quality Gates) | QA / Reviewer Agent |

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
