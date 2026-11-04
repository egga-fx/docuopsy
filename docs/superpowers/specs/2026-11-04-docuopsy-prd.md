# Product Requirement Document (PRD) & Design Specification

**Product Name:** Docuopsy  
**Subtitle:** Multi-Format Text Viewer & Editor with Forensic-Grade Session Persistence  
**Date:** 2026-11-04  
**Status:** Approved Specification  

---

## 1. Executive Summary & Philosophy

**Docuopsy** (berakar dari *Document* + *Autopsy*) adalah aplikasi desktop modern yang berfokus pada **melihat, membaca, dan menyunting dokumen teks multi-format** secara cepat, aman, dan tangguh.

### Hierarki Prioritas Non-Negotiable:
$$\mathbf{Kecepatan\ (Speed\ /\ Performance)} \longrightarrow \mathbf{Keamanan\ (Security)} \longrightarrow \mathbf{Fitur\ (Features)}$$

1. **Kecepatan:** Waktu startup instan (<1.5 detik), virtualized rendering untuk dokumen besar, alokasi memori minimal, dan I/O non-blocking berbasis Rust async.
2. **Keamanan:** Arsitektur lokal-first, proteksi path traversal, sanitasi rendering HTML Markdown (anti-XSS), dan proteksi kredensial.
3. **Fitur:** Dukungan multi-format, sistem tab atas, 3-mode layout, forensic session persistence, dan integrasi AI generatif.

---

## 2. Metodologi Pengembangan & Best Practices untuk AI Development

### A. Metodologi: Spec-Driven (SDD) & Test-Driven Development (TDD)
- **Single Source of Truth:** Seluruh kode berakar dari dokumen spesifikasi (`docs/superpowers/specs/`, `DESIGN.md`, `GEMINI.md`).
- **Siklus TDD Ketat:**
  1. *Red:* Tulis failing test untuk interface/command terlebih dahulu.
  2. *Green:* Implementasikan kode minimal hingga test lolos.
  3. *Refactor:* Optimasi performa dan kerapian tanpa regresi.
- **Commit Granularity:** Commit kecil, atomik, dan menggunakan conventional commits (`feat:`, `fix:`, `test:`, `docs:`).

### B. AI-Assisted Development Best Practices
1. **Strict Type Contracts:** Setiap Tauri IPC command memiliki skema Rust (`Serialize`/`Deserialize`) dan skema TypeScript yang identik dan tersinkronisasi.
2. **Modular File Boundaries:** Memisahkan komponen menjadi unit-unit terfokus (< 300 baris) untuk meminimalkan halusinasi AI dan mempermudah pengujian.
3. **Automated Verification:** Agen AI wajib menjalankan verifikasi nyata (`cargo test`, `pnpm tsc`) dan menyertakan bukti output sebelum menyatakan tugas selesai.

---

## 3. Scope & Batasan (Goals vs Non-Goals)

### Goals
1. **Multi-Format Support:**
   - Text & Code (`.txt`, `.md`, `.json`, `.log`, `.csv`, `.rs`, `.js`, dll.): Read & Write (Full Editor).
   - Markdown (`.md`): Raw text editing + Live rich rendered preview (GFM, tables, code syntax highlighting).
   - PDF (`.pdf`): High-fidelity read-only document viewer.
2. **Top Tabs System:** Tab navigasi di bagian atas dengan indikator status file (dirty/clean, icon tipe file, close, reorder).
3. **Flexible 3-Mode Layout:**
   - **Split Mode:** Editor di kiri, Preview di kanan (dengan opsional synchronized scroll).
   - **Full Editor Mode:** Ruang kerja mengetik tanpa distraksi.
   - **Full Preview Mode:** Ruang membaca dokumen atau viewer PDF penuh.
