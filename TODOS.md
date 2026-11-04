# TODOS.md - Docuopsy Development Monitoring Dashboard

> **User Live Monitoring:** Track real-time progress across all phases and tasks. Agents update these checkboxes as tasks transition through the Red-Green-Refactor cycle.

---

## 📊 Overall Progress Summary

- **Current Active Phase:** Phase 1 (Project Scaffolding & Toolchain)
- **Current Milestone:** Ready for Implementation Plan Execution
- **Priority Hierarchy:** `Speed (Performance) > Security > Features`
- **AI Provider:** KIE AI (`claude-haiku-5-5`) via Streaming SSE in Rust Backend

---

## 📌 Phase 0: System Architecture & Specifications (DONE ✅)
- [x] **0.1.** Inisialisasi Git repository di workspace root (`d:\@dev\docuopsy`).
- [x] **0.2.** Penyusunan PRD & Spesifikasi Fungsional (`docs/superpowers/specs/2026-11-04-docuopsy-prd.md`).
- [x] **0.3.** Pembuatan berkas konteks AI & Operasional Multi-Agent:
  - [x] `GEMINI.md` (Konteks model AI, aturan IPC, dan konvensi kode)
  - [x] `AGENTS.md` (Protokol multi-agent, TDD, quality gates, dan memory rules)
  - [x] `DESIGN.md` (Arsitektur teknis, diagram aliran data, manifest 100% open source)
  - [x] `README.md` (Dokumentasi publik, fitur, dan keybindings)
  - [x] `INFRA.md` (Toolchain, environment variables, build & CI pipeline)
- [x] **0.4.** Arsitektur Testing & Logging:
  - [x] Spesifikasi `tracing` engine & log redaction di Rust backend
  - [x] Spesifikasi testing suite (`cargo test`, `wiremock`, `tempfile`, `vitest`)
- [x] **0.5.** Brain Mapping & Central Memory System:
  - [x] `docs/memory/brain-map.md` (Mental model & active invariants)
  - [x] `docs/memory/progress-log.md` (Log pengerjaan & bukti pengujian)

---

## 🏗️ Phase 1: Project Scaffolding & Toolchain Setup
- [ ] **1.1.** Inisialisasi proyek hybrid Tauri v2 + React/TypeScript (Vite) + Tailwind CSS.
- [ ] **1.2.** Konfigurasi `Cargo.toml` backend dengan dependensi inti (Tauri, Tokio, Serde, Tracing, Reqwest).
- [ ] **1.3.** Konfigurasi `package.json` frontend dengan dependensi (CodeMirror 6, Lucide, Vitest, Tailwind).
- [ ] **1.4.** Setup Vitest test runner dan validasi basic smoke test (`pnpm test`).
- [ ] **1.5.** Setup Cargo test suite dan validasi basic backend test (`cargo test`).

---

## 🦀 Phase 2: Rust Backend Core & Persistence Engine
- [ ] **2.1.** Implementasi modul Logging (`src-tauri/src/logging.rs`) dengan rolling file appender dan sensor redaction.
- [ ] **2.2.** Implementasi File System Security Service (`src-tauri/src/services/fs.rs`) dengan normalisasi path anti-traversal.
- [ ] **2.3.** Implementasi Session Persistence Engine (`src-tauri/src/services/persistence.rs`):
  - [ ] Serde model untuk `AppSession` dan `TabState`
  - [ ] Mekanisme atomic write draf scratch buffer (`tempfile` $\to$ rename)
  - [ ] Handler auto-save dengan debouncing 500ms
  - [ ] Unit test pemulihan draf setelah crash simulasi
- [ ] **2.4.** Registrasi Tauri IPC Commands (`save_document`, `read_document`, `restore_session`, `log_event`).

---

