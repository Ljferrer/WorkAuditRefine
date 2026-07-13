import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { lint, LINT_PATTERNS } from './plan-literal-lint.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, 'plan-literal-lint.mjs');

const names = (hits) => hits.map((h) => h.pattern);
const countOf = (hits, name) => hits.filter((h) => h.pattern === name).length;

// Every declared pattern has a name — no silent gap (mirrors war-memory's structural check).
test('LINT_PATTERNS: five named patterns, no gaps', () => {
  assert.equal(LINT_PATTERNS.length, 5);
  assert.deepEqual(
    LINT_PATTERNS.map((p) => p.name).sort(),
    ['bare-files-path', 'hardcoded-version', 'line-range', 'literal-suite-list', 'suite-count']
  );
});

// ---- line-range: positive + negative (delete-the-pattern-and-it-passes) ----
test('line-range: flags a :N-M locator, clean on a construct locator', () => {
  const bad = '- Files: `skills/war/assets/workflow-template.js:120-140`';
  assert.equal(countOf(lint(bad), 'line-range'), 1);
  // Compliant rewrite names the enclosing symbol — no range literal survives.
  const good = '- Files: `skills/war/assets/workflow-template.js` (the auditPrompt function)';
  assert.equal(countOf(lint(good), 'line-range'), 0);
});

test('line-range: also flags the "lines N-M" prose form', () => {
  assert.equal(countOf(lint('the guard at lines 42-58 of the hook'), 'line-range'), 1);
});

// ---- literal-suite-list: positive + negative ----
test('literal-suite-list: flags a concrete .test.sh in a gate directive; glob token is clean', () => {
  const bad = '- Gate: bash foo.test.sh && bar.test.sh';
  assert.ok(countOf(lint(bad), 'literal-suite-list') >= 1);
  // Compliant rewrite references resolveGate by name; the *.test.sh glob-as-concept is not a file.
  const good = '- Gate: resolveGate in war-config.mjs (never enumerate *.test.sh files by hand)';
  assert.equal(countOf(lint(good), 'literal-suite-list'), 0);
});

test('literal-suite-list: a .test.sh outside a gate/run directive is not flagged', () => {
  // Context guard: only gate/run directives enumerate suites.
  assert.equal(countOf(lint('- Files: skills/war-strategy/war-strategy-structure.test.sh'), 'literal-suite-list'), 0);
});

// ---- suite-count: positive + negative ----
test('suite-count: flags "ALL FIVE suites", clean on a self-discovery reference', () => {
  assert.equal(countOf(lint('run ALL FIVE suites green before land'), 'suite-count'), 1);
  const good = 'run the full `node --test` suite (self-discovered) green before land';
  assert.equal(countOf(lint(good), 'suite-count'), 0);
});

// ---- hardcoded-version: positive + negative, release-scoped ----
test('hardcoded-version: flags v0.14.9 inside a release task; clean outside one', () => {
  const bad = [
    '**Task 2.1 — Release version bump**',
    '- Plan slice: bump the four slots to v0.14.9',
  ].join('\n');
  assert.equal(countOf(lint(bad), 'hardcoded-version'), 1);
  // Same literal, but not in a release task → not flagged (scope guard).
  const outside = [
    '**Task 1.1 — Plan-template conventions**',
    '- Plan slice: earlier baseline was 0.14.14 at authoring',
  ].join('\n');
  assert.equal(countOf(lint(outside), 'hardcoded-version'), 0);
});

test('hardcoded-version: compliant release task uses next-free-patch prose, zero hits', () => {
  const good = [
    '**Task 2.1 — Release version bump**',
    '- Plan slice: bump all four slots to the next free patch above the live integration base',
  ].join('\n');
  assert.equal(countOf(lint(good), 'hardcoded-version'), 0);
});

// ---- bare-files-path: flags an un-backticked path on a `- Files:` line ----
test('bare-files-path: flags a bare path on a `- Files:` line and on the indented template form', () => {
  // Un-backticked paths on a `- Files:` line — the antipattern the ledger contract forbids.
  const bare = '- Files: skills/war-strategy/SKILL.md, skills/war-strategy/assets/plan-literal-lint.mjs';
  assert.ok(countOf(lint(bare), 'bare-files-path') >= 1);
  // The indented `  - Files:` template form (leading spaces) is anchored by requireOnLine too.
  const indented = '  - Files: skills/war-strategy/war-strategy-structure.test.sh';
  assert.ok(countOf(lint(indented), 'bare-files-path') >= 1);
});

