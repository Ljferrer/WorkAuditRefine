# war-strategy structure lock — two-site location-anchored lock for plan-literal-lint.mjs

Source spec: `docs/specs/2026-07-22-war-strategy-structure-lock-design.md` (from issue #991;
drafted by `/war-machine --afk`, 2026-07-22).

## AI-Commander's Intent

*(AI-drafted under ADR 0014 — no operator ratification; provenance marked by this heading)*

- **Purpose:** the structure test proves each of `SKILL.md`'s two ratified `plan-literal-lint.mjs`
  sites survives *individually* — deleting the §2 convention mention or the §4 lint step goes red
  on its own anchor, instead of hiding green behind the other site.
- **Method:** replace the single bare-token `check_f 'plan-literal-lint.mjs'` lock with two
  location-unique `check_f` fragments (the in-file requiresPackaging two-site precedent; no new
  helper, no occurrence-count check — spec §3 rows 1/2/4), prove discrimination with an in-task
  RED probe on an uncommitted scratch copy, then close the origin lesson's stale verification
  note with a dated body-only instance note (description byte-identical, zero projection cost).
- **End state:**
  1. `skills/war-strategy/war-strategy-structure.test.sh` carries two location-anchored `check_f`
     locks — one per site, each with a per-site trailing comment — in the "Reference the live
     artifact" check block; the bare `check_f 'plan-literal-lint.mjs'` line is gone (the token
     appears only inside the two anchored fragments); the test exits 0 against byte-unchanged
     `SKILL.md`, printing both new `ok -` lines.
  2. Each new fragment matches exactly one line of `skills/war-strategy/SKILL.md`
     (`grep -cF` = 1 for both).
  3. Discrimination proven and recorded: on a scratch copy of `SKILL.md`, deleting the §2
     sentence fails the §2 anchor and (independently) deleting the §4 lint-step command line
     fails the §4 anchor — both mutations that the old bare lock kept green; the worker's done
     report carries both red outputs as the RED proof.
  4. `docs/learnings/structure-test-check-f-locks-presence-anywhere-not-intended-location.md`
     carries a dated #991 instance-closure note in its body (including the `grep -c`
     counts-lines-not-occurrences caveat); its `description` line, `metadata.keywords`, and
     provenance are byte-unchanged; `node skills/_shared/war-memory.mjs lint docs/learnings/`
     (the exact CI check) passes.
  5. The full shell suite is green via the self-discovery gate (`resolveGate` in
     `war-config.mjs` — never an enumerated suite list).

## Build order (for /war)

1. **Phase 1 — Lock granularity + lesson closure** (waves: 1.1 → 1.2)

## Phase 1 — Lock granularity + lesson closure

### Task 1.1: two location-anchored locks replace the bare token lock

- Files: `skills/war-strategy/war-strategy-structure.test.sh`
- Plan slice: In the "Reference the live artifact, never a stack-fragile literal" check block,
  replace the single bare lock — the `check_f 'plan-literal-lint.mjs'` line whose trailing
  comment reads "advisory lint named in the convention + §4" (that comment is the defect's own
  admission of double duty and goes with it) — with two location-anchored `check_f` calls, one
  per ratified site, comments naming each site so a future red run identifies *which* mention
  regressed. Current resolution of the two fragments (spec §4.1; the §3-row-3 criteria are the
  contract, these byte strings are the resolution as of authoring):
  ``check_f 'The advisory `plan-literal-lint.mjs` (`skills/war-strategy/assets/`)'`` with a
  "§2 convention block" comment, and
  ``check_f 'run `node skills/war-strategy/assets/plan-literal-lint.mjs <plan>`'`` with a
  "§4 lint-the-authored-plan step" comment. `SKILL.md` is read, never written. No helper
  changes, no new bash constructs — single-quoted fixed strings only (backticks and `<`/`>` are
  inert inside single quotes on bash 3.2); no double quotes or bold markers crossing an anchor.
  **Pre-edit re-verification** (serial merge queue may have drifted the prose since spec time):
  re-run the spec §4.3 counts on the task's dispatch base — each fragment `grep -cF` = 1 against
  `SKILL.md`, bare token = 2; if a fragment no longer matches exactly once, re-derive it under
  the spec §3 row 3 criteria (contains the full token, extends into location-unique surrounding
  prose, single-line, quote-safe) rather than forcing the stale bytes — End state 2 is the
  arbiter, not the byte string. **In-task RED probe** (uncommitted, scratch copy only — never a
  committed meta-test, spec §9): copy `SKILL.md` to a scratch path, delete the §2 sentence
  naming `plan-literal-lint.mjs`, run the edited test against the scratch copy → red on the §2
  anchor; restore, delete the §4 "Lint the authored plan" step's command line → red on the §4
  anchor; record both red outputs plus the old-lock-stayed-green contrast in the done report.
