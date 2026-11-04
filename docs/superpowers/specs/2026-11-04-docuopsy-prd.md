# Product Requirement Document (PRD) & Design Specification

**Product Name:** Docuopsy  
**Subtitle:** Multi-Format Text Viewer & Editor with Forensic-Grade Session Persistence  
**Date:** 2026-11-04  
**Status:** In Review / Ready for Approval  

---

## 1. Executive Summary & Vision

**Docuopsy** (berakar dari *Document* + *Autopsy*) adalah aplikasi desktop modern yang berfokus pada **melihat, membaca, dan menyunting dokumen teks multi-format** secara cepat, andal, dan cerdas.

Berbeda dengan editor teks konvensional yang kerap kehilangan state saat crash atau ditutup, Docuopsy mengusung **state persistence otomatis** (tab, kursor, layout, dan buffer yang belum disimpan dipulihkan secara instan saat dibuka kembali) serta **integrasi AI generatif** langsung ke dalam buffer editor untuk akselerasi penulisan.

---

## 2. Target Pengguna & Persona
* **Developer & Penulis Teknis:** Membuka file dokumentasi (`.md`), log (`.log`), konfigurasi (`.json`, `.yaml`), dan referensi teknis (`.pdf`) dalam satu workspace terpadu.
* **Peneliti & Mahasiswa:** Memeriksa dokumen referensi (PDF) sambil mencatat ringkasan dan analisis dalam format Markdown dengan bantuan AI.
* **Power User:** Menginginkan text editor ringan yang tidak membebani sistem, tidak pernah menghilangkan catatan yang belum sempat disimpan, dan memiliki navigasi tab yang fleksibel.

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
4. **Resilient Session & State Persistence:**
   - Menyimpan seluruh file/tab yang sedang terbuka.
   - Mengingat tab aktif, posisi kursor (baris & kolom), posisi scroll, dan rasio ukuran split layout.
   - Menyimpan buffer yang **belum disimpan (dirty content)** ke dalam local cache, sehingga saat aplikasi dibuka kembali, isi ketikan tidak hilang meski file aslinya belum di-save.
5. **Generative AI Assistant:**
   - Terintegrasi langsung di editor (trigger via shortcut atau action bar).
   - Kemampuan: *Continue Writing*, *Summarize*, *Rewrite / Fix Grammar*, *Explain Code / Text*.
   - Streaming text response langsung ke kursor editor.
   - Provider agnostik (mendukung Gemini API / OpenAI compatible / Ollama local).

### Non-Goals (Out of Scope untuk V1)
- **Direct PDF Editing:** Dokumen PDF hanya untuk dilihat (view/read-only), bukan memanipulasi vektor/font di dalam PDF.
- **Disk / File Carving Forensic:** Docuopsy bukan alat forensik disk biner (bukan FTK Imager/Autopsy disk forensics); kata "Docuopsy" adalah identitas produk untuk bedah & telaah dokumen teks.

---

## 4. Arsitektur & Tech Stack

Dipilih **Pendekatan Tauri v2 + Rust Core**:

```
+------------------------------------------------------------------------+
|                            DOCUOPSY DESKTOP                            |
+------------------------------------------------------------------------+
| FRONTEND UI (Webview2 - Svelte / React / TS + Tailwind CSS)            |
|  - Top Tab Bar (Active tab, dirty badges, tab management)             |
|  - Layout Manager (Split resizable panels, Full Editor, Full Preview)   |
|  - Editor Engine: CodeMirror 6 (Syntax highlighting, keymaps, history) |
|  - Markdown Engine: Markdown-it / Shiki (GFM Preview)                 |
|  - PDF Viewer: PDF.js (Embedded Canvas/SVG reader)                    |
|  - AI Floating Action / Prompt Palette                                 |
+-----------------------------------+------------------------------------+
                                    | Tauri IPC (Events / Commands)
+-----------------------------------+------------------------------------+
| RUST BACKEND CORE (Native Performance & System Safety)                 |
|  - State Persistence Engine: JSON session store di AppData lokal       |
|    - Open tabs registry, dirty draft buffers, cursor metadata          |
|  - File System Service: Safe atomic write, file watcher, metadata      |
|  - AI Client Service: Async HTTP streaming (reqwest + tokio)           |
|  - Window State Manager: Window size, position, fullscreen state       |
+------------------------------------------------------------------------+
```

### Justifikasi Komponen:
1. **Rust Core:** Memberikan keamanan memori, kecepatan operasi file sistem I/O, enkripsi/penyimpanan cache session, dan concurrency aman saat streaming AI.
2. **CodeMirror 6:** Editor modern berbasis extensibility yang sangat hemat memori, mendukung syntax highlighting dinamis, virtual scrolling untuk file panjang, dan kontrol kursor terperinci.
3. **PDF.js:** Solusi penampil PDF paling stabil dan lengkap (zoom, page jump, text selection) tanpa repot mengompilasi library C++ PDFium secara manual.

---

## 5. Rincian Fitur & Kebutuhan Fungsional

