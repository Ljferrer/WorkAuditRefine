# WAR data contracts

Every agent returns **only** its JSON object (no prose). The Workflow passes these as the `schema` to `agent()`, so the StructuredOutput tool validates and the model retries on mismatch.

## WorkerResult — `war-worker` and fix-workers
```jsonc
{ task_id, branch, worktree, head_sha,
  status: "implemented" | "blocked",
  tests: { added: ["path"], command: "uv run pytest ...", passed: true },
  acceptance_criteria_covered: ["criterion_id"],
  files_changed: ["path"],
  notes: "anything the auditor should know",
  blocked_reason?: "present iff status==blocked — the ambiguity/contradiction" }
```

## ENV_OUTCOME — the uniform return for all three `provision` dispatches
Every `provision`-mode refiner dispatch — the **phase git-topology barrier** (`provision:phase-<id>`), the **per-task provision-run** (`provision-run:<taskId>`), and the **phase-close polish worktree** (`polish-worktree:phase-<id>`) — returns this same shape:

```jsonc
{ ok,                   // true iff every dispatched subcommand exited 0
  taskId?,              // (provision-run) the task whose worktree was being provisioned
  failedCommand?,       // the subcommand/step that exited non-zero — VERBATIM (the evidence gate matches it)
  exitCode?,            // its exit code (a NUMBER; a non-zero value is required for an env-block)
  stderrTail?,          // tail of its stderr (the escalation / the script's die text)
  provisionSource? }    // (provision-run) where the list came from: explicit|manifest|ci|onboarding|structural|none
```

- **Evidence gate (per-task provision-run).** An `ok: false` becomes an **`env-blocked`** task outcome ONLY with **execution evidence**: a `failedCommand` that trim-matches one of the dispatched `run.provision` steps (exact array membership, never substring) **and** a numeric **non-zero** `exitCode`. An `ok: false` missing that evidence — a missing/typeless result, refusal prose, a foreign/absent `failedCommand`, a non-numeric or an incoherent `exitCode: 0` — is **not** trustworthy: it classifies **`held:workflow-error`**, never a fabricated `env-blocked`. (There is no `provisionList[0]` / synthetic-`exitCode:1` fallback — the template throws.)
- **Barrier / polish routing.** A barrier `ok: false` (or missing result) → `held:workflow-error` carrying the `stderrTail` (no topology ⇒ nothing in the phase can run — a hard stop, evidence or not). A polish-worktree `ok: false` (or missing) → **fail-open**: the sweep is skipped, the phase-close queue drains to `follow-up`, the phase still lands (never a hold).

## `env-blocked` — the task outcome the evidence gate produces
A task reaches the refiner with exactly one terminal **outcome**. Two are produced by the worker itself (a `WorkerResult` with `status: "implemented"` or `"blocked"`, above). A third — **`env-blocked`** — is **not** a worker result: it is produced when the **per-task provision-run** returns an evidence-bearing `ok: false` (per the gate above), **before any worker is spawned**. The worktree never became gate-ready, so there is nothing for a worker to do. The escalation carries `{ taskId, failedCommand, exitCode, stderrTail, provisionSource }` from the real result fields.
- **The worker is NOT spawned.** The barrier runs each `run.provision` command in order after creating the worktree and before launching the worker; the first failure short-circuits to `env-blocked` and the worker launch is skipped entirely. This is distinct from a failed gate (broken code) — here the *environment* never came up.
- **No `WorkerResult` is produced for an `env-blocked` task** — there is no `branch`/`head_sha`/`tests`, because nothing was implemented. Do **not** add `env-blocked` to the `WorkerResult` schema above; it is its own task-outcome shape. (This corrects earlier "worker result schema" wording in the design spec, B.3.4/B.4 — `env-blocked` is a task outcome, not a worker result.)
- **Lead handling** (halt the task, escalate, **0 FIX rounds**, **keep** the worktree for inspection, siblings proceed) is specified in [SKILL.md](../SKILL.md). The red-team analogue of a provision failure is a probe `status: "warn"` (never a red verdict), not `env-blocked`.

> The *behavioral* assertion that the barrier emits this exact shape and does not spawn the worker is exercised in the refiner Provision-barrier test (`skills/war/assets/workflow-template.test.mjs`), not here — this section is the data contract.

