import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { lint, LINT_PATTERNS, SHAPE_RULES, parsePlanShape } from './plan-literal-lint.mjs';

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
test('SHAPE_RULES: nine named rules; each rule text names the merged-template slot it checks', () => {
  assert.equal(SHAPE_RULES.length, 9);
  assert.deepEqual(
    SHAPE_RULES.map((r) => r.name).sort(),
    [
      'evidence-consumed-form', 'missing-assumptions-ledger', 'pin-citation',
      'requires-test-without-done-when', 'single-signal-oracle', 'untagged-context-claim',
      'untagged-end-state', 'vague-end-state', 'waive-row-form',
    ]
  );
  const slotAnchor = {
    'untagged-end-state': "## Commander's Intent",
    'vague-end-state': "## Commander's Intent",
    'requires-test-without-done-when': 'Done when:',
    'missing-assumptions-ledger': '## Assumptions ledger',
    'untagged-context-claim': '## Context',
    'pin-citation': '## Resolved design tree',
    'evidence-consumed-form': 'Evidence consumed',
    'single-signal-oracle': 'check:',
    'waive-row-form': 'WAIVE-<n>',
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

// ===========================================================================
// Third family (plan docs/plans/2026-08-24-authoring-side-verification.md, Task 1.3) —
// section-scoped pin citation, Evidence-consumed form, single-signal oracle, WAIVE row form.
// ===========================================================================

// Design-tree fixture builder: header + separator + the given rows, D1 cell grammar.
const tree = (...rows) => [
  '## Resolved design tree',
  '| # | Decision | Resolution | Source | Landing class |',
  '|---|----------|------------|--------|---------------|',
  ...rows,
];

// ---- pin-citation: the D1 class→section map, one section per class ----
test('pin-citation: every landing class maps to its section; removing any one citation yields exactly that hit', () => {
  const doc = (omit) => [
    ...tree(
      '| D1 | a | r | (user) · PIN-1 | guardrail |',
      '| D2 | b | r | (user) · PIN-2 | end-state |',
      '| D3 | c | r | (user) · PIN-3 | backstop |',
      '| D4 | d | r | (user) · PIN-4 | slice (T1.1) |',
      '| D5 | e | r | (user) · PIN-5 | context |',
      '| D6 | f | r | (user) · PIN-6, PIN-7 | PIN-6→guardrail · PIN-7→slice (T1.1) |',
    ),
    "## Commander's Intent",
    `- **Binding guardrails:** the fence holds${omit === '1' ? '' : ' (PIN-1)'}${omit === '6' ? '' : ' · one engine surface (PIN-6)'}`,
    `- **End state:**`,
    `  1. It lands${omit === '2' ? '' : ' (PIN-2)'} · check: \`bash t.sh\``,
    '## Phase 1',
    '### Task 1.1: Do a thing',
    `- Plan slice: land the duty${omit === '4' ? '' : ' (PIN-4)'}${omit === '7' ? '' : ' with its pin (PIN-7)'}`,
    '## Deferred validations (backstops)',
    `- telemetry row${omit === '3' ? '' : ' (PIN-3)'} · runner: /war-review`,
  ].join('\n');
  // Fully cited (PIN-5 is context class — the definition row suffices, D1): zero hits.
  assert.equal(countOf(lint(doc(null)), 'pin-citation'), 0);
  for (const pin of ['1', '2', '3', '4', '6', '7']) {
    const hits = lint(doc(pin)).filter((h) => h.pattern === 'pin-citation');
    assert.equal(hits.length, 1, `omitting PIN-${pin}'s citation`);
    assert.match(hits[0].match, new RegExp(`^PIN-${pin} uncited`));
  }
});

test('pin-citation: section-scoped — a citation elsewhere in the doc does not satisfy a guardrail-class pin', () => {
  const doc = [
    ...tree('| D1 | a | r | (user) · PIN-7 | guardrail |'),
    "## Commander's Intent",
    '- **Binding guardrails:** nothing pinned here',
    '## Notes',
    '- PIN-7 is mentioned here, outside its landing-class section',
  ].join('\n');
  const hits = lint(doc).filter((h) => h.pattern === 'pin-citation');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].match, 'PIN-7 uncited in Binding guardrails');
});

test('pin-citation: whole right-delimited token — PIN-1 never matches inside PIN-13 or PIN-1a (PIN-3 grammar)', () => {
  const doc = (cite) => [
    ...tree('| D1 | a | r | (user) · PIN-1 | guardrail |'),
    "## Commander's Intent",
    `- **Binding guardrails:** the fence holds (${cite})`,
  ].join('\n');
  assert.equal(countOf(lint(doc('PIN-13')), 'pin-citation'), 1, 'PIN-13 is not a PIN-1 citation');
  assert.equal(countOf(lint(doc('PIN-1a')), 'pin-citation'), 1, 'letter suffixes are illegal — not a citation');
  assert.equal(countOf(lint(doc('PIN-1')), 'pin-citation'), 0);
});

test('pin-citation: slice class requires the citation in EACH named task slice', () => {
  const doc = (t12cited) => [
    ...tree('| D1 | a | r | (user) · PIN-9 | slice (T1.1, T1.2) |'),
    '### Task 1.1: One',
    '- Plan slice: carries PIN-9',
    '### Task 1.2: Two',
    `- Plan slice: ${t12cited ? 'also carries PIN-9' : 'no pin here'}`,
  ].join('\n');
  assert.equal(countOf(lint(doc(true)), 'pin-citation'), 0);
  const hits = lint(doc(false)).filter((h) => h.pattern === 'pin-citation');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].match, "PIN-9 uncited in Task 1.2's slice");
});

