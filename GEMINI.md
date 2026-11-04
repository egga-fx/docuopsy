# GEMINI.md - AI Agent Context & Directives for Docuopsy

## 1. Project Overview & Identity
- **Name:** Docuopsy (Document + Autopsy)
- **Concept:** High-performance, secure, multi-format desktop document viewer & text editor.
- **Core Stack:** Tauri v2 + Rust Core Backend + React/TypeScript (Vite) + Tailwind CSS + CodeMirror 6 + PDF.js.
- **Guiding Hierarchy:**
  1. **Kecepatan (Speed / Performance):** Minimal memory footprint, near-instant startup (<1.5s), zero-cost abstractions, non-blocking asynchronous I/O.
  2. **Keamanan (Security):** Sandbox enforcement, path traversal defense, safe memory handling via Rust, zero plaintext secrets in repo.
  3. **Fitur (Features):** Multi-format (`.txt`, `.md`, `.pdf`, code), 3-mode layout, forensic-grade persistence, in-editor AI streaming.

---

## 2. Core Architectural Directives
- **Zero Heavy Bloat:** Every library and dependency MUST be open-source (MIT, Apache-2.0, or BSD). Reject oversized npm libraries or unneeded Rust crates.
- **Tauri IPC Protocol:** Keep IPC messages strictly typed and thin. Rust handles disk access, persistence, file watching, and HTTP streaming to KIE AI. Frontend handles UI rendering, event dispatching, and view orchestration.
- **Single Source of Truth:**
  - Session state (open tabs, active tab, cursor coordinates, unsaved scratch drafts) is maintained in the Rust backend state and synced with the frontend via typed events.
  - Unsaved modifications must never be lost. Drafts are atomically cached locally.

---

## 3. AI Service Directives (KIE AI)
- **Provider:** KIE AI (`https://kie.ai`)
- **Default Model:** `claude-haiku-5-5` (Fast, high-efficiency generation)
- **API Protocol:** Standard streaming completions / chat completions endpoint (Server-Sent Events / SSE) over HTTP via Rust's `reqwest` async client.
- **Credential Handling:**
  - Do NOT hardcode the API key in client-side bundles or repository commits.
  - Default API Key for dev: `e003b0c015d233ea848997456242e97b` (configured via local `.env` or AppData config file).
  - The Rust backend is the sole proxy that talks to KIE AI; the frontend never contacts external AI endpoints directly.

---

## 4. Coding Conventions & Best Practices

### Rust (Backend)
- Follow idiomatic Rust (2021 edition).
- Use `thiserror` and `anyhow` for clear error propagation.
- All I/O operations must be asynchronous (`tokio`). Never block the Tauri main thread.
- File operations must validate paths against directory traversal (`..` canonicalization check).
- Enforce strict typing with `serde` for all Tauri commands.

### TypeScript / Frontend
- Strict TypeScript enabled (`noImplicitAny`, `strictNullChecks`).
- Editor integration uses **CodeMirror 6** for virtualized scrolling and minimal memory consumption.
- PDF rendering uses **PDF.js** with page-level lazy rendering.
- State management must be reactive and lean (e.g. Zustand or lightweight signals).

---

## 5. Agent Workflow Rules
1. **Spec & Test First:** Before writing implementation code, ensure interface definitions and unit tests exist.
2. **Verify Before Declaring Done:** Always execute compiler checks (`cargo check`, `cargo test`, `npm run build`) before concluding any task.
3. **Evidence-Based Assertions:** Never claim "it works" without presenting real command outputs or test logs.
4. **Preserve Integrity:** Never bypass Rust safety guidelines or disable security policies (e.g., CSP or Tauri capability permissions) without explicit user authorization.
