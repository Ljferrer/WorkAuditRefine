#!/usr/bin/env node
// plan-literal-lint — advisory scan for stack-fragile literals in a war-shaped plan.
//
// Modeled on war-memory.mjs's LINT_PATTERNS array + lint(text) + CLI shape (no parser, no deps —
// node:fs only). Flags the cheap, high-precision literal antipatterns the /war-strategy plan
// template teaches authors to avoid: a :N-M line-range locator, a concrete *.test.sh gate
// enumeration, a stale "ALL FIVE suites" count, and a hardcoded version inside a release task
// (spec §4.3); plus an un-backticked path on a `- Files:` line — the campaign ledger's extractFiles
// reads backticked tokens, so a bare path silently narrows a plan's ingested footprint.
//
// Second family (spec 2026-08-04-interview-and-authoring-contract §4f): five advisory
// merged-template SHAPE RULES in SHAPE_RULES below — untagged End-state bullet, `requiresTest:
// true` without `Done when:`, missing `## Assumptions ledger`, untagged factual claim shape in
// `## Context`, and vague-trigger vocabulary in End states. Each rule's `slot` text names the
// merged-template slot it checks (war-strategy SKILL.md §2), and the CLI prints it beside the hit.
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
//   releaseScoped — only fires inside a task/phase heading naming a release/version bump;
//   stripBackticks — remove `backtick spans` from the line before running re (so a compliant
//                    backticked token can't trip a rule that only cares about bare tokens).
// Extending the line-level lint is editing this array (the war-memory.mjs idiom); the
// merged-template shape rules (section/bullet/task-block scoped) live in SHAPE_RULES below.
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
  {
    // A `- Files:` line should back-tick every path (comma-separated) so the campaign ledger's
    // extractFiles reads it (war-strategy §2). stripBackticks removes the compliant backticked
    // spans; any surviving path-shaped token — one containing a `/`, or a bare dotted-extension
    // token like `foo.mjs` — is an un-backticked path, so flag it. DELIBERATELY LOOSE, an
    // independent advisory heuristic, NOT a mirror of the ledger's isPathShaped (unexported;
    // mirroring it would add a cross-skill dep edge and serialize the phase). Divergence costs
    // only advisory noise or a missed nudge — the fail-loud extractFiles/assertOrderable throw is
    // the real backstop, so there is no sync contract to drift-guard.
    name: 'bare-files-path',
    re: /[\w.-]+\/[\w./-]*|\b[\w-]+\.[A-Za-z][\w-]*\b/g,
    requireOnLine: /^\s*-\s*Files:/i,
    stripBackticks: true,
  },
];