test('bare-files-path: clean when every path is backticked, mentioned mid-prose, or in one comma-bearing span', () => {
  // All paths backticked & comma-separated — the compliant template form: stripBackticks empties
  // the line of path tokens, so nothing survives to flag.
  const backticked = '- Files: `skills/war-strategy/SKILL.md`, `skills/war-strategy/assets/plan-literal-lint.mjs`';
  assert.equal(countOf(lint(backticked), 'bare-files-path'), 0);
  // `Files:` mentioned mid-prose — not a `- Files:` line, so requireOnLine skips it even though a
  // path-shaped token is present (delete-the-guard: without requireOnLine this would flag).
  const prose = 'The Files: contract lives in §2; see skills/war-strategy/SKILL.md for the template.';
  assert.equal(countOf(lint(prose), 'bare-files-path'), 0);
  // One backtick span holding commas and multiple paths — stripBackticks removes the whole span,
  // so no path-shaped token survives outside backticks.
  const oneSpan = '- Files: `skills/war/a.mjs, skills/war/b.mjs`';
  assert.equal(countOf(lint(oneSpan), 'bare-files-path'), 0);
});

// ---- combined fixture: one hit per pattern (spec criterion 2) ----
test('combined fixture reports exactly one hit per pattern; compliant rewrite reports zero', () => {
  const badPlan = [
    '### Phase 1 — Work',
    '**Task 1.1 — Do a thing**',
    '- Files: `skills/war/assets/workflow-template.js:120-140`',
    '- Gate: bash war-config.test.sh',
    '- Plan slice: keep ALL FIVE suites green.',
    '',
    '**Task 2.1 — Release bump**',
    '- Plan slice: bump the slots to v0.14.9',
  ].join('\n');
  const hits = lint(badPlan);
  assert.equal(countOf(hits, 'line-range'), 1, 'line-range');
  assert.equal(countOf(hits, 'literal-suite-list'), 1, 'literal-suite-list');
  assert.equal(countOf(hits, 'suite-count'), 1, 'suite-count');
  assert.equal(countOf(hits, 'hardcoded-version'), 1, 'hardcoded-version');
  assert.equal(hits.length, 4);

  const goodPlan = [
    '### Phase 1 — Work',
    '**Task 1.1 — Do a thing**',
    '- Files: `skills/war/assets/workflow-template.js` (the auditPrompt function)',
    '- Gate: resolveGate in war-config.mjs',
    '- Plan slice: keep the full `node --test` suite green.',
    '',
    '**Task 2.1 — Release bump**',
    '- Plan slice: bump the slots to the next free patch above the live base',
  ].join('\n');
  assert.deepEqual(lint(goodPlan), []);
});

// ---- CLI contract: report-and-exit-0 default, --strict non-zero on hits ----
function writePlan(text) {
  const dir = mkdtempSync(join(tmpdir(), 'plan-lint-'));
  const f = join(dir, 'plan.md');
  writeFileSync(f, text);
  return f;
}

test('CLI: default exit 0 even with hits; --strict exits 1 on hits; --strict exits 0 when clean', () => {
  const bad = writePlan('- Files: `foo.js:120-140`');
  const clean = writePlan('- Files: `foo.js` (the bar function)');

  const dflt = spawnSync('node', [CLI, bad], { encoding: 'utf8' });
  assert.equal(dflt.status, 0, 'default is report-and-exit-0');
  assert.match(dflt.stdout, /line-range/);

  const strictBad = spawnSync('node', [CLI, bad, '--strict'], { encoding: 'utf8' });
  assert.equal(strictBad.status, 1, '--strict non-zero on any hit');

  const strictClean = spawnSync('node', [CLI, clean, '--strict'], { encoding: 'utf8' });
  assert.equal(strictClean.status, 0, '--strict exit 0 when clean');
  assert.match(strictClean.stdout, /clean/);
});
