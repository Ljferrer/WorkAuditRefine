# Land-advance exit-contract truth sweep — align every live standing record with the 0/2/3/6 contract, and close the unresolvable-HEAD test gap

**Source issues: #1035, #1036, #1037, #1038** (group `land-advance-exit-contract-truth`, survey
2026-07-24). All four are `war-followup` debt from plan 4/9 of the merge-land-resilience campaign
(landed tip `5447012`); all four are verified still live on the working tree. No sibling-spec
dependencies (`dependsOn` is empty).

## 1. Context — the gap / problem

The merge-land-resilience plan widened `cmd_land_advance`'s exit contract: a wrong-HEAD precheck
(step 0b in the script's header comment) added a fourth arm — `EX_WRONG_BRANCH` (6), a pre-push
refusal that touches no refs — and gave the escalate class (exit 3, `EX_FOREIGN`) two new
unresolvable-ref triggers (`git rev-parse "HEAD^{commit}"` and `git rev-parse "<new-sha>^{commit}"`
failures). The script's own exit-code block (`cmd_land_advance` header in
`skills/war/assets/provision-worktrees.sh`) is the canonical contract and correctly documents
0/2/3/6. Four standing records around it did not keep up:

- **#1035 — the prefetched repo-root lesson is stale.**
  `docs/learnings/land-advance-push-first-cas-rejected-token.md` still states the contract as 0/2/3
  in three spots: the frontmatter `description`, the **Exit contract:** line, and the
  **How to apply:** line. This lesson is exactly the one the Lead prefetches into worker/auditor
  seats for land-path work, so the stale contract propagates into future runs — a live instance of
  the recorded `process-recipe-lesson-body-is-not-drift-guarded-by-any-test` class.
- **#1036 — the unresolvable-HEAD die arm has zero test coverage.** In
  `skills/war/assets/provision-worktrees.test.sh`, T2.5 covers the wrong-HEAD mismatch die (exit 6)
  and T2.5c covers the unresolvable-`<new-sha>` die (exit 3), but the `HEAD^{commit}` resolution
  failure ("could not resolve HEAD to a commit …" → `EX_FOREIGN`) has no case. The phase-close
  waiver claimed the arm "needs an unborn-HEAD clone the refiner can never produce"; the servitor's
  code trace proved that wrong — an orphan-HEAD fixture (`git checkout --orphan`) reaches the die
  deterministically (recorded as `closure-rationale-infeasibility-claim-needs-code-trace-not-assertion`).
- **#1037 — the T2.9 route-identity census is stale against its own file.** The T2.9 block comment
  in `provision-worktrees.test.sh` still reads "Exit 3 alone is shared by T2.3/T2.6", but the same
  plan later added T2.5c, which also exits 3. Comment accuracy only — the route-identity guard
  logic ((b)+(c)+(d)) is unaffected. Note the coupling with #1036: this spec adds another exit-3
  case (the unresolvable-HEAD fixture), so a re-enumerated count would go stale *again* in the same
  change — the census must become count-free.
- **#1038 — the ADR 0023 amendment overclaims.** The "Consequence" sentence of the wrong-HEAD
  amendment in `docs/adr/0023-land-asserts-git-ground-truth.md` claims "The push form, the
  `[rejected]` classification, and the 0/2/3 contract are byte-unchanged". The first two hold; the
  third is false — the amendment itself added the exit-6 arm to the exit-code block and gave exit 3
  the new unresolvable-`HEAD`/`<new-sha>` triggers. Same overclaim class as the recorded
  `release-blurb-overstates-guard-semantics` lesson. No doc-contract test pins the current wording,
  so the edit trips no guard.

One theme, one sweep: the *code* is right; every **live standing record** of the contract must say
what the code says, and the one untested arm must gain its deterministic fixture.

## 2. Pivotal constraints

- **The script header is the contract of record.** `cmd_land_advance`'s header comment in
  `skills/war/assets/provision-worktrees.sh` (exit-codes block + step 0b) is canonical; every other
  surface is a follower. Nothing in this spec changes the script — prose and tests move toward it,
  never the reverse.
- **Historical artifacts stay uncorrected by convention.** ADR 0023's own "Uncorrected by
  convention" paragraph and the D15 doc-contract row deliberately preserve the 2026-06-25 spec §5.3
  as a dated record whose supersession pointer names `cmd_land_advance`. Prior plans/specs and the
  archived lesson `checkpoint-auto-recover-prose-is-silent-on-rejected-cas-loss` that mention 0/2/3
  record decision-time state and are **not** edited (see §9). Only *live standing* surfaces (hot
  lesson, live ADR consequence prose, live test comments) are corrected.
