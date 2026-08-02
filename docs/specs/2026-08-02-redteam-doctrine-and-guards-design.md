# Red-team adjudicated-clear verdict, drift-guard deps-edge doctrine, and ref-diff escape guard

**Issues addressed:** #1207, #1224, #1242, #1244
**Survey group:** `redteam-doctrine-and-guards` (2026-08-02 survey manifest)

## 1. Context — the gap / problem

Four gaps live in `/red-team`'s doctrine-and-guard surfaces:

1. **The adjudicated clear is invisible to the gate (#1207).** `verdict()` in
   `skills/red-team/assets/red-team-gate.mjs` knows only
   `CLEARED / CLEARED-WITH-NOTES / BLOCKED / INCOMPLETE`. The operator's ratified standing rule
   (2026-07-28 directive, recorded in memory as
   `redteam-blocked-is-advisory-once-patched-and-adjudicated`: once every root finding is patched
   and carries an adjudication row, BLOCKED is advisory and the campaign proceeds) has no
   first-class outcome — the Lead invents non-greppable prose ("CLEARED by adjudication")
   indistinguishable from a probe-proven clear. Worse, the current Step-5 mechanic ("the Lead
   removes resolved findings during the grill loop") lets a patched-but-never-re-verified blocker
   be *removed*, producing a literal `CLEARED` that overstates the evidence.
2. **Adjudication G has two live readings (#1224).** In
   `docs/red-team/2026-07-28-prompt-surface-simplification.md`, ruling G excludes
   "registry / both-surfaces-pinned spans" from the dispatched-literal shrink. Task 4.1 applied it
   at span level (the whole pinned region stays verbatim); task 5.1 at anchor level (pinned tokens
   preserved, surrounding prose shrunk). Both landed green; nothing in the live tree records a
   canonical granularity. The settlement is doctrine prose, not a code fix, and it must land
   before the next plan that shrinks dispatched literals.
3. **No pipeline surface requires a `deps` edge when a drift guard is split from its
   mirror-authoring task (#1242).** When ADR 0025's mirror-and-guard-land-as-one-task discipline
   collides with file-disjointness (the guard file is owned by a different task), the sanctioned
   resolution is a `deps` edge from the guard task onto the mirror-authoring task — same wave is
   insufficient because every task worktree is cut from one frozen phase base. Red-team's
   drift-guard probes (`skills/red-team/SKILL.md` §Drift-guard spine probes and
   `skills/red-team/references/lenses.md` §Drift-guard spine probes) check only same-task
   delivery; ADR 0025 (`docs/adr/0025-drift-guard-discipline.md`) carries no language for the
   split; `/war-machine`'s drafter/grill surfaces do not check it. Two recorded recurrences
   (lesson `guard-task-split-from-mirror-task-needs-deps-edge-same-wave-insufficient`), one held
   only by luckily-convergent plan wording.
4. **The escape guard's ref half is a heuristic a probe already slipped (#1244).**
   `skills/red-team/assets/assert-no-repo-escape.sh` checks b1/b2 flag only refs matching
   `refs/heads/redteam-*` / `*-sandbox-*`. A probe that built a git fixture inside the shared
   sandbox worktree left probe-invented branch names (a recorded `rogue`/`rogue2` pair) that are
   repo-global and slip the pattern; `git reset --hard && git clean -fd` re-reads the porcelain
   half clean while the branches survive, and the residue later collided with a `/war` Provision
   barrier as a foreign integration ref (`held:workflow-error`). The guard's own header names the
   upgrade path — a full ref-diff snapshot — as a deliberate deferral "if a second escape shape
   slips the pattern"; the lesson
   (`redteam-sandbox-probe-branch-residue-blocks-next-provision`) documents the first.

## 2. Pivotal constraints

- **The operator directive is ratified, not reopenable.** ADJUDICATED is a *distinct* terminal
  verdict, deliberately not a CLEARED synonym (#1207's adjudicated shape). This spec implements
  the directive; it does not re-litigate it.
- **The gate stays pure and typed.** `red-team-gate.mjs` does no NLP on finding text (existing
  spec constraint, restated at the `deliverableAbsence` and `envGap` branches of `classify()`).
  Any new gate input is a typed per-finding flag keyed strictly on `=== true`.
- **Coverage is never waivable.** `INCOMPLETE` outranks every other verdict today ("no verdict
  other than INCOMPLETE may be reported on incomplete coverage" — SKILL.md Invariants);
  adjudication must not create a bypass.
- **ADR 0017 boundary:** an adjudication waives *re-verification of a patch*, never the
  validation itself. The new ADR must state this explicitly.
- **ADR amendments are append-only.** ADR 0025 is amended via a dated amendment note; all
  pre-existing body sentences stay byte-intact (the ADR's Status currency line is exempt, per
  lesson `adr-amendment-byte-unchanged-body-mandate-exempts-status-currency-line`).
- **Floor exit-code contract:** `assert-no-repo-escape.sh` keeps 0 = clean, 1 = escape,
  2 = git/infra error; 2 never collapses into 1 or 0. macOS bash 3.2 compatible.
- **Standing/reference mirror discipline:** the drift-guard probe prose lives on *both*
  `skills/red-team/SKILL.md` and `references/lenses.md` — a change must land on both in the same
  commit (the existing presence-pair guard idiom in `workflow-scaffold.test.mjs`, e.g. the
  `ff-topology prose presence pair` test, is the enforcement pattern).
- **Existing doc-lock tests must stay green or be updated in the same commit:** the
  `SKILL.md step 4 names both accepted input shapes…` test in `red-team-gate.test.mjs`, the D7
  two-contract drift-guard (which pins `'pass'` as the *only* status demoting a Critical/Major —
  untouched by this spec), and `assert-no-repo-escape.test.sh`'s source/call-site locks.
- **ADR 0014 provenance rule:** operator-ratified vs AI-declared markers survive extraction; any
  surface that reads the marker must recognize both variants.
- **Grep is a floor, not a ceiling:** every token sweep this spec mandates carries a manual
  same-scope title/comment survey (see §10).
- **Landed phases 4.1/5.1 are not reopened** (#1224's own Lead adjudication: moot for the landed
  plan; settle prospectively only).

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| 1 | ADJUDICATED: verdict, synonym, or report prose? | A distinct gate-emitted terminal verdict in `red-team-gate.mjs` — never a CLEARED synonym, never Lead-invented prose (operator directive, respected). |
| 2 | How the gate learns a finding is adjudicated | A typed per-finding flag `adjudicated`, strict `=== true` (the `deliverableAbsence`/`envGap` pattern). The Lead stamps it only when the finding is patched in the plan AND carries a row in the report's `## Adjudications` block. No NLP; the gate stays pure. |
| 3 | Verdict precedence | `INCOMPLETE` (coverage, unchanged, never waivable) > `BLOCKED` (any blocker/needsDecision without `adjudicated === true`) > `ADJUDICATED` (≥ 1 adjudicated blocker/needsDecision, zero unadjudicated) > `CLEARED-WITH-NOTES` > `CLEARED`. A run with zero blockers never emits ADJUDICATED — back-compat is byte-for-byte when no flag appears. |
| 4 | Remove vs stamp in the grill loop | A blocker resolved by a re-run probe is *removed* (probe-proven → CLEARED remains reachable). A patched-but-not-re-verified blocker is *stamped* `adjudicated`, never removed — removal-as-resolution is what made the fake CLEARED possible. |
| 5 | Re-verify trigger (Step 5 rewrite) | Patch-and-adjudicate is the default. A probe re-run is owed only when BOTH arms hold: the probe was **executed** (proved by running something) AND the patch changes what that probe measures. The ≤ 2-round bound per blocker is unchanged. (Codifies the 2026-07-28 report's practiced rule.) |
| 6 | Adjudication provenance marker | Per-row provenance token in the `## Adjudications` block: `operator-ratified (<date>)` or `AI-declared` (ADR 0014). Per-row, not per-block — one run can mix Lead self-adjudication (`--afk`) with operator rulings. |
| 7 | Where the doctrine is recorded | One new ADR (next free number — 0043 at survey time; resolve at land) recording the CLEARED-vs-ADJUDICATED split, the stamp-never-remove rule, the two-arm re-verify trigger, and the ADR 0017 boundary (waives patch re-verification, never the validation). |
| 8 | Adjudication G granularity (#1224) | **The extraction's read is the carve-out.** The bytes any registry/both-surfaces row's extraction actually reads are excluded from a dispatched-literal shrink; a region pinned by an ordered/positional key is atomic (moves whole or stays whole — adjudication J precedent); prose in the same template literal that no extraction reads is shrink-eligible residue. This reconciles both landed readings (4.1's atomic regions, 5.1's shrunk surroundings) and is mechanically checkable — the guard suite is the arbiter. Recorded in the new ADR (a "carve-out granularity" subsection) and beside the `## Adjudications` template guidance in `lenses.md`. Bounded by lesson `registry-carveout-rationale-cannot-justify-retaining-a-card-span-inline`: the carve-out covers runtime prompt strings only — it never transfers to standing-doc card spans, which always have a file re-anchor. |
| 9 | deps-edge enforcement home (#1242) | Three surfaces, one rule: (a) a third Lead-run drift-guard probe arm `guard-split-deps-edge` (analyzed; vacuous when no task authors a guard over a sibling-task fact) on both `SKILL.md` and `lenses.md`; (b) a dated ADR 0025 amendment note recording the file-disjoint-collision resolution as the canonical citation; (c) a `/war-machine` drafter directive (the Release-phase-directive pattern) so the plan is authored correctly before red-team ever sees it. |
| 10 | Probe-arm shape: extend `unguarded-new-mirror` or add a third probe? | Add a third probe. The rule covers *any* drift guard split from the task authoring the fact it guards (prose mirrors and doc-guard tests included), which is wider than `unguarded-new-mirror`'s inline-const scope. Both surfaces' "Two doctrine probes" count words update to "Three" (see §10 sweep). |
| 11 | Ref-diff shape (#1244) | One script, two modes. Pre-run: `assert-no-repo-escape.sh --repo <r> --snapshot <file>` writes the full ref set (`git for-each-ref --format='%(refname) %(objectname)'`) and exits 0 (2 on git error). Post-run: the existing invocation plus `--baseline <file>` diffs the live ref set against the snapshot — any added, removed, or moved ref is an escape (exit 1), regardless of name. The junk-name pattern (b1/b2) stays as an unconditional floor (it also covers origin, which the snapshot does not re-poll for the diff half — b2 is unchanged). |
| 12 | Back-compat / degraded arms | No `--baseline` → today's behavior byte-for-byte plus one stderr advisory naming the heuristic ceiling. `--baseline` given but unreadable/absent → exit 2 (infra, never a silent pass). Snapshot file lives OUTSIDE the target repo's working tree (mktemp or the session scratch), so it can never trip the porcelain half — especially on foreign `--repo` targets. |
| 13 | Containment runbook (#1244) | SKILL.md Step 4 gains the containment rule: after any escape containment (`reset --hard` / `clean -fd`), containment is complete only when the guard re-runs exit 0 **with `--baseline`** — a porcelain-clean restore alone never closes the incident (the branch-enumeration step is mechanical, not manual). |

## 4. Mechanics

### `skills/red-team/assets/red-team-gate.mjs`

- `classify()` is unchanged in bucketing: adjudicated blockers still appear in `blockers` (the
  report must still show them); the flag is read by `verdict()` only.
- `verdict(findings, coverage)` gains the arm per design row 3: after the `isIncomplete` check,
  partition blockers + needsDecision into adjudicated (`f.adjudicated === true`) and not; any
  unadjudicated member → `BLOCKED`; otherwise if the adjudicated partition is non-empty →
  `ADJUDICATED`; otherwise fall through to the existing minors check.
- CLI output shape unchanged apart from the new possible `verdict` string; `summarize()`
  untouched. The zero-probe refusal, envelope unwrap, and fingerprint/coverage layers are
  untouched.

### `skills/red-team/SKILL.md`

- **Step 5 rewrite** (design rows 4–5): patch-and-adjudicate default; the two-arm re-verify
  trigger; stamp-never-remove; the bounded ≤ 2 rounds and the one-at-a-time grill are retained.
  The blocker-survives-rounds terminal rule gains the ADJUDICATED arm: a blocker that ends the
  loop patched + adjudication-rowed terminates ADJUDICATED; only an unpatched root or an
  unsettled `needsDecision` leaves the terminal verdict `BLOCKED` with residual open questions.
  The terminal verdict line is gate-emitted (the Lead re-pipes the stamped finding set through
  the gate), never hand-written.
- **Step 4** gains: (pre-run, referenced from Step 3) take the ref snapshot immediately before
  launching the Workflow; (post-run) pass `--baseline`; the containment rule of design row 13.
  Keep the tokens the `SKILL.md step 4` doc-lock test in `red-team-gate.test.mjs` pins (both
  accepted input shapes, the `.result` unwrap, the zero-probe refusal).
- **§Drift-guard spine probes** gains arm 3, `guard-split-deps-edge` (analyzed): a plan task that
  authors a drift guard over a fact authored by a *different* task in the same phase must carry a
  `deps` edge onto that task; absence is a plan defect → `needsDecision`, grilled until the plan
  adds the edge, merges the tasks, or moves the guard a phase later. Vacuous when no such split
  exists; not skipped under `--fast`. Count words updated ("Two" → "Three", including the Step-2
  sentence "The two drift-guard spine probes (below) run every red-team too").
- Invariants: the never-CLEARED-on-incomplete-coverage sentence extends to name ADJUDICATED
  (no verdict other than INCOMPLETE on incomplete coverage — already generic; verify wording
  still quantifies over all verdicts).

### `skills/red-team/references/lenses.md`

- §Drift-guard spine probes: mirror arm 3 verbatim-in-substance (same commit as SKILL.md).
- §Severity & gate verdict line and §Scope-lock `INCOMPLETE` bullet: enumerations gain
  `ADJUDICATED` with its one-line definition (every blocker/needsDecision patched + adjudicated;
  distinct from CLEARED — no probe re-proof).
- Finding schema block: document the `adjudicated` flag beside `deliverableAbsence` (typed,
  Lead-stamped at grill time, strict `=== true`).
- Report template: verdict line becomes
  `CLEARED | CLEARED-WITH-NOTES | ADJUDICATED | BLOCKED — <one line>`; the `## Adjudications`
  block gains the per-row provenance token (design row 6) and, in its guidance comment, the
  carve-out granularity rule (design row 8) with its citation to the new ADR.

### `skills/red-team/assets/red-team-gate.test.mjs`

Verdict-table pins (all fixture-level, no fs): all-adjudicated blockers → ADJUDICATED;
mixed adjudicated/unadjudicated → BLOCKED; adjudicated needsDecision counts; zero blockers +
minors → CLEARED-WITH-NOTES (never ADJUDICATED); INCOMPLETE outranks ADJUDICATED (off-target
probe + fully-adjudicated blockers → INCOMPLETE); strict-flag delete-and-trace
(`adjudicated: 'true'` string and `adjudicated: false` do not demote BLOCKED); back-compat (no
flag anywhere → today's table byte-for-byte). Update the Step-4 doc-lock only if Step 4's pinned
tokens moved.

### `skills/red-team/assets/assert-no-repo-escape.sh` (+ `assert-no-repo-escape.test.sh`)

- Implement the two modes of design rows 11–12. The `ponytail:` header paragraph is rewritten in
  the same commit — it currently records the ref-diff as a deferred upgrade path; leaving it
  would be a false code-fact (lesson class `source-comment-lags-emitted-prompt-after-rewrite`).
- Test additions (throwaway temp repos, per the existing harness): snapshot mode writes and
  exits 0; identical pre/post set + clean tree + `--baseline` → 0; probe-invented
  pattern-slipping branch (e.g. `rogue`) with clean tree → 1 (the #1244 repro — this is the
  demonstrated-red case); moved sibling-branch SHA → 1; deleted ref → 1; `--baseline` pointing at
  a missing file → 2 (asserted ≠ 1); no `--baseline` → prior cases unchanged plus the stderr
  advisory present. Existing cases 1–10 (including the source/call-site die-default locks) stay
  green unmodified.

### `docs/adr/0025-drift-guard-discipline.md`

Dated amendment note (append-only; body sentences byte-intact) under Consequences: when the
one-task rule collides with file-disjointness, the resolution is a `deps` edge from the guard
task onto the mirror-authoring task — same phase + same wave is insufficient (frozen phase base);
names the red-team probe arm and the `/war-machine` directive as the forcing functions and cites
the lesson slug.

### New ADR (next free number)

`docs/adr/<next>-adjudicated-clear-distinct-terminal-verdict.md` (or equivalent slug): the
CLEARED-vs-ADJUDICATED split; stamp-never-remove; the two-arm re-verify trigger; the ADR 0017
boundary sentence; the ADR 0014 per-row provenance marker; the carve-out granularity subsection
(design row 8, citing adjudication G/J of `docs/red-team/2026-07-28-prompt-surface-simplification.md`
as precedent and the registry-carveout lesson as the bound). Records the 2026-07-26
"same-wave adjudication was insufficient" outcome as the acknowledged residual risk of proceeding
without re-proof.

### `skills/war-machine/SKILL.md`

A **Guard-split deps-edge directive** paragraph (placed with the existing Release-phase
directive): a drafted plan task that authors a drift guard over a fact authored by a different
same-phase task must carry `deps: [<that task>]`; the grill agent asks it; a split the drafter
cannot edge (e.g. would create a cycle) is raised via the ADR triad, never silently shipped.

### `docs/red-team/2026-07-28-prompt-surface-simplification.md`

Read-only precedent for this spec (adjudications G and J are quoted/cited, never edited). No
change to the file.

## 5. Surface changes

- `skills/red-team/assets/red-team-gate.mjs` — ADJUDICATED verdict arm.
- `skills/red-team/assets/red-team-gate.test.mjs` — verdict-table + strict-flag pins.
- `skills/red-team/SKILL.md` — Step 4/5 rewrite, containment rule, probe arm 3, count words.
- `skills/red-team/references/lenses.md` — verdict enumerations, schema flag, report template
  (provenance column, carve-out granularity guidance), probe arm 3 mirror.
- `skills/red-team/assets/assert-no-repo-escape.sh` — snapshot/baseline modes, header rewrite.
- `skills/red-team/assets/assert-no-repo-escape.test.sh` — new cases.
- `skills/red-team/assets/workflow-scaffold.test.mjs` — a presence-pair guard for probe arm 3
  (the `ff-topology prose presence pair` idiom), pinning the arm on both prose surfaces.
- `docs/adr/0025-drift-guard-discipline.md` — dated amendment note.
- `docs/adr/<next free>-…` — new ADR (one file).
- `skills/war-machine/SKILL.md` — Guard-split deps-edge directive.
- `CONTEXT.md` — new domain terms (§6).
- Conditional cascade (see §8): `skills/war/references/design.md` ("until CLEARED" one-liner),
  `skills/war-campaign/SKILL.md` ("can't CLEAR `/red-team`" halt-and-hold clause).

## 6. New domain terms (CONTEXT.md)

- **ADJUDICATED (verdict)** — the gate's terminal verdict when every blocker/needsDecision is
  patched and carries an adjudication row but at least one was not re-proven by a probe re-run;
  a proceed verdict distinct from CLEARED.
- **Adjudicated flag** — the typed per-finding `adjudicated: true` the Lead stamps at grill time;
  the only channel by which adjudication reaches the gate.
- **Adjudication provenance marker** — the per-row `operator-ratified (<date>)` / `AI-declared`
  token in a report's `## Adjudications` block (ADR 0014 family).
- **Ref-diff baseline** — the pre-run ref-set snapshot `assert-no-repo-escape.sh --snapshot`
  writes outside the repo tree; the exact half of the post-run ref check.
- **Guard-split deps edge** — the mandatory `deps` edge from a drift-guard task onto the
  same-phase task that authors the fact it guards.

## 7. Recommended ADRs

1. **New ADR — "the adjudicated clear is a distinct terminal verdict"** (next free number; 0043
   at survey time — resolve at land, ADR numbers are non-authoritative in specs). Contents per §4.
2. **ADR 0025 amendment note** (not a new ADR) — the deps-edge resolution for the file-disjoint
   collision.
3. No amendment to ADR 0017 (its text is untouched; the new ADR carries the boundary sentence) and
   none to ADR 0033 (the escape guard remains the detection authority; the ref-diff is an upgrade
   inside it, recorded in the script header and the new test cases).

## 8. Open risks / implementation notes

- **Verdict-enumeration consumers outside `skills/red-team/`.** Survey-derived stragglers found
  while authoring this spec: `skills/war/references/design.md` ("patches the plan in place until
  **CLEARED**") and `skills/war-campaign/SKILL.md` ("when a plan can't `CLEAR` `/red-team`").
  Both should recognize ADJUDICATED as a proceed verdict (one-line edits). They sit outside this
  group's file family — `/war-machine` must confirm no other plan in the campaign owns those
  files before folding them in; if contention exists, defer them to a Deferred-validations
  backstop with the §10 sweep as the runner. `CONTEXT.md`'s escape-guard line ("never `CLEARED`")
  and ADR 0033's identical sentence remain true as written (an escape still quarantines every
  pass-shaped verdict) — extend, don't rewrite, only if the §10 sweep shows ambiguity.
- **Flag stamping is prompt-enforced.** No hook verifies the Lead only stamps `adjudicated` on
  findings that really carry a patch + row; the report (listing adjudicated blockers with their
  rows) is the audit surface. Accepted residual — same trust class as the existing
  removal-of-resolved-findings mechanic, and strictly narrower than today's.
- **Baseline staleness.** A snapshot reused across sessions could predate legitimate ref changes.
  Containment: Step 3/4 prose mandates one snapshot per run, taken immediately before Workflow
  launch, at a run-scoped scratch path. Accepted residual beyond that.
- **b2 (origin) keeps the heuristic only.** The ref-diff half is local; re-polling origin pre/post
  would add network flake to a floor script. The common origin escape (a bare push of a sandbox
  branch) stays covered by the pattern; a probe-invented name pushed to origin remains a known
  ceiling — name it in the new test file's header and the guard header.
- **D7 is untouched.** The two-contract sentence and the `'pass'`-only demotion set are unchanged;
  widening the verdict enum is orthogonal to widening the demoting-status set. Do not touch the
  D7 pins.
- **Anchor by named construct** everywhere (verdict function, test names, section headings) —
  never line numbers.

## 9. Non-goals / deferred

- Reopening landed phases 4.1/5.1 of prompt-surface-simplification (#1224's Lead adjudication:
  prospective settlement only) or editing the 2026-07-28 red-team report.
- Re-litigating the operator directive (ADJUDICATED-as-proceed is ratified input, not a question).
- A probe-confinement jail (rejected non-goal of ADR 0033; the post-run guard remains the model).
- Gate-side parsing of report prose to *derive* adjudication (the gate stays typed and pure).
- Origin-side ref-diff (see §8) and any change to the porcelain half.
- A mechanical hook enforcing the deps-edge rule at decompose time — the forcing functions are
  the probe arm, the war-machine directive, and the ADR amendment (ADR 0025's registry-ceiling
  posture: doctrine + probe, not a scanner).
- `/war-review` telemetry on adjudication frequency — possible later signal, out of scope.

## 10. Validation criteria (concrete, testable)

1. `node --test skills/red-team/assets/red-team-gate.test.mjs` green with the new pins of §4,
   including: INCOMPLETE-outranks-ADJUDICATED; mixed-flag → BLOCKED; zero-blocker runs can never
   emit ADJUDICATED; strict `=== true` delete-and-trace; no-flag back-compat table identical to
   today's.
2. `bash skills/red-team/assets/assert-no-repo-escape.test.sh` green, including the
   demonstrated-red #1244 repro: a throwaway repo where a probe-invented, pattern-slipping branch
   (`rogue`) exists with a clean working tree — pre-change guard exits 0 (the recorded miss);
   post-change with `--baseline` exits 1. Missing-baseline arm asserted exit 2 ≠ 1.
3. Presence-pair guard (in `workflow-scaffold.test.mjs`, the ff-topology pair idiom) red when
   probe arm `guard-split-deps-edge` is removed from either `SKILL.md` or
   `references/lenses.md`.
4. **Verdict-enumeration sweep (grep is the floor):** `grep -rn 'CLEARED-WITH-NOTES'` across
   `skills/`, `docs/adr/`, `CONTEXT.md` — every enumeration lists ADJUDICATED or is individually
   justified in the done report. **Mandatory manual same-scope survey:** after the grep,
   hand-scan `skills/red-team/SKILL.md`, `references/lenses.md`, `red-team-gate.mjs` comments,
   and the test files' test titles/comments for verdict-list prose the token misses
   (e.g. "never CLEARED", "drive it to CLEARED", the skill frontmatter description); list each
   straggler as a survey-derived correction. Known stragglers at survey time: the two §8 cascade
   files, the red-team skill description line, and `design.md`'s Outcome bullet.
5. **Count-word sweep:** `grep -in 'two'` within the drift-guard-probe sections of both prose
   surfaces — every "two doctrine probes"-family count updated to three; manual hand-scan of the
   surrounding Step-2 prose and of `workflow-scaffold.test.mjs` banner comments for count words
   the grep misses; stragglers listed as survey-derived corrections.
6. ADR 0025 amendment verified append-only: `git diff` on the file shows additions only (plus at
   most the Status currency line).
7. The new ADR exists, names the ADR 0017 boundary sentence verbatim-in-substance ("waives
   re-verification of a patch, never the validation itself"), and carries the carve-out
   granularity subsection resolving #1224's anchor-vs-span question.
8. `skills/war-machine/SKILL.md` carries the Guard-split deps-edge directive; a grep for
   `deps` in that file hits it.
9. Redaction lint green (`node skills/_shared/war-memory.mjs lint docs/learnings/` unaffected;
   the spec and all new prose carry no home paths, emails, handles, or credentials).
10. If a release is implied at campaign end: bump all four slots to the next free patch resolved
    from the slots at land time (no version literal is authoritative in this spec).
