// reference-link-integrity.test.mjs — durable link-resolution + retired-citation +
// header-truth + revert-doctrine sweep over the two prose roots that carry references/
// pointers (plan 2026-08-02-references-pointer-link-truth Task 1.3; source spec
// docs/specs/2026-08-02-references-pointer-link-truth-design.md §4.6, and the mechanical
// homes for that plan's End states 4-6).
//
// Why a NEW sibling file rather than a skill-doc-contracts.test.mjs block: the spec
// sanctions either ("or sibling"); a separate file keeps this guard file-disjoint from the
// concurrent campaign plans that own skill-doc-contracts.test.mjs and
// workflow-template.test.mjs. Auto-discovered by `node --test 'skills/**/*.test.mjs'` — no
// wiring needed.
//
// Self-match note (the coupling-comment lesson — a comment that restates a sweep's own
// pattern bytes becomes a hit for that sweep): the scans below read ONLY *.md files under
// agents/ and skills/war/references/. This file is a .mjs under skills/war/assets/, so
// neither its pattern literals nor the carrier names quoted in these comments can ever be
// counted by the sweeps they document.
//
// Root is resolved from import.meta.url — NEVER process.cwd() (the suite's standing idiom:
// a subagent's cwd is the main repo and resets between bash calls).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)); // skills/war/assets
const REPO_ROOT = join(HERE, '..', '..', '..');

// Directory SCAN, never a hand-enumerated file list: a renamed or added surface must widen
// this sweep, never silently narrow it (the enumerated-destination existsSync fail-open
// lesson — an enumerated list turns a rename into a quietly skipped file).
const AGENTS_DIR = 'agents';
const REFERENCES_DIR = 'skills/war/references';
const SCAN_DIRS = [AGENTS_DIR, REFERENCES_DIR];

function scan(dir) {
  return readdirSync(join(REPO_ROOT, dir))
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => ({
      dir,
      rel: `${dir}/${f}`,
      abs: join(REPO_ROOT, dir, f),
      text: readFileSync(join(REPO_ROOT, dir, f), 'utf8'),
    }));
}

const SCANNED = SCAN_DIRS.flatMap(scan);

// --- Construct extraction ----------------------------------------------------------
// Shared by the header-truth and revert-doctrine arms. Anchored on headings, never on line
// numbers — line numbers rot across the serial merge queue.

/** Text preceding the file's first `## ` heading (the whole file when it has none). */
function headerRegion(text) {
  const m = /^## /m.exec(text);
  return m ? text.slice(0, m.index) : text;
}

/**
 * Region from the first `## ` heading matching `headingRe` (pass a NON-global regex — a
 * /g/ regex would carry lastIndex state across lines) through the next `## ` heading or
 * EOF. Returns null when no heading matches, so callers can assert the section was found
 * instead of passing an empty region through a keyword loop that would vacuously succeed.
 */
function sectionByHeading(text, headingRe) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith('## ') && headingRe.test(l));
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].startsWith('## ')) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

