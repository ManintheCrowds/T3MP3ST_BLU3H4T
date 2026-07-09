#!/usr/bin/env node
/**
 * generate-tier-b-blocklet.mjs — blocklet v0.1.3-compatible renderer (Node port).
 * Use when `cargo install blocklet` is unavailable (e.g. missing MSVC link.exe).
 *
 * Usage (matches blocklet CLI: each arg = separate output block):
 *   node generate-tier-b-blocklet.mjs ANDRE SCHU -f standard_shadow --width 72
 */
import { getFont } from './blocklet-fonts.mjs';

/**
 * @param {string[]} chars
 * @param {Record<string, string[]>} font
 */
function renderWord(chars, font) {
  const height = 7;
  const lines = Array.from({ length: height }, () => '');
  for (const ch of chars) {
    const key = ch.toUpperCase();
    const glyph = font[key] ?? font[' '];
    for (let i = 0; i < height; i++) {
      lines[i] += glyph[i] ?? '';
    }
  }
  return lines;
}

/**
 * @param {string} text
 * @param {string} fontName
 */
export function renderBlockletLine(text, fontName) {
  const font = getFont(fontName);
  const chars = [...text.toUpperCase()];
  return renderWord(chars, font).join('\n');
}

function parseArgs(argv) {
  const opts = { font: 'standard_shadow', texts: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-f' || a === '--font') opts.font = argv[++i];
    else if (a === '-w' || a === '--width') {
      /* width wrapping not needed for ANDRE/SCHU at 72 */
      argv[++i];
    }
    else if (a === '-n' || a === '--no-shadow') opts.font = 'standard_solid';
    else if (!a.startsWith('-')) opts.texts.push(a);
  }
  return opts;
}

const opts = parseArgs(process.argv);
if (!opts.texts.length) {
  console.error('Usage: generate-tier-b-blocklet.mjs ANDRE SCHU [-f standard_shadow|standard_solid]');
  process.exit(1);
}

const blocks = opts.texts.map((t) => renderBlockletLine(t, opts.font));
process.stdout.write(blocks.join('\n\n') + '\n');
