# Gate evidence and release integrity — redaction lint in the gate, within-phase End-state ownership, a monotonic version floor

**Source issues:** #1081 (redaction lint is CI-only — no gate artifact can ever confirm an End state
citing it), #1082 (gate-audit `endStateBlock` lacks a within-phase downstream-task ownership
carve-out — false-hold hazard), #1083 (version-slot guard is lock-step-only — a coherent
all-four-slots revert passes every guard). All three are `memory-mined` issues from code-verified
lessons captured during the 2026-07-22/23 campaigns
(`gate-artifact-never-includes-war-memory-lint`,
`gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream`,
`gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump`); every claim re-verified live
on the working tree at spec time.

## 1. Context — the gap / problem

WAR's land decision rests on three evidence chains, and each has a verified hole:

- **Lint evidence hole (#1081).** `node skills/_shared/war-memory.mjs lint docs/learnings/` runs
  in exactly one place: the CI workflow `.github/workflows/memory-audit.yml`, post-push. The
  refiner-dispatched gate (plan.gate composed through `resolveGate`, ADR 0036) runs
  `node --test 'skills/**/*.test.mjs'` plus every discovered `*.test.sh` — the lint is neither,
  so it can never appear in a captured `.war/gate-<taskId>.log`. Consequence, hit twice in one
  phase's audits (war-memory-hardening): any plan End state citing lint success is a
  **structurally SOFT cannot-confirm at every gate-audit**, and a redaction violation is caught
  only after push, not pre-merge.
- **End-state ownership hole (#1082).** The `endStateBlock` const in
  `skills/war/assets/workflow-template.js` (threaded into every gate-audit dispatch) enumerates
  three cases; its only out-of-scope exemption is a condition "owned by a LATER phase". In a
  multi-task phase with `deps` edges, a per-task gate-audit runs before every End state in the
  phase's shared numbered list is satisfiable — a condition owned by a not-yet-landed
  deps-chained **sibling task in the same phase** reads as "provably UNMET … HARD" under case
  (1), instructing a Critical/Major hold against an upstream task that fully met its own slice.
  The recorded incident (cli-main-guard-normalization, task 1.1 vs task 1.2's End state 5)
  avoided the false hold only through auditor judgment. Neither the dispatched prompt nor the
  standing `agents/war-auditor.md` encodes the ownership rule; per the split-surface discipline
  both must move in one commit.
- **Release integrity hole (#1083).** `skills/war/assets/version-slots.test.mjs` asserts the four
  release slots agree (lock-step, fail-closed) but never that the version did not move
  **backwards**. Lock-step ≠ monotonic: a commit reverting all four slots together passes every
  guard. This happened — a Gate-2 `docs(learnings)` commit staged from a verify worktree carrying
  stale slot files reverted a landed 0.14.55 release to 0.14.54, and the successor stack cut from
  that tip inherited it. Contributing mechanism, verified in
  `cmd_ensure_publication_worktree` (`skills/war/assets/provision-worktrees.sh`): behavior (b)
  — worktree already on the working branch — reuses it **untouched, with no dirty check**
  (only behaviors (c)/(d) check `status --porcelain -uno`), so a stale checked-out tree whose
  ref advanced under it is silently accepted as the Gate-2 staging surface. No documented or
  automated check at Gate-2/phase-close re-reads the tip's version slot against the landed
  predecessor.

The common thread: each gap lets a false "all green" survive the exact checkpoint built to catch
it. This spec closes all three with the smallest wiring that makes the evidence real.

## 2. Pivotal constraints

- **Sibling-spec ordering (surface contention, not design input).** This group builds after three
  sibling specs of the same survey:
  `docs/specs/2026-07-24-runbook-and-standing-record-coherence-design.md`,
  `docs/specs/2026-07-24-recovery-re-merge-dispatch-coherence-design.md`, and
  `docs/specs/2026-07-24-drift-guard-and-floor-diagnostic-hardening-design.md` — all four groups
  touch some of `skills/war/assets/workflow-template.js`, `workflow-template.test.mjs`,
  `skills/war/SKILL.md`, `agents/war-auditor.md`, and `skills/war/assets/skill-doc-contracts.test.mjs`.
  Nothing here depends on their *design content*; the ordering only serializes shared-file edits.
  Additionally flagged for the roadmap contention table: `skills/war/assets/provision-worktrees.sh`
  / `provision-worktrees.test.sh` are also touched by
  `docs/specs/2026-07-24-land-advance-exit-contract-truth-design.md` (a group this one has no
  declared ordering against — different subcommands, same files).
- **The gate composition point is engine-owned and untouchable here (ADR 0036).** `resolveGate`
  (canonical in `skills/war/assets/war-config.mjs`, hand-mirrored in `workflow-template.js`) and
  its `GATE_DISCOVERY_TOKEN` pairing change for no one; the lint must ride the **existing**
  `*.test.sh` discovery, not extend the composer. Both mirror copies stay byte-untouched.
- **Split prompt surfaces (#1082).** Dispatched prompt text lives in `workflow-template.js`;
  standing auditor instructions in `agents/war-auditor.md`. The ownership carve-out must land on
  **both surfaces in the same commit** — they drift silently otherwise.
- **The handoff contract is fixed.** The gate-audit → handoff endState machinery keys the
  `out-of-scope` status off a finding title containing `out-of-scope` (the status enum in
  `skills/war/references/schemas.md`: `met | unmet | deferred | out-of-scope`). The carve-out
  must reuse that token so zero downstream routing changes.
- **Lock-step stays; monotonic is additive.** The existing extraction and lock-step tests in
  `version-slots.test.mjs` are load-bearing (they also guard the README Releasing prose) and are
  not weakened. The new check is a separate test, **fail-open outside a usable git context**
  (shallow clone, no repo, git absent) — it must never red a legitimate non-git consumer of the
  suite.
- **Exit-code discipline (ADR 0034).** `provision-worktrees.sh` catalogues every coded `die`;
  a test forbids uncatalogued numeric-literal exits. The new behavior-(b) refusal uses `die`'s
  default generic failure exit (no new catalogue constant) — the refiner treats any non-zero as
  HALT, and the message carries the meaning.
- **Never-destroy-work.** The publication-worktree hardening may only *refuse* (fail loud), never
  reset, clean, or switch away state — matching behaviors (d)/(f)'s existing posture.
- **Redaction + projection budget.** The three origin-lesson files under `docs/learnings/` get
  status-prefix updates; edited `description` lines must keep `MEMORY.md` under its advisory
  budget (descriptions, not bodies, drive projection bytes) and must pass the very lint this spec
  wires into the gate.
- **Anchor discipline.** All new doc-contract/test pins use **paired or ordered anchors** tied to
  the clause they police, never independent presence-anywhere loops (the non-discriminating-anchor
  class the sibling drift-guard spec exists to fix); all references in this spec anchor by named
  construct, never line number.

## 3. Resolved design tree

| # | Decision | Options considered | Resolution + why |
|---|----------|--------------------|-------------------|
| 1 | Lint wiring vehicle (#1081) | (a) new refiner-side floor script (assert-*-in-diff family); (b) compose lint into `resolveGate`; (c) a discovered `*.test.sh` wrapper beside the CLI | **(c).** The gate already self-discovers `*.test.sh` (ADR 0036); a thin wrapper is picked up with **zero engine change**, runs in every refiner-dispatched gate, appears verbatim in the captured `.war/gate-<taskId>.log` (the exact evidence #1081 asks for), and self-scopes: a target repo without the file runs nothing. (a) invents floor plumbing and a fix-worker route the failure doesn't want (a lint hit is a defect, not a routable omission); (b) edits two hand-mirrored copies of engine code for what one file achieves. |
| 2 | Lint scope | (a) diff-scoped (only files the task touched); (b) directory-wide over `docs/learnings/` | **(b).** CI parity ("directory-wide … is simpler than diff-scoped and strictly stronger" — memory-audit.yml's own rationale), millisecond-cheap, and catches pre-existing violations at the first gate instead of the next push. |
| 3 | Wrapper non-vacuity proof | (a) a companion `*.test.test.sh`; (b) meta-tests in the existing `skills/_shared/war-memory.test.mjs` spawning the wrapper against fixtures | **(b).** Avoids the absurd double-suffix name and a second gate-discovered file; the wrapper takes one optional target-dir override arg (default: repo `docs/learnings/`) purely so fixtures can drive its red path. |
| 4 | Carve-out shape (#1082) | (a) a new case (4) in `endStateBlock`; (b) extend case (3)'s ownership exemption to cover both owners | **(b).** It is one rule — "a condition owned by someone else's not-yet-landed slice is out-of-scope for this audit" — with two owners (later phase; deps-chained sibling task). Extending case (3) keeps the case count, the `out-of-scope` title token, the handoff status derivation, and the existing test pins' anchor order all intact. |
| 5 | Monotonicity mechanization (#1083) | (a) procedural runbook duty only; (b) tip-vs-`HEAD^` parent check; (c) tip ≥ max over a bounded window of first-parent slot-touching commits | **(c), plus the procedural duty.** (b) goes green again the moment any commit lands on top of the downgrade — the incident buried itself immediately (successor stack cut from the bad tip). (c) stays red from the downgrade until a restore commit returns the tip to the window max — exactly the detection-then-repair flow the lesson prescribes — and is one bounded `git log` invocation, fail-open. Premise verified at spec time: the live first-parent history of `.claude-plugin/plugin.json` is already monotonic (0.14.28 → 0.14.57), so the guard lands green. |
| 6 | Publication-worktree hardening | (a) leave behavior (b) reuse-untouched; (b) fail-loud on tracked-file modifications in behavior (b); (c) auto-reset a dirty reused worktree to the branch tip | **(b).** (c) violates never-destroy-work (phantom "modifications" from a ref that advanced under the worktree are indistinguishable from real uncommitted edits without judgment). (a) leaves the exact staging surface that recorded the downgrade. A clean reuse still costs nothing; a dirty reuse now names the hazard and the remedy (`remove-publication-worktree` + re-provision). The header comment's byte-for-byte-mirror claim against `cmd_ensure_refinery_worktree` is amended to record this deliberate divergence. |
| 7 | Where the procedural duty lives | (a) a new standalone runbook section; (b) one detection sentence inside the existing Gate-2 promotion flow in `skills/war/SKILL.md`, locked by a paired-anchor doc-contract row | **(b).** The duty belongs at the exact step that produced the incident (post-commit, pre-push, in the publication worktree); a separate section is the generic-runbook-omits-the-duty trap in reverse. |
| 8 | ADR treatment | (a) new ADR; (b) amend ADR 0013/0036; (c) none | **(c).** No decision changes: #1081 rides ADR 0036's existing composition; #1082 refines *interpretation* of ADR 0013's "provably unmet at the confirmed tip" (a condition owned by an unlanded sibling slice is not provably unmet **by the audited task's landed content**); #1083 hardens a mechanical guard. Record repair and guard hardening, not architecture. |

## 4. Mechanics

### 4.1 Redaction lint becomes gate evidence (#1081)

**New file `skills/_shared/war-memory-lint.test.sh`** — bash-3.2-safe, cwd-independent (resolves
the repo root two directories up from its own location, the `gh-preflight.test.sh` idiom):

- Runs `node <repo-root>/skills/_shared/war-memory.mjs lint <target>` where `<target>` is `$1` if
  given, else `<repo-root>/docs/learnings/`. The explicit target matters: bare `lint` falls back
  to the **local** memory root (`cmdLint`'s `resolveRoots` default), which is never the intent
  here.
- Exit code propagates untouched: the CLI is already fail-closed on hits (exit 1, hits on stdout
  naming file + pattern) and fail-open on an absent directory (`lint: clean`, exit 0) — the
  wrapper adds no logic beyond path resolution.
- Because it matches the discovery clause (`-name '*.test.sh'`, not under `node_modules/.git/.claude`),
  it runs in: every refiner-dispatched gate (captured into `.war/gate-<taskId>.log` under a
  `== gate(bash): … ==` banner), and the documented repo-wide shell-test loop
  (`find hooks skills -name '*.test.sh'`). CI is unchanged.

**Meta-tests in `skills/_shared/war-memory.test.mjs`** (design-tree row 3): spawn the wrapper
against (i) a fixture dir containing one violating lesson (a home-path shape) → asserts exit 1
**and** the offending filename + pattern on stdout; (ii) a clean fixture dir → exit 0 and
`lint: clean`. Both discriminate: deleting the wrapper's CLI invocation fails (i) RED.

**Record updates (same change):**

- `.github/workflows/memory-audit.yml` header comment — "the only automated check on a
  hand-committed lesson" now undersells the coverage: reword to state CI is the post-push
  backstop and the discovered gate suite (`skills/_shared/war-memory-lint.test.sh`) is the
  pre-merge enforcement. Workflow steps, triggers, and permissions stay byte-identical.
- `docs/learnings/gate-artifact-never-includes-war-memory-lint.md` — prefix the `description`
  with `MITIGATED (#1081):` and compress the remainder (projection budget); add a short body note
  naming the wrapper file. The "CI-only" framing is now historical.
- CLAUDE.md's Commands comment "(exactly what CI runs — the only thing CI runs)" stays — it
  remains a true statement *about CI*; the sweep in §4.4 confirms no other surface asserts the
  retired "never in a gate" claim.

**Deliberately untouched despite #1081's affected-files list** (completeness ≠ correctness):
`skills/war/assets/war-config.mjs` (design-tree row 1 — no composer change) and the test floor
`assert-test-in-diff.sh` (a lint hit is not a floor route; the floor's exit contract and
discovery mirror stay closed).

### 4.2 Within-phase End-state ownership carve-out (#1082)

**Dispatched surface — `endStateBlock` in `skills/war/assets/workflow-template.js`:** extend case
(3) so the ownership exemption names both owners. Spirit (final wording is the implementer's;
the pinned tokens are `LATER phase`, the sibling-task clause, `out-of-scope`, and `NEVER a hold`,
in that order):

> (3) a condition owned by a LATER phase — or by a deps-chained sibling task of THIS phase not
> yet landed at your audit's scope (map each numbered condition to the task slice that owns it
> before scoring) — is out-of-scope for THIS audit — record a Nit finding whose title contains
> "out-of-scope", NEVER a hold.

Cases (1) and (2) are byte-untouched; the `out-of-scope` title token keeps the handoff
`endState` status derivation working unchanged.

**Standing surface — `agents/war-auditor.md`, same commit:** one bullet appended to the
`execution-evidence` gate-audit checklist (the reserved-lens section):

> **End-state ownership mapping:** when the phase's End-state list spans `deps`-chained tasks,
> map each numbered condition to the plan slice that owns it before scoring. A condition owned by
> a later phase — or by a sibling task in this phase whose slice has not yet landed at the pinned
> tip — is out-of-scope for the current task's audit: a Nit whose title contains "out-of-scope",
> never a Critical/Major hold.

**Comment/record sweep (same commit, §4.4):** the two source comments in `workflow-template.js`
restating the old single-owner exemption — the args-contract header comment (`phase.endState`
annotation, "later-phase conditions are out-of-scope there, never a hold") and the
`endStateClaims` const's header comment — plus the identical parenthetical in the `intent`
args-contract paragraph of `skills/war/references/schemas.md`, all gain the sibling-task clause.

**Tests — `skills/war/assets/workflow-template.test.mjs`:**

- Extend the existing criterion-11 wording pin (the `LATER phase[\s\S]*out-of-scope[\s\S]*NEVER a hold`
  match on the built prompt) with an **ordered paired anchor** additionally requiring the
  sibling-task clause between `LATER phase` and `NEVER a hold` — one regex, so dropping either
  owner breaks the pin (no independent presence-anywhere loop).
- Add the same paired pin against `agents/war-auditor.md` (the file is already loaded as
  `auditorMd` in this suite) — both surfaces, one drift guard each.
- One behavioral case mirroring the existing later-phase out-of-scope test: a gate-audit finding
  titled `out-of-scope — owned by deps-chained sibling task` with `plan_ref` set to a claimed
  condition ⇒ handoff `endState` status `out-of-scope`, `landDecision: 'landed'` (never a hold).

### 4.3 Monotonic version floor + Gate-2 detection (#1083)

**Mechanical — new test in `skills/war/assets/version-slots.test.mjs`**
(`version slots: the tip never moves backwards (lock-step ≠ monotonic)`):

- One bounded git invocation from `repoRoot` (implementation latitude:
  `git log --first-parent -n 50 -p -- .claude-plugin/plugin.json` parsed for introduced
  `"version"` values, or an equivalent `rev-list` + `git show` walk, capped ≈50 slot-touching
  commits).
- Assert `readSlots()`'s canonical `plugin.json#version` (the working tree, same source as the
  lock-step test) is `>=` the maximum version observed in the window, under numeric
  three-component semver comparison (a small local helper; no dependency).
- **Fail-open:** any git failure — not a repo, git absent, empty window — passes with a logged
  note. The assertion message names the incident class: a Gate-2 commit staged from a stale
  verify worktree can revert a landed release while lock-step stays green; remedy is restoring
  the release-value slot files on the affected branch tip.
- After a real incident the test stays red until the restore commit lands (design-tree row 5) —
  detection with a built-in nag, exactly the missing property.

**Procedural — `skills/war/SKILL.md`, Gate-2 promotion flow:** one detection sentence in the
promotion step, positioned after the `docs(learnings): phase N` commit and before the
`ensure-origin` push:

> Before pushing, re-read the committed tip's version slot in the publication worktree —
> `git show HEAD:.claude-plugin/plugin.json` — and confirm `version` equals the pre-commit tip's
> value: a lower reading means stale slot files were staged (lock-step ≠ monotonic; the
> version-slots suite catches it only at the next gate) — do **not** push; run
> `remove-publication-worktree`, re-provision, and re-commit.

Locked by a new row in `skills/war/assets/skill-doc-contracts.test.mjs` whose anchors are
**paired** (the `show HEAD:.claude-plugin/plugin.json` probe token and the do-not-push clause
captured in one ordered match) — never two independent presence checks.

**Provisioning hardening — `cmd_ensure_publication_worktree` in
`skills/war/assets/provision-worktrees.sh`:** behavior (b) (registered + present + HEAD already
on the working branch) gains the same `status --porcelain -uno` probe behaviors (c)/(d) already
use; a non-empty result now **fails loud** via `die` (default generic exit, no new ADR 0034
catalogue constant): the message names the stale-staging hazard (tracked-file modifications in a
reused publication worktree — a ref that advanced underneath, or leftover edits) and the remedy
(`remove-publication-worktree`, then re-provision). Untracked files (the `.war-task` marker)
still never count. The header comment's "structurally byte-for-byte mirrors
cmd_ensure_refinery_worktree's six behaviors" sentence and its "staleness is the CAS retry's
job, never this subcommand's" claim are both amended: ref-staleness remains the CAS's job;
*working-tree* staleness is now this subcommand's refusal, publication verb only (the refinery
counterpart is a recorded non-goal, §9). New case in the P-family of
`skills/war/assets/provision-worktrees.test.sh`: registered publication worktree on the working
branch + one tracked-file modification ⇒ non-zero exit, stderr names the hazard and remedy;
the existing clean-reuse case stays green.

**Record updates:** `docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md`
`description` gains a `MITIGATED (#1083):` prefix (compressed, budget-safe) and a body note
naming the three layers (monotonic test, Gate-2 duty, behavior-(b) refusal);
`docs/learnings/gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream.md`
likewise gains a `RESOLVED (#1082):` prefix once the carve-out is on both surfaces. CLAUDE.md's
Releasing paragraph sentence describing `version-slots.test.mjs` ("locks the four slots in
lock-step…") is extended to also name the monotonic floor, keeping the standing doc truthful.

### 4.4 Token sweeps + mandatory same-scope survey

Each grep below is a completeness **floor, not a ceiling** — after running it, hand-scan the
target files' same-scope tests and comments (titles, header comments, assertion messages) and
list every straggler as a survey-derived correction:

- `grep -n "later-phase\|LATER phase\|later phase" skills/war/assets/workflow-template.js skills/war/assets/workflow-template.test.mjs agents/war-auditor.md skills/war/references/schemas.md skills/war/SKILL.md`
  — every hit must either carry the sibling-task clause post-change or be verified
  out-of-scope-accurate as-is. Anchor greps to files, never repo-root (stale worktree duplicates
  under `.claude/worktrees/` are the known trap).
- `grep -n "CI-only\|only thing CI runs\|only automated check\|never appears in a captured gate" CLAUDE.md .github/workflows/memory-audit.yml docs/learnings/gate-artifact-never-includes-war-memory-lint.md skills/war/references/schemas.md`
  — no surface may still assert the lint cannot appear in gate evidence.
- `grep -n "lock-step" CLAUDE.md README.md skills/war/assets/version-slots.test.mjs docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md`
  — every characterization of the version guard must acknowledge the monotonic floor or remain
  true without it.
- `grep -n "AS-IS AT THE LOCAL TIP\|staleness is the CAS\|byte-for-byte" skills/war/assets/provision-worktrees.sh skills/war/SKILL.md`
  — the publication-verb doctrine sentences must match the amended behavior (b). Beware wrapped
  phrases: read each hit in context; never trust a full-sentence single-line grep.

**Survey performed at spec time — stragglers found and their dispositions:**

1. `workflow-template.js` args-contract header comment (`phase.endState` annotation) and the
   `endStateClaims` const header comment — both restate the single-owner exemption; both are
   §4.2 edit sites (would have been missed by a sweep scoped only to the prompt string — the
   comment survey caught them).
2. `skills/war/references/schemas.md`, `intent` args-contract paragraph — same restatement;
   §4.2 edit site.
3. `docs/adr/0013-commanders-intent-and-disposition-routing.md` decision point 6 states
   "provably unmet → HARD; anything short of provable → SOFT note" **without** enumerating the
   case list — accurate under the carve-out (an unlanded sibling's condition is not provably
   unmet by this task's landed content). Legitimate survivor; no edit (design-tree row 8).
4. The behavioral test fixture title `out-of-scope — owned by a later phase` in
   `workflow-template.test.mjs` — stays accurate for its own case; the new sibling-task case is
   added beside it, not edited over it.
5. `docs/adr/0024-audit-gate-verdicts-integrated-tip-captured-evidence.md` — describes captured
   gate evidence generally; verified it nowhere claims the lint is outside gate evidence. No
   edit.
6. Stale copies under `.claude/worktrees/` — outside every anchored sweep by design; never
   edited.

## 5. Surface changes

- `skills/_shared/war-memory-lint.test.sh` — **new**: gate-discovered lint wrapper (§4.1)
- `skills/_shared/war-memory.test.mjs` — wrapper meta-tests, red + clean paths (§4.1)
- `.github/workflows/memory-audit.yml` — header comment only; no step/trigger change (§4.1)
- `skills/war/assets/workflow-template.js` — `endStateBlock` case (3) extension + two header
  comments (§4.2)
- `agents/war-auditor.md` — execution-evidence checklist bullet (§4.2)
- `skills/war/references/schemas.md` — `intent` paragraph parenthetical (§4.2)
- `skills/war/assets/workflow-template.test.mjs` — extended paired pins (both surfaces) + one
  behavioral sibling-task case (§4.2)
- `skills/war/assets/version-slots.test.mjs` — monotonic-floor test (§4.3)
- `skills/war/SKILL.md` — Gate-2 pre-push version re-read duty (§4.3)
- `skills/war/assets/skill-doc-contracts.test.mjs` — paired-anchor row locking that duty (§4.3)
- `skills/war/assets/provision-worktrees.sh` — behavior-(b) dirty refusal + header-comment
  amendment (§4.3)
- `skills/war/assets/provision-worktrees.test.sh` — new P-family dirty-reuse case (§4.3)
- `docs/learnings/gate-artifact-never-includes-war-memory-lint.md`,
  `docs/learnings/gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream.md`,
  `docs/learnings/gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump.md` —
  MITIGATED/RESOLVED status prefixes, budget-safe (§4.1, §4.3)
- `CLAUDE.md` — Releasing paragraph: version-slots guard description gains the monotonic floor
  (§4.3)

Not touched, deliberately: `skills/war/assets/war-config.mjs`, both `resolveGate` mirrors,
`skills/war/assets/assert-test-in-diff.sh`, `skills/war/assets/land-decision.mjs`, every enum.

## 6. New domain terms (CONTEXT.md)

None. "Gate evidence", "Gate-2 promotion", "lock-step", and "out-of-scope" are existing
vocabulary; "monotonic floor" stays a test-local phrase rather than a glossary term (one
mechanism, one home — the assertion message and CLAUDE.md sentence carry it).

## 7. Recommended ADRs

None (design-tree row 8). #1081 is a new consumer of ADR 0036's existing discovery contract;
#1082 refines the interpretation of ADR 0013's decision point 6 without changing its
provably-unmet standard; #1083 is guard hardening plus a runbook duty. No ADR text is retro-edited.

## 8. Open risks / implementation notes

- **A pre-existing `docs/learnings/` violation reds every gate** once the wrapper lands (CI is
  currently green on the default branch, so this bites only if a violation entered between CI
  runs). That surfacing is the point; the remedy is the lint's own demote-to-local flow. Run the
  lint once at implementation start to confirm a clean baseline.
- **Monotonic-test cost:** one bounded git invocation per suite run, in every gate execution —
  sub-second. Keep it a single spawn (design latitude in §4.3); never walk unbounded history.
- **Deliberate version rollback** (never yet done in this repo; release-status is
  replace-in-place, versions only ascend) would red the monotonic test until the slots are
  restored or the window slides — accepted friction; the assertion message says what to do.
- **Version literals in this spec** (0.14.54/0.14.55/0.14.57) are historical incident data and a
  spec-time premise probe, never targets; any release task in the converted plan states
  "next free patch above the live base" per the plan-template rule.
- **The behavior-(b) refusal tightens crash recovery:** a crashed Gate-2 leaving a *dirty*
  publication worktree now refuses reuse where it previously reused silently — the SKILL.md
  crash-heal pre-flight (`remove-publication-worktree` on a leftover `p*-publication`) is the
  standing remedy and needs no change; verify the heal path's wording still matches after §4.3.
- **Wrapper portability:** the wrapper requires Node ≥ 24 exactly as the gate's `node --test`
  leg already does; in a WAR run on a target repo that lacks the file, discovery simply finds
  nothing — no cross-repo coupling.
- **Sweep hygiene:** issue bodies cite line numbers measured at their filing tips; every edit
  site here is anchored by construct name (const name, subcommand name, behavior letter, ADR
  decision point, checklist heading). Line numbers rot across the serial merge queue.

## 9. Non-goals / deferred

- **No `resolveGate`/composer change and no floor-script vehicle for the lint** (design-tree
  row 1; #1081's affected-files list named `war-config.mjs` and a floor — recorded here as
  completeness-not-correctness).
- **No CI behavior change** — memory-audit.yml keeps its triggers, steps, and least-privilege
  permissions; comment only.
- **No refinery-worktree dirty-guard** — `cmd_ensure_refinery_worktree` keeps today's six
  behaviors untouched; extending the (b) refusal there interacts with the serial merge queue's
  legitimate in-flight state and deserves its own issue if wanted.
- **No byte-identity upgrade for the auditor git-contract mirror or other prompt/standing pairs**
  — anchor-strength policy for existing registry rows is owned by the sibling drift-guard spec's
  group (its #1080), ordered before this one.
- **No per-slot monotonicity** — the lock-step test already ties marketplace/README slots to
  `plugin.json#version`; one canonical slot feeds the monotonic floor.
- **No new exit-code catalogue constant and no enum widening** anywhere.
- **No re-litigation of End-state case (1)/(2) semantics or the SOFT/HARD split** — ownership
  scoping only.

## 10. Validation criteria

1. **Lint is discoverable and green:** from the repo root,
   `find . -type f -name '*.test.sh' -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.claude/*'`
   lists `./skills/_shared/war-memory-lint.test.sh`, and
   `bash skills/_shared/war-memory-lint.test.sh` prints `lint: clean` and exits 0 on the live
   tree — so any refiner-captured gate log now carries the `== gate(bash): … war-memory-lint …`
   banner, making an End state citing the lint CONFIRMABLE from the artifact.
2. **Lint red path proven:** the new meta-test drives the wrapper over a violating fixture and
   asserts exit 1 plus the offending file + pattern on stdout; deleting the wrapper's CLI
   invocation (feature mentally deleted) fails this test RED.
3. **Carve-out pinned on both surfaces, paired:** `node --test skills/war/assets/workflow-template.test.mjs`
   green, with one ordered regex per surface (built prompt; `agents/war-auditor.md`) tying the
   sibling-task clause between `LATER phase` and `NEVER a hold`. Temp-break proof: removing the
   sibling clause from either surface alone fails exactly that surface's pin RED.
4. **Carve-out behavior:** the new gate-audit case — a Nit finding titled with `out-of-scope`
   and owned-by-sibling-task rationale — yields handoff `endState` status `out-of-scope` and
   `landDecision: 'landed'`; the existing later-phase case stays green unmodified.
5. **Monotonic floor:** the new version-slots test is green on the live tree (spec-time premise:
   first-parent `plugin.json` history 0.14.28 → 0.14.57 is non-decreasing); RED proof in a
   scratch fixture repo (commit version 0.1.1, then commit 0.1.0 across all four slots — the
   lock-step test passes, the monotonic test fails naming both versions); fail-open proof: the
   suite passes when run against a non-git directory copy.
6. **Gate-2 duty locked:** the SKILL.md promotion step contains the pre-push
   `git show HEAD:.claude-plugin/plugin.json` re-read with the do-not-push clause, and the new
   `skill-doc-contracts.test.mjs` row fails RED when either half of the paired anchor is removed
   (verified by temp edit, not by two independent presence checks).
7. **Publication-worktree refusal:** the new `provision-worktrees.test.sh` P-family case shows a
   registered on-branch publication worktree with one tracked-file modification refuses with a
   non-zero exit and a stderr message naming both the hazard and the remove-then-re-provision
   remedy; clean reuse and fresh-create cases stay green; the ADR 0034 catalogue test stays green
   (no new numeric-literal exit).
8. **Sweeps clean:** every §4.4 grep returns only hits that are post-change-accurate, and the six
   spec-time survey dispositions are re-confirmed at implementation time.
9. **Whole-surface green:** `node --test 'skills/**/*.test.mjs'` and the anchored shell loop
   (`find hooks skills -name '*.test.sh'`) pass; `node skills/_shared/war-memory.mjs lint docs/learnings/`
   exits 0 over the edited lesson files; the rendered `MEMORY.md` projection stays under the
   advisory byte budget after the description edits.
10. **No collateral drift:** the change diff touches no version slot (release is the campaign's
    trailing phase), no `resolveGate` mirror, and no status enum — checked by reading the diff
    file list against §5.
