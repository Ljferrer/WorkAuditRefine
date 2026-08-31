// prompt-surface-budgets.test.mjs — per-surface byte budgets for every prompt-bearing
// prose surface (spec 2026-07-28-prompt-surface-simplification-design §4.1; the
// prompt-surface-budgets ADR records D1–D6).
//
// The counterweight to the one-way doctrine ratchet: each budgeted surface asserts
// size <= hard (red) and logs a warning above advisory (never a failure). Budgets have
// ratchet-down semantics — LOWERING a constant is a normal PR; RAISING any hard or
// advisory constant requires citing the prompt-surface-budgets ADR's justification
// rule in the commit body.
// Pinned by skill-doc-contracts.test.mjs's D29 row (ADR 0042 mirror registry) — reword
// the derivation sentence below and that row in the same commit.
// Formula (adjudication D): advisory = post-shrink measured size × 1.10 rounded up to
// the KB; hard = post-shrink × 1.25 rounded up to the KB.
// `references/` files are deliberately unbudgeted (cold storage, like memory
// `archive/`), and README.md is deliberately unbudgeted (a human release surface).
//
// Phase-7 note (Task 7.1): every constant below is derived from the POST-shrink size
// measured at this task's rebased base (c6a05fb, 2026-07-29) — except CONTEXT.md,
// whose computed hard would EXCEED its Phase-1 placeholder (the surface grew): ratchet-
// down only, so its placeholder is retained pending Lead adjudication (see its row).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// --- Budget constants -------------------------------------------------------------
// One row per budgeted file surface, keyed by repo-relative path. Bytes, ceil-KB.

const FILE_BUDGETS = {
  // post-shrink 58,555 B @ c6a05fb → hard ×1.25 ceil-KB = 73,728; advisory ×1.10 ceil-KB = 64,512
  'skills/war/SKILL.md': { hard: 73728, advisory: 64512 },
  // post-shrink 22,216 B @ c6a05fb → hard ×1.25 ceil-KB = 28,672; advisory ×1.10 ceil-KB = 24,576
  'agents/war-auditor.md': { hard: 28672, advisory: 24576 },
  // post-shrink 27,109 B @ c6a05fb → hard ×1.25 ceil-KB = 34,816; advisory ×1.10 ceil-KB = 30,720
  // RAISED +2,048 B (34,816 → 36,864) under the engine-concurrency-and-pin-transfer plan's
  // pre-ratified PIN-17 / ADJ-1 row (operator, 2026-08-30): the card's merge-task steps must state the
  // pin-transfer probe's legs (pre-rebase patch-id, git cherry, the already_upstream arm), which is
  // tier-1 operative merge doctrine, and the card had 14 B of headroom at the task base fb18598 after
  // eviction. Trailer: Budget-Raise: ADR-0042 agents/war-refiner.md +2048
  'agents/war-refiner.md': { hard: 36864, advisory: 30720 },
  // post-shrink 15,531 B @ c6a05fb → hard ×1.25 ceil-KB = 19,456; advisory ×1.10 ceil-KB = 17,408
  'agents/war-servitor.md': { hard: 19456, advisory: 17408 },
  // No shrink task targeted this surface (adjudication M: unchanged is not failed) —
  // it ratchets to its own measured size, no flag.
  // post-shrink 8,989 B @ c6a05fb → hard ×1.25 ceil-KB = 11,264; advisory ×1.10 ceil-KB = 10,240
  'agents/war-setup-scout.md': { hard: 11264, advisory: 10240 },
  // post-shrink 9,199 B @ c6a05fb → hard ×1.25 ceil-KB = 12,288; advisory ×1.10 ceil-KB = 10,240
  'agents/war-worker.md': { hard: 12288, advisory: 10240 },
  // post-shrink 32,923 B @ c6a05fb → hard ×1.25 ceil-KB = 41,984; advisory ×1.10 ceil-KB = 36,864
  'skills/lessons-learned/SKILL.md': { hard: 41984, advisory: 36864 },
  // Budgeted per adjudication F: CONTEXT.md is the shared glossary, prompt-bearing.
  // GREW (Task 7.1): post-shrink 101,769 B @ c6a05fb → computed hard ×1.25 ceil-KB =
  // 128,000 B would EXCEED the Phase-1 placeholder hard of 126,976 B (pre-shrink
  // 100,984 B @ 762a7e4 → 126,976/111,616). Ratchet-down only: placeholder retained,
  // blocking done-report flag raised for Lead adjudication (accept with an ADR-
  // justification note, or a re-shrink follow-up).
  'CONTEXT.md': { hard: 126976, advisory: 111616 },
  // Budgeted per adjudication F: CLAUDE.md loads every session, prompt-bearing.
  // post-shrink 12,987 B @ c6a05fb → hard ×1.25 ceil-KB = 16,384; advisory ×1.10 ceil-KB
  // = 14,336 (grew 12,400 B @ 762a7e4 → 12,987 B, but ceil-KB rounding lands both on the
  // Phase-1 placeholder values exactly — computed hard does not exceed the placeholder,
  // so no flag).
  'CLAUDE.md': { hard: 16384, advisory: 14336 },
  // Reply Standard seat cards (0.21.6): injected via SubagentStart additionalContext into
  // EVERY work-audit-refine:war-* spawn — a prompt-bearing surface with wider reach than any
  // single agent card, so the five files join the census. Tiny-file deviation from the pure
  // ×1.25/×1.10 ceil-KB formula: rounding would collapse hard and advisory onto one KB step,
  // and checkBudget requires advisory < hard, so advisory takes the 0.75×hard step instead.
  // post-shrink 1,009 B @ d959346 → hard ×1.25 ceil-KB = 2048; advisory pinned below at 1536
  'hooks/reply-standard/subagent-card.md': { hard: 2048, advisory: 1536 },
  // post-shrink 269 B @ d959346 → hard ×1.25 ceil-KB = 1024; advisory pinned below at 768
  'hooks/reply-standard/subagent-card.war-auditor.md': { hard: 1024, advisory: 768 },
  // post-shrink 318 B @ d959346 → hard ×1.25 ceil-KB = 1024; advisory pinned below at 768
  'hooks/reply-standard/subagent-card.war-refiner.md': { hard: 1024, advisory: 768 },
  // post-shrink 304 B @ d959346 → hard ×1.25 ceil-KB = 1024; advisory pinned below at 768
  'hooks/reply-standard/subagent-card.war-servitor.md': { hard: 1024, advisory: 768 },
  // post-shrink 325 B @ d959346 → hard ×1.25 ceil-KB = 1024; advisory pinned below at 768
  'hooks/reply-standard/subagent-card.war-worker.md': { hard: 1024, advisory: 768 },
};

