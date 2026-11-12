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
// measured at this task's rebased base (c6a05fb, 2026-07-29) — except CONTEXT.md (now the GLOSSARY.md row, #2636),
// whose computed hard would EXCEED its Phase-1 placeholder (the surface grew): ratchet-
// down only, so its placeholder is retained pending Lead adjudication (see its row).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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
  // post-shrink 10,081 B @ 7b68e80 → hard ×1.25 ceil-KB = 13,312; advisory ×1.10 ceil-KB = 11,264
  'agents/war-evidence-auditor.md': { hard: 13312, advisory: 11264 },
  // post-shrink 27,109 B @ c6a05fb → hard ×1.25 ceil-KB = 34,816; advisory ×1.10 ceil-KB = 30,720
  // RAISED +2,048 B (34,816 → 36,864) under the engine-concurrency-and-pin-transfer plan's
  // pre-ratified PIN-17 / ADJ-1 row (operator, 2026-08-30): the card's merge-task steps must state the
  // pin-transfer probe's legs (pre-rebase patch-id, git cherry, the already_upstream arm), which is
  // tier-1 operative merge doctrine, and the card had 14 B of headroom at the task base fb18598 after
  // eviction. Trailer: Budget-Raise: ADR-0042 agents/war-refiner.md +2048
  // RAISED +1,024 B (36,864 → 37,888) at the operator's direction (#2126, 2026-10-31): the ruling keeps
  // "Delete or weaken a test." inline in the card's Never section, tier-1 merge doctrine, and the card
  // had 3 B of headroom. Trailer: Budget-Raise: ADR-0042 agents/war-refiner.md +1024
  // RAISED +1,024 B (37,888 → 38,912) at the operator's direction (#2617, 2026-11-05): an eviction pass
  // found no stale card text to move, and merge-task step 1 must name the exact dirty-tree status command,
  // tier-1 merge doctrine. The card had 0 B of headroom. Trailer: Budget-Raise: ADR-0042 agents/war-refiner.md +1024
  'agents/war-refiner.md': { hard: 38912, advisory: 30720 },
  // post-shrink 15,531 B @ c6a05fb → hard ×1.25 ceil-KB = 19,456; advisory ×1.10 ceil-KB = 17,408
  'agents/war-servitor.md': { hard: 19456, advisory: 17408 },
  // No shrink task targeted this surface (adjudication M: unchanged is not failed) —
  // it ratchets to its own measured size, no flag.
  // post-shrink 8,989 B @ c6a05fb → hard ×1.25 ceil-KB = 11,264; advisory ×1.10 ceil-KB = 10,240
  'agents/war-setup-scout.md': { hard: 11264, advisory: 10240 },
  // New card (ADR 0057): a small card is the point of the helper, so the budget stays small.
  // post-shrink 1,044 B @ a46c4f0 → hard ×1.25 ceil-KB = 2,048; advisory pinned at 1,536, below hard
  'agents/war-helper.md': { hard: 2048, advisory: 1536 },
  // post-shrink 9,199 B @ c6a05fb → hard ×1.25 ceil-KB = 12,288; advisory ×1.10 ceil-KB = 10,240
  // RAISED +1,024 B (12,288 → 13,312) at the operator's direction, 2026-10-31: the card reached 14 B
  // of headroom. ADR 0042 reason and trailer: `Budget-Raise: ADR-0042 agents/war-worker.md +1024`.
  'agents/war-worker.md': { hard: 13312, advisory: 10240 },
  // post-shrink 32,923 B @ c6a05fb → hard ×1.25 ceil-KB = 41,984; advisory ×1.10 ceil-KB = 36,864
  'skills/lessons-learned/SKILL.md': { hard: 41984, advisory: 36864 },
  // Budgeted per adjudication F: CONTEXT.md is the Layer 1 router, prompt-bearing (#2636).
  // post-shrink 1,429 B (the router written on base 31c216b, measured in #2636) @ 31c216b →
  // hard ×1.25 ceil-KB = 2,048; advisory pinned below at 1,536 (the tiny-file rule: advisory < hard).
  // working copy on 31c216b: the router was measured before it was committed, so no blob holds
  // the cited count (CONTEXT.md at 31c216b is the pre-split file) and the derivation guard skips
  // the blob check for this row (#2083).
  'CONTEXT.md': { hard: 2048, advisory: 1536 },
  // Budgeted per adjudication F: GLOSSARY.md is the shared glossary, prompt-bearing.
  // MOVED unchanged from the CONTEXT.md row (#2636): the glossary left CONTEXT.md as a
  // byte-identical move, and its budget row moved with it. The glossary was measured as CONTEXT.md
  // at c6a05fb, so the derivation guard reads that blob path (#2083). Its history, as recorded on CONTEXT.md:
  // GREW (Task 7.1): post-shrink 101,769 B @ c6a05fb → computed hard ×1.25 ceil-KB =
  // 128,000 B would EXCEED the Phase-1 placeholder hard of 126,976 B (pre-shrink
  // 100,984 B @ 762a7e4 → 126,976/111,616). Ratchet-down only: placeholder retained,
  // blocking done-report flag raised for Lead adjudication (accept with an ADR-
  // justification note, or a re-shrink follow-up).
  // RAISED +3,072 B (128,000 → 131,072) at the operator's direction, 2026-10-31: the file exceeded
  // the ceiling by 36 B in 0.21.23. ADR 0042 reason and trailer: `Budget-Raise: ADR-0042 CONTEXT.md +3072`.
  'GLOSSARY.md': { hard: 131072, advisory: 111616 },
  // Budgeted per adjudication F: CLAUDE.md loads every session, prompt-bearing.
  // post-shrink 12,987 B @ c6a05fb → hard ×1.25 ceil-KB = 16,384; advisory ×1.10 ceil-KB
  // = 14,336 (grew 12,400 B @ 762a7e4 → 12,987 B, but ceil-KB rounding lands both on the
  // Phase-1 placeholder values exactly — computed hard does not exceed the placeholder,
  // so no flag).
  'CLAUDE.md': { hard: 16384, advisory: 14336 },
  // Reply Standard seat cards (0.21.6): injected via SubagentStart additionalContext into
  // EVERY work-audit-refine:war-* spawn — a prompt-bearing surface with wider reach than any
  // single agent card, so the six files join the census. Tiny-file deviation from the pure
  // ×1.25/×1.10 ceil-KB formula: rounding would collapse hard and advisory onto one KB step,
  // and checkBudget requires advisory < hard, so advisory takes the 0.75×hard step instead
  // (each row says `advisory pinned`, so the derivation guard checks its hard arm only).
  // post-shrink 1,009 B @ d959346 → hard ×1.25 ceil-KB = 2048; advisory pinned below at 1536
  'hooks/reply-standard/subagent-card.md': { hard: 2048, advisory: 1536 },
  // post-shrink 269 B @ d959346 → hard ×1.25 ceil-KB = 1024; advisory pinned below at 768
  'hooks/reply-standard/subagent-card.war-auditor.md': { hard: 1024, advisory: 768 },
  // post-shrink 333 B @ 7b68e80 → hard ×1.25 ceil-KB = 1024; advisory pinned below at 768
  'hooks/reply-standard/subagent-card.war-evidence-auditor.md': { hard: 1024, advisory: 768 },
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
// RE-BASELINED (operator-gated pass, 2026-09-12, plan 2026-09-11-backward-chain-doctrine A1/G13):
// the pin-confirm prompt hotfix (e0cfb19a) carried the share to 137,282 B, over the old hard line,
// and the plan's three `## The rules` blocks (tier-1 every-dispatch doctrine mirrored byte-equal
// from references/ — neither evictable nor compressible under PIN-1) land in Phase 2. Constants
// re-derived per ADR 0042 D5 from the measured share at 6cb1e4a5 (137,169 B, 510 blocks; the
// hotfix adds 113 B): hard ×1.25 ceil-KB = 172,032; advisory ×1.10 ceil-KB = 151,552.
// Trailer: Budget-Raise: ADR-0042 skills/war/assets/workflow-template.js +34816
// RAISED +1,024 B (172,032 → 173,056) under plan 2026-11-08-doc-truth-drift-and-adr-hygiene Constraint 4's
// Task 3.2 exception (operator ruling 2026-11-09: a cap forces a cited reason, never forbids a raise).
// The share measured 171,862 B at the task base b8ac9716 (170 B of room). Task 3.2 adds tier-1 dispatched
// seat doctrine the sandbox cannot read from references/: the Harness-text rule and the seat-conflict
// posture on every roster seat (both byte-equal to the auditor cards), the arm (d) STALE-MISMATCH clause
// on the gate-audit seat, and the tip-probe same-commit tree rule. The share then measures 172,559 B.
// Trailer: Budget-Raise: ADR-0042 skills/war/assets/workflow-template.js +1024
const WORKFLOW_LITERAL_BUDGET = { hard: 173056, advisory: 151552 };

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
  'GLOSSARY.md',
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

