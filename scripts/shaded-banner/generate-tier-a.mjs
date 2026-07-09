#!/usr/bin/env node
/**
 * generate-tier-a.mjs — Tier A legible banner via figlet.
 * Usage: node generate-tier-a.mjs "ANDRE SCHU" [--font "ANSI Shadow"] [--max-width 72]
 */
import figlet from 'figlet';

function parseArgs(argv) {
  const opts = { font: 'ANSI Shadow', maxWidth: 72, lines: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--font') opts.font = argv[++i];
    else if (a === '--max-width') opts.maxWidth = Number(argv[++i]);
    else if (!a.startsWith('--')) opts.lines.push(a);
  }
  opts.text = opts.lines.join(' ');
  if (!opts.text) {
    console.error('Usage: generate-tier-a.mjs "TEXT" [--font "ANSI Shadow"] [--max-width 72]');
    process.exit(1);
  }
  return opts;
}

function renderBanner(text, font) {
  try {
    return figlet.textSync(text, { font, horizontalLayout: 'default', width: 200 });
  } catch (err) {
    console.error(`figlet font "${font}" failed: ${err.message}`);
    console.error('Try: Standard, Slant, Block, Big');
    process.exit(1);
  }
}

function validateWidth(banner, maxWidth) {
  const lines = banner.split('\n');
  const widest = Math.max(...lines.map((l) => l.length));
  if (widest > maxWidth) {
    console.error(`FAIL: widest line ${widest} cols exceeds max-width ${maxWidth}`);
    process.exit(1);
  }
  return lines;
}

const opts = parseArgs(process.argv);
const raw = renderBanner(opts.text, opts.font);
validateWidth(raw, opts.maxWidth);

process.stdout.write(raw.endsWith('\n') ? raw : raw + '\n');
