# Red-team resilience — agentType fallback + ff-topology probe

Source: `/survey-corps` 2026-07-11, from two red-team frictions filed off the 2026-07-08
memory-frictions campaign.
Not yet a plan — convert with `/war-strategy`, then validate with `/red-team`.

**Issues addressed: #727 (whole), #650 (red-team half only — the ff-topology probe gap; the
engine half, stale remote task branches on restart, belongs to the partial-phase-recovery spec
and is cited here only as motivation).**

## 1. Context — the gap / problem

Two independent ways a `/red-team` run silently under-verifies, both observed in production during
campaign `2026-07-08-memory-frictions`:

**Gap 1 — hard dependency on an unversioned built-in agent (#727).** The scaffold
(`skills/red-team/assets/workflow-scaffold.js`) routes every **analyzed** probe and every
adversarial-confirm of an analyzed probe to the Claude Code built-in `Explore` agent via a
hardcoded ternary at two dispatch sites (`runProbe` and `confirmStage`):

```js
agentType: p.technique === 'analyzed' ? 'Explore' : undefined
```

`Explore` is not shipped by WAR and not guaranteed present. When the harness dropped it
mid-session (2026-07-10, plan 9 red-team round 2), **11 of 13 probes died** with
`agent type 'Explore' not found`; only the two `executed` probes (agentType `undefined`) survived.
The scaffold's Layer-4 retry re-dispatched each dead probe **with the same agentType**, so the
retry died identically and the run collapsed toward executed-only coverage. Patching the scaffold
copy `Explore` → `general-purpose` recovered a full 13-probe run (verified in the incident), so
the read-only analyzed workload runs fine under `general-purpose`. The `SAFETY` comment near the
top of the scaffold also names `Explore` as *the* analysis agent. No `Plan`-agent references exist
in the scaffold (verified: grep hits `Explore` only at the two dispatch sites plus that comment),
and no test pins the `Explore` literal, so no test relaxation is needed — but no test covers the
missing-agent path either.

**Gap 2 — the sandbox never reproduces WAR's fast-forward merge topology (#650, red-team half).**
WAR's per-task merges into the integration branch are **fast-forward**; the only `--no-ff` merge
in the pipeline is the whole-phase land (the `merge --no-ff integration/<slug>/phase-N` step in
`agents/war-refiner.md`). A landed phase is therefore a **linear single-parent chain with no
per-task merge commit** (verified empirically on `integration/audit-gate-verdict-fidelity/phase-1`
via `git log --parents`). Plan clauses that anchor per-task evidence on merge-commit topology are
**topology-void** under that chain:

- `<task-merge-commit>^1` — there is no per-task merge commit; `^1` on a single-parent tip
  resolves to just that commit's parent, silently under-populating a per-task changed-file set;
- a post-merge three-dot diff `<integrationBranch>...<task.branch>` — always empty once the task
  tip is an ancestor of the integration tip, turning a floor invocation into a permanent
  `covered` no-op;
- `--first-parent` per-task walks — presuppose the same nonexistent merge commits.

Plan 2 of the campaign (`audit-gate-verdict-fidelity`, task 2.1) shipped exactly these anchors.
`/red-team` CLEARED the plan because its throwaway sandboxes carried no ff integration history for
the anchors to fail against — worse, the red-team pass *hardened toward* the broken idiom,
"fixing" a `diff-tree` bug by re-anchoring on `<merge>^1`. The defect cost a full extra `/war`
phase run before the `cascading-impact` auditor caught it (the plan was then patched to chain on
the previous merged task's `gateHeadSha` — landed; that was the plan-side symptom fix, not the
red-team capability this spec adds). No topology probe exists today: grep for
`fast-forward`/`topology`/`first-parent`/`^1` across `skills/red-team/` returns zero hits.

Both gaps share a failure class: the verification layer reports strength it does not have. Gap 1
thins coverage below the derived probe set; gap 2 passes a claim class the real repo will void.

## 2. Pivotal constraints

- **The Workflow sandbox cannot introspect the harness.** The scaffold has no filesystem access
  and no capability-query API — `Explore`'s availability is observable only as a failed dispatch.
  Any fallback must be *reactive* (detect the dead dispatch, re-dispatch), never a pre-flight
  capability check inside the scaffold.
- **A dead probe must stay visible.** The gate's fail-closed coverage accounting (`INCOMPLETE`
  whenever a probe is dropped/off-target/never-ran; never `CLEARED` on thin coverage) is the
  skill's core invariant. The fallback must *reduce* drops, and an exhausted fallback must still
  emit the `{ probe, dropped: true }` marker — never mask a dead probe as a pass or silently
  shrink `expected`.
