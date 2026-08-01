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
// the Formula sentence below and that row in the same commit.
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
  'agents/war-refiner.md': { hard: 34816, advisory: 30720 },
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
};

// The prompt-literal share of workflow-template.js — measured by the PINNED extraction
// algorithm below so engine-code growth never trips a prose budget. Derivation
// (adjudication C): the pinned algorithm yields 112 top-level blocks >= 200 B /
// 52,636 B at Task 1.2's base (762a7e4, file 227,469 B), and reproduces exactly
// 108 blocks / 50,648 B at fa3c838 — the spec §1 row's 164,234 B / 238 blocks / 74%
// is unreproducible (~3× the file's total template-literal content) and is superseded.
// post-shrink 49,864 B (113 blocks, file 225,911 B) @ c6a05fb → hard ×1.25 ceil-KB
// = 62,464; advisory ×1.10 ceil-KB = 55,296
const WORKFLOW_LITERAL_BUDGET = { hard: 62464, advisory: 55296 };

const WORKFLOW_TEMPLATE = 'skills/war/assets/workflow-template.js';
const MIN_BLOCK_BYTES = 200;

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
  const expected = [...EXPECTED_NON_AGENT_SURFACES, ...agentCards].sort();
  const actual = Object.keys(FILE_BUDGETS).sort();
  assert.deepEqual(
    actual,
    expected,
    'FILE_BUDGETS keys must exactly match the expected surface census — a new agent '
      + 'card needs a budget row, and removing a row is a loud failure, never silent',
  );
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
  // (d) the measuring test's >= MIN_BLOCK_BYTES filter drops the tiny block.
  const kept = blocks.filter((b) => Buffer.byteLength(b) >= MIN_BLOCK_BYTES);
  assert.deepEqual(kept, [blocks[1]]);
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
  assert.ok(
    measured.length > 0,
    `${WORKFLOW_TEMPLATE}: zero template-literal blocks >= ${MIN_BLOCK_BYTES} B extracted — `
      + 'the measurement is vacuous (extraction broke or the literals moved); fail closed',
  );
  const total = measured.reduce((s, b) => s + b, 0);
  checkBudget(
    `${WORKFLOW_TEMPLATE} prompt-literal share (${measured.length} blocks)`,
    total,
    WORKFLOW_LITERAL_BUDGET,
  );
});
