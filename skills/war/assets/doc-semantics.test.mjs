// doc-semantics.test.mjs — the standing both-ways guard for the `run.maxParallel`
// semantics flip (plan 2026-08-30-engine-concurrency-and-pin-transfer, task 1.2, #1897), and the
// #2485 ES18 doctrine grep guard for the retired fast-forward task-merge premise (its own section at
// the end of this file).
//
// The knob stopped being a per-fan-out-site group slicer and became one global counting
// semaphore at the leaf dispatch seam. A doc sweep that only lands the NEW wording is half a
// sweep: the recorded trap is that the OLD-absent half, when it is certified by an ad hoc
// uncommitted grep, is exactly the half that silently returns a false pass
// ([[old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently]]). So both halves live
// here, committed, per path:
//
//   * OLD-absent — every stale phrasing on the rewritten line, as a LIST per path, never one
//     token standing in for the rest.
//   * NEW-present — the global-ceiling wording, plus the retired lesson's `description` stamp.
//
// Matching is WRAP-AWARE: a clause wrapped at ~100 columns never matches a contiguous key, so
// each file is normalized before matching — comment leaders stripped FIRST, then every
// whitespace run collapsed to one space
// ([[repo-doc-sweep-needs-leader-strip-before-whitespace-normalize-before-grep]]). Normalizing
// first would glue `#`/`//`/`>` leaders into the sentence.
//
// SCOPE (the #1897 table only): this task's doc surfaces only. `skills/war/assets/workflow-template.js` is deliberately
// NOT scanned — its comment rewording rides task 1.1's census tests, and 1.1's edits are absent
// from this task's frozen phase base.
//
// The NEW-present tokens are CONSTRUCT-FREE by ruling (D5): they state the contract (one global
// counting semaphore caps agent dispatches in flight) and never name an engine-internal helper.
// Pinning a helper name here would re-import the exact coupling this flip removes.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// --- Normalization ------------------------------------------------------------------
// Leaders stripped BEFORE the whitespace collapse. Markdown bold `*` is NOT a leader —
// stripping it would mangle the `**Dispatch semaphore**` marker a NEW token matches on.
function normalize(src) {
  return src
    .split('\n')
    .map((line) => line.replace(/^\s*(?:\/\/+|#+|>+)\s?/, ''))
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- Subjects -------------------------------------------------------------------------
// One row per swept surface: the OLD tokens retired from THAT path, and the NEW tokens that
// must be present on it. Tokens are matched case-insensitively against the normalized text.

const SWEEP_SURFACES = {
  'CONTEXT.md': {
    old: ['slices each fan-out', 'batched()'],
    new: [
      '**Dispatch semaphore**',
      'global counting semaphore',
      'in flight across the whole run',
    ],
  },
  'skills/war-room/SKILL.md': {
    old: ['per fan-out site', 'in flight per fan-out', 'batching helper'],
    new: [
      'per-run agent ceiling',
      'global counting semaphore',
      'in flight across the whole run',
    ],
  },
  'skills/war/references/schemas.md': {
    old: ['batching helper'],
    new: [
      'per-run agent ceiling',
      'global counting semaphore',
      'in flight across the whole run',
    ],
  },
  'skills/war/references/design.md': {
    old: ['slices each fan-out', 'batching helper'],
    new: [
      'global counting semaphore',
      'in flight across the whole run',
      'nested fan-outs included',
    ],
  },
};

// The retired lesson is OLD-absent-EXEMPT by ruling (D5) — its body records the superseded
// per-site finding on purpose, and deleting that record would destroy the lesson. It carries
// the NEW half only: a dated RESOLVED stamp on the frontmatter `description` (description bytes
// drive the MEMORY.md projection budget, so the stamp is terse) plus a body note naming the
// global semaphore.
const LESSON_SLUG = 'per-site-fanout-throttle-composes-multiplicatively-across-nested-call-sites';
const LESSON_STAMP = 'RESOLVED (2026-08-30-engine-concurrency-and-pin-transfer, #1897):';

// Archiving a lesson is a MOVE, never a deletion, so the hot path and `archive/` are both
// accepted — this guard must survive the move.
function resolveLessonPath() {
  const candidates = [
    join(repoRoot, 'docs', 'learnings', `${LESSON_SLUG}.md`),
    join(repoRoot, 'docs', 'learnings', 'archive', `${LESSON_SLUG}.md`),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

// --- Tests -------------------------------------------------------------------------------

test('sweep census — every enumerated surface exists and carries a non-empty token list', () => {
  const paths = Object.keys(SWEEP_SURFACES);
  assert.equal(
    paths.length,
    4,
    'the plan enumerates exactly four sweep surfaces (D5) — adding or dropping one is a '
      + 'deliberate doctrine change, never a silent edit to this table',
  );
  for (const [relPath, tokens] of Object.entries(SWEEP_SURFACES)) {
    assert.ok(
      existsSync(join(repoRoot, relPath)),
      `${relPath}: swept surface is missing — the guard cannot fail open on an absent file`,
    );
    assert.ok(
      tokens.old.length > 0,
      `${relPath}: the OLD token list is empty — an empty list passes vacuously, which is the `
        + 'exact false green this guard exists to foreclose',
    );
    assert.ok(
      tokens.new.length > 0,
      `${relPath}: the NEW token list is empty — OLD-absent alone would pass on a deleted line`,
    );
  }
  // workflow-template.js rides task 1.1's census tests (frozen phase base). Keeping it out of
  // this table is the ruling, not an oversight — assert the exclusion so a later widening is
  // deliberate.
  assert.ok(
    !paths.some((p) => p.endsWith('workflow-template.js')),
    'workflow-template.js must NOT be scanned here — its rewording is task 1.1\'s census scope',
  );
});

for (const [relPath, tokens] of Object.entries(SWEEP_SURFACES)) {
  test(`OLD-absent — retired per-site wording is gone from ${relPath}`, () => {
    const raw = readFileSync(join(repoRoot, relPath), 'utf8');
    const text = normalize(raw);
    assert.ok(
      text.length > 0,
      `${relPath}: normalized text is empty — the measurement is vacuous, fail closed`,
    );
    for (const token of tokens.old) {
      assert.ok(
        !text.toLowerCase().includes(token.toLowerCase()),
        `${relPath}: retired token ${JSON.stringify(token)} is still present. `
          + '`run.maxParallel` is a global agent ceiling now, not a per-fan-out-site group '
          + 'slicer (#1897) — rewrite the line, never delete this row',
      );
    }
  });

  test(`NEW-present — global-ceiling wording landed on ${relPath}`, () => {
    const raw = readFileSync(join(repoRoot, relPath), 'utf8');
    const text = normalize(raw);
    assert.ok(
      text.length > 0,
      `${relPath}: normalized text is empty — the measurement is vacuous, fail closed`,
    );
    for (const token of tokens.new) {
      assert.ok(
        text.toLowerCase().includes(token.toLowerCase()),
        `${relPath}: expected the global-ceiling wording ${JSON.stringify(token)} and it is `
          + 'absent — OLD-absent alone passes on a line that was simply deleted (#1897)',
      );
    }
  });
}

test('lesson stamp — the retired per-site lesson carries its dated RESOLVED note', () => {
  const lessonPath = resolveLessonPath();
  assert.ok(
    lessonPath,
    `lesson ${LESSON_SLUG}.md is at neither docs/learnings/ nor docs/learnings/archive/ — `
      + 'archiving is a move plus a note, never a deletion',
  );
  const raw = readFileSync(lessonPath, 'utf8');
  assert.ok(raw.trim().length > 0, 'lesson file is empty — the measurement is vacuous');
  const text = normalize(raw);

  // The stamp is asserted on the frontmatter `description` specifically, not anywhere in the
  // file: the description is what the MEMORY.md projection renders, so a body-only stamp leaves
  // the index still advertising the superseded rule.
  const descMatch = raw.match(/^description:\s*(.+)$/m);
  assert.ok(descMatch, 'lesson frontmatter has no `description:` line to stamp');
  assert.ok(
    descMatch[1].includes(LESSON_STAMP),
    `the lesson's frontmatter description must open with ${JSON.stringify(LESSON_STAMP)} — the `
      + `projection renders the description, so an unstamped one still advertises the retired `
      + `per-site rule. Got: ${descMatch[1]}`,
  );
  // And the body must point at what replaced it.
  assert.ok(
    text.toLowerCase().includes('global counting semaphore'),
    "the lesson body must name the global counting semaphore that superseded the per-site "
      + 'throttle — a stamp with no forward pointer strands the reader',
  );
});

// =========================================================================================
// #2485 ES18 (plan 2026-10-28-blocked-ace-and-merge-provenance, Task 5.4, D24, PIN-24) — the
// doctrine grep guard for the retired FAST-FORWARD task-merge premise.
//
// Each task now lands as one `--no-ff` merge commit carrying `WAR-Task: <task branch>` (ADR 0054),
// and a recovery proves a task from that merge commit, not from a worker-written trailer. Every
// doctrine surface that stated the old premise is one row below and ONE flat top-level test named
// `2485/ES18 <surface>` (never a parent test holding sub-tests, so `--test-name-pattern
// '^2485/ES18 '` matches each row and a skipped surface fails on its own line). Each row holds
// both halves on that surface's own region:
//
//   * OLD-absent — the premise text that surface used to state. This is the half that catches a
//     stale surface. A surface that only ever ADDED text (an amendment line, a new file, a dated
//     lesson note) carries the premise statements themselves (PREMISE_TOKENS) as its OLD half.
//   * NEW-present — the merge-commit text. For the merge FORM the token is the engine's exact
//     substring, read from the engine's merge-step prompt literal at test time (ENGINE_MERGE_FORM),
//     never a paraphrase.
//
// Unlike the #1897 table above, this guard DOES scan `workflow-template.js`: its prompt sentences
// and comments are named surfaces here, extracted by construct anchor (never line number).
// The same normalize() applies (comment leaders stripped, then whitespace collapsed), and matching
// is case-insensitive.

const ENGINE_PATH = 'skills/war/assets/workflow-template.js';
const REFINER_CARD = 'agents/war-refiner.md';

const rawCache = new Map();
function readRel(relPath) {
  if (!rawCache.has(relPath)) {
    const abs = join(repoRoot, relPath);
    assert.ok(existsSync(abs), `${relPath}: guarded surface is missing — the guard never fails open on an absent file`);
    rawCache.set(relPath, readFileSync(abs, 'utf8'));
  }
  return rawCache.get(relPath);
}

// The region from `start` (inclusive) to the first `end` after it (exclusive). A missing anchor
// throws: the region is the measurement, and an unlocatable one must fail closed.
function between(raw, start, end) {
  const i = raw.indexOf(start);
  assert.ok(i >= 0, `start anchor ${JSON.stringify(start)} not found — the region cannot be located`);
  const j = raw.indexOf(end, i + start.length);
  assert.ok(j > i, `end anchor ${JSON.stringify(end)} not found after ${JSON.stringify(start)}`);
  return raw.slice(i, j);
}

// A Markdown section: from its exact heading line to the next heading of the same or a higher level.
function section(raw, heading) {
  const level = heading.match(/^#+/)[0].length;
  const lines = raw.split('\n');
  const i = lines.findIndex((l) => l.trim() === heading);
  assert.ok(i >= 0, `heading ${JSON.stringify(heading)} not found`);
  let j = i + 1;
  while (j < lines.length) {
    const m = lines[j].match(/^(#+)\s/);
    if (m && m[1].length <= level) break;
    j++;
  }
  return lines.slice(i, j).join('\n');
}

// One Markdown line that starts with `prefix` (a bullet or a numbered step is one line here).
function lineStarting(raw, prefix) {
  const hit = raw.split('\n').find((l) => l.trimStart().startsWith(prefix));
  assert.ok(hit, `no line starts with ${JSON.stringify(prefix)}`);
  return hit;
}

const whole = (raw) => raw;

// The merge form, read from the engine's merge-step prompt literal. Every task merge site spells
// the same two-step command, so the regex must match at least the four step copies (ES6).
const MERGE_STEP_RE = /run exactly \\`git -c core\.hooksPath=\/dev\/null (merge --no-ff --no-commit) \$\{r\.task\.branch\} && git -c core\.hooksPath=\/dev\/null commit --no-verify -m "[^"]*" (--trailer "WAR-Task: )\$\{r\.task\.branch\}"/g;
function engineMergeForm() {
  const hits = [...readRel(ENGINE_PATH).matchAll(MERGE_STEP_RE)];
  assert.ok(hits.length >= 4, `the engine merge-step literal matched ${hits.length} times; expected the four task merge sites`);
  const forms = new Set(hits.map((m) => `${m[1]}\u0000${m[2]}`));
  assert.equal(forms.size, 1, 'the task merge sites spell different merge forms');
  return [hits[0][1], hits[0][2]];
}
// Read once at load, but never throw there: an unreadable form fails its own named test below, and
// every surface that needs it gets a sentinel no file contains, so each still fails on its own line.
const UNREADABLE_FORM = '\u0000engine merge form unreadable\u0000';
let ENGINE_MERGE_FORM;
try { ENGINE_MERGE_FORM = engineMergeForm(); } catch { ENGINE_MERGE_FORM = [UNREADABLE_FORM, UNREADABLE_FORM]; }

test('2485/ES18 engine merge form literal — the four task merge sites spell one two-step form', () => {
  assert.deepEqual(engineMergeForm(), ['merge --no-ff --no-commit', '--trailer "WAR-Task: ']);
});

// The premise statements themselves. An add-only surface (no prior text to retire) carries these
// as its OLD half: none of them may ever state the fast-forward task-merge premise.
const PREMISE_TOKENS = [
  'per-task merges are fast-forward',
  'there is no merge commit to anchor on',
  'under fast-forward topology',
];

const ES18_SURFACES = [
  // ---- agents/war-refiner.md ----
  { name: '2485/ES18 refiner card pin-status paragraph', file: REFINER_CARD,
    extract: (r) => lineStarting(r, '1. **Pin-status**'),
    old: ['Per-task merges are **fast-forward**', 'there is no merge commit to anchor on', "previous merged task's `gateHeadSha`"],
    new: ["the task merge commit's second parent", '`<merge>^1..<merge>^2`'] },
  { name: '2485/ES18 refiner card step 9', file: REFINER_CARD,
    extract: (r) => lineStarting(r, '9. In `_refinery`'),
    old: ['`git -C <_refinery> merge <task-branch>` (no force)', 'with the new integration SHA'],
    new: [...ENGINE_MERGE_FORM, 'never a fast-forward', '`integration_sha` the merge commit and `gate_sha` the gated task tip'] },
  { name: '2485/ES18 refiner card absorb-charge sentence', file: REFINER_CARD,
    extract: (r) => between(r, 'Absorb-charge read (D5', 'A **sanctioned recovery relaunch**'),
    old: ["valueonly)' <integrationBranch>..<branch>`"],
    new: ['over `M^1..M^2` of its first-parent `WAR-Task` merge commit `M` once merged', "another task's id never"] },

  // ---- the engine (skills/war/assets/workflow-template.js) ----
  { name: '2485/ES18 engine --mapped prompt', file: ENGINE_PATH,
    extract: (r) => between(r, '1. PIN STATUS — run: gate-pin-status.sh', '2. GUARD SPECIFICITY'),
    old: ['under fast-forward topology'],
    new: ["<preMergeTip> is the previous task's merge commit, the tip this task rebased onto"] },
  { name: '2485/ES18 engine --mapped sentence', file: ENGINE_PATH,
    extract: (r) => between(r, "The --mapped set is THIS task's OWN changed files", 'NOT the global gate-discovery set'),
    old: ['exactly what the task brought in under fast-forward topology'],
    new: ["<gateHeadSha> the gated task tip, the merge commit's second parent"] },
  { name: '2485/ES18 engine deriveSkipClause', file: ENGINE_PATH,
    extract: (r) => between(r, 'const deriveSkipClause = recovery', "\n    : ''"),
    old: ['a nonempty task-owned commit carrying the exact WAR-Task branch trailer', 'surviving net task-owned work without mixed later history'],
    new: ['a first-parent merge commit in the phase whose parsed WAR-Task trailer equals the task branch', 'whose second parent equals the task tip'] },
  { name: '2485/ES18 engine submodMergeNote', file: ENGINE_PATH,
    extract: (r) => between(r, 'const submodMergeNote =', "\n        : ''"),
    old: ['merge fast-forwards the submodule'],
    new: ['the _refinery merge makes the same --no-ff merge commit, with the exact WAR-Task trailer'] },
  { name: '2485/ES18 engine reconcileMerge task-arm sentence', file: ENGINE_PATH,
    extract: (r) => between(r, 'const reconcileMerge = async', 'ORIGINAL OPERATION'),
    old: ["accept ONLY this source branch's fast-forward from base_sha", "source branch's fast-forward"],
    new: ['one --no-ff merge commit of this source branch whose parents are exactly [snapshot base_sha, current source tip]', 'never make a second merge'] },
  { name: '2485/ES18 engine reconcileMerge integration_sha sentence', file: ENGINE_PATH,
    extract: (r) => between(r, 'const reconcileMerge = async', 'ORIGINAL OPERATION'),
    old: ['integration_sha the current source/target/remote SHA'],
    new: ['integration_sha equal to both target refs — the --no-ff merge commit on a task merge', 'gate_sha the gated source tip on a task merge'] },
  { name: '2485/ES18 engine integration_sha populate sentence', file: ENGINE_PATH,
    extract: whole,
    old: ['populate integration_sha with the rebased integration tip the gate ran against', 'rebased integration tip the gate ran against'],
    new: ["Populate integration_sha with the new merge commit and gate_sha with the rebased task tip the gate ran at (the merge commit's second parent)"] },
  { name: '2485/ES18 engine pre-merge-base comment', file: ENGINE_PATH,
    extract: (r) => between(r, "// Per-task pre-merge base for the task's own changed-file set", 'const phaseBaseCmd'),
    old: ['FAST-FORWARD (linear single-parent chain, NO per-task merge commit)'],
    new: ['--no-ff merge commit M (#2485 D8): M^2 is the gated rebased task tip', 'M^1..M^2, the task\'s own change set'] },
  { name: '2485/ES18 engine sourceGitMatches comment', file: ENGINE_PATH,
    extract: (r) => between(r, '// Shared by normal confirmation and uncertain-response recovery', 'const sourceGitMatches'),
    old: ['weaker definition of the task fast-forward'],
    new: ['definition of the task merge commit, the polish or terminal fast-forward'] },
  { name: '2485/ES18 engine preMerged comment (provision-barrier return)', file: ENGINE_PATH,
    extract: (r) => between(r, "// The provision-BARRIER return (dispatchKind 'provision-barrier')", 'staleRemote —'),
    old: ['carries a nonempty commit with its exact WAR-Task branch trailer'],
    new: ['was merged by a first-parent merge commit whose WAR-Task trailer names it', 'a zero-commit ancestor has no merge commit'] },
  { name: '2485/ES18 engine preMerged comment (recovery arg)', file: ENGINE_PATH,
    extract: (r) => between(r, 'derive-and-skip step (deriveSkipClause', '(2) the'),
    old: ['carries a nonempty commit with its own WAR-Task trailer'],
    new: ['was merged by a first-parent merge commit whose WAR-Task trailer names it and whose second parent is its tip'] },
  { name: '2485/ES18 engine preMerged comment (barrier-derived skip)', file: ENGINE_PATH,
    extract: (r) => between(r, '// ---- RECOVERY: barrier-derived merged-set skip', 'NO worker dispatch'),
    old: ['carries a nonempty commit with its own WAR-Task trailer and surviving owned work'],
    new: ['was merged by a first-parent merge commit whose WAR-Task trailer names it', '(M^1..M^2) preserved at integration (#2485 D14)'] },

  // ---- skills/war/references/ ----
  { name: '2485/ES18 refiner-recovery.md Recovery task provenance', file: 'skills/war/references/refiner-recovery.md',
    extract: (r) => section(r, '## Recovery task provenance'),
    old: ['contains a nonempty commit in the phase with the exact `WAR-Task: <task branch>` trailer', 'mixed later history'],
    new: ['The first-parent owner rule', '`<merge>^1..<merge>^2`', 'A fast-forward-only branch, a zero-commit branch'] },
  { name: '2485/ES18 refiner-recovery.md Uncertain merge reconciliation', file: 'skills/war/references/refiner-recovery.md',
    extract: (r) => section(r, '## Uncertain merge reconciliation'),
    old: ['Task success requires source = local target = origin target', 'operation in this recovery dispatch. An already-advanced target must be exactly'],
    new: ['one `--no-ff` merge commit whose `parents` are exactly [snapshot base, current source tip]', 'An existing such merge commit is the merge'] },
  { name: '2485/ES18 schemas.md preMerged row', file: 'skills/war/references/schemas.md',
    extract: (r) => lineStarting(r, '- **`preMerged`**'),
    old: ['a nonempty commit with the exact `WAR-Task` branch trailer', 'without mixed later history'],
    new: ["the task's merge commit on the integration branch's first-parent history", '(`<merge>^1..<merge>^2`)'] },
  { name: '2485/ES18 schemas.md integration_sha row', file: 'skills/war/references/schemas.md',
    extract: (r) => lineStarting(r, '- **`integration_sha`**'),
    old: ['the post-rebase integration tip the gate ran at'],
    new: ["on a task merge, the task's `--no-ff` merge commit", 'that is `gate_sha`'] },
  { name: '2485/ES18 schemas.md confirmation and reconciliation row', file: 'skills/war/references/schemas.md',
    extract: (r) => between(r, 'Every normal merge/land reply receives a separate read-only Git confirmation', 'Missing, contradictory or unavailable proof'),
    old: ['fast-forward/patch or exact land-parent proof'],
    new: ['merge-commit predicate (one `--no-ff` merge commit with parents [snapshot base, current source tip]', 'the exact `WAR-Task` trailer'] },
  { name: '2485/ES18 schemas.md absorbCharges row', file: 'skills/war/references/schemas.md',
    extract: (r) => lineStarting(r, '- **`absorbCharges`**'),
    old: ["valueonly)' <integrationBranch>..<branch>`"],
    new: ['`<merge>^1..<merge>^2` for a merged task', "a foreign task's charge never counts"] },
  { name: '2485/ES18 gate-failure-classification.md', file: 'skills/war/references/gate-failure-classification.md',
    extract: whole,
    old: ['(already gate-capable — never a throwaway worktree)'],
    new: ['`_refinery` is provisioned at the phase topology barrier', '`provision_tree` marker', 're-provisioned by the tree rule'] },
  { name: '2485/ES18 resume-and-recovery.md', file: 'skills/war/references/resume-and-recovery.md',
    extract: whole,
    old: ['`WAR-Task: <task branch>` trailer must occur on a nonempty commit', 'Mixed later history'],
    new: ["The proof is the task's first-parent merge commit", 'is an **explained** shape'] },
  { name: '2485/ES18 design.md', file: 'skills/war/references/design.md',
    extract: whole,
    old: ['task worktrees off it; `--no-ff` land', 're-runs the gate, merges — one at a time'],
    new: ['one per-task `--no-ff` merge commit carrying `WAR-Task: <task branch>`', 'merges it as one `--no-ff` merge commit carrying `WAR-Task: <task branch>`'] },
  { name: '2485/ES18 launch-identity.md', file: 'skills/war/references/launch-identity.md',
    extract: whole,
    old: ['keep the same plan slug, numeric phase and task branches; follow'],
    new: ['A recovery relaunch executes from the same plugin root and version as the launch it recovers', 'Never recover an in-flight run on a newer engine'] },
  { name: '2485/ES18 run-manifest.md', file: 'skills/war/references/run-manifest.md',
    extract: whole,
    old: ['`configProfile`, run `startedAt`). Every'],
    new: ['`pluginRoot`', '`pluginVersion`', '`pluginSha`', 'null-tolerated launch identity'] },
  { name: '2485/ES18 merge-provenance.md', file: 'skills/war/references/merge-provenance.md',
    extract: whole,
    old: ['`git -C <_refinery> merge <task-branch>`', ...PREMISE_TOKENS],
    new: [...ENGINE_MERGE_FORM, 'Every task merge is one `--no-ff` merge commit'] },

  // ---- ADRs ----
  { name: '2485/ES18 ADR 0035 item 2', file: 'docs/adr/0035-partial-phase-recovery-adoption-not-deletion.md',
    extract: (r) => between(r, '2. **The merged-set is derived', '\n3. **'),
    old: ['rev-list --count <phase-integration-base>..<branch>` > 0', 'carries at least one commit above the phase integration base'],
    new: ['derived from the first-parent merge commit', 'merge-commit provenance (ADR 0054)'] },
  { name: '2485/ES18 ADR 0008', file: 'docs/adr/0008-git-is-the-resume-source-of-truth.md',
    extract: whole,
    old: ['nonempty task commit carrying `WAR-Task: <task branch>` in the phase history'],
    new: ['first-parent merge commit in the phase history whose parsed `WAR-Task: <task branch>` trailer names the task'] },
  { name: '2485/ES18 ADR 0021 amendment', file: 'docs/adr/0021-run-lifecycle-provision-contract.md',
    extract: whole,
    old: [...PREMISE_TOKENS],
    new: ['a merge-time provision re-run is a fourth place the refiner runs provision steps', '`provision_tree` marker'] },
  { name: '2485/ES18 ADR 0013 residual amendment line', file: 'docs/adr/0013-commanders-intent-and-disposition-routing.md',
    extract: (r) => lineStarting(r, '- 2026-10-30 · Amendment: the ace path never holds'),
    old: [...PREMISE_TOKENS],
    new: ['Two residuals are the only exceptions to never-hold', 'branch tip carries content committed after approval', '`env-died`'] },
  { name: '2485/ES18 ADR 0049 residual amendment line', file: 'docs/adr/0049-pin-transfer-and-proportional-re-audit.md',
    extract: whole,
    old: ['forward-reverts the ace commit, the task merges', 'findings demote per their dispositions'],
    new: ['Two residuals are the only exceptions to never-hold', 'branch tip carries content committed after approval', 'Every forward-revert is range-based'] },
  { name: '2485/ES18 ADR 0054 tip probe', file: 'docs/adr/0054-merge-commit-provenance-and-the-blocked-ace-tip-probe.md',
    extract: (r) => section(r, '### 1. The tip probe (D2, D3, D4, D5)'),
    old: [...PREMISE_TOKENS],
    new: ['One read-only refiner dispatch after every ace result, dead or not'] },
  { name: '2485/ES18 ADR 0054 merge-commit provenance', file: 'docs/adr/0054-merge-commit-provenance-and-the-blocked-ace-tip-probe.md',
    extract: (r) => section(r, '### 2. Merge-commit provenance (D8, D9, D10, D11, D12)'),
    old: [...PREMISE_TOKENS],
    new: [...ENGINE_MERGE_FORM, 'proves ownership from the first-parent merge commit'] },
  { name: '2485/ES18 ADR 0054 provision floor', file: 'docs/adr/0054-merge-commit-provenance-and-the-blocked-ace-tip-probe.md',
    extract: (r) => section(r, '### 3. The provision floor (D15)'),
    old: [...PREMISE_TOKENS],
    new: ['`provision_tree: <sha>`', 'The tree comparison is the only trigger'] },
  { name: '2485/ES18 ADR 0054 launch rule', file: 'docs/adr/0054-merge-commit-provenance-and-the-blocked-ace-tip-probe.md',
    extract: (r) => section(r, '### 4. The launch rule (D22)'),
    old: [...PREMISE_TOKENS],
    new: ['the same plugin root and version as the launch it recovers'] },

  // ---- lessons ----
  { name: '2485/ES18 manual-completion lesson', file: 'docs/learnings/held-escalation-lead-manual-completion.md',
    extract: (r) => between(r, '2. Get the fix onto the **integration branch**', '\n3. '),
    old: ['checked out on integration, `git merge --no-ff <task-branch>`'],
    new: [...ENGINE_MERGE_FORM, '**no rebase**'] },
  // The two dated lessons keep their recorded text by ruling (plan Task 5.2: a RESOLVED record keeps
  // its text with one dated note), so their OLD half is the premise statements, not their history.
  { name: '2485/ES18 zero-commit dated lesson', file: 'docs/learnings/archive/zero-commit-task-branch-is-vacuously-an-ancestor-so-derive-and-skip-records-it-merged.md',
    extract: (r) => between(r, '**Note (2026-10-30, merge-commit rule, #2485):**', '\u0000EOF'),
    old: [...PREMISE_TOKENS],
    new: ['**Note (2026-10-30, merge-commit rule, #2485):**', 'merge-commit provenance (ADR 0054)'] },
  { name: '2485/ES18 audit-log dated lesson', file: 'docs/learnings/audit-log-finding-can-be-stale-by-land-time.md',
    extract: (r) => between(r, '**Note (2026-10-30, merge-commit rule, #2485):**', '\u0000EOF'),
    old: [...PREMISE_TOKENS],
    new: ['**Note (2026-10-30, merge-commit rule, #2485):**', 'Task merges are now `--no-ff` merge commits'] },

  // ---- red-team and the glossary ----
  { name: '2485/ES18 lenses.md', file: 'skills/red-team/references/lenses.md',
    extract: whole,
    old: ["integrations done as **fast-forward** merges", 'NO per-task merge commit'],
    new: [ENGINE_MERGE_FORM[0], "A `<merge>^1` or `--first-parent` per-task anchor on the task's merge commit is valid"] },
  { name: '2485/ES18 skills/red-team/SKILL.md', file: 'skills/red-team/SKILL.md',
    extract: whole,
    old: ['(a synthetic fast-forward repo)'],
    new: ['a synthetic repo whose task merges are `--no-ff` merge commits carrying `WAR-Task`', 'a fast-forward-only anchor'] },
  { name: '2485/ES18 CONTEXT.md', file: 'CONTEXT.md',
    extract: whole,
    old: ["does not exist under WAR's fast-forward per-task merges"],
    new: ['Each task lands as a `--no-ff` merge commit carrying `WAR-Task`', '**Merge-commit provenance**:'] },

  // ---- shell helpers (comment surfaces) ----
  { name: '2485/ES18 provision-worktrees.sh', file: 'skills/war/assets/provision-worktrees.sh',
    extract: whole,
    old: ['task merges land under fast-forward topology'],
    new: ['each task lands as a `--no-ff` merge commit carrying its exact `WAR-Task` trailer'] },
  { name: '2485/ES18 gate-pin-status.sh', file: 'skills/war/assets/gate-pin-status.sh',
    extract: whole,
    old: ['`git diff --name-only <task-merge>^1 <task-merge>`'],
    new: ["<preMergeTip> is the previous task's merge commit"] },
];

for (const s of ES18_SURFACES) {
  test(s.name, () => {
    const raw = readRel(s.file);
    // '\u0000EOF' is the to-end-of-file sentinel for between(): the file never contains it.
    const region = normalize(s.extract(raw + '\u0000EOF').replace('\u0000EOF', ''));
    assert.ok(region.length > 0, `${s.name}: the extracted region is empty — the measurement is vacuous, fail closed`);
    assert.ok(s.old.length > 0 && s.new.length > 0, `${s.name}: an empty token list passes vacuously`);
    const hay = region.toLowerCase();
    for (const token of s.old) {
      assert.ok(
        !hay.includes(normalize(token).toLowerCase()),
        `${s.name} (${s.file}): retired fast-forward premise text ${JSON.stringify(token)} is still present — `
          + 'task merges are --no-ff merge commits carrying WAR-Task (ADR 0054, #2485); rewrite the surface, never delete this row',
      );
    }
    for (const token of s.new) {
      assert.ok(
        hay.includes(normalize(token).toLowerCase()),
        `${s.name} (${s.file}): expected the merge-commit text ${JSON.stringify(token)} and it is absent — `
          + 'OLD-absent alone passes on a deleted line (#2485)',
      );
    }
  });
}

// Key-set drift (ADR 0025, extraction plus equality): every key of the engine's MERGE_CONFIRMATION and
// MERGE_RECONCILIATION literals is named in refiner-recovery.md § Uncertain merge reconciliation.
function engineLiteralKeys(name) {
  const src = readRel(ENGINE_PATH);
  const decl = between(src, `const ${name} = {`, '\nconst ');
  const k = decl.indexOf('properties: {');
  assert.ok(k >= 0, `${name}: no properties object in the engine literal`);
  let depth = 0;
  let end = -1;
  for (let i = k + 'properties: '.length; i < decl.length; i++) {
    if (decl[i] === '{') depth++;
    else if (decl[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  assert.ok(end > k, `${name}: the properties object is not closed`);
  let body = decl.slice(decl.indexOf('{', k) + 1, end);
  // Drop nested object/array bodies so only the top-level property names remain.
  for (let prev = ''; prev !== body;) { prev = body; body = body.replace(/\{[^{}]*\}/g, '0').replace(/\[[^[\]]*\]/g, '0'); }
  return [...body.matchAll(/([A-Za-z_]\w*)\s*:/g)].map((m) => m[1]);
}

test('2485/ES18 key-set drift — MERGE_CONFIRMATION and MERGE_RECONCILIATION keys are named in refiner-recovery.md', () => {
  const sectionText = section(readRel('skills/war/references/refiner-recovery.md'), '## Uncertain merge reconciliation');
  const confirmation = engineLiteralKeys('MERGE_CONFIRMATION');
  const reconciliation = engineLiteralKeys('MERGE_RECONCILIATION');
  // The two new predicate keys must be extracted, or the extraction itself has drifted.
  for (const keys of [confirmation, reconciliation]) {
    assert.ok(keys.includes('tree') && keys.includes('trailer'), `extracted keys ${JSON.stringify(keys)} lack tree/trailer`);
  }
  assert.ok(reconciliation.includes('outcome') && reconciliation.includes('result'), 'MERGE_RECONCILIATION extraction lost outcome/result');
  for (const key of new Set([...confirmation, ...reconciliation])) {
    assert.ok(
      sectionText.includes('`' + key + '`'),
      `refiner-recovery.md § Uncertain merge reconciliation does not name the engine key \`${key}\` — the doctrine drifted from the engine literal`,
    );
  }
});
