// reference-link-integrity.test.mjs — durable link-resolution + retired-citation +
// header-truth + revert-doctrine + step-4-citation sweep over the two prose roots that
// carry references/ pointers (plan 2026-08-02-references-pointer-link-truth Task 1.3;
// source spec docs/specs/2026-08-02-references-pointer-link-truth-design.md §4.6, and the
// mechanical homes for that plan's End states 4-6; hardened by plan
// 2026-08-06-references-pointer-integrity Task 1.1 — anchored-form resolution,
// whitespace-tolerant retirement patterns, fail-closed headerRegion, #1277 presence arm).
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

/**
 * Text preceding the file's first `## ` heading. Returns null for a document with no `## `
 * heading — fail CLOSED (#1275 secondary), so a heading-stripped file surfaces as a loud
 * per-file assertion at the call site instead of silently widening the "header" to the
 * entire document and letting body prose satisfy a header-scoped check. Every call site
 * asserts non-null, naming the file it read.
 */
function headerRegion(text) {
  const m = /^## /m.exec(text);
  return m ? text.slice(0, m.index) : null;
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

test('reference link integrity — headerRegion fails closed on a heading-less document (synthetic fixtures)', () => {
  // Committed lock for the fail-closed flip (Task 1.1(c)): every file in the live scanned
  // corpus carries a `## ` heading, so without these synthetic fixtures the null branch
  // would be committed yet unobservable on the committed corpus — the wrapped-control
  // discipline (D7), applied to the extraction axis.
  assert.equal(
    headerRegion('a document with a title line\nand prose, but no h2 heading anywhere\n'),
    null,
    'fail-closed lock — headerRegion must return null for a document with no "## " heading',
  );
  assert.equal(
    headerRegion('preamble line\n## first heading\nbody\n'),
    'preamble line\n',
    'non-null control — headerRegion must return exactly the text before the first "## " heading',
  );
});

// --- Arm 1: link resolution ---------------------------------------------------------
// Inline links in the `](target)` form, with markdown's optional `"title"` suffix.
// Reference-style links (`[text][label]`) are deliberately out of scope: none exist in the
// scanned set, and the resolution question they raise belongs to the link DEFINITION.
const LINK_TARGET = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const LINK_OPEN = /\]\(/g;

// The ratified agent-card pointer FAMILY shape is plugin-root-anchored (the supersession
// ADR, cited by slug — agent-card-pointer-skeleton-plugin-root-anchored — never by number:
// the ADR lands in this same wave, so no number is knowable here). The prefix is spelled as
// a plain single-quoted string, NEVER inside a JS template literal — there the placeholder
// would interpolate; here it is data (D6).
const PLUGIN_ROOT_PREFIX = '${CLAUDE_PLUGIN_ROOT}/';

/**
 * Permitted resolution roots for one link target — the resolver states TOLERANCE (D6),
 * deliberately not shape: a file-relative target resolves from the carrying file's own
 * directory; an agents/ target additionally resolves repo-root-relative; and a target
 * beginning with the literal plugin-root placeholder resolves its remainder against
 * REPO_ROOT (plugin root ≡ repo root in this repo), from either scan dir. Link SHAPE
 * enforcement stays per-card in workflow-template.test.mjs — a scan-wide shape assert here
 * is out of this sweep's scope.
 */
function resolutionRoots(file, target) {
  if (target.startsWith(PLUGIN_ROOT_PREFIX)) {
    return { roots: [REPO_ROOT], rel: target.slice(PLUGIN_ROOT_PREFIX.length) };
  }
  return {
    roots: file.dir === AGENTS_DIR ? [dirname(file.abs), REPO_ROOT] : [dirname(file.abs)],
    rel: target,
  };
}

test('reference link integrity — every markdown link target under agents/ and skills/war/references/ resolves to a real file', () => {
  // Non-vacuity floor: an empty scan would satisfy every assert below without checking
  // anything (delete-the-feature test: the sweep must be observably running).
  for (const dir of SCAN_DIRS) {
    assert.ok(
      SCANNED.some((f) => f.dir === dir),
      `scan of ${dir}/ found no *.md files — every assert in this suite would pass vacuously`,
    );
  }

  // Positive control (non-vacuity, the D7 control discipline): the anchored form must
  // resolve here and now, BEFORE any scanned card carries it — a broken prefix literal
  // would otherwise first surface as a confusing dead-link red at the card-flip task's
  // merge. Probe target: this suite file itself, which always exists.
  const anchoredProbe = resolutionRoots(
    { dir: REFERENCES_DIR, abs: join(REPO_ROOT, REFERENCES_DIR, 'auditor-teach.md') },
    PLUGIN_ROOT_PREFIX + 'skills/war/assets/reference-link-integrity.test.mjs',
  );
  assert.deepEqual(
    anchoredProbe,
    { roots: [REPO_ROOT], rel: 'skills/war/assets/reference-link-integrity.test.mjs' },
    'anchored-form control failed — a plugin-root-anchored target must resolve its remainder against REPO_ROOT alone',
  );
  assert.ok(
    existsSync(resolve(anchoredProbe.roots[0], anchoredProbe.rel)),
    'anchored-form control failed — the probe remainder did not resolve to a real file under REPO_ROOT',
  );

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
      // RESOLUTION-ONLY, deliberately not a shape assert — resolutionRoots() above states
      // the resolver's tolerance: file-relative, repo-root-relative, and plugin-root-
      // anchored targets ALL resolve. Accepted looseness, recorded rather than engineered
      // away: a dead agents/ link could coincidentally resolve under another permitted
      // root. Every permitted root is inside the repo, so any resolution is a real file,
      // and per-shape enumeration would reintroduce the enumerated-list fail-open hazard
      // this scan exists to avoid.
      const { roots, rel } = resolutionRoots(file, target);
      if (roots.some((r) => existsSync(resolve(r, rel)))) {
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
  // Positive control (non-vacuity): the pattern must still FIRE, in both token orders,
  // against synthetic literals of the retired form — a negative-only assert would stay
  // permanently, silently green after a stray escape or renamed token broke the pattern.
  // Safe from self-match: these literals live in this .mjs and the sweeps read only *.md
  // (see the self-match note atop this file). Matched through a NON-global copy —
  // RETIRED_CITATION carries /g/, and RegExp.prototype.test's lastIndex state would leak
  // across the two controls and into the matchAll scan below (matchAll clones inherit
  // lastIndex).
  const CITATION_ONCE = new RegExp(RETIRED_CITATION.source, RETIRED_CITATION.flags.replace('g', ''));
  for (const control of [
    '(prompt-surface simplification; see SKILL.md, submodule co-source-of-truth)',
    '(prompt-surface simplification; see submodule co-source-of-truth, SKILL.md)',
  ]) {
    assert.match(
      control,
      CITATION_ONCE,
      `positive control failed — RETIRED_CITATION no longer matches the retired citation form: ${control}`,
    );
  }

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
// The eviction-destination references/ files whose headers must carry the qualified
// byte-identity claim: the four this pass re-qualified, plus glossary-cold.md — the
// CONTEXT.md eviction destination that joined later (every new eviction destination joins
// this list on creation; UNION-extension precedent). Read by direct readFileSync and NOT
// filtered out of the scan results: fail-closed, so a rename throws ENOENT loudly instead
// of narrowing the check to whatever files still happen to match.
const QUALIFIED_HEADERS = [
  'resume-and-recovery.md',
  'submodule-flows.md',
  'worker-servitor-edges.md',
  'auditor-teach.md',
  'glossary-cold.md',
  // ask-disposition Task 1.1: the war-auditor.md eligibility-blockquote eviction destination
  // (joined on creation per the UNION-extension precedent above).
  'disposition-eligibility.md',
  // engine-reliability Phase 2 Task 2 polish: the agents/war-refiner.md Budget-Raise
  // byte-funding eviction destination (joined per the UNION-extension precedent above),
  // plus refiner-recovery.md — a pre-existing eviction destination whose header already
  // carried the qualifier but was unlisted (sibling gap closed in the same touch).
  'budget-raise-floor.md',
  'refiner-recovery.md',
];

test('reference link integrity — the re-basing caveat and the no-path-form claim are retired everywhere, and every re-qualified header says "at eviction time"', () => {
  // OLD-absent half. A default flip is only landed when the retired wording is gone from
  // every surface, not merely replaced on the files this pass touched — so the sweep runs
  // over the whole scanned set (a superset of the mandated skills/war/references/ scope).
  //
  // Keyed CASE-INSENSITIVE and WHITESPACE-TOLERANT (`\s+` between every word, #1275): the
  // sentence-initial capitalised anchor is the recorded sentence-case false-negative class
  // (red-team adjudication 1, 2026-08-03 — reproduced, a lowercase mid-sentence
  // reintroduction left an equivalent guard fully green while the retired doctrine was
  // live), and a hard-wrapped reintroduction — the phrase broken across a line break — is
  // the wrap false-negative class a single-line pattern misses. The hand grep floor for
  // the same fact is `grep -rinF`, never `grep -rn` — and it is a COMPLETENESS FLOOR
  // ONLY: grep is line-based and cannot see a wrapped reintroduction at all, so a clean
  // hand grep never overrides this arm; the suite regex is the authority.
  const RETIRED_REBASING_CAVEAT = /link\s+paths\s+inside\s+the\s+moved\s+blocks/i;
  // Positive controls (non-vacuity), one per axis: the single-line form, and the wrapped
  // form carrying an embedded newline INSIDE the phrase — so the pattern's literality and
  // its whitespace tolerance are each observably load-bearing. Safe from self-match: these
  // literals live in this .mjs and the sweeps read only *.md (see the self-match note atop
  // this file); no /g/ here, so a direct assert.match is stateless.
  assert.match(
    'Relative link paths inside the moved blocks are likewise written relative to X',
    RETIRED_REBASING_CAVEAT,
    'single-line positive control failed — RETIRED_REBASING_CAVEAT no longer matches the retired caveat form',
  );
  assert.match(
    'Relative link paths\ninside the moved blocks are likewise written relative to X',
    RETIRED_REBASING_CAVEAT,
    'wrapped positive control failed — RETIRED_REBASING_CAVEAT no longer matches a line-wrapped reintroduction of the retired caveat',
  );
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
  // false-RED, and whitespace-tolerant so a reflowed qualification cannot either — with
  // the same one-control-per-axis discipline as the retirement patterns.
  const EVICTION_TIME_QUALIFIER = /at\s+eviction\s+time/i;
  assert.match(
    'byte-identical to its pre-eviction card text at eviction time',
    EVICTION_TIME_QUALIFIER,
    'single-line positive control failed — EVICTION_TIME_QUALIFIER no longer matches the qualification',
  );
  assert.match(
    'byte-identical to its pre-eviction card text at\neviction time',
    EVICTION_TIME_QUALIFIER,
    'wrapped positive control failed — EVICTION_TIME_QUALIFIER no longer matches a line-wrapped qualification',
  );

  // THIRD retirement pattern (End state 13's suite regex of record, added by /red-team
  // round 1): the retired cross-repo header claim. Same axes, same controls; scanned over
  // the same header regions the qualification check reads.
  const RETIRED_NO_PATH_FORM_CLAIM = /no\s+path\s+form\s+resolves/i;
  assert.match(
    'On a foreign target repo no path form resolves this file at all',
    RETIRED_NO_PATH_FORM_CLAIM,
    'single-line positive control failed — RETIRED_NO_PATH_FORM_CLAIM no longer matches the retired claim',
  );
  assert.match(
    'On a foreign target repo no path\nform resolves this file at all',
    RETIRED_NO_PATH_FORM_CLAIM,
    'wrapped positive control failed — RETIRED_NO_PATH_FORM_CLAIM no longer matches a line-wrapped reintroduction of the retired claim',
  );

  const noPathFormCarriers = [];
  for (const name of QUALIFIED_HEADERS) {
    const header = headerRegion(readFileSync(join(REPO_ROOT, REFERENCES_DIR, name), 'utf8'));
    assert.ok(
      header !== null,
      `${REFERENCES_DIR}/${name}: no '## ' heading found — headerRegion fails closed, and a header-scoped check cannot run over a heading-less file`,
    );
    assert.match(
      header,
      EVICTION_TIME_QUALIFIER,
      `${REFERENCES_DIR}/${name}: the header's byte-identity claim is not qualified "at eviction time" (checked in the header region — the text before the file's first '## ' heading)`,
    );
    if (RETIRED_NO_PATH_FORM_CLAIM.test(header)) noPathFormCarriers.push(name);
  }
  // Exemption retired (Task 1.4's own edit, closing the C7 intermediate pin): the claim's
  // last live carrier — worker-servitor-edges.md's header — was re-truthed to the
  // plugin-root-anchored seat-capability matrix (ADR 0047), so the pattern holds at zero
  // carriers across every scanned header.
  assert.deepEqual(
    noPathFormCarriers,
    [],
    `retired no-path-form claim reintroduced in a scanned header:\n  ${noPathFormCarriers.join('\n  ')}`,
  );
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

// --- Arm 5: the step-4 citation (#1277) ----------------------------------------------
// auditor-teach.md's Gitlink-bump pin-validity step 4 cites its doctrine's real home by
// backticked filename + quoted section name. This arm re-derives that citation from the
// live prose and proves each half, so a renamed cited file, a renamed cited section
// heading, or a header that stops naming the file reds here instead of leaving the
// citation dangling.

test('reference link integrity — the step-4 citation in auditor-teach.md resolves: cited file, cited section heading, and header mention', () => {
  const teachRel = `${REFERENCES_DIR}/auditor-teach.md`;
  const teachText = readFileSync(join(REPO_ROOT, REFERENCES_DIR, 'auditor-teach.md'), 'utf8');

  const section = sectionByHeading(teachText, /gitlink-bump.*pin-validity/i);
  assert.ok(
    section !== null,
    `${teachRel}: no '## ' heading matching the Gitlink-bump pin-validity lens was found — the step-4 citation cannot be located`,
  );

  // Step 4 is the section's numbered list item beginning `4.` — located by construct,
  // never by line number, and spanning to the next numbered item or the section's end so a
  // hard-wrapped step body stays in scope.
  const lines = section.split('\n');
  const start = lines.findIndex((l) => /^4\.\s/.test(l));
  assert.ok(
    start !== -1,
    `${teachRel}: the pin-validity lens has no step 4 — the step-4 citation cannot be extracted (fail closed, never a skip)`,
  );
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^\d+\.\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  const step4 = lines.slice(start, end).join('\n');

  // The citation shape: (`<file>`, section "<name>") — backticked filename + quoted
  // section name inside one parenthetical. FAIL CLOSED on a parse miss (the
  // enumerated-destination existsSync fail-open lesson: an absent citation is an assertion
  // failure, never a skip). `\s` tolerance between the tokens, so a hard wrap inside the
  // citation cannot evade extraction.
  const CITATION = /\(`([^`]+)`,\s*section\s+"([^"]+)"\)/;
  const cited = CITATION.exec(step4);
  assert.ok(
    cited !== null,
    `${teachRel}: the step-4 citation shape (\`file\`, section "name") parsed to nothing — the citation is absent or malformed (fail closed)`,
  );
  const [, citedFile, citedSection] = cited;

  const citedAbs = join(REPO_ROOT, REFERENCES_DIR, citedFile);
  assert.ok(
    existsSync(citedAbs),
    `${teachRel}: the step-4 citation names ${citedFile}, which does not exist under ${REFERENCES_DIR}/`,
  );

  const citedHeadings = readFileSync(citedAbs, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('## '));
  assert.ok(
    citedHeadings.some((h) => h.includes(citedSection)),
    `${REFERENCES_DIR}/${citedFile}: no '## ' heading contains the step-4 citation's quoted section name "${citedSection}" — the citation dangles`,
  );

  const teachHeader = headerRegion(teachText);
  assert.ok(
    teachHeader !== null,
    `${teachRel}: no '## ' heading found — headerRegion fails closed, and the header-mention half of the step-4 citation check cannot run`,
  );
  assert.ok(
    teachHeader.includes(citedFile),
    `${teachRel}: the header region no longer mentions ${citedFile} — the step-4 citation's repaired-home note went stale`,
  );
});