## 🎨 Phase 3: Frontend UI, Tab System & 3-Mode Layout
- [ ] **3.1.** Implementasi typed IPC wrapper di frontend (`src/api/ipc.ts` dan `src/api/logger.ts`).
- [ ] **3.2.** Implementasi Reactive Tab Store (Zustand/Reducer) untuk melacak active tab, dirty buffers, kursor, dan scroll.
- [ ] **3.3.** Pembuatan komponen Top Tab Bar (`src/components/TabBar.tsx`):
  - [ ] Tab switching, close button (`×`), dirty marker (`•`), new tab (`+`)
  - [ ] Keyboard shortcuts: `Ctrl+N`, `Ctrl+W`, `Ctrl+Tab`
- [ ] **3.4.** Pembuatan Layout Manager 3-Mode (`src/components/LayoutManager.tsx`):
  - [ ] Mode Split (Editor kiri, Preview kanan) dengan draggable divider
  - [ ] Mode Full Editor
  - [ ] Mode Full Preview
  - [ ] Keyboard shortcuts: `Ctrl+\`, `Ctrl+Shift+E`, `Ctrl+Shift+P`
- [ ] **3.5.** Unit test frontend untuk Tab Store dan Layout Switcher di Vitest.

---

## 📝 Phase 4: Editor Core & Multi-Format Previews
- [ ] **4.1.** Integrasi CodeMirror 6 Editor (`src/components/EditorPane.tsx`):
  - [ ] Virtualized DOM rendering untuk file besar
  - [ ] Syntax highlighting untuk Markdown, JSON, Code, dan Plain Text
  - [ ] Cursor change & scroll listeners tersinkron ke Tab Store
- [ ] **4.2.** Integrasi Markdown Preview (`src/components/MarkdownPreview.tsx`):
  - [ ] Parser Markdown-it dengan dukungan GFM tables dan code blocks
  - [ ] Sanitasi ketat anti-XSS via DOMPurify
  - [ ] Synchronized scrolling dengan CodeMirror 6
- [ ] **4.3.** Integrasi PDF.js Viewer (`src/components/PdfViewer.tsx`):
  - [ ] High-fidelity canvas/SVG rendering per halaman (lazy loading)
  - [ ] Navigasi halaman, zoom in/out, fit width
  - [ ] Auto-switch ke Full Preview Mode saat file `.pdf` dibuka
- [ ] **4.4.** Unit test verifikasi sanitasi XSS pada Markdown parser.

---

## 🤖 Phase 5: KIE AI Integration (Claude Haiku 5.5 Streaming)
- [ ] **5.1.** Implementasi KIE AI Gateway di Rust backend (`src-tauri/src/services/ai.rs`):
  - [ ] Async HTTP client via `reqwest` dan `eventsource-stream`
  - [ ] Parsing Server-Sent Events (SSE) dari endpoint `https://api.kie.ai/v1/chat/completions`
  - [ ] Dispatch event `ai:stream:chunk` ke jendela Tauri
  - [ ] Wiremock test untuk pengujian mocking respons SSE dan network failure
- [ ] **5.2.** Pembuatan In-Editor AI Command Palette UI (`src/components/AIPalette.tsx`):
  - [ ] Shortcut aktivasi `Ctrl+K`
  - [ ] Pilihan prompt: *Continue Writing*, *Summarize*, *Fix Grammar*, *Custom Prompt*
  - [ ] Ingest streaming chunks langsung ke posisi kursor CodeMirror 6 dengan undo transaction utuh

---

## 🛡️ Phase 6: End-to-End Verification & Quality Gate
- [ ] **6.1.** Verifikasi crash-recovery: matikan aplikasi saat buffer dirty, buka kembali, pastikan draf pulih sempurna.
- [ ] **6.2.** Verifikasi keamanan path traversal: coba buka `../../windows/system32/notepad.exe` dan pastikan tertolak aman.
- [ ] **6.3.** Eksekusi seluruh test suite:
  - [ ] `cargo test --manifest-path src-tauri/Cargo.toml` $\to$ 100% PASS
  - [ ] `pnpm test` $\to$ 100% PASS
  - [ ] `cargo clippy -- -D warnings` $\to$ ZERO WARNINGS
  - [ ] `pnpm tsc --noEmit` $\to$ ZERO TYPE ERRORS
- [ ] **6.4.** Verifikasi startup time (<1.5 detik) dan alokasi memori minimal.
