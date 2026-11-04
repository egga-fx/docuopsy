# AGENTS.md - Multi-Agent Operational Guidelines & Protocols

This document defines the rules of engagement, engineering methodology, and collaboration protocols for any autonomous AI agent or human engineer working within the **Docuopsy** codebase.

---

## 1. Development Methodology & Principles

### A. Priority Hierarchy
When resolving architectural or implementation trade-offs, agents MUST enforce this non-negotiable hierarchy:
$$\text{Speed (Performance)} > \text{Security} > \text{Features}$$

- **Speed:** Code must be low-latency. Zero gratuitous allocations, virtualized rendering for large buffers, async I/O.
- **Security:** Strict sandboxing, path canonicalization against directory traversal, sanitization of rendered Markdown (preventing XSS in webview), secure storage of API keys.
- **Features:** Only add features that conform to the performance and security baselines.

### B. Engineering Methodology: Spec-Driven & Test-Driven Development (TDD)
1. **Spec as Single Source of Truth:** Implementation must conform strictly to `docs/superpowers/specs/` and `DESIGN.md`.
2. **Red-Green-Refactor Cycle:**
   - **Red:** Define the test for the unit/command before writing the logic. Confirm it fails for the expected reason.
   - **Green:** Implement the minimal code required to pass the test.
   - **Refactor:** Clean up, optimize for performance, ensure zero regressions.
3. **Commit Granularity:** Small, logical atomic commits with conventional commit messages (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`).

### C. Best Practices for AI-Assisted Development
- **Explicit Type Contracts:** All Tauri commands and events must have dual-sided matching schemas (Rust structs with `Serialize`/`Deserialize` and TypeScript interfaces).
- **Narrow Context Windows:** Keep files modular (< 300 lines where feasible). Small, focused modules yield higher accuracy and fewer hallucinations.
- **No Invisible State:** Never rely on undocumented global variables or side effects. State must be inspectable and serializable.
- **Verification Over Assumption:** An agent must run tests and linters (`cargo test`, `cargo clippy`, `pnpm test`, `pnpm tsc`) and observe passing output before declaring any task complete.

---

## 2. Agent Roles & Responsibilities

| Role | Domain | Key Responsibilities |
|---|---|---|
| **Architect Agent** | System Design | Enforces `DESIGN.md`, validates dependency licenses, monitors memory & performance benchmarks. |
| **Rust Core Agent** | `src-tauri/` | Implements Tauri commands, state persistence, atomic disk operations, file watcher, and KIE AI client. |
| **Frontend UI Agent**| `src/` | Implements CodeMirror 6 editor, tab manager, layout switchers, PDF.js integration, and Tailwind styling. |
| **QA / Reviewer Agent** | `tests/` & CI | Reviews code for security holes (path traversal, XSS in preview), memory leaks, and writes integration tests. |

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

### Event Streaming Pattern (for AI Generations)
- Event name: `ai:stream:chunk`
- Event payload: `{ streamId: string, delta: string, isDone: boolean, error?: string }`

---

## 4. Security & Secret Handling
- **API Keys:** The KIE AI key (`e003b0c015d233ea848997456242e97b`) and any other credentials must be sourced from runtime configuration or environment files (`.env`), NEVER hardcoded in production source files.
- **Markdown Rendering:** Preview pane MUST use a sanitizer (e.g. DOMPurify or safe HTML generation in Markdown parser) to prevent script injection via opened documents.
- **File System Boundary:** File operations must verify that target paths exist within permitted system bounds and do not escape via symlink tricks or malicious relative paths.

---

## 5. Pre-Completion Quality Gate
Before handoff, any agent must run and verify:
1. `cargo clippy -- -D warnings` (Clean Rust code with zero warnings)
2. `cargo test` (All Rust backend unit & integration tests pass)
3. `pnpm tsc --noEmit` (TypeScript type checker passes with zero errors)
4. `pnpm lint` (Code style standards adhered to)
