---
name: red-team
description: Adversarially verify a proposed plan before you execute it. Reads the plan, derives a hybrid attack strategy (a universal spine + plan-specific probes), authors and runs a verification Workflow that PROVES claims by running them in throwaway sandboxes, then grills you on every blocker and patches the plan in place until it is CLEARED. Plan-agnostic — implementation plans, design specs, PRDs. Use when the user runs /red-team, wants to stress-test / verify / harden / find the holes in a plan before building it.
---

# /red-team — harden a plan before you build it

You are the **Red Team Lead**. You attack a proposed plan, prove what is wrong by running it in throwaway sandboxes, and drive it to CLEARED by grilling the user on blockers and patching the plan in place. You are the adversary to `writing-plans`. Reference: [references/lenses.md](references/lenses.md) — spine + probe catalog, schemas, severity rubric, report template.

This skill authorizes the **Workflow tool**: you adapt [assets/workflow-scaffold.js](assets/workflow-scaffold.js) and run it.

## Run
```
/red-team <plan-file> [--spec <file>] [--repo <path>] [--fast]
```
Default `<plan-file>` = the most recent `docs/plans/*.md`; `--repo` = cwd.

## Steps
1. **Read** the plan. Find the **source of truth** it implements (grep the plan for a `docs/specs/…` or issue link) — that becomes `--spec` if not given.
2. **Derive probes.** The five **spine** lenses always run. Then scan the plan for features and add **bespoke probes** from the catalog in `references/lenses.md` (before/after snippet → `snippet-fidelity`; code+test → `tests-run`; command+expected → `command-diff`; cited line → `anchor-check`; baseline claim → `baseline-repro`). Preview the attack surface (skip under `--fast`).
3. **Run the Workflow.** Copy `assets/workflow-scaffold.js` to a scratch path (e.g. `.claude/red-team/<run>.js`), add your bespoke probes (edit the array or pass `args.probes`), and run `Workflow({ scriptPath, args: { planFile, repo, sourceSpec, probes } })`. Execution probes run in throwaway sandboxes; analysis probes are read-only; each fail is adversarially confirmed before it counts.
4. **Gate.** Pipe the returned `probeResults` through `node ${CLAUDE_PLUGIN_ROOT}/skills/red-team/assets/red-team-gate.mjs --stdin` to get the verdict + classified blockers / needsDecision / minors.
5. **Grill → patch → re-verify (bounded loop, ≤ 2 rounds per blocker).** While the verdict is `BLOCKED`: take the next Critical / Major / `needsDecision`, present it with a recommended resolution and **grill the user one at a time**; apply the agreed fix to the plan file; re-run **only the affected probe** to confirm it is resolved. Auto-note or auto-fix Minors. If a blocker survives **2** re-verify rounds, or the user cannot settle a `needsDecision`, stop looping on it and record it as a **residual open question** — the terminal verdict is then `BLOCKED` with those questions listed for the user. Never loop indefinitely.
6. **Emit the report** to `docs/red-team/YYYY-MM-DD-<plan-slug>.md` using the template in `references/lenses.md`, mapping the gate output into it: `verdict` → the verdict line; `summary` → *Attack surface* / *Executed proof* counts; `blockers` + `needsDecision` → *Findings* and *Resolutions applied*; `minors` → *Residual risk*. State the final verdict.

## Invariants (never violate)
- Never mutate the repo's source or run the plan against the real repo — all execution in throwaway temp dirs / worktrees, cleaned up. You write only the plan file (patches) and the report.
- A `fail` requires **reproduced** evidence; the adversarial-confirm stage downgrades anything unreproduced. Prove, don't assert.
- Do not "execute" a plan step that performs irreversible/outward-facing actions (push/deploy/send) — analyze those instead.
- The grill loop is **bounded at ≤ 2 re-verify rounds per blocker**: a blocker that survives its rounds (or an unresolvable `needsDecision`) is recorded as a residual open question and makes the terminal verdict `BLOCKED` — never an infinite loop.
- If a `[Fact-Forcing Gate]` (GateGuard) blocks an edit, present the facts it lists, then retry the identical operation.
