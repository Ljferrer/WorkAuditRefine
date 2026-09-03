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
// Third family (plan 2026-08-24-authoring-side-verification T1.3): four advisory
// authoring-verification rules, also in SHAPE_RULES — (a) section-scoped `PIN-<n>` citation over
// the D1 class→section map (whole right-delimited token; anywhere fallback for class-less pins
// AND for a task-less `slice` cell; definition-without-citation reported), (b) Evidence-consumed
// block form (each linked artifact row read / unread-with-reason, D8), (c) single-signal oracle
// heuristic (bare `grep -q` / `test -f` on a `check:`/`Done when:` line — pair it with a decisive
// token, #1628 · PIN-12), and (d) `WAIVE-<n>` row form (five fields: id · beat · fired arm ·
// scope · reason — right-delimited id, plus a malformed-id arm for a letter-suffixed `WAIVE-1a`,
// D7).
//
// Fourth family (plan 2026-08-25-authoring-doctrine-and-lint-coherence D3, operator-ratified
// OD-1): the report-only ‡ INVENTORY rule (`twice-read-inventory`) — one advisory row per
// ‡-marked design-tree pin. ‡ is mandated authoring, never a defect, so this rule rides a
// SEPARATE informational channel: `lintInfo(text)`, excluded from `lint()`'s hits and from the
// CLI's `anyHit`, so `--strict` still exits 0 on a ‡-marked conforming plan.
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

// ---- Third-family anchors (plan 2026-08-24-authoring-side-verification, D1/D7/D8/#1628) ----
// The ratified `PIN-<n>` token grammar (PIN-3): digits-only id, matched as a whole
// right-delimited token — `PIN-1` never matches inside `PIN-13` (or `PIN-1a`; letter
// suffixes are illegal under the grammar, so a suffixed token is never a citation).
const PIN_TOKEN = /\bPIN-(\d+)(?!\w)/g;
const pinRe = (n) => new RegExp(`\\bPIN-${n}(?!\\w)`);
const DESIGN_TREE_H2 = /^##\s+.*\bdesign\s+tree\b/i;
const BACKSTOPS_H2 = /^##\s+Deferred\s+validations?\b/i;
// Bold-only markers: the plain phrases legitimately occur mid-prose (and inside the design
// tree's own D1 row), so only the merged-template bold label opens a region. Resolution is
// scoped to the tracked intent section's line span (D7) — a decoy bold label earlier in the
// document never redirects a citation target, and a doc with no intent heading yields null
// marks (no region at all), never a first-match region from somewhere else.
const GUARDRAILS_MARK = /\*\*Binding guardrails:?\*\*/i;
const END_STATE_MARK = /\*\*End state:?\*\*/i;
// D1's landing-class vocabulary; the class→section map lives in the pin-citation rule.
const CLASS_TOKEN = /^(guardrail|slice|end-state|backstop|context|non-goal)s?\b/i;
// D2's twice-read row marker: operator-applied, orthogonal to class. It is stripped before every
// class/arrow match (D3) and never widens CLASS_TOKEN.
const TWICE_READ_MARK = '‡';
const PIN_MARKED = /\bPIN-(\d+)‡/g;

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

// A `+`-combined class expression from one landing-class cell part, e.g.
// `guardrail + slice (T1.1, T1.3)` → [{cls:'guardrail'}, {cls:'slice', tasks:['1.1','1.3']}].
// Unknown class tokens are skipped (fail-open); a part yielding nothing leaves the pin class-less.
function parseClasses(expr) {
  const out = [];
  for (const c of expr.split('+')) {
    const t = c.trim();
    const m = t.match(CLASS_TOKEN);
    if (!m) continue;
    const entry = { cls: m[1].toLowerCase() };
    if (entry.cls === 'slice') entry.tasks = [...t.matchAll(/\bT(\d+(?:\.\d+)*)/g)].map((x) => x[1]);
    out.push(entry);
  }
  return out;
}

