# Gas Town design parameters inherited by WAR

WAR re-implements Steve Yegge's [Gas Town](https://github.com/gastownhall/gastown) roles on Claude Code primitives. This file records the *proven parameters* WAR borrows. **[HARD]** = the design depends on it; **[TUNE]** = a default you can change.

## Roles: Gas Town → WAR
| Gas Town | WAR | Built on |
|---|---|---|
| Mayor | Lead | the main Claude Code session (your chat) |
| Polecat | `war-worker` | `Agent` (sonnet) in a git worktree |
| Nun (Refinery audit gate) | `war-auditor` | read-only `Agent` (opus): Read/Grep/Glob + Bash confined to read-only git by a fail-closed guard |
| Refinery | `war-refiner` + the Workflow's serial merge loop | `Agent` (sonnet) + Workflow control flow |
| Witness | (dissolved) | Workflow control flow + lifecycle hooks |
| bd remember | war-servitor | write-scoped `Agent` (sonnet); records per-phase learnings |

## Nun audit gate → `war-auditor`
- **Seats:** a per-task **roster** of 1–5 distinct-lens seats; default: the trio at `deep`; a solo `neighbors` seat for low-risk tasks. Seat count *is* the roster's length. **[TUNE]**
- **Unanimity, fail-closed:** all live seats must `approve` against the current SHA; any `request_changes`/missing/hung seat = no merge. A missing verdict never auto-passes and never auto-rejects. **[HARD]**
- **Convergent unanimity (SHA-pinned):** approval is provisional and pinned to `audit_sha`; when HEAD moves, every seat (incl. prior approvers) re-confirms against the new SHA. **[HARD]**
- **Read-only — structural:** in WAR this is tool-level — auditors have Read/Grep/Glob plus Bash confined by a fail-closed PreToolUse guard (`hooks/validate-auditor-git.sh`) to an allowlist of read-only git subcommands (no Write/Edit), so they physically cannot modify, commit, or push. (Gas Town used a detached checkout + push-unset; WAR's tool restriction is the simpler portable equivalent and avoids the headless-permission-hang trap.) **[HARD]**
- **Tiered depth:** `neighbors` (diff + one hop of what changed lines reference) or `deep` (trace impact wherever changed symbols are used) — carried **per seat** on each roster entry (omitted → `deep`). **[TUNE default]**
- **Perspective diversity (roster):** each seat gets a distinct lens (duplicates fail validation) — correctness / cascading-impact / plan-faithfulness, swapping or adding a domain lens (healthcare-safety, security) on flagged code. **[HARD for multi-seat value]**
- **Plan faithfulness:** check the change against the plan **slice** the task owns (one plan file → many tasks; never 1:1). Degrade to code-only if no slice is discoverable. **[HARD]**
- **round_limit = 3:** after 3 dissenting rounds, escalate `audit-blocked` + halt. Only a genuine `request_changes` advances the counter — infra faults don't. **[TUNE value, HARD mechanism]**
- **Severity + disposition:** findings tagged Critical/Major/Minor/Nit; **Critical/Major block**; every Minor/Nit routes by auditor-owned **disposition** — `absorb` (fixed in-phase: per-task ace or the phase-close sweep), `follow-up` (files an issue, with why-not-absorbable), or `note` (phase report + servitor feed, never an issue); omitted → Minor becomes follow-up, Nit becomes note, `absorb` never defaulted (ADR 0013). (Gas Town's gate was binary; WAR keeps the binary block, tags severity for triage, and routes the non-blocking tail by disposition.) **[HARD]**
- **Wall-clock (optional):** a soft deadline notifies the Lead; it never force-merges or auto-fails. **[HARD principle]**

## Refinery → `war-refiner` + Workflow
- **Serial merge queue:** one merge at a time (the Workflow calls `war-refiner` sequentially). No batch-then-bisect in v1. **[TUNE — bisect is a future option]**
- **Step order:** audit happens **before** merge-eligibility (off the merge critical path); then rebase task onto integration tip → run gate → merge. **[HARD]**
- **Gate pipeline:** the repo's lint+test command (e.g. `uv sync && ruff check && pytest`). Any command failing = fail → `FIX_NEEDED`. **[HARD it runs; TUNE contents]**
- **Kick-back:** a failed gate/audit routes a batched `FIX_NEEDED` to a fresh fix-worker **on the same (preserved) worktree** — which is why workers' worktrees persist until their task lands. **[HARD]**
- `war-refiner` owns **all** pushes; never `--force`/`reset --hard` on shared branches. **[HARD]**

## Integration branches → WAR phase model
- One **`integration/phase-N`** branch per phase, cut off the working branch. Task worktrees branch off the integration tip; later waves branch off the updated tip (so they see prior waves' merged work). **[HARD]**
- **Land:** `integration/phase-N` → working with **`--no-ff`** (one phase commit), then push working. **[HARD]**
- Final: **one PR** working → landing. **[HARD]**

## Propulsion (GUPP) → WAR
"If there is work, run it" — agents begin immediately, no "are you stuck?" polling. In WAR the Workflow's control flow *is* the propulsion: an `agent()` either returns or errors; there is no idle agent to nudge. **[HARD principle]**

## Gotchas WAR must respect
- **Read-only auditor:** Read/Grep/Glob plus guard-restricted Bash — anything outside the read-only git allowlist is denied fail-closed (exit 2), never surfaced as a permission prompt — so it can never hang on a tool-permission prompt. **[HARD]**
- **GateGuard (ECC):** if a `[Fact-Forcing Gate]` blocks a worker's Bash/Write, the worker presents the facts then retries the identical op (passes on retry). **[HARD on ECC harnesses]**
- **No `temperature`:** the current Opus/Fable family 400s on a `temperature` param — any code an agent writes that calls the SDK must omit it. **[HARD on those models]**
- **Structural > behavioral:** enforce read-only / worktree-scope through tool restrictions + hooks, not prose — agents violate instructions under pressure. **[HARD]**