// The prompt-literal share of workflow-template.js — measured by the PINNED extraction
// algorithm below so engine-code growth never trips a prose budget. Derivation
// (adjudication C, 200 B-floor metric — SUPERSEDED by the #1952 re-baseline below): the then-live
// pinned algorithm yielded 112 top-level blocks >= 200 B /
// 52,636 B at Task 1.2's base (762a7e4, file 227,469 B), and reproduced exactly
// 108 blocks / 50,648 B at fa3c838 — the spec §1 row's 164,234 B / 238 blocks / 74%
// is unreproducible (~3× the file's total template-literal content) and is superseded.
// post-shrink 49,864 B (113 blocks, file 225,911 B) @ c6a05fb → hard ×1.25 ceil-KB
// = 62,464; advisory ×1.10 ceil-KB = 55,296.
// Re-derived for the ace-bisection engine rewrite (realized-absorb-rate Task 1.1) — the new
// subset-dispatch prose is tier-1 operative dispatched content (it cannot move to references/ —
// the Workflow sandbox reads no files — and further compression drops load-bearing revert/preflight
// safety semantics), so the constant is raised per ADR 0042's justification rule (cited in the
// commit body), after in-task compression of the new fragments:
// post-shrink 63,308 B (139 blocks, post-bisection-rewrite tree) @ 291943e (the phase-1 landed
// tip — the measuring tree's own base; the pre-rewrite base 521a312 measures 61,920 B / 134
// blocks and never carried this figure) → hard ×1.25 ceil-KB = 79,872; advisory ×1.10 ceil-KB
// = 70,656
// RAISED +2,048 B (79,872 → 81,920) under the engine-concurrency-and-pin-transfer plan's pre-ratified
// PIN-17 / ADJ-1 row (operator, 2026-08-30). The wave-side ace stage adds three dispatched surfaces the
// sandbox cannot move to references/: the PIN-12 gate check at the ace tip, the delta-scale charge on
// the re-audit prompt, and the merge slot's pin-transfer probe. Eviction ran first — the new fragments
// were compressed by ~700 B in-task — and the share measures 81,505 B at the task base fb18598, inside
// the raised ceiling. Trailer: Budget-Raise: ADR-0042 skills/war/assets/workflow-template.js +2048
// RE-BASELINED (#1952, operator-gated pass, 2026-08-31): MIN_BLOCK_BYTES 200 → 0. The floor hid
// every prompt built from small pt-fragment concatenations, and sub-floor growth moved the
// measured share not at all. The metric now sums EVERY top-level template literal — 27,666 B
// (25%) more than the floored metric, mostly pt prompt fragments plus the file's smaller log()
// and path literals; same source bytes, measured without a floor. Constants re-derived per ADR 0042 D5 from the fresh full measurement:
// post-shrink 109,289 B (467 blocks, zero-floor metric) @ 3b919f0 → hard ×1.25 ceil-KB
// = 137,216; advisory ×1.10 ceil-KB = 120,832
// Trailer: Budget-Raise: ADR-0042 skills/war/assets/workflow-template.js +55296
const WORKFLOW_LITERAL_BUDGET = { hard: 137216, advisory: 120832 };