// Every run prints one MEASURE line per surface, below the advisory line too (#1735): the
// re-baseline preflight reads it, so no measurement is hidden until a surface crosses a line.
function checkBudget(label, size, { hard, advisory }) {
  console.warn(`MEASURE prompt-surface-budgets: ${label} ${size} B (advisory ${advisory}, hard ${hard})`);
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

// --- Derivation truth helpers (ADR 0042 D5, #2083) ----------------------------------

// One budgeted row line, and the contiguous `//` run directly above a line (leaders stripped,
// line structure kept). Both the shape guard and the truth guard read rows through these.
const ROW_SHAPE = /^\s*'([^']+)':\s*\{\s*hard:\s*\d+,\s*advisory:\s*\d+\s*\},?\s*$/;
function commentBlockAbove(lines, idx) {
  const block = [];
  for (let i = idx - 1; i >= 0 && /^\s*\/\//.test(lines[i]); i--) {
    block.unshift(lines[i].replace(/^\s*\/\/ ?/, ''));
  }
  return block.join('\n');
}

// Every FILE_BUDGETS row with its comment block and live constants. The literal-share sentinel is
// not a row: its count comes from the pinned extraction, not a blob, so it keeps the shape check only.
function discoverDerivationRows(lines) {
  const rows = [];
  lines.forEach((line, i) => {
    const m = line.match(ROW_SHAPE);
    if (m && FILE_BUDGETS[m[1]]) rows.push({ key: m[1], block: commentBlockAbove(lines, i), ...FILE_BUDGETS[m[1]] });
  });
  return rows;
}