test('pin-citation: class-less pin falls back to anywhere-citation; definition-without-citation reported', () => {
  const mk = (cited) => [
    ...tree('| D1 | a | r | (user) · PIN-8 | tbd |'),
    '## Notes', // closes the design-tree section — anywhere-citation looks outside the tree
    cited ? 'The mechanism rides PIN-8 in prose.' : 'No citation anywhere.',
  ].join('\n');
  assert.equal(countOf(lint(mk(true)), 'pin-citation'), 0);
  const hits = lint(mk(false)).filter((h) => h.pattern === 'pin-citation');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].match, 'PIN-8 defined but never cited');
});

test('pin-citation: silent on a doc with no design tree', () => {
  assert.equal(countOf(lint("## Commander's Intent\n- **Binding guardrails:** none"), 'pin-citation'), 0);
});

// The dogfood anchor (Task 1.3): the lint↔doctrine pair shares the plan as its common anchor —
// the tests cite the floored `PIN-<n>` literal from the plan's Binding guardrails (PIN-3), and
// the plan's own 26-pin ledger parses under the D1 cell grammar with zero rule-(a) violations
// (the plan's Notes section claims exactly that conformance).
test('pin-citation ↔ doctrine anchor: the plan\'s Binding guardrails floor the PIN-<n> grammar; its own ledger is clean', () => {
  const plan = readFileSync(join(HERE, '..', '..', '..', 'docs', 'plans', '2026-08-24-authoring-side-verification.md'), 'utf8');
  // The floored PIN-3 literal, verbatim from the plan's Binding guardrails.
  assert.ok(plan.includes('`PIN-<n>` token grammar (digits-only, right-delimited'), 'floored grammar literal present');
  assert.ok(plan.includes('**Binding guardrails:**'), 'guardrails bullet present');
  assert.equal(parsePlanShape(plan).designPins.length, 26, 'the ratified ledger parses to its 26 pins');
  assert.equal(countOf(lint(plan), 'pin-citation'), 0, 'dogfood: zero section-scope violations');
});

// ---- evidence-consumed-form: read / unread-with-reason per linked artifact row ----
test('evidence-consumed-form: flags a status-less row and a bare unread; read and unread-with-reason are clean', () => {
  const block = (...rows) => ['**Evidence consumed** (interview of 2026-08-24)', ...rows].join('\n');
  const good = block(
    '- `docs/red-team/x.md` — read',
    '- issue #1331 artifact — unread — gh unreachable at interview time',
  );
  assert.equal(countOf(lint(good), 'evidence-consumed-form'), 0);
  const noStatus = lint(block('- `docs/red-team/x.md`')).filter((h) => h.pattern === 'evidence-consumed-form');
  assert.equal(noStatus.length, 1);
  assert.match(noStatus[0].match, /lacks read \/ unread-with-reason/);
  const bareUnread = lint(block('- issue #1331 artifact — unread')).filter((h) => h.pattern === 'evidence-consumed-form');
  assert.equal(bareUnread.length, 1);
  assert.match(bareUnread[0].match, /unread without reason/);
});

test('evidence-consumed-form: a mid-prose mention or a table-cell bold label opens no block', () => {
  // Plain prose naming the block (the doctrine does this constantly) — not a block.
  const prose = ['The Evidence-consumed block inherits placement latitude.', '- some bullet after it'].join('\n');
  assert.equal(countOf(lint(prose), 'evidence-consumed-form'), 0);
  // A BOLD label mid-sentence (not line-initial) — still not a block; the marker is line-anchored.
  const boldProse = [
    '- The **Evidence consumed** block is artifact-borne.',
    '- sibling bullet with no status',
  ].join('\n');
  assert.equal(countOf(lint(boldProse), 'evidence-consumed-form'), 0);
  // The bold label inside a design-tree table row (D8's own cell) — not a block either.
  const cell = ['| D8 | Evidence recon | artifact-borne **Evidence consumed** block | (user) | guardrail |', '| D9 | x | y | (user) | slice |'].join('\n');
  assert.equal(countOf(lint(cell), 'evidence-consumed-form'), 0);
});

