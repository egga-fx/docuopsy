# DESIGN.md - Technical Architecture & System Specification

## 1. System Vision & Architecture

**Docuopsy** is engineered as a lightweight, secure, and resilient multi-format document viewer and text editor for desktop environments. It bridges native system speed with modern document rendering capabilities.

```
+--------------------------------------------------------------------------------+
|                               DOCUOPSY RUNTIME                                 |
+--------------------------------------------------------------------------------+
| USER INTERFACE LAYER (Webview2 + TypeScript + Tailwind CSS)                    |
|                                                                                |
|  [Tabs Container]  [Tabs: Document.md* | Notes.txt | Spec.pdf | Untitled-1*]   |
|  +-------------------------------------+-------------------------------------+ |
|  | LEFT PANEL: CodeMirror 6 Editor     | RIGHT PANEL: Preview Engine         | |
|  | - Line numbers, syntax highlight    | - Markdown-it + Shiki (GFM Preview) | |
|  | - Cursor & selection listener       | - PDF.js Canvas/SVG viewer          | |
|  | - Inline AI completion overlay      | - Zoom, scroll sync, anchor jump    | |
|  +-------------------------------------+-------------------------------------+ |
|  [Status Bar: UTF-8 | Cursor Ln 42, Col 12 | Layout: Split | AI: KIE (Haiku)]  |
+---------------------------------------+----------------------------------------+
                                        | Strongly Typed Tauri IPC (JSON / SSE)
+---------------------------------------+----------------------------------------+
| RUST CORE SUBSYSTEM (Native Speed, Safety, Async Tokio Runtime)                |
|                                                                                |
|  [Session Persistence Manager]        [Atomic FS & Watcher]                    |
|   - Session registry (session.json)    - Safe read/write with atomic temp swap |
|   - Dirty scratch store (drafts/)      - Notify crate for disk change events   |
|   - Cursor & scroll positions                                                  |
|                                                                                |
|  [KIE AI Client Gateway]              [Security & Path Sanitizer]              |
|   - Provider: KIE AI (Haiku 5.5)       - Path traversal checks (canonicalize)  |
|   - Model: claude-haiku-5-5            - Strict Content Security Policy (CSP)  |
|   - Streaming SSE via reqwest          - Secure memory key management          |
+--------------------------------------------------------------------------------+
```

---

## 2. Core Priorities & Guiding Principles

### 1. Speed (Performance First)
- **Zero Heavy Runtime Overheads:** Native backend written in Rust; lightweight webview renderer powered by OS-native WebView2 on Windows.
- **Virtualized Rendering:** CodeMirror 6 only renders DOM nodes visible in the active viewport, ensuring 60 FPS scrolling even with 50,000+ line documents.
- **Asynchronous Non-blocking I/O:** Disk reads, state writes, and AI streaming execute on background Tokio worker threads.

### 2. Security (Security by Design)
- **Local-First & Isolated:** No external network connections except explicit user-initiated KIE AI queries.
- **Path Traversal Protection:** Absolute and relative paths are canonicalized and verified against symlink attacks before opening or saving.
- **Sanitized Previews:** All Markdown HTML output is sanitized to prevent DOM-based XSS when opening untrusted documents.
- **Zero Key Leaks:** API keys reside in memory and local configuration, never bundled into public binary assets.

### 3. Features (Precision Tooling)
- Tab management with dirty-buffer tracking.
- Tri-mode dynamic layout (Split, Full Editor, Full Preview).
- Forensic-grade session recovery (restores dirty edits after crashes or restarts).
- In-editor generative AI assistance.

---

## 3. Technology Stack & Open Source Manifest

Every component and library in Docuopsy is strictly **100% Free and Open Source** under permissive licenses (MIT, Apache-2.0, or BSD).

