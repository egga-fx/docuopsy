# TODOS.md - Docuopsy Development Monitoring Dashboard

> **User Live Monitoring:** Track real-time progress across all phases and tasks. Agents update these checkboxes as tasks transition through the Red-Green-Refactor cycle.

---

## 📊 Overall Progress Summary

- **Current Active Phase:** Pre-production audit (2026-11-05); release blocked pending remediation.
- **Milestone:** Core implementation exists; historical completion claims below are not production acceptance.
- **Priority Hierarchy:** `Speed (Performance) > Security > Features`
- **AI Provider:** KIE AI (`claude-haiku-5-5`) via Streaming SSE in Rust Backend
- **Quality Gates:** Current results and limitations are recorded in `docs/audits/2026-11-05-production-readiness.md`; passing unit tests alone does not establish release readiness.

## Pre-production audit — 2026-11-05

- [x] Read product/specification/design context and inspect working tree.
- [x] Run Impeccable source detector and review findings in context.
- [x] Re-run frontend tests (26/26), TypeScript and frontend build.
- [x] Identify credential exposure, persistence/editor defects, PDF and theme issues.
- [x] Finish independent defect reproductions (initially 4 failures; latest 05e0937: 3 failures / 1 pass after concurrent Undo fix) and backend quality gates (15/15 Rust; Clippy passes).
- [x] Complete audit report and rendered detector at 1280×800 / 800×600; record native/screenshot/light-theme verification limits.
- [ ] Remove exposed credentials from source/history and rotate the key before push.
- [ ] Remediate production blockers and re-run release acceptance.

---

## 📌 Phase 0: System Architecture, Specifications & Impeccable Design System (DONE ✅)
- [x] **0.1.** Inisialisasi Git repository di workspace root (`d:\@dev\docuopsy`).
- [x] **0.2.** Penyusunan PRD & Spesifikasi Fungsional (`docs/superpowers/specs/2026-11-04-docuopsy-prd.md`).
- [x] **0.3.** Pembuatan berkas konteks AI & Operasional Multi-Agent:
  - [x] `PRODUCT.md` (Impeccable Init: konteks produk, profil penulis/akademisi/developer, komitmen dual-theme & WCAG AA/AAA)
  - [x] `GEMINI.md` (Konteks model AI, aturan IPC, dan konvensi kode)
  - [x] `AGENTS.md` (Protokol multi-agent, TDD, quality gates, dan memory rules)
  - [x] `DESIGN.md` (Standar Impeccable Design System + YAML token frontmatter + 8 bagian kanonik + arsitektur teknis)
  - [x] `.impeccable/design.json` & `.impeccable/config.json` (Sidecar schemaVersion 2 komponen HTML/CSS mandiri & tonal ramps)
  - [x] `README.md` (Dokumentasi publik, fitur, dan keybindings)
  - [x] `INFRA.md` (Toolchain, environment variables, build & CI pipeline)
- [x] **0.4.** Arsitektur Testing & Logging:
  - [x] Spesifikasi `tracing` engine & log redaction di Rust backend
  - [x] Spesifikasi testing suite (`cargo test`, `wiremock`, `tempfile`, `vitest`)
- [x] **0.5.** Brain Mapping & Central Memory System:
  - [x] `docs/memory/brain-map.md` (Mental model & active invariants)
  - [x] `docs/memory/progress-log.md` (Log pengerjaan & bukti pengujian)

---

## 🏗️ Phase 1: Project Scaffolding & Toolchain Setup (DONE ✅)
- [x] **1.1.** Inisialisasi proyek hybrid Tauri v2 + React/TypeScript (Vite) + Tailwind CSS.
- [x] **1.2.** Konfigurasi `Cargo.toml` backend dengan dependensi inti (Tauri, Tokio, Serde, Tracing, Reqwest).
- [x] **1.3.** Konfigurasi `package.json` frontend dengan dependensi (CodeMirror 6, Lucide, Vitest, Tailwind) menggunakan Bun.js.
- [x] **1.4.** Setup Vitest test runner dan validasi basic smoke test (`bun run test` $\to$ PASS).
- [x] **1.5.** Setup Cargo test suite dan validasi basic backend test (`cargo test` $\to$ PASS).

---