## AuditVerdict — `war-auditor` (one per seat per round)
```jsonc
{ seat: "seat-1",
  lens: "correctness" | "cascading-impact" | "plan-faithfulness" | "<domain>",
  audit_sha: "<sha reviewed — verdict is pinned to it>",
  verdict: "approve" | "request_changes" | "escalate",
  findings: [ { severity: "Critical"|"Major"|"Minor"|"Nit",
                title, file, line?, rationale, suggested_fix?, plan_ref?,
                disposition?,       // "absorb"|"follow-up"|"note" — auditor-owned routing, orthogonal to severity (ADR 0013); omitted → Minor becomes follow-up, Nit becomes note; absorb is NEVER defaulted
                phaseClose?,        // bool; on an absorb finding — the fix needs the integrated tip or a shared/slot-adjacent file → routes to the phase-close queue (ADR 0012)
                autoFixable? } ],   // DEPRECATED — legacy alias: autoFixable:true reads as disposition:'absorb' for one release, then it is removed
  tests_verified: { exist: true },                // anti-cheat: existence + integrity verified (not executed — the refiner runs the gate)
  confidence: "high" | "medium" | "low",          // low → lone seat widens (D4)
  widen?: ["lens-name"],                           // optional lens-name array — the lenses a triggered LONE seat nominates to widen toward; honored only on a lone seat; a valid nomination is non-empty, distinct, and never a RESERVED lens
  escalate_reason?: "present iff verdict==escalate — the plan is wrong/underspecified" }
```
- **`severity` becomes schema-required** on finding items (`required: ['severity']` in the executable literal — previously finding items had **no** required array; this release introduces the requirement, ADR 0013 resolution 3). Schema-layer retry corrects a sloppy seat; persistent failure falls into the existing dropped-seat → audit-blocked lane.
- **`widen` is optional and only meaningful on a lone seat** (D4). When a 1-seat roster returns a Critical or low-confidence verdict, `resolveWidenSource` ([`../assets/war-config.mjs`](../assets/war-config.mjs)) reads `widen`: a **valid** nomination — a non-empty array of distinct, non-empty lens names, **none reserved** (`execution-evidence`/`pin-validity`) — widens toward those lenses at `deep`; absent/invalid → the default roster's lenses (the byte-identical trio-union fallback). Validity is strict whole-field (any bad entry rejects the whole nomination). It is **never reserved-selectable** and never honored on a multi-seat roster (a roster the human approved is not second-guessed).
- **`plan_ref` doubles as the End-state key** on gate-audit findings: an End-state finding carries the claimed condition text **verbatim** in `plan_ref` so the handoff block can key `endState` statuses on it.