const WORKFLOW_TEMPLATE = 'skills/war/assets/workflow-template.js';
// #1952: 0 — every top-level template literal counts. The old 200 floor is the recorded blind
// spot; a non-zero value here needs its own re-baseline pass and derivation comment.
const MIN_BLOCK_BYTES = 0;
// #1955: the zero floor made the old block-count non-vacuity assert a no-op (any non-empty list
// passed). The floor is now a minimum TOTAL: half the measured share at the re-baseline commit
// (109,289 B @ 3b919f0 ÷ 2, floored to KB = 54,272 B). Deliberately loose — normal shrinkage
// never trips it; a scanner desync that silently drops most blocks does. Re-derive alongside
// any future re-baseline of WORKFLOW_LITERAL_BUDGET.
const WORKFLOW_LITERAL_MIN_TOTAL = 54272;

// Non-agent surfaces are budgeted by this fixed list; agents/*.md rows are checked
// against a live readdir census below (default-deny: every agent card is budgeted).
const EXPECTED_NON_AGENT_SURFACES = [
  'skills/war/SKILL.md',
  'skills/lessons-learned/SKILL.md',
  'CONTEXT.md',
  'CLAUDE.md',
];

// --- Pinned extraction algorithm (adjudication C) ---------------------------------
// Nesting-aware scan of the source: only TOP-LEVEL template literals (template depth
// 0 at the opening backtick) are extracted, spanning opening through closing backtick
// inclusive (nested literals inside ${...} interpolations are counted inside their
// enclosing top-level block, never separately). Backticks inside line comments, block
// comments, and '/" strings are excluded. Blocks below MIN_BLOCK_BYTES are discarded.
// The algorithm does not model regex literals; the scan-integrity assert below fails
// closed if the scanner ever desyncs.
function extractTopLevelTemplateLiterals(src) {
  const blocks = [];
  const stack = [{ type: 'code' }];
  let templateDepth = 0;
  let topStart = -1;
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ctx = stack[stack.length - 1];
    const c = src[i];
    const c2 = src[i + 1];
    if (ctx.type === 'code') {
      if (c === '/' && c2 === '/') {
        const nl = src.indexOf('\n', i);
        i = nl === -1 ? n : nl + 1;
        continue;
      }
      if (c === '/' && c2 === '*') {
        const end = src.indexOf('*/', i + 2);
        i = end === -1 ? n : end + 2;
        continue;
      }
      if (c === "'" || c === '"') {
        let j = i + 1;
        while (j < n && src[j] !== c) {
          if (src[j] === '\\') j++;
          j++;
        }
        i = j + 1;
        continue;
      }
      if (c === '`') {
        if (templateDepth === 0) topStart = i;
        templateDepth++;
        stack.push({ type: 'template' });
        i++;
        continue;
      }
      if (ctx.interp) {
        if (c === '{') ctx.depth++;
        else if (c === '}') {
          if (ctx.depth === 0) {
            stack.pop(); // interpolation closed — back to the enclosing template
            i++;
            continue;
          }
          ctx.depth--;
        }
      }
      i++;
      continue;
    }
    // template context
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === '`') {
      stack.pop();
      templateDepth--;
      if (templateDepth === 0) blocks.push(src.slice(topStart, i + 1));
      i++;
      continue;
    }
    if (c === '$' && c2 === '{') {
      stack.push({ type: 'code', interp: true, depth: 0 });
      i += 2;
      continue;
    }
    i++;
  }
  return { blocks, clean: stack.length === 1 && templateDepth === 0 };
}