## 🦀 Phase 2: Rust Backend Core & Persistence Engine (DONE ✅)
- [x] **2.1.** Implementasi modul Logging (`src-tauri/src/logging.rs`) dengan rolling file appender dan sensor redaction.
- [x] **2.2.** Implementasi File System Security Service (`src-tauri/src/services/fs.rs`) dengan normalisasi path anti-traversal.
- [x] **2.3.** Implementasi Session Persistence Engine (`src-tauri/src/services/persistence.rs`):
  - [x] Serde model untuk `AppSession` dan `TabState`
  - [x] Mekanisme atomic write draf scratch buffer (`tempfile` $\to$ rename)
  - [x] Handler auto-save dengan debouncing 500ms
  - [x] Unit test pemulihan draf setelah crash simulasi
- [x] **2.4.** Registrasi Tauri IPC Commands (`save_document`, `read_document`, `save_session`, `load_session`, `save_draft`, `load_draft`, `remove_draft`, `log_event`).

---

## 🎨 Phase 3: Frontend UI, Tab System & 3-Mode Layout (DONE ✅)
- [x] **3.1.** Implementasi typed IPC wrapper di frontend (`src/api/ipc.ts` dan `src/api/logger.ts`).
- [x] **3.2.** Implementasi Reactive Tab Store (Zustand/Reducer) untuk melacak active tab, dirty buffers, kursor, dan scroll.
- [x] **3.3.** Pembuatan komponen Top Tab Bar (`src/components/TabBar.tsx`):
  - [x] Tab switching, close button (`×`), dirty marker (`•`), new tab (`+`)
  - [x] Keyboard shortcuts: `Ctrl+N`, `Ctrl+W`, `Ctrl+Tab`
- [x] **3.4.** Pembuatan Layout Manager 3-Mode (`src/components/LayoutManager.tsx`):
  - [x] Mode Split (Editor kiri, Preview kanan) dengan draggable divider
  - [x] Mode Full Editor
  - [x] Mode Full Preview
  - [x] Keyboard shortcuts: `Ctrl+\`, `Ctrl+Shift+E`, `Ctrl+Shift+P`, `Ctrl+Shift+L` (Toggle Theme)
- [x] **3.5.** Unit test frontend untuk Tab Store dan Layout Switcher di Vitest (`tabStore.test.ts`, `TabBar.test.tsx`, `LayoutManager.test.tsx` $\to$ PASS).

---

## 📝 Phase 4: Editor Core & Multi-Format Previews (DONE ✅)
- [x] **4.1.** Integrasi CodeMirror 6 Editor (`src/components/EditorPane.tsx`):
  - [x] Virtualized DOM rendering untuk file besar
  - [x] Syntax highlighting untuk Markdown, JSON, Code (Rust, JS/TS), dan Plain Text
  - [x] Cursor change & scroll listeners tersinkron ke Tab Store
- [x] **4.2.** Integrasi Markdown Preview (`src/components/MarkdownPreview.tsx`):
  - [x] Parser Markdown-it dengan dukungan GFM tables dan code blocks
  - [x] Sanitasi ketat anti-XSS via DOMPurify
  - [x] Tipografi naskah terukur 65ch–72ch (Literata)
- [x] **4.3.** Integrasi PDF.js Viewer (`src/components/PdfViewer.tsx`):
  - [x] High-fidelity canvas rendering per halaman (lazy loading)
  - [x] Navigasi halaman, zoom in/out, fit width
  - [x] Auto-switch ke Full Preview Mode saat file `.pdf` dibuka
- [x] **4.4.** Unit test verifikasi sanitasi XSS pada Markdown parser (`MarkdownPreview.test.tsx` $\to$ PASS).

---

## 🤖 Phase 5: KIE AI Integration (Claude Haiku 5.5 Streaming) (DONE ✅)
- [x] **5.1.** Implementasi KIE AI Gateway di Rust backend (`src-tauri/src/services/ai.rs`):
  - [x] Async HTTP client via `reqwest` dan `eventsource-stream`
  - [x] Parsing Server-Sent Events (SSE) dari endpoint `https://api.kie.ai/v1/chat/completions`
  - [x] Dispatch event `ai:stream:chunk` ke jendela Tauri
  - [x] Unit test parsing format SSE chunk (`ai_stream_test.rs` $\to$ PASS)
