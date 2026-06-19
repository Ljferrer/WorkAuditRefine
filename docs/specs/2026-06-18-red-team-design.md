# `/red-team` — Adversarial Plan Verification (Design Spec)

- **Date:** 2026-06-18
- **Status:** Approved design — ready for implementation planning
- **Repo:** WorkAuditRefine (`work-audit-refine` plugin)
- **Introduces:** the next minor after `/war-room` (≈ v0.4.0; the implementation plan pins the exact bump)

## Problem

A plan can look airtight and still be full of holes: a "before" snippet that no longer matches the live file, a test block that doesn't actually pass, a step that depends on a later step's output, a requirement in the source spec that no task implements, an ambiguity with two non-equivalent resolutions. Today these surface only at execution time (expensive) or never (silent wrong results). What caught the two real bugs in the `/war-room` plan was an *ad hoc* adversarial verification workflow — parallel agents that **proved** claims by executing them in a sandbox, then a grill-and-patch pass. This spec turns that one-off into a reusable skill.

## Solution overview

`/red-team` is a conversation-driven skill whose orchestrator (the **Red Team Lead** = the main session) reads a target plan, derives a bespoke attack strategy, **authors and runs a verification Workflow** that fans out adversarial agents, and then drives the plan to "cleared" through a grill → patch-in-place → re-verify loop. It is **plan-agnostic** (any implementation plan, design spec, or PRD) and ships in the `work-audit-refine` plugin as a sibling to `/war` and `/war-room` — the trilogy **war-room configures → red-team hardens → war executes** — but does not depend on WAR.

> This skill explicitly authorizes use of the **Workflow tool**: shipping a skill whose runbook instructs the Lead to call `Workflow` is a valid opt-in. The Lead adapts the bundled scaffold; it does not free-author the harness from scratch.

## Resolved design decisions

1. **Verification model — hybrid.** A universal **spine** (always run) plus **bespoke probes** the Lead derives from the specific plan's features.
2. **Proof method — prove by execution in a sandbox.** Where the plan has runnable artifacts, agents copy them into a throwaway temp dir / git worktree and actually run them. Read-only analysis only where there is nothing to run. The real repo is never mutated.
3. **Resolution — grill, then patch the plan in place.** For each blocker, grill the user one-at-a-time with a recommended resolution, apply the fix to the plan file, re-verify that part. Minor findings auto-noted/auto-fixed. Output: a hardened plan + a report.
4. **Home & scope — WAR plugin, plan-agnostic.** Verifies any plan/spec, degrading gracefully when there is no runnable code.
5. **Severity — reuse Critical / Major / Minor + a `needsDecision` flag** (the "holes"); no 4th severity class.

## The runbook (Red Team Lead)

1. **Locate & read.** `/red-team <plan-file> [--spec <file>] [--repo <path>] [--fast]`. Default `<plan-file>` = the most recent `docs/plans/*.md`; default `--repo` = cwd. Read the plan and, if discoverable, the **source of truth** it claims to satisfy (a linked spec/issue/PRD).
2. **Scope the attack.** Classify the plan's artifacts — runnable code/test blocks, before/after edit snippets, shell commands with stated expected output, dependency/interface assumptions, coverage claims, cited line numbers. Assemble the **spine** (always) + a derived **probe list** from the catalog in `references/lenses.md`. Preview what will be verified and what will be *executed in a sandbox* (skipped under `--fast`).
3. **Author + run the Workflow.** Adapt `assets/workflow-scaffold.js`: one agent per lens/probe, each returning the `FINDINGS` schema. **Execution agents work only in throwaway sandboxes** (temp dir or `git worktree`), cleaned up after; **analysis agents** use Read/Grep/Glob. Pipeline each probe into an **adversarial-confirm** stage (below).
4. **Triage.** Collect, dedup, severity-rank; separate auto-fixable Minors from blockers.
5. **Grill → patch → re-verify loop.** While any open Critical / Major / `needsDecision` remains: present the blocker with a recommended resolution, grill the user one-at-a-time, apply the agreed fix to the plan file (Edit), then **re-run only the affected probe** to confirm the fix holds. Auto-note or auto-fix Minors. The loop is **bounded** (cap per finding); an unresolved hole ends in `BLOCKED`, not an infinite loop.
6. **Emit.** Write the report (below); the plan file is now hardened in place. Final **verdict**: `CLEARED` · `CLEARED-WITH-NOTES` · `BLOCKED`.

## Verification model

### Spine (universal floor — every run)