- **The `SPINE` array is owned separately** (lesson
  `red-team-drift-guard-spine-probes-are-lead-run-prose-not-spine-array-entries`): the fixed
  six-lens engine in the scaffold is not the extension point for new probes. The ratified shape
  for conditional, Lead-run probes is prose in `SKILL.md` + a `references/lenses.md` catalog
  entry (precedent: the two ADR-0025 drift-guard probes and the backstop-legitimacy check).
- **`Explore` is read-only by construction; `general-purpose` is not.** Falling back widens the
  dispatched agent's raw capability. Confinement must continue to ride the existing scope-lock
  preamble (prevention) + `assert-no-repo-escape.sh` (detection, ADR 0033) — both already apply
  to every probe unconditionally.
- **Adversarial-confirm parity.** Both dispatch sites carry the same ternary today; a fix that
  patches only `runProbe` leaves every analyzed-probe *confirm* dying on the same missing agent,
  stranding legitimate fails as unconfirmable. Both sites must route through one shared selector.
- **Bounded dispatch.** The scaffold already retries a dead probe once (Layer 4). The fallback
  must compose with that bound, not multiply it unboundedly.
- **Grep is a floor** for the topology trigger: the token set (`^1`, `--first-parent`, three-dot
  bases, "merge commit") catches the recorded shapes, but a plan can phrase a merge-anchor claim
  without any of them — the derivation rule must mandate a manual same-scope read of the plan's
  evidence-pipeline prose, not token-matching alone.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Fallback mechanism | Reactive: a shared dispatch wrapper tries the preferred agentType; on a dead dispatch (throw **or** null result — treat uniformly) it re-dispatches once with the fallback type. Rejected: Lead pre-flight capability probe (adds a fragile harness query the sandbox can't own; availability can change mid-run — the recorded incident was a *mid-session* drop). |
| Preferred / fallback types | Preferred `Explore` (read-only, right tool when present), overridable via `args.analyzedAgentType` (the issue's configurability ask). Fallback fixed: `general-purpose` (present in every observed harness; recovery verified in the incident). |
| Where the wrapper applies | Both dispatch sites — `runProbe` and `confirmStage` — via one shared helper; the `Explore` literal survives only in the named preferred-type constant. Executed probes (`agentType: undefined`) bypass the fallback entirely. |
| Exhausted fallback | Unchanged Layer-4 path: dropped marker → gate `INCOMPLETE` → the Lead re-runs the dropped probes (SKILL.md Step 5). The failure surfaces as a *recoverable coverage gap*, never a silent executed-only collapse. |
| Distinguishing agent-type-missing from a genuine crash | Not attempted. The sandbox can't read the error class reliably; re-dispatching a genuinely-crashed probe under `general-purpose` is a harmless bounded retry. Accepted imprecision. |
| ff-topology probe home | Mandatory **bespoke derivation rule** (SKILL.md Step 2) + catalog row (`references/lenses.md`) — the Lead adds it via `args.probes` when triggered. Rejected: a seventh `SPINE` entry (array owned separately; the probe is plan-conditional, unfit for an always-run spine; the `default-flip-old-absent` precedent already ratifies the "Lead-run executed probe, never edit the `SPINE` const" shape). |
| Trigger condition | The plan claims per-task merge-commit anchors: `<merge>^1` / `^1` on a task ref, `--first-parent` per-task diffs, a post-merge three-dot base between integration and task refs, or prose asserting a per-task "merge commit". Token grep is the floor; the rule mandates a manual read of the plan's evidence/floor-base prose. Mandatory when triggered — not skippable under `--fast` (same posture as the drift-guard probes). |
| Fixture shape | Probe-built throwaway repo reproducing WAR's real history: base commit → integration branch → ≥2 "task" merges done as fast-forwards (linear single-parent chain) → one final `--no-ff` phase land. The probe then evaluates every claimed anchor against it; error, wrong-commit resolution, or degenerate/empty diff = topology-void → Major. |
| Drift guards | (a) Behavioral tests in `workflow-scaffold.test.mjs` for the fallback (harness-lacks-Explore recovery; both-types-dead → dropped markers; executed probes untouched; `args.analyzedAgentType` honored). (b) A presence-pair guard asserting `ff-topology` appears in **both** prose surfaces (SKILL.md + lenses.md), so the mandatory rule and its catalog row can't drift apart. |

## 4. Mechanics

### `skills/red-team/assets/workflow-scaffold.js`

1. **Named agent-type constants**, module level, near `ADVERSARIAL_CONFIRM`:
   - `ANALYZED_AGENT` — `A.analyzedAgentType ?? 'Explore'` (destructure alongside the existing
     `args` fields); the only place the `Explore` literal survives.
   - `ANALYZED_AGENT_FALLBACK = 'general-purpose'`.
2. **Shared fallback dispatcher** — one helper both sites call, e.g.
   `dispatchAgent(prompt, opts)`:
   - `opts.agentType` undefined (executed probes) → plain `agent(prompt, opts)`, no wrapping.
   - Otherwise `await agent(prompt, opts)` inside a try/catch; a throw **or** a
     null/undefined result → `log()` a one-line diagnostic naming the probe label, the dead
     agentType, and the fallback, then return
     `agent(prompt, { ...opts, agentType: ANALYZED_AGENT_FALLBACK })` (also try/caught; a second
     death returns null so the existing pipeline/Layer-4 semantics see the same shape they see
     today).
   - The log line is the "clear diagnostic" #727 asks for: the run transcript shows a coverage
     *degradation* (fallback engaged) distinctly from a coverage *gap* (dropped marker).
3. **Both dispatch sites** switch `agent(...)` → `dispatchAgent(...)` and the ternary to
   `agentType: p.technique === 'analyzed' ? ANALYZED_AGENT : undefined` (identical at
   `runProbe` and the `confirmStage` confirm dispatch).
4. **Comment truth**: update the `SAFETY` block's "Analysis probes are read-only (Explore
   agent)" sentence to name the preferred-with-fallback pair and note that fallback confinement
   rides the scope-lock + post-run escape guard. Per the source-comment-lags lesson, grep the
   whole file for `Explore` in the same edit and reconcile every mention; **manual same-scope
   survey note:** also hand-scan the scaffold's other comment blocks and the test file's test
   titles for prose implying Explore-only analysis, and fix stragglers as survey-derived
   corrections.
5. **Bound**: worst case per analyzed probe is 2 dispatches × (initial + one Layer-4 retry) = 4,
   plus the same factor on a confirm. Bounded and acceptable; note it in the dispatcher comment.

### `skills/red-team/assets/workflow-scaffold.test.mjs`

New behavioral cases on the existing mock-agent harness (`runScaffold`/`compileScaffold`, which
already captures every dispatch's `opts`):

1. **Fallback recovery** — mock `agent` throws (and, in a variant, returns null) whenever
   `opts.agentType === 'Explore'`, answers normally otherwise: every analyzed probe still yields
   a FINDINGS result, captured opts show the fallback dispatch with
   `agentType: 'general-purpose'`, and the returned `probeResults` contain **zero** dropped
   markers.
2. **Exhausted fallback stays loud** — mock `agent` dies for *both* agent types on analyzed
   probes: each analyzed probe emits `{ probe, dropped: true }`, the returned `expected` still
   equals the full probe count, and executed probes are unaffected (the gate's `INCOMPLETE`
   contract keeps holding).
3. **Executed probes never wrapped** — captured opts for `technique: 'executed'` probes show
   `agentType` undefined and exactly one dispatch (no fallback re-dispatch).
4. **Override honored** — `args.analyzedAgentType: 'custom-agent'` appears as the preferred type
   at both the probe and the confirm dispatch sites.
5. **Confirm-site parity** — a blocking analyzed probe whose confirm's `Explore` dispatch dies
   still gets a fallback-dispatched confirm (captured confirm opts show `general-purpose`).
6. **Prose presence pair (ff-topology)** — read `../SKILL.md` and `../references/lenses.md`
   (same cross-file idiom the D7 guard in `red-team-gate.test.mjs` uses) and assert the literal
   probe name `ff-topology` is present in both; either surface losing it turns the guard red.

Delete-the-feature check applies to each (per the weak-assertion lesson): every new case must
fail against the current master scaffold.

### `skills/red-team/SKILL.md` (Step 2 — derive probes)

Append to the derive-probes sentence's cue list a **mandatory** derivation rule:

> per-task merge-commit anchor (`^1` on a task/merge ref, `--first-parent` per-task diffs, a
> post-merge three-dot floor base, or prose claiming a per-task "merge commit") →
> **`ff-topology`** (executed, from the catalog) — **mandatory** when any such anchor appears,
> and never skipped under `--fast`. Token grep is the floor: also read the plan's evidence-
> pipeline / floor-invocation prose for merge-anchor claims phrased without the tokens, and add
> the probe on a prose match too.

Like `default-flip-old-absent`, the Lead adds it as a bespoke executed probe (scaffold array or
`args.probes`) — never by editing the `SPINE` const.

### `skills/red-team/references/lenses.md` (bespoke probe catalog)

New catalog row:

| Plan feature | Probe `name` | `technique` | Prompt gist |
|---|---|---|---|
| per-task merge-commit anchor (`<merge>^1`, `--first-parent` per-task diff, post-merge three-dot floor base) | `ff-topology` | executed | "In a throwaway sandbox, build WAR's real integration topology: base commit → integration branch → ≥2 'task' integrations done as **fast-forward** merges (a linear single-parent chain — NO per-task merge commit) → one final `--no-ff` phase-land merge. Then evaluate EVERY plan clause that anchors per-task evidence on merge topology against that fixture: a clause that errors, resolves the wrong commit (`^1` on a single-parent tip walks to the previous commit, under-populating the set), or degenerates to an empty diff (post-merge `<integration>...<task>` is always empty once the task tip is an ancestor) is **topology-void** → Major, with the fixture output as evidence." |

Plus one sentence under the table noting the row is **mandatory when triggered and `--fast`-proof**
(mirrors the SKILL.md Step 2 rule; the presence-pair guard in `workflow-scaffold.test.mjs` pins
the pair).

## 5. Surface changes

| File | Change |
|---|---|
| `skills/red-team/assets/workflow-scaffold.js` | `ANALYZED_AGENT` (+ `args.analyzedAgentType` destructure) and `ANALYZED_AGENT_FALLBACK` constants; shared `dispatchAgent` fallback wrapper; both dispatch sites rerouted; SAFETY comment reconciled. |
| `skills/red-team/assets/workflow-scaffold.test.mjs` | Behavioral fallback cases (recovery, exhaustion, executed-bypass, override, confirm parity) + the `ff-topology` prose presence-pair guard. |
| `skills/red-team/SKILL.md` | Step 2 gains the mandatory `ff-topology` derivation rule (with the grep-is-a-floor prose-read mandate). |
| `skills/red-team/references/lenses.md` | Bespoke catalog gains the `ff-topology` row + mandatory/`--fast`-proof note. |

No other surfaces. `red-team-gate.mjs` is untouched (the dropped-marker/`INCOMPLETE` contract
already carries the exhausted-fallback path).

## 6. New domain terms (CONTEXT.md)

- **topology-void** — a plan clause anchored on git topology that does not exist under WAR's
  fast-forward per-task merges (a per-task merge commit, its `^1` parent, a non-empty post-merge
  three-dot diff).
- **analyzed-agent fallback** — the red-team scaffold's reactive re-dispatch of an analyzed
  probe/confirm from the preferred read-only agent type to `general-purpose` when the harness
  lacks the preferred type.

## 7. Recommended ADRs

None. The fallback rides the existing ADR 0033 prevention/detection posture (scope-lock +
post-run escape guard) unchanged; the probe rides the ratified Lead-run-prose shape; the
presence-pair guard rides ADR 0025's drift-guard discipline. No enum, no new escalation reason
(ADR 0005 untouched), no destructive path (ADR 0008 untouched).

## 8. Open risks / implementation notes

- **Capability widening on fallback.** `general-purpose` can write and run Bash where `Explore`
  cannot. Mitigation is the existing double layer — scope-lock preamble on every probe/confirm
  (prevention) and `assert-no-repo-escape.sh` between Workflow return and gate (detection); the
  incident's recovered 13-probe run exercised exactly this configuration. Residual accepted.
- **False-positive fallback.** A genuinely-crashed Explore probe gets one extra dispatch under
  `general-purpose`. Bounded (≤2× the current dispatch count) and harmless; the log line keeps it
  observable.
- **`agent()` failure shape is harness-version-dependent** (throw vs null). The wrapper treats
  both uniformly; the two test variants in case 1 pin both shapes.
- **Trigger-token drift.** The ff-topology trigger list will rot as plans invent new merge-anchor
  phrasings; the mandatory prose-read clause is the hedge, and the probe itself (not the trigger)
  is the enforcement — a Lead may always add it unprompted.
- **Fixture realism ceiling.** The fixture reproduces the ff chain + single `--no-ff` land; it
  does not reproduce serial-merge rebases or multi-wave ordering. That is sufficient for the
  recorded defect class (merge-commit anchors); deeper topology simulation is out of scope.
- **Conversion note for `/war-strategy`:** the scaffold + test changes are one file-disjoint pair
  from the two prose files, but the presence-pair guard reads SKILL.md and lenses.md — so the
  guard, the Step 2 rule, and the catalog row must land in the same task (defined-but-not-yet-
  emitted otherwise).

## 9. Non-goals / deferred

- **The engine half of #650** — stale remote `war/<slug>/pN-tK` branches blocking a relaunch
  worker's push (restart-time remote-branch hygiene, worker push-handoff doctrine,
  `FORCE_WITH_LEASE_RULE` carve-outs in `workflow-template.js` + `agents/war-worker.md`,
  `provision-worktrees.sh`). Deferred to the partial-phase-recovery spec; it motivates this one
  (the same campaign phase burned a restart on each half) but touches disjoint surfaces and the
  no-force-push / resume-doctrine invariants this spec never goes near.
- **Editing the `SPINE` array** — ownership stays with the fixed six-lens engine.
- **A `Plan`-agent remediation** — zero references exist in the scaffold (verified).
- **`red-team-gate.mjs` changes** — the INCOMPLETE/dropped contract already covers the exhausted
  fallback.
- **A harness capability-query API or probe-confinement jail** — rejected before (ADR 0033);
  nothing here reopens it.

## 10. Validation criteria

Each individually checkable against the landed tree:

1. `node --test skills/red-team/assets/workflow-scaffold.test.mjs` is green, and a mock harness
   that throws on `agentType: 'Explore'` yields FINDINGS results for **all** analyzed probes via
   captured fallback dispatches with `agentType: 'general-purpose'` and zero dropped markers.
2. The same recovery holds when the mock returns `null` instead of throwing (both failure shapes
   pinned).
3. With both agent types dead for analyzed probes, every analyzed probe emits
   `{ probe, dropped: true }` and the scaffold's returned `expected` equals the full probe count
   — piping that result through `red-team-gate.mjs --stdin` yields verdict `INCOMPLETE`.
4. Captured opts for executed probes show `agentType` undefined with exactly one dispatch each
   (no fallback re-dispatch on the executed path).
5. Running the scaffold with `args.analyzedAgentType: 'custom-agent'` shows `'custom-agent'` as
   the dispatched agentType at **both** the probe and adversarial-confirm sites.
6. `grep -c "'Explore'" skills/red-team/assets/workflow-scaffold.js` counts exactly 1 — the
   preferred-type constant; both dispatch sites reference the constant, not the literal.
7. The scaffold's SAFETY comment block no longer names Explore as the sole analysis agent (grep
   for the old sentence `Analysis probes are read-only (Explore agent)` returns no hit; the
   replacement names the fallback pair).
8. `skills/red-team/references/lenses.md` bespoke catalog contains an `ff-topology` executed row
   whose gist names the fast-forward fixture (linear single-parent chain, no per-task merge
   commit, single `--no-ff` phase land) and all three trigger anchors (`^1`, `--first-parent`,
   post-merge three-dot).
9. `skills/red-team/SKILL.md` Step 2 names `ff-topology` as mandatory when a per-task
   merge-commit anchor appears, not skippable under `--fast`, and carries the grep-is-a-floor
   manual prose-read mandate.
10. A drift-guard test in `workflow-scaffold.test.mjs` turns red when the `ff-topology` token is
    removed from either prose surface (delete-the-feature check: verified failing against a copy
    with the token stripped).
11. The catalog row's fixture claims reproduce in a scratch repo: after building the ff chain,
    `git diff <integration>...<task>` post-merge emits nothing, and `git rev-parse <task-tip>^1`
    resolves to the chain's previous commit rather than a pre-task base — matching the
    topology-void classes the probe must flag.
12. Every new behavioral test fails against the pre-change scaffold (mutation check: stash the
    scaffold edits, the new cases go red; restore, green).