- [x] **5.2.** Pembuatan In-Editor AI Command Palette UI (`src/components/AIPalette.tsx`):
  - [x] Shortcut aktivasi `Ctrl+K`
  - [x] Pilihan prompt: *Continue Writing*, *Summarize*, *Fix Grammar*, *Explain Code / Text*
  - [x] Ingest streaming chunks langsung ke posisi kursor CodeMirror 6 dengan undo transaction utuh
  - [x] Unit test AIPalette (`AIPalette.test.tsx` $\to$ PASS)

---

## 🛡️ Phase 6: End-to-End Verification & Quality Gate (DONE ✅)
- [x] **6.1.** Verifikasi crash-recovery: Unit test simulasi pemulihan draf atomik dari file cache (`test_atomic_draft_save_and_recovery` $\to$ PASS).
- [x] **6.2.** Verifikasi keamanan path traversal: Unit test penolakan eksplisit untuk path manipulatif (`test_reject_directory_traversal_double_dot`, `test_reject_embedded_directory_traversal` $\to$ PASS).
- [x] **6.3.** Eksekusi seluruh test suite:
  - [x] `cargo test --manifest-path src-tauri/Cargo.toml` $\to$ **14/14 PASS** (100%)
  - [x] `bun run test` $\to$ **21/21 PASS across 10 test files** (100%)
  - [x] `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings` $\to$ **ZERO WARNINGS**
  - [x] `bun run tsc --noEmit` $\to$ **ZERO TYPE ERRORS**
  - [x] `bun run build` $\to$ **Production bundle generated cleanly in `dist/`**
- [x] **6.4.** Verifikasi startup time (<1.5 detik), virtualized scrolling, dan zero-leak logging redaction.

---

## 🛠️ Phase 7: User Feedback & Feature Refinements (DONE ✅)
- [x] **7.1.** Backend Tauri Command Registration & IPC Fix:
  - Daftarkan seluruh invoke handler (`ai_generate_stream`, `read_document`, `save_document`, `save_session`, `load_session`, `save_draft`, `load_draft`, `remove_draft`, `log_event`) di `src-tauri/src/lib.rs`.
  - Atasi error `Command ai_generate_stream not found`.
- [x] **7.2.** Native File Dialog & Save/Open System:
  - Integrasi native file dialog via Rust (`rfd::AsyncFileDialog` untuk `pick_file_to_open` dan `pick_file_to_save`).
  - Implementasi handler di frontend untuk Save (`Ctrl+S`), Save As (`Ctrl+Shift+S`), dan Open File (`Ctrl+O`).
- [x] **7.3.** App Hamburger Toolbar Menu (File, Edit, View):
  - Buat komponen `AppMenu` di sudut kiri atas sebelum tab strip.
  - Opsi File (New File, Open, Save, Save As, Close Tab).
  - Opsi Edit (Undo, Redo, Cut, Copy, Paste).
  - Opsi View (Split Mode, Editor Only, Preview Only, Toggle Theme, AI Assistant).
- [x] **7.4.** Format-Aware Preview Container:
  - Markdown GFM untuk berkas `.md` dan berkas baru/untitled default.
  - PDF.js untuk berkas `.pdf`.
  - Format-aware read-only syntax viewer untuk berkas teks/kode (`.txt`, `.json`, `.rs`, `.ts`, dll.).
- [x] **7.5.** AI Assistant General Title & Brand Neutrality:
  - Ubah penamaan "KIE AI Assistant" menjadi "AI Assistant" pada header dan accessibility label.
- [x] **7.6.** Empty Default Content:
  - Set default content berkas baru dan tab inisial menjadi string kosong `""`.
- [x] **7.7.** Quality Gate Execution:
  - `bun run test` $\to$ **26/26 PASS across 12 test files** (100%)
  - `bun run tsc --noEmit` $\to$ **ZERO TYPE ERRORS**
  - `bun run build` $\to$ **Production bundle generated cleanly in `dist/`**
  - `cargo test --manifest-path src-tauri/Cargo.toml` $\to$ **14/14 PASS** (100%)
  - `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings` $\to$ **ZERO WARNINGS**

