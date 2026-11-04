# Docuopsy 🔬📄

> **Docuopsy** (*Document + Autopsy*): High-Performance, Secure, Multi-Format Desktop Text Editor & Viewer with Forensic-Grade Session Persistence.

[![Rust](https://img.shields.io/badge/Rust-2021-DEA584?style=flat&logo=rust)](https://www.rust-lang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-v2-24C8D8?style=flat&logo=tauri)](https://tauri.app/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Security](https://img.shields.io/badge/Security-First-brightgreen.svg)]()
[![AI](https://img.shields.io/badge/AI-KIE%20AI%20(Claude%20Haiku%205.5)-purple.svg)](https://kie.ai)

---

## ⚡ Guiding Philosophy

Docuopsy is engineered according to an uncompromising priority order:

$$\mathbf{Speed\ (Performance)} \longrightarrow \mathbf{Security} \longrightarrow \mathbf{Features}$$

1. **Speed:** Instant startup (<1.5s), minimal RAM footprint, virtualized text rendering, and zero-cost asynchronous I/O in Rust.
2. **Security:** Native local-first architecture, directory traversal prevention, sanitized HTML previews, and no tracking or telemetry.
3. **Features:** Focused, high-utility capabilities designed for developers, technical writers, and researchers.

---

## 🌟 Key Features

* **🔬 Forensic-Grade Session Persistence:** Never lose unsaved work again. Docuopsy remembers every open tab, cursor position, scroll offset, active theme, and unsaved scratch draft across restarts and system crashes.
* **🌗 Day-One Dual-Theme Studio (*The Archival Forensics Studio*):**
  * **Dark Forensics:** Low-glare obsidian slate (`#0B0F14`) with Forensic Verdigris (`#0E9F8A`) accents for extended nocturnal writing and code inspection.
  * **High-Contrast Light:** Glare-free archival vellum (`#FAF7F0`) with deep Forensic Ink (`#12161F`, >15:1 AAA contrast) and `Literata` editorial typography (65–72ch measure) for academic PDF reading and daytime manuscript drafting.
* **📑 Top Tab Workspace:** Fast 36px tab strip, dirty buffer amber badges (`•`), SVG file type icons, tabular telemetry, and keyboard-first shortcuts (`Ctrl+N`, `Ctrl+W`, `Ctrl+Tab`).
* **📐 Dynamic 3-Mode Layout:**
  * **Split Mode:** Side-by-side editing and real-time Markdown preview with a precision 4px draggable divider.
  * **Full Editor Mode:** Distraction-free, full-width text editing for `.txt`, Markdown, and source code.
  * **Full Preview Mode:** Dedicated scholarly reader mode and high-fidelity `.pdf` document viewing.
* **📂 Multi-Format Support:**
  * Plain text & source files (`.txt`, `.json`, `.log`, `.csv`, `.rs`, `.js`, etc.)
  * Rich Markdown (`.md`) with GFM tables, code syntax highlighting, and `DOMPurify` XSS sanitization.
  * PDF documents (`.pdf`) via embedded, high-performance canvas rendering.
* **🤖 In-Editor Generative AI Assistant:**
  * Powered by **KIE AI** utilizing the ultra-fast **Claude Haiku 5.5** model.
  * Triggered directly inside the editor (`Ctrl+K`) with Neural Violet (`#7C5CFC`) focus telemetry: continue writing, summarize, fix grammar, and execute custom prompts with non-blocking streaming tokens.

---

## 🛠️ Technology Stack (100% Free & Open Source)

Docuopsy exclusively uses permissive, free open-source software (MIT / Apache-2.0 / BSD):

* **Backend Core:** [Rust](https://www.rust-lang.org/) with [Tauri v2](https://tauri.app/) & [Tokio](https://tokio.rs/)
* **Editor Engine:** [CodeMirror 6](https://codemirror.net/) (Virtualized DOM, modular architecture)
* **Frontend Shell:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/)
* **PDF Engine:** [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla
* **Markdown Engine:** `markdown-it` with `dompurify` sanitization

---

## 🚀 Getting Started

### Prerequisites
- [Rust toolchain](https://rustup.rs/) (Cargo & rustc stable)
- [Node.js](https://nodejs.org/) (v20+) or [pnpm](https://pnpm.io/)
- Windows C++ Build Tools (via Visual Studio Installer)

### Installation & Development
```bash
# 1. Clone repository
git clone https://github.com/your-username/docuopsy.git
cd docuopsy

# 2. Install frontend dependencies
pnpm install

# 3. Run in development mode (hot-reload enabled)
pnpm tauri dev

# 4. Build optimized production release
pnpm tauri build
```

---

## ⌨️ Default Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + N` | New Document / Tab |
| `Ctrl + O` | Open File Dialog |
| `Ctrl + S` | Save Current File |
| `Ctrl + W` | Close Active Tab |
| `Ctrl + Tab` | Switch to Next Tab |
| `Ctrl + \` | Toggle Split Mode |
| `Ctrl + Shift + E` | Switch to Full Editor Mode |
| `Ctrl + Shift + P` | Switch to Full Preview Mode |
| `Ctrl + Shift + L` | Toggle Theme (`Dark Forensics` / `High-Contrast Light`) |
| `Ctrl + K` | Open In-Editor AI Assistant |

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).