// D1's per-pin landing-class cell grammar: `·`-separated parts, each either a pin-scoped
// `PIN-<n>→<classes>` pair or a bare class expression — a single-class (arrow-less) cell
// covers all row pins.
// D3: the ‡ marker is stripped from the cell BEFORE the arrow-pair match and before
// parseClasses' class match, so every marked form parses into its real class — leading
// (`‡ guardrail`, which would otherwise fail CLASS_TOKEN's `^` anchor), trailing
// (`guardrail ‡`), and the arrow pair (`PIN-3‡→guardrail`, which would otherwise drop the pin
// entirely: the arrow regex's `(?!\w)\s*(?:→|->)` never matches across `‡`). Marks are recorded
// as they are stripped: `marked` holds arrow-pair-marked pin ids, `markedBare` says a bare part
// carried the marker (it covers every pin of the row, like the bare class expression itself).
function parseLandingCell(cell) {
  const map = new Map();
  const bare = [];
  const marked = new Set();
  let markedBare = false;
  for (const rawPart of cell.split('·')) {
    const hasMark = rawPart.includes(TWICE_READ_MARK);
    const part = rawPart.split(TWICE_READ_MARK).join('');
    const arrow = part.match(/\bPIN-(\d+)(?!\w)\s*(?:→|->)\s*(.+)/);
    if (arrow) {
      map.set(arrow[1], parseClasses(arrow[2]));
      if (hasMark) marked.add(arrow[1]);
    } else {
      bare.push(...parseClasses(part));
      if (hasMark) markedBare = true;
    }
  }
  return { map, bare, marked, markedBare };
}

// Design-tree table rows → [{ pin, classes }]. A header row naming the Landing-class column
// fixes the column indexes; headerless tables fall back to last cell = landing class,
// second-to-last = source. Defined pins are the Source-cell tokens plus any arrow-mapped
// pins (a Resolution-cell cross-reference to another row's pin is NOT a definition).
// classes === null marks a class-less pin (anywhere-citation fallback). `marked` is the D2 ‡
// row marker — set from a `PIN-<n>‡` id in the Source cell, from an arrow-pair-marked id, or
// from a marked bare landing cell (which covers every pin of the row).
function parseDesignTree(sectionLines) {
  const pins = [];
  let srcIdx = -1;
  let landIdx = -1;
  for (const line of sectionLines) {
    if (!/^\s*\|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 2 || cells.every((c) => /^[:\s-]*$/.test(c))) continue; // separator
    if (landIdx === -1) {
      landIdx = cells.findIndex((c) => /landing\s*class/i.test(c));
      srcIdx = cells.findIndex((c) => /^source$/i.test(c));
      if (landIdx !== -1) continue; // header row consumed
      landIdx = cells.length - 1; // headerless fallback
    }
    const source = cells[srcIdx >= 0 ? srcIdx : cells.length - 2] ?? '';
    const { map, bare, marked, markedBare } = parseLandingCell(cells[landIdx] ?? '');
    const srcMarked = new Set([...source.matchAll(PIN_MARKED)].map((m) => m[1]));
    const ids = new Set([...[...source.matchAll(PIN_TOKEN)].map((m) => m[1]), ...map.keys()]);
    for (const id of ids) {
      pins.push({
        pin: id,
        classes: map.get(id) ?? (bare.length ? bare : null),
        marked: markedBare || marked.has(id) || srcMarked.has(id),
      });
    }
  }
  return pins;
}

// The intent bullet opened at lines[start] (a bold-label marker line), through the line before
// the next sibling `- **…**` bullet or markdown heading.
function bulletRegion(lines, start) {
  let end = lines.length;
  for (let j = start + 1; j < lines.length; j += 1) {
    if (/^\s*-\s+\*\*/.test(lines[j]) || MD_HEADING.test(lines[j])) { end = j; break; }
  }
  return lines.slice(start, end).join('\n');
}

