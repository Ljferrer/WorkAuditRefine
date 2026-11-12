# Gas Town design parameters inherited by WAR

WAR re-implements Steve Yegge's [Gas Town](https://github.com/gastownhall/gastown) roles on Claude Code primitives. This file records the *proven parameters* WAR borrows. **[HARD]** = the design depends on it; **[TUNE]** = a default you can change.

## Roles: Gas Town → WAR
| Gas Town | WAR | Built on |
|---|---|---|
| Mayor | Lead | the main Claude Code session (your chat) |
| Polecat | `war-worker` | `Agent` in a git worktree (model per `war-config.mjs` DEFAULTS) |
| Nun (Refinery audit gate) | `war-auditor` | read-only `Agent` (model per `war-config.mjs` DEFAULTS): Read/Grep/Glob + Bash confined to read-only git by a fail-closed guard |
| Refinery | `war-refiner` + the Workflow's serial merge loop | `Agent` (model per `war-config.mjs` DEFAULTS) + Workflow control flow |
| Witness | (dissolved) | Workflow control flow + lifecycle hooks |
| bd remember | war-servitor | write-scoped `Agent` (model per `war-config.mjs` DEFAULTS); records per-phase learnings |

## Nun audit gate → `war-auditor`
- **Seats:** a per-task **roster** of 1–5 distinct-lens seats; default: the 5-seat roster at `deep`; a solo `neighbors` seat for low-risk tasks. Seat count *is* the roster's length. **[TUNE]**
- **Unanimity, fail-closed:** all live seats must `approve` against the current SHA; any `request_changes`/missing/hung seat = no merge. A missing verdict never auto-passes and never auto-rejects. **[HARD]**
- **Convergent unanimity (SHA-pinned):** approval is provisional and pinned to `audit_sha`; when HEAD moves, every seat (incl. prior approvers) re-confirms against the new SHA. **[HARD]**
- **Read-only — structural:** in WAR this is tool-level. Auditors have Read/Grep/Glob plus Bash, and a fail-closed PreToolUse guard (`hooks/validate-auditor-git.sh`) confines that Bash to read-only git subcommands. With no Write/Edit, they physically cannot modify, commit, or push. (Gas Town used a detached checkout + push-unset; WAR's tool restriction is the simpler portable equivalent and avoids the headless-permission-hang trap.) **[HARD]**
- **Tiered depth:** `neighbors` (diff + one hop of what changed lines reference) or `deep` (trace impact wherever changed symbols are used). Each roster entry carries its depth **per seat** (omitted → `deep`). **[TUNE default]**
- **Perspective diversity (roster):** each seat gets a distinct lens (duplicates fail validation). The lenses are correctness / cascading-impact / plan-faithfulness / simplicity / performance. Flagged code swaps in or adds a domain lens (security, healthcare-safety). **[HARD for multi-seat value]**
- **Plan faithfulness:** check the change against the plan **slice** the task owns (one plan file → many tasks; never 1:1). Degrade to code-only if no slice is discoverable. **[HARD]**
- **round_limit = 6:** 6 fixes, each one audited, then escalate `audit-blocked` + halt. Only a genuine `request_changes` advances the counter — infra faults don't. **[TUNE value, HARD mechanism]**
- **Severity + disposition:** findings are tagged Critical/Major/Minor/Nit, and **Critical/Major block**. Every Minor/Nit routes by auditor-owned **disposition**. An `absorb` is fixed in-phase, by per-task ace or the phase-close sweep. A regressed ace batch recovers via the bounded ace bisection ladder (`aceBisect` in `workflow-template.js`). Only finally-failing subsets demote, and every demotion is logged per subset. A `follow-up` files an issue, with why-not-absorbable. A `note` (phase report + servitor feed, never an issue; a `behavior` note never stays a note) feeds the report. With a fix on a named file a `behavior` note becomes `absorb`, else a parked `ask` (ADR 0058). An `ask` (#1550) is decision-shaped, and its question+fork are mandatory. It parks on `asks[]` and is ruled by the operator at the Checkpoint strike-list gate, never filed unruled. A fully specified Minor/Nit defaults to `absorb` (in the task diff) or `absorb` + `phaseClose:true` (outside it). A `follow-up` is legal only under a `barrier` tag. If the disposition is omitted, Minor becomes follow-up and Nit becomes note. An `ask` is never a default (ADR 0013, amended 2026-08-25 and 2026-09-04). (Gas Town's gate was binary; WAR keeps the binary block, tags severity for triage, and routes the non-blocking tail by disposition.) **[HARD]**
- **Wall-clock (optional):** a soft deadline notifies the Lead; it never force-merges or auto-fails. **[HARD principle]**

## Refinery → `war-refiner` + Workflow
- **Serial merge queue:** one merge at a time (the Workflow calls `war-refiner` sequentially). No batch-then-bisect in v1 (merge-queue bisection — distinct from the landed ace bisection ladder). **[TUNE — merge-queue bisect is a future option]**
- **Step order:** audit happens **before** merge-eligibility (off the merge critical path); then rebase task onto integration tip → run gate → merge. **[HARD]**
- **Gate pipeline:** the repo's lint+test command (for example `uv sync && ruff check && pytest`). Any command failing = fail → `FIX_NEEDED`. **[HARD it runs; TUNE contents]**
- **Kick-back:** a failed gate/audit routes a batched `FIX_NEEDED` to a fresh fix-worker **on the same (preserved) worktree**. That is why workers' worktrees persist until their task lands. **[HARD]**
- `war-refiner` owns **all** pushes; never `--force`/`reset --hard` on shared branches. **[HARD]**

## Integration branches → WAR phase model
- One **`integration/phase-N`** branch per phase, cut off the working branch. Task worktrees branch off the integration tip; later waves branch off the updated tip (so they see prior waves' merged work). **[HARD]**
- **Land:** `integration/phase-N` → working with **`--no-ff`** (one phase commit), then push working. **[HARD]**
- Final: **one PR** working → landing. **[HARD]**

## Propulsion (GUPP) → WAR
"If there is work, run it" — agents begin immediately, no "are you stuck?" polling. In WAR the Workflow's control flow *is* the propulsion: an `agent()` either returns or errors; there is no idle agent to nudge. **[HARD principle]**

## Gotchas WAR must respect
- **Read-only auditor:** Read/Grep/Glob plus guard-restricted Bash. The guard denies anything outside the read-only git allowlist fail-closed (exit 2), and never shows a permission prompt. So the auditor can never hang on a tool-permission prompt. **[HARD]**
- **GateGuard (ECC):** if a `[Fact-Forcing Gate]` blocks a worker's Bash/Write, the worker presents the facts then retries the identical op (passes on retry). **[HARD on ECC harnesses]**
- **No `temperature`:** the current Opus/Fable family 400s on a `temperature` param — any code an agent writes that calls the SDK must omit it. **[HARD on those models]**
- **Structural > behavioral:** enforce read-only / worktree-scope through tool restrictions + hooks, not prose — agents violate instructions under pressure. **[HARD]**