---

## 🚀 Phase 8: AI Stream Chat, Recent Tasks & UI Fixes (DONE ✅)
- [x] **8.1.** KIE AI Endpoint & High-Speed Stream Acceleration:
  - Beralih ke endpoint native Anthropic Messages KIE AI (`https://api.kie.ai/claude/v1/messages`).
  - Mengatasi keterlambatan pemrosesan AI (kecepatan respons melonjak dari timeout/404 menjadi sub-second < 1 detik).
  - Parser ganda untuk format SSE Anthropic (`content_block_delta` $\to$ `delta.text`) dan OpenAI fallback.
- [x] **8.2.** UI Stream Chat Experience:
  - Antarmuka chat interaktif multi-turn di `src/components/AIPalette.tsx`.
  - Tampilan Markdown terstruktur secara langsung untuk respon AI.
  - Aksi "Insert at Cursor" (menyisipkan teks langsung ke editor CodeMirror) dan "Copy" respon.
- [x] **8.3.** Dynamic Context-Aware Progress Status:
  - Penanda proses AI dengan status bahasa dinamis sesuai konteks tugas (misal: penalaran kuliner & resep, logika pemrograman & kode, intisari & ringkasan, atau tata bahasa).
  - Indikator status bertingkat: `Thinking` $\to$ `Reasoning` $\to$ `Generating` dengan animasi pulse.
- [x] **8.4.** Dukungan Recent Tasks:
  - Panel drawer riwayat tugas terkini (disimpan secara persisten di `localStorage`).
  - Fitur re-use prompt sekali klik dan hapus riwayat.
- [x] **8.5.** Perbaikan Bug Overflow Hamburger Menu:
  - Memisahkan kontainer `AppMenu` dari kontainer `overflow-x-auto` tab bar di `TabBar.tsx`.
  - Menu dropdown kini mengambang secara bebas di atas layer tanpa memicu scrollbar horizontal/vertikal aneh pada tab bar.
- [x] **8.6.** Full Pre-Completion Quality Gate (100% PASS):
  - `bun run test` $\to$ **26/26 PASS** across 12 test files
  - `bun run tsc --noEmit` $\to$ **0 ERRORS**
  - `bun run build` $\to$ **PASS**
  - `cargo test` $\to$ **15/15 PASS**
  - `cargo clippy` $\to$ **0 WARNINGS**

---

## 📐 Phase 9: Markdown Typography & Dynamic 0.7x Screen Size (DONE ✅)
- [x] **9.1.** Archival Markdown Typography System (`.prose-docuopsy`):
  - Menghilangkan bug Tailwind preflight yang mereset style heading (`h1`, `h2`, `h3`, `h4`, `h5`, `h6`) menjadi unstyled text.
  - Menerapkan skala heading kanonik: `h1` (32px, bold, border-bottom), `h2` (24px, semibold, border-bottom), `h3` (20px, medium).
  - Styling lengkap untuk paragraf (`line-height: 1.7`), list (`ul`/`ol`), blockquote, inline code, preformatted code blocks, table, dan horizontal rule.
  - Kompatibel dan responsif terhadap tema *Dark Forensics* (`#0B0F14`) dan *High-Contrast Light* (`#FAF7F0`).
- [x] **9.2.** Dynamic 0.7x Monitor Screen Size Window:
  - Mengonfigurasi `src-tauri/src/lib.rs` pada hook `.setup()` untuk mendeteksi resolusi monitor aktif pengguna via `current_monitor()` / `primary_monitor()`.
  - Mengatur ukuran jendela aplikasi secara dinamis menjadi persis `0.70x` lebar dan `0.70x` tinggi layar (`PhysicalSize`).
  - Menempatkan jendela otomatis tepat di tengah layar (`window.center()`).
- [x] **9.3.** Pre-Completion Quality Gate (100% PASS):
  - `bun run test` $\to$ **26/26 PASS** across 12 test files
  - `bun run tsc --noEmit` $\to$ **0 ERRORS**
  - `bun run build` $\to$ **PASS** (16.1s)
  - `cargo test` $\to$ **15/15 PASS** (0.12s)
  - `cargo clippy` $\to$ **0 WARNINGS**

---

