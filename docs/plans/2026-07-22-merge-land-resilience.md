# Merge/land resilience — bounded environment-proceed retries at both gate sites, and a wrong-HEAD precheck in `land-advance`

Source spec: `docs/specs/2026-07-22-merge-land-resilience-design.md` (survey 2026-07-22, group
`merge-land-resilience`, issues #984 + #986).

## AI-Commander's Intent

*(AI-authored under `/war-machine --afk`, ADR 0014 provenance — no operator confirmation; intent is
the ceiling, the plan slice is the floor)*

- **Purpose:** stop throwing away the refiner's own environment-classification proof — an
  approved task must never be silently excluded from a landed phase by a transient flake, and a
  `land-advance` exit 2 must mean only a real concurrent advance, never a wrong-cwd invocation.
- **Method:** mirror the existing `baseline-proceed` dispatch shape with a bounded (exactly ONE per
  gate site, no chaining) `environment-proceed` fresh-env re-run at both the merge and land gate
  sites — gate must go fully green, never a proceed-over; merge-site exhaustion HARD-escalates via
  the existing reused reason `'escalate'` so the phase holds instead of completing minus its
  deliverable; land-site exhaustion falls back to today's `held:land-failed` with the retry provably
  spent. Add a pre-push `HEAD == <merge-sha>` precheck to `cmd_land_advance` (catalogued
  `EX_WRONG_BRANCH`, never a new constant, never exit 2). Touch neither hand-mirrored enum copy —
  `land-decision.mjs` and its drift guards stay byte-untouched and green.
- **End state:**
  1. `workflow-template.test.mjs`: a merge-task `gate_failed` MergeResult classified
     `environment` dispatches exactly one refiner re-merge labeled
     `merge:<taskId>:environment-proceed`; its `merged` result routes through `landMerged` and the
     phase lands (delete-the-feature: reverting the merge-site arm restores the immediate
     `env-blocked` escalation with zero environment-proceed dispatches, redding the test).
  2. `workflow-template.test.mjs`: an environment-proceed re-merge returning `gate_failed`
     classified `environment` again escalates with `reason: 'escalate'` and
     `landDecision: 'held:escalation'` **with merged siblings present**.
  3. `workflow-template.test.mjs`: a land-phase `gate_failed` classified `environment` dispatches
     exactly one `land:phase-<id>:environment-proceed` re-land; its `landed` result yields
     `landDecision: 'landed'` and the servitor wrap-up dispatch fires (the wrap-up gate keys on
     `memoryLocalRoot`, not `learningsTarget` — the test fixture must thread it; Task 1.1 carries
     the fixture requirement); a second `environment`
     classification yields `held:land-failed` with reason `env-blocked`.
  4. Bound tests: a `baseline-proceed` re-merge/re-land failing environment-class dispatches **no**
     environment-proceed, and an environment-proceed second failure classified `baseline` routes as
     `introduced` with **no** baseline-proceed dispatch (dispatch-count assertions, both sites).
  5. `node --test skills/war/assets/land-decision.test.mjs` passes with both
     `land-decision.mjs` and `land-decision.test.mjs` **unmodified**: the `behavioral ⊆` test still
     extracts exactly the 6 emitted landDecision values and the intentional-gap test
     (`held:phase-incomplete` ∉ Workflow-emitted) still passes.
  6. The D3 both-surfaces registry carries an `environment-proceed` row whose anchors hit
     `agents/war-refiner.md` **and** the dispatched environment-proceed prompt(s); the
     `REGISTRY.length` floor and its enumerating message read the new exact row count (no slack).
  7. `provision-worktrees.test.sh`: invoking `land-advance` from a clone whose HEAD is not
     `<new-sha>` while `origin/<working>` sits at an older tip exits `EX_WRONG_BRANCH` (6) — not
     2 — with both SHAs and the expected-cwd guidance in the output, and `refs/heads/<working>`
     local **and** origin byte-unchanged; the CAS-race case still exits 2; an already-landed
     invocation still exits 0 **from a cwd whose HEAD ≠ `<new-sha>`** (proving the precheck sits
     after the guard's early-return arms).
  8. `skill-doc-contracts.test.mjs`: a new row extracts SKILL.md's `gate_failed`-routing
     environment arm by construct and asserts the bounded environment-proceed mechanics present
     **and** the gate-time zero-retry claim absent within that construct, with a non-vacuous
     presence companion. **Absence-key correction (red-team):** the absence half must key on a
     **markup-tolerant** regex derived from the live bullet — e.g.
     `/env-blocked[\s*\`]{0,6}doctrine applied at gate time/i` or the bare
     `/doctrine applied at gate time/i` — never the plain-space phrase (the live bullet interleaves
     `**` and backticks, so a plain-text key matches nothing even on the unmodified file and the
     absence assertion is born vacuous). Same red-then-green rule as End state 9: the absence regex
     must be shown to HIT the pre-change bullet before it counts as a guard.
  9. **Case-insensitive, line-local** retired-claim greps over `skills/war/` + `agents/` return zero
     hits for each of the three anchors below (red-team correction: the phrases as originally
     written were **provably vacuous** — two of them matched nothing on the *unmodified* tree, so
     they would have passed whether or not the rewrite happened). Each anchor is a **single-line
     substring verified to HIT at the pre-change base**, and every grep is `grep -rin` (case-
     insensitive — a re-cased reword must not slip past the floor):
     - `grep -rin "zero-round env-blocked escalation" skills/war/ agents/` — hits `agents/war-refiner.md` at base.
     - `grep -rin "environmental failure passes on retry" skills/war/ agents/` — hits
       `workflow-template.js` at base. **Do not** anchor on the leading `an`: the full sentence wraps
       a comment line break (`… the Lead re-runs the land (an` / `// environmental failure passes on
       retry …`), so a line-based grep can never match it. This longer substring does **not** collide
       with the exempt GateGuard "passes on retry" usages in `agents/war-worker.md` and
       `references/gastown-design-params.md` (verified: single hit).
     - `grep -rin "doctrine applied at gate time" skills/war/ agents/` — hits `skills/war/SKILL.md` at
       base. **Do not** include the `env-blocked` prefix as plain text: SKILL.md interleaves markdown
       (`the **\`env-blocked\` doctrine applied at gate time**`), so the plain-space phrase matches
       nothing. A markup-tolerant regex (`env-blocked[\s*\`]{0,6}doctrine applied at gate time`) is an
       equally acceptable stronger form.
     **Red-then-green requirement (binding):** before accepting any of these as an absence guard, the
     worker must show the anchor HITS on the pre-change tree; an anchor that returns zero at base is
     rejected as vacuous and must be re-derived from the live bytes. The §4.5 same-scope hand-scan is
     performed; a same-meaning straggler in Task 1.3's own files is corrected in place as a
     survey-derived correction (the schemas.md `gate_failure_class` environment-value sentence —
     "(0 fix rounds, worktree kept, siblings proceed)" — is one, confirmed present at base at plan
     time), while a straggler in the 1.1-owned files (`agents/war-refiner.md`,
     `workflow-template.js`) is REPORTED as a named partial deferral (`war-followup`), never edited
     by 1.3 — and the three named greps' zero-hit obligation rests on Task 1.1's rewrite of those
     surfaces (ownership carve-out matching Task 1.3's straggler-ownership adjudication).
  10. `CONTEXT.md` carries the **environment-proceed** term; a new ADR records the one-retry bound
      and the merge-site exhaustion hold; ADR 0023 is amended with the wrong-HEAD precheck.
  11. Release lands last: all four version slots in lock-step at the next free patch.

## Build order (for /war)

1. **Phase 1 — Bounded retries, precheck, doc truth** (waves: 1.1 ∥ 1.2 ∥ 1.4 → 1.3)
2. **Phase 2 — Release** (trailing, own phase)

## Phase 1 — Bounded retries, precheck, doc truth

### Task 1.1: environment-proceed at both gate sites + refiner card + behavior tests + D3 row

- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-refiner.md`
- Plan slice: **Merge site (spec §4.1)** — in the serial-merge routing under
  `mr.status === 'gate_failed'`, replace the `cls === 'environment'` arm's bare
  `escalated.push({ task: r.task.id, reason: 'env-blocked', detail: mr })` (red-team-corrected
  quote — the live arm carries the leading `task: r.task.id,` field) with a bounded recovery structurally
  mirroring the adjacent `cls === 'baseline'` arm: dispatch ONE refiner re-merge, label
  `merge:${r.task.id}:environment-proceed`, schema `MERGE_RESULT`, prompt built like the
  baseline-proceed re-merge (`reattachClause`, rebase-in-task-worktree step, `_refinery` merge
  step, the `assert-no-submodule-mutation.sh` / `assert-test-in-diff.sh` /
  `assert-packaging-in-diff.sh` floor clauses keyed on `requiresTest`/`requiresPackaging`) with two
  substitutions: the prior failure is named as classified `environment` (transient, proven
  non-reproducing in a fresh env), and the gate **must go fully green** in a freshly-created
  `.war-task`-free TMPDIR and fresh shell — no proceed-over set, no debt recording, no
  `source:'auto'` backstop. **The baseline-proceed shape alone is incomplete here:** that prompt
  build threads no `gateCaptureClause` — the environment-proceed re-merge prompt is the
  baseline-proceed shape PLUS an explicit `gateCaptureClause(refineryPath, r.task.id)` (as the
  primary merge and floor-retry prompts thread it) plus the `integration_sha` return the
  baseline-proceed step (c) already instructs, so the post-merge gate-audit evidence chain
  (`gate_log_path`) survives a retried merge; this capture requirement is **merge-site only** — the
  primary land prompt threads no capture clause, so the re-land below mirrors the baseline-proceed
  re-land unchanged. Route the result: `merged` → `landMerged(r.task, ep)` (no baseline-debt
  argument); `gate_failed` with `classOf(ep) === 'environment'` → HARD
  `escalated.push({ task: r.task.id, reason: 'escalate', detail })` with a detail naming the
  mechanism ("environment-class gate failure persisted through the bounded environment-proceed
  re-merge — approved task unmerged; the phase must not complete without it") carrying the
  MergeResult; `gate_failed` otherwise (`introduced`, or `baseline` treated as `introduced` —
  bounded, spec decision 4) → today's soft escalation (`reason: ep.status`, detail);
  `submodule-blocked` → HARD `'escalate'` (byte-mirror of the baseline-proceed arm's rule); floor
  statuses / null / anything else → the baseline-proceed arm's fallback idiom
  (`reason: ep ? ep.status : 'merge_failed'`). Provision-time `env-blocked` and stale-remote
  `env-blocked` arms untouched. **Land site (spec §4.2)** — replace the
  `landResult.status === 'gate_failed' && classOf(landResult) === 'environment'` arm with ONE
  re-land dispatch, label `land:phase-${ph.id}:environment-proceed`, mirroring the baseline-proceed
  re-land prompt (`reattachClause`, detach at `origin/<workingBranch>`, merge `--no-ff`, gate with
  fresh TMPDIR **required green** — no proceed-over clause, push-first CAS via
  `provision-worktrees.sh land-advance`, reland loop up to roundLimit, plus the shared
  `relandDiscrimination(ph.workingBranch)` clause). Route it exactly as the baseline-proceed
  re-land routes its own: `landed` → `landResult = reLand; landDecision = 'landed'`, logging the
  same "Opportunistic resync as on any landed phase" line the baseline-proceed landed arm logs
  (the primary chain's resync arm is unreachable from a recovery arm — mirror its log, as
  baseline-proceed does); a status ∈
  `HARD_ESCALATION_REASONS` → `held:escalation`; `gate_failed` classified `environment` again →
  `reason: 'env-blocked'`, `landDecision = 'held:land-failed'`; anything else →
  `held:land-failed`. The baseline-proceed re-land's own environment arm keeps routing
  `held:land-failed` directly (no chaining), and the primary-land `baseline` arm is untouched.
  **Anchor safety:** every landDecision literal assigned is already in the emitted set; keep all
  land-site insertions between the `// landDecision mirrors land-decision.mjs` comment and the
  catch's `held:workflow-error` literal, and insert **nothing** between the `let landDecision = …`
  ternary and its terminating `const refineryLandPath` line (the mirror extraction's bounded
  lookahead ends at that `const`) — `workflowEmitted()` in
  `land-decision.test.mjs` slices on those constructs; prove by running that suite untouched
  (End state 5). The new prompt strings cannot pollute the mirror extraction (its regex requires
  the `landDecision` token immediately before a literal — prompt text like `status: 'landed'`
  never matches), so no false structural-test failure is expected from the prompt bodies. Every
  new prompt literal is `pt`-tagged (the #931 untagged-literal census is
  exact). **ADR-0036 gate-site census (red-team round 2):** both new dispatches are gate-bearing
  (each prompt mirrors its baseline-proceed sibling's `Run the gate (${plan.gate}) with a fresh
  TMPDIR` step), and `GATE_SITE_CAPTURES` in `workflow-template.test.mjs` is an exact closed
  enumeration whose own doctrine is "a site an existing fixture cannot reach is ADDED, never
  skipped" — append two rows (`merge:<task>:environment-proceed`,
  `land:phase-<id>:environment-proceed`, driven by `clsImpl` environment-class mock results, same
  shape as the two existing baseline-proceed rows) and bump the count assertion **and its
  enumerating message** to the new exact site count (9 → 11 at the plan's base; live-count wording
  applies, same rule as the D3 floor bump) — **and every count-word in the enumeration's own prose**
  (round-3 minor): the ADR-0036 doctrine header comment ("every one of the NINE gate-bearing
  dispatch sites" / "all nine captures"), the row-list comment ("The nine gate-bearing dispatch
  captures"), and the test title ("the NINE enumerated gate-bearing captures") — a literal
  assertion-only bump leaves four stale `nine` sites contradicting the 11-row array (no meta-guard
  greps these words; doc-truth, not a red test). Rewrite both gate-site environment-arm comments to the bounded-retry mechanics — the
  line-local literal "environmental failure passes on retry" must not survive in
  `workflow-template.js` (red-team correction: the sentence wraps a comment line break after "(an",
  so the leading "an" is on the previous line — anchor on the substring that actually exists at
  line granularity; End state 9 carries the verified anchors). **Refiner card (spec §4.3, both-surfaces rule — same commit):** in
  `agents/war-refiner.md`, rewrite the merge-task step-3 environment clause from "a zero-round
  env-blocked escalation" to ONE Workflow-dispatched `environment-proceed` re-run (fresh
  TMPDIR/shell, gate fully green — never a proceed-over); a second environment-class failure
  hard-escalates at the merge site (the phase holds rather than completing without an approved
  task) and holds `held:land-failed` at the land site. Add one short paragraph to the Gate-failure
  classification section naming both `*-proceed` dispatch flavors and their asymmetry
  (baseline-proceed proceeds over named pre-existing failures with debt recorded;
  environment-proceed re-runs and must be green); the "Narrow baseline carve-out" sentence in
  `## Gate contract` is **not** widened. **Mapped tests (End state 1–4, 6):** two existing tests
  assert exactly the pre-change behavior and go RED — rewrite both **in place** to assert the
  bounded-retry path (deliberate, not collateral): "#598 validation 5 — merge 'environment' → soft
  escalate reason 'env-blocked', NO fix-worker…" (its `!out.landed.includes('t1')` /
  no-`*-proceed`-dispatch assertions become the one-environment-proceed-then-landed path) and
  "#598 validation 5 — land 'environment' → reason 'env-blocked', held:land-failed…" (becomes the
  one-re-land path); the surviving assertion "environment never dispatches a **baseline**-proceed"
  stays true and stays — an auditor should read it as still-correct, not stale. Extend the shared
  `clsImpl` helper with `:environment-proceed$` label arms (it currently special-cases only
  `:baseline-proceed$`) so mock results can drive the recovery dispatches per site. Then add the
  new behavior tests for both sites and both bounds, driving `runPhase` with mock refiner
  results (`gate_failed` + `gate_failure_class: 'environment'`) and asserting dispatch labels,
  dispatch counts, escalation reasons, `landDecision`, and the servitor wrap-up dispatch on a
  recovered land — **fixture requirement (red-team round 2, binding):** the servitor wrap-up gate
  keys on `memoryLocalRoot`, NOT `learningsTarget`
  (`if (landResult && landResult.status === 'landed' && memoryLocalRoot)` — the
  servitor-wrapup-landed-tip plan moved it there), and the shared `CLS_ARGS` fixture supplies only
  `learningsTarget`, so the recovered-land test must thread `memoryLocalRoot` (add
  `memoryLocalRoot: '/abs/mem',` to `CLS_ARGS` beside `learningsTarget` — verified in-sandbox to
  leave the sibling landed-phase tests' behavior intact) or the servitor assertion reds on a fully
  correct implementation; plus a new D3 both-surfaces registry row — surfaces `['war-refiner.md',
  refinerMd]` and the dispatched environment-proceed prompt(s) (prefer capturing the live prompts
  from the mock-driven `runPhase` fixtures; `sliceSrc` on the two dispatch constructs is the
  fallback), token-anchored — **anchor-discrimination correction (red-team):** `/fresh TMPDIR/i` is
  NOT a valid row anchor: it already appears at base in `agents/war-refiner.md` (the Gate-failure
  classification's "fresh environment (fresh TMPDIR/shell)" line) and 4× in `workflow-template.js`
  (baseline-proceed prompts), so a revert of the NEW clause would stay green behind the pre-existing
  hits. Anchor instead on tokens ABSENT from both surfaces at base: `/environment-proceed/i`
  (verified absent), plus a bounded/one-re-run anchor and a green-required anchor drawn from the new
  clause's own phrasing (or a compound form like `/environment-proceed[\s\S]{0,120}fresh TMPDIR/i`
  — token order matters: both prescribed surfaces put `environment-proceed` FIRST and reach
  `fresh TMPDIR` later, so the reversed order would be born vacuous — that only matches the new
  text); every anchor must red on a per-surface temp-revert, the same
  red-first rule as the sibling plans' registry rows — and bump the `REGISTRY.length` floor and its
  enumerating message to the new exact row count (floor equals true count, no slack — #693).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: `cmd_land_advance` wrong-HEAD precheck + shell test

- Files: `skills/war/assets/provision-worktrees.sh`, `skills/war/assets/provision-worktrees.test.sh`
- Plan slice: In `cmd_land_advance`, immediately **after** the land-truth guard's early-return arms
  (first-land fall-through, phantom die, already-landed reconciliation) and **before** the
  `git push origin "HEAD:refs/heads/$working"` step (spec decision 8): resolve
  `head_sha="$(git rev-parse HEAD^{commit})"` and `want="$(git rev-parse "$new_sha^{commit}")"` —
  an unresolvable `<new-sha>` dies escalate-class (`EX_FOREIGN`), never the reland code. On
  `head_sha != want`: `die` with `EX_WRONG_BRANCH` (the catalogued constant — decision 7, no new
  constant), the message naming **both SHAs** and the expected cwd ("run land-advance from the
  worktree whose HEAD is the merge sha — normally the detached `_refinery`"). No ref is read or
  written after the die; local and origin refs untouched. The push form stays byte-identical
  (named-source `HEAD:`, red-team-verified — never a bare-SHA refspec). Update the subcommand's
  header comment (the precheck as a numbered step; the exit-code block gains the arm) and the
  exit-code catalogue comment for `EX_WRONG_BRANCH` (gains the land-advance wrong-HEAD site); the
  step-3 post-push readback and its comment stay as defense in depth. All edits bash-3.2-safe.
  **Mapped test (End state 7):** the existing case T2.5 ("no-op push from the wrong cwd → exit 3")
  is exactly the precheck's target scenario and its expected exit necessarily changes — repurpose
  it into (or supersede it with) the wrong-HEAD case: invoke `land-advance` from a clone whose HEAD
  is not `<new-sha>` while `origin/<working>` sits at an older tip; assert exit equals
  `EX_WRONG_BRANCH` (6) — **not** 2 and not 3 — the combined output names both SHAs and the
  expected-cwd guidance, and `refs/heads/<working>` local **and** origin are byte-unchanged. Add a
  placement-discriminating assertion: an **already-landed** invocation (origin at `<new-sha>`,
  follower lagging) from a cwd whose HEAD ≠ `<new-sha>` still exits 0 — a top-of-function precheck
  would die 6 here, so this pins decision 8. Leave the CAS-race case (T2.1, exit 2), phantom
  (T2.6), first-land (T2.7), already-landed (T2.8/T2.8b), ls-remote-failure (T2.3), and push-error
  (T2.9) cases green and unchanged; the uncatalogued-numeric-exit guard test needs no change (the
  die uses `"$EX_WRONG_BRANCH"`).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: SKILL.md + schemas.md doc truth, doc-contract row, retired-claim sweep

- Files: `skills/war/SKILL.md`, `skills/war/references/schemas.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: **SKILL.md** — rewrite the `gate_failed`-routing **`environment`** arm (the bullet
  under "`gate_failed` routing by class") from the "`env-blocked` doctrine applied at gate time /
  0 FIX rounds" doctrine to the bounded mechanics: ONE Workflow-dispatched `environment-proceed`
  re-run at the failing gate site (fresh TMPDIR/shell, gate fully green — never a proceed-over, no
  debt); merge site — a second environment-class failure HARD-escalates reusing reason
  `'escalate'` → `held:escalation` (the phase holds rather than completing without an approved
  task); land site — `landed` resumes the normal landed path, a second `environment`
  classification → reason `env-blocked`, `held:land-failed`; provision-time and stale-remote
  `env-blocked` (worker never spawned) keep the zero-round soft doctrine unchanged. Add one
  sentence to the `held:land-failed` outcome bullet: a gate-time environment failure reaching this
  hold has already spent its in-workflow environment-proceed retry — the Lead manual re-run is the
  second line of defense. Add the §4.4 precheck sentence to the manual-land recipes (the
  `held:land-failed` auto-recover arms' intro and the escalation-completion land under
  `## Checkpoint`): `land-advance` refuses with a self-explaining die when invoked from a worktree
  whose HEAD is not the merge sha, so a `[rejected]` exit 2 now always means a real concurrent
  advance. **schemas.md (survey-derived correction, identified at plan time):** the
  `gate_failure_class` field-note's **`environment`** value prose ("soft-escalated reusing reason
  `env-blocked` (0 fix rounds, worktree kept, siblings proceed)") encodes the retired gate-time
  zero-retry doctrine in lowercase that dodges the token grep — rewrite it to the bounded
  environment-proceed mechanics (one re-run per gate site, green required; merge exhaustion HARD
  `'escalate'`, land exhaustion `env-blocked` + `held:land-failed`); the provision-scoped
  `env-blocked` sections (Lead-handling line, ENV_OUTCOME shape) remain true and unchanged.
  **Doc-contract row (spec decision 10; mapped test, End state 8):** a new row in
  `skill-doc-contracts.test.mjs` (next free D-series label after D17) extracting SKILL.md's
  environment arm **by construct** (the `- **\`environment\`** →` bullet inside the `gate_failed`
  routing block — construct-scoped, never a whole-file grep: "0 FIX rounds" legitimately survives
  in the provision `env-blocked` bullet), asserting the OLD claim absent within the construct via a
  **markup-tolerant** absence key (red-team correction — the live bullet interleaves `**` and
  backticks, so the plain-space phrase matches nothing even pre-change and would be born vacuous):
  key on `/doctrine applied at gate time/i` (or the stronger
  `/env-blocked[\s*\`]{0,6}doctrine applied at gate time/i`) and/or an unconditional "0 FIX rounds"
  gate-time pairing, each shown to HIT the pre-change bullet (red-then-green) before counting as a
  guard, and the new mechanics present (`/environment-proceed/i`, a green-required anchor,
  `held:escalation` at the merge site, `held:land-failed` at the land site), with a non-vacuous
  presence companion (the bullet is locatable and names both gate sites). **Retired-claim sweep
  (spec §4.5; End state 9, red-team-corrected):** after rebasing onto the integrated tip carrying
  1.1's rewrites, run the **case-insensitive** line-local greps from End state 9 over `skills/war/`
  and `agents/` — `grep -rin "zero-round env-blocked escalation"`,
  `grep -rin "environmental failure passes on retry"` (no leading "an" — the sentence wraps a
  comment line break at base), and `grep -rin "doctrine applied at gate time"` (no plain-text
  `env-blocked` prefix — the live bullet interleaves markdown) — zero hits required (scope excludes
  `docs/` — specs, plans, and red-team reports quote the retired phrases with legitimate history;
  spec §4.5's literal `grep -rn` form is superseded by this correction, recorded as a red-team
  adjudication). Each anchor was verified to HIT at the pre-change base (red-then-green — a
  zero-at-base anchor is vacuous and rejected). Grep is a floor: hand-scan SKILL.md's Checkpoint
  outcome bullets (`env-blocked`, `gate_failed` routing by class, `held:land-failed`,
  `held:escalation`), `agents/war-refiner.md` merge-task steps 1–3 + Gate-failure classification +
  land-phase sections, both gate-site comment blocks in `workflow-template.js`, and schemas.md's
  MergeResult / `gate_failure_class` prose for same-meaning siblings in different words
  ("soft-escalate", "siblings proceed", "the Lead re-runs the land", "same handling as a provision
  env-blocked"). **Straggler ownership (red-team adjudication, spec §4.5 partial-deferral named):**
  a straggler found in Task 1.3's OWN three files is corrected in place; a straggler found in the
  1.1-owned files (`agents/war-refiner.md`, `workflow-template.js`) is REPORTED, never edited —
  Task 1.3 lists it as a survey-derived finding in its done report and the Lead files a
  `war-followup` issue (the shared-surface contention the Notes warn about outweighs an in-place
  fix; 1.1's own sweep half already covers those files at implementation time, so a 1.3-time
  straggler there means 1.1's sweep missed it — a follow-up, not a silent re-edit). The GateGuard
  "passes on retry" lines in `agents/war-worker.md` and
  `skills/war/references/gastown-design-params.md` are a different, still-live meaning — exempt,
  not stragglers (the "environmental failure passes on retry" anchor's extra leading words keep it
  non-colliding — verified single-hit at base).
- requiresTest: true
- requiresPackaging: false
- deps: [1.1, 1.2]
- target repo: superproject

### Task 1.4: glossary + ADRs

- Files: `CONTEXT.md`, `docs/adr/` (new ADR at the next free number above the live set at land time), `docs/adr/0023-land-asserts-git-ground-truth.md`
- Plan slice: In `CONTEXT.md`, add the **environment-proceed** term (spec §6 wording basis, placed
  with the landing/gate-failure-class entries near **baseline gate debt**): the bounded (exactly
  one per gate site) Workflow-dispatched fresh-env re-run of a gate-failed merge or land whose
  failure classified `environment`; sibling of baseline-proceed with the opposite gate discipline
  (baseline-proceed *proceeds over* named pre-existing failures with debt recorded;
  environment-proceed *re-runs and must be green*); _Avoid_: any new `MergeResult` status or
  escalation-reason enum member for it. Author the new ADR "environment-class gate failures earn
  one in-workflow retry; merge-site exhaustion holds the phase" recording spec decisions 1–5: the
  one-dispatch bound, the no-chaining rule, the green-required asymmetry vs. baseline-proceed, and
  the explicit rejection of Workflow-emitted `held:phase-incomplete` (the intentional-gap drift
  guard stays ratified; the `resumeFromRunId` replay hazard is the recorded reason). Amend ADR 0023
  (append an amendment section, do not rewrite the original decision): the push's precondition
  (`HEAD == <merge-sha>`) is part of land truth, so the CAS-reject exit means only a real
  concurrent advance; originating-spec prose (the 2026-06-25 §5.3 CAS section guarded by the D15
  doc-contract row) stays uncorrected per convention.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: version bump, all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump all four slots to the next free patch above the live integration base at land
  time — `plugin.json` `version`, `marketplace.json` `metadata.version` and `plugins[0].version`,
  and the README `## Status` line (replace-in-place, no badge). `version-slots.test.mjs` is the
  arbiter — never a resolved v-literal from this plan (version literals in plans are
  non-authoritative). Expected integration base: branch `claude/work-audit-specs-plans-4304cd` — a
  stacked campaign base that will have advanced by land time; resolve the patch from the four
  slots as they stand at land. Standalone fallback: a run through plain `/war` (outside the
  campaign) resolves the next free patch from the four slots itself. Release blurb describes the
  change additively and precisely: environment-class gate failures now earn ONE in-workflow
  environment-proceed re-run at each gate site (merge exhaustion holds the phase;
  land exhaustion holds `held:land-failed` with the retry spent), and `land-advance` refuses a
  wrong-HEAD invocation with a self-explaining catalogued die — say "refuses when HEAD is not the
  merge sha", never a claim that exit-2 semantics changed (they are unchanged; they are now
  unambiguous). Phrase the blurb without quoting the retired phrases (the Task 1.3 absence greps
  are scoped to `skills/war/` + `agents/`, but do not seed new hits anywhere).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- Live-flake recovery proof — an environment-proceed dispatch actually recovering a real
  ENOTEMPTY-class transient at a gate site · why deferred: the unit tests drive the routing with
  mocked refiner classifications; a genuine nondeterministic environment flake cannot be fixtured
  deterministically in CI · runner: the next real `/war` run that hits an environment-class gate
  failure — the phase report and `/war-review` telemetry name the environment-proceed dispatch and
  its outcome.
- `cmd_land_advance` post-push readback-mismatch branch coverage · why deferred: the precheck now
  intercepts the deterministic wrong-cwd route pre-push (the former T2.5 fixture), leaving only a
  mid-push origin race to reach the readback mismatch — not deterministically fixture-able; the
  branch stays as commented defense in depth, with the CAS-race, phantom, and push-error cases
  covering the surrounding classification arms · runner: refiner code review at merge + the
  retained header comment; any future flake-injection harness may re-fixture it.
- `--afk` behavior shift — merge-site exhaustion now yields `held:escalation` where the phase
  previously completed minus an approved task · why deferred: needs a live afk run with a
  persistently failing environment; the intended trade (a held phase with a self-explaining detail
  over a silent deliverable skip) is only observable there · runner: operator at first occurrence
  post-release; the Lead self-adjudicates via the existing escalation-completion land per the
  recorded afk-self-adjudicate doctrine.
- `REL_GUARD_PRECONDITION_FAILED` residual (spec §8) — the precondition-marker short-circuit
  classifies `environment` **without** a fresh-env tip re-run, so an environment-proceed retry
  triggered by it has weaker pass-prediction than a classifier-proven transient; it stays bounded
  at one with identical exhaustion routes · why deferred: only observable on a live
  precondition-marker gate failure; no fixture reproduces the marker's weaker prior · runner:
  operator inspection at the first live occurrence (phase report names the marker line, carried
  uncurated in `gate_output`).

## Notes / conscious deviations

- **AFK provenance (ADR 0014):** the intent block is AI-authored (`## AI-Commander's Intent`,
  AI-declared backstops heading). Tone and scope follow the two exemplar intents
  (`2026-07-22-lessons-learned-seed.md`, `2026-07-21-lessons-learned-tighten.md`); divergence:
  no operator-confirmation line — marked AI-authored instead, per the provenance rule.
- **Cross-plan shared-file contention (spec §8):** `workflow-template.js` and
  `workflow-template.test.mjs` are touched by sibling plans in this survey
  (`2026-07-22-auditor-guard-ergonomics.md` Task 1.2 touches both plus `agents/war-auditor.md`;
  the audit-adjudication-threading and servitor-wrapup-landed-tip groups touch the same two shared
  files — red-team round-2 correction: none of those three touch `agents/war-refiner.md`; this
  survey's `war-refiner.md` co-editor is `2026-07-22-test-floor-target-repo.md`), and the
  D3 registry's exact no-slack floor makes concurrent bumps collide **by construction**. The
  roadmap serializes landing; within this plan only Task 1.1 touches these three files, and the
  floor bump is worded live ("the new exact row count"), never the spec's literal "10 to 11" —
  a conscious deviation from spec §4.3, because the live count may already have advanced by this
  plan's land time. Same live-wording deviation for the new ADR number ("next free above the live
  set", 0039 at drafting) — sibling plans may land ADRs first. **Roadmap-facing stacking
  expectation:** this plan's registry-row edit collides at construct level with the
  guard-ergonomics and servitor-wrapup registry rows in `workflow-template.test.mjs`, so the
  campaign must slot this plan **after** the registry-editing chain — the roadmap owns that edge;
  this plan only states the expectation.
- **schemas.md added beyond the spec's §5 surface list (survey-derived):** spec §5 omits
  `skills/war/references/schemas.md`, but §4.5's mandatory hand-scan provably requires editing its
  `gate_failure_class` environment-value sentence — "(0 fix rounds, worktree kept, siblings
  proceed)" is the retired doctrine in lowercase, invisible to the case-sensitive token grep.
  Task 1.3 carries it; an auditor should read this as the spec's own §4.5 mandate, not scope creep.
- **T2.5 reconciliation (drift from spec §5's "existing CAS-race and guard cases unchanged"):**
  T2.5 (no-op push from the wrong cwd → exit 3) is neither a CAS-race nor a land-truth-guard case
  — its scenario is exactly the precheck's target, so its expected exit necessarily changes from 3
  to `EX_WRONG_BRANCH` (6). Task 1.2 repurposes it into the criterion-7 wrong-HEAD case; the
  readback code itself stays (defense in depth), per spec §4.4.
- **Absence-grep scoping:** the End-state-9 greps are scoped to `skills/war/` + `agents/` and use
  the full retired phrases — `docs/specs/`, `docs/plans/` (including this file), and
  `docs/red-team/` quote them with legitimate history (the enumerated-file-list absence-guard and
  release-blurb lessons); the GateGuard "passes on retry" usages are a different, still-live
  meaning and are exempt by the full-phrase requirement.
- **`requiresPackaging: false` throughout** — no packaging surface in this repo (the packaging
  floor is a no-op without a Dockerfile).
- **Enum discipline (spec decisions 2/3):** no task touches `land-decision.mjs`,
  `land-decision.test.mjs`, either hand-mirrored enum copy, or `HARD_ESCALATION_REASONS` — every
  new escalation reuses an existing reason (`'escalate'`, `'env-blocked'`) and every new
  `landDecision` literal is already in the emitted set. An auditor finding those files unmodified
  is confirming the design (End state 5), not catching an omission.
- **Cross-task prose timing:** Task 1.3 rides a dep wave on 1.1 + 1.2 so SKILL.md/schemas.md
  document the merged mechanics and the real precheck die message, never a guess; Task 1.4's ADR
  content is decision-record prose from the ratified spec and deliberately does not wait.

## Open decisions

None blocking — self-adjudicated under `--afk`:

1. **D3 dispatched-prompt surface mechanism** — recommend capturing the live environment-proceed
   prompts from the mock-driven `runPhase` fixtures the behavior tests already build (asserts the
   real emitted text); `sliceSrc` on the two dispatch constructs is the sanctioned fallback if
   fixture plumbing proves awkward. Worker latitude within the row's anchor set.
2. **Precheck-sentence placement in SKILL.md** — recommend one sentence at the
   `held:land-failed` auto-recover arms' intro and one in the escalation-completion land recipe
   (the two §4.4-named sites), rather than every recipe body; the shared Manual-land hygiene
   bullet may carry it instead if the worker finds that reads better — the doc-contract row does
   not key on its position.
3. **T2.5 repurpose vs. supersede** — recommend repurposing in place (same fixture shape, new
   assertions) to keep the case count and comments coherent; adding a distinct case and retiring
   T2.5's stale assertion is equally acceptable if the readback comment is preserved.
