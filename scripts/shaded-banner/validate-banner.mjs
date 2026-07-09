#!/usr/bin/env node
/**
 * validate-banner.mjs — checks banner artifacts before commit.
 * Usage: node validate-banner.mjs path/to/banner.txt [--max-width 72] [--expected "ANDRE SCHU"]
 */
import fs from 'fs';
import path from 'path';

const BLOCK_CHARS = /[▄█▓▒░▀|#_]/u;
const SHADE_CHARS = /[▄█▓▒░▀]/u;

function parseArgs(argv) {
  const opts = { maxWidth: 72, expected: null, file: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--max-width') opts.maxWidth = Number(argv[++i]);
    else if (a === '--expected') opts.expected = argv[++i];
    else if (!a.startsWith('--')) opts.file = a;
  }
  if (!opts.file) {
    console.error('Usage: validate-banner.mjs <banner.txt> [--max-width 72] [--expected "TEXT"]');
    process.exit(1);
  }
  return opts;
}

function columnGapLetterHeuristic(lines, expected) {
  if (!expected) return { warn: null };
  const joined = lines.filter((l) => l.trim()).join('\n');
  const nonSpace = joined.replace(/ /g, '');
  const gaps = (joined.match(/ {3,}/g) || []).length;
  const expectedLetters = expected.replace(/\s+/g, '').length;
  const ratio = gaps / Math.max(expectedLetters, 1);
  if (ratio < 0.3 && expectedLetters > 3) {
    return {
      warn: `Low column-gap ratio (${ratio.toFixed(2)}) — name may not parse as "${expected}"`,
    };
  }
  return { warn: null };
}

const opts = parseArgs(process.argv);
const raw = fs.readFileSync(opts.file, 'utf8');
const lines = raw.replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/\s+$/, ''));

let failed = false;
const widest = Math.max(...lines.map((l) => l.length), 0);

if (widest > opts.maxWidth) {
  console.error(`FAIL: widest line ${widest} > max-width ${opts.maxWidth}`);
  failed = true;
}

const allChars = lines.join('');
const shadeCount = (allChars.match(new RegExp(SHADE_CHARS, 'gu')) || []).length;
const blockCount = (allChars.match(new RegExp(BLOCK_CHARS, 'gu')) || []).length;

if (blockCount === 0) {
  console.error('FAIL: no block/figlet characters detected');
  failed = true;
}

const heuristic = columnGapLetterHeuristic(lines, opts.expected);
if (heuristic.warn) {
  console.warn(`WARN: ${heuristic.warn}`);
}

console.log(`OK: ${path.basename(opts.file)} — ${lines.length} lines, ${widest} cols wide, shade ratio ${(shadeCount / Math.max(blockCount, 1)).toFixed(2)}`);
process.exit(failed ? 1 : 0);
