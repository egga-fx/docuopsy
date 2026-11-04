# INFRA.md - Infrastructure, Tooling, Environment & CI/CD

## 1. System Requirements & Toolchains

Docuopsy requires the following host toolchains for development and production compilation on Windows:

| Tool | Recommended Version | Purpose |
|---|---|---|
| **Rust / Cargo** | `1.78+` (stable) | Compiles backend native binary and Tauri core. |
| **Node.js** | `v20.x LTS` or higher | JavaScript/TypeScript runtime. |
| **Package Manager** | `pnpm v9+` (preferred) or `npm` | Deterministic dependency management. |
| **Build Tools** | Visual Studio 2022 C++ Build Tools | Required for compiling native Windows bindings (WebView2, Crate linking). |
| **WebView2** | Evergreen Runtime | Pre-installed on Windows 10/11. |

---

## 2. Environment Variables & Configuration

Create a `.env` file in the root workspace directory for local development:

```bash
# KIE AI Gateway Configuration
KIE_AI_BASE_URL="https://api.kie.ai/v1"
KIE_AI_API_KEY="e003b0c015d233ea848997456242e97b"
KIE_AI_DEFAULT_MODEL="claude-haiku-5-5"

# Application Performance & Debugging Flags
DOCUOPSY_LOG_LEVEL="info"          # trace | debug | info | warn | error
DOCUOPSY_AUTO_PERSIST_MS="500"     # State auto-save debounce rate in ms
```

### Production AppData Paths
- **Config & Session Store:** `%APPDATA%\Docuopsy\session.json`
- **Dirty Buffer Draft Cache:** `%APPDATA%\Docuopsy\drafts\`
- **Application Logs:** `%LOCALAPPDATA%\Docuopsy\logs\`

---

## 3. Build & Execution Scripts

### Development
```bash
# Start frontend and Rust backend in concurrent watch mode
pnpm tauri dev
```

### Static Quality Verification
```bash
# 1. Type check frontend
pnpm tsc --noEmit

# 2. Rust syntax & lint check with strict denial of warnings
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings

# 3. Backend unit and integration tests
cargo test --manifest-path src-tauri/Cargo.toml
```

### Production Packaging
```bash
# Generate standalone NSIS installer and portable executable
pnpm tauri build
```
Artifacts output to: `src-tauri/target/release/bundle/nsis/`

---

## 4. Security & License Compliance Auditing

To maintain our 100% free and open-source guarantee and zero-vulnerability security stance:

```bash
# Check for known security vulnerabilities in Rust crate dependencies
cargo install cargo-audit
cargo audit

# Verify all npm dependencies comply with permissive open-source licenses (MIT, Apache-2.0, BSD)
pnpm dlx license-checker --summary --onlyAllow "MIT;Apache-2.0;BSD-3-Clause;BSD-2-Clause;ISC"
```

---

## 5. Continuous Integration (CI) Workflow Template

When configured with GitHub Actions (`.github/workflows/ci.yml`):
- **Matrix:** `windows-latest`
- **Steps:**
  1. Checkout code
  2. Setup Rust toolchain with caching (`Swatinem/rust-cache`)
  3. Setup Node.js & pnpm
  4. Run `pnpm install --frozen-lockfile`
  5. Run `cargo clippy` and `pnpm tsc`
  6. Run `cargo test`
  7. Run `pnpm tauri build --debug` (smoke build validation)
