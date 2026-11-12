#!/usr/bin/env node
/**
 * PE import-table guardrail for Docuopsy.
 *
 * Verifies that the release artifacts do not depend on the dynamic MSVC
 * redistributable (vcruntime140.dll / msvcp140.dll ...).
 *
 * Usage:
 *   node scripts/check-static-runtime.mjs <file.exe> [more files...]
 *   node scripts/check-static-runtime.mjs --report <file.exe>
 */

import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

/** DLLs shipped by the Microsoft Visual C++ Redistributable. */
const REDIST_DLLS = [
  /^vcruntime140(_1|_2)?\.dll$/i,
  /^msvcp140(_1|_2|_codecvt_ids|_atomic_wait)?\.dll$/i,
  /^concrt140\.dll$/i,
  /^vccorlib140(_1)?\.dll$/i,
  /^mfc140.*\.dll$/i,
  /^mfcm140.*\.dll$/i,
];

/** Directories that may hold the compiled application binary. */
const TARGET_DIRS = [
  process.env.CARGO_TARGET_DIR,
  join('src-tauri', 'target'),
].filter(Boolean);

const BINARY_NAMES = ['docuopsy.exe', 'docuopsy'];

function discoverBinaries() {
  const found = [];
  for (const targetDir of TARGET_DIRS) {
    for (const profile of ['release']) {
      for (const name of BINARY_NAMES) {
        const candidate = join(targetDir, profile, name);
        if (existsSync(candidate)) found.push(candidate);
      }
    }
  }
  return found;
}

export function parseImports(buffer) {
  if (buffer.length < 0x40 || buffer.readUInt16LE(0) !== 0x5a4d) {
    throw new Error('not a PE file (missing MZ signature)');
  }

  const peOffset = buffer.readUInt32LE(0x3c);
  if (buffer.readUInt32LE(peOffset) !== 0x00004550) {
    throw new Error('not a PE file (missing PE signature)');
  }

  const coff = peOffset + 4;
  const sectionCount = buffer.readUInt16LE(coff + 2);
  const optionalHeaderSize = buffer.readUInt16LE(coff + 16);
  const optional = coff + 20;

  const isPe32Plus = buffer.readUInt16LE(optional) === 0x20b;
  const dataDirectories = optional + (isPe32Plus ? 112 : 96);
  const importRva = buffer.readUInt32LE(dataDirectories + 8);

  const sectionTable = optional + optionalHeaderSize;
  const sections = [];
  for (let i = 0; i < sectionCount; i += 1) {
    const header = sectionTable + i * 40;
    sections.push({
      virtualSize: buffer.readUInt32LE(header + 8),
      virtualAddress: buffer.readUInt32LE(header + 12),
      rawSize: buffer.readUInt32LE(header + 16),
      rawPointer: buffer.readUInt32LE(header + 20),
    });
  }

  const rvaToOffset = (rva) => {
    for (const section of sections) {
      const span = Math.max(section.virtualSize, section.rawSize);
      if (rva >= section.virtualAddress && rva < section.virtualAddress + span) {
        return section.rawPointer + (rva - section.virtualAddress);
      }
    }
    throw new Error(`RVA 0x${rva.toString(16)} is not mapped by any section`);
  };

  const readCString = (offset) => {
    let end = offset;
    while (end < buffer.length && buffer[end] !== 0) end += 1;
    return buffer.toString('latin1', offset, end);
  };

  if (!importRva) return [];

  const imports = [];
  let descriptor = rvaToOffset(importRva);
  while (descriptor + 20 <= buffer.length) {
    const nameRva = buffer.readUInt32LE(descriptor + 12);
    if (nameRva === 0) break;
    imports.push(readCString(rvaToOffset(nameRva)));
    descriptor += 20;
  }
  return imports;
}

function isRedistributable(dll) {
  return REDIST_DLLS.some((pattern) => pattern.test(dll));
}

function main(argv) {
  const reportOnly = argv.includes('--report');
  let files = argv.filter((arg) => !arg.startsWith('--'));

  if (files.length === 0) {
    files = discoverBinaries();
    if (files.length === 0) {
      console.error('No compiled binary found. Build the app first (bun run tauri:build).');
      return 2;
    }
  }

  let failed = false;

  for (const file of files) {
    let imports;
    try {
      imports = parseImports(readFileSync(file));
    } catch (error) {
      console.error(`FAIL ${basename(file)}: ${error.message}`);
      failed = true;
      continue;
    }

    const offenders = imports.filter(isRedistributable);

    if (reportOnly) {
      console.log(`${basename(file)}:`);
      for (const dll of imports) console.log(`  ${dll}`);
      continue;
    }

    if (offenders.length > 0) {
      console.error(`FAIL ${basename(file)}: dynamically links the MSVC redistributable:`);
      for (const dll of offenders) console.error(`  - ${dll}`);
      failed = true;
    } else {
      console.log(`OK   ${basename(file)}: no MSVC redistributable dependency (${imports.length} imports)`);
    }
  }

  if (failed) {
    console.error('');
    console.error('The build must be produced with `tauri build` (STATIC_VCRUNTIME=true).');
    console.error('A raw `cargo build --release` links vcruntime140.dll dynamically.');
    return 1;
  }
  return 0;
}

process.exit(main(process.argv.slice(2)));

