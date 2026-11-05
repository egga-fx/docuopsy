#!/usr/bin/env bun
/**
 * Docuopsy Unified Version Bump Script
 * Synchronizes semantic versioning across:
 * - package.json
 * - src-tauri/Cargo.toml
 * - src-tauri/tauri.conf.json
 * - CHANGELOG.md
 *
 * Usage:
 *   bun scripts/bump-version.js <patch|minor|major|x.y.z>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('\x1b[31mError: Missing version argument.\x1b[0m');
  console.log('Usage: bun scripts/bump-version.js <patch|minor|major|x.y.z>');
  console.log('Example: bun run version:bump patch');
  console.log('Example: bun run version:bump 0.2.0');
  process.exit(1);
}

const target = args[0].toLowerCase();

// 1. Read package.json
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const currentVersion = pkg.version;

// 2. Compute new version
let newVersion = target;
if (['patch', 'minor', 'major'].includes(target)) {
  const parts = currentVersion.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    console.error(`\x1b[31mCurrent version "${currentVersion}" is not standard semver X.Y.Z\x1b[0m`);
    process.exit(1);
  }
  const [major, minor, patch] = parts;
  if (target === 'major') newVersion = `${major + 1}.0.0`;
  else if (target === 'minor') newVersion = `${major}.${minor + 1}.0`;
  else if (target === 'patch') newVersion = `${major}.${minor}.${patch + 1}`;
}

// Strip leading 'v' if user typed e.g. "v0.2.0"
if (newVersion.startsWith('v')) {
  newVersion = newVersion.slice(1);
}

// Validate SemVer format: X.Y.Z or X.Y.Z-prerelease
const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
if (!semverRegex.test(newVersion)) {
  console.error(`\x1b[31mError: Invalid SemVer version "${newVersion}". Must match X.Y.Z\x1b[0m`);
  process.exit(1);
}

console.log(`\x1b[36m>>> Bumping Docuopsy version: ${currentVersion} -> ${newVersion}\x1b[0m\n`);

// 3. Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`  \x1b[32m✓\x1b[0m Updated package.json: version = "${newVersion}"`);

// 4. Update src-tauri/Cargo.toml
const cargoPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');
let cargoContent = fs.readFileSync(cargoPath, 'utf8');
const cargoVersionRegex = /(^\[package\][\s\S]*?^version\s*=\s*")([^"]+)(")/m;
if (cargoVersionRegex.test(cargoContent)) {
  cargoContent = cargoContent.replace(cargoVersionRegex, `$1${newVersion}$3`);
  fs.writeFileSync(cargoPath, cargoContent, 'utf8');
  console.log(`  \x1b[32m✓\x1b[0m Updated src-tauri/Cargo.toml: version = "${newVersion}"`);
} else {
  console.warn(`  \x1b[33m!\x1b[0m Could not locate [package] version in src-tauri/Cargo.toml`);
}

// 5. Update src-tauri/tauri.conf.json
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
tauriConf.version = newVersion;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf8');
console.log(`  \x1b[32m✓\x1b[0m Updated src-tauri/tauri.conf.json: version = "${newVersion}"`);

// 6. Update CHANGELOG.md if present
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
if (fs.existsSync(changelogPath)) {
  let changelog = fs.readFileSync(changelogPath, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  const unreleasedMarker = '## [Unreleased]';

  if (!changelog.includes(`## [${newVersion}]`) && changelog.includes(unreleasedMarker)) {
    const releaseHeader = `## [Unreleased]\n\n## [${newVersion}] - ${today}`;
    changelog = changelog.replace(unreleasedMarker, releaseHeader);
    fs.writeFileSync(changelogPath, changelog, 'utf8');
    console.log(`  \x1b[32m✓\x1b[0m Updated CHANGELOG.md: Added [${newVersion}] - ${today}`);
  }
}

console.log(`\n\x1b[32m🎉 Version successfully synchronized across all manifests to ${newVersion}!\x1b[0m\n`);
console.log(`Recommended git release sequence:`);
console.log(`  git status`);
console.log(`  git commit -am "chore(release): v${newVersion}"`);
console.log(`  git tag -a v${newVersion} -m "Release v${newVersion}"`);
console.log(`  git push origin master --tags`);