// ---- single-signal-oracle: bare grep -q / test -f on a check:/Done when: line (#1628) ----
test('single-signal-oracle: flags a bare grep -q or test -f oracle; a &&-paired oracle is clean', () => {
  assert.equal(countOf(lint('   check: `grep -qiE "^# Amendment" docs/adr/0044.md`'), 'single-signal-oracle'), 1);
  assert.equal(countOf(lint('- Done when: `test -f docs/specs/out.md`'), 'single-signal-oracle'), 1);
  // The decisive-token pair — NEW-present && OLD-absent — is the compliant form.
  assert.equal(countOf(lint('   check: `grep -q NEW f && ! grep -q OLD f`'), 'single-signal-oracle'), 0);
  // A suite oracle is not single-signal.
  assert.equal(countOf(lint('- Done when: `node --test skills/war-strategy/assets/plan-literal-lint.test.mjs`'), 'single-signal-oracle'), 0);
  // Same command outside a check:/Done when: line is not an oracle (scope guard).
  assert.equal(countOf(lint('run grep -q foo bar to probe by hand'), 'single-signal-oracle'), 0);
});

// ---- waive-row-form: five fields, row-initial right-delimited id (D7) ----
test('waive-row-form: a five-field row is clean; a short row is flagged with its field count', () => {
  const good = '- WAIVE-1 · beat 3 · arm: enforcement-layer · scope: this beat · reason: operator call';
  assert.equal(countOf(lint(good), 'waive-row-form'), 0);
  const hits = lint('- WAIVE-1 · beat 3 · reason: operator call').filter((h) => h.pattern === 'waive-row-form');
  assert.equal(hits.length, 1);
  assert.match(hits[0].match, /3 of 5 fields/);
});

test('waive-row-form: a mid-prose mention or the doctrine\'s `WAIVE-<n>` placeholder is not a row', () => {
  assert.equal(countOf(lint('skips are recorded as WAIVE-1 in the fix-or-waive channel'), 'waive-row-form'), 0);
  assert.equal(countOf(lint('- `WAIVE-<n>` is the skip token; five fields: id · beat · arm'), 'waive-row-form'), 0);
});

// ---- combined merged-shape fixture: one hit per shape rule; compliant merged plan clean ----
test('merged-shape combined fixture reports exactly one hit per shape rule; compliant merged plan reports zero', () => {
  const badPlan = [
    '# T — one line',
    '## Context — the gap / problem',
    'The stub is a 7-line shim routing elsewhere.',
    '',
    ...tree('| D1 | a | r | (user) · PIN-7 | guardrail |'),
    '',
    "## Commander's Intent",
    '- **Binding guardrails:** nothing pinned here',
    '- **End state:**',
    '  1. The doctrine file exists and reads properly',
    '  2. The sweep holds · check: `grep -q foo SKILL.md`',
    '',
    '## Build order',
    '## Phase 1 — Work',
    '### Task 1: Do a thing',
    '- Files: `a.mjs`',
    '- requiresTest: true',
    '- deps: []',
    '',
    '**Evidence consumed**',
    '- `docs/red-team/x.md`',
    '',
    '- WAIVE-1 · beat 3 · reason: operator call',
  ].join('\n');
  const hits = lint(badPlan);
  for (const name of SHAPE_RULES.map((r) => r.name)) assert.equal(countOf(hits, name), 1, name);
  assert.equal(hits.length, 9, 'no line-rule noise in this fixture');

  const goodPlan = [
    '# T — one line',
    '## Context — the gap / problem',
    'The stub is a 7-line shim routing elsewhere (verified: `README.md`, read 2026-08-04).',
    '',
    ...tree('| D1 | a | r | (user) · PIN-7 | guardrail |'),
    '',
    '## Assumptions ledger',
    'None.',
    '',
    "## Commander's Intent",
    '- **Binding guardrails:** exactly one engine surface moves (PIN-7)',
    '- **End state:**',
    '  1. The doctrine file exists · check: `bash t.sh`',
    '  2. The sweep holds · check: `grep -q NEW f && ! grep -q OLD f`',
    '',
    '## Build order',
    '## Phase 1 — Work',
    '### Task 1: Do a thing',
    '- Files: `a.mjs`',
    '- requiresTest: true',
    '- Done when: `node --test a.test.mjs`',
    '- deps: []',
    '',
    '**Evidence consumed**',
    '- `docs/red-team/x.md` — read',
    '- issue #1331 artifact — unread — gh unreachable',
    '',
    '- WAIVE-1 · beat 3 · arm: enforcement-layer · scope: this beat · reason: operator call',
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