// ceil-KB of bytes × pct/100, in integer arithmetic (no float rounding at a KB edge).
const ceilKB = (bytes, pct) => Math.ceil((bytes * pct) / 102400) * 1024;

// The default blob reader. It returns a byte size, 'no-commit' or 'no-path'. Both `cat-file -s`
// failures exit 128, so the commit probe runs first and tells them apart. A missing git binary
// also reads as 'no-commit' (fail open).
function defaultBlobSize(sha, path) {
  const git = (args) => execFileSync('git', ['-C', repoRoot, ...args], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  });
  try {
    git(['cat-file', '-e', `${sha}^{commit}`]);
  } catch {
    return 'no-commit';
  }
  try {
    return Number(git(['cat-file', '-s', `${sha}:${path}`]).trim());
  } catch {
    return 'no-path';
  }
}

// Pure check of one row: { key, block, hard, advisory } plus an injected reader (sha, path) →
// size | 'no-commit' | 'no-path'. Returns { errors, warnings }. Markers in the block:
//   `measured as <path>`    the blob path is <path>, not the row key (a moved row)
//   `working copy on <sha>` no blob holds the count, so the blob check skips the cite at <sha>
//                           (every other cite in the row is still checked)
//   `RAISED`, `placeholder retained`  a ruling set the constants, so the arithmetic is skipped
//   `advisory pinned`       the advisory was set below hard by hand, so only the hard arm is checked
const DERIVATION_CAPTURE = /post-shrink ([\d,]+) B(?: \([^)\n]*\))? @ ([0-9a-f]{7,40})/g;
function checkDerivation({ key, block, hard, advisory }, readBlobSize) {
  const errors = [];
  const warnings = [];
  const cites = [...block.matchAll(DERIVATION_CAPTURE)].map((m) => [Number(m[1].replaceAll(',', '')), m[2]]);
  if (cites.length === 0) return { errors: [`${key}: no post-shrink derivation line to check`], warnings };
  const moved = block.match(/measured as ([\w/-]+(?:\.[\w-]+)*)/);
  const path = moved ? moved[1] : key;
  // A marker skips only the cite at the sha it names (a short sha matches its long form).
  const workingCopy = [...block.matchAll(/working copy on ([0-9a-f]{7,40})/g)].map((m) => m[1]);
  const isWorkingCopy = (sha) => workingCopy.some((w) => w.startsWith(sha) || sha.startsWith(w));
  for (const [cited, sha] of cites) {
    if (isWorkingCopy(sha)) continue;
    const got = readBlobSize(sha, path);
    if (got === 'no-commit') {
      warnings.push(`WARN prompt-surface-budgets: derivation guard: ${key} cites ${sha}, and ${sha} `
        + 'is not a commit in this clone — blob check skipped (fail open)');
    } else if (got === 'no-path') {
      errors.push(`${key}: ${path} is absent at ${sha}, so the cited ${cited} B measures nothing (#2083) — `
        + 'fix the sha, or mark the row `measured as <path>` or `working copy on <sha>`');
    } else if (got !== cited) {
      errors.push(`${key}: derivation cites ${cited} B at ${sha}, but the ${path} blob holds ${got} B (#2083)`);
    }
  }
  if (!/\bRAISED\b|placeholder retained/.test(block)) {
    const [cited] = cites[0];
    const wantHard = ceilKB(cited, 125);
    if (hard !== wantHard) {
      errors.push(`${key}: hard ${hard} B does not follow from ${cited} B — ×1.25 ceil-KB gives ${wantHard} B `
        + '(a ruled raise marks the row RAISED)');
    }
    const wantAdvisory = ceilKB(cited, 110);
    if (!/advisory pinned/.test(block) && advisory !== wantAdvisory) {
      errors.push(`${key}: advisory ${advisory} B does not follow from ${cited} B — ×1.10 ceil-KB gives `
        + `${wantAdvisory} B (a hand-set advisory marks the row advisory pinned)`);
    }
  }
  return { errors, warnings };
}