// One pass over the document into the view SHAPE_RULES scan. `planShaped` (an intent heading
// or `## Build order` present) gates the document-level ledger rule: a fragment that never
// claims to be a merged plan is not held to the template's required sections.
export function parsePlanShape(text) {
  const lines = text.split('\n');
  const doc = {
    endStateBullets: [], contextBlocks: [], taskBlocks: [], planShaped: false, hasLedger: false,
    // Third-family view: raw lines, design-tree pins, task-id → body, and the D1
    // class→section citation targets (null = section not found → anywhere fallback).
    lines, designPins: [], taskMap: new Map(),
    guardrailText: null, endStateText: null, backstopText: null, outsideDesignTree: text,
  };
  let designSpan = null;
  let intentSpan = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (INTENT_H2.test(line)) {
      doc.planShaped = true;
      const end = sectionEnd(lines, i, H2);
      doc.endStateBullets.push(...numberedBullets(lines.slice(i + 1, end)));
      if (intentSpan === null) intentSpan = [i, end];
    } else if (BUILD_ORDER_H2.test(line)) {
      doc.planShaped = true;
    } else if (LEDGER_H2.test(line)) {
      doc.hasLedger = true;
    } else if (CONTEXT_H2.test(line)) {
      doc.contextBlocks.push(...proseBlocks(lines.slice(i + 1, sectionEnd(lines, i, H2))));
    } else if (DESIGN_TREE_H2.test(line) && designSpan === null) {
      const end = sectionEnd(lines, i, H2);
      doc.designPins.push(...parseDesignTree(lines.slice(i + 1, end)));
      designSpan = [i, end];
    } else if (TASK_H3.test(line)) {
      const body = lines.slice(i + 1, sectionEnd(lines, i, MD_HEADING)).join('\n');
      doc.taskBlocks.push({ heading: line.trim(), body });
      const id = line.match(/^###\s+Task\s+([\d.]+)/i);
      if (id) doc.taskMap.set(id[1].replace(/\.$/, ''), body);
    }
  }
  // D7: both intent-bullet marks resolve INSIDE the tracked intent span, never document-wide —
  // a decoy bold `**Binding guardrails:**` in ## Context cannot capture the citation target, and
  // a doc with no intent heading yields null marks (the anywhere-citation fallback), not a
  // region borrowed from elsewhere.
  const markIn = (mark) => {
    if (intentSpan === null) return null;
    for (let i = intentSpan[0]; i < intentSpan[1]; i += 1) if (mark.test(lines[i])) return bulletRegion(lines, i);
    return null;
  };
  doc.guardrailText = markIn(GUARDRAILS_MARK);
  doc.endStateText = markIn(END_STATE_MARK);
  const bi = lines.findIndex((l) => BACKSTOPS_H2.test(l));
  if (bi !== -1) doc.backstopText = lines.slice(bi, sectionEnd(lines, bi, H2)).join('\n');
  if (designSpan) {
    doc.outsideDesignTree = [...lines.slice(0, designSpan[0]), ...lines.slice(designSpan[1])].join('\n');
  }
  return doc;
}

