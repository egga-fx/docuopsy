#!/usr/bin/env node
/**
 * Docuopsy Dual-Distribution Release Packager
 * Packages:
 *  1. Windows Setup Installer (.exe) from NSIS output
 *  2. Portable Edition (.zip) from standalone binary
 *  3. Cryptographic SHA256 checksums (SHA256SUMS.txt)
 *
 * Output: releases/v<version>/
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const rootDir = resolve(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const version = pkg.version;
const appName = 'Docuopsy';
const relDir = join(rootDir, 'releases', `v${version}`);

console.log(`\x1b[36m>>> Packaging ${appName} v${version} Dual-Distribution...\x1b[0m\n`);

// 1. Locate NSIS installer
const nsisBundleDir = join(rootDir, 'src-tauri', 'target', 'release', 'bundle', 'nsis');
if (!existsSync(nsisBundleDir)) {
  console.error(`\x1b[31mError: NSIS bundle directory not found at ${nsisBundleDir}.\x1b[0m`);
  console.error('Run "bun run tauri:build" first.');
  process.exit(1);
}

const nsisFiles = readdirSync(nsisBundleDir).filter((f) => f.endsWith('.exe'));
if (nsisFiles.length === 0) {
  console.error('\x1b[31mError: No setup .exe found in NSIS bundle dir.\x1b[0m');
  process.exit(1);
}

const sourceInstaller = join(nsisBundleDir, nsisFiles[0]);

// 2. Locate standalone binary
const standaloneExe = join(rootDir, 'src-tauri', 'target', 'release', 'docuopsy.exe');
if (!existsSync(standaloneExe)) {
  console.error(`\x1b[31mError: Standalone binary not found at ${standaloneExe}.\x1b[0m`);
  process.exit(1);
}

// 3. Prepare release folder
if (!existsSync(relDir)) {
  mkdirSync(relDir, { recursive: true });
}

const installerTargetName = `${appName}_${version}_x64-setup.exe`;
const portableTargetName = `${appName}_${version}_Portable_x64.zip`;
const targetInstaller = join(relDir, installerTargetName);
const targetPortableZip = join(relDir, portableTargetName);

// Copy installer
copyFileSync(sourceInstaller, targetInstaller);
console.log(`  \x1b[32m✓\x1b[0m Copied Installer -> releases/v${version}/${installerTargetName}`);

// Prepare portable zip
const tempStage = join(relDir, '__portable_stage');
if (existsSync(tempStage)) {
  rmSync(tempStage, { recursive: true, force: true });
}
mkdirSync(tempStage, { recursive: true });
copyFileSync(standaloneExe, join(tempStage, 'docuopsy.exe'));

// Copy README / docs if present
const readmePath = join(rootDir, 'README.md');
if (existsSync(readmePath)) {
  copyFileSync(readmePath, join(tempStage, 'README.md'));
}

// Create ZIP using PowerShell Compress-Archive
console.log(`  \x1b[34mℹ\x1b[0m Compressing Portable edition...`);
if (existsSync(targetPortableZip)) {
  rmSync(targetPortableZip, { force: true });
}

execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${tempStage}/*' -DestinationPath '${targetPortableZip}' -CompressionLevel Optimal -Force"`,
  { stdio: 'inherit' }
);
rmSync(tempStage, { recursive: true, force: true });
console.log(`  \x1b[32m✓\x1b[0m Created Portable -> releases/v${version}/${portableTargetName}`);

// 4. Calculate SHA256SUMS.txt
function getHash(filePath) {
  const buf = readFileSync(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

const installerHash = getHash(targetInstaller);
const portableHash = getHash(targetPortableZip);

const shaContent = `${installerHash}  ${installerTargetName}\n${portableHash}  ${portableTargetName}\n`;
writeFileSync(join(relDir, 'SHA256SUMS.txt'), shaContent, 'utf8');
console.log(`  \x1b[32m✓\x1b[0m Generated releases/v${version}/SHA256SUMS.txt`);

// Format size
function formatBytes(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

const installerSize = formatBytes(statSync(targetInstaller).size);
const portableSize = formatBytes(statSync(targetPortableZip).size);

console.log(`\n\x1b[32m=================================================================\x1b[0m`);
console.log(`\x1b[1m🎉 ${appName} v${version} Release Artifacts Ready!\x1b[0m`);
console.log(`\x1b[32m=================================================================\x1b[0m`);
console.log(`Location: releases/v${version}/\n`);
console.log(`| Type | File | Size |`);
console.log(`| :--- | :--- | :--- |`);
console.log(`| Windows Setup | ${installerTargetName} | ${installerSize} |`);
console.log(`| Portable Zip  | ${portableTargetName}  | ${portableSize} |`);
console.log(`\n\x1b[1mSHA256SUMS:\x1b[0m`);
console.log(`${installerHash}  ${installerTargetName}`);
console.log(`${portableHash}  ${portableTargetName}\n`);