// A markdown heading or a **Task N** / **Phase N** bold heading resets release scope.
const HEADING = /^(?:#{1,6}\s|\s*[-*]*\s*\*\*(?:task|phase)\b)/i;
const RELEASE_HEADING = /\b(?:release|version\s+bump)\b/i;

// ---------------------------------------------------------------------------
// Merged-template shape rules (spec §4f). Structural — scoped to a section, a logical bullet,
// a task block, or the whole document — so they cannot be per-line LINT_PATTERNS entries: a D5
// tag legitimately sits on a continuation line of its End-state bullet. Extending the shape
// lint is editing SHAPE_RULES; each entry scans a parsed doc view and its `slot` names the
// merged-template slot it checks.
// ---------------------------------------------------------------------------

// Section headings of the merged plan template (war-strategy SKILL.md §2). Both intent arms
// are recognized (ADR 0014: `## Commander's Intent` and `## AI-Commander's Intent`).
const INTENT_H2 = /^##\s+(?:AI-)?Commander['’]s\s+Intent\b/i;
const CONTEXT_H2 = /^##\s+Context\b/i;
const LEDGER_H2 = /^##\s+Assumptions\s+ledger\b/i;
const BUILD_ORDER_H2 = /^##\s+Build\s+order\b/i;
const TASK_H3 = /^###\s+Task\b/i;
const H2 = /^##\s/;
const MD_HEADING = /^#{1,6}\s/;

// D5's closed End-state tag set: `check:` | `gate:` | `HARD at audit_sha` | `backstop:` row.
const END_STATE_TAG = /\b(?:check|gate|backstop):|\bHARD at audit_sha\b/i;
// Spec §4f's vague-trigger vocabulary, verbatim.
const VAGUE_TRIGGER = /\b(?:properly|correctly|coherent)\b/gi;
// D4/D11/D14 evidence-tag shapes: `(user)` / `(verified: …)` / `[assumed: …]` / `AI-declared`.
const CLAIM_TAG = /\((?:user\b|verified:)|\[assumed\b|\bAI-declared\b/i;
// Factual-claim shape (deliberately narrow, advisory): a percentage, an `N of M` count, or a
// hyphenated measurement like `57-finding` / `7-line`. Dates (2026-08-04) and version literals
// don't match — bare digits alone are NOT a claim shape, precision over recall.
const CLAIM_SHAPE = /~?\d+(?:\.\d+)?\s?%|\b\d+\s+of\s+\d+\b|\b\d+-[a-z]+\b/i;

// First line of a logical bullet, truncated — the reportable head of a multi-line item.
const bulletHead = (b) => b.split('\n')[0].trim().slice(0, 80);

// End of the section opened at lines[start]: index of the next line matching boundary.
function sectionEnd(lines, start, boundary) {
  for (let i = start + 1; i < lines.length; i += 1) if (boundary.test(lines[i])) return i;
  return lines.length;
}

// Numbered items (`1. …`) with their continuation lines joined; a blank line or heading ends
// an item. Deliberately loose on trailing dash-bullets (advisory tool, not a markdown parser).
function numberedBullets(sectionLines) {
  const out = [];
  let cur = null;
  for (const line of sectionLines) {
    if (/^\s*\d+\.\s/.test(line)) {
      if (cur !== null) out.push(cur);
      cur = line;
    } else if (cur !== null) {
      if (line.trim() === '' || MD_HEADING.test(line)) {
        out.push(cur);
        cur = null;
      } else {
        cur += `\n${line}`;
      }
    }
  }
  if (cur !== null) out.push(cur);
  return out;
}

// Logical blocks of a prose section: each `- `/`* ` bullet (with continuations) or each
// blank-line-separated paragraph is one block — so a tag anywhere in the block covers it.
function proseBlocks(sectionLines) {
  const out = [];
  let cur = null;
  for (const line of sectionLines) {
    if (line.trim() === '') {
      if (cur !== null) out.push(cur);
      cur = null;
    } else if (/^\s*[-*]\s/.test(line)) {
      if (cur !== null) out.push(cur);
      cur = line;
    } else {
      cur = cur === null ? line : `${cur}\n${line}`;
    }
  }
  if (cur !== null) out.push(cur);
  return out;
}

// One pass over the document into the view SHAPE_RULES scan. `planShaped` (an intent heading
// or `## Build order` present) gates the document-level ledger rule: a fragment that never
// claims to be a merged plan is not held to the template's required sections.
function parsePlanShape(text) {
  const lines = text.split('\n');
  const doc = { endStateBullets: [], contextBlocks: [], taskBlocks: [], planShaped: false, hasLedger: false };
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (INTENT_H2.test(line)) {
      doc.planShaped = true;
      doc.endStateBullets.push(...numberedBullets(lines.slice(i + 1, sectionEnd(lines, i, H2))));
    } else if (BUILD_ORDER_H2.test(line)) {
      doc.planShaped = true;
    } else if (LEDGER_H2.test(line)) {
      doc.hasLedger = true;
    } else if (CONTEXT_H2.test(line)) {
      doc.contextBlocks.push(...proseBlocks(lines.slice(i + 1, sectionEnd(lines, i, H2))));
    } else if (TASK_H3.test(line)) {
      doc.taskBlocks.push({
        heading: line.trim(),
        body: lines.slice(i + 1, sectionEnd(lines, i, MD_HEADING)).join('\n'),
      });
    }
  }
  return doc;
}

// The five §4f advisory rules. Each scan(doc) returns match strings; slot names the
// merged-template slot the rule checks.
export const SHAPE_RULES = [
  {
    // D5/D18: every numbered End-state bullet carries one tag from the closed set.
    name: 'untagged-end-state',
    slot: "`## Commander's Intent` End state list (numbered, each tagged `check:` | `gate:` | `HARD at audit_sha` | `backstop:`)",
    scan: (doc) => doc.endStateBullets.filter((b) => !END_STATE_TAG.test(b)).map(bulletHead),
  },
  {
    // D5: `Done when: <command>` is required iff `requiresTest: true`.
    name: 'requires-test-without-done-when',
    slot: 'per-task `Done when:` (merged-template `### Task N:` block — required iff `requiresTest: true`)',
    scan: (doc) => doc.taskBlocks
      .filter((t) => /requiresTest:\s*true/i.test(t.body) && !/\bDone when:/i.test(t.body))
      .map((t) => t.heading),
  },
  {
    // D19: one ledger, a required section (ADR 0017 — explicit None allowed, never omitted).
    name: 'missing-assumptions-ledger',
    slot: '`## Assumptions ledger` (required merged-template section — explicit None allowed)',
    scan: (doc) => (doc.planShaped && !doc.hasLedger ? ['`## Assumptions ledger` heading absent'] : []),
  },
  {
    // D4: an untagged claim of fact is a bug; the tag may sit anywhere in the claim's block.
    name: 'untagged-context-claim',
    slot: '`## Context — the gap / problem` tagged claims (`(user)` / `(verified: …)` / `[assumed: …]`)',
    scan: (doc) => doc.contextBlocks
      .filter((b) => CLAIM_SHAPE.test(b) && !CLAIM_TAG.test(b))
      .map((b) => b.match(CLAIM_SHAPE)[0].trim()),
  },
  {
    // §4f: "properly" / "correctly" / "coherent" in an End state — replace with an observable.
    name: 'vague-end-state',
    slot: "`## Commander's Intent` End state list (observable outcomes — no vague-trigger vocabulary)",
    scan: (doc) => doc.endStateBullets.flatMap((b) => [...b.matchAll(VAGUE_TRIGGER)].map((m) => m[0])),
  },
];

function lintShape(text) {
  const doc = parsePlanShape(text);
  const hits = [];
  for (const rule of SHAPE_RULES) {
    for (const match of rule.scan(doc)) hits.push({ pattern: rule.name, match, slot: rule.slot });
  }
  return hits;
}

// Returns [{ pattern, match, slot? }] — line-level hits first, then shape hits (slot-bearing).
export function lint(text) {
  return [...lintLines(text), ...lintShape(text)];
}

// Line-based so context guards (gate directive, release heading) work.
function lintLines(text) {
  const hits = [];
  let inRelease = false;
  for (const line of text.split('\n')) {
    if (HEADING.test(line)) inRelease = RELEASE_HEADING.test(line);
    for (const p of LINT_PATTERNS) {
      if (p.releaseScoped && !inRelease) continue;
      if (p.requireOnLine && !p.requireOnLine.test(line)) continue;
      // stripBackticks entry guard: run re against the line with `backtick spans` removed, so a
      // compliant backticked token doesn't trip a rule (bare-files-path) that only wants bare ones.
      const target = p.stripBackticks ? line.replace(/`[^`]*`/g, '') : line;
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(target)) !== null) {
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
      // Shape hits carry the merged-template slot they check; print it so the advice lands.
      for (const h of hits) process.stdout.write(`  ${h.pattern}: ${h.match}${h.slot ? `  [slot: ${h.slot}]` : ''}\n`);
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
