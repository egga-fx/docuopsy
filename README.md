# Docuopsy 🔬📄

> **Docuopsy** (*Document + Autopsy*): High-Performance, Secure, Multi-Format Desktop Text Editor & Viewer with Forensic-Grade Session Persistence.

[![Rust](https://img.shields.io/badge/Rust-2021_Edition-DEA584?style=flat&logo=rust)](https://www.rust-lang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-v2.0-24C8D8?style=flat&logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.2-fbf0df?style=flat&logo=bun)](https://bun.sh/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Security: Sandboxed](https://img.shields.io/badge/Security-Local--First_Sandboxed-brightgreen.svg)]()

---

## ⚡ Guiding Philosophy & Architectural Hierarchy

Docuopsy is designed from first principles with an uncompromising priority hierarchy:

$$\mathbf{Speed\ (Performance)} \longrightarrow \mathbf{Security} \longrightarrow \mathbf{Features}$$

1. **Speed:** Instant cold start (<1.5s), minimal RAM footprint, virtualized text rendering via CodeMirror 6, and asynchronous, non-blocking I/O in Rust (Tokio).
2. **Security:** Strict local-first sandbox, directory traversal prevention (`..` canonicalization check), sanitized HTML previews (DOMPurify anti-XSS), zero telemetric tracking, and log redaction.
3. **Features:** Focused, high-efficiency tools designed for technical writers, software engineers, security researchers, and academics.

---

## 🏗️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                              DOCUOPSY DESKTOP SYSTEM                              |
+-----------------------------------------------------------------------------------+
| FRONTEND LAYER (React + Vite + Tailwind + CodeMirror 6 + PDF.js + Bun)            |
|                                                                                   |
|  [Tab Store (Zustand)] <---> [Layout Engine (Split / FullEditor / FullPreview)]   |
|         ^                                     ^                                   |
|         |                                     |                                   |
|  [CodeMirror 6 View]                [Preview Engine (Markdown / PDF / Code)]      |
|         |                                     |                                   |
|  [Right-Sidebar AI Assistant]                 |                                   |
+---------+-------------------------------------+-----------------------------------+
          | Typed Tauri IPC Invokes & Event Streaming (ai:stream:chunk)
+---------+-------------------------------------------------------------------------+
| BACKEND CORE LAYER (Rust Tauri v2 + Tokio)                                        |
|                                                                                   |
|  [State Persistence Engine]  <--->  [Atomic Tempfile Scratch Buffer]              |
|   - session.json (%APPDATA%)        - drafts/<tab-id>.draft                       |
|                                                                                   |
|  [Safe File System Service]  <--->  [Path Canonicalization & Directory Sandboxing]|
|                                                                                   |
|  [KIE AI Streaming Gateway]  <--->  [reqwest SSE to deepseek-v4-1-flash]           |
|                                                                                   |
|  [Unified Tracing Engine]    <--->  [Rolling file appender + Sensitive Redaction] |
+-----------------------------------------------------------------------------------+
```

---

## 🌟 Key Features

### 1. 🤖 Docked Right-Sidebar AI Assistant
- **Simultaneous Workflow:** Docked `<aside>` panel allowing you to write, edit, and inspect documents while conversing with the AI assistant simultaneously without disruptive modal overlays.
- **Interactive Resizing:** Drag the left edge of the sidebar to adjust its width between 300px and 560px. Your preferred width is automatically remembered across app restarts.
- **Dynamic Contextual Progress:** Real-time visual progress tags (`Thinking`, `Reasoning`, `Generating`) that dynamically adapt phrasing according to the domain of your prompt (e.g. culinary recipes, software logic, text summarization, or grammar polishing).
- **Recent Tasks Drawer:** Fast drawer panel preserving recent task prompts in `localStorage` for instant re-execution.
- **Streamlined Actions:** One-click "Insert at Cursor" directly applies generated text to your active CodeMirror 6 document with full undo history, along with one-click response copying.

### 2. 🎨 Archival Forensics Design System & Customizable Accent
- **Day-One Dual-Theme Parity:**
  - **Dark Forensics:** High-depth obsidian slate (`#0B0F14`) canvas engineered for nocturnal focus and prolonged code review.
  - **Light Vellum:** High-contrast archival parchment (`#FAF7F0`) with deep charcoal ink (`#12161F`, >15:1 AAA contrast) and `Literata` scholarly reading measure (65ch–72ch).
  - **Zero Dark Leaks:** Fully unified semantic CSS variable tokens ensure 100% light parity across menus, tabs, viewers, controls, and status footers.
- **Customizable Accent Palette:** Popover color picker in the header toolbar featuring 6 curated presets (*Verdigris*, *Violet*, *Amber*, *Cyan*, *Rose*, *Monochrome*) plus a native hex color input.

### 3. 🔬 Forensic-Grade Session Persistence & Crash Resilience
- **Dual-Tier State Recovery:** Instant synchronous local storage cache for zero-flicker boot hydration paired with debounced atomic state serialization to `%APPDATA%\Docuopsy\session.json`.
- **Full Workspace Memory:** Automatically restores your active tab, open tabs, cursor line/column, scroll offset, split ratio, layout mode, theme, accent color, and AI sidebar state.
- **Atomic Scratch Drafts:** Unsaved modifications are cached via temporary atomic file swaps (`%APPDATA%\Docuopsy\drafts\<tab-id>.draft`) within 500ms debounce. You will never lose unsaved work to sudden power loss or crashes.
- **Clean File Disk Hydration:** File tabs are automatically re-hydrated from disk on application boot.

### 4. 📂 Format-Aware Multi-Document Previews
- **Markdown (GFM):** High-fidelity rendering with custom typographic headers (`h1`–`h6`), tables, blockquotes, task lists, and inline code formatting.
- **PDF Viewer (PDF.js):** Canvas-based page rendering with zoom controls (50%–300%), page navigation, and automatic layout switching to `FullPreview`.
- **Code & Plain Text:** Dedicated syntax-highlighted reader with tabular line numbers and quick clipboard copying for `.txt`, `.json`, `.rs`, `.ts`, and config files.

### 5. 📐 Dynamic 3-Mode Layout Engine
- **Split Mode:** Side-by-side editing and preview with an interactive 4px draggable divider.
- **Full Editor Mode:** Distraction-free, full-width editing space for drafting.
- **Full Preview Mode:** Dedicated reader mode optimized for long-form study and document inspection.

### 6. 🖥️ Dynamic Display Monitor Sizing
- On initial launch, Docuopsy detects the user's active display monitor resolution and dynamically sizes the window to exactly `0.70x width` and `0.70x height`, centering itself cleanly on the desktop.

---

## ⌨️ Default Keyboard Shortcuts

| Shortcut | Action | Description |
|---|---|---|
| `Ctrl + N` | **New Document** | Open a new scratch buffer tab |
| `Ctrl + O` | **Open File** | Open native system file picker |
| `Ctrl + S` | **Save File** | Save current active buffer to disk |
| `Ctrl + Shift + S` | **Save As** | Save current buffer with new file name |
| `Ctrl + W` | **Close Tab** | Close currently active document tab |
| `Ctrl + Tab` | **Next Tab** | Cycle to next open document tab |
| `Ctrl + \` | **Split Mode** | Toggle side-by-side editor and preview layout |
| `Ctrl + Shift + E` | **Editor Mode** | Switch to full-width editor layout |
| `Ctrl + Shift + P` | **Preview Mode**| Switch to full-width preview layout |
| `Ctrl + Shift + L` | **Toggle Theme** | Toggle between *Light Vellum* and *Dark Forensics* |
| `Ctrl + K` | **AI Assistant** | Toggle docked AI Assistant right sidebar |
| `Ctrl + Z` / `Ctrl + Y` | **Undo / Redo** | Native editor history traversal |

---

## 🛠️ Technology Stack

Docuopsy is 100% built on permissive, free, and open-source software (MIT / Apache-2.0 / BSD):

- **Backend Core:** [Rust](https://www.rust-lang.org/) (2021 Edition) with [Tauri v2](https://tauri.app/) & [Tokio](https://tokio.rs/)
- **Editor Engine:** [CodeMirror 6](https://codemirror.net/)
- **Frontend Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling & Tokens:** [Tailwind CSS](https://tailwindcss.com/) + CSS Variables
- **Package Manager:** [Bun](https://bun.sh/)
- **Document Previews:** [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla & `markdown-it` with `dompurify`
- **AI Gateway:** [KIE AI](https://kie.ai) (`deepseek-v4-1-flash`) via Streaming SSE in Rust

---

## 🚀 Getting Started

### Prerequisites
- [Rust toolchain](https://rustup.rs/) (stable `cargo` and `rustc`)
- [Bun](https://bun.sh/) (v1.2+)
- Windows C++ Build Tools (via Visual Studio Installer with Desktop development with C++)

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/docuopsy.git
cd docuopsy

# 2. Install frontend dependencies
bun install

# 3. Configure environment credentials
cp .env.example .env
# Edit .env and supply your KIE_AI_API_KEY if desired

# 4. Run in development mode (hot-reload enabled)
bun run tauri dev
```

### Running Tests & Quality Gates

```bash
# TypeScript type check
bun run tsc --noEmit

# Frontend Vitest test suite
bun run test

# Rust backend tests
cargo test --manifest-path src-tauri/Cargo.toml

# Rust Clippy linter
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings

# Build production bundle
bun run build
```

---

## 📦 Versioning & Releases

Docuopsy uses Semantic Versioning (`MAJOR.MINOR.PATCH`). 

- For version bump instructions and git tagging procedures, see [RELEASE.md](RELEASE.md).
- To view release history and changelogs, see [CHANGELOG.md](CHANGELOG.md).

```bash
# Automated version bump (updates package.json, Cargo.toml, tauri.conf.json, and CHANGELOG.md)
bun run version:bump <patch|minor|major|x.y.z>
```

---

## 📄 License

Docuopsy is open-source software licensed under the [MIT License](LICENSE).
