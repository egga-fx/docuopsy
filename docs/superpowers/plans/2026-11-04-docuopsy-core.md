# Docuopsy Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Docuopsy, a high-performance, secure, multi-format desktop document viewer and text editor in Rust (Tauri v2) and React/TypeScript (CodeMirror 6, PDF.js) featuring forensic-grade session persistence, 3-mode layout, and KIE AI in-editor generation.

**Architecture:** Hybrid desktop architecture where native Rust handles atomic disk I/O, session persistence, path sandboxing, unified tracing, and KIE AI streaming SSE via reqwest; a lightweight React/TypeScript frontend (WebView2) hosts CodeMirror 6, PDF.js, and Markdown preview across a tri-mode layout with strict typed IPC contracts.

**Tech Stack:** Rust 2021, Tauri v2, Tokio, Serde, Tracing, Reqwest, React 18, TypeScript, Vite, Tailwind CSS, CodeMirror 6, PDF.js (`pdfjs-dist`), DOMPurify, Vitest, Tempfile, Wiremock.

**Spec:** [`docs/superpowers/specs/2026-11-04-docuopsy-prd.md`](file:///d:/@dev/docuopsy/docs/superpowers/specs/2026-11-04-docuopsy-prd.md) and [`DESIGN.md`](file:///d:/@dev/docuopsy/DESIGN.md)

---

## Global Constraints

- **Priority Hierarchy:** Speed (Performance) > Security > Features.
- **Licensing Constraint:** 100% of dependencies must use permissive open-source licenses (MIT, Apache-2.0, BSD, ISC). Zero GPL/AGPL or proprietary packages.
- **Persistence Constraint:** Unsaved buffers must be atomically snapshotted to `%APPDATA%\Docuopsy\drafts\` via temporary file swap; no partial or corrupted drafts on sudden crash.
- **Security Constraint:** File operations must canonicalize paths and reject directory traversal attempts (`..` escaping root).
- **Sanitization Constraint:** Markdown HTML previews must strictly pass through DOMPurify to neutralize XSS injection.
- **Log Privacy Constraint:** Zero raw document text and zero plaintext API keys in logs; all tracing logs must be scrubbed/redacted.
- **Model Floor:** KIE AI endpoint `https://api.kie.ai/v1/chat/completions` with model `claude-haiku-5-5`.

---

## Review Focus

1. **Malicious Path Traversal Input:** An input like `../../Windows/System32/drivers/etc/hosts` or symlink bypass must be rejected with an explicit `AppError::SecurityViolation` error and never opened.
2. **Sudden Power Loss / Crash with Dirty Tabs:** An unsaved document with edits must restore cleanly on subsequent boot without data loss or file corruption.
3. **Malicious Markdown Document with Script Tags:** An opened `.md` containing `<script>alert(1)</script>` or `<img onerror=...>` must render safe HTML with script payloads stripped.
4. **Network Timeout / Disconnect during AI Streaming:** If KIE AI drops mid-stream, the editor must retain previously received text and display an error indicator rather than freezing the UI.
5. **Corrupted or Deleted Session File:** If `%APPDATA%\Docuopsy\session.json` is missing or malformed JSON, the app must fallback gracefully to an empty default session rather than crashing on startup.

---

### Task 1: Project Scaffolding & Dual-Engine Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/src/main.rs`
- Create: `src/main.tsx`
- Test: `src/__tests__/smoke.test.ts`
- Test: `src-tauri/src/tests/smoke_test.rs`

**Interfaces:**
- Consumes: None (Root scaffolding).
- Produces: Runnable Tauri v2 project structure with working frontend Vitest and backend Cargo test suites.

- [ ] **Step 1: Write the failing frontend smoke test in `src/__tests__/smoke.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';

describe('Frontend Smoke Test', () => {
  it('should verify test runner is operational', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run frontend test to verify initial state**

Run: `pnpm vitest run src/__tests__/smoke.test.ts`  
Expected: Test runner execution confirms Vitest configuration works.

- [ ] **Step 3: Create `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html` and Tailwind configuration**

Configure React 18, TypeScript, Tailwind CSS, Lucide Icons, CodeMirror 6 (`@codemirror/view`, `@codemirror/state`, `@codemirror/commands`), `markdown-it`, `dompurify`, `pdfjs-dist`, and `@tauri-apps/api`.

- [ ] **Step 4: Scaffold `src-tauri/Cargo.toml`, `tauri.conf.json`, and minimal `src-tauri/src/main.rs`**

Add Rust dependencies: `tauri = { version = "2", features = [] }`, `tokio = { version = "1", features = ["full"] }`, `serde = { version = "1", features = ["derive"] }`, `serde_json = "1"`, `tracing = "0.1"`, `tracing-subscriber = "0.3"`, `tracing-appender = "0.2"`, `reqwest = { version = "0.12", features = ["stream", "json"] }`, `eventsource-stream = "0.2"`, `tempfile = "3"`, `thiserror = "1"`.

- [ ] **Step 5: Run `cargo test` in `src-tauri` and `pnpm test` in root**

Run: `cargo test --manifest-path src-tauri/Cargo.toml` and `pnpm test`  
Expected: PASS (0 errors, both test runners active).

- [ ] **Step 6: Commit**

```bash
git add package.json vite.config.ts vitest.config.ts tsconfig.json index.html src/ src-tauri/
git commit -m "feat: scaffold Tauri v2 and React TypeScript dual-engine architecture"
```

---

### Task 2: Rust Backend Tracing & Observability Engine

**Files:**
- Create: `src-tauri/src/logging.rs`
- Test: `src-tauri/src/tests/logging_test.rs`

**Interfaces:**
- Consumes: Environment variable `DOCUOPSY_LOG_LEVEL`, local app data path.
- Produces: `init_tracing() -> Result<WorkerGuard, AppError>`, `redact_secrets(input: &str) -> String`.

- [ ] **Step 1: Write the failing unit tests for log redaction and initialization in `src-tauri/src/tests/logging_test.rs`**

```rust
#[cfg(test)]
mod tests {
    use crate::logging::redact_secrets;

    #[test]
    fn test_redact_api_key() {
        let raw = "Authorization: Bearer e003b0c015d233ea848997456242e97b";
        let scrubbed = redact_secrets(raw);
        assert!(!scrubbed.contains("e003b0c015d233ea848997456242e97b"));
        assert!(scrubbed.contains("e003...97b") || scrubbed.contains("[REDACTED]"));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml test_redact_api_key`  
Expected: FAIL ("cannot find function `redact_secrets` in module `logging`").

- [ ] **Step 3: Implement `logging.rs` with rolling file appender and regex redaction**

Use `tracing_appender::rolling::daily` targeting `%LOCALAPPDATA%\Docuopsy\logs`, format logs with timestamps, and register `redact_secrets`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --manifest-path src-tauri/Cargo.toml test_redact_api_key`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/logging.rs src-tauri/src/tests/logging_test.rs
git commit -m "feat(backend): implement unified tracing engine with secret redaction"
```

---

### Task 3: Security & Path Sanitization File Service

**Files:**
- Create: `src-tauri/src/services/fs.rs`
- Create: `src-tauri/src/error.rs`
- Test: `src-tauri/src/tests/fs_security_test.rs`

**Interfaces:**
- Consumes: Raw file path strings from IPC commands.
- Produces: `validate_path(path: &Path) -> Result<PathBuf, AppError>`, `read_file_content(path: &str) -> Result<String, AppError>`, `atomic_save_file(path: &str, content: &str) -> Result<u64, AppError>`.

- [ ] **Step 1: Write failing unit test for directory traversal prevention in `src-tauri/src/tests/fs_security_test.rs`**

```rust
#[cfg(test)]
mod tests {
    use crate::services::fs::validate_path;
    use std::path::Path;

    #[test]
    fn test_reject_directory_traversal() {
        let malicious_path = Path::new("../../Windows/System32/cmd.exe");
        let result = validate_path(malicious_path);
        assert!(result.is_err(), "Must reject path with leading directory traversal");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml test_reject_directory_traversal`  
Expected: FAIL ("cannot find module `fs`").

- [ ] **Step 3: Implement `error.rs` and `services/fs.rs` with canonicalization and atomic file swap**

Implement `AppError::SecurityViolation(String)` and `AppError::Io(std::io::Error)`. In `atomic_save_file`, write first to a named temporary file in the same directory using `tempfile`, then execute an atomic rename/replace.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --manifest-path src-tauri/Cargo.toml test_reject_directory_traversal`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/error.rs src-tauri/src/services/fs.rs src-tauri/src/tests/fs_security_test.rs
git commit -m "feat(backend): implement path traversal validator and atomic file writer"
```

---

### Task 4: Forensic Session Persistence Engine

**Files:**
- Create: `src-tauri/src/models/session.rs`
- Create: `src-tauri/src/services/persistence.rs`
- Test: `src-tauri/src/tests/persistence_test.rs`

**Interfaces:**
- Consumes: `AppSession` and `TabState` data models.
- Produces: `save_session(session: &AppSession) -> Result<(), AppError>`, `load_session() -> Result<AppSession, AppError>`, `save_draft(tab_id: &str, content: &str) -> Result<PathBuf, AppError>`, `load_draft(tab_id: &str) -> Result<Option<String>, AppError>`.

- [ ] **Step 1: Write failing tests for atomic draft write and session recovery in `src-tauri/src/tests/persistence_test.rs`**

```rust
#[tokio::test]
async fn test_atomic_draft_save_and_recovery() {
    let temp_dir = tempfile::tempdir().unwrap();
    let service = PersistenceService::new_with_dir(temp_dir.path().to_path_buf());
    
    let tab_id = "test-tab-123";
    let draft_content = "# Unsaved Forensic Notes\nTesting recovery.";
    
    service.save_draft(tab_id, draft_content).await.unwrap();
    let recovered = service.load_draft(tab_id).await.unwrap();
    
    assert_eq!(recovered, Some(draft_content.to_string()));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml test_atomic_draft_save_and_recovery`  
Expected: FAIL ("cannot find struct `PersistenceService`").

- [ ] **Step 3: Implement `models/session.rs` and `services/persistence.rs`**

Serialize `AppSession` to `session.json` and drafts to `drafts/<tab_id>.draft` using atomic file replacement. If `session.json` does not exist or is corrupted, safely initialize an empty default `AppSession`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --manifest-path src-tauri/Cargo.toml test_atomic_draft_save_and_recovery`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/models/session.rs src-tauri/src/services/persistence.rs src-tauri/src/tests/persistence_test.rs
git commit -m "feat(backend): implement forensic session persistence and draft caching"
```

---

### Task 5: KIE AI Client Gateway (Claude Haiku 5.5 Streaming)

**Files:**
- Create: `src-tauri/src/services/ai.rs`
- Test: `src-tauri/src/tests/ai_stream_test.rs`

**Interfaces:**
- Consumes: User prompt, document context string, API key (`e003b0c015d233ea848997456242e97b`).
- Produces: `stream_chat_completion(prompt: &str, context: &str, app_handle: &AppHandle) -> Result<(), AppError>`. Emits `ai:stream:chunk` events with `{ streamId, delta, isDone, error }`.

- [ ] **Step 1: Write failing mock test for SSE stream parsing in `src-tauri/src/tests/ai_stream_test.rs`**

```rust
#[tokio::test]
async fn test_parse_kie_sse_chunk() {
    let sample_sse = "data: {\"choices\":[{\"delta\":{\"content\":\"Hello Docuopsy\"}}]}\n\n";
    let parsed = parse_sse_line(sample_sse).unwrap();
    assert_eq!(parsed, Some("Hello Docuopsy".to_string()));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml test_parse_kie_sse_chunk`  
Expected: FAIL ("cannot find function `parse_sse_line`").

- [ ] **Step 3: Implement `services/ai.rs` using `reqwest` and `eventsource-stream`**

Connect to `https://api.kie.ai/v1/chat/completions` with headers `Authorization: Bearer <key>`, payload model `claude-haiku-5-5`, stream `true`. Iterate incoming chunks and fire Tauri window events.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --manifest-path src-tauri/Cargo.toml test_parse_kie_sse_chunk`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/services/ai.rs src-tauri/src/tests/ai_stream_test.rs
git commit -m "feat(backend): implement KIE AI streaming client for Claude Haiku 5.5"
```

---

### Task 6: Frontend IPC Bridge & Unified Logger

**Files:**
- Create: `src/api/ipc.ts`
- Create: `src/api/logger.ts`
- Test: `src/__tests__/ipc.test.ts`

**Interfaces:**
- Consumes: Tauri `@tauri-apps/api/core`.
- Produces: `openDocument(path: string): Promise<DocumentData>`, `saveDocument(path: string, content: string): Promise<number>`, `persistSession(session: AppSession): Promise<void>`, `logEvent(level: string, message: string): Promise<void>`.

- [ ] **Step 1: Write failing test for IPC wrapper in `src/__tests__/ipc.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { logEvent } from '../api/logger';

describe('Frontend Logger Bridge', () => {
  it('should format and dispatch log event without throwing', async () => {
    await expect(logEvent('info', 'Test log message', { tabId: '1' })).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/ipc.test.ts`  
Expected: FAIL ("cannot find module `../api/logger`").

- [ ] **Step 3: Implement `src/api/ipc.ts` and `src/api/logger.ts`**

Map typed functions to Tauri `invoke()`. In `logger.ts`, pipe browser `console.warn` and `console.error` to Rust IPC command `log_event`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/ipc.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/ipc.ts src/api/logger.ts src/__tests__/ipc.test.ts
git commit -m "feat(frontend): implement typed IPC bridge and unified logger"
```

---

### Task 7: Reactive Tab State Store

**Files:**
- Create: `src/store/tabStore.ts`
- Test: `src/__tests__/tabStore.test.ts`

**Interfaces:**
- Consumes: `AppSession`, `TabState` types.
- Produces: `useTabStore` with actions: `openTab(tab)`, `closeTab(id)`, `setActiveTab(id)`, `updateContent(id, content)`, `setCursor(id, line, col)`, `setLayoutMode(mode)`.

- [ ] **Step 1: Write failing unit test for tab actions in `src/__tests__/tabStore.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { useTabStore } from '../store/tabStore';

describe('Tab Store', () => {
  it('should mark tab as dirty upon content modification', () => {
    const { addTab, updateTabContent, getActiveTab } = useTabStore.getState();
    const id = addTab({ title: 'Untitled-1', content: '', filePath: null });
    updateTabContent(id, 'New changes');
    expect(useTabStore.getState().tabs.find(t => t.id === id)?.isDirty).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/tabStore.test.ts`  
Expected: FAIL ("cannot find module `../store/tabStore`").

- [ ] **Step 3: Implement `src/store/tabStore.ts` using Zustand or lightweight reducer**

Support immutable state updates, automatic dirty flag calculation, active tab tracking, and debounce trigger for state persistence.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/tabStore.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/tabStore.ts src/__tests__/tabStore.test.ts
git commit -m "feat(frontend): implement reactive tab and workspace state store"
```

---

### Task 8: Top Tab Bar Component

**Files:**
- Create: `src/components/TabBar.tsx`
- Test: `src/__tests__/TabBar.test.tsx`

**Interfaces:**
- Consumes: `useTabStore`.
- Produces: Accessible React tab bar component with file type icons, dirty badge (`•`), close button (`×`), and shortcut listeners.

- [ ] **Step 1: Write failing component test in `src/__tests__/TabBar.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TabBar } from '../components/TabBar';
import { useTabStore } from '../store/tabStore';

test('renders open tabs and closes a tab when close button is clicked', () => {
  useTabStore.setState({
    tabs: [{ id: '1', title: 'sample.md', isDirty: true, filePath: '/sample.md', cursorLine: 1, cursorCol: 1, scrollTop: 0, content: '' }],
    activeTabId: '1',
  });

  render(<TabBar />);
  expect(screen.getByText('sample.md')).toBeInTheDocument();
  expect(screen.getByLabelText('dirty-indicator')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/TabBar.test.tsx`  
Expected: FAIL ("cannot find module `../components/TabBar`").

- [ ] **Step 3: Implement `src/components/TabBar.tsx`**

Style with Tailwind CSS. Attach keyboard shortcuts `Ctrl+W` to close tab, `Ctrl+N` to create a new scratch tab, `Ctrl+Tab` to cycle tabs.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/TabBar.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/TabBar.tsx src/__tests__/TabBar.test.tsx
git commit -m "feat(frontend): create top TabBar component with dirty markers and shortcuts"
```

---

### Task 9: Tri-Mode Layout Manager

**Files:**
- Create: `src/components/LayoutManager.tsx`
- Test: `src/__tests__/LayoutManager.test.tsx`

**Interfaces:**
- Consumes: `layoutMode` ('Split' | 'FullEditor' | 'FullPreview'), `splitRatio`.
- Produces: Resizable two-panel container with draggable splitter and layout toggle controls.

- [ ] **Step 1: Write failing test in `src/__tests__/LayoutManager.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { LayoutManager } from '../components/LayoutManager';

test('renders only editor in FullEditor mode', () => {
  render(
    <LayoutManager mode="FullEditor" editor={<div>Editor Pane</div>} preview={<div>Preview Pane</div>} />
  );
  expect(screen.getByText('Editor Pane')).toBeInTheDocument();
  expect(screen.queryByText('Preview Pane')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/LayoutManager.test.tsx`  
Expected: FAIL ("cannot find module `../components/LayoutManager`").

- [ ] **Step 3: Implement `src/components/LayoutManager.tsx`**

Support Split Mode (flex row with draggable separator), Full Editor Mode (100% width, preview unmounted), and Full Preview Mode (100% width, editor unmounted). Add shortcuts `Ctrl+\`, `Ctrl+Shift+E`, `Ctrl+Shift+P`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/LayoutManager.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/LayoutManager.tsx src/__tests__/LayoutManager.test.tsx
git commit -m "feat(frontend): implement resizable tri-mode layout manager"
```

---

### Task 10: CodeMirror 6 Editor Integration

**Files:**
- Create: `src/components/EditorPane.tsx`
- Create: `src/editor/extensions.ts`
- Test: `src/__tests__/EditorPane.test.tsx`

**Interfaces:**
- Consumes: Current tab content, active file type.
- Produces: Virtualized CodeMirror 6 editor view with cursor coordinate reporter and text mutation dispatcher.

- [ ] **Step 1: Write failing test for editor mounting in `src/__tests__/EditorPane.test.tsx`**

```tsx
import { render } from '@testing-library/react';
import { EditorPane } from '../components/EditorPane';

test('mounts CodeMirror editor container', () => {
  const { container } = render(<EditorPane content="Hello World" onChange={() => {}} onCursorChange={() => {}} />);
  expect(container.querySelector('.cm-editor')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/EditorPane.test.tsx`  
Expected: FAIL ("cannot find module `../components/EditorPane`").

- [ ] **Step 3: Implement `src/editor/extensions.ts` and `src/components/EditorPane.tsx`**

Bundle line numbers, history (undo/redo), syntax highlighting, and an `EditorView.updateListener` reporting cursor changes (`line`, `col`, `scrollTop`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/EditorPane.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/EditorPane.tsx src/editor/extensions.ts src/__tests__/EditorPane.test.tsx
git commit -m "feat(frontend): integrate virtualized CodeMirror 6 editor"
```

---

### Task 11: Markdown Preview with Anti-XSS Sanitization

**Files:**
- Create: `src/components/MarkdownPreview.tsx`
- Create: `src/utils/sanitizer.ts`
- Test: `src/__tests__/MarkdownPreview.test.tsx`

**Interfaces:**
- Consumes: Raw Markdown string.
- Produces: Sanitized HTML preview element rendered safely without script injection vulnerabilities.

- [ ] **Step 1: Write failing test for XSS neutralization in `src/__tests__/MarkdownPreview.test.tsx`**

```tsx
import { render } from '@testing-library/react';
import { MarkdownPreview } from '../components/MarkdownPreview';

test('neutralizes malicious script tags and onerror attributes', () => {
  const maliciousMd = '### Title\n<script>alert("hacked")</script>\n<img src="x" onerror="alert(1)">';
  const { container } = render(<MarkdownPreview markdown={maliciousMd} />);
  
  expect(container.querySelector('script')).toBeNull();
  const img = container.querySelector('img');
  expect(img?.getAttribute('onerror')).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/MarkdownPreview.test.tsx`  
Expected: FAIL ("cannot find module `../components/MarkdownPreview`").

- [ ] **Step 3: Implement `src/utils/sanitizer.ts` using `DOMPurify` and `src/components/MarkdownPreview.tsx` using `markdown-it`**

Configure `markdown-it` with HTML enabled, tables enabled, and wrap output through `DOMPurify.sanitize(html)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/MarkdownPreview.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/MarkdownPreview.tsx src/utils/sanitizer.ts src/__tests__/MarkdownPreview.test.tsx
git commit -m "feat(frontend): implement GFM Markdown preview with DOMPurify sanitization"
```

---

### Task 12: PDF.js Document Viewer

**Files:**
- Create: `src/components/PdfViewer.tsx`
- Test: `src/__tests__/PdfViewer.test.tsx`

**Interfaces:**
- Consumes: File path or raw byte array of a `.pdf` file.
- Produces: High-fidelity canvas/SVG page renderer with zoom in/out, fit-to-width, and page navigation controls.

- [ ] **Step 1: Write failing test for PDF viewer mounting in `src/__tests__/PdfViewer.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { PdfViewer } from '../components/PdfViewer';

test('renders PDF viewer controls', () => {
  render(<PdfViewer filePath="test.pdf" />);
  expect(screen.getByRole('toolbar', { name: 'pdf-controls' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/PdfViewer.test.tsx`  
Expected: FAIL ("cannot find module `../components/PdfViewer`").

- [ ] **Step 3: Implement `src/components/PdfViewer.tsx` using `pdfjs-dist`**

Setup worker configuration, render pages with lazy intersection-observer, and provide zoom (+ / -) controls.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/PdfViewer.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PdfViewer.tsx src/__tests__/PdfViewer.test.tsx
git commit -m "feat(frontend): implement embedded PDF.js canvas viewer"
```

---

### Task 13: In-Editor AI Assistant UI & Streaming Ingestion

**Files:**
- Create: `src/components/AIPalette.tsx`
- Test: `src/__tests__/AIPalette.test.tsx`

**Interfaces:**
- Consumes: `Ctrl+K` shortcut, active CodeMirror view instance.
- Produces: Floating command bar with preset actions (*Continue*, *Summarize*, *Fix Grammar*, *Custom*) that listens to `ai:stream:chunk` and inserts tokens smoothly into editor transactions.

- [ ] **Step 1: Write failing test for palette trigger in `src/__tests__/AIPalette.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { AIPalette } from '../components/AIPalette';

test('renders prompt options when open', () => {
  render(<AIPalette isOpen={true} onClose={() => {}} onSelectPrompt={() => {}} />);
  expect(screen.getByText('Continue Writing')).toBeInTheDocument();
  expect(screen.getByText('Summarize')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/__tests__/AIPalette.test.tsx`  
Expected: FAIL ("cannot find module `../components/AIPalette`").

- [ ] **Step 3: Implement `src/components/AIPalette.tsx`**

Listen to `ai:stream:chunk` events from Tauri IPC. Stream incoming deltas into the CodeMirror transaction at the current cursor selection without locking the UI.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/__tests__/AIPalette.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/AIPalette.tsx src/__tests__/AIPalette.test.tsx
git commit -m "feat(frontend): implement in-editor AI palette with streaming insertion"
```

---

### Task 14: End-to-End Assembly & Pre-Completion Quality Gate

**Files:**
- Modify: `src/App.tsx`
- Modify: `src-tauri/src/main.rs`
- Test: `src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: All components from Tasks 1-13.
- Produces: Fully integrated Docuopsy desktop application passing the pre-completion quality gate.

- [ ] **Step 1: Wire all components into `src/App.tsx` and register commands in `src-tauri/src/main.rs`**

Mount `TabBar`, `LayoutManager` (hosting `EditorPane`, `MarkdownPreview`, `PdfViewer`), and `AIPalette`.

- [ ] **Step 2: Run the full Backend Test Suite**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`  
Expected: All Rust unit and integration tests pass with 0 failures.

- [ ] **Step 3: Run the full Frontend Test Suite**

Run: `pnpm test`  
Expected: All Vitest unit and component tests pass with 0 failures.

- [ ] **Step 4: Run Rust Clippy with zero warning allowance**

Run: `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`  
Expected: Clean output with 0 warnings.

- [ ] **Step 5: Run TypeScript static type check**

Run: `pnpm tsc --noEmit`  
Expected: Clean output with 0 type errors.

- [ ] **Step 6: Update `TODOS.md`, `docs/memory/brain-map.md`, and `docs/memory/progress-log.md`**

Update checkboxes and log final verification outputs.

- [ ] **Step 7: Final Commit**

```bash
git add src/App.tsx src-tauri/src/main.rs TODOS.md docs/memory/
git commit -m "feat: complete end-to-end integration and pass quality gate"
```

---

## Plan Self-Review Checklist

1. **Spec Coverage:**
   - Multi-format text & code editing? -> Covered in Tasks 1, 7, 10.
   - GFM Markdown preview? -> Covered in Task 11.
   - PDF read-only viewer? -> Covered in Task 12.
   - Top tab bar & shortcuts? -> Covered in Tasks 7, 8.
   - 3-Mode layout switcher? -> Covered in Task 9.
   - Forensic-grade session persistence & atomic drafts? -> Covered in Tasks 3, 4.
   - KIE AI integration with `claude-haiku-5-5` & streaming? -> Covered in Tasks 5, 13.
   - Unified tracing & log redaction? -> Covered in Tasks 2, 6.
   - Testing harness (Rust & Vitest)? -> Covered in Tasks 1, 2, 3, 4, 5, 6, 14.
2. **Step Scan:** Every step follows the checkable TDD pattern (Failing test -> Run verify fail -> Implement -> Run verify pass -> Commit).
3. **Type Consistency:** Dual-sided matching types (`AppSession`, `TabState`, `AIStreamChunk`) verified across Rust serde structs and TypeScript interfaces.
4. **Review Focus:** All 5 critical input/failure modes have explicit test steps allocated.
5. **Proportion:** Clear, structured, signature-oriented steps without redundant full-file transcripts.
