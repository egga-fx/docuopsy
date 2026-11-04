# GEMINI.md - AI Agent Context & Directives for Docuopsy

## 1. Project Overview & Identity
- **Name:** Docuopsy (Document + Autopsy)
- **Concept:** High-performance, secure, multi-format desktop document viewer & text editor.
- **Core Stack:** Tauri v2 + Rust Core Backend + React/TypeScript (Vite) + Tailwind CSS + CodeMirror 6 + PDF.js.
- **Guiding Hierarchy:**
  $$\mathbf{Kecepatan\ (Speed\ /\ Performance)} \longrightarrow \mathbf{Keamanan\ (Security)} \longrightarrow \mathbf{Fitur\ (Features)}$$

---

## 2. Agent Brain Mapping & Persistent Memory Protocol
To prevent context fragmentation and ensure seamless handoffs between agents:
- **Primary Memory Directory:** `docs/memory/`
  - `docs/memory/brain-map.md`: Mental model, architecture graph, module status, and active invariants.
  - `docs/memory/progress-log.md`: Chronological changelog of completed tasks, test outputs, and decisions.
- **Agent Memory Rule:**
  1. **On Entry:** Every agent MUST read `docs/memory/brain-map.md` before taking any action.
  2. **On Completion:** Every agent MUST log completed work to `docs/memory/progress-log.md` and update `docs/memory/brain-map.md` before declaring a task finished.
  3. **User Dashboard:** Agents must update `TODOS.md` checkboxes in real-time as tasks progress.

---

## 3. Core Architectural Directives
- **Zero Heavy Bloat:** Every library and dependency MUST be open-source (MIT, Apache-2.0, or BSD). Reject oversized npm libraries or unneeded Rust crates.
- **Tauri IPC Protocol:** Keep IPC messages strictly typed and thin. Rust handles disk access, persistence, file watching, and HTTP streaming to KIE AI. Frontend handles UI rendering, event dispatching, and view orchestration.
- **Single Source of Truth:**
  - Session state (open tabs, active tab, cursor coordinates, unsaved scratch drafts) is maintained in the Rust backend state and synced with the frontend via typed events.
  - Unsaved modifications must never be lost. Drafts are atomically cached locally.

---

## 4. AI Service Directives (KIE AI)
- **Provider:** KIE AI (`https://kie.ai`)
- **Default Model:** `claude-haiku-5-5` (Fast, high-efficiency generation)
- **API Protocol:** Standard streaming completions / chat completions endpoint (Server-Sent Events / SSE) over HTTP via Rust's `reqwest` async client.
- **Credential Handling:**
  - Do NOT hardcode the API key in client-side bundles or repository commits.
  - Default API Key for dev: `e003b0c015d233ea848997456242e97b` (configured via local `.env` or AppData config file).
  - The Rust backend is the sole proxy that talks to KIE AI; the frontend never contacts external AI endpoints directly.

---

## 5. Coding Conventions & Best Practices

### Rust (Backend)
- Follow idiomatic Rust (2021 edition).
- Use `thiserror` and `anyhow` for clear error propagation.
- All I/O operations must be asynchronous (`tokio`). Never block the Tauri main thread.
- File operations must validate paths against directory traversal (`..` canonicalization check).
- Enforce strict typing with `serde` for all Tauri commands.
- Use `tracing` for structured logs; never leave bare `println!`.

### TypeScript / Frontend
- Strict TypeScript enabled (`noImplicitAny`, `strictNullChecks`).
- Editor integration uses **CodeMirror 6** for virtualized scrolling and minimal memory consumption.
- PDF rendering uses **PDF.js** with page-level lazy rendering.
- State management must be reactive and lean (e.g. Zustand or lightweight signals).

---

## 6. Agent Workflow Rules
1. **Spec & Test First:** Before writing implementation code, ensure interface definitions and unit tests exist.
2. **Verify Before Declaring Done:** Always execute compiler checks (`cargo check`, `cargo test`, `pnpm test`, `pnpm tsc`) before concluding any task.
3. **Evidence-Based Assertions:** Never claim "it works" without presenting real command outputs or test logs.
4. **Preserve Integrity:** Never bypass Rust safety guidelines or disable security policies without explicit user authorization.