- requiresTest: true — the diff itself is the mapped test
  (`skills/war-strategy/war-strategy-structure.test.sh`; a `*.test.sh` diff satisfies the
  test-in-diff floor's unconditional bash-suite arm); green run =
  `bash skills/war-strategy/war-strategy-structure.test.sh` exits 0 with both new `ok -` lines.
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: dated instance-closure note in the origin lesson

- Files: `docs/learnings/structure-test-check-f-locks-presence-anywhere-not-intended-location.md`
- Plan slice: Body-only edit (spec §4.2). Directly after the existing **Verification note**
  section, append a short dated (2026-07-22 or land date) closure paragraph: the specific
  two-site instance — `plan-literal-lint.mjs` in the §2 convention block and the §4
  conversion-flow step, pinned by one bare `check_f` — *was* confirmed present on the integrated
  tree (superseding the note's earlier stale-worktree "not found") and is now closed by two
  location-unique `check_f` anchors (issue #991); the mechanism-level guidance (options (a)/(b)
  in "How to apply") stays live for future structure tests, with the added caveat that a bare
  `grep -c` is a **line-count, not an occurrence-count** — it reports the number of matching
  *lines* regardless of `-o` on the stock GNU and BSD greps (verified against real BSD grep
  `/usr/bin/grep`), so a `-oc`/`-co` "count recipe" is a line-count in disguise on those greps —
  prefer option (a). (Environment caveat, red-team-verified: a `grep` shimmed to a third-party
  drop-in such as ugrep may instead count *occurrences* under `-oc`, so a count recipe is
  doubly unsafe — option (a)'s explicit-location anchor sidesteps the whole question.) This task
  rides the dep wave so the writer verifies the claim before making it: on the rebased
  integration tip, confirm the two anchored `check_f` calls exist in
  `war-strategy-structure.test.sh` and the bare-token lock is absent. Byte-unchanged surfaces:
  the `description` line (zero MEMORY.md projection cost), `metadata.keywords`, provenance
  (`code-verified` stands — no RESOLVED prefix; this is a live mechanism lesson, not a retired
  defect, spec §3 row 5). Validate with the exact CI check
  `node skills/_shared/war-memory.mjs lint docs/learnings/` and confirm via `git diff` that the
  frontmatter block has no hunk.
- requiresTest: false — docs-only body note; validation is the fail-closed redaction lint (the
  only CI check) plus the frontmatter-untouched diff assertion in the done report.
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- None — every spec §10 criterion executes in-task (uniqueness counts, RED discrimination probe,
  structure-test green, redaction lint, frontmatter byte-identity) or at the refiner gate (full
  shell suite via `resolveGate` self-discovery). The RED probe's evidence is deliberately
  uncommitted (done-report only; a committed meta-guard is the spec §9 rejected ceiling), so
  gate-audit treats any cannot-confirm on it as SOFT per standing rule, never a hold.

## Notes / conscious deviations

- **AFK provenance (ADR 0014):** intent is AI-drafted — `## AI-Commander's Intent` and the
  AI-declared backstops heading are deliberate, not template drift.
- **No trailing Release phase** — deviation from the tighten/seed exemplars' convention,
  self-adjudicated: this plan ships no plugin runtime behavior (a dev-side test-granularity fix
  plus a lesson body note; `SKILL.md`, CLIs, hooks, and all four version slots untouched).
  Release-iff-behavior-ships is the campaign convention; a campaign-level release from a sibling
  plan will carry these commits.
- **Cross-plan contention: none.** The concurrent sibling
  `docs/specs/2026-07-22-cli-main-guard-normalization-design.md` explicitly leaves
  `plan-literal-lint.mjs` untouched (its §3 row 6 / §9 — it is one of the three
  already-normalized guards), and this plan never touches `plan-literal-lint.mjs` or its test at
  all: the construct scope here is the structure test's lock granularity + the origin lesson.
  Spec §5 records zero file overlap with every other survey group.
- **1.2's dep edge is evidentiary, not symbolic:** the lesson note asserts a fact Task 1.1
  creates (the two landed anchors). The wave edge lets the writer verify on the integrated tip
  instead of asserting ahead of fact — mirrors the tighten exemplar's Task 1.4
  read-the-merged-contract pattern.
- **Fragment bytes are quoted in 1.1 but subordinate to criteria:** per the recorded
  plan-bullet-divergence failure class, any conflict between the quoted replacement text and the
  checkable pair (End states 1–2) resolves toward the checkable pair; the spec §3 row 3 criteria
  govern re-derivation.

## Open decisions

- None — the spec's design tree resolves all six forks; the drafter-level adjudications (no
  Release phase; 1.2 as a dep wave; backstops declared None) are recorded above for `/red-team`
  ratification.