// --- Shared row check --------------------------------------------------------------

function checkBudget(label, size, { hard, advisory }) {
  assert.ok(
    Number.isInteger(hard) && Number.isInteger(advisory) && advisory > 0 && hard > advisory,
    `${label}: budget constants must satisfy 0 < advisory < hard (got advisory=${advisory}, hard=${hard})`,
  );
  assert.ok(
    size <= hard,
    `${label}: ${size} B exceeds its HARD budget of ${hard} B — shrink the surface `
      + '(move cold blocks to references/ with a trigger pointer); raising the constant '
      + "requires the prompt-surface-budgets ADR's justification rule cited in the commit body",
  );
  if (size > advisory) {
    console.warn(
      `WARN prompt-surface-budgets: ${label} is ${size} B, above its advisory line of `
        + `${advisory} B (hard ${hard} B) — plan a shrink pass before the hard line is reached`,
    );
  }
}

// --- Tests -------------------------------------------------------------------------

test('budget census — every agents/*.md is budgeted, every budgeted key is expected (default-deny)', () => {
  const agentCards = readdirSync(join(repoRoot, 'agents'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => `agents/${f}`);
  assert.ok(agentCards.length > 0, 'non-vacuity: no agents/*.md cards discovered');
  // Seat cards are discovered live too (same default-deny posture): a sixth
  // subagent-card*.md cannot land unbudgeted, and a removed one reds the census.
  const seatCards = readdirSync(join(repoRoot, 'hooks', 'reply-standard'))
    .filter((f) => f.startsWith('subagent-card') && f.endsWith('.md'))
    .map((f) => `hooks/reply-standard/${f}`);
  assert.ok(seatCards.length > 0, 'non-vacuity: no subagent-card*.md seat cards discovered');
  const expected = [...EXPECTED_NON_AGENT_SURFACES, ...agentCards, ...seatCards].sort();
  const actual = Object.keys(FILE_BUDGETS).sort();
  assert.deepEqual(
    actual,
    expected,
    'FILE_BUDGETS keys must exactly match the expected surface census — a new agent '
      + 'card needs a budget row, and removing a row is a loud failure, never silent',
  );
});

// --- Per-row derivation-comment guard (ADR 0042 D5 mechanism gap, #1233) ------------
//
// D5 mandates that every budget constant carry its derivation. Nothing enforced it: a bare
// `{ hard, advisory }` row could land above with no comment at all, leaving the number
// unauditable — no way to tell a measured ratchet from a typed-in guess. This guard binds the
// shape of the comment block directly above each budgeted subject.
//
// CONTAINS, never starts-with. Survey of the live subjects at this task's base: FOUR blocks open
// with something other than their derivation line — war-setup-scout's adjudication-M note,
// CONTEXT.md's and CLAUDE.md's adjudication-F preambles, and the prompt-literal sentinel's
// adjudication-C paragraph. A starts-with shape would RED all four unmodified.
//
// The derivation predicate is FUSED and newline-anchored, deliberately:
//   * Fused (byte count and SHA bound in ONE match) because two independent contains-predicates
//     would happily pair a byte count on one comment line with a SHA on another. That false
//     green is latent rather than live — zero cross-line pairings at this base — which is
//     exactly the sort of hole a mechanical guard exists to foreclose before it opens.
//   * Parenthetical-tolerant because the sentinel's derivation interposes a block/file-size
//     aside between the byte count and the SHA. The plain fused shape REDs that one live
//     subject; this shape passes all ten with zero comment rewrites.
//   * The `\n` in the negated class is PROPHYLACTIC and no current subject demonstrates it:
//     JavaScript negated classes match U+000A, so a bare `[^)]*` would let the aside span
//     comment lines and re-admit the cross-line pairing the fusion just closed. Measured at this
//     base the two variants agree on all ten subjects (nine of the ten blocks put ` @ <sha>`
//     directly after the byte count, so the optional group is skipped; the sentinel's aside opens
//     right after the byte count AND closes on the same comment line, with the SHA after the
//     close, so both variants match it identically — and under `@ <sha>`-stripping rot all ten
//     RED under either variant). It guards a future shape — an aside opening right after the
//     byte count and closing on a later line with the SHA after it — not a present one.
//
// Multiplier disjunction, not conjunction: CONTEXT.md's row is the known one-arm outlier, showing
// only the ×1.25 side (its placeholder is retained under ratchet-down, so the advisory arm's
// computed value is not what the row carries).
//
// DISCOVERY FLOOR (default-deny, the sibling census's posture): the row-shape scan does not get to
// define its own subject set. Reflow one row to a multi-line object literal and it drops silently
// out of the scan (10 → 9), after which its derivation comment could be deleted with this guard
// still green — precisely the unauditable-bare-row outcome #1233 exists to prevent. So the
// discovered key set is asserted equal to the live budget keys plus the one sentinel.
//
// Self-exclusion, both subject classes: the sentinel is pinned by its DECLARATION line shape (the
// identifier also appears at a use site below, which an occurrence scan would double-count), and
// that shape is assembled from split fragments so this guard's own source carries no
// declaration-shaped line; the row subject is matched by a regex, never a literal row-shaped
// byte-run.
test('per-row derivation guard — every budgeted constant carries its derivation comment (ADR 0042 D5, #1233)', () => {
  const ownSrc = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const lines = ownSrc.split('\n');

  const ROW_SHAPE = /^\s*'([^']+)':\s*\{\s*hard:\s*\d+,\s*advisory:\s*\d+\s*\},?\s*$/;
  const SENTINEL = 'WORKFLOW_LITERAL' + '_BUDGET';
  const SENTINEL_DECL = new RegExp('^const ' + SENTINEL + '\\b');
  const DERIVATION = /post-shrink [\d,]+ B(?: \([^)\n]*\))? @ [0-9a-f]{7}/;
  const MULTIPLIER = /×1\.25|×1\.10/;

  // Contiguous `//` run immediately above the subject line, leaders stripped, line structure
  // preserved — the newline anchoring above is meaningless if the block is flattened first.
  const commentBlockAbove = (idx) => {
    const block = [];
    for (let i = idx - 1; i >= 0 && /^\s*\/\//.test(lines[i]); i--) {
      block.unshift(lines[i].replace(/^\s*\/\/ ?/, ''));
    }
    return block.join('\n');
  };

  const subjects = [];
  lines.forEach((line, i) => {
    const row = line.match(ROW_SHAPE);
    if (row) subjects.push([row[1], commentBlockAbove(i)]);
    else if (SENTINEL_DECL.test(line)) subjects.push([SENTINEL, commentBlockAbove(i)]);
  });

  const discovered = subjects.map(([key]) => key).sort();
  const expectedKeys = [...Object.keys(FILE_BUDGETS), SENTINEL].sort();
  const undiscovered = expectedKeys.filter((k) => !discovered.includes(k));
  const extra = discovered.filter((k) => !expectedKeys.includes(k));
  assert.deepEqual(
    discovered,
    expectedKeys,
    'the derivation-guard subject scan did not discover every budgeted constant — a budgeted row '
      + 'reflowed out of the single-line row shape drops silently out of the guarded set, after '
      + 'which its derivation could be deleted unnoticed: undiscovered '
      + `${JSON.stringify(undiscovered)}, unexpected ${JSON.stringify(extra)} (#1233). Re-shape `
      + 'the row to one line, or widen this scan in the same commit — never narrow the expected '
      + 'set to match the scan',
  );

  for (const [key, block] of subjects) {
    assert.match(
      block,
      DERIVATION,
      `${key}: the comment block directly above it must carry a derivation line binding the `
        + 'measured post-shrink byte count to the commit it was measured at, on ONE line '
        + '(ADR 0042 D5) — a budget constant without one is an unauditable number (#1233)',
    );
    assert.match(
      block,
      MULTIPLIER,
      `${key}: its derivation comment must show the multiplier the budget was computed with `
        + '(the hard ×1.25 arm, the advisory ×1.10 arm, or both) — ADR 0042 D5',
    );
  }
});