// --- Arm 1: link resolution ---------------------------------------------------------
// Inline links in the `](target)` form, with markdown's optional `"title"` suffix.
// Reference-style links (`[text][label]`) are deliberately out of scope: none exist in the
// scanned set, and the resolution question they raise belongs to the link DEFINITION.
const LINK_TARGET = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const LINK_OPEN = /\]\(/g;

test('reference link integrity — every markdown link target under agents/ and skills/war/references/ resolves to a real file', () => {
  // Non-vacuity floor: an empty scan would satisfy every assert below without checking
  // anything (delete-the-feature test: the sweep must be observably running).
  for (const dir of SCAN_DIRS) {
    assert.ok(
      SCANNED.some((f) => f.dir === dir),
      `scan of ${dir}/ found no *.md files — every assert in this suite would pass vacuously`,
    );
  }

  const dead = [];
  const resolvedPerDir = new Map(SCAN_DIRS.map((d) => [d, 0]));

  for (const file of SCANNED) {
    const targets = [...file.text.matchAll(LINK_TARGET)].map((m) => m[1]);
    // Parse completeness — fail CLOSED rather than silently skipping a link form the
    // extractor does not recognise (the same silent-narrowing hazard the directory scan
    // above closes for files). If a legitimate NON-link `](` ever lands in a scanned .md
    // (inside a fenced code block, say), widen the extractor or except that case
    // explicitly here; deleting this check would reopen the hazard, not fix it.
    const opens = (file.text.match(LINK_OPEN) || []).length;
    assert.equal(
      targets.length,
      opens,
      `${file.rel}: the link extractor parsed ${targets.length} of ${opens} '](' occurrences — an unrecognised link form would be swept silently`,
    );

    for (const raw of targets) {
      if (raw.startsWith('#')) continue; // in-page anchor
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) continue; // absolute URL, any scheme
      const target = raw.split('#')[0]; // strip the #fragment suffix
      if (!target) continue;
      // RESOLUTION-ONLY, deliberately not a shape assert. references/ files resolve from
      // their own directory; agents/ files resolve file-relative OR repo-root-relative,
      // because the D4 agent-card pointer skeleton (`skills/war/references/<file>`) is
      // deliberately repo-root-anchored and must not false-red (adjudication O(2)).
      // Accepted looseness, recorded rather than engineered away: a dead agents/ link could
      // coincidentally resolve under the other root. Both roots are inside the repo, so any
      // resolution is a real file, and per-shape enumeration would reintroduce the
      // enumerated-list fail-open hazard this scan exists to avoid.
      // Link SHAPE stays per-card in workflow-template.test.mjs (worker/servitor/refiner +
      // auditor): a scan-wide no-`../` assert here would RED on agents/war-setup-scout.md's
      // two deliberately deferred `../` links (spec §9) and is out of this sweep's scope.
      const roots = file.dir === AGENTS_DIR ? [dirname(file.abs), REPO_ROOT] : [dirname(file.abs)];
      if (roots.some((r) => existsSync(resolve(r, target)))) {
        resolvedPerDir.set(file.dir, resolvedPerDir.get(file.dir) + 1);
      } else {
        dead.push(`${file.rel} -> ${raw}`);
      }
    }
  }

  // Second non-vacuity floor: each root must have contributed at least one resolvable
  // target, so an extractor that stopped matching cannot pass as "no dead links".
  for (const dir of SCAN_DIRS) {
    assert.ok(
      resolvedPerDir.get(dir) > 0,
      `no resolvable markdown link target found under ${dir}/ — the resolution arm did not actually run`,
    );
  }
  // Custom message suppresses node:assert's generated diff, so the delta is interpolated by
  // hand (the assert-deepEqual-custom-message lesson).
  assert.deepEqual(
    dead,
    [],
    `dead markdown link target(s) — each resolves under neither permitted root:\n  ${dead.join('\n  ')}`,
  );
});

// --- Arm 2: the retired citation form ------------------------------------------------
// The retired form is ONE parenthetical carrying both `SKILL.md` and the
// co-source-of-truth phrase — the dangling citation that named SKILL.md as the home of
// doctrine which had already moved to submodule-flows.md.
//
// Keyed on the CITATION FORM, never the bare phrase (the backstop-retirement-grep
// false-red lesson: sweep for the retired form, never for a substring the sanctioned
// replacement also carries). Three carriers of the bare phrase are ratified and must stay
// unflagged:
//   1. submodule-flows.md's own "Resume — submodule remote as co-source-of-truth" section
//      heading and body — the doctrine's real home;
//   2. design.md's co-source-of-truth paragraph;
//   3. auditor-teach.md's Gitlink-bump pin-validity step-4 replacement citation, which
//      pairs `submodule-flows.md` — never SKILL.md — with the phrase.
// BOTH token orders are covered (red-team adjudication 6, 2026-08-03: a single-order guard
// false-negates on a reversed-order reintroduction of the identical dangling citation), and
// the match is case-insensitive. Keeping the match scoped inside one parenthetical is what
// leaves the three sanctioned carriers above green.
const RETIRED_CITATION = /\([^)]*(?:SKILL\.md[^)]*co-source-of-truth|co-source-of-truth[^)]*SKILL\.md)[^)]*\)/gi;

test('reference link integrity — the retired SKILL.md co-source-of-truth citation form is absent from both prose roots', () => {
  const hits = [];
  for (const file of SCANNED) {
    for (const m of file.text.matchAll(RETIRED_CITATION)) hits.push(`${file.rel}: ${m[0]}`);
  }
  assert.deepEqual(
    hits,
    [],
    `retired citation form (SKILL.md + the co-source-of-truth phrase inside one parenthetical) — cite submodule-flows.md's own section instead:\n  ${hits.join('\n  ')}`,
  );
});

