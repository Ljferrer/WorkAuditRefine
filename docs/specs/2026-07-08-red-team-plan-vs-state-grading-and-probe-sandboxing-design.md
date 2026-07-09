# Red-team grades plans as future-work and sandboxes executed probes as a guarded invariant

Addresses (memory lessons): redteam-claims-vs-reality-misfires-on-impl-plans, redteam-executed-probe-cwd-reset-hits-real-remote, pass-probe-demotion-gate-layer-without-probe-contract, redteam-adjudication-is-authoritative-version-source

> Design spec (ratified decision record). Carries no dispatch structure — `/war-strategy` converts it to a plan, `/red-team` validates that plan, `/war` executes. Current version at authoring: 0.14.14.

## 1. Context — the gap / problem

`/red-team` exists to prove a plan *can be applied*, not that it already was. Four recorded frictions show the spine and its gate drifting away from that purpose:

- **`redteam-claims-vs-reality-misfires-on-impl-plans`** (high). The spine's `claims-vs-reality` and `executable-proof` probes read a plan's future-tense tasks ("Task N adds `foo`") as present-tense factual claims that `foo` already exists, then file its absence as Critical/Major. One `/red-team` of a sound implementation plan produced **16 false "X absent from codebase" findings** and a mechanical `BLOCKED`; a second instance (variable-audit-roster/T1) re-flagged an already-planned fix as a `needsDecision` hole. The `preconditionRule` preamble in `workflow-scaffold.js` (#311) partially addresses this for *analyzed* probes, but (a) it carries no signal of what *kind* of artifact is under test, (b) `executable-proof` and every other *executed* probe never see it, and (c) the gate still lets an absence-shaped Critical/Major force `BLOCKED`. Nothing in the scaffold tells a probe "this artifact describes work yet to be done."

- **`redteam-executed-probe-cwd-reset-hits-real-remote`** (high). Executed probes enforce their SCOPE-LOCK ("work only in a throwaway copy, never mutate `repo`") by the `scopeLock()` prompt preamble **only** — there is no sandbox. A probe that relied on cwd persistence (`cd` into the copy once, a bare `git push` later) escaped, because the Bash tool resets cwd between calls; the bare push ran from the reset cwd (the real checkout) and **pushed + deleted a junk ref on `github.com:Ljferrer/WorkAuditRefine`** and littered the working tree. `lenses.md` already notes a "deterministic execution harness for executed probes" as *deferred* — this is the escape that deferral leaves open.

- **`pass-probe-demotion-gate-layer-without-probe-contract`** (medium). The gate's demotion rule (`classify()` in `red-team-gate.mjs`: only `probeStatus === 'pass'` demotes a Critical/Major to non-blocking) and the probe-side contract ("a clean probe returns `status:"pass"` with `findings:[]`") are a **cross-file invariant enforced only by prose** — the two-contract summary in `lenses.md` and the CONTRACTS comment in `workflow-scaffold.js`. Widen the demoting status set on one side without the other and the gate silently becomes a demotion path that downgrades a real Critical/Major.

- **`redteam-adjudication-is-authoritative-version-source`** (low). In the stacked-release pipeline the authoritative version lives in a three-level chain — **task instruction > red-team adjudication > plan body literal** — but nothing forces a WAR auditor to consult `docs/red-team/<plan-slug>.md` before scoring a version mismatch. A worker faithfully applying an adjudicated bump gets mis-scored as a defect against the stale plan literal.

Common thread: prose-and-preamble discipline that a probe's ambient context, a cwd reset, or an out-of-band edit can defeat. This spec converts each into a **mechanically enforced invariant** wherever the friction says "not code-enforced."

## 2. Pivotal constraints

1. **The Workflow sandbox has no filesystem access.** All file-derived facts (fingerprint, artifact-kind, provision, adjudications) are computed by the Lead in Bash pre-flight and threaded in via `args`; the scaffold fails loud if a required one is missing (existing `fingerprint.titleLine` precedent).
2. **The gate stays pure.** `red-team-gate.mjs` classifies structured findings; it must not do NLP on `reality` strings. New gate behavior keys on a **typed field the probe sets**, not on parsing prose.
3. **Prevention is never trusted alone (Layer-2/3 doctrine).** The scope-lock preamble is a prevention layer; the anchor-attestation gate is the detection authority. The sandbox fix must add a *detection* backstop, not another preamble the probe can ignore.
4. **Back-compat.** Absent `artifactKind`/`adjudications`/empty `provision` must reproduce today's behavior byte-for-byte (the `provision:[]` precedent).
5. **`/red-team` ratifies; auditors are downstream.** Adjudicated values flow *out* of the red-team report into the WAR run; the report is the single source, threaded, never re-derived by the auditor.
6. **Both-surfaces rule.** Any dispatched-prompt clause added to `auditPrompt()` must be mirrored VERBATIM into `agents/war-auditor.md` in the same commit (existing latitude/disposition mirror-test discipline).
7. **Lazy enforcement ceiling.** A full sandbox jail (agent-type confinement hook for red-team probes) is out of scope; a deterministic post-run escape guard closes the trust gap at a fraction of the cost.

## 3. Resolved design tree (decision → resolution)

| # | Decision | Resolution |
|---|----------|------------|
| D1 | How does a probe know a plan describes future work? | Lead computes an `artifactKind` (`impl-plan` \| `tdd-plan` \| `design-doc` \| `prd`) in pre-flight from the plan's shape (per-task `Files:`/`Build order` ⇒ impl/tdd; a `-design` spec / PRD ⇒ design-doc/prd) and threads it in `args`. Threaded into every probe prompt. |
| D2 | Fix the analyzed-only `preconditionRule` gap. | Generalize the precondition discipline into an **artifact-kind-aware** rule and prepend it to **executed** probes too (not just analyzed). For an `impl-plan`/`tdd-plan`, a claimed-but-unbuilt symbol/test/file is the **expected deliverable baseline**, never a finding. A `tdd-plan`'s shipped test *should* be red pre-implementation — a red run is a pass, not a defect. |
| D3 | Stop the gate `BLOCKED`-on-absence-counts misfire mechanically. | Add an optional typed `deliverableAbsence: true` to the FINDINGS finding shape. A probe sets it when the "absent" symbol is cross-referenced to a plan task (the `coverage-vs-source` mapping — the plan promises to build it). `classify()`/`verdict()` **never** count a `deliverableAbsence` finding as a blocker, on any artifact-kind. Prose rule becomes a typed, gate-enforced field. |
| D4 | Real sandbox for executed probes vs prompt-only SCOPE-LOCK. | Ratify the deferred harness as a **post-run sandbox-escape guard** (new `assert-no-repo-escape.sh`) the Lead runs against `repo` *before trusting any verdict*: stray working-tree files (`git -C <repo> status --porcelain`) or junk local/remote sandbox refs (`git -C <repo> for-each-ref` + `git -C <repo> ls-remote --heads origin`) → nonzero → verdict **quarantined** (routed through the self-confound gate, never `CLEARED`). |
| D5 | Harden the escape vector the cwd reset opened. | The executed-probe scope-lock additionally **requires every git invocation to be `git -C <abs-sandbox>`** and forbids the `cd`-once-then-bare-git idiom, naming the cwd-reset failure mode explicitly. Prevention layer; D4 is the detection authority. |
| D6 | Full agent-type sandbox jail for probes? | **No** (non-goal). The post-run guard (D4) closes the trust gap; a confinement hook keyed on a new red-team-probe agent_type is disproportionate. Recorded as deferred in §9. |
| D7 | The pass-demote / probe-contract cross-file invariant. | Add a **drift-guard pinning test**: (1) the only status literal that demotes a Critical/Major in `classify()` is `'pass'` (warn/fail/absent Critical must land in `blockers`; a `pass` Critical must not); (2) the two-contract sentence is present on **both** surfaces (`workflow-scaffold.js` CONTRACTS comment and `lenses.md` two-contract summary). Either drift → red. |
| D8 | Make the adjudicated version authoritative for auditors. | The red-team report gains a machine-readable **`## Adjudications`** block (version rows: adjudicated literal + the plan literal it supersedes). The WAR Lead reads it and threads it into `auditPrompt()` via a new `adjudicationClause` (precedent: `intentClause`), mirrored into `agents/war-auditor.md`. Version-mismatch scoring keys on **task instruction > red-team adjudication > plan body literal**. |
| D9 | Where does version-precedence live — code or prompt? | Prompt-threaded clause + both-surfaces mirror test (D8). No gate/code change: the adjudication is a value the auditor must consult, not a mechanical filter; the enforcement is the mirror test asserting the clause exists on both surfaces. |

## 4. Mechanics (per component / role)

### Red Team Lead pre-flight — `skills/red-team/SKILL.md` Step 2
Alongside the existing fingerprint computation, classify the plan into an `artifactKind` and pass it in `args`. Heuristic (documented, not clever): a file under `docs/plans/` with per-task `Files:`/`Plan slice:` or a `## Build order` ⇒ `impl-plan` (or `tdd-plan` when tasks are `requiresTest` red-first); a `docs/specs/*-design.md` ⇒ `design-doc`; an external PRD ⇒ `prd`. When it cannot be determined, default to `impl-plan` (the conservative choice — it *suppresses* absence findings; a design-doc has no runnable artifacts so the distinction is moot there).

### Scaffold — `skills/red-team/assets/workflow-scaffold.js`
- **`artifactKind` arg** joins `{ planFile, repo, sourceSpec, probes, fingerprint, provision }`; default `impl-plan` for back-compat with the suppression bias.
- **`preconditionRule` → `futureWorkRule` (D2).** Generalize the existing analyzed-only preamble into an artifact-kind-aware rule and prepend it to **all** probes (guard the analyzed-vs-executed wording at the composition site in `runProbe`). Preserve the non-blunting retained-findings carve-out asserted by `workflow-scaffold.test.mjs` (the "false claim about EXISTING code" clause) — a missing anchor / wrong signature / drifted line / contradiction is still a real finding. Add the executed-probe clause: for a `tdd-plan`, a shipped test failing red before implementation is the expected baseline (`status:"pass"`), not a defect.
- **FINDINGS schema (D3).** Add optional `deliverableAbsence: { type: 'boolean' }`. The prompt instructs: set it `true` when a symbol you would otherwise report as "absent" is mapped by `coverage-vs-source` to a plan task (the plan promises to build it).
- **Scope-lock hardening (D5).** In `scopeLock('executed')`, replace the loose "`cd` into that copy" instruction with an explicit directive: *the Bash tool resets cwd between calls; use `git -C <abs-sandbox>` for every git call and absolute paths throughout — never rely on a prior `cd`, never run a bare `git push`.* Reference lesson `redteam-executed-probe-cwd-reset-hits-real-remote` in the comment.

### Gate — `skills/red-team/assets/red-team-gate.mjs`
- `classify()`: a finding with `deliverableAbsence === true` is excluded from `blockers` regardless of severity or probe status (it may still surface as a `minor`/note). `verdict()` therefore no longer returns `BLOCKED` purely on deliverable-absence counts. The demotion keys on the typed flag — no `reality`-string parsing (constraint 2).
- The existing pass-demote rule (`probeStatus !== 'pass'`) is unchanged; D7's test pins it.

### Post-run sandbox-escape guard — new `skills/red-team/assets/assert-no-repo-escape.sh` (D4)
Bash-3.2-safe, cwd-independent, exit 0/1/2 like the merge-path floors (1 = escape detected, 2 = git error — never collapse into 1). Given `--repo <abs>` it checks: (a) `git -C <repo> status --porcelain` is empty; (b) no local ref and no `ls-remote --heads origin` ref matches the throwaway-sandbox junk pattern (e.g. `refs/heads/redteam-*`, `*-sandbox-*`). The Lead runs it in SKILL.md between the Workflow return and the gate; nonzero routes the verdict through the **self-confound gate** (SKILL.md §Diagnosis pre-flight) — the escape may have polluted the very state a probe read, so no verdict is trusted until it is clean. This is the in-repo precedent the self-confound gate already names.

### WAR auditor path — `skills/war/assets/workflow-template.js` + `agents/war-auditor.md` (D8)
- The WAR Lead reads the `## Adjudications` block from `docs/red-team/<plan-slug>.md` and threads the rows into the audit payload.
- `auditPrompt(task, lens, depth, peers, workerTests)` gains an `adjudicationClause` appended alongside `intentClause`: *"VERSION-PRECEDENCE RULE: the authoritative version is task instruction > red-team adjudication > plan body literal. Before scoring a version/release-slot mismatch as a defect, consult the adjudicated rows below; a value matching the adjudication is correct even when it differs from the plan body literal."* Threaded rows follow.
- The identical sentence is mirrored VERBATIM into `agents/war-auditor.md` (standing surface). No behavior change when no adjudications are threaded (empty clause).

### Report — `skills/red-team/references/lenses.md`
The report template gains a `## Adjudications` section (machine-readable rows). The grill loop (SKILL.md Step 5) records any authoritative-value change (esp. version) there when it patches the plan. The "(Optional, deferred) deterministic execution harness" bullet is rewritten to point at the ratified post-run guard.

## 5. Surface changes (files touched)

- `skills/red-team/assets/workflow-scaffold.js` — `artifactKind` arg; analyzed-only `preconditionRule` → artifact-kind-aware `futureWorkRule` on all probes; `deliverableAbsence` in FINDINGS; executed scope-lock `git -C` hardening.
- `skills/red-team/assets/workflow-scaffold.test.mjs` — assert `artifactKind` reaches probe prompts; executed probes carry the future-work clause; scope-lock emits the `git -C`/no-bare-push directive; retained-findings carve-out still present.
- `skills/red-team/assets/red-team-gate.mjs` — `classify()`/`verdict()` exclude `deliverableAbsence` from blockers.
- `skills/red-team/assets/red-team-gate.test.mjs` — deliverable-absence never blocks (regression for the 16-false-findings case); **drift-guard pin** (D7): demote-set is exactly `{'pass'}` + two-contract sentence present on both scaffold and lenses.md.
- `skills/red-team/assets/assert-no-repo-escape.sh` — **new** post-run sandbox-escape guard.
- `skills/red-team/assets/assert-no-repo-escape.test.sh` — **new** shell test (clean → 0, stray file → 1, stray ref → 1, non-repo → 2).
- `skills/red-team/SKILL.md` — pre-flight computes `artifactKind`; run the escape guard before the gate and route nonzero through the self-confound gate; grill loop records adjudications.
- `skills/red-team/references/lenses.md` — artifact-kind + deliverable-absence docs; two-contract summary marked as pinned; report template `## Adjudications` block; rewrite the deferred-harness note.
- `skills/war/assets/workflow-template.js` — `auditPrompt()` gains `adjudicationClause`; Lead threads adjudications.
- `agents/war-auditor.md` — version-precedence clause mirrored VERBATIM.
- `CONTEXT.md` — new terms (§6).
- `docs/adr/0023-*.md`, `docs/adr/0024-*.md` — new ADRs (§7).

## 6. New domain terms (CONTEXT.md)

- **Artifact-kind** — the class of artifact `/red-team` is verifying (`impl-plan` / `tdd-plan` / `design-doc` / `prd`), computed by the Lead and threaded into every probe. Drives whether a claimed-but-absent symbol is a deliverable baseline or a precondition failure. _Avoid_: "plan type", "mode".
- **Deliverable-absence** — a symbol/test/file the plan *promises to build* whose absence from the current repo is the expected pre-execution baseline — never a red-team defect. Distinct from a **precondition-missing** anchor (a real finding). Carried as the typed `deliverableAbsence` finding flag. _Avoid_: "missing code", "gap".
- **Sandbox-escape guard** — the deterministic post-run check (`assert-no-repo-escape.sh`) that no executed probe mutated the real repo working tree or pushed a junk remote ref; a positive result quarantines the verdict through the self-confound gate. _Avoid_: "cleanup", "sandbox jail".
- **Adjudication (red-team)** — an authoritative resolved value (especially a version literal) recorded in the red-team report's `## Adjudications` block, superseding the plan body literal. Auditor version-scoring keys on it: task instruction > red-team adjudication > plan body literal. _Avoid_: "override", "the real version".

## 7. Recommended ADRs

- **ADR 0023 — Red-team grades plan-vs-state by artifact-kind.** Deliverable-absence is a non-defect for impl/tdd plans; enforced mechanically via the typed `deliverableAbsence` finding flag and a gate that never blocks on it, not by preamble prose alone. Supersedes the analyzed-only `preconditionRule` scope. (Refines, does not replace, the finding-severity model of ADR 0013.)
- **ADR 0024 — Executed red-team probes are trusted only behind a post-run sandbox-escape guard.** The SCOPE-LOCK preamble is a prevention layer, never the sole barrier; a verdict is untrusted until `assert-no-repo-escape.sh` confirms the real repo/remote is unmutated. Ratifies the previously-deferred execution harness as a detection guard rather than a jail.
- Frictions 3 (D7) and 4 (D8/D9) are **guarded-invariant additions** to existing surfaces (the gate contract and the auditor prompt under ADR 0013) — drift-guard tests and a mirrored clause, not new architectural decisions. No new ADR; note the coupling in the ADR 0013 mechanism rows.

## 8. Open risks / implementation notes

- **`artifactKind` misclassification.** A design-doc mis-tagged `impl-plan` only *suppresses* absence findings, and a design-doc has no runnable artifacts, so the failure mode is benign; the reverse (impl-plan tagged `design-doc`) would re-open the false-Critical misfire, so the default leans `impl-plan`. The heuristic reads the plan's structure, which the fingerprint already tokenizes — reuse it.
- **Escape-guard junk-ref pattern is a heuristic ceiling.** It matches the throwaway-sandbox naming the scaffold uses; a probe inventing an unrelated ref name would slip the pattern. Acceptable — the working-tree `status --porcelain` half is exact, and the common escape (bare push of the working branch) is caught by the working-branch-ref check. `ponytail:` name the ceiling; a full ref-diff snapshot is the upgrade path if a second escape slips it.
- **`deliverableAbsence` self-tagging trust.** The probe sets the flag by cross-referencing `coverage-vs-source`. A probe that wrongly tags a *genuine* precondition-missing anchor as a deliverable would hide a real defect. Mitigation: the flag is only honored for `impl-plan`/`tdd-plan` artifact-kinds, and the retained-findings carve-out (wrong signature / drifted anchor / contradiction) is not absence-shaped, so it is unaffected.
- **Both-surfaces drift** for D8 is the same class the mirror tests already guard; anchor the assertion on a stable phrase, not a byte-fragile quoted example (lesson `shared-string-constant-quote-literal-byte-anchor-fragility`).

## 9. Non-goals / deferred

- **Agent-type sandbox jail for probes** (D6) — a confinement hook keyed on a new red-team-probe `agent_type` that intercepts every Bash call. The post-run guard closes the trust gap; this is disproportionate. Deferred, not planned.
- **Ecosystem-aware provisioning.** Untouched; `structuralFallback` stays the tiny floor (existing anti-goal).
- **Mechanical version-precedence enforcement in the gate.** D9 keeps version-precedence a prompt-threaded clause + mirror test; a gate-side version comparator is out of scope (the adjudication is a value to consult, not a filter).
- **Auto-deriving adjudications** — the report `## Adjudications` block is written by the grill loop when it patches an authoritative value; no attempt to mine adjudications from arbitrary prose.

## 10. Validation criteria (concrete, testable)

1. **artifactKind threading.** `workflow-scaffold.test.mjs` asserts that when `args.artifactKind` is set, it appears in the emitted probe prompts (spine and bespoke) and defaults to `impl-plan` when absent.
2. **Future-work rule on executed probes.** The scaffold test asserts `executable-proof` (executed) carries the future-work clause, and that for `tdd-plan` the clause states a pre-implementation red test is `status:"pass"`, not a defect. The retained-findings carve-out ("false claim about EXISTING code") is still present on analyzed probes.
3. **Deliverable-absence never blocks.** A `red-team-gate.test.mjs` case: a Critical finding with `deliverableAbsence:true` on an impl-plan run is absent from `blockers` and the verdict is not `BLOCKED` on it alone (regression for the 16-false-findings case).
4. **Reproduce-and-fix the original misfire.** A synthetic `impl-plan` claiming to add an absent symbol, run end-to-end through scaffold → gate, yields a verdict that is not `BLOCKED` purely on the symbol's absence.
5. **Escape guard behavior.** `assert-no-repo-escape.test.sh`: exit 0 on a clean repo, exit 1 on a stray working-tree file, exit 1 on a junk sandbox ref (local and via a stubbed remote), exit 2 on a git error / non-repo — the 2-vs-1 distinction never collapses.
6. **Escape guard wired.** SKILL.md runs `assert-no-repo-escape.sh --repo <repo>` between the Workflow return and the gate, and a nonzero result routes the verdict through the self-confound gate (documented + asserted by a SKILL structure/prose test if one exists, else by the guard's presence in the Step sequence).
7. **Scope-lock git hardening.** The scaffold test asserts the executed scope-lock emits the `git -C <sandbox>` directive and the explicit no-bare-`git push` / cwd-reset warning.
8. **Pass-demote drift guard (D7).** A test asserts: (a) the only status that demotes a Critical/Major in `classify()` is `'pass'` (a `warn`/`fail`/absent-status Critical lands in `blockers`; a `pass`-status Critical does not); (b) the two-contract sentence is present in both `workflow-scaffold.js` and `references/lenses.md`. Removing the clause from either surface turns the test red.
9. **Adjudication block + clause.** The report template in `lenses.md` contains a `## Adjudications` section; `auditPrompt()` emits the version-precedence clause when adjudications are threaded; a both-surfaces unit test asserts the clause on both `workflow-template.js` (`auditPrompt`) and `agents/war-auditor.md`.
10. **Version-precedence scoring.** The auditor prompt states the precedence order (task instruction > red-team adjudication > plan body literal) such that a value matching the adjudication is not scored as a defect against the stale plan literal — asserted by the both-surfaces test's phrase check.
