# INFRA.md - Infrastructure, Tooling, Environment & CI/CD

## 1. System Requirements & Toolchains

Docuopsy requires the following host toolchains for development and production compilation on Windows:

| Tool | Recommended Version | Purpose |
|---|---|---|
| **Rust / Cargo** | `1.78+` (stable) | Compiles backend native binary and Tauri core. |
| **Runtime & Package Manager** | [Bun](https://bun.sh/) `v1.2+` | Ultra-fast JavaScript/TypeScript runtime & package manager. |
| **Build Tools** | Visual Studio 2022 C++ Build Tools | Required for compiling native Windows bindings (WebView2, Crate linking). |
| **WebView2** | Evergreen Runtime | Pre-installed on Windows 10/11. |

---

## 2. Environment Variables & Configuration

Create a `.env` file in the root workspace directory for local development:

```bash
# KIE AI Gateway Configuration
KIE_AI_BASE_URL="https://api.kie.ai/v1"
KIE_AI_API_KEY="your_kie_ai_key_here"
KIE_AI_DEFAULT_MODEL="claude-haiku-5-5"

# Debug-build Rust fallback (also readable from src-tauri/.env.dev)
KIE_AI_API_KEY_DEV="your_debug_only_kie_ai_key_here"

# Browser-dev AI gateway key (read by the Vite proxy, never bundled)
OMNIROUTE_API_KEY="your_omniroute_key_here"

# Observability & Logging Flags
DOCUOPSY_LOG_LEVEL="info"          # trace | debug | info | warn | error
DOCUOPSY_LOG_DIR="%LOCALAPPDATA%/Docuopsy/logs"
DOCUOPSY_AUTO_PERSIST_MS="500"     # State auto-save debounce rate in ms
```

### Production AppData Paths
- **Config & Session Store:** `%APPDATA%\Docuopsy\session.json`
- **Dirty Buffer Draft Cache:** `%APPDATA%\Docuopsy\drafts\`
- **Application Logs:** `%LOCALAPPDATA%\Docuopsy\logs\docuopsy-YYYY-MM-DD.log`

---

## 3. Development Testing & Quality Assurance Suite

Docuopsy adopts a dual-engine test suite spanning the Rust core and TypeScript frontend:

### Running Backend Tests (Rust)
```bash
# Run all unit and integration tests
cargo test --manifest-path src-tauri/Cargo.toml

# Run tests with live console tracing output
cargo test --manifest-path src-tauri/Cargo.toml -- --nocapture

# Run only persistence or security tests
cargo test --manifest-path src-tauri/Cargo.toml test_security_path_traversal
cargo test --manifest-path src-tauri/Cargo.toml test_atomic_persistence
```

### Running Frontend Tests (TypeScript / Vitest via Bun)
```bash
# Run unit & component tests in fast run mode
bun run test

# Run tests with live watch
bun run test:watch
```

### Static Quality & Lint Verification
```bash
# 1. Type check frontend without emitting files
bun run tsc --noEmit

# 2. Rust clippy linting (strictly disallowing all warnings)
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings

# 3. Security audit on dependencies
cargo audit
```

---

## 4. Build & Execution Scripts

### Development Mode
```bash
# Start frontend and Rust backend in concurrent watch mode with hot reload
bun run tauri dev
```

### Production Packaging
```bash
# Generate standalone NSIS installer and portable executable
bun run tauri build
```
Artifacts output to: `src-tauri/target/release/bundle/nsis/`

---

## 5. Continuous Integration (CI) Workflow Template

When configured with GitHub Actions (`.github/workflows/ci.yml`):
- **Matrix:** `windows-latest`
- **Pipeline Stages:**
  1. **Checkout & Cache:** Setup Rust cache (`Swatinem/rust-cache`) and Bun environment.
  2. **Lint & Type Check:** `cargo clippy -- -D warnings` and `bun run tsc --noEmit`.
  3. **Backend Test Execution:** `cargo test --verbose`.
  4. **Frontend Test Execution:** `bun run test`.
  5. **Smoke Build:** `bun run tauri build --debug` to verify packaging integrity.
