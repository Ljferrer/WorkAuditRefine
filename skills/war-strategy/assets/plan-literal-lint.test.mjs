import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { lint, LINT_PATTERNS, SHAPE_RULES } from './plan-literal-lint.mjs';

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

// ===========================================================================
// Merged-template shape rules (spec §4f) — one fixture case per rule.
// ===========================================================================

// Every declared shape rule has a name AND slot text naming the merged-template slot it checks.
test('SHAPE_RULES: five named rules; each rule text names the merged-template slot it checks', () => {
  assert.equal(SHAPE_RULES.length, 5);
  assert.deepEqual(
    SHAPE_RULES.map((r) => r.name).sort(),
    ['missing-assumptions-ledger', 'requires-test-without-done-when', 'untagged-context-claim', 'untagged-end-state', 'vague-end-state']
  );
  const slotAnchor = {
    'untagged-end-state': "## Commander's Intent",
    'vague-end-state': "## Commander's Intent",
    'requires-test-without-done-when': 'Done when:',
    'missing-assumptions-ledger': '## Assumptions ledger',
    'untagged-context-claim': '## Context',
  };
  for (const r of SHAPE_RULES) {
    assert.ok(r.slot.includes(slotAnchor[r.name]), `${r.name} slot text must name its merged-template slot`);
  }
});

// ---- untagged-end-state: positive + all four D5 tag arms clean ----
test('untagged-end-state: flags an untagged numbered End state; every D5 tag arm is clean', () => {
  const mk = (bullet) => ["## Commander's Intent", '- **End state:**', bullet].join('\n');
  const hits = lint(mk('  1. The doctrine file exists and is discoverable')).filter((h) => h.pattern === 'untagged-end-state');
  assert.equal(hits.length, 1);
  // bulletHead is the reportable match the CLI prints — assert it names the bullet, not ''.
  assert.match(hits[0].match, /The doctrine file exists/);
  for (const tagged of [
    '  1. The doctrine file exists · check: `bash t.sh`',
    '  2. The suites stay green · gate: the full self-discovered suite',
    '  3. The probe passes · HARD at audit_sha — observable: extraction greps hit; judge: gate-audit seat',
    '  4. The sweep holds · backstop: deferred-validations row 2',
  ]) {
    assert.equal(countOf(lint(mk(tagged)), 'untagged-end-state'), 0, tagged);
  }
});

test('untagged-end-state: tag on a continuation line clears the bullet; AI-Commander arm recognized (ADR 0014)', () => {
  // The tag legitimately sits on the bullet's continuation line — a per-line rule would false-positive.
  const cont = [
    "## AI-Commander's Intent",
    '- **End state:**',
    '  1. Bare invoke proceeds into the interview ·',
    '     check: `bash skills/war-strategy/war-strategy-structure.test.sh`',
  ].join('\n');
  assert.equal(countOf(lint(cont), 'untagged-end-state'), 0);
  // The AFK intent heading scopes End states too — an untagged bullet under it is flagged.
  const untaggedAfk = ["## AI-Commander's Intent", '  1. It lands'].join('\n');
  assert.equal(countOf(lint(untaggedAfk), 'untagged-end-state'), 1);
});

test('untagged-end-state: a numbered bullet outside the intent section is not scanned (scope guard)', () => {
  assert.equal(countOf(lint(['## Build order', '1. land the doctrine file'].join('\n')), 'untagged-end-state'), 0);
});

// ---- requires-test-without-done-when: positive + negative ----
test('requires-test-without-done-when: flags a requiresTest task with no Done when; clean otherwise', () => {
  const block = (fields) => ['### Task 1: Do a thing', '- Files: `a.mjs`', ...fields].join('\n');
  const hits = lint(block(['- requiresTest: true', '- deps: []'])).filter((h) => h.pattern === 'requires-test-without-done-when');
  assert.equal(hits.length, 1);
  assert.match(hits[0].match, /Task 1/); // the hit names the offending task heading
  assert.equal(
    countOf(lint(block(['- requiresTest: true', '- Done when: `node --test a.test.mjs`'])), 'requires-test-without-done-when'),
    0
  );
  assert.equal(countOf(lint(block(['- requiresTest: false', '- deps: []'])), 'requires-test-without-done-when'), 0);
});

test("requires-test-without-done-when: block ends at the next heading — a later sibling's Done when does not clear an uncovered task", () => {
  // Uncovered task first, covered sibling after: without the MD_HEADING bound in parsePlanShape,
  // Task 1's body would run to EOF and swallow Task 2's `Done when:`, yielding 0 hits (RED) —
  // so the boundary is genuinely discriminated.
  const two = [
    '### Task 1: Uncovered',
    '- requiresTest: true',
    '### Task 2: Covered',
    '- requiresTest: true',
    '- Done when: `node --test a.test.mjs`',
  ].join('\n');
  const hits = lint(two).filter((h) => h.pattern === 'requires-test-without-done-when');
  assert.equal(hits.length, 1);
  assert.match(hits[0].match, /Task 1/);
});

// ---- missing-assumptions-ledger: positive + negative, plan-shape gated ----
test('missing-assumptions-ledger: fires on a plan-shaped doc without the heading; silent otherwise', () => {
  const planShaped = ["## Commander's Intent", '  1. x · check: `t`', '## Build order'].join('\n');
  assert.equal(countOf(lint(planShaped), 'missing-assumptions-ledger'), 1);
  const withLedger = ['## Assumptions ledger', 'None.', ...planShaped.split('\n')].join('\n');
  assert.equal(countOf(lint(withLedger), 'missing-assumptions-ledger'), 0);
  // A fragment that never claims to be a merged plan is not held to the template's sections.
  assert.equal(countOf(lint('- Files: `a.mjs`'), 'missing-assumptions-ledger'), 0);
});

