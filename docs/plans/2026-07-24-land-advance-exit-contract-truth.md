# Land-advance exit-contract truth — align every live standing record with 0/2/3/6, close the unresolvable-HEAD test gap

Source spec: `docs/specs/2026-07-24-land-advance-exit-contract-truth-design.md` (survey 2026-07-24,
group `land-advance-exit-contract-truth`, issues #1035 #1036 #1037 #1038 — all `war-followup` debt
from the merge-land-resilience plan).

## Commander's Intent

- **Purpose:** the code is right and stays byte-untouched — every **live standing record** of
  `cmd_land_advance`'s exit contract must say what the script's canonical header says (0/2/3/6, with
  exit 3's widened unresolvable-`HEAD`/`<new-sha>` triggers), and the one untested die arm
  (unresolvable HEAD → `EX_FOREIGN`) must gain its deterministic fixture — the phase-close waiver
  that claimed it unfixturable was proven wrong by code trace. Until this lands, the stale lesson
  keeps being prefetched into every land-path worker/auditor seat, and its portability-stripped twin
  ships the stale contract to fresh installs via the plugin seed corpus — the roadmap should slot
  this plan early, never behind unrelated work (spec §8).
- **Method:** a truth sweep toward the contract of record (the `cmd_land_advance` header
  comment in `skills/war/assets/provision-worktrees.sh`): (1) three-spot minimal edit + one keyword
  in the prefetched repo-root lesson, with the same correction applied to that lesson's
  portability-stripped twin inside the plugin seed corpus (`docs/seed/` pair re-packed together —
  survey-derived fifth live surface); (2) a new sibling test case T2.5d on an orphan-HEAD fixture,
  plus a count-free rewrite of the T2.9 route-identity census so this very addition cannot re-stale
  it; (3) in-place narrowing of ADR 0023's overclaiming amendment sentence plus a deferring
  parenthetical on the decision (B) normal-path bullet. A repo-wide `0/2/3` grep — **unfiltered by
  file type** (the fifth stale surface is a `.json` manifest) — is the completeness floor — every
  hit fixed or carrying a leave-rationale — backed by the mandatory same-scope hand-scan of the
  edited files. Historical specs/plans, D15's subjects, and the archived lesson stay uncorrected by
  convention. Prose latitude is the worker's; the checkable content (all four arms, exit 6's
  no-push/refs-untouched semantics, exit 3's widened triggers) is the floor.
- **End state:**
  1. `docs/learnings/land-advance-push-first-cas-rejected-token.md` carries no bare `0/2/3`
     (`grep '0/2/3' <file> | grep -v '0/2/3/6'` is empty), greps positive for a `6` arm with
     refusal semantics (wrong-HEAD precheck; nothing pushed, local and origin refs untouched) and
     for the unresolvable `HEAD`/`<new-sha>` exit-3 triggers; the frontmatter `description` is
     still one line; `metadata.keywords` (nested, never top-level) gains `wrong-HEAD precheck` —
     verified behaviorally: `node skills/_shared/war-memory.mjs query 'wrong-HEAD precheck' --repo
     docs/learnings` returns this lesson (retrieval proves the keyword landed **nested** under
     `metadata.keywords`; a top-level `keywords:` is silently not indexed and would pass a
     presence-grep).
  2. `bash skills/war/assets/provision-worktrees.test.sh` passes with a new case **T2.5d**
     asserting: exit code exactly `3` (never 2, never 6), die output carrying the
     `could not resolve HEAD to a commit` substring, and local `refs/heads/<working>` **and**
     origin ref byte-unchanged — on an orphan-HEAD fixture (`git checkout --orphan`) built from
     the standard `setup_origin_pair` + `seed_working_branch` scaffolding with a *resolvable*,
     origin-distinct `<new-sha>`. HARD-provable from the captured gate artifact: the engine-owned
     gate composition (`resolveGate`, ADR 0036 — the GATE COMPOSITION POINT in
     `workflow-template.js` normalizes `plan.gate` before every gate-bearing dispatch) appends the
     repo-wide shell-suite discovery loop to every declared gate, so the threaded gate log carries
     a per-suite `== gate(bash): … ==` banner line naming this suite's path.
  3. The worker's done report records the one-off red proof — the probe command and its failing
     output threaded verbatim: with the T2.5d fixture in place, temporarily asserting exit 6 (or
     asserting T2.5c's `does not resolve to a commit` die text) fails — the case discriminates the
     HEAD arm from both sibling arms. (Done-report evidence only — a deliberately uncommitted
     probe; gate-audit treats the resulting cannot-confirm as SOFT, never a hold, per the recorded
     doctrine.)
  4. `provision-worktrees.test.sh` no longer contains `shared by T2.3/T2.6` (whole-file grep), and
     the **replacement census paragraph** — the T2.9 block-comment lines from the invariant
     sentence through its `(b)+(c)+(d)` lead-in — greps zero for `T2\.` (sentence-scoped by
     construction: the legitimate T2.3/T2.6 references in the block's opening paragraph and in the
     (b)/(d) sub-bullets sit outside the scanned span, so they neither false-fail the check nor
     grandfather a new enumeration). The paragraph states the invariant (the push-error branch is
     the only **silent** exit-3 route; every other exit-3 route dies loudly with route-naming text;
     route identity rests on (b)+(c)+(d) together); the (b)/(c)/(d) assertion code is
     byte-unchanged.
  5. `docs/adr/0023-land-asserts-git-ground-truth.md`'s amendment no longer claims the 0/2/3
     contract is byte-unchanged (the string `the 0/2/3 contract are byte-unchanged` greps empty);
     the narrowed sentence states: push form and `[rejected]` exit-2 classification byte-unchanged;
     exit 3 remains the escalate class and gains the unresolvable-`HEAD`/`<new-sha>` triggers;
     exit 6 is new. The decision (B) normal-path bullet gains a parenthetical deferring to the
     amendment for the widened contract.
  6. Zero collateral drift: `node --test 'skills/**/*.test.mjs'` green (D15 and the doc-contract
     suite untouched), the shell-test sweep over `hooks/` and `skills/` green, assertion/expectation
     edits in no file but `provision-worktrees.test.sh`, and `provision-worktrees.sh` byte-untouched.
     Checkable as absence, not inferred from a green suite: the phase's
     `git diff --name-only <frozen phase base>...<integrated tip>` file list equals exactly the
     Phase-1 `Files:` union of this plan — each worker threads its task's name-only diff list into
     its done report, and gate-audit re-derives the union at the integrated tip.
  7. Sweep completeness: the repo-wide, file-type-unfiltered `0/2/3` grep plus the mandatory
     same-scope title/comment survey of the edited files yields no unadjudicated hit — every match
     is fixed by this plan or carries a leave-rationale from the spec's §4.4 table (historical,
     archived, or arm-local), with the two table corrections in Task 1.3's slice.
  8. Release lands last: all four version slots in lock-step at the next free patch above the live
     integration base; `version-slots.test.mjs` green.
  9. Seed corpus truth: `docs/seed/seed-manifest.json`'s entry for slug
     `land-advance-push-first-cas-rejected-token` states the contract as 0/2/3/6 in its
     `description` (no bare `0/2/3` anywhere in the manifest —
     `grep '0/2/3' docs/seed/seed-manifest.json | grep -v '0/2/3/6'` empty);
     `node skills/lessons-learned/assets/seed-pack.mjs verify docs/seed` exits 0; the
     `seed-set.test.mjs` suite stays green (its pins are pair-integrity only — verified at
     drafting: verify-passes + one-byte-mutation-fails, no content pins).

## Build order (for /war)

1. **Phase 1 — Standing-record truth sweep + T2.5d coverage** (waves: 1.1 ∥ 1.2 ∥ 1.3 — file-disjoint)
2. **Phase 2 — Release** (trailing, own phase)

## Phase 1 — Standing-record truth sweep + T2.5d coverage

### Task 1.1: Lesson truth fix — the prefetched land-path lesson and its seed-corpus twin state 0/2/3/6 (#1035 + survey-derived)

- Files: `docs/learnings/land-advance-push-first-cas-rejected-token.md`, `docs/seed/seed-manifest.json`, `docs/seed/seed.tar.gz`
- Plan slice: Exactly the three stale spots (spec §4.1), each staying one line, plus one keyword —
  nothing else in the file moves. (a) Frontmatter `description`: state the contract as `0/2/3/6`
  (e.g. append `/6` and a wrong-HEAD gloss) — it is a MEMORY.md projection row, keep it one line.
  (b) The **Exit contract:** line: extend to all four arms — `3` = any other failure, an
  unresolvable `HEAD`/`<new-sha>`, or origin != new_sha after push (escalate / land_stale); `6` =
  wrong-HEAD precheck refusal (invoked from a worktree whose HEAD is not the merge sha) — nothing
  pushed, local and origin refs untouched, never a reland. Exact prose is worker latitude; the
  checkable content is: all four arms present, exit 6's no-push/refs-untouched semantics stated,
  exit 3's widened triggers named. (c) The **How to apply:** line: `0/2/3` → `0/2/3/6` (its
  deferral to the script's header comment as contract of record stays). Then add
  `wrong-HEAD precheck` to the nested `metadata.keywords` list (nested under `metadata:` — a
  top-level `keywords:` is silently not indexed). `metadata.type: project`, provenance story, the
  **Rule:**/**Why:** lines, the spec-residual note, and the Related links are untouched — this is a
  content correction via a normal reviewed change, not a servitor write. Perform the same-scope
  hand-scan of the full lesson body for stragglers (grep is a floor). The edit must introduce no
  home paths, emails, handles, or credential shapes (redaction lint is the CI backstop, below).
  **Seed-corpus twin (survey-derived — the sweep's fifth live surface).** The plugin seed corpus
  ships a portability-stripped copy of this lesson (`docs/seed/seed.tar.gz` member
  `land-advance-push-first-cas-rejected-token.md`; the pair's `seed-manifest.json` entry carries
  the stale `exit 0/2/3 contract` description, sha256-pinned). Fix it in the same task, from the
  corrected content: unpack the current `seed.tar.gz` to a staging dir, apply the **same** edits
  to the member **in place** (three spots + the keyword) — never blind-copy the repo-root file over
  it, the member's stripped shape (no `phase`/`tasks`/`related`/`originSessionId` keys, no Related
  line — verified at drafting) is deliberate — then re-pack the pair together:
  `node skills/lessons-learned/assets/seed-pack.mjs pack <staging-dir> --out docs/seed` (the pack
  regenerates the manifest `description` and sha256 from the member, keeping the pair coherent per
  the seeding.md re-pack procedure). Verify per End state 9. All other members byte-unchanged.
- requiresTest: false — docs-tier (lesson content + coherent corpus re-pack); the existing
  `seed-set.test.mjs` integrity suite and the fail-closed CI redaction lint are the guards
  (no-test route recorded here for the floor)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: T2.5d unresolvable-HEAD case + count-free T2.9 census (#1036, #1037 — same file, one task)

- Files: `skills/war/assets/provision-worktrees.test.sh`
- Plan slice: **New case T2.5d — unresolvable HEAD (precheck escalate arm), spec §4.2.** Insert as a
  sibling after the T2.5c block and before T2.6 — additive within the T2.5 family, no reordering of
  existing cases, its own fixture (each T2.x builds its own `setup_origin_pair`; no cross-case
  reuse). Fixture, in this order: `setup_origin_pair` + `seed_working_branch` (T2.5c's scaffolding
  shape); **first** commit the `<new-sha>` in clone1 on its checked-out default branch — the
  T2.2/T2.5 idiom (`add` + `commit` after the seed), which leaves the local follower
  `refs/heads/<working>` untouched (the seed helper parks it at the seed sha; committing on the
  default branch never moves it) and yields a `<new-sha>` that is resolvable and ahead of the
  origin tip; **then** `git checkout -q --orphan <fresh-name>` in clone1 so HEAD is unborn — the
  orphan branch name MUST be a fresh name, never the seeded `<working>` branch
  (`git checkout --orphan <existing-name>` refuses, rc 128 — probe-verified at drafting; the case
  comment records this deliberate divergence from the family's branch-naming idiom); capture the
  pre-call local follower and origin tips; invoke `land-advance <working> <new-sha>` from clone1.
  Because origin is non-empty and its tip differs from `<new-sha>`, control provably passes the
  step-0 guard arms (rc-guard, phantom, already-landed) and dies at the precheck's `HEAD^{commit}`
  resolution.
  Assertions, mirroring the T2.5c family shape: exit exactly `3` (`EX_FOREIGN`) — never 2, never 6
  (wrong-HEAD *mismatch* requires a resolvable HEAD); die output carries
  `could not resolve HEAD to a commit` (discriminates from T2.5c's `does not resolve to a commit`
  and from the silent push-error exit 3); local and origin refs byte-unchanged. The case comment
  records in one line: the phase-close waiver claimed production-unreachability, but an orphan-HEAD
  cwd reaches the arm deterministically — fixture infeasibility and production unreachability are
  different claims. Two fixture notes go in the comment (spec §8): the orphan checkout leaves the
  prior tree staged in the index and the fixture does not care (no commit is made; land-advance
  reads only HEAD/refs — do not "fix" this with `git rm`); and the script resolves `HEAD^{commit}`
  *before* `<new-sha>^{commit}`, so the case passes a *resolvable* `<new-sha>` to make the failure
  unambiguously the HEAD arm — comment must match the real first-failing arm, never rely on die
  order. Red proof per End state 3, then commit the green form. bash-3.2-safe, cwd-independent.
  **T2.9 census rewrite (#1037).** Replace the `Exit 3 alone is shared by T2.3/T2.6` sentence in
  the T2.9 block comment with a count-free invariant: exit 3 is shared by multiple routes, every
  one of which dies loudly with route-naming text; the push-error branch is the only **silent**
  exit-3 route (land-advance captures push output internally and prints nothing), so route identity
  rests on (b)+(c)+(d) together. No T2.x case-ID enumeration anywhere in the replacement paragraph
  (End state 4's sentence-scoped check: the paragraph from the invariant sentence through the
  `(b)+(c)+(d)` lead-in greps zero for `T2\.`) — the anti-rot property #1037 asks for, and what
  makes T2.5d's exit-3 addition safe. The (b)/(c)/(d)
  assertion code and every other T2.9 line (including the arm-local `0/2/3 contract in
  cmd_land_advance's CLASSIFY header` citation, accurate as scoped) are untouched. Same-scope
  hand-scan of the file's T2.x block comments and `expect` titles for stragglers.
- requiresTest: true — the deliverable is the test; the diff touches `provision-worktrees.test.sh`,
  satisfying the test floor
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: ADR 0023 truthfulness + repo-wide sweep adjudication (#1038 + survey-derived)

- Files: `docs/adr/0023-land-asserts-git-ground-truth.md`
- Plan slice: **Amendment narrowing (spec §4.3).** In the amendment's paragraph anchored by the
  bold lead-in `Consequence — the point of the change.` (never a line number), replace the
  overclaiming sentence with the narrowing, naming both new exit-3 triggers truthfully (matching
  the script header's own `unresolvable HEAD/<new-sha>` wording): the push form and the
  `[rejected]` exit-2 classification are byte-unchanged; exit 3 remains the escalate class and
  gains the unresolvable-`HEAD`/`<new-sha>` triggers; exit 6 is new. In-place surgical narrowing —
  no appended correction paragraph (a reader who stops early must not meet the false sentence).
  The paragraph's following sentence (the rejected explicit-refspec alternative) is accurate and
  stays. **Decision (B) parenthetical (survey-derived, spec §4.4).** The (B) normal-path bullet's
  "The 0/2/3 exit contract is unchanged." is an arm-local claim written pre-amendment; append a
  short deferring parenthetical — e.g. "(exit 6 and the widened exit-3 triggers arrive with the
  wrong-HEAD amendment below)" — so a reader who stops at (B) is not misled the way #1038's reader
  was. **Sweep re-run (spec §4.4 — this task owns it).** Re-run the repo-wide `0/2/3` grep at the
  task's own base — **plain `grep -r`, no file-type filter** (docs, skills, hooks, agents,
  `CONTEXT.md`; a `--include='*.md'`-style filter is exactly how the spec's own authored sweep
  missed the `.json` seed manifest) — and adjudicate every hit against the spec's §4.4 table with
  two drafting-time corrections: (i) the table's `cmd_land_advance` CLASSIFY/exit-codes row is
  **vacuously satisfied** — `provision-worktrees.sh` contains no literal `0/2/3` token at all
  (verified at drafting; the "CLASSIFY header" 0/2/3 citation the spec means lives in the T2.9
  test comment, which has its own leave row); (ii) the table omits ADR 0023's amendment-rationale
  clause "6 is already distinct from 0/2/3" — adjudicated **leave** (arm-local and accurate: it
  states exit 6's distinctness from the push/classify arms). Dispositions: hits in this task's
  file → fixed here; hits in the Task 1.1/1.2 files (including `docs/seed/seed-manifest.json`) →
  adjudicate as fixed-in-flight by the sibling task, this phase; the known leaves stand as
  adjudicated (ADR 0023's "Uncorrected by convention" paragraph — it describes D15's subject, the
  historical spec's genuinely-0/2/3 prose; the D15 row comment, title, and assertion strings in
  `skills/war/assets/skill-doc-contracts.test.mjs` — they guard the historical spec's dated prose;
  the T2.9 comment's arm-local CLASSIFY citation; historical plans/specs — including this plan and
  its spec, which quote `0/2/3` with legitimate history; the archived lesson
  `docs/learnings/archive/checkpoint-auto-recover-prose-is-silent-on-rejected-cas-loss.md`). A
  genuinely new, unadjudicated **live standing** hit outside all three task footprints is
  REPORTED in the done report as a named partial deferral (`war-followup`), never edited — footprint
  discipline over sweep zeal (ADR 0017: no prose waiver; the Lead files it at phase close). Record
  the adjudication summary in the done report. Hand-scan ADR 0023's decision (B) and amendment
  sections for stragglers beyond the grep.
- requiresTest: false — docs-tier (ADR prose; no doc-contract test pins this wording)
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: This plan changes a shipped test asset (`skills/war/assets/provision-worktrees.test.sh`)
  and the plugin-shipped seed corpus pair (`docs/seed/`) — users receive both only via a release.
  Bump all four release slots together to the **next free
  patch above the live integration base at land time** (never a resolved semver literal, per the
  /war-strategy §2 next-free-patch convention; version literals in plans are non-authoritative):
  `plugin.json` `version`, `marketplace.json` `metadata.version` **and** `plugins[0].version`, and
  the `README.md` `## Status` line (replace-in-place, never emptied, no badge).
  `skills/war/assets/version-slots.test.mjs` is the lock-step arbiter — a partial bump is a red
  test (End state 8). Expected integration base: the campaign working branch tip after this plan's
  Phase 1 lands — this is the **first** plan of the land-advance survey campaign, so at land time
  the slots should still read the pre-campaign live version; resolve from the four slots as they
  stand at land, not from any plan literal. Standalone fallback: a run through plain `/war`
  (outside the campaign) resolves the next free patch from the four slots itself. Release blurb
  describes the change additively and precisely: standing records of the `land-advance` exit
  contract now state 0/2/3/6, and the unresolvable-HEAD precheck arm gains deterministic test
  coverage — never a claim that any script behavior changed (`provision-worktrees.sh` is
  byte-untouched).
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0 on the edited lesson · why
  deferred: the redaction lint is CI-only, never gate-composed (recorded
  `gate-artifact-never-includes-war-memory-lint` — a plan End state citing it would be structurally
  SOFT); the worker runs it locally as a courtesy check but it is not gate evidence · runner: CI
  (`memory-audit.yml`) on the campaign PR.
- Integrated-tip sweep re-check — one repo-wide, file-type-unfiltered `0/2/3` grep on the landed
  Phase-1 tip confirming End state 7's shape holds after the serial merge · why deferred: sweep
  completeness is a
  whole-repo property spanning three parallel tasks that each adjudicate at their own frozen base;
  only the integrated tip proves the union · runner: the Lead at Phase-1 land (one grep + the §4.4
  table), before dispatching Phase 2.

## Notes / conscious deviations

- **Decomposition:** #1036 and #1037 share `provision-worktrees.test.sh`, so they are one task
  (same file → same task, never a dep-wave dodge). The three Phase-1 tasks are file-disjoint and
  run in one parallel wave; nothing here needs a landed phase edge except the release. Release is
  its own trailing phase per the rule.
- **Sweep ownership carve-out:** Task 1.3 owns the repo-wide grep re-run because its own
  survey-derived fix (the (B) parenthetical) came from it; hits inside sibling footprints are
  adjudicated fixed-in-flight, and a new out-of-footprint live hit is reported (`war-followup`),
  never edited — mirroring the straggler-ownership adjudication ratified in the
  merge-land-resilience plan.
- **Anchors:** all edits anchor by named construct (frontmatter key, **Exit contract:** /
  **How to apply:** lead-ins, the T2.5c/T2.9 block comments, the `Consequence — the point of the
  change.` bold lead-in) — the line numbers quoted in the issues have already drifted across the
  serial merge queue.
- **No drift guard binding the lesson body to the script header** (spec decision 2, §9): the
  `process-recipe-lesson-body-is-not-drift-guarded-by-any-test` class stays open by design; a
  general lesson-body guard is a separate proposal no issue in this group requests.
- **Uncorrected by convention (spec §2, §9):** the 2026-06-25 spec §5.3 (D15's subject), all
  historical plans/specs, and the archived lesson keep their 0/2/3 prose as dated records. D15 and
  the whole doc-contract suite must pass byte-untouched — an auditor finding
  `skill-doc-contracts.test.mjs` unmodified is confirming the design, not catching an omission.
- **No T2.9 assertion strengthening** (spec §9): #1037 is comment-accuracy only; the (b)+(c)+(d)
  logic is sound and untouched.
- **`requiresPackaging: false` throughout** — no packaging surface in this repo (the packaging
  floor is a no-op without a Dockerfile).
- **Redaction:** no absolute home paths, emails, or handles anywhere in the edited lesson, this
  plan, or the release blurb. Pre-flighted at drafting: the planned strings (`0/2/3/6`,
  `wrong-HEAD precheck`, the exit-6/exit-3 gloss) carry none of the lint's fail-closed shapes
  (home paths, emails, handles, credential tokens); the worker's local lint run is confirmation,
  not discovery.
- **Gate provability (grill Q4):** no gate directive in this plan enumerates `*.test.sh` suites
  (the §2 rule). End states 2/4 are still HARD-checkable because the gate the refiner dispatches
  is engine-composed: the GATE COMPOSITION POINT in `workflow-template.js` normalizes `plan.gate`
  through `resolveGate` (ADR 0036, idempotent) before any dispatch interpolates it, and the
  composition appends the repo-wide `*.test.sh` discovery loop — the captured gate artifact
  carries a per-suite `== gate(bash): … ==` marker. The recorded
  `refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind` lesson predates ADR 0036
  and is stale on this point — an auditor should trust the composition point in the live engine,
  not the lesson.
- **Live vs historical boundary (grill Q10, for auditors):** editing ADR 0023's decision (B)
  bullet and amendment sentence does not breach the "historical artifacts stay uncorrected"
  convention — that convention covers **dated, superseded artifacts** (the 2026-06-25 spec §5.3
  that D15 deliberately pins, prior plans/specs, archived lessons). ADR 0023 is the **live
  authority** on the land primitive's assertions (its own amendment says so), and a live ADR's
  false claim about the present contract is exactly the class of standing record this spec exists
  to correct (spec decision 6 resolves the edit in place).
- **Seed-pair fix is survey-derived, not scope creep (grill Q1):** the spec's §4.4 table has no
  `docs/seed/` row because its authored grep was file-type-filtered; the unfiltered sweep this
  plan mandates surfaces the manifest's stale description. The grep-as-floor rule routes it as a
  survey-derived correction into Task 1.1 (the member is regenerated from the corrected lesson —
  one cohesive unit). `seed-set.test.mjs` pins pair integrity only (no content pins, verified at
  drafting), so a coherent re-pack stays green.
- **MEMORY.md projection (grill Q14):** deliberately out of scope for every task. The local
  `MEMORY.md` is a generated projection in the untracked local memory root — outside the repo and
  outside worker confinement. It refreshes through the run's normal channels (the servitor /
  render-index pass, or the operator's next `/lessons-learned`), picking up the corrected
  description then; nothing in this plan writes it.

## Open decisions

None — the spec's design tree resolved all seven decisions; remaining latitude (exact lesson prose,
T2.5d variable naming, the parenthetical's exact wording) is the worker's within the checkable
floors stated per task.