for (const [relPath, budget] of Object.entries(FILE_BUDGETS)) {
  test(`surface budget — ${relPath}`, () => {
    const size = Buffer.byteLength(readFileSync(join(repoRoot, relPath), 'utf8'));
    checkBudget(relPath, size, budget);
  });
}

test('pinned extraction — fixture witnesses the four pinned behaviors (adjudication C)', () => {
  const pad = 'x'.repeat(220);
  const fixture =
    '// line comment with a stray ` backtick\n'
    + '/* block comment with a stray ` backtick */\n'
    + "const a = 'quoted ` backtick';\n"
    + 'const small = `tiny`;\n'
    + 'const big = `' + pad + '${ `inner` }end`;\n';
  const { blocks, clean } = extractTopLevelTemplateLiterals(fixture);
  assert.ok(clean, 'fixture scan must end clean');
  // (a) backticks inside line/block comments are not openers, (b) a backtick inside
  // a quoted string is not an opener, (c) the nested template inside ${...} folds
  // into its parent block (block COUNT stays 2, and the parent spans it byte-for-byte).
  // Removing any skip branch changes the block list and fails this deepEqual.
  assert.deepEqual(blocks, ['`tiny`', '`' + pad + '${ `inner` }end`']);
  // (d) #1952: the floor is 0 — NO block is dropped, so sub-200 B prompt growth moves the
  // measured share. The old 200 floor hid 25% of real dispatched prompt bytes.
  const kept = blocks.filter((b) => Buffer.byteLength(b) >= MIN_BLOCK_BYTES);
  assert.deepEqual(kept, blocks, 'the zero floor keeps every block — a dropped block would re-open #1952');
  const share = (bs) => bs.reduce((a, b) => a + Buffer.byteLength(b), 0);
  assert.equal(share(kept) - share([blocks[1]]), Buffer.byteLength('`tiny`'),
    'a sub-200 B literal contributes its exact bytes to the share (#1952 close-when)');
});