// ---- untagged-context-claim: positive + tagged/out-of-section negatives ----
test('untagged-context-claim: flags an untagged measurement in ## Context; D4-tagged and out-of-section claims are clean', () => {
  const mk = (line) => ['## Context — the gap / problem', line].join('\n');
  const hits = lint(mk('- A 57-finding classification measured ~40% false repo facts.'));
  assert.equal(countOf(hits, 'untagged-context-claim'), 1);
  assert.equal(
    countOf(lint(mk('- A 57-finding classification measured ~40% false repo facts (verified: `docs/red-team/`, 2026-08-04).')), 'untagged-context-claim'),
    0
  );
  assert.equal(
    countOf(lint(mk('- Pairing is 1:1 in 99 of 116 cases [assumed: slug join — if wrong: re-measure].')), 'untagged-context-claim'),
    0
  );
  // The other two CLAIM_TAG arms — `(user)` and `AI-declared` — are individually load-bearing too.
  assert.equal(countOf(lint(mk('- Operators hit this in 9 of 10 runs (user).')), 'untagged-context-claim'), 0);
  assert.equal(countOf(lint(mk('- Pairing is 1:1 in 100 of 116 slugs — AI-declared.')), 'untagged-context-claim'), 0);
  // The same sentence outside ## Context is not scanned (scope guard).
  assert.equal(
    countOf(lint(['## Non-goals / deferred', '- A 57-finding classification measured ~40% false repo facts.'].join('\n')), 'untagged-context-claim'),
    0
  );
});

test('untagged-context-claim: the tag may sit on a continuation line of the same bullet', () => {
  const cont = [
    '## Context — the gap / problem',
    '- Across the newest reports, ~40% were false repo facts',
    '  (verified: 18-agent fan-out over `docs/red-team/`, 2026-08-04).',
  ].join('\n');
  assert.equal(countOf(lint(cont), 'untagged-context-claim'), 0);
});

// ---- vague-end-state: positive + out-of-scope negative ----
test('vague-end-state: flags properly/correctly/coherent inside an End state; clean outside intent', () => {
  const bad = ["## Commander's Intent", '  1. The pipeline works correctly, renders properly, and stays coherent · check: `x`'].join('\n');
  const vague = lint(bad).filter((h) => h.pattern === 'vague-end-state');
  // matchAll order — each of the three §4f vocabulary arms is individually load-bearing.
  assert.deepEqual(vague.map((h) => h.match), ['correctly', 'properly', 'coherent']);
  // Same vocabulary outside the intent section — not an End state, not flagged.
  assert.equal(countOf(lint('The hook correctly denies writes.'), 'vague-end-state'), 0);
  const observable = ["## Commander's Intent", '  1. `grep -c foo SKILL.md` = 0 · check: `bash t.sh`'].join('\n');
  assert.equal(countOf(lint(observable), 'vague-end-state'), 0);
});

// ---- combined merged-shape fixture: one hit per shape rule; compliant merged plan clean ----
test('merged-shape combined fixture reports exactly one hit per shape rule; compliant merged plan reports zero', () => {
  const badPlan = [
    '# T — one line',
    '## Context — the gap / problem',
    'The stub is a 7-line shim routing elsewhere.',
    '',
    "## Commander's Intent",
    '- **End state:**',
    '  1. The doctrine file exists and reads properly',
    '',
    '## Build order',
    '## Phase 1 — Work',
    '### Task 1: Do a thing',
    '- Files: `a.mjs`',
    '- requiresTest: true',
    '- deps: []',
  ].join('\n');
  const hits = lint(badPlan);
  for (const name of SHAPE_RULES.map((r) => r.name)) assert.equal(countOf(hits, name), 1, name);
  assert.equal(hits.length, 5, 'no line-rule noise in this fixture');

  const goodPlan = [
    '# T — one line',
    '## Context — the gap / problem',
    'The stub is a 7-line shim routing elsewhere (verified: `README.md`, read 2026-08-04).',
    '',
    '## Assumptions ledger',
    'None.',
    '',
    "## Commander's Intent",
    '- **End state:**',
    '  1. The doctrine file exists · check: `bash t.sh`',
    '',
    '## Build order',
    '## Phase 1 — Work',
    '### Task 1: Do a thing',
    '- Files: `a.mjs`',
    '- requiresTest: true',
    '- Done when: `node --test a.test.mjs`',
    '- deps: []',
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

test('CLI: shape-rule hits print the merged-template slot and still exit 0 without --strict', () => {
  const f = writePlan(['## Build order', '### Task 1: T', '- requiresTest: true'].join('\n'));
  const dflt = spawnSync('node', [CLI, f], { encoding: 'utf8' });
  assert.equal(dflt.status, 0, 'shape rules are advisory: exit 0 without --strict');
  assert.match(dflt.stdout, /requires-test-without-done-when/);
  assert.match(dflt.stdout, /Done when:/, 'printed rule text names the merged-template slot');
  const strict = spawnSync('node', [CLI, f, '--strict'], { encoding: 'utf8' });
  assert.equal(strict.status, 1, '--strict non-zero on shape hits');
});