// --- Arm 3: header truth --------------------------------------------------------------
// The four references/ files whose eviction headers this pass re-qualified. Read by direct
// readFileSync and NOT filtered out of the scan results: fail-closed, so a rename throws
// ENOENT loudly instead of narrowing the check to whatever files still happen to match.
const QUALIFIED_HEADERS = [
  'resume-and-recovery.md',
  'submodule-flows.md',
  'worker-servitor-edges.md',
  'auditor-teach.md',
];

test('reference link integrity — the re-basing caveat is retired everywhere and every re-qualified header says "at eviction time"', () => {
  // OLD-absent half. A default flip is only landed when the retired wording is gone from
  // every surface, not merely replaced on the files this pass touched — so the sweep runs
  // over the whole scanned set (a superset of the mandated skills/war/references/ scope).
  //
  // Keyed on a CASE-INSENSITIVE, mid-sentence-stable substring, never the sentence-initial
  // capitalised form: the capitalised anchor is the recorded sentence-case false-negative
  // class (red-team adjudication 1, 2026-08-03 — reproduced, a lowercase mid-sentence
  // reintroduction left an equivalent guard fully green while the retired doctrine was
  // live). The hand grep floor for the same fact is `grep -rin`, never `grep -rn`.
  const RETIRED_REBASING_CAVEAT = /link paths inside the moved blocks/i;
  const offenders = SCANNED.filter((f) => RETIRED_REBASING_CAVEAT.test(f.text)).map((f) => f.rel);
  assert.deepEqual(
    offenders,
    [],
    `retired re-basing caveat — no header may still instruct readers to mentally re-base an evicted block's relative links; rewrite the targets instead:\n  ${offenders.join('\n  ')}`,
  );

  // NEW-present half, scoped to the HEADER REGION of each named file — the text before its
  // first `## ` heading — never a whole-file substring check (red-team adjudication 4,
  // 2026-08-03: a whole-file check is satisfiable by body prose anywhere in the file,
  // including sections appended long after the header's claim was written). Case-insensitive
  // so retitling the qualification to a sentence-initial `**At eviction time**,` cannot
  // false-RED.
  for (const name of QUALIFIED_HEADERS) {
    const header = headerRegion(readFileSync(join(REPO_ROOT, REFERENCES_DIR, name), 'utf8'));
    assert.match(
      header,
      /at eviction time/i,
      `${REFERENCES_DIR}/${name}: the header's byte-identity claim is not qualified "at eviction time" (checked in the header region — the text before the file's first '## ' heading)`,
    );
  }
});

// --- Arm 4: the phase-close revert doctrine ------------------------------------------

test('reference link integrity — resume-and-recovery.md carries the phase-close-polish-revert doctrine as a locatable construct', () => {
  const text = readFileSync(join(REPO_ROOT, REFERENCES_DIR, 'resume-and-recovery.md'), 'utf8');
  // Located by HEADING, tolerant of its exact wording (the plan left the heading text to the
  // authoring worker's judgment) — and asserted non-vacuously: a renamed or deleted section
  // fails here rather than feeding an empty region to the keyword loop below.
  const section = sectionByHeading(text, /phase-close.*revert/i);
  assert.ok(
    section !== null,
    `${REFERENCES_DIR}/resume-and-recovery.md: no top-level '## ' heading matching the phase-close revert doctrine section was found`,
  );

  assert.match(
    section,
    /^\**Trigger:/m,
    `${REFERENCES_DIR}/resume-and-recovery.md revert-doctrine section: no line-initial 'Trigger:' line (ADR 0042's trigger shape)`,
  );

  // Duty keywords by construct, never by line number, each labelled so a failure names the
  // duty that went missing rather than a raw pattern.
  const DUTIES = [
    ['the not-a-moved-block provenance token', /not a moved block/i],
    ['the added-post-eviction provenance note', /post-eviction/i],
    ['duty 1 — run the gate at the reverted commit', /gate at the reverted commit/i],
    ['duty 2 — the green-by-deletion diff', /green-by-deletion/i],
    ['duty 3 — re-land with a real rationale', /rationale/i],
    ['duty 3 — naming which findings are re-opened', /re-?opened/i],
    ['duty 4 — the fix-set comparison', /fix-set/i],
    ['duty 4 — compared by finding title/file', /title\/file/i],
  ];
  for (const [label, pattern] of DUTIES) {
    assert.match(
      section,
      pattern,
      `${REFERENCES_DIR}/resume-and-recovery.md revert-doctrine section is missing ${label}`,
    );
  }
});
