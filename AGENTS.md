# AGENTS.md - Multi-Agent Operational Guidelines & Protocols

This document defines the rules of engagement, engineering methodology, and collaboration protocols for any autonomous AI agent or human engineer working within the **Docuopsy** codebase.

---

## 1. Development Methodology & Principles

### A. Priority Hierarchy
When resolving architectural or implementation trade-offs, agents MUST enforce this non-negotiable hierarchy:
$$\text{Speed (Performance)} > \text{Security} > \text{Features}$$

- **Speed:** Code must be low-latency. Zero gratuitous allocations, virtualized rendering for large buffers, async I/O.
- **Security:** Strict sandboxing, path canonicalization against directory traversal, sanitization of rendered Markdown (preventing XSS in webview), secure storage of API keys, and log redaction.
- **Features:** Only add features that conform to the performance and security baselines.

### B. Engineering Methodology: Spec-Driven & Test-Driven Development (TDD)
1. **Spec as Single Source of Truth:** Implementation must conform strictly to `docs/superpowers/specs/` and `DESIGN.md`.
2. **Red-Green-Refactor Cycle:**
   - **Red:** Define the test for the unit/command before writing the logic. Confirm it fails for the expected reason.
   - **Green:** Implement the minimal code required to pass the test.
   - **Refactor:** Clean up, optimize for performance, ensure zero regressions.
3. **Commit Granularity:** Small, logical atomic commits with conventional commit messages (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`).

### C. Agent Brain Mapping & Memory Protocol
To ensure continuity across agents, context boundaries, and session resets:
- **Central Memory Directory:** `docs/memory/`
  - `docs/memory/brain-map.md`: System mental model, module dependency graph, invariant list, and active architectural state.
  - `docs/memory/progress-log.md`: Detailed changelog of tasks executed, test verifications, and architectural decisions.
- **Mandatory Agent Check-In & Check-Out:**
  1. **Before Starting:** Every agent MUST read `docs/memory/brain-map.md` to synchronize with current system state.
  2. **After Completion:** Every agent MUST record test evidence in `docs/memory/progress-log.md` and refresh `docs/memory/brain-map.md`.
  3. **User Dashboard:** Update `TODOS.md` checkboxes in real-time.

---

## 2. Agent Roles & Responsibilities

| Role | Domain | Key Responsibilities |
|---|---|---|
| **Architect Agent** | System Design | Enforces `DESIGN.md`, validates dependency licenses, monitors memory & performance benchmarks. |
| **Rust Core Agent** | `src-tauri/` | Implements Tauri commands, state persistence, atomic disk operations, file watcher, `tracing` logging, and KIE AI client. |
| **Frontend UI Agent**| `src/` | Implements CodeMirror 6 editor, tab manager, layout switchers, PDF.js integration, frontend logger bridge, and Tailwind styling. |
| **QA / Reviewer Agent** | `tests/` & CI | Reviews code for security holes (path traversal, XSS in preview), memory leaks, writes integration tests, and verifies test coverage. |

---

## 3. IPC Contract Specification (Rust <-> Frontend)

All cross-boundary communication must use explicit, strongly-typed contracts:

### Standard Command Pattern
```rust
// In Rust (src-tauri/src/commands/...)
#[tauri::command]
pub async fn save_document(path: String, content: String) -> Result<DocumentMeta, AppError> { ... }
```
```typescript
// In Frontend (src/api/ipc.ts)
export interface DocumentMeta {
  path: string;
  byteSize: number;
  lastModified: number;
}

export async function saveDocument(path: string, content: string): Promise<DocumentMeta> {
  return await invoke<DocumentMeta>('save_document', { path, content });
}
```

### Logging Bridge Command Pattern
```rust
// In Rust (src-tauri/src/commands/logging.rs)
#[tauri::command]
pub fn log_event(level: String, message: String, context: Option<String>) {
    // Routes frontend logs into the Rust unified tracing system
}
```

### Event Streaming Pattern (for AI Generations)
- Event name: `ai:stream:chunk`
- Event payload: `{ streamId: string, delta: string, isDone: boolean, error?: string }`

---

## 4. Security & Secret Handling
- **API Keys:** No credential ever appears in source, docs, or tests. Keys are read at runtime from the gitignored `.env` (frontend) and `src-tauri/.env.dev` or `KIE_AI_API_KEY_DEV` (Rust debug builds).
- **Markdown Rendering:** Preview pane MUST use a sanitizer (`DOMPurify`) to prevent script injection via opened documents.
- **File System Boundary:** File operations must verify that target paths exist within permitted system bounds and do not escape via symlink tricks or malicious relative paths.

---

## 5. Pre-Completion Quality Gate
Before handoff, any agent must run and verify:
1. `cargo test --manifest-path src-tauri/Cargo.toml` (All Rust backend unit & integration tests pass)
2. `bun run test` (All frontend Vitest unit & component tests pass)
3. `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings` (Clean Rust code with zero warnings)
4. `bun run tsc --noEmit` (TypeScript type checker passes with zero errors)