## MergeResult — `war-refiner`
```jsonc
{ mode: "merge-task" | "land-phase",
  status: "merged" | "landed" | "gate_failed" | "conflict" | "no-test" | "unpackaged" | "submodule-blocked" | "submodule-pr" | "land_stale" | "error",
  branch, integration_sha?, working_sha?, conflict_files?, gate_output?,
  gate_failure_class?: "introduced" | "baseline" | "environment",   // populated WITH status:"gate_failed"; absent ⇒ "introduced" (fail-safe)
  gate_failing_ids?: ["<failing test/check id>"],   // the classified failing-identifier set — populated on a "baseline" result
  gate_base_sha?,                                    // the classification base sha — populated on a "baseline" result
  pr_number?, pr_remote? }
```
- **`integration_sha`** — the post-rebase integration tip the gate ran at; the post-merge gate-audit pass reads it as gate-HEAD provenance to confirm the executed `gate_output` corresponds to the integration tip (it does not add a field; `integration_sha?` already exists).
- **`no-test`** — (merge-task only) `assert-test-in-diff.sh` found no test file in the task's diff and the task has `requiresTest:true`. The refiner did **not** merge. The Workflow routes a bounded fix-worker + full re-audit sub-loop. Distinct from `gate_failed` (gate ran and failed) and from `error` (git/ref problem — exit 2 from the script, not exit 1). A transient git error (exit 2) must never collapse to `no-test`.
- **`unpackaged`** — (merge-task only) `assert-packaging-in-diff.sh` flagged an added/renamed file that a Dockerfile's enumerated `COPY`/`ADD` sources miss (and `.dockerignore` does not exclude), and the task has `requiresPackaging !== false`. The refiner did **not** merge. Mirrors `no-test`: the Workflow routes a bounded fix-worker ("add the COPY or dockerignore it — never delete the file") + **full** re-audit + re-merge on the shared `fixRounds` budget; the fix-worker and no-test retry share **one combined floor-retry sub-loop**, so a task tripping both floors gets bounded fixes rather than an immediate hard escalate on the second floor. Budget exhaustion escalates `unpackaged` as a hard reason — it is in **both** `HARD_ESCALATION_REASONS` mirrors (`workflow-template.js`, `land-decision.mjs`) + the drift guard. The gate on `requiresPackaging` is **independent of `requiresTest`** (like `submodule-blocked`, decoupled from the test flag); a `requiresPackaging: false` skip is logged, never silent. Distinct from `gate_failed` (gate ran and failed) and from `error` (git/ref problem — exit 2 from the script, not exit 1; `unpackaged` is exit 1). A transient git error (exit 2) must never collapse to `unpackaged`.
- **`submodule-blocked`** — (merge-task only) `assert-no-submodule-mutation.sh` detected a gitlink change or a path-under-submodule change in the task's diff. The refiner did **not** merge. The Workflow routes an **immediate hard escalate** with 0 fix rounds (`reason: "escalate"`, detail names the submodule). Distinct from `no-test` (different script, unconditional — does not gate on `requiresTest`) and from `error` (git/ref problem — exit 2 from the script, not exit 1; `submodule-blocked` is exit 1). A transient git error (exit 2) must never collapse to `submodule-blocked`.
- **`submodule-pr`** — (land-phase only) the submodule is not WAR-owned; the refiner pushed the submodule integration branch and opened a PR on the submodule remote (2B PR-and-hold). Carries `pr_number` (the opened PR number) and `pr_remote` (the submodule remote — e.g. `owner/repo`). The Workflow maps this **directly** to `landDecision: "held:submodule-pr"` (same direct-return pattern as `held:workflow-error` — **not** routed through `HARD_ESCALATION_REASONS`; DP2). The run is held until a human merges the PR and re-triggers `/war`.
- **`land_stale`** — a same-branch land exhausted the bounded reland loop (`roundLimit` CAS-contention relands with no push success); the phase is held for the Lead. Distinct from a content `conflict`: there are no merge-text contradictions, only topology contention (another run pushed the working branch while this one was merging). The Lead re-runs the land manually after the contending run clears.
- **`gate_failure_class`** — (populated **with** `status: "gate_failed"`, both merge-task and land-phase; ADR 0019) the on-failure classification the refiner returns after re-running the failing gate at the **classification base** (merge-task = the phase integration base; land-phase = the detached `origin/<working>` tip). It is **orthogonal to `status`** — **no** `MergeResult` status value, `HARD_ESCALATION_REASONS` member, or `KNOWN_LAND_DECISIONS` member is added or changed (`land-decision.mjs` untouched, ADR 0005). Absent ⇒ **`introduced`** (the permanent fail-safe). Values: **`introduced`** (base green + the failure reproduces at the task tip — the classic regression) → routed byte-identically to today's soft `gate_failed` escalation (merge) / `held:land-failed` (land); **`environment`** (base green + the failure does **not** reproduce on a second run at the task tip in a fresh env — reproducibility, not file-disjointness, is the trigger) → soft-escalated reusing reason `env-blocked` (0 fix rounds, worktree kept, siblings proceed), `detail` = the MergeResult (a gate-time env-block, **not** the provision `env-blocked` `ENV_OUTCOME` shape); **`baseline`** (base red with the **same** failing identifiers) → the Workflow records the debt keyed on (`gate_failing_ids`, `gate_base_sha`) and dispatches **one** baseline-proceed re-merge/re-land, then routes the result normally (a 2nd `gate_failed` treats `baseline` as `introduced` — bounded). The base-run evidence rides `gate_output` **uncurated** (judgment, not parsing). `gate_failing_ids` (the classified failing-identifier set) and `gate_base_sha` (the classification base sha) are populated on a `baseline` result — they are the Workflow's dedup key, the `source: 'auto'` backstop `check` string, and the baseline-proceed prompt's named identifiers.