### 5.1. Session Persistence Engine (Fitur Utama)
- **Auto-Save State Interval:** Tiap terjadi perubahan (debounce 500ms), rust backend mencatat:
  - `tab_id`, `file_path`, `is_dirty`, `cursor_line`, `cursor_col`, `scroll_top`.
  - Jika file adalah file baru yang belum memiliki path (`Untitled-1`), simpan draft kontennya ke cache lokal: `%APPDATA%\docuopsy\drafts\`.
- **Restorasi Otomatis Saat Startup:**
  - Aplikasi memuat session terakhir secara otomatis tanpa popup dialog.
  - Jika ada file yang telah dihapus di disk saat aplikasi mati, beri tanda indikasi "File tidak ditemukan di disk" pada tab terkait.

### 5.2. Tab Bar & Workspace Navigation
- Tab bar berada di bagian paling atas aplikasi.
- Karakteristik Tab:
  - Label nama file + ikon format file (`.md`, `.txt`, `.pdf`, dsb.).
  - Dot marker (`•`) jika ada perubahan belum disimpan (*dirty state*).
  - Tombol tutup (`×`).
  - Shortcut navigasi: `Ctrl + W` (Tutup tab), `Ctrl + Tab` (Ganti tab), `Ctrl + N` (Tab baru).

### 5.3. Layout Switcher (3 Mode)
- Kontrol layout berada di pojok kanan atas atau status bar bawah:
  1. **Split Mode (Default untuk Markdown):** Editor di panel kiri, Preview ter-render di panel kanan. Terdapat draggable splitter untuk mengatur persentase lebar.
  2. **Full Editor Mode:** Panel preview disembunyikan sepenuhnya. Ideal untuk mengetik tanpa distraksi atau untuk file non-render seperti `.txt` dan source code.
  3. **Full Preview Mode:** Panel editor disembunyikan. Menjadi default saat membuka file `.pdf`.
- Shortcut toggle: `Ctrl + \` (Toggle split), `Ctrl + Shift + P` (Full preview), `Ctrl + Shift + E` (Full editor).

### 5.4. Integrasi AI Generatif
- Tombol aksi AI (atau shortcut `Ctrl + K` / `Ctrl + Space`):
  - Membuka AI Command Palette langsung di atas editor.
  - Prompt preset:
    - *Lanjutkan Tulisan (Continue)*
    - *Ringkas Dokumen (Summarize)*
    - *Perbaiki Tata Bahasa & Ejaan (Fix Grammar & Clarity)*
    - *Custom Prompt*
- Output AI di-stream langsung ke dalam buffer dokumen dengan animasi visual teks mengetik.
- Pengaturan API Key (Gemini / OpenAI) disimpan aman di penyimpanan konfigurasi lokal.

---

## 6. Kebutuhan Non-Fungsional (Performance & Security)
1. **Startup Time:** Aplikasi harus terbuka dalam < 1.5 detik ke state terakhir pengguna.
2. **File Size Handling:** Mampu membuka file teks berukuran hingga puluhan megabyte tanpa freeze UI (berkat virtualized scrolling CodeMirror).
3. **Data Loss Prevention:** Perubahan yang belum di-save tidak boleh hilang meskipun laptop mati mendadak (didukung mekanisme atomic write draft di Rust).
4. **Privacy:** Tidak ada telemetry yang dikirim ke luar tanpa persetujuan pengguna; request AI hanya dilakukan saat pengguna secara eksplisit memicu fitur AI.

---

## 7. Struktur Folder Proyek yang Direncanakan

```
docuopsy/
├── src-tauri/                 # Backend Rust
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs            # Entrypoint Tauri
│   │   ├── commands/          # Tauri Invokable Commands
│   │   │   ├── fs.rs          # File operations (read, write, watch)
│   │   │   ├── state.rs       # Session persistence & draft cache
│   │   │   └── ai.rs          # Streaming AI client (Gemini/OpenAI)
│   │   ├── state/             # Data models for tabs & sessions
│   │   └── utils/
├── src/                       # Frontend UI (Typescript)
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx / App.svelte
│   │   ├── components/
│   │   │   ├── TabBar.tsx
│   │   │   ├── EditorPane.tsx # CodeMirror 6 integration
│   │   │   ├── PreviewPane.tsx# Markdown + PDF.js renderer
│   │   │   ├── LayoutManager.tsx
│   │   │   └── AIPalette.tsx
│   │   ├── hooks/ / stores/   # State management
│   │   └── styles/
└── docs/                      # Dokumentasi & Desain
    └── superpowers/
        └── specs/
            └── 2026-11-04-docuopsy-prd.md
```

---

## 8. Pertimbangan Resiko & Mitigasi
| Resiko | Mitigasi |
|---|---|
| PDF ukuran besar membebani memori | PDF.js menggunakan lazy-loading per halaman (hanya merender halaman yang terlihat di viewport). |
| Konflik antara file disk & unsaved draft | Berikan notifikasi jika file di disk berubah saat aplikasi terbuka (*external file modification detector*). |
| Ketergantungan API AI (Rate limit / Offline) | Fitur editor dan viewer bekerja 100% offline tanpa koneksi internet. Fitur AI adalah add-on enhancement. |