| Component / Layer | Technology | License | Purpose & Justification |
|---|---|---|---|
| **Desktop Shell** | Tauri v2 (`tauri`, `tauri-build`) | Apache-2.0 / MIT | Tiny binary size (~10MB), ultra-low memory usage, native OS integration. |
| **System Language** | Rust (2021 Edition) | Apache-2.0 / MIT | Memory safety without garbage collection, high concurrency with Tokio. |
| **Async Runtime & HTTP**| `tokio`, `reqwest`, `eventsource-stream` | MIT | Asynchronous file I/O and streaming SSE client for KIE AI. |
| **Serialization** | `serde`, `serde_json` | Apache-2.0 / MIT | High-speed JSON serialization for state persistence. |
| **File Watcher** | `notify` | CC0-1.0 / MIT | Detects external file modifications on disk. |
| **Frontend Framework** | React 18 / Vite / TypeScript | MIT / Apache-2.0 | Declarative UI, strict static type safety, instant HMR during dev. |
| **Styling & UI Tokens** | Tailwind CSS + Lucide Icons | MIT / ISC | Utility-first styling, zero runtime CSS overhead, accessible icons. |
| **Editor Core** | CodeMirror 6 | MIT | Extensible, modular, high-performance editor with virtual DOM scrolling. |
| **Markdown Parser** | `markdown-it` + `dompurify` | MIT / Apache-2.0 | Standard GFM parsing with hardened XSS sanitization. |
| **PDF Rendering Engine**| `pdfjs-dist` (Mozilla) | Apache-2.0 | Industry standard open-source PDF renderer without external C++ bindings. |

---

## 4. Subsystem Specifications

### 4.1. Session Persistence Engine (Forensic-Grade Recovery)
- **State File Location:** `%APPDATA%\Docuopsy\session.json`
- **Drafts Directory:** `%APPDATA%\Docuopsy\drafts\<tab-uuid>.draft`
- **Data Model:**
  ```rust
  #[derive(Serialize, Deserialize)]
  pub struct AppSession {
      pub version: u32,
      pub active_tab_id: String,
      pub layout_mode: LayoutMode, // Split | FullEditor | FullPreview
      pub split_ratio: f32,       // e.g. 0.50
      pub tabs: Vec<TabState>,
  }

  #[derive(Serialize, Deserialize)]
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

### 4.2. Layout Engine (3 Modes)
1. **Split Mode (Default for Markdown):**
   - Left pane: CodeMirror 6 Editor.
   - Right pane: Rendered Markdown preview with scroll-synchronization.
   - Draggable gutter divider.
2. **Full Editor Mode:**
   - Left pane occupies 100% width.
   - Right pane unmounted / hidden.
   - Optimized for `.txt`, configuration files, and code.
3. **Full Preview Mode:**
   - Right pane occupies 100% width.
   - Left pane unmounted / hidden.
   - Default mode for `.pdf` files and reader mode for `.md`.

### 4.3. KIE AI Integration Engine
- **Endpoint:** `https://api.kie.ai/v1/chat/completions` (or KIE AI chat completions endpoint)
- **Model:** `claude-haiku-5-5`
- **Authentication:** `Bearer e003b0c015d233ea848997456242e97b` (configurable via settings/env)
- **Streaming Pipeline:**
  1. Frontend sends prompt and context (selected text or full document) via `invoke('ai_generate_stream', { request })`.
  2. Rust `reqwest` opens an SSE stream to KIE AI.
  3. As tokens arrive, Rust emits `ai:stream:chunk` events to the Tauri frontend.
  4. CodeMirror extension receives the stream and writes characters smoothly into the editor buffer with an undoable transaction.

---

## 5. Security & Threat Modeling
- **Threat:** Malicious Markdown file containing `<script>` or `javascript:` URI attacks.
  - *Mitigation:* Strict DOMPurify sanitization before injection into preview DOM.
- **Threat:** Path traversal opening sensitive system files (`../../Windows/System32/...`).
  - *Mitigation:* Rust path normalization and sandboxed directory permissions.
- **Threat:** Memory exhaustion via massive PDF or text files.
  - *Mitigation:* File size bounds check; PDF.js virtualized canvas rendering; CodeMirror 6 viewport clipping.