## Gate rule (applied over AuditVerdicts)
- any open **Critical/Major** (any seat) → **blocks** → batched `FIX_NEEDED`
- any **escalate** → **halts** to the Lead
- **all `approve`**, no open Critical/Major, **same `audit_sha`** → merge-eligible (**convergent unanimity** — if HEAD moves, every seat re-confirms against the new SHA)
- split (mixed approve / request_changes) → **one rebuttal round** (each seat re-judges seeing peers' findings) → unanimous-approve | agreed-block (FIX_NEEDED) | still-split (escalate)

## ledger.json — run state at `.claude/teams/<run-id>/`
```jsonc
{ run_id, plan_file, working_branch, landing_branch, gate, created_at,
  phases: [ { id, title, epic_issue, integration_branch,
    status: "todo"|"running"|"landed"|"blocked",
    tasks: [ { id, issue, title, branch, worktree, deps: ["id"],
      roster: [ { lens: "correctness", depth: "deep" } ],   // 1–5 distinct-lens audit seats; per-seat depth ("neighbors"|"deep", omitted → "deep")
      plan_slice,
      requiresTest: true,           // bool; default true — set false for docs/config/VERIFY-no-op tasks; gates the refiner's test-floor check
      requiresPackaging: true,      // bool; default true, Lead-set at decompose — set false to skip the packaging floor (a logged, never-silent skip); resolved as `r.task.requiresPackaging !== false`, independent of requiresTest; gates the refiner's assert-packaging-in-diff.sh floor
      targetRepo?: "path/to/submodule",  // present only on submodule tasks + their paired gitlink-bump tasks; the submodule checkout path (relative to the superproject); absent on superproject tasks. A submodule PHASE = the set of tasks sharing a `targetRepo`; the per-task `targetRepo?` tag is canonical, the phase repo is derived.
      status: "todo"|"working"|"audited"|"merged"|"escalated"|"blocked",
      audit_sha?, verdict?, merge_sha? } ],
    report?, escalations: [], minors_filed: ["issue#"],
    handoff?,              // (phase-level) the Workflow-returned handoff block, written by the Lead from the return — present for phases that returned it (landed / held:escalation only)
    pr_number?,            // (submodule 2B phases) PR number opened on the submodule remote
    pr_remote?,            // (submodule 2B phases) submodule remote (e.g. "owner/repo") the PR was opened against
    submodule_merge_sha?   // (submodule phases) SHA of the submodule commit that was merged (written on resume after mergeCommit.oid is confirmed)
  } ],
  pr_url? }
```
- **`merge_sha` is advisory** — authoritative only when reachable on the branch (the reconciliation pre-flight's invariant; git is monotonic, so a recorded `merge_sha` is real iff its commit is reachable). The ledger is a lagging view; git branch state is the authority ([ADR-0008](../../../docs/adr/0008-git-is-the-resume-source-of-truth.md)).
- **`pr_number` / `pr_remote` are advisory** — recorded when the Workflow enters `held:submodule-pr`; read by the Resume procedure to confirm the PR state via `gh pr view`. Absent on superproject phases and on submodule 2A (WAR-owned) phases that land without a PR.
- **`submodule_merge_sha` is advisory, authoritative-when-reachable** — same rule as `merge_sha`: the gitlink pin is authoritative only when reachable on the submodule remote (`git -C <submodule-checkout> fetch && git cat-file -e <submodule_merge_sha>`). A SHA not reachable on the submodule remote → treat as class A (ledger-ahead for the pin; clear the pin, surface to the user before re-landing). Written on resume from `mergeCommit.oid` (2B) or from the CAS push result (2A).

## GitHub conventions
- **Epic issue per phase**; **sub-issue per task** (GitHub sub-issues).
- Labels: `phase:<N>`, `status:todo|working|audited|merged|escalated|blocked`, `audit:<seatCount>`.
- **Minor/Nit** findings route by **disposition** (ADR 0013): `follow-up` → a new issue labeled `war-followup`, linked to the phase epic (an affirmative act — the auditor stated why it is not absorbable); `note` → phase report + servitor feed, never an issue; `absorb` → fixed in-phase under `--ace` (`run.ace`) by the per-task ace, or by the phase-close sweep when `phaseClose:true` / release-slot-adjacent, and recorded on the Workflow's `aced` list (commit-cited, not a GitHub issue). A failed or ineligible absorb **demotes one step** (logged) — so only `follow-up`-routed findings (including demotions) file as `war-followup`, and nothing drops silently. Legacy `autoFixable:true` reads as `disposition:'absorb'` for one release (deprecated).
- Phase reports + escalations → **comments on the phase epic issue** (durable, human-visible).

## ServitorResult — `war-servitor` (once per phase, after land)
```jsonc
{ phase, target: "<absolute memoryLocalRoot>",
  files_written: ["<absolute path under memoryLocalRoot>"],
  learnings: [ { title, why } ] }
```
`memory_index_updated` is **retired** (spec §4.6): the servitor no longer maintains `MEMORY.md` — the index is a generated projection the Lead regenerates with `war-memory render-index` after the servitor returns (Gate 2). The servitor writes lesson files only.
The servitor writes ONLY under the threaded absolute local memory root `memoryLocalRoot` (repo-root publication is the Lead's Gate-2 promotion — the servitor never writes `docs/learnings/`). Confinement is the capability allowlist — no Bash, only Read/Grep/Glob/Write/Edit — so its sole write path is Write/Edit; the PreToolUse scope hook then gates those by `agent_type` to the single local memory path-pattern `*/.claude/projects/*/memory/*`, and the provenance guard denies mutation of any pre-existing untagged memory file ([ADR 0002](../../../docs/adr/0002-scope-by-agent-type.md), [ADR 0022](../../../docs/adr/0022-servitor-local-root-writes-gate-2-promotion.md)); it never touches source, branches, PRs, or issues. Every path in `files_written` is **absolute** and under `memoryLocalRoot` (the Lead's Gate-2 reconciliation is an absolute-prefix check).

## ScoutResult — `war-setup-scout` (once, before provisioning)
The read-only, Explore-class setup-scout (`agents/war-setup-scout.md`) reads the **target repo's own** setup signals and derives an ordered provisioning command list. It returns **only**:
```jsonc
{ provision: ["<shell cmd>", ...],   // ordered; submodule-init before install; [] is valid
  source: "explicit" | "manifest" | "ci" | "onboarding" | "structural",  // the highest-authority tier that yielded signal
  rationale: "which signals were read and why this list, in this order" }
```
- **Authority (descending):** `explicit` (a non-empty `run.provision` honored verbatim, no scouting) → `manifest` (a committed `.war-provision.json`, tier 1 — above CI, below explicit) → `ci` (`.github/workflows/*.yml`) → `onboarding` (`.devcontainer`, a `Makefile`/`Justfile` `setup` target, `package.json scripts.{setup,bootstrap,prepare}`, CONTRIBUTING/README setup sections) → `structural` (the tiny floor). The scout stops at the first tier that produces a list.
- **Scout subset vs. config enum.** The scout **emits** `{ explicit, manifest, ci, onboarding, structural }`. The full `run.provisionSource` config enum is wider: `explicit | manifest | ci | onboarding | structural | none` ([`../assets/war-config.mjs`](../assets/war-config.mjs) `PROVISION_SOURCES`). `none` is the unscouted/empty default and is never emitted by the scout.
- **No ecosystem table:** every command is traceable to a signal actually read in the repo, or to the deterministic structural floor — `structuralFallback` in [`../../_shared/provision.mjs`](../../_shared/provision.mjs) (submodule-init + a single known-lockfile install only). The scout never synthesizes an install from a guessed language/framework.
- **Guarded downstream:** `provision` must pass `validateProvision` (array of non-empty trimmed strings) before it is pinned, and the operator reviews `{ provision, source, rationale }` during war-room Setup. There is no automated test for the scout; its golden-check is the checked-in fixture + [`../../_shared/fixtures/provision/EXPECTED.md`](../../_shared/fixtures/provision/EXPECTED.md) (deterministic coverage of the floor lives in `provision.test.mjs`).

This result is the *derivation* output; pinning it into `run.provision` (and the every-time execution that follows) is governed by the §Run config below.

### Provisioning manifest (.war-provision.json)

A committed JSON file at the repo root that declares an ordered provisioning list. The scout reads it as **authority tier 1 — above CI, below explicit operator `run.provision`** (closes [#51](https://github.com/Ljferrer/WorkAuditRefine/issues/51)).

**JSON schema:**
```jsonc
{ "provision": string[],   // required; ordered; [] is valid ("no steps")
  "rationale"?: string }   // optional human note
```
- `"provision"` is required and must be a `string[]` passing `validateProvision` (non-empty trimmed strings).
- `"rationale"` is optional.
- No other top-level keys are permitted (source assigned-not-declared rule — see below).

**source assigned-not-declared:** The manifest carries **no `source` field**. The reader stamps `source: "manifest"` after a successful read. A manifest that includes its own `source` key is **rejected** (unknown-key error) — a repo cannot claim a higher authority tier by self-declaration.

**fail-loud-on-broken contract:** A present-but-broken manifest **stops with errors** — it does not silently fall through to CI. The reader (`readManifest` in `skills/_shared/provision.mjs`) returns `{ found: true, ok: false, errors: [...] }` for any of:
- Unknown top-level keys (including a self-declared `source`)
- Malformed / non-JSON content
- Non-object JSON (e.g. `null`, `[]`, `"x"`, `42`) — `JSON.parse` succeeds on these, so an explicit object guard is required before key inspection
- A `provision` entry that fails `validateProvision` (blank / whitespace-only string)

On a successful read: `{ found: true, ok: true, provision: [...], rationale?: "..." }`. Absent file: `{ found: false }`.

**Absence is safe:** no `.war-provision.json` → the scout continues to CI exactly as before. This is purely additive.

## Run config — `.claude/war/config.json` (optional)
Produced by `/war-room`, consumed by `/war`'s Setup. The schema, defaults, presets, and validation are owned by [`../assets/war-config.mjs`](../assets/war-config.mjs) (`--fill-defaults` to resolve a file, `--preset <name>` to emit a preset, `--stdin` to validate piped JSON). Absent this file, `/war` uses built-in defaults (pre-v0.3.0 behavior).
```jsonc
{ version: 1, profile: "balanced" | "thorough" | "economy" | "<custom>",
  agents: {                                  // model ∈ opus|sonnet|haiku|fable; effort ∈ default|low|medium|high|xhigh|max ("default" = inherit session)
    worker:   { model, effort },             // worker config also drives fix-workers
    auditor:  { model, effort },
    refiner:  { model, effort },
    servitor: { model, effort } },
  audit: {
    roster: [ { lens: "correctness", depth: "deep" },        // 1–5 seats; lenses distinct; depth "neighbors"|"deep", omitted → "deep"
              { lens: "cascading-impact", depth: "deep" },   // this default roster is also the union-widening FALLBACK for autoEscalate (used when a lone seat's widen nomination is absent/invalid)
              { lens: "plan-faithfulness", depth: "deep" } ],
    rosterPolicy: "all" | "auto" | "solo",   // seeds per-task rosters at the decompose gate; default: "auto" (Lead composes 1–5 catalog seats per task, each at its own depth, with a one-line rationale)
    autoEscalate: true },                    // widens a Critical/low-confidence LONE seat — toward its own valid `widen` nomination (those lenses @ deep), else the default roster's lenses; set false (with rosterPolicy:"solo") to pin one auditor
// COST NOTE: rosterPolicy "all" spawns every roster seat on every task (3 deep seats with the
// default trio, unanimous); the default "auto" convenes the 1–5 seats the Lead composed per task.
// Use rosterPolicy:"solo" (economy preset) for cost-sensitive runs — one seat at neighbors depth.
// Legacy keys covenSize/lenses/covenPolicy FAIL validation with a courtesy error naming the key —
// run /war-room to regenerate the config (D3: no shims, no accepted-but-ignored keys).
  run: { roundLimit, afk, ace, provision, provisionSource, provisionAuto },
                                             // roundLimit >= 1; afk = default for /war --afk;
                                             // ace = pre-merge auto-fix of absorb-disposition nits (default true; economy preset false);
                                             // provision = ordered worktree-prep commands ([] = none); provisionSource ∈ explicit|manifest|ci|onboarding|structural|none;
                                             // provisionAuto = let /war-room scout provisioning when no explicit list (default true)
  memory: { retrieval, topK, commitLearnings },  // retrieval: Lead prefetches per-seat prior-lesson blocks (bool, default true); topK: max lessons/block (int >= 1, default 10); commitLearnings: write the repo-root docs/learnings lessons (bool, default true — lint-scrubbed, PR-reviewed; the economy preset pins false)
  overrides: { gate, workingBranch, landingBranch, learningsTarget, testPattern } }  // null = let /war auto-detect
// overrides.gate is the *declared base* command (string|null); the *resolved* gate run by agents
// is a self-discovering string produced by war-config.mjs resolveGate(declaredGate): it appends
// a find-based bash-suite discovery loop so every *.test.sh is found and run on each invocation.
// resolveGate STILL appends discovery even when overrides.gate is non-null — you cannot accidentally
// skip bash suites by pinning a gate override (F12 open decision #2).  "No string[]" — self-discovery
// supersedes a static list; re-detection is automatic on every gate invocation.
// overrides.testPattern is the *declared* test-floor glob set (string|null; default null) — it rides
// config → args exactly like overrides.gate → plan.gate: the Lead threads the pinned value into the
// per-phase Workflow as args.plan.testPattern (string|null; absent ⇒ null — the plan.gate precedent).
// The Workflow appends it VERBATIM as the assert-test-in-diff.sh `--pattern '<value>'` argument at both
// merge-task invocation sites; null ⇒ a bare invocation, byte-identical to today. A custom pattern does
// NOT replace the floor's unconditional *.test.sh discovery arm — that arm is unioned in script-side
// (assert-test-in-diff.sh, ADR 0019), so floor ⊆ gate survives any pinned pattern. The glob-safe charset
// is enforced by war-config.mjs's validator (a quote/`;`/backtick/`$`/newline value is rejected, naming the key).
```
These reach the per-phase Workflow as `args.agents`, `args.audit`, `args.run` (the Lead threads them in after resolving the file); `overrides` are applied by the Lead during Setup. See [`../assets/workflow-template.js`](../assets/workflow-template.js).

## Workflow per-phase args contract
`args` may be passed as a **plain object or a JSON string**; the template auto-parses a string so the Lead need not manually inline structured data.

Optional `agentPrefix` (default `"work-audit-refine:"`) — the template auto-namespaces every `agentType` seat under this prefix via `const NS = args.agentPrefix ?? 'work-audit-refine:'`. Pass a different string to override; the Lead no longer needs manual namespacing workarounds.

Optional `intent` (string|null, ADR 0013) — the plan's `## Commander's Intent` or `## AI-Commander's Intent` section (either heading), extracted **verbatim** by the Lead (never Lead-invented — `/war-machine --afk` is the sole authoring surface allowed to author intent, ADR 0014; neither section present → `null`). When present it is threaded into the worker, auditor, ace/sweep, gate-audit, and servitor prompts as the ceiling over the plan-slice floor. `null`/absent ⇒ every prompt is **byte-identical** to an intent-less run — literal behavior. Companion field `phase.endState` (string[]) carries the intent's End-state conditions **this phase claims** (Lead-mapped); the gate-audit pass checks them at the confirmed tip (later-phase conditions are out-of-scope there, never a hold).

Optional `memory` (spec §4.5) — the Lead's per-phase prior-lesson prefetch, shaped `{ byTask: { <task-id>: { worker, seats: { <lens>: block } } }, servitor }`, where each `block` is the `war-memory query` CLI's ready-to-inject text. Threaded like `intent`: the template concatenates a `memoryClause` at the worker, auditor, fix-worker, add-test, and servitor spawn sites (ace / gate-audit / polish-sweep get none). An empty/absent map ⇒ every prompt is **byte-identical** to a memory-less run. Retrieval fails open — a missing `memory` is never an error.

Auditors receive the **absolute `task.worktree` path** so they can `Read` candidate files directly in the task's isolated checkout rather than the main repo tree.

### Provisioning args (refiner-owned worktree lifecycle)
The refiner's **Provision** barrier ([ADR 0001](../../../docs/adr/0001-explicitly-managed-worktrees.md)) and the per-task branch/worktree derivation read these fields off `args`:

| field | meaning |
|---|---|
| `planSlug` | plan-slug for the **plan-namespaced** branch names ([ADR 0003](../../../docs/adr/0003-plan-namespaced-branches.md)). The template derives each task's branch as `war/<planSlug>/p<phase>-<task>`. |
| `runId` | run id segment in the worktree **path** (`<worktreeRoot>/<runId>/p<phase>-<task>` — phase-scoped, mirroring the branch shape); keeps concurrent runs' directories collision-free even when branch names share a slug, and a same-run cross-phase relaunch never collides on a stale sibling worktree. |
| `worktreeRoot` | absolute dir that holds the per-run worktrees (e.g. `<repo>/.claude/worktrees`). |
| `mainCheckout` | absolute path of the parent checkout — the cwd the barrier runs `ensure-exclude` from (probe E2: the `.claude/` exclude must be written in the **main** checkout, not a task worktree). |
| `ownedFile` | path to the run's owned-refs ledger, threaded to `ensure-integration --owned-file`; a `integration/<slug>/phase-N` that exists but is **not** in this ledger is a foreign collision → the script exits non-zero (fail-loud), distinguishing a resume from a cross-plan clash. |

`runDir` (= `.claude/teams/<runId>`) is the run-scope for `provision-worktrees.sh` teardown.

> **Footgun — `undefined` in prompts.** Branch/worktree are derived as
> `t.branch || (planSlug ? "war/<planSlug>/p<phase>-<task>" : t.branch)` and
> `t.worktree || ((worktreeRoot && runId) ? "<worktreeRoot>/<runId>/p<phase>-<task>" : t.worktree)`.
> If the Lead supplies **neither** a per-task `branch`/`worktree` on the task object **nor** the
> `planSlug` / `worktreeRoot` + `runId` args, the fallback is `undefined` and JS interpolation bakes
> the literal string `"undefined"` into the worker/auditor/refiner prompts (an unprovisionable branch
> name and a bogus path). Always thread `planSlug`, `runId`, and `worktreeRoot` (or set explicit
> `task.branch`/`task.worktree`).
> **Entry validation (H).** When any task lacks an explicit `branch`/`worktree`, the template
> validates the derivation inputs **once at entry** (top of the `try{}` body, before the per-task
> loop) and throws — routed to `held:workflow-error` — naming the exact absent keys. Two distinct
> classes: the missing members of `{ planSlug, runId, worktreeRoot }`, and a missing `phase.id` (the
> silent `pundefined-` derivation class). Zero tasks ⇒ no throw.

## Workflow per-phase return

The per-phase Workflow returns:
```jsonc
{ phase,                              // phase id
  landed: ["task_id"],                // tasks merged onto the integration branch
  escalated: [ { task, reason, ... } ],
  minorsFiled: [ { task, ...finding } ],   // disposition:'follow-up' findings (incl. every logged demotion) filed as war-followup
  notes: [ { task, ...finding } ],    // disposition:'note' findings — phase report + servitor feed (memory candidates), never issues
  aced: [ { task, finding, sha } ],   // absorbed findings, commit-cited (per-task ace AND the phase-close sweep's queue at the polish sha; empty unless run.ace). NOT filed as war-followup
  landResult,                         // MergeResult of the in-flow land, or null if held
  servitorResult,                     // ServitorResult, or null if the Workflow did not land/wrap up
  auditLog: [ { task, verdict, findings, blocked } ],   // fed to a Lead-driven wrap-up on the held path
  landDecision: "landed" | "held:escalation" | "held:nothing-merged" | "held:land-failed" | "held:phase-incomplete" | "held:workflow-error" | "held:submodule-pr",
  handoff?: {                         // ADR 0013 — the machine-readable debt map the next phase's decompose reads
    tipSha,                           // landed working sha; degraded (held:escalation) → last confirmed merge tip, else null
    polish: "merged" | "discarded" | "skipped",   // phase-close sweep outcome (skipped = never dispatched)
    absorbed: [ { sha, findings: ["title"] } ],   // aced provenance grouped by commit sha
    followUps: [ { issue, reason } ], // issue# (null until the Lead files it) + title — why-not-absorbable
    notes: [ { task, title } ],
    endState: [ { condition, status: "met" | "unmet" | "deferred" | "out-of-scope" } ],   // keyed on gate-audit plan_ref (verbatim condition text); no gate-audit ran ⇒ all 'deferred', never a silent 'met'
    intentPresent,
    backstops } }                   // array|null — every validation this phase deferred; the Workflow passes the Lead-normalized args.backstops through untouched (the Lead is the single normalization point). Entry: { check, why, runner, source: 'plan'|'auto', aiDeclared? } — 'plan' = parsed from the plan's `## Deferred validations (backstops)` section (unparseable line carried whole as `check`, never dropped), 'auto' = Setup auto-recorded (e.g. "docker build (daemon unavailable at setup)"); aiDeclared:true marks a `## … (backstops — AI-declared)` section (ADR 0014 provenance — never surfaced as operator-ratified). null = legacy plan with no backstop section (surfaced note). SOLE Workflow-authored exception (ADR 0019): the Workflow appends its OWN source:'auto' baseline-gate-debt entries ({ check: "baseline gate debt: <ids> — pre-existing at <base sha>", why, runner: "target repo CI / operator", source: 'auto' }) when a gate failure classified `gate_failure_class:'baseline'` — exactly one deduped entry per unique (identifier-set, base sha) key; null promotes to a one-entry array; Lead-normalized entries stay untouched. Rendered as the mandatory "Unexecuted backstops" line in phase reports + the final PR body, and aggregated across plans by the campaign ledger.
```
`handoff` is emitted on `landed` **and** `held:escalation` (degraded: `polish:'skipped'`, End-state statuses as known — an escalated phase still hands off; the next decompose needs the debt map most exactly then). It is **omitted** on `held:workflow-error` (infra death — the ledger + issues are the record; there is no trustworthy return to render) and on the other holds (nothing landed to hand off). The Lead writes it to the ledger's phase-level `handoff` field.
When `landDecision` is a `held:*` value the land was **not** performed in-flow; the Lead lands manually and then runs `war-servitor` (see SKILL.md). The full `landDecision` enum:
- **`landed`** — the phase merged and pushed cleanly in-flow.
- **`held:escalation`** — a hard escalation (Critical/Major, unresolvable conflict, plan contradiction) halted the in-flow land; the Lead resolves and lands manually.
- **`held:nothing-merged`** — no task merged cleanly and no hard escalation was raised (e.g. a lone `gate_failed`); surfaced explicitly rather than silently skipped.
- **`held:land-failed`** — the in-flow land step itself failed (non-stale failure; distinct from `land_stale`); the Lead re-runs the land manually.
- **`held:phase-incomplete`** — the Workflow returned a non-`completed` notification (timeout, kill, infra death); the phase did not finish. Retryable via `resumeFromRunId` up to `run.roundLimit` total attempts; never advances the DAG; git state preserved (no teardown).
- **`held:workflow-error`** — the Workflow completed but returned a missing/unparseable result or a `landDecision` not in the known set, **or** the in-script top-level `try/catch` caught an uncaught exception inside the phase body (returned directly by the catch with a `workflowError` field). Terminal — HARD-halts regardless of `--afk`; never retried; git state preserved.
- **`held:submodule-pr`** — the submodule phase's land chose 2B (PR-and-hold): the refiner pushed the submodule integration branch and opened a PR on the submodule remote. **Set directly** by the Workflow (same pattern as `held:workflow-error` — **not** via `HARD_ESCALATION_REASONS`; DP2). The PR number and remote are captured in the ledger (`pr_number`, `pr_remote`). The run is held until a human merges the PR; resume reads `gh pr view <n> --json state,mergeCommit -R <pr_remote>`, takes `mergeCommit.oid` as `submodule_merge_sha`, writes it to the ledger, and clears the hold. Only arises in non-AFK 2B (an un-owned submodule under `--afk` is refused at launch — DP5).