- **D15 is unaffected and must stay green.** The D15 row in
  `skills/war/assets/skill-doc-contracts.test.mjs` guards the *historical spec's* §5.3 (presence of
  `exit 0`/`exit 2`/`exit 3` + the `cmd_land_advance` pointer). This spec touches none of D15's
  subjects; the full JS suite must stay green with zero test-expectation edits outside the files
  named in §5.
- **Projection byte budget.** The lesson's frontmatter `description` drives the MEMORY.md
  projection (`projection-byte-budget-driven-by-descriptions-not-bodies`); the corrected description
  stays one line and does not grow the projection materially.
- **Redaction lint must pass on the lesson edit.** The edit to `docs/learnings/` must pass
  `node skills/_shared/war-memory.mjs lint docs/learnings/`. Per the recorded
  `gate-artifact-never-includes-war-memory-lint` lesson this lint is CI-only, never gate-composed —
  so it is a deferred/CI validation, not a gate-checkable End state (see §10).
- **Test-file discipline.** `provision-worktrees.test.sh` is bash-3.2-safe and cwd-independent; the
  new case must follow both. It must also be additive within the T2.5 family — no reordering of
  existing cases, no fixture reuse across cases (each T2.x builds its own `setup_origin_pair`).
- **New exit-3 route interacts with T2.9.** Any new exit-3 test case must not invalidate T2.9's
  route-identity argument; the count-free census rewrite (#1037) is what makes the addition safe.

## 3. Resolved design tree

| # | Decision | Options | Resolution |
|---|----------|---------|------------|
| 1 | Lesson update scope (#1035) | (a) full-body rewrite; (b) three-spot minimal edit | **(b).** Edit exactly the three stale spots — frontmatter `description`, **Exit contract:** line, **How to apply:** line — stating 0/2/3/6 with exit 6's meaning (wrong-HEAD precheck refusal; nothing pushed, refs untouched) and exit 3's widened triggers (unresolvable `HEAD`/`<new-sha>`). The **Rule:**/**Why:** lines and the spec-residual note remain accurate and untouched. |
| 2 | Drift-guard the lesson body? | (a) add a doc-contract test binding the lesson's exit-contract line to the script header; (b) doc-only fix | **(b).** #1035 asks for the doc fix; lesson bodies are deliberately un-drift-guarded (recorded class). A guard is deferred (§9) — it would be a new test surface no issue requests. |
| 3 | New test-case shape (#1036) | (a) unborn-HEAD via fresh `git init` (no commits); (b) orphan-HEAD via `git checkout --orphan` in a standard clone-pair fixture | **(b).** The orphan checkout inside the existing `setup_origin_pair` + `seed_working_branch` idiom keeps the fixture family uniform and — critically — keeps origin non-empty with a resolvable, distinct `<new-sha>`, so control provably passes the step-0 guard arms (rc-guard, phantom, already-landed) and reaches the precheck's `HEAD^{commit}` resolution, which fails deterministically on the unborn orphan HEAD. A no-commit `git init` fixture would fail earlier at the ls-remote rc-guard, testing the wrong arm. |
| 4 | New case identity | (a) extend T2.5c; (b) new sibling case T2.5d | **(b).** T2.5c pins the unresolvable-`<new-sha>` arm; the unresolvable-HEAD arm is a distinct die site with distinct message text. One case = one arm, matching the family's existing granularity. |
| 5 | T2.9 census fix (#1037) | (a) re-enumerate as T2.3/T2.6/T2.5c(+T2.5d); (b) count-free invariant statement | **(b)** — the issue's own preferred option, and forced by decision 3/4: this very spec adds another exit-3 route, so any enumeration authored here is stale within the same diff. Restate the rationale as the invariant: the push-error branch is the only **silent** exit-3 route (land-advance captures push output internally and prints nothing), while every other exit-3 route dies loudly with route-naming text; route identity rests on (b)+(c)+(d) together. No assertion changes. |
| 6 | ADR 0023 fix (#1038) | (a) append a new correction paragraph; (b) narrow the one overclaiming sentence in place | **(b).** The issue supplies the narrowing: the push form and the `[rejected]` exit-2 classification are byte-unchanged; exit 3 remains the escalate class and gains the unresolvable-`HEAD`/`<new-sha>` triggers; exit 6 is new. In-place surgical narrowing keeps the amendment's "Consequence" paragraph single-voiced; a trailing correction paragraph would leave the false sentence standing for a reader who stops early. |
| 7 | Scope of the truth sweep | (a) fix only the four issue-named spots; (b) token-sweep `0/2/3` repo-wide and adjudicate every hit | **(b)** — floor + survey (§4.4). The four fixes are the confirmed corrections; the sweep proves no fifth live surface is stale and records an explicit leave-rationale for every historical/arm-local hit. |

## 4. Mechanics

### 4.1 Repo-root lesson (`docs/learnings/land-advance-push-first-cas-rejected-token.md`) — #1035

Three edits, each one line:

1. Frontmatter `description`: state the contract as 0/2/3/6 (e.g. append `/6` and the wrong-HEAD
   gloss) while keeping a single line — the description is a MEMORY.md projection row.
2. **Exit contract:** line: extend to `… 3 = any other failure, an unresolvable HEAD/<new-sha>, or
   origin != new_sha after push — escalate / land_stale; 6 = wrong-HEAD precheck refusal (invoked
   from a worktree whose HEAD is not the merge sha) — nothing pushed, local and origin refs
   untouched, never a reland`. Exact prose is the worker's latitude; the checkable content is: all
   four arms present, exit 6's no-push/refs-untouched semantics stated, exit 3's widened triggers
   named.
3. **How to apply:** line: `0/2/3` → `0/2/3/6` (the line already defers to the script's header
   comment as the contract of record — that deferral stays).

The nested `metadata.keywords` list gains `wrong-HEAD precheck` (retrieval: the new arm is the
likeliest future query term). No other frontmatter changes; `metadata.type: project` and the
provenance story are untouched — this is a content correction to an existing repo-root lesson via a
normal reviewed change, not a servitor write.

### 4.2 Test coverage (`skills/war/assets/provision-worktrees.test.sh`) — #1036, #1037

**New case T2.5d — unresolvable HEAD (precheck escalate arm).** Fixture: `setup_origin_pair` +
`seed_working_branch` (identical scaffolding to T2.5c), then in clone1 `git checkout -q --orphan
<branch>` so HEAD is unborn; capture the pre-call local follower and origin tips; invoke
`land-advance <working> <valid-seeded-new-sha>` from clone1. Because origin is non-empty and its tip
differs from `<new-sha>`, control passes the step-0 arms and dies at the precheck's HEAD
resolution. Assertions, mirroring the T2.5c family shape:

- exit code is exactly `3` (`EX_FOREIGN`) — never 2 (reland) and never 6 (wrong-HEAD *mismatch* is
  a different arm: it requires a *resolvable* HEAD that differs from `<new-sha>`);
- the die output carries the `could not resolve HEAD to a commit` substring (route-naming text —
  this is what discriminates T2.5d from T2.5c's `does not resolve to a commit` and from the bare
  silent push-error exit 3);
- local `refs/heads/<working>` byte-unchanged and origin ref byte-unchanged (die precedes any push
  or update-ref).

The case block's comment records the waiver refutation in one line: production-unreachability was
claimed, but an orphan-HEAD cwd reaches the arm deterministically — fixture infeasibility and
production unreachability are different claims.

**T2.9 census rewrite.** Replace the "Exit 3 alone is shared by T2.3/T2.6" sentence with a
count-free invariant: exit 3 is shared by multiple routes, every one of which dies loudly with
route-naming text; the push-error branch is the **only silent** exit-3 route, so route identity
rests on (b)+(c)+(d) together. No enumeration of case IDs anywhere in the rewritten sentence — that
is the anti-rot property #1037 asks for. The (b)/(c)/(d) assertion code is untouched.

### 4.3 ADR 0023 (`docs/adr/0023-land-asserts-git-ground-truth.md`) — #1038

In the amendment's "Consequence — the point of the change." paragraph (anchored by that bold lead-in,
not a line number), replace the overclaiming sentence with the issue's narrowing, adjusted to name
both new exit-3 triggers truthfully (matching the script header's own `unresolvable HEAD/<new-sha>`
wording): the push form and the `[rejected]` exit-2 classification are byte-unchanged; exit 3
remains the escalate class and gains the unresolvable-`HEAD`/`<new-sha>` triggers; exit 6 is new.
The paragraph's following sentence (the rejected explicit-refspec alternative) is accurate and
stays.

### 4.4 Truth sweep (token sweep — survey note mandatory)

Grep `0/2/3` repo-wide (docs, skills, hooks, agents, `CONTEXT.md`) and adjudicate **every** match:
fix if a live standing surface states the widened contract wrongly, leave-with-rationale if
historical, archived, or arm-local. **This grep is a completeness floor, not a ceiling** — after the
grep, hand-scan the same-scope comments and test titles of the three edited files (the lesson's
full body, `provision-worktrees.test.sh`'s T2.x block comments and `expect` titles, ADR 0023's
decision (B) and amendment sections, plus `cmd_land_advance`'s header comment as the canonical
reference) and list each straggler as a survey-derived correction.

Sweep adjudication as measured on the current tree (the executing worker re-runs and re-adjudicates
at its own base — this table is the authored floor):

| Surface (named construct) | Disposition |
|---|---|
| Lesson `description` / **Exit contract:** / **How to apply:** lines | **Fix** (§4.1) |
| ADR 0023 amendment "Consequence" sentence | **Fix** (§4.3) |
| `provision-worktrees.test.sh` T2.9 census sentence | **Fix** (§4.2) |
| ADR 0023 decision (B), normal-path bullet ("The 0/2/3 exit contract is unchanged.") | **Survey-derived fix (minor):** arm-local claim about the push/classify path, written pre-amendment; add a short parenthetical deferring to the amendment for the widened contract (e.g. "(exit 6 and the widened exit-3 triggers arrive with the wrong-HEAD amendment below)") so a reader who stops at (B) is not misled the same way #1038's reader was. |
| ADR 0023 "Uncorrected by convention" paragraph ("the 0/2/3 exits") | **Leave:** it describes D15's subject — the *historical spec's* §5.3 content — which genuinely still documents 0/2/3 by convention. |
| `cmd_land_advance` CLASSIFY step + exit-codes block in `provision-worktrees.sh` | **Leave:** canonical and already correct (the CLASSIFY step's 0/2/3 is arm-local to the push classification; the exit-codes block documents all four arms). |
| `provision-worktrees.test.sh` T2.9 comment "the 0/2/3 contract in cmd_land_advance's CLASSIFY header" | **Leave:** arm-local citation of the CLASSIFY step, accurate as scoped. |
| `skill-doc-contracts.test.mjs` D15 row comment + title + assertion strings | **Leave:** they guard the historical spec's dated prose, which is 0/2/3 by design. |
| Historical plans/specs (`docs/plans/`, `docs/specs/` 2026-06-25 … 2026-07-22 artifacts) | **Leave:** decision-time records, uncorrected by convention (ADR 0023's own paragraph; recorded `spec-context-band-statement-of-drift-survives-code-changes-uncorrected` class). |
| Archived lesson `docs/learnings/archive/checkpoint-auto-recover-prose-is-silent-on-rejected-cas-loss.md` | **Leave:** cold storage records as-of-time facts; archiving is a move + note, archived bodies are not maintained. |

## 5. Surface changes

| File | Change |
|---|---|
| `docs/learnings/land-advance-push-first-cas-rejected-token.md` | Three one-line edits (description, Exit contract, How to apply) + one keyword (§4.1) |
| `skills/war/assets/provision-worktrees.test.sh` | New case T2.5d (orphan-HEAD → exit 3 + die text + refs-untouched); T2.9 census sentence rewritten count-free (§4.2) |
| `docs/adr/0023-land-asserts-git-ground-truth.md` | Amendment "Consequence" sentence narrowed; decision (B) normal-path bullet gains a deferring parenthetical (§4.3, §4.4) |

No production code changes. `provision-worktrees.sh`, `workflow-template.js`, hooks, and all other
test suites are untouched.

## 6. New domain terms (CONTEXT.md)

None. "Wrong-HEAD precheck", `EX_WRONG_BRANCH`, and `EX_FOREIGN` are established by the
merge-land-resilience spec and ADR 0023's amendment; this spec only propagates them.

## 7. Recommended ADRs

None. #1038 is a truthfulness correction *inside* an existing ADR's amendment, not a decision
change; the decision record's substance (reuse `EX_WRONG_BRANCH`, no new constant) stands.

## 8. Open risks / implementation notes

- **Orphan-checkout portability.** `git checkout --orphan` is ancient and bash-3.2-safe, but the
  orphan checkout leaves the prior tree staged in the index; the fixture does not care (no commit is
  made and land-advance reads only HEAD/refs), so no `git rm` cleanup is needed — note this in the
  case comment so a future reader doesn't "fix" it into a mutation of the fixture.
- **Ordering inside the precheck.** The script resolves `HEAD^{commit}` *before*
  `<new-sha>^{commit}`; T2.5d must pass a *resolvable* `<new-sha>` so the failure is unambiguously
  the HEAD arm. Passing a bogus sha too would still die on HEAD first — but the case must not rely
  on die order (recorded `decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome`
  class: comment and fixture must match the real first-failing arm).
- **Lesson description budget.** The description edit adds a handful of bytes to MEMORY.md's
  projection; the store is under the advisory line, so no `/lessons-learned tighten` interaction —
  but keep the description to one line regardless (render discipline).
- **Prefetch staleness window.** Until this lands, the stale 0/2/3 lesson keeps being prefetched
  into land-path seats; that is exactly the propagation #1035 names, and the reason this group
  should not sit behind unrelated work at plan-conversion time.
- **Anchor by construct.** All three edits anchor by named construct (frontmatter key, bold
  lead-in, T2.9 block comment, `Consequence` paragraph) — never by the line numbers quoted in the
  issues, which have already drifted across the serial merge queue.

## 9. Non-goals / deferred

- **No drift guard binding the lesson body to the script header** (design decision 2). The
  `process-recipe-lesson-body-is-not-drift-guarded-by-any-test` class stays open by design; a
  general lesson-body guard is a separate proposal no issue in this group requests.
- **No edit to the 2026-06-25 spec §5.3, any historical plan/spec, or the archived lesson** —
  uncorrected by convention (§2, §4.4).
- **No strengthening of T2.9's (d) assertions** (e.g. asserting fully-empty output to pin the
  silent route positively). #1037 is comment-accuracy only; the (b)+(c)+(d) logic is sound and
  untouched.
- **No change to `cmd_land_advance` or its header comment** — the contract of record is already
  correct.
- **No D15/doc-contract test edits** — D15's subject is untouched.

## 10. Validation criteria

1. **Contract-truth greps (per surface).** After the change:
   - `grep '0/2/3' docs/learnings/land-advance-push-first-cas-rejected-token.md` yields no
     **bare** `0/2/3` hit — every surviving match is part of a `0/2/3/6` token (note: a plain grep
     for `0/2/3` matches inside `0/2/3/6`, so assert with a shape that excludes the widened form,
     e.g. `grep '0/2/3' … | grep -v '0/2/3/6'` empty) — and the file greps positive for both
     `EX`-arm facts: a `6` arm with refusal semantics and the unresolvable `HEAD/<new-sha>` exit-3
     trigger.
   - ADR 0023's amendment section no longer contains the string `the 0/2/3 contract are
     byte-unchanged`, and greps positive for the exit-6-is-new narrowing.
   - `provision-worktrees.test.sh` no longer contains `shared by T2.3/T2.6` (count-free census), and
     the rewritten sentence contains no T2.x case-ID enumeration at all.
2. **New test is red-provable and green.** `bash skills/war/assets/provision-worktrees.test.sh`
   passes with the T2.5d case present. Red proof (one-off, during authoring): with the orphan-HEAD
   fixture in place, temporarily asserting exit 6 (or asserting the T2.5c die text) fails —
   demonstrating the case discriminates the HEAD arm from both sibling arms. The committed case
   asserts exit 3 + `could not resolve HEAD to a commit` + both refs byte-unchanged.
3. **No collateral test drift.** `node --test 'skills/**/*.test.mjs'` green (D15 and the
   doc-contract suite untouched) and the full shell-test sweep over `hooks/` and `skills/` green,
   with zero assertion edits outside `provision-worktrees.test.sh`.
4. **Redaction lint (CI-runner).** `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0
   on the edited lesson. Runner: CI (`memory-audit.yml`) — per the recorded
   `gate-artifact-never-includes-war-memory-lint` lesson this is never gate-composed, so at plan
   conversion it belongs in `## Deferred validations (backstops)`, not in a gate-checkable End
   state.
5. **Sweep completeness.** The repo-wide `0/2/3` grep plus the mandatory manual same-scope
   title/comment survey of the three edited files yields no unadjudicated hit: every match is either
   fixed by this change or carries a leave-rationale from the §4.4 table (historical, archived, or
   arm-local).