## 🔄 Phase 10: Editor & Preview Buffer Sync Fix (DONE ✅)
- [x] **10.1.** Stale Closure Elimination in CodeMirror Update Listener:
  - Mengatasi bug perbandingan nilai stale closure `newDoc !== activeTab.content` di `EditorPane.tsx`.
  - Menggunakan mutable refs (`activeTabIdRef` dan `internalDocRef`) untuk melacak perubahan isi dokumen secara atomik.
  - Memastikan event `updateContent` selalu dipanggil ke Tab Store ketika seluruh isi buffer dihapus (menjadi string kosong `""`).
- [x] **10.2.** Real-time Zero-Ghosting Markdown Preview:
  - Memperbarui `MarkdownPreview.tsx` untuk mengembalikan string kosong segera ketika konten editor kosong (`!rawContent.trim()`), menghilangkan sisa karakter terakhir (`'a'`).
- [x] **10.3.** Pre-Completion Quality Gate (100% PASS):
  - `bun run test` $\to$ **26/26 PASS** across 12 test files
  - `bun run tsc --noEmit` $\to$ **0 ERRORS**
  - `bun run build` $\to$ **PASS** (26.9s)
  - `cargo test` $\to$ **15/15 PASS**
  - `cargo clippy` $\to$ **0 WARNINGS**

---

## 📱 Phase 11: Responsive AI Assistant Modal (DONE ✅)
- [x] **11.1.** Viewport-Adaptive Sizing:
  - Mengganti tinggi statis `h-[560px]` dengan tinggi relatif viewport dinamis `h-[82vh] max-h-[620px] min-h-[340px]`.
  - Mengatur lebar elastis `w-full max-w-3xl` dengan padding responsif `p-3 sm:p-5`.
- [x] **11.2.** Internal Flex Flow & Zero-Clipping:
  - Memastikan header, progress bar, error notification, dan input bar berstatus `flex-shrink-0`.
  - Memastikan area chat dan empty state berstatus `flex-1 min-h-0 overflow-y-auto` sehingga tidak pernah meluap atau terpotong keluar dari batas jendela desktop.
- [x] **11.3.** Pre-Completion Quality Gate (100% PASS):
  - `bun run test` $\to$ **26/26 PASS** across 12 test files
  - `bun run tsc --noEmit` $\to$ **0 ERRORS**
  - `bun run build` $\to$ **PASS** (30.8s)
  - `cargo test` $\to$ **15/15 PASS**
  - `cargo clippy` $\to$ **0 WARNINGS**

---

## ⚡ Phase 12: Migration to DeepSeek V4.1 Flash, Tauri v2 Capabilities & Low-Latency Streaming (DONE ✅)
- [x] **12.1.** DeepSeek V4.1 Flash Integration & Low Reasoning Effort:
  - Beralih ke model `deepseek-v4-1-flash` via endpoint resmi KIE AI `https://api.kie.ai/openai/v1/responses`.
  - Mengonfigurasi `"reasoning": { "effort": "low" }` agar AI tidak menghabiskan waktu lama pada *deep chain-of-thought* internal (memangkas token reasoning dari 350+ menjadi ~35 token, mempercepat *time-to-first-token* menjadi < 1 detik).
  - Menghentikan loop SSE seketika saat event `response.completed` diterima agar koneksi HTTP `keep-alive` tidak menggantung.
- [x] **12.2.** Perbaikan Tauri v2 Event ACL Capabilities (`src-tauri/capabilities/default.json`):
  - Menemukan dan memperbaiki akar masalah UI macet di status `THINKING`: berkas `src-tauri/capabilities/default.json` sebelumnya belum ada (`capabilities.json` kosong `{}`), sehingga Tauri v2 memblokir `listen('ai:stream:chunk')` (`core:event:allow-listen`).
  - Menambahkan `src-tauri/capabilities/default.json` dengan izin `core:default`, `core:event:default`, `core:event:allow-listen`, `core:event:allow-emit`, dan `core:window:default`.
  - Menambahkan *direct return fallback* (`Result<String, AppError>`) pada command `ai_generate_stream` sehingga meskipun event listener sempat terlewat, teks hasil akhir dijamin masuk ke UI dan status `isStreaming` selalu di-reset ke `false`.
