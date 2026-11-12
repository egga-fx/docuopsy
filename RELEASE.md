# Docuopsy Release & Versioning Guide 🚀

This document outlines the versioning strategy, pre-release verification checklist, and the step-by-step procedure for cutting new releases of **Docuopsy**.

---

## 1. Versioning Strategy

Docuopsy follows [Semantic Versioning (SemVer 2.0.0)](https://semver.org/):

$$\text{v}\mathbf{MAJOR}.\mathbf{MINOR}.\mathbf{PATCH}$$

- **MAJOR:** Incompatible API or structural architectural changes.
- **MINOR:** New backwards-compatible features, layout modes, or preview engines.
- **PATCH:** Backwards-compatible bug fixes, UI adjustments, and performance patches.

### Synchronized Manifests
The application version is synchronized across three configuration files:
1. `package.json` (`"version"`)
2. `src-tauri/Cargo.toml` (`[package] version`)
3. `src-tauri/tauri.conf.json` (`"version"`)

---

## 2. Automated Version Bump Utility

We provide an automated version bumping utility in `scripts/bump-version.js` that synchronizes all manifests and updates `CHANGELOG.md` in a single command.

### Usage
```bash
# Bump patch version (e.g., 0.1.0 -> 0.1.1)
bun run version:bump patch

# Bump minor version (e.g., 0.1.1 -> 0.2.0)
bun run version:bump minor

# Bump major version (e.g., 0.2.0 -> 1.0.0)
bun run version:bump major

# Set an explicit version
bun run version:bump 1.0.0
```

---

## 3. Pre-Release Verification Checklist (Quality Gate)

Before cutting any release tag, every step of the quality gate MUST pass:

```bash
# 1. TypeScript Static Typecheck
bun run tsc --noEmit

# 2. Frontend Unit & Component Tests
bun run test

# 3. Rust Backend Unit Tests
pwsh -Command '$env:TEMP = "D:\temp"; $env:TMP = "D:\temp"; cargo test --manifest-path src-tauri/Cargo.toml'

# 4. Rust Compiler & Linter Checks
pwsh -Command '$env:TEMP = "D:\temp"; $env:TMP = "D:\temp"; cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings'

# 5. Production Web Bundle Verification
bun run build
```

---

## 4. Cutting a Git Release Step-by-Step

### Step 1: Ensure Working Tree is Clean
```bash
git status
```
Ensure there are no untracked or unstaged unwanted files.

### Step 2: Bump Version & Update Changelog
```bash
bun run version:bump <patch|minor|major|x.y.z>
```
Review the diff to ensure all manifests and `CHANGELOG.md` were properly updated:
```bash
git diff
```

### Step 3: Commit the Release
```bash
git commit -am "chore(release): vX.Y.Z"
```

### Step 4: Create an Annotated Git Tag
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
```

### Step 5: Push Branch and Tags to Remote
```bash
git push origin master --tags
```

---

## 5. Building & Packaging Release Artifacts (Dual-Distribution)

Docuopsy follows the eggafx-labs production release protocol, delivering dual-distribution artifacts:

1. **Windows Setup Installer (`.exe`)**: Full NSIS installer with desktop/start-menu shortcuts and uninstaller.
2. **Portable Edition (`.zip`)**: Standalone binary with static MSVC runtime (`docuopsy.exe` + documentation) ready to run without installation.
3. **Cryptographic Integrity (`SHA256SUMS.txt`)**: Authenticity hashes for all release binaries.

### Step 1: Compile Release Binary
```bash
bun run tauri:build
```

### Step 2: Verify Static Runtime Guardrail
```bash
bun run verify:runtime
```
*Ensures the binary does not depend on dynamic MSVC redistributables (`vcruntime140.dll` / `msvcp140.dll`).*

### Step 3: Package Dual-Distribution Artifacts
```bash
bun run release:package
```

Output directory will be created at:
```
releases/vX.Y.Z/
├── Docuopsy_X.Y.Z_x64-setup.exe    # NSIS Windows Installer
├── Docuopsy_X.Y.Z_Portable_x64.zip # Standalone Portable ZIP
└── SHA256SUMS.txt                  # Cryptographic SHA256 hashes
```

