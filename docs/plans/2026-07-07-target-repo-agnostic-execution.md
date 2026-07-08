# Target-repo-agnostic execution — floor pattern, docker probe, gate-failure classes, provision base

Source spec: `docs/specs/2026-07-07-target-repo-agnostic-execution-design.md`
Issues: #579 (epic) · #574 (test-floor `--pattern` never threaded) · #576 (docker arch mismatch misclassified `gate_failed`) · #577 (gate has no baseline notion) · #578 (provision cuts from stale local ref).

## Commander's Intent

- **Purpose:** WAR must execute cleanly against target repos that do not share this repo's conventions. The test-floor pattern, docker-gate composition, gate-failure verdict, and provision base each **derive from the target repo first and fall back to today's exact behavior** when derivation is impossible (epic #579) — so an external campaign never again burns maximum spend on a floor that cannot be satisfied, a doomed docker segment, a pre-existing red gate, or a stale phase base.
- **Method:** pin the test-floor pattern as per-run config (`overrides.testPattern`) threaded end-to-end like `plan.gate` — never parsed out of the gate command; the floor always keeps the gate's unconditional `*.test.sh` discovery in its match set so floor ⊆ gate survives any custom pattern. Prevent doomed docker segments at Setup with a per-image probe build (Bash-tool timeout-bounded) that auto-defers platform-mismatched images to `source: 'auto'` backstops. Classify every gate failure by an on-failure re-run at the classification base into an orthogonal `MergeResult.gate_failure_class` (`introduced` | `baseline` | `environment`) that routes recovery — today's soft-escalation / zero-round environment escalation / recorded-baseline-debt proceed — **without touching any status enum, `HARD_ESCALATION_REASONS`, or `KNOWN_LAND_DECISIONS`** (ADR 0005). Make `cmd_ensure_integration` fetch origin and resolve equal/behind/ahead/diverged before cutting — true divergence halts loud with both SHAs and repair guidance, never a silent pick (ADR 0008). Every refiner-behavior change lands in `workflow-template.js` **and** `agents/war-refiner.md` in the same commit (both-surfaces rule); every standing "never on a red gate" invariant sentence is reworded for the baseline carve-out in the same phase; every consciously un-run validation becomes a recorded backstop, never prose (ADR 0017).
- **End state:**
  1. `overrides.testPattern` exists in `war-config.mjs` `DEFAULTS` (default `null`), validates as `null` or a non-empty **glob-safe** string (shell-metacharacter values rejected with an error naming the key), and unknown `overrides.*` keys produce a courtesy error (the `memory.*` precedent); the key is enumerated in `skills/war-room/SKILL.md`'s overrides line.
  2. With `testPattern` set, the initial merge-task prompt, the floor-retry re-merge prompt, and `agents/war-refiner.md` step 4 all carry `--pattern '<value>'`; with it `null`/absent, both dispatched prompts are **byte-identical** to today's bare invocations.
  3. `assert-test-in-diff.sh`'s custom-pattern branch **unions the gate's unconditional `*.test.sh` discovery arm** (same exclusions) into any `--pattern` set — a `.test.sh` suite always satisfies the floor; regression fixtures cover the `.test.ts` custom match, the bare-invocation refusal, the `.test.sh`-under-custom-pattern union, and the `**/`-token root-file miss. `assert-packaging-in-diff.sh` carries a header note recording the decision-C audit (no override added).
  4. `MergeResult` carries optional `gate_failure_class` with exactly the three values in **both** the `MERGE_RESULT` inline constant and `references/schemas.md`; no `MergeResult` status, `HARD_ESCALATION_REASONS` member, or `KNOWN_LAND_DECISIONS` member is added or changed (`land-decision.mjs` untouched).
  5. Routing on `gate_failed`: `'environment'` → soft escalation reusing reason `'env-blocked'` with **zero** fix-worker dispatches, worktree kept, siblings proceed; `'baseline'` → one bounded baseline-proceed re-dispatch, the merge/land proceeds, and a deduped `source: 'auto'` baseline entry appears in `handoff.backstops[]`; absent class → byte-identical today's soft-escalation routing. Each covered by a `workflow-template.test.mjs` assertion that **fails if the classification branch is deleted**.
  6. The classification procedure — base re-run in a re-attached-by-default `_refinery`, reproducibility check for the environment class, per-site classification base (merge-task = phase integration base; land = the detached `origin/<working>` tip), in-run baseline-debt reuse — appears in the dispatched merge-task, re-merge, and land prompts **and** `agents/war-refiner.md`, locked by a token-anchored, sentence-case-tolerant drift-guard test; a baseline-merged task's gate-audit prompt carries the classified debt so red baseline output cannot fake a provably-unrun HARD hold.
  7. Setup's docker-gate step probe-builds each discovered Dockerfile (Bash-tool `timeout`-bounded; interactive runs confirm the probe within the existing docker-gate ask); a platform-signature failure (`EBADPLATFORM` / `no matching manifest for <platform>` / `exec format error`) auto-defers that image to a `source: 'auto'` backstop; the "daemon that dies after provision still surfaces as `gate_failed`" residual sentence is superseded by the environment class.
  8. `cmd_ensure_integration` fetches `origin/<base>` before cutting: equal → unchanged; behind → cut at the origin tip + guarded follower fast-forward (skipped with a warning when `<base>` is checked out in any worktree); ahead → cut from local; **diverged → non-zero die carrying both SHAs and the two repair directions, no branch created**; fetch failure / no origin → today's local cut plus a stderr warning. All six cases covered in `provision-worktrees.test.sh`.
  9. Standing red-gate invariant sentences (SKILL.md Invariants bullet, `held:land-failed` "MUST NOT push on a red gate", war-refiner.md Gate contract + Never-list) carry the explicit baseline carve-out — reworded in the same phase as the routing change.
  10. ADR 0019 records the target-derived doctrine **and its reversal path** (absent class ⇒ `introduced` routing is the permanent fail-safe); `CONTEXT.md` carries the four new terms; CLAUDE.md's stale `docs/adr/ (0001–0017)` range is corrected.
  11. All four release slots carry the same new version.

## Build order (for /war)

Phase 1 (foundations: config key + validation hardening, provision base derivation, floor union + fixtures, packaging audit note — 4 parallel file-disjoint tasks) → Phase 2 (test-floor pattern threading + Provision-prompt prose, both surfaces; Setup/war-room detection prose — 2 parallel tasks) → Phase 3 (gate-failure classification + routing, both surfaces; Lead docs incl. invariant rewording; ADR/CONTEXT/CLAUDE.md — 3 parallel tasks) → Phase 4 (release).

Phases 2 and 3 both own `workflow-template.js`, `workflow-template.test.mjs`, `agents/war-refiner.md`, and `skills/war/references/schemas.md`; they are **split across phases precisely because of that same-file collision** (code-boundary rule 1 — never dodged with `deps`/waves), each phase leaving the tree green: Phase 2 = threading + args (no behavior change when null), Phase 3 = schema field + emitter + routing **in one task** (no defined-but-not-emitted gap). Phase 1 must land first: Phase 2's prompts describe the `ensure-integration` semantics and `--pattern` union Phase 1 ships.

## Phase 1 — Target-derived foundations

### Task 1: `overrides.testPattern` config key + overrides validation hardening (#574)
- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`
- Plan slice: add `testPattern: null` to `DEFAULTS.overrides` (string of space-separated glob tokens | `null`; `null` = today's hardcoded gate-mirror floor defaults, byte-identical) with a doc comment stating the floor ⊆ gate pairing rule (pinned at Setup together with the gate, ADR 0006). Harden the overrides loop, both mirroring the `memory.*` precedent: (a) **glob-safe charset check** on a string `testPattern` — the value is embedded single-quoted into an agent-executed shell line, so reject any character outside `[A-Za-z0-9_.*?/[] -]` (notably `'`, `;`, backticks, `$`, newline) with an error naming the key; (b) **unknown `overrides.*` key → courtesy error** (catches `testPatern`-style typos that would silently run the bare floor). `resolveGate` **unchanged** — the pattern rides config, not the gate string. Tests: defaults to `null`; a glob string validates; non-string/non-null errors naming the key; a quote-bearing string rejected; an unknown overrides key rejected.
- requiresTest: true
- requiresPackaging: true
- deps: []
- target repo: superproject

### Task 2: `cmd_ensure_integration` fetch + divergence assertion (#578)
- Files: `skills/war/assets/provision-worktrees.sh`, `skills/war/assets/provision-worktrees.test.sh`
- Plan slice: in `cmd_ensure_integration`, on the **create path only** (the owned-branch resume/reuse path untouched — never re-cut), before cutting: `git fetch origin "$base"` with stderr captured per the `_tmp_err` idiom (not the `cmd_ensure_origin` swallow anti-pattern). Then:
  - fetch fails or no `origin` remote → stderr warning, proceed with today's local-base cut (offline fallback = current behavior);
  - local == origin → proceed unchanged; local strictly behind → cut from the **origin tip**, then fast-forward the local follower via guarded `git update-ref refs/heads/<base> <origin-sha> <local-sha>` — **skipped with a warning when `<base>` is checked out in any worktree** (`git worktree list` scan; the cut still uses the origin tip, correctness preserved; moving a checked-out ref phantom-dirties that checkout); local strictly ahead → proceed from local; **neither an ancestor → `die` non-zero, no branch created**, message carrying both SHAs **and the two ADR-0008-consistent repair directions** (inspect `git log` both ways; either reconcile local onto origin and relaunch, or push local if origin is the stale side — the operator adjudicates, the script never picks).
  - Tests (spec validation 4 + grill Q14/Q24; local fixture remote, bash-3.2-safe, cwd-independent): (a) behind → cut at origin tip + follower fast-forwarded; (b) equal → unchanged; (c) ahead → cut from local; (d) diverged → non-zero, both SHAs in the message, no branch created; (e) fetch failure via an origin URL pointing at a nonexistent path → local cut + stderr warning, **title noting the no-origin arm is fixture-only in a real run** (Setup's `ensure-origin` requires a pushable origin); (f) behind **with `<base>` checked out in a worktree** → cut at origin tip, ff skipped, warning emitted, checkout not dirtied.
- requiresTest: true
- requiresPackaging: true
- deps: []
- target repo: superproject

### Task 3: test-floor custom-pattern union + regression fixtures (#574)
- Files: `skills/war/assets/assert-test-in-diff.sh`, `skills/war/assets/assert-test-in-diff.test.sh`
- Plan slice: **behavior change (grill Q1)** — `resolveGate` unconditionally appends the `*.test.sh` discovery loop to *any* declared gate, so the floor must never go blind to that class: extract the default matcher's pattern-2 arm (`*.test.sh` with the `node_modules`/`.git`/`.claude` exclusions) into a helper and **union it into the custom-pattern branch** (custom tokens OR `*.test.sh`); default path byte-identical. Header note: `--pattern` is now load-bearing (threaded per-run from `overrides.testPattern`), and the union preserves floor ⊆ gate for the gate's unconditional discovery. Fixtures: (i) diff adding only `src/foo.test.ts` → exit 1 bare, exit 0 with `--pattern '*.test.ts'` (single-star — bash `case` `*` crosses `/`, covering root **and** nested); (ii) root-level `foo.test.ts` with `--pattern '**/*.test.ts'` → exit 1 (documents the `**/`-token literal-slash trap the spec's example glob hits — Setup proposes single-star tokens); (iii) diff adding only `hooks/x.test.sh` with `--pattern '*.test.ts'` → exit 0 (the union — delete-the-union check).
- requiresTest: true
- requiresPackaging: true
- deps: []
- target repo: superproject

### Task 4: packaging-floor audit note (decision C, #574 item 4)
- Files: `skills/war/assets/assert-packaging-in-diff.sh`
- Plan slice: header note recording the audit — **no override added**: discovery keys on Dockerfile *naming* (`Dockerfile` / `Dockerfile.*` / `*.Dockerfile`), target-agnostic; COPY analysis path-derived from the target's own Dockerfiles. Comment-only.
- requiresTest: false — comment-only edit, no executable surface.
- requiresPackaging: true
- deps: []
- target repo: superproject

## Phase 2 — Test-floor pattern threading (#574)

### Task 1: thread `testPattern` into dispatched prompts + refiner standing surface (both surfaces, same commit)
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-refiner.md`, `skills/war/references/schemas.md`
- Plan slice:
  - Args: the Workflow reads `plan.testPattern` (string | null; absent ⇒ `null` — the `plan.gate` precedent; documented in the args header comment and beside `overrides.gate`'s declared-base note in `schemas.md`).
  - **Both** `assert-test-in-diff.sh` invocation sites — initial merge-task prompt and floor-retry re-merge prompt — append ` --pattern '<value>'` when set; **bare when null, byte-identical to today** (assert the exact rendered string; the union with `*.test.sh` is script-side from Phase 1, not re-stated per-prompt).
  - Provision prompt (step 2): describe the Phase-1 base derivation — reuse if ours; else fetch + equal/behind/ahead resolution; a **divergence die is a halt** (non-zero, both SHAs + repair directions): report it in the MergeResult, never pick a side, never retry with a different base. The phase never starts — the Lead surfaces the die message like today's foreign-branch exit 3.
  - `agents/war-refiner.md` step 4 gains the mirrored clause (exact standing-surface wording, since it cannot know the runtime value): *"If the dispatched prompt supplies a `--pattern '<glob-set>'` argument (the run's pinned `overrides.testPattern`), append it to the invocation verbatim; otherwise invoke bare."*
  - Tests (validation 2 + the `--pattern` half of validation 6): set ⇒ both prompt strings contain the exact `--pattern '<value>'`; unset ⇒ byte-identical bare; drift guard **token-anchored** on `--pattern` and `overrides.testPattern` in `agents/war-refiner.md` (never full-line bytes — `shared-string-constant-quote-literal-byte-anchor-fragility`; sentence-case-tolerant — `prompt-only-clause-grep-guard-must-tolerate-sentence-case`; the standing surface names no concrete value by design).
- requiresTest: true
- requiresPackaging: true
- deps: []
- target repo: superproject

### Task 2: Setup + war-room prose for `testPattern`
- Files: `skills/war/SKILL.md`, `skills/war-room/SKILL.md`
- Plan slice: Setup step 3 gains the testPattern proposal with **named detection inputs** (grill Q6): read the target's test-runner config — `package.json` (`scripts.test`, test-framework devDependencies), `vitest.config.*`/`jest.config.*`, `pyproject.toml` `[tool.pytest]` — **and a Glob sample of existing test files** (the convention actually on disk); propose **single-star tokens** (e.g. `'*.test.ts *.test.tsx'` — a `**/`-prefixed token misses root-level files under the floor's `case`-glob matcher). Operator confirms **together with the gate** (floor ⊆ gate, one Setup decision); unknown convention → `null`. **`--afk` sanity floor (grill Q3):** take the proposal only if each token matches ≥ 1 existing repo file; otherwise fall back to `null` with a ledger note — and the residual (an over-wide pattern admitting a gate-ignored test) is caught downstream by the gate-audit execution-evidence pass (mapped test provably unrun at the confirmed tip is HARD). State the non-goal: never parsed from the gate command. "Per phase" dispatch text: the Lead threads `testPattern` into the Workflow args like `plan.gate`. `skills/war-room/SKILL.md` overrides line gains `testPattern` (null = today's floor defaults; a string pins the target's glob set; glob-safe charset enforced by the validator).
- requiresTest: false — Lead-side prose, no executable surface.
- requiresPackaging: true
- deps: []
- target repo: superproject

## Phase 3 — Gate-failure classification + docker probe (#576, #577)

### Task 1: `gate_failure_class` — schema, classification procedure, class routing (both surfaces, same commit)
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-refiner.md`, `skills/war/references/schemas.md`
- Plan slice:
  - **Schema + emitter + consumer in this one task** (no defined-but-not-emitted gap): `MERGE_RESULT` gains optional `gate_failure_class: { enum: ['introduced','baseline','environment'] }`; `schemas.md` documents it (populated when `status: "gate_failed"`; absent ⇒ `'introduced'`, fail-safe). Status enum untouched.
  - **Classification procedure** — mirrored into the initial merge-task prompt, the floor-retry re-merge prompt, **the land prompt**, and `agents/war-refiner.md` (this rewrite also fixes step 3's stale "routes a FIX_NEEDED" sentence — merge-time `gate_failed` is a soft escalation, not an audit-stage fix loop): on gate failure, re-run the **failing** gate at the **classification base** — merge-task: the phase integration base (the cut point of `integration/<slug>/phase-N`); land-phase: the detached `origin/<working>` tip the merge lands onto (a stacked working branch carries prior plans' content the integration base lacks) — detached in `_refinery`, **re-attaching `_refinery` to the integration branch before returning**. Classify: (1) base red with the **same failing identifiers** → `'baseline'`; (2) base green **and the failure does not reproduce on a second run at the task tip in a fresh environment** (fresh TMPDIR/shell) → `'environment'` — reproducibility, not file-disjointness, is the trigger (a diff-disjoint failing test with a reproducing failure is the classic introduced regression and stays `'introduced'`); (3) otherwise → `'introduced'`. Judgment, not parsing; base-run evidence rides `gate_output` uncurated.
  - **Hygiene guards:** every merge/land prompt's `_refinery` step begins with an idempotent re-attach (`git -C <_refinery> checkout <integrationBranch>`) so a dispatch that died mid-classification cannot strand the queue detached. The polish-sweep merge prompt stays **class-exempt by design** (fail-open discard suffices) — stated in a code comment so it never reads as a coverage gap.
  - **Routing** at both `gate_failed` sites: absent/`'introduced'` → **byte-identical today's** soft `escalated.push` (merge-task) / `held:land-failed` (land). `'environment'` → soft escalate reusing reason `'env-blocked'` (0 fix rounds, worktree kept, siblings proceed; `detail` = the MergeResult — no new reason string, no enum change). `'baseline'` → record the debt in an in-run `baselineDebt` list keyed on (failing-identifier set, base SHA); dispatch **one** baseline-proceed re-merge/re-land (a new dispatched prompt naming the classified identifiers: proceed over exactly those failures, still run and report the gate); route the resulting `merged`/`landed` normally; a second `gate_failed` after a baseline-proceed routes by its returned class with `'baseline'` treated as `'introduced'` (bounded).
  - **Debt reuse + dedupe (grill Q7/Q12):** `baselineDebt` is threaded into every subsequent merge/land prompt — a failure whose failing identifiers are covered by a recorded entry classifies `'baseline'` directly, **no repeated base re-run** (whole-repo-red targets pay one re-run per unique debt per phase, not 2N). Exactly **one** backstop entry per unique key: `{ check: "baseline gate debt: <identifiers> — pre-existing at <base sha>", why, runner: "target repo CI / operator", source: 'auto' }`, appended to the handoff backstops (`null` promotes to a one-entry array); the pass-through contract comment in `workflow-template.js` and its `schemas.md` text are updated in this commit (Workflow-appended `source:'auto'` baseline entries are the sole exception; Lead-normalized entries stay untouched).
  - **Gate-audit interaction (grill Q13):** a baseline-merged task's `mergedTasksForGateAudit` entry carries its debt; the inline gate-audit prompt gains one conditional line — failures matching the classified identifiers are pre-existing base debt, not evidence a mapped test didn't run — so red baseline output cannot fake a provably-unrun HARD hold (empty debt ⇒ byte-identical prompt).
  - **`agents/war-refiner.md`:** classification procedure + per-site base + reproducibility predicate + debt reuse; Gate contract ("Any non-zero exit ⇒ `gate_failed`") and the Never-list "Skip the gate" gain the narrow baseline carve-out — proceed only over the *same* classified baseline failures, only when the dispatched prompt instructs it, debt always recorded.
  - **Tests (validation 5 + 6):** three enum values in both schema surfaces; `gate_failed`+`'environment'` → escalation, **no fix-worker prompt built**; `gate_failed`+`'baseline'` → baseline-proceed re-dispatch issued, merge proceeds, exactly one deduped `source:'auto'` entry in `handoff.backstops[]` (two tasks, same identifiers ⇒ one entry, one base re-run instruction); absent class → today's routing; each assertion fails if the classification branch is deleted. Drift guard extended: `agents/war-refiner.md` names the three class values, the base re-run step, and the reproducibility predicate wherever the dispatched prompts do (token-anchored, case-tolerant). Gate-audit prompt test: with debt threaded, the line is present; without, byte-identical.
- requiresTest: true
- requiresPackaging: true
- deps: []
- target repo: superproject

### Task 2: Lead docs — docker probe, class routing, invariant rewording, manual-land hygiene
- Files: `skills/war/SKILL.md`
- Plan slice: Setup step 3 docker bullet: after `docker info`, **probe-build each discovered Dockerfile once** — each probe run via the Lead's Bash tool with an explicit `timeout` (e.g. 300000 ms; a tool-timeout counts as a non-platform probe failure → defer; macOS ships no `timeout(1)`, the tool bound is the mechanism); **interactive runs confirm probing inside the existing docker-gate ask** (the probe result then informs include/trim/defer); `--afk` probes automatically — the same autonomy trust as running the gate and provision steps. Platform-signature failures (`EBADPLATFORM`, `no matching manifest for <platform>`, `exec format error`) → auto-defer **that image** to a `source:'auto'` backstop (runner: target repo CI); other failures → interactive include/trim/defer, `--afk` auto-defer with the failure recorded; unmatched variants deliberately fall through to `'introduced'` (fail-safe — today's behavior, never a new false-pass; no structure test on the signature list, the fallthrough is the guard). **Supersede** the residual sentence (post-provision docker environment failures now classify `'environment'` — SKILL.md is its only surface, verified). Checkpoint/outcome-handling: `gate_failed` routes by class — `environment` = env-blocked doctrine at gate time (bullet notes a gate-time entry carries the MergeResult, not the provision `ENV_OUTCOME` fields); `baseline` = proceeds with the deduped auto backstop rendered at every land + final PR (interactive confirm at the phase report; `--afk` proceeds); `introduced` = unchanged. **Invariant rewordings (same phase as the routing):** the Invariants bullet "Never merge a task … without a passing gate" and the `held:land-failed` "MUST NOT push on a red gate" line each gain the explicit carve-out — a `gate_failure_class:'baseline'` red (proven pre-existing at the classification base, debt recorded as a backstop) proceeds; an `introduced` red never does. Backstop-extraction step 4 notes the Workflow-appended baseline exception to the pass-through. Manual-land hygiene note: pre-phase sync remains good practice, but correctness no longer depends on it (Phase 1's `ensure-integration` derivation).
- requiresTest: false — Lead-side prose, no executable surface.
- requiresPackaging: true
- deps: []
- target repo: superproject

### Task 3: ADR 0019 + CONTEXT.md terms + CLAUDE.md ADR range (#579)
- Files: `docs/adr/0019-target-derived-execution-values.md`, `CONTEXT.md`, `CLAUDE.md`
- Plan slice: ADR 0019 "Execution values are target-derived with current behavior as the fallback" — the four instances, the class-routes-not-status doctrine, extends ADR 0006 + 0008, does not touch ADR 0005's enums, notes the container-packaging spec §8 residual is superseded for the environment class (no retro-edit), and **names the reversal path**: absent class ⇒ `'introduced'` routing is the permanent fail-safe — reverting baseline-proceed = removing the classification prose; recorded backstop entries remain as the debt ledger. `CONTEXT.md` gains the four spec-§6 terms (test-floor pattern → Test discipline; gate-failure class + baseline gate debt → Phase outcomes; provision base divergence → Worktree provisioning). Fix CLAUDE.md's stale `docs/adr/ (0001–0017)` → `(0001–0019)`. Anchor by named construct, never line number.
- requiresTest: false — docs only; propose a solo `{ lens: 'correctness', depth: 'neighbors' }` roster at decompose (D4).
- requiresPackaging: true
- deps: []
- target repo: superproject

## Phase 4 — Release

### Task 1: version bump — all four slots
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump `plugin.json` `version`, `marketplace.json` `metadata.version` **and** `plugins[0].version`, README `## Status` (replace-in-place, no badge) — all four, one version, **resolved from the slots at land time** (0.14.9 at authoring; literal non-authoritative). Blurb: target-repo-agnostic execution — per-run test-floor pattern with `*.test.sh` union, Setup docker probe-build with per-image platform auto-defer, gate-failure classification routing recovery, origin-derived provision bases with fail-loud divergence.
- requiresTest: false — version-slot edit.
- requiresPackaging: true
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Live external-repo campaign, arm64 host + x64-pinned Dockerfile: Setup defers the image; **no task returns a docker `gate_failed`** · why deferred: needs a real mismatched-arch host + external target · runner: the next `/war-campaign` against an external target repo.
- Live external repo with pre-existing typecheck/lint debt: phases land with `baseline` labels and rendered deduped backstop entries, **no manual out-of-band land** · why deferred: needs a genuinely red-at-base target · runner: same campaign.
- Operator manual land between phases: next phase's provision cuts from the **origin tip**; no worker starts without prior-phase code · why deferred: needs a live multi-phase run with an out-of-band land · runner: same campaign.
- `--afk` probe-build timeout path (Bash-tool timeout → defer; Setup never wedges) · why deferred: timing-dependent · runner: same campaign / operator observation.
- **Baseline-classification correctness**: a wrong `'baseline'` on a genuinely-introduced failure merges broken code and is **not** reliably self-healed in-run (the debt-reuse cache repeats the classification); the recorded entry names the target repo's CI as runner — a red final-PR CI plus the rendered baseline entries is the recovery surface · why deferred: refiner judgment is untestable by unit fixture (spec §8) · runner: target repo CI at PR time + operator review of rendered entries.

## Notes / conscious deviations

- **Baseline-proceed is ALWAYS-ON (operator-ratified, grill Q27):** per spec G — interactive phase-report confirm; `--afk` proceeds with label + backstop; no config knob (a second lever that rots, the reason spec H rejected the allowlist); reversal path = the permanent absent-class ⇒ `'introduced'` fail-safe, named in ADR 0019.
- **Floor union (Q1):** `--pattern` no longer replaces the defaults wholesale — the gate's unconditional `*.test.sh` discovery arm is unioned into any custom set, script-side (root-cause fix; every caller inherits it). Custom tokens remain operator-pinned ⊆ the declared gate.
- **Single-star convention (Q2):** spec Decision A's `'**/*.test.ts'` example misses root-level files under bash `case` globbing; Setup proposes single-star tokens and the fixtures document the `**/` trap. Spec validation 3 is implemented with `src/foo.test.ts` + `'*.test.ts'`.
- **`--afk` pattern sanity floor (Q3):** each proposed token must match ≥ 1 existing repo file, else `null` + ledger note; the over-wide residual is caught by the gate-audit execution-evidence HARD path (mapped test provably unrun).
- **Invariant rewording (Q4):** the four standing red-gate sentences gain the baseline carve-out in Phase 3 (war-refiner.md in Task 1's commit per both-surfaces; SKILL.md in Task 2, same phase).
- **Spec G's premise corrected (Q5):** merge-time `gate_failed` is a soft escalation today (no fix-worker loop at that site); `'introduced'`/absent keeps that byte-identical; war-refiner.md's stale step-3 "routes a FIX_NEEDED" sentence is fixed by Phase 3 Task 1's rewrite.
- **Detection inputs named (Q6):** runner configs + on-disk test-file Glob sample; proposal reproducible, `--afk` probed.
- **Debt-reuse cache (Q7) + dedupe (Q12):** in-run `baselineDebt` keyed on (identifiers, base SHA) — one base re-run and one backstop entry per unique debt per phase; threaded into subsequent merge/land prompts; refiner judgment re-enters for any uncovered failure. Cross-phase duplicates collapse at the Lead's Finish rendering by identical `check` strings.
- **Probe mechanics (Q8):** timeout = the Lead's Bash-tool `timeout` parameter (no `timeout(1)` on macOS); signature list stays SKILL.md prose — unmatched variants fall through to `'introduced'` (fail-safe), so no structure test; interactive probe consent folds into the existing docker-gate ask; `--afk` probing carries the same trust as gate/provision autonomy.
- **Environment predicate = reproducibility (Q9):** deviation from spec F's file-disjointness wording — base-green + diff-disjoint + *reproducing* is the classic introduced regression and must stay `'introduced'`; spec §8 already frames the predicate as judgment. Cost: one extra failing-segment re-run, only on the base-green suspect path.
- **`_refinery` hygiene (Q10):** classification detaches and re-attaches in the same dispatch; every merge/land prompt starts with an idempotent re-attach, healing a died-mid-classification dispatch. No throwaway worktree (it would lack installed deps; `_refinery` is already gate-capable).
- **Land classification base = detached `origin/<working>` tip (Q11):** the integration base would misclassify stacked-campaign working-side debt as `'introduced'` — the exact manual-land spiral #576/#577 compound into.
- **Gate-audit debt line (Q13):** the inline execution-evidence prompt (which `auditPrompt()` clauses never reach — recorded lesson) gains a conditional baseline-debt line; empty debt ⇒ byte-identical.
- **Checked-out follower (Q14):** behind + checked-out skips the ff with a warning; the cut still uses the origin tip; test case (f) covers it.
- **Divergence die actionability (Q15):** message carries both SHAs + both repair directions; a provision-time die halts the phase before any worker spawns (today's exit-3 surfacing).
- **E↔G shape (Q16):** refiner always returns `gate_failed`+class unmerged; the Workflow dispatches one baseline-proceed re-merge/re-land (a new dispatched prompt, documented in war-refiner.md). Validation 5 asserts exactly this sequence.
- **Backstops pass-through exception (Q17):** Workflow-appended `source:'auto'` baseline entries are the sole exception; contract text updated in `workflow-template.js`, `schemas.md` (Phase 3 Task 1) and SKILL.md step 4 (Phase 3 Task 2), same phase.
- **`'environment'` reason (Q18):** reuses soft `'env-blocked'`; `detail` = MergeResult; SKILL.md notes the distinct rendering. No enum change anywhere; `land-decision.mjs` untouched.
- **Land prompt is a mirrored surface; polish sweep is class-exempt by design (Q19):** fail-open discard suffices for the sweep; stated in a code comment.
- **Step-4 clause + drift-guard tokens (Q20):** standing clause names no runtime value; guard anchors on `--pattern` / `overrides.testPattern` / class-value tokens, case-tolerant.
- **Old plugin + new config (Q26):** silently drops `testPattern` — unfixable from this side (old code validates); accepted residual. The new unknown-key courtesy error protects the reverse (typos) going forward.
- **CLAUDE.md ADR range (Q28b)** fixed in Phase 3 Task 3; the docker residual sentence exists only in `skills/war/SKILL.md` (grepped — the container-packaging spec's copy is a decision record, not retro-edited).
- Version literal non-authoritative; resolve the next free patch from the four slots at land time.

## Open decisions

None — the sole survivor (baseline-proceed gating) was operator-ratified as always-on per the spec; see Notes.