| Lens | Attacks |
|---|---|
| **claims-vs-reality** | Every concrete claim (file exists, symbol named X, function signature, line N) checked against the live repo. |
| **executable-proof** | Every test / command / edit the plan ships is run in a sandbox; assert behavior matches the plan's stated "Expected." |
| **coverage-vs-source** | Every requirement in the source spec/issue maps to a plan step; unmapped requirements are gaps. |
| **consistency-&-placeholders** | Name/signature drift across steps; TBD/TODO/vague steps; steps that contradict each other. |
| **dependency-&-feasibility** | Assumed interfaces/deps/tools exist and are usable; step ordering is sound (no step consumes a later step's output). |

### Bespoke probe catalog (`references/lenses.md`)

The Lead instantiates the probes whose triggering feature is present in the plan:

| Plan feature | Probe | Technique |
|---|---|---|
| before/after edit snippet | the "before" text matches the live file **verbatim** | analyzed (grep) |
| code block + test block | extract to a sandbox and **run the tests** | executed |
| shell command + expected output | **run it** and diff against the stated expectation | executed |
| cited line numbers | verify the anchors point where the plan says | analyzed |
| "no X → today's behavior" baseline claim | **reproduce the baseline** in a sandbox | executed |
| new dependency / tool | confirm it resolves / installs in a sandbox | executed |
| multi-file edit ordering | apply all edits to a scratch copy; confirm they compose | executed |

For a plan with **no runnable artifacts** (a design doc/PRD), executed probes degrade to analysis: coverage, consistency, feasibility, and ambiguity (`needsDecision`) carry the verification.

### Adversarial-confirm (kill false positives)

A candidate `fail` is not trusted on one agent's say-so. It is handed to an **independent** agent instructed to *refute* it — reproduce the failure or disprove it. Only **reproduced** failures keep `status: fail`; unreproduced ones drop to `warn` with a note. This enforces "prove, don't assert."

## `FINDINGS` schema (StructuredOutput per agent)

```jsonc
{ probe: "snippet-fidelity",            // lens or probe name
  kind: "spine" | "bespoke",
  technique: "executed" | "analyzed",   // executed = proven in a sandbox
  sandbox: "/tmp/red-team-… | n/a",     // throwaway path used, or n/a
  status: "pass" | "fail" | "warn",
  findings: [ {
    severity: "Critical" | "Major" | "Minor",
    needsDecision: false,               // true = a hole to grill the user on
    claim:    "what the plan asserts",
    reality:  "what red-team found",
    evidence: "reproduced proof — error output, diff, command transcript",
    fix:      "suggested resolution",
    planRef:  "Task/Step/line in the plan" } ] }
```

## Severity, grill trigger, and the gate

- **Critical** — a claim is provably false in a way that breaks execution (a test fails, an edit will not apply, a named file/symbol is absent). **Blocks.**
- **Major** — a real defect or coverage gap that yields wrong/incomplete results (logic bug, unmapped requirement, internal contradiction, unsound ordering). **Blocks.**
- **Minor** — cosmetic/robustness (a stale line number that still text-matches, a missing nice-to-have check). Auto-noted; auto-fixed when the fix is unambiguous.
- **`needsDecision`** — an underspecified hole red-team cannot safely resolve itself (an ambiguity with >1 non-equivalent resolution, a missing decision the plan never makes). **Grill the user**, whatever the severity.
- **Grill trigger:** any open Critical, Major, or `needsDecision`.
- **Gate:** the plan is **CLEARED** when zero of those remain. `CLEARED-WITH-NOTES` if only Minors were filed. **BLOCKED** if a hole could not be resolved within the bounded loop (the open question is recorded for the user).

## Report

Runtime reports are written to `docs/red-team/YYYY-MM-DD-<plan-slug>.md`:

- **Verdict** (CLEARED / CLEARED-WITH-NOTES / BLOCKED) + one-line summary.
- **Attack surface** — the spine lenses + bespoke probes run, and which executed in a sandbox.
- **Executed proof** — what ran, with results (e.g. "tests 20/20 green on Node v26"; "all 10 edits applied").
- **Findings** — by severity, each with claim / reality / evidence / resolution-applied.
- **Resolutions** — the grill decisions and the patches applied to the plan (with plan refs).
- **Residual risk** — anything left as a Minor note or an accepted assumption.

## Safety invariants (never violate)

- Verification **never mutates the repo's source under test** (code, configs, branches) and **never runs the plan against the real repo** — all execution happens in throwaway temp dirs / `git worktree`s, removed afterward. (The only repo files red-team writes are the plan doc and the report — see the next bullet.)
- red-team **writes only two things**: the target plan file (patches during the grill loop) and the report. It never touches source, branches, PRs, or issues.
- **Findings must be proven, not asserted** — a `fail` requires reproduced evidence; the adversarial-confirm stage drops anything unreproduced.
- The grill/patch loop is **bounded**; an unresolved hole ends in `BLOCKED`, not an infinite loop.
- Sandbox commands are the plan's own artifacts; red-team does not invent destructive operations. It declines to "execute" a plan step that itself performs irreversible/outward-facing actions (push, deploy, send) — those are analyzed, not run.

## Relationship to `writing-plans`

`writing-plans` is the **builder**; `red-team` is the **adversary**. Natural pairing: `writing-plans → red-team → (war-room →) war`. red-team's report can recommend a **rewrite** (back to `writing-plans`) when a plan is too holed to patch, versus in-place patching for localized defects. red-team borrows writing-plans' rigor (exact paths, runnable commands, no placeholders) as its *standard* — i.e. a plan that would fail writing-plans' own self-review fails red-team's consistency/placeholder spine lens.

## Files

**Create (in the `work-audit-refine` plugin):**
- `skills/red-team/SKILL.md` — the Red Team Lead runbook (< 100 lines; references one level deep).
- `skills/red-team/references/lenses.md` — spine lenses, the bespoke probe catalog, the `FINDINGS` schema, the severity rubric, and the report template.
- `skills/red-team/assets/workflow-scaffold.js` — a parameterized verification Workflow the Lead adapts per plan (parallel probe agents → adversarial-confirm → aggregate); keeps the harness DRY and satisfies the Workflow opt-in.

**Modify:**
- `.claude-plugin/plugin.json` — add `./skills/red-team` to `skills`; bump version.
- `.claude-plugin/marketplace.json` — bump version (two places).
- `README.md` — document `/red-team` and the trilogy.

## Out of scope (YAGNI)

- Verifying running production systems or live services (red-team verifies *plans*, in sandboxes).
- A standing CI integration / git hook (this is an interactive, on-demand gate).
- Auto-executing a cleared plan (that is `/war` or `executing-plans`; red-team stops at CLEARED).
- A persistent findings database (each run emits a dated report).

## Open questions

None — design fully resolved.
