#!/usr/bin/env node
// plan-literal-lint — advisory scan for stack-fragile literals in a war-shaped plan.
//
// Modeled on war-memory.mjs's LINT_PATTERNS array + lint(text) + CLI shape (no parser, no deps —
// node:fs only). Flags the four cheap, high-precision literal antipatterns the /war-strategy plan
// template teaches authors to avoid (spec §4.3): a :N-M line-range locator, a concrete *.test.sh
// gate enumeration, a stale "ALL FIVE suites" count, and a hardcoded version inside a release task.
//
// FAIL-OPEN BY DECISION (ADR 0030): report-and-exit-0. This is NEVER a CI gate — the only CI job is
// war-memory's redaction lint. `--strict` is opt-in (exit non-zero on any hit) for local authoring.
// The version pattern is advisory precisely because a legitimately-cited baseline version can
// false-positive inside a release task; the whole tool is advice, not enforcement.

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Pattern table. Each entry is a per-line regex plus optional context guards:
//   requireOnLine — the line must also match this (e.g. a gate/run directive);
//   releaseScoped — only fires inside a task/phase heading naming a release/version bump.
// Extending the lint is editing this one array (the war-memory.mjs idiom).
// ---------------------------------------------------------------------------
export const LINT_PATTERNS = [
  {
    // A construct locator should name the enclosing symbol/comment header, not a stack-fragile
    // filename:N-M (or "lines N-M") range that rots across the serial merge queue.
    name: 'line-range',
    re: /(?:[\w./-]+:\s?\d+\s?[-–]\s?\d+|\blines?\s+\d+\s?[-–]\s?\d+)/gi,
  },
  {
    // A gate directive should reference resolveGate in war-config.mjs by name, never enumerate a
    // concrete foo.test.sh file. The glob token `*.test.sh` (a concept, not a file) is not flagged.
    name: 'literal-suite-list',
    re: /\b\w[\w.-]*\.test\.sh\b/gi,
    requireOnLine: /\b(?:gate|run)\b/i,
  },
  {
    // A restated suite count ("ALL FIVE suites") rots the moment a suite is added; reference the
    // self-discovery gate instead.
    name: 'suite-count',
    re: /\ball\s+(?:five|six|seven|eight|nine|ten|\d+)\s+suites?\b/gi,
  },
  {
    // A hardcoded release version — resolve the next free patch above the live base at land time.
    // Advisory: a legitimately-cited baseline version in a release task can false-positive.
    name: 'hardcoded-version',
    re: /\bv?\d+\.\d+\.\d+\b/gi,
    releaseScoped: true,
  },
];

// A markdown heading or a **Task N** / **Phase N** bold heading resets release scope.
const HEADING = /^(?:#{1,6}\s|\s*[-*]*\s*\*\*(?:task|phase)\b)/i;
const RELEASE_HEADING = /\b(?:release|version\s+bump)\b/i;

// Returns [{ pattern, match }]. Line-based so context guards (gate directive, release heading) work.
export function lint(text) {
  const hits = [];
  let inRelease = false;
  for (const line of text.split('\n')) {
    if (HEADING.test(line)) inRelease = RELEASE_HEADING.test(line);
    for (const p of LINT_PATTERNS) {
      if (p.releaseScoped && !inRelease) continue;
      if (p.requireOnLine && !p.requireOnLine.test(line)) continue;
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(line)) !== null) {
        hits.push({ pattern: p.name, match: m[0].trim() });
        if (m.index === p.re.lastIndex) p.re.lastIndex++; // guard zero-width
      }
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// CLI: plan-literal-lint.mjs <plan.md> [more.md ...] [--strict]
// Default exit 0 always (report-and-exit-0). --strict exits 1 if any file had a hit.
// ---------------------------------------------------------------------------
function main(argv) {
  const strict = argv.includes('--strict');
  const files = argv.filter((a) => a !== '--strict');
  if (files.length === 0) {
    process.stderr.write('plan-literal-lint: usage: plan-literal-lint.mjs <plan.md> [...] [--strict]\n');
    process.exit(2);
  }
  let anyHit = false;
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (e) {
      process.stderr.write(`plan-literal-lint: cannot read ${file}: ${e.message}\n`);
      process.exit(2);
    }
    const hits = lint(text);
    if (hits.length) {
      anyHit = true;
      process.stdout.write(`${file}: ${hits.length} advisory hit(s)\n`);
      for (const h of hits) process.stdout.write(`  ${h.pattern}: ${h.match}\n`);
    } else {
      process.stdout.write(`${file}: clean\n`);
    }
  }
  process.exit(strict && anyHit ? 1 : 0);
}

// Run as CLI only, never when imported by the test suite.
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  main(process.argv.slice(2));
}