4. **Resilient Session & State Persistence (Forensic Grade):**
   - Menyimpan seluruh file/tab yang sedang terbuka.
   - Mengingat tab aktif, posisi kursor (baris & kolom), posisi scroll, dan rasio ukuran split layout.
   - Menyimpan buffer yang **belum disimpan (dirty content)** ke dalam local cache (`%APPDATA%\Docuopsy\drafts\`), sehingga saat aplikasi dibuka kembali, isi ketikan tidak hilang meski file aslinya belum di-save.
5. **Generative AI Assistant (KIE AI):**
   - Provider: **KIE AI** (`https://kie.ai`).
   - Model: **`claude-haiku-5-5`** (ekstra cepat, efisien, dan cerdas).
   - API Key: `e003b0c015d233ea848997456242e97b` (disimpan aman di env/config lokal).
   - Fitur: *Continue Writing*, *Summarize*, *Rewrite / Fix Grammar*, *Custom Prompt* dengan streaming response langsung ke buffer editor.

### Non-Goals
- **Direct PDF Editing:** Dokumen PDF hanya untuk dilihat (view/read-only).
- **Disk / File Carving Forensics:** Docuopsy bukan alat forensik disk biner (bukan FTK Imager); "Docuopsy" adalah identitas bedah dokumen teks.

---

## 4. Stack Teknologi & Lisensi (100% Free & Open Source)

Semua library dan dependensi wajib berlisensi bebas dan permisif (MIT, Apache-2.0, atau BSD):

| Layer | Pilihan Teknologi | Lisensi | Alasan & Justifikasi |
|---|---|---|---|
| **Backend Shell** | Tauri v2 (`tauri`, `tauri-build`) | Apache-2.0 / MIT | Biner sangat kecil (~10MB), RAM hemat, akses OS native via Rust. |
| **System Language** | Rust (2021 Edition) | Apache-2.0 / MIT | Kecepatan maksimal, zero garbage collection, memory-safe. |
| **Async Runtime & HTTP** | `tokio`, `reqwest`, `eventsource-stream` | MIT | Operasi I/O non-blocking dan streaming SSE cepat ke KIE AI. |
| **Editor Core** | CodeMirror 6 | MIT | Ringan, arsitektur modular, virtualized DOM scrolling untuk file raksasa. |
| **Frontend Shell** | React 18 + Vite + TypeScript | MIT / Apache-2.0 | Static typing ketat, ekosistem UI cepat dan matang. |
| **Styling** | Tailwind CSS + Lucide Icons | MIT / ISC | Zero runtime overhead styling, konsisten dan modern. |
| **Markdown Preview** | `markdown-it` + `dompurify` | MIT / Apache-2.0 | GFM lengkap dengan sanitasi HTML anti-XSS. |
| **PDF Viewer** | `pdfjs-dist` (Mozilla) | Apache-2.0 | Standar industri rendering PDF open source tanpa C++ wrapper rumit. |

---

## 5. Rincian Fitur & Kebutuhan Fungsional

### 5.1. Session Persistence Engine
- **Debounced Snapshot:** Tiap terjadi perubahan buffer (debounce 500ms), rust backend mencatat state session ke `%APPDATA%\Docuopsy\session.json`.
- **Atomic Draft Persistence:** Draf yang belum disimpan ditulis secara atomik ke folder `%APPDATA%\Docuopsy\drafts\<tab-id>.draft` untuk mencegah file corrupt jika daya mati mendadak.
- **Auto Restore:** Saat dibuka kembali, state dipulihkan secara instan tanpa dialog konfirmasi.

### 5.2. Tab Bar & Workspace Navigation
- Posisi di bagian atas aplikasi.
- Karakteristik:
  - Label nama file + ikon format file.
  - Dot marker (`•`) jika ada perubahan belum disimpan (*dirty state*).
  - Tombol tutup (`×`).
  - Shortcut navigasi: `Ctrl + W` (Tutup tab), `Ctrl + Tab` (Ganti tab), `Ctrl + N` (Tab baru).

### 5.3. Layout Switcher (3 Mode)
1. **Split Mode (Default untuk Markdown):** Editor di kiri, Preview di kanan dengan splitter yang bisa digeser.
2. **Full Editor Mode:** Preview disembunyikan. Default untuk `.txt` dan kode sumber.
3. **Full Preview Mode:** Editor disembunyikan. Default untuk `.pdf`.
- Shortcuts: `Ctrl + \` (Toggle split), `Ctrl + Shift + P` (Full preview), `Ctrl + Shift + E` (Full editor).

### 5.4. Integrasi AI Generatif (KIE AI)
- Endpoint: `https://api.kie.ai/v1/chat/completions` (model: `claude-haiku-5-5`).
- Shortcut pemicu: `Ctrl + K`.
- Menampilkan floating prompt bar untuk *Continue*, *Summarize*, *Grammar check*, atau *Custom prompt*.
- Streaming teks mengalir langsung ke posisi kursor editor dengan undo history utuh.

---

## 6. Struktur Repositori & File Proyek

```
docuopsy/
├── GEMINI.md                  # Context & panduan kerja AI Gemini
├── AGENTS.md                  # Panduan kolaborasi multi-agent & TDD
├── DESIGN.md                  # Spesifikasi teknis arsitektur lengkap
├── README.md                  # Dokumentasi publik & quick start
├── INFRA.md                   # Spesifikasi env, build, & tooling
├── docs/                      # Dokumentasi teknis & specs
│   └── superpowers/
│       └── specs/
│           └── 2026-11-04-docuopsy-prd.md
├── src-tauri/                 # Backend Core Rust (Tauri v2)
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs
│       ├── commands/          # Tauri IPC Commands (fs, state, ai)
│       └── services/          # KIE AI client, persistence engine
└── src/                       # Frontend UI (React + TS + Tailwind)
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── components/        # TabBar, EditorPane, PreviewPane, AIPalette
        ├── store/             # Reactive session & tab state
        └── api/               # Typed Tauri IPC wrappers
```
