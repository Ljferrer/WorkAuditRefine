# Loop budget — finding-class routing, patch style, the Route upstream block

Read when the first gate computation of a run returns `BLOCKED` (the trigger pointer in [../SKILL.md](../SKILL.md) Step 5). The budget mechanics live in the SKILL steps — Step 1 seeds cumulative rounds from the newest prior report's `**Rounds:**` line, Step 3 resolves the round limit (`run.redteamRoundLimit`, default 3), Step 5 threads `--rounds=<n> --round-limit=<resolved>` into every gate computation, and the gate ([../assets/red-team-gate.mjs](../assets/red-team-gate.mjs)) computes `routeUpstream` by pure arithmetic over the unstamped subset. This file is the doctrine those mechanics enforce: which findings deserve another sweep, and which go back to the interview. `/red-team` validates and never converts — chronic under-specification is `/war-strategy`'s problem, and grinding it here only launders it.

## Finding-class routing

Route each open blocker / `needsDecision` by its class **before** spending another sweep on it:

- **Factual error → patch in place.** The plan states something provably wrong about the live repo — a stale literal, a drifted anchor, a wrong signature, a false baseline claim. The fix is local and shrinks ambiguity; patch, close per Step 5's patch-and-adjudicate default, move on.
- **Under-specification (`needsDecision`) → one adjudication attempt, then upstream.** Grill the user once; a decision that settles is adjudicated and closed. One that does not settle is interview material — never grind it across sweeps. The gate's arithmetic backstop is the same rule typed: an unstamped `needsDecision` at rounds ≥ 2 emits `routeUpstream: true`.
- **Scope-expanding patch → upstream immediately.** When the fix a finding calls for would add tasks, files, or design decisions the plan never carried, do not patch it in — scope is authored in the interview, not accreted mid-verification. Route it upstream even with budget to spare.
- **Patch cascade → two consecutive patch-cascade sweeps ⇒ upstream regardless of budget** (prose-advisory — Lead-judged, not gate-typed). A patch-cascade sweep is one whose patches spawn the next sweep's findings: the plan is churning, not converging, and the round budget must not be spent proving that a third time.

Advisory fast-fail (prose-only pending field data; gate-typing is a deferred backstop of the authoring plan): **≥ 3 `needsDecision` findings in round 1** signal an under-specified plan — recommend routing upstream without spending the budget.

## Patch style

**Patches state the final rule; genealogy lives in `## Adjudications`.** A plan patch writes the corrected text as if it had always been so — no "changed from X to Y" narrative, no superseded literal left beside its replacement, no inline changelog. The history of the change — what the patch replaced, who ruled, when — is recorded as rows in the report's `## Adjudications` block, each row carrying its own provenance token (`operator-ratified (<date>)` or `AI-declared`). A plan body that accretes genealogy is itself a patch-cascade signal.

## The `## Route upstream` block

On a route-upstream terminal, Step 6 appends this block to the report — the residual questions phrased as the `/war-strategy` regrill agenda, plus the exact re-entry command:

```markdown
## Route upstream
**Regrill:** `/war-strategy <abs plan path>` — run the interview on the agenda below; it patches the plan.
**Agenda (residual questions):**
- <the unsettled decision — its non-equivalent resolutions, and what the gate saw>
**Re-entry:** `/red-team <abs plan path> [--repo <path>]` — after the regrill; the fresh run seeds its cumulative count from this report's `**Rounds:**` line.
```

The agenda rows are the run's residual open questions verbatim — every unpatched root, every unsettled `needsDecision` — one row per question, nothing summarized away. Both commands are exact (absolute plan path filled in), copy-paste ready: the block is the handoff artifact `/war-campaign`'s halt arm surfaces in CAMPAIGN-STATE.md, and a vague agenda row defeats the regrill it exists to seed.