// --- Tests -------------------------------------------------------------------------

test('budget census — every agents/*.md is budgeted, every budgeted key is expected (default-deny)', () => {
  const agentCards = readdirSync(join(repoRoot, 'agents'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => `agents/${f}`);
  assert.ok(agentCards.length > 0, 'non-vacuity: no agents/*.md cards discovered');
  // Seat cards are discovered live too (same default-deny posture): a new
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
// shape of the comment block directly above each budgeted subject. Shape is not truth: the
// `derivation guard — ` tests below check each FILE_BUDGETS row's cited count against its blob
// and recompute its constants (checkDerivation, #2083).
//
// CONTAINS, never starts-with. Survey of the live subjects at this task's base: these blocks open
// with something other than their derivation line — war-setup-scout's adjudication-M note,
// CONTEXT.md's and CLAUDE.md's adjudication-F preambles, and the prompt-literal sentinel's
// adjudication-C paragraph. #2636 split the CONTEXT.md block into the router and GLOSSARY.md
// rows, and both keep an adjudication-F preamble. A starts-with shape would RED each of them unmodified.
//
// The derivation predicate is FUSED and newline-anchored, deliberately:
//   * Fused (byte count and SHA bound in ONE match) because two independent contains-predicates
//     would happily pair a byte count on one comment line with a SHA on another. That false
//     green is latent rather than live — zero cross-line pairings at this base — which is
//     exactly the sort of hole a mechanical guard exists to foreclose before it opens.
//   * Parenthetical-tolerant because the sentinel's derivation interposes a block/file-size
//     aside between the byte count and the SHA. The plain fused shape REDs that one live
//     subject; this shape passed every subject at that base with zero comment rewrites.
//   * The `\n` in the negated class is PROPHYLACTIC and no current subject demonstrates it:
//     JavaScript negated classes match U+000A, so a bare `[^)]*` would let the aside span
//     comment lines and re-admit the cross-line pairing the fusion just closed. Measured at this
//     base the two variants agree on every subject (every block but the sentinel puts ` @ <sha>`
//     directly after the byte count, so the optional group is skipped; the sentinel's aside opens
//     right after the byte count AND closes on the same comment line, with the SHA after the
//     close, so both variants match it identically — and under `@ <sha>`-stripping rot every
//     subject REDs under either variant). It guards a future shape — an aside opening right after the
//     byte count and closing on a later line with the SHA after it — not a present one.
//
// Multiplier disjunction, not conjunction: a row whose advisory is not the ×1.10 value shows only
// the ×1.25 side. GLOSSARY.md's placeholder is retained under ratchet-down. The tiny-file rows
// (CONTEXT.md, agents/war-helper.md and the hooks/reply-standard subagent cards) carry the
// `advisory pinned` marker, so checkDerivation skips only their advisory arm.
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

  const SENTINEL = 'WORKFLOW_LITERAL' + '_BUDGET';
  const SENTINEL_DECL = new RegExp('^const ' + SENTINEL + '\\b');
  const DERIVATION = /post-shrink [\d,]+ B(?: \([^)\n]*\))? @ [0-9a-f]{7}/;
  const MULTIPLIER = /×1\.25|×1\.10/;

  // commentBlockAbove (module scope) keeps line structure — the newline anchoring above is
  // meaningless if the block is flattened first.
  const subjects = [];
  lines.forEach((line, i) => {
    const row = line.match(ROW_SHAPE);
    if (row) subjects.push([row[1], commentBlockAbove(lines, i)]);
    else if (SENTINEL_DECL.test(line)) subjects.push([SENTINEL, commentBlockAbove(lines, i)]);
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

// --- Derivation truth (ADR 0042 D5, #2083) -------------------------------------------
// The shape guard above proves a derivation line exists. These tests prove it is TRUE: the cited
// count is the blob size at the cited commit, and the constants follow from it. checkDerivation is
// pure — the blob reader is injected — so each fixture below feeds one reader outcome.
const fixtureRow = (block, hard, advisory) => ({ key: 'agents/fixture.md', block, hard, advisory });
const readerOf = (outcome) => () => outcome;
// 10,000 B → hard ceil-KB(12,500) = 13,312; advisory ceil-KB(11,000) = 11,264.
const GOOD_BLOCK = 'post-shrink 10,000 B @ abc1234 → hard ×1.25 ceil-KB = 13,312; advisory ×1.10 ceil-KB = 11,264';

test('derivation guard — the live table passes', () => {
  const lines = readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n');
  const rows = discoverDerivationRows(lines);
  assert.deepEqual(rows.map((r) => r.key).sort(), Object.keys(FILE_BUDGETS).sort(),
    'every FILE_BUDGETS row reaches the derivation-truth check');
  for (const row of rows) {
    const { errors, warnings } = checkDerivation(row, defaultBlobSize);
    for (const w of warnings) console.warn(w);
    assert.deepEqual(errors, [], `${row.key}: derivation is not true`);
  }
});

test('derivation guard — a true fixture row passes', () => {
  const { errors, warnings } = checkDerivation(fixtureRow(GOOD_BLOCK, 13312, 11264), readerOf(10000));
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
});

test('derivation guard — wrong cited bytes reds', () => {
  const { errors } = checkDerivation(fixtureRow(GOOD_BLOCK, 13312, 11264), readerOf(10001));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /cites 10000 B .*blob holds 10001 B/);
});

test('derivation guard — wrong multiplier reds', () => {
  const hard = checkDerivation(fixtureRow(GOOD_BLOCK, 12288, 11264), readerOf(10000)).errors;
  assert.equal(hard.length, 1, 'a hard constant off the ×1.25 ceil-KB value reds');
  assert.match(hard[0], /hard 12288 B .*×1\.25 ceil-KB gives 13312 B/);
  const adv = checkDerivation(fixtureRow(GOOD_BLOCK, 13312, 10240), readerOf(10000)).errors;
  assert.equal(adv.length, 1, 'an advisory constant off the ×1.10 ceil-KB value reds');
  assert.match(adv[0], /advisory 10240 B .*×1\.10 ceil-KB gives 11264 B/);
});

test('derivation guard — advisory pinned skips only the advisory arm', () => {
  const block = 'post-shrink 1,044 B @ abc1234 → hard ×1.25 ceil-KB = 2,048; advisory pinned at 1,536';
  assert.deepEqual(checkDerivation(fixtureRow(block, 2048, 1536), readerOf(1044)).errors, [],
    'a pinned advisory off the ×1.10 value passes');
  const wrongHard = checkDerivation(fixtureRow(block, 3072, 1536), readerOf(1044)).errors;
  assert.equal(wrongHard.length, 1, 'a pinned-advisory row with a wrong hard still reds');
  assert.match(wrongHard[0], /hard 3072 B/);
  const unpinned = block.replace('advisory pinned', 'advisory');
  assert.equal(checkDerivation(fixtureRow(unpinned, 2048, 1536), readerOf(1044)).errors.length, 1,
    'without the marker the same advisory reds');
});

test('derivation guard — path absent at a present sha reds', () => {
  const { errors, warnings } = checkDerivation(fixtureRow(GOOD_BLOCK, 13312, 11264), readerOf('no-path'));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /agents\/fixture\.md is absent at abc1234/);
  assert.deepEqual(warnings, []);
});

test('derivation guard — missing commit fails open', () => {
  const row = fixtureRow(GOOD_BLOCK, 13312, 11264);
  const open = checkDerivation(row, readerOf('no-commit'));
  assert.deepEqual(open.errors, [], 'a sha this clone lacks fails open');
  assert.equal(open.warnings.length, 1, 'and prints exactly one WARN line');
  assert.match(open.warnings[0], /^WARN prompt-surface-budgets: .*abc1234 is not a commit in this clone/);
  // The same fixture observes its branch: a no-path outcome for it reds.
  assert.equal(checkDerivation(row, readerOf('no-path')).errors.length, 1);
});

test('derivation guard — measured as redirects the blob path', () => {
  const seen = [];
  const reader = (sha, path) => { seen.push(`${sha}:${path}`); return 10000; };
  const block = `${GOOD_BLOCK}\nThe file was measured as CONTEXT.md before a move.`;
  assert.deepEqual(checkDerivation(fixtureRow(block, 13312, 11264), reader).errors, []);
  assert.deepEqual(seen, ['abc1234:CONTEXT.md']);
  seen.length = 0;
  checkDerivation(fixtureRow(GOOD_BLOCK, 13312, 11264), reader);
  assert.deepEqual(seen, ['abc1234:agents/fixture.md'], 'without the marker the row key is the path');
});

test('derivation guard — working copy on skips the blob check', () => {
  const block = `${GOOD_BLOCK}\nworking copy on abc1234: measured before commit.`;
  assert.deepEqual(checkDerivation(fixtureRow(block, 13312, 11264), readerOf('no-path')).errors, []);
  assert.equal(checkDerivation(fixtureRow(GOOD_BLOCK, 13312, 11264), readerOf('no-path')).errors.length, 1,
    'without the marker the same reader reds');
  assert.equal(checkDerivation(fixtureRow(block, 12288, 11264), readerOf('no-path')).errors.length, 1,
    'the marker keeps the arithmetic');
});

test('derivation guard — working copy on skips only the cite at its sha', () => {
  const block = `${GOOD_BLOCK}\npost-shrink 9,000 B @ def5678 earlier.\nworking copy on abc1234: measured before commit.`;
  const seen = [];
  const reader = (sha) => { seen.push(sha); return 9001; };
  const { errors } = checkDerivation(fixtureRow(block, 13312, 11264), reader);
  assert.deepEqual(seen, ['def5678'], 'only the cite at another sha reaches the reader');
  assert.equal(errors.length, 1, 'a wrong byte count at another sha still reds');
  assert.match(errors[0], /cites 9000 B at def5678, but .* blob holds 9001 B/);
  const longSha = `abc1234${'0'.repeat(33)}`;
  const arms = [
    ['a long marker skips a short cite', block.replace('working copy on abc1234', `working copy on ${longSha}`)],
    ['a short marker skips a long cite', block.replace('@ abc1234', `@ ${longSha}`)],
  ];
  for (const [label, armBlock] of arms) {
    seen.length = 0;
    checkDerivation(fixtureRow(armBlock, 13312, 11264), reader);
    assert.deepEqual(seen, ['def5678'], label);
  }
});

test('derivation guard — RAISED and placeholder retained skip the arithmetic', () => {
  for (const marker of ['RAISED +1,024 B by operator ruling.', 'Ratchet-down only: placeholder retained.']) {
    const block = `${GOOD_BLOCK}\n${marker}`;
    assert.deepEqual(checkDerivation(fixtureRow(block, 14336, 12288), readerOf(10000)).errors, [],
      `${marker}: raised constants pass`);
    assert.equal(checkDerivation(fixtureRow(block, 14336, 12288), readerOf(10001)).errors.length, 1,
      `${marker}: the marker keeps the blob check`);
  }
  assert.equal(checkDerivation(fixtureRow(GOOD_BLOCK, 14336, 12288), readerOf(10000)).errors.length, 2,
    'without a marker both raised constants red');
});

test('derivation guard — default reader tells no-commit from no-path', () => {
  const head = execFileSync('git', ['-C', repoRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const size = defaultBlobSize(head, 'CLAUDE.md');
  assert.ok(Number.isInteger(size) && size > 0, `a present path at HEAD reads a size (got ${size})`);
  assert.equal(defaultBlobSize(head, 'no-such-file-2083.md'), 'no-path');
  assert.equal(defaultBlobSize('0'.repeat(40), 'CLAUDE.md'), 'no-commit');
});

// The MEASURE print is a contract the re-baseline preflight reads, so the gate pins it here.
test('measure line — checkBudget prints one MEASURE line per call', () => {
  // The fixture limits are named, so no line here pairs a budget key with a number.
  // The Budget-Raise floor reads such a line as a ceiling, and this fixture is not one.
  const fixtureHard = 2048;
  const fixtureAdvisory = 1024;
  const fixtureBudget = { hard: fixtureHard, advisory: fixtureAdvisory };
  const captured = [];
  const realWarn = console.warn;
  console.warn = (...args) => { captured.push(args.join(' ')); };
  try {
    checkBudget('fixture', 10, fixtureBudget);
    checkBudget('fixture-over', 1500, fixtureBudget);
  } finally {
    console.warn = realWarn;
  }
  const measures = captured.filter((l) => l.startsWith('MEASURE '));
  assert.deepEqual(measures, [
    'MEASURE prompt-surface-budgets: fixture 10 B (advisory 1024, hard 2048)',
    'MEASURE prompt-surface-budgets: fixture-over 1500 B (advisory 1024, hard 2048)',
  ]);
  assert.equal(captured[0], measures[0], 'below the advisory line the MEASURE line is the only print');
  assert.equal(captured.length, 3, 'above the advisory line one WARN line follows the MEASURE line');
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