test('placeholder marker retired — zero occurrences remain in this suite (Task 7.1 OLD-absent)', () => {
  // Token built by concatenation so this test's own source never matches the count
  // it measures. In-gate OLD-absent self-assert (Task 7.1): the Phase-1 placeholder
  // markers are retired — the gate itself carries the equivalent of the pinned
  // zero-hit grep of this file for the marker token.
  const marker = 'PLACEHOLDER-' + 'BUDGET';
  const own = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const count = own.split(marker).length - 1;
  assert.equal(
    count,
    0,
    `expected zero ${marker} markers after the Task 7.1 ratchet, found ${count} — `
      + 'the retired token leaked back into this file',
  );
});

test(`surface budget — ${WORKFLOW_TEMPLATE} prompt-literal share (pinned extraction)`, () => {
  const src = readFileSync(join(repoRoot, WORKFLOW_TEMPLATE), 'utf8');
  const { blocks, clean } = extractTopLevelTemplateLiterals(src);
  assert.ok(clean, `${WORKFLOW_TEMPLATE}: extraction scan desynced (unterminated context) — fail closed`);
  const measured = blocks
    .map((b) => Buffer.byteLength(b))
    .filter((bytes) => bytes >= MIN_BLOCK_BYTES);
  const total = measured.reduce((s, b) => s + b, 0);
  assert.ok(
    total >= WORKFLOW_LITERAL_MIN_TOTAL,
    `${WORKFLOW_TEMPLATE}: extracted prompt-literal total ${total} B is below the `
      + `${WORKFLOW_LITERAL_MIN_TOTAL} B non-vacuity floor (#1955) — either the extraction broke, `
      + 'or a genuine mass shrink landed; a real shrink re-baselines the floor (ADR 0048 §2), never patches around it',
  );
  checkBudget(
    `${WORKFLOW_TEMPLATE} prompt-literal share (${measured.length} blocks)`,
    total,
    WORKFLOW_LITERAL_BUDGET,
  );
});
