# Brain Map & Architecture State Graph

> **Notice for all Agents:** This document is the shared mental model of Docuopsy. Before starting any task, read this document to understand the active invariants, module dependencies, and completed milestones. Update it whenever architectural changes occur.

---

## 1. High-Level System State & Mental Model

```
+-------------------------------------------------------------------------------+
|                            DOCUOPSY DESKTOP SYSTEM                            |
+-------------------------------------------------------------------------------+
| FRONTEND LAYER (React + Vite + Tailwind + CodeMirror 6 + PDF.js)             |
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
+-------------------------------------------------------------------------------+
```

---

## 2. Active Architectural Invariants (Non-Negotiable)

1. **Priority Rule:** Speed > Security > Features.
2. **Crash-Resilience Rule:** A buffer marked `is_dirty = true` must have an atomic draft snapshot persisted to `%APPDATA%\Docuopsy\drafts\` within 500ms debounce.
3. **Log Sanitization Rule:** No raw document text or plaintext API keys may ever appear in logs.
4. **Sandboxing Rule:** Paths must be canonicalized and checked for path traversal (`..`) before any filesystem read or write.
5. **Preview Safety Rule:** All rendered HTML in markdown preview must be sanitized via `DOMPurify`.
6. **Open Source Rule:** 100% of dependencies must use permissive licenses (MIT, Apache-2.0, BSD, ISC).

---

## 3. Module Index & Status

| Module | Location | Status | Owner Role |
|---|---|---|---|
| **Specifications & PRD** | `docs/superpowers/specs/`, `DESIGN.md` | Completed & Approved | Architect |
| **Agent Protocols & Memory**| `AGENTS.md`, `GEMINI.md`, `docs/memory/`| Active | Architect |
| **Project Scaffolding** | `src-tauri/`, `src/` | Pending (Task 1) | Rust / Frontend Agents |
| **Tracing & Log Bridge** | `src-tauri/src/logging.rs`, `src/api/logger.ts` | Pending (Task 2) | Rust Core Agent |
| **Path Security & FS** | `src-tauri/src/services/fs.rs` | Pending (Task 3) | Rust Core Agent |
| **Session Persistence** | `src-tauri/src/services/persistence.rs` | Pending (Task 4) | Rust Core Agent |
| **KIE AI Streaming Gateway**| `src-tauri/src/services/ai.rs` | Pending (Task 5) | Rust Core Agent |
| **Tab State Store** | `src/store/tabStore.ts` | Pending (Task 6) | Frontend UI Agent |
| **Layout Switcher** | `src/components/LayoutManager.tsx` | Pending (Task 7) | Frontend UI Agent |
| **CodeMirror 6 Editor** | `src/components/EditorPane.tsx` | Pending (Task 8) | Frontend UI Agent |
| **Markdown Preview** | `src/components/MarkdownPreview.tsx` | Pending (Task 9) | Frontend UI Agent |
| **PDF.js Viewer** | `src/components/PdfViewer.tsx` | Pending (Task 10) | Frontend UI Agent |
| **In-Editor AI UI** | `src/components/AIPalette.tsx` | Pending (Task 11) | Frontend UI Agent |
| **E2E & Quality Gate** | `tests/` | Pending (Task 12) | QA / Reviewer Agent |

---

## 4. Key Cross-Boundary Types (IPC Contracts)

```typescript
// Session Persistence Schema
export interface AppSession {
  version: number;
  activeTabId: string;
  layoutMode: 'Split' | 'FullEditor' | 'FullPreview';
  splitRatio: number;
  tabs: TabState[];
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
}

// AI Streaming Event Payload
export interface AIStreamChunk {
  streamId: string;
  delta: string;
  isDone: boolean;
  error?: string;
}
```