// The five §4f advisory rules, the four third-family authoring-verification rules (plan
// 2026-08-24-authoring-side-verification T1.3), and the report-only ‡ inventory (plan
// 2026-08-25-authoring-doctrine-and-lint-coherence D3). Each scan(doc) returns match strings;
// slot names the merged-template slot the rule checks. A rule with channel: 'info' reports on
// the informational channel only — see lintShape.
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
  {
    // (a) D1 · PIN-3: every pin defined in the design tree is cited — inside its declared
    // landing-class section per the class→section map (guardrail → Binding guardrails;
    // slice → each named task's slice; end-state → End state list; backstop → Deferred
    // validations; context/non-goal → the definition row suffices). Class-less pins fall back
    // to anywhere-citation outside the tree; a `slice` cell naming no task (D5) and an
    // unlocatable section fall back the same way (fail-open). Definition-without-citation is
    // reported either way.
    name: 'pin-citation',
    slot: '`## Resolved design tree` pin rows (`PIN-<n>` cited inside its landing-class section — D1 class→section map)',
    scan: (doc) => {
      const hits = [];
      for (const { pin, classes } of doc.designPins) {
        const re = pinRe(pin);
        if (classes === null) {
          if (!re.test(doc.outsideDesignTree)) hits.push(`PIN-${pin} defined but never cited`);
          continue;
        }
        for (const c of classes) {
          if (c.cls === 'context' || c.cls === 'non-goal') continue; // definition row suffices
          let targets;
          if (c.cls === 'guardrail') targets = [{ text: doc.guardrailText, desc: 'Binding guardrails' }];
          else if (c.cls === 'end-state') targets = [{ text: doc.endStateText, desc: 'the End state list' }];
          else if (c.cls === 'backstop') targets = [{ text: doc.backstopText, desc: 'Deferred validations' }];
          else if (!c.tasks?.length) {
            // D5: a `slice` cell that names no task carries no per-task target. It degrades to
            // the anywhere-citation fallback (the class-less arm) — never a fan-out over every
            // task in the plan, which would report one hit per uncited task block.
            if (!re.test(doc.outsideDesignTree)) hits.push(`PIN-${pin} defined but never cited`);
            continue;
          } else {
            targets = c.tasks.map((id) => ({ text: doc.taskMap.get(id) ?? null, desc: `Task ${id}'s slice` }));
          }
          for (const t of targets) {
            if (t.text === null) {
              if (!re.test(doc.outsideDesignTree)) hits.push(`PIN-${pin} uncited (${t.desc} not found; anywhere fallback failed)`);
            } else if (!re.test(t.text)) {
              hits.push(`PIN-${pin} uncited in ${t.desc}`);
            }
          }
        }
      }
      return hits;
    },
  },
  {
    // (b) D8: every row of an Evidence-consumed block is `read` or `unread` with a reason.
    // A block opens at the bold `**Evidence consumed**` label (or a bare label line) — never at
    // a mid-prose mention or a design-tree table cell — and runs over the list/table rows below.
    name: 'evidence-consumed-form',
    slot: 'Evidence consumed block (every linked artifact row read / unread-with-reason — D8)',
    scan: (doc) => {
      const hits = [];
      const MARKER = /^\s*(?:[-*]\s+)?\*\*Evidence[- ]consumed\*\*|^\s*Evidence[- ]consumed\s*:?\s*$/i;
      for (let i = 0; i < doc.lines.length; i += 1) {
        if (!MARKER.test(doc.lines[i]) || /^\s*\|/.test(doc.lines[i])) continue;
        let j = i + 1;
        while (j < doc.lines.length && doc.lines[j].trim() === '') j += 1;
        for (; j < doc.lines.length && /^\s*(?:[-*]\s|\|)/.test(doc.lines[j]); j += 1) {
          const row = doc.lines[j];
          if (/^\s*\|[\s:|-]*$/.test(row)) continue; // table separator
          if (/\bunread\b/i.test(row)) {
            if (!/\bunread\b\s*[—–:(-]?\s*\S/i.test(row)) hits.push(`unread without reason: ${bulletHead(row)}`);
          } else if (!/\bread\b/i.test(row)) {
            hits.push(`row lacks read / unread-with-reason: ${bulletHead(row)}`);
          }
        }
        i = j - 1;
      }
      return hits;
    },
  },
  {
    // (c) #1628 · PIN-12 oracle duality: a `check:` / `Done when:` line whose oracle is a bare
    // single-signal `grep -q` or `test -f`/`-e` proves presence only — pair it with a decisive
    // token (e.g. NEW-present && OLD-absent). A line already carrying `&&`/`||` is a pair.
    name: 'single-signal-oracle',
    slot: '`check:` / `Done when:` oracle lines (single-signal `grep -q` / `test -f` — pair it with a decisive token, #1628)',
    scan: (doc) => {
      const hits = [];
      for (const line of doc.lines) {
        if (!/\b(?:check|done\s+when)\s*:/i.test(line)) continue;
        if (/&&|\|\|/.test(line)) continue;
        const m = line.match(/\bgrep\s+-\w*q\w*\b|\btest\s+-[ef]\b/);
        if (m) hits.push(m[0].trim());
      }
      return hits;
    },
  },
  {
    // (d) D7: a `WAIVE-<n>` row (a row-initial right-delimited id — a mid-prose mention or the
    // doctrine's `WAIVE-<n>` placeholder is not a row) carries all five `·`-separated fields.
    // The id is right-delimited by `(?!\w)`, the sibling `PIN-<n>` grammar — so a letter-suffixed
    // `WAIVE-1a` is not a well-formed row id. Tightening alone would make such a row INVISIBLE
    // to the rule (less advisory signal), so the malformed id is reported on its own arm.
    name: 'waive-row-form',
    slot: '`WAIVE-<n>` rows (five fields: id · beat · fired arm · scope · reason — right-delimited id, D7)',
    scan: (doc) => {
      const hits = [];
      const ROW = /^\s*(?:[-*]\s+|\|\s*)?[`*]*WAIVE-\d+/;
      for (const line of doc.lines) {
        // A digit-run followed by a letter or `_` — `WAIVE-12` never backtracks into this arm.
        if (ROW.test(line) && /^\s*(?:[-*]\s+|\|\s*)?[`*]*WAIVE-\d+[A-Za-z_]/.test(line)) {
          hits.push(`${bulletHead(line)} — malformed WAIVE id — letter suffixes are illegal`);
          continue;
        }
        if (!/^\s*(?:[-*]\s+|\|\s*)?[`*]*WAIVE-\d+(?!\w)/.test(line)) continue;
        const fields = line.replace(/^\s*(?:[-*]\s+|\|\s*)/, '').split('·').map((s) => s.trim()).filter(Boolean);
        if (fields.length < 5) hits.push(`${bulletHead(line)} — ${fields.length} of 5 fields (id · beat · fired arm · scope · reason)`);
      }
      return hits;
    },
  },
  {
    // (e) D3 · OD-1: the report-only ‡ inventory — one advisory row per ‡-marked design-tree
    // pin, surfaced at conversion so the operator can see what gets read twice at echo-back.
    // channel: 'info' keeps it OFF the hit channel: `lint()` never returns it and the CLI never
    // counts it in `anyHit`, so a ‡-marked conforming plan still exits 0 under `--strict`.
    // ‡-marking is mandated authoring under D2/D4 — an inventory row is never a defect.
    name: 'twice-read-inventory',
    channel: 'info',
    slot: '`## Resolved design tree` pin rows (‡-marked pins — read twice at echo-back reconciliation; report-only)',
    scan: (doc) => doc.designPins
      .filter((p) => p.marked)
      .map((p) => `PIN-${p.pin} is ‡-marked — twice-read at echo-back`),
  },
];

// Splits the shape rules by channel: `hits` are the advisory defects, `info` the report-only
// rows (channel: 'info') that must never reach the hit channel or the CLI's exit contract.
function lintShape(text) {
  const doc = parsePlanShape(text);
  const hits = [];
  const info = [];
  for (const rule of SHAPE_RULES) {
    const out = rule.channel === 'info' ? info : hits;
    for (const match of rule.scan(doc)) out.push({ pattern: rule.name, match, slot: rule.slot });
  }
  return { hits, info };
}

// Returns [{ pattern, match, slot? }] — line-level hits first, then shape hits (slot-bearing).
// Report-only informational rows are NOT here; read them with lintInfo.
export function lint(text) {
  return [...lintLines(text), ...lintShape(text).hits];
}

// The informational channel: [{ pattern, match, slot }] from the channel: 'info' shape rules.
// Never part of lint()'s hits, never part of the CLI's exit contract.
export function lintInfo(text) {
  return lintShape(text).info;
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
    // The informational channel prints after the hits and never touches anyHit — a ‡-marked
    // conforming plan stays exit 0, including under --strict.
    for (const h of lintInfo(text)) process.stdout.write(`  info ${h.pattern}: ${h.match}\n`);
  }
  process.exit(strict && anyHit ? 1 : 0);
}

// Run as CLI only, never when imported by the test suite.
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  main(process.argv.slice(2));
}
