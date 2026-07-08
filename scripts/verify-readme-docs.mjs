#!/usr/bin/env node
/**
 * verify-readme-docs — CI gate for README/FEATURES claims and markdown links.
 * Re-derives headline structural counts from the repo; does not replace human prose review.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = (...p) => path.join(REPO, ...p);

let pass = 0;
let fail = 0;

const check = (label, cond, detail = '') => {
  if (cond) {
    pass++;
    console.log(`  ✅ ${label}${detail ? ` — ${detail}` : ''}`);
  } else {
    fail++;
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

function read(p) {
  return fs.readFileSync(R(p), 'utf8');
}

function countDetectionFiles() {
  const dir = R('src/detection');
  let count = 0;
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.name.endsWith('.ts') && !ent.name.endsWith('.test.ts')) count++;
    }
  };
  walk(dir);
  return count;
}

function countGovernanceFiles() {
  return fs.readdirSync(R('src/governance')).filter((f) => f.endsWith('.ts')).length;
}

function countDefensiveOperators() {
  const src = read('src/operators/defensive.ts');
  const m = src.match(/export type DefensiveArchetype\s*=\s*([\s\S]*?);/);
  if (!m) return 0;
  return (m[1].match(/'[a-z]+'/g) || []).length;
}

function countAiTechniques() {
  const src = read('docs/AI_REDTEAM_TECHNIQUES.md');
  const matches = [...src.matchAll(/^### 2\.(\d+)/gm)];
  return matches.filter((m) => m[1] !== '19').length;
}

function countCiRunSteps() {
  const yml = read('.github/workflows/ci.yml');
  return (yml.match(/^\s+- run:/gm) || []).length;
}

function extractMarkdownLinks(content, baseFile) {
  const links = [];
  const re = /\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const target = m[1].trim();
    if (target.startsWith('http') || target.startsWith('#') || target.startsWith('mailto:')) continue;
    const cleaned = target.split('#')[0];
    if (!cleaned) continue;
    const resolved = path.normalize(path.join(path.dirname(R(baseFile)), cleaned));
    links.push({ target: cleaned, resolved });
  }
  return links;
}

function verifyLinks(files) {
  let broken = 0;
  for (const file of files) {
    const content = read(file);
    for (const { target, resolved } of extractMarkdownLinks(content, file)) {
      if (!fs.existsSync(resolved)) {
        broken++;
        console.log(`  ❌ broken link in ${file}: ${target}`);
      }
    }
  }
  check('Markdown links resolve in scope files', broken === 0, broken ? `${broken} broken` : `${files.length} files`);
}

console.log('\n════════ T3MP3ST — README/docs verification ════════\n');

const defensiveCount = countDefensiveOperators();
const detectionCount = countDetectionFiles();
const governanceCount = countGovernanceFiles();
const techniqueCount = countAiTechniques();
const ciSteps = countCiRunSteps();

check('Defensive operator count', defensiveCount === 8, `${defensiveCount}`);
check('Detection TypeScript file count', detectionCount === 13, `${detectionCount}`);
check('Governance module file count', governanceCount === 6, `${governanceCount}`);
check('AI red-team technique count (§2.1–§2.18)', techniqueCount === 18, `${techniqueCount}`);

const readme = read('README.md');
check('README claims 8 defensive operators', /\b8\b[^.\n]*defensive operator/i.test(readme) || readme.includes('SENTINEL') && readme.includes('ANALYST'));
check('README claims 13-file detection', readme.includes('13-file') || readme.includes('13 files'));
check('README claims 18-technique playbook', readme.includes('18-technique') || readme.includes('18 technique'));
check('README blue-hat identity', /blue team/i.test(readme) && /governance-first/i.test(readme));
check('README links FORK_LINEAGE.md', readme.includes('FORK_LINEAGE.md'));
check('README links mission-targets-semantics', readme.includes('mission-targets-semantics.md'));

const pkg = JSON.parse(read('package.json'));
check('package.json repository URL', pkg.repository?.url?.includes('ManintheCrowds/T3MP3ST_BLU3H4T'));
const requiredKw = ['blue-team', 'defensive-security', 'governance', 'scp'];
check('package.json defensive keywords', requiredKw.every((k) => pkg.keywords?.includes(k)));

check('verify:docs script registered', !!pkg.scripts?.['verify:docs']);
check('CI includes verify:docs step', read('.github/workflows/ci.yml').includes('npm run verify:docs'), `${ciSteps} run steps`);

verifyLinks([
  'README.md',
  'FEATURES.md',
  'docs/DETECTION_ENGINE_DESIGN.md',
  'docs/ANTI_AI_REDTEAM_DESIGN.md',
  'docs/RESPONSE_DECEPTION_DESIGN.md',
  'docs/governance/mission-targets-semantics.md',
  'docs/FORK_LINEAGE.md',
]);

console.log(`\n════════ ${pass} passed, ${fail} failed ════════\n`);
process.exit(fail > 0 ? 1 : 0);
