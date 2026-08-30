// doc-semantics.test.mjs — the standing both-ways guard for the `run.maxParallel`
// semantics flip (plan 2026-08-30-engine-concurrency-and-pin-transfer, task 1.2, #1897).
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
// SCOPE: this task's doc surfaces only. `skills/war/assets/workflow-template.js` is deliberately
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