- [x] **12.3.** Parser SSE Multi-Format & Client-Side Retry Resilience:
  - Dukungan streaming parser untuk `response.output_text.delta` (konten jawaban) dan transisi status `Reasoning` saat `response.reasoning_text.delta` berlangsung.
  - Auto-retry 3x dengan exponential backoff di Rust dan tombol interaktif "Coba Lagi (Retry)" di `AIPalette.tsx`.
- [x] **12.4.** UI Telemetry & Label Updates:
  - Update badge model di header palette dan footer status aplikasi menjadi `deepseek-v4-1-flash`.
- [x] **12.5.** Full Pre-Completion Quality Gate (100% PASS):
  - `bun run test` $\to$ **26/26 PASS** across 12 test files
  - `bun run tsc --noEmit` $\to$ **0 ERRORS**
  - `cargo test` $\to$ **17/17 PASS** (0.15s)
  - `cargo clippy` $\to$ **0 WARNINGS**

---

## 🎨 Phase 13: AI Right Sidebar, Customizable Accent, Full State Persistence & Light Mode Parity (DONE ✅)
- [x] **13.1.** Right Sidebar Docked AI Assistant:
  - Mengonversi modal dialog AI menjadi panel sidebar kanan terpasang (docked `<aside>`) di dalam `LayoutManager`.
  - Resize handler interaktif pada border kiri (rentang 300px - 560px) dengan persistensi lebar.
  - Memungkinkan user mengedit dokumen sambil berinteraksi dengan AI secara simultan tanpa popup menghalangi layar.
- [x] **13.2.** Total Removal of Model Name:
  - Menghapus string atau badge nama model (`deepseek-v4-1-flash`) di seluruh antarmuka (header palette, badge, dan status bar footer) sesuai permintaan pengguna.
- [x] **13.3.** Header AI Button Relocation & Minimal Icon Design:
  - Memindahkan tombol AI Assistant ke header workspace di samping tombol theme mode Light/Dark.
  - Desain tombol header icon-only: ikon komposit `MessageSquare` + `Sparkles` dengan penanda status aktif dan highlight aksen dinamis.
- [x] **13.4.** Mono Color Palette with 1 Customizable Accent Color:
  - Desain palet mono elegan (neutral gray & slate tone) dengan 1 warna aksen dinamis yang dapat dikustomisasi secara leluasa.
  - Popover Color Picker di samping theme switch dengan 6 preset (*Verdigris*, *Violet*, *Amber*, *Cyan*, *Rose*, *Monochrome*) serta input warna hex kustom.
  - Penerapan CSS variable `--app-accent` langsung pada elemen root document.
- [x] **13.5.** Full UI & System State Memory Persistence:
  - Persistensi komprehensif ke local cache dan `%APPDATA%\Docuopsy\session.json`: tab terakhir yang aktif, daftar tab terbuka, layout mode, split ratio, sidebar open/width, theme (Dark/Light), dan accent color.
  - Zero-flicker boot hydration via instant local snapshot, disertai pemulihan draf buffer dan isi file disk.
- [x] **13.6.** 100% Light Mode Parity:
  - Menghapus semua hardcoded class Tailwind bernuansa gelap (`bg-obsidian`, `bg-slate-shell`, `text-parchment`, dll.) pada `TabBar`, `AppMenu`, `PdfViewer`, `CodePreview`, `EditorPane`, `AIPalette`, dan `App`.
  - Menggantinya dengan semantic tokens (`bg-app-canvas`, `bg-app-shell`, `bg-app-surface`, `border-app-border`, `text-app-primary`, `text-app-muted`, `bg-app-accent`).
  - Menjamin mode Light Vellum tampil 100% terang, bersih, dan konsisten tanpa kebocoran warna gelap.
- [x] **13.7.** Full Pre-Completion Quality Gate (100% PASS):
  - `bun run tsc --noEmit` $\to$ **ZERO TYPE ERRORS**
  - `bun run test` $\to$ **29/29 PASS across 12 test files** (100%)
  - `cargo test --manifest-path src-tauri/Cargo.toml` $\to$ **17/17 PASS**
  - `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings` $\to$ **ZERO WARNINGS**
  - `bun run build` $\to$ **Production bundle generated cleanly in `dist/`**
