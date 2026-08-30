---
name: snipe
description: Launch a quick one-shot audit — 1-5 read-only WAR auditor seats against the current changes, verdicts reported in chat. Trailing integer sets the seat count (default 1); trailing comma-separated lenses pin lenses, with `auto` meaning the Lead picks the rest (default auto). No plan, no refinery, no filing — just the audit machinery, on demand. Explicitly-invoked-only; never auto-triggers.
disable-model-invocation: true
---

# /snipe — one-shot quick audit

You convene 1–5 independent, read-only WAR auditor seats against a diff and report their verdicts in the main chat. You are **not** a phase: no worktrees, no merge queue, no unanimity gate, no fix rounds, no servitor. One round; report; stop. You never modify files, never file issues, never fix findings — the operator decides what to absorb, file, or drop.

## 1. Parse the invocation

Grammar (both args trailing, order-tolerant): `/snipe [<target>] [<seats 1-5>] [<lens[,lens...]>]`. Do not parse by hand — shell out to the owned helper and read its JSON:

```
node ${CLAUDE_PLUGIN_ROOT}/skills/snipe/assets/snipe-args.mjs '<raw args>' [--config .claude/war/config.json]
```

It returns `{ target, seats, named, autoCount, tier, errors }`. If `errors` is non-empty, print them and stop — never spawn on a refused parse. `tier` is each seat's spawn model/effort, resolved from the WAR config ladder (`agents.snipe` → `agents.auditor` → defaults; the shipped default is opus/`high`) — spawn with exactly that tier, never your own choice.

## 2. Resolve the target and pin the SHA

- **Explicit target** (anything before the trailing args): a ref range, PR number, or path list — use it as given.
- **Default**: the current branch against its merge-base with the default branch (`git merge-base HEAD <default>`, then `<mb>..HEAD`). Pin `audit_sha` = the branch tip.
- **Dirty tree**: when the working tree is dirty and no explicit target was given, audit the tree state instead and mark the whole report **advisory** — there is no stable SHA to pin, and every verdict says so.

## 3. Choose lenses and spawn the seats

`named` lenses are pinned. For each of the `autoCount` remaining seats, pick a distinct lens yourself, chosen for the diff's shape (engine code → `correctness`/`cascading-impact`; docs → `plan-faithfulness`/`simplicity`; guards/hooks → `security`; tests → `test-fidelity`), each with a one-line rationale in the report. All seats run at `deep` depth. Reserved lenses (`execution-evidence`, `pin-validity`) are never snipe-selectable — the parser already refuses them.

Spawn all seats **in parallel** as `work-audit-refine:war-auditor` subagents at the parsed `tier`. The standing auditor card and the `agent_type` guard confinement (read-only git verb allowlist) apply unchanged. Each seat's dispatched prompt is the phase audit prompt's trimmed shape — no task issue, no plan slice; when the operator stated a concern, it rides where Commander's Intent would:

> AUDIT SEAT — lens: `<lens>`, depth: deep.
> Repo (read-only): `<path>`. Pinned audit_sha: `<sha>` (or: dirty working tree — advisory).
> Review the range `<base>..<sha>`. Operator's stated concern (intent ceiling): `<concern or "none — judge the diff on its own terms">`.
> Verify evidence at the pinned SHA with Read/Grep/Glob and read-only git. Return ONE AuditVerdict JSON per your standing card: verdict, audit_sha, lens, findings[] `{severity, disposition, title, file, locator (named construct, not line number), evidence, fix}`.

## 4. Report

Synthesize one chat report, informational — nothing is gated:

- Per-seat verdict line (lens, verdict, model/effort it ran at).
- Findings ranked by severity. Label every Critical/Major finding **"would block in a phase"** — mirroring run semantics without gating anything.
- Surface every `ask`-disposition finding to the operator for a ruling; an unruled ask is never filed (standing doctrine).
- If the tree was dirty: lead the report with the advisory caveat.
- Close with the operator's options (absorb by hand, file follow-ups on request, drop) — and take **no** action on them unprompted.

## Non-goals

Not `/code-review` (this runs WAR's auditor card, lens doctrine, severity/disposition vocabulary, and config tiers — output comparable to in-run verdicts). Not a phase. Never auto-invoked.
