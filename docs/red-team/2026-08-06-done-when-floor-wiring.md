# Red Team — 2026-08-06-done-when-floor-wiring (2026-08-15)

**Verdict:** ADJUDICATED — three root findings; one (R1) removed from the finding set after an executed re-run proved the patched checks catch both evasions, three adjudicated in place without re-run (prose/design patches no executed probe re-measures). Coverage whole: 16/16 probes on target, none off-target, none dropped.
**Rounds:** 1

Plan: [`docs/plans/2026-08-06-done-when-floor-wiring.md`](../plans/2026-08-06-done-when-floor-wiring.md) (merged plan — Part 1 is its own source of truth, `--spec` defaulted to the plan).
Repo base: `924582e` — the landed tip of campaign plan 2 (`2026-08-06-escape-guard-exit-contract`), itself stacked on plan 1. **Not** the `6fff2ee` the plan was authored against (see R4).
`artifactKind`: `impl-plan`. Agents: `opus` / effort `high`, round limit 3 (resolved from run config, fail-open).

## Attack surface

Six spine lenses + ten bespoke probes = 16 expected, 16 on target, 0 dropped, 0 off-target. 22 agents, 0 errors.

Bespoke: `stacked-base-drift`, `default-flip-old-absent`†, `retirement-grep-robustness`, `unguarded-new-mirror`†, `guard-split-deps-edge`†, `clause-delimiter-coupling`, `d3-registry-anchor`, `endstate-crosstask-scope`, `baseline-proceed-fixture`, `claude-md-budget`.
† the three mandatory drift-guard spine probes — all three ran non-vacuously.

**`ff-topology` not derived.** The plan carries no merge-commit topology anchor: `first-parent` 0 hits, `^1` 0, "merge commit" 0, "three-dot" 0; the single `...` hit is `replace(...)` JS syntax at line 52, not a git range. End state 14 is a `git log` **range** over the phase, which is the safe form — not a per-commit gate (lesson `each-commit-cites-its-issue-endstates-are-judged-over-the-full-phase-range-not-gated-per-commit`).

**Escape guard:** pre-run snapshot 313 refs, exit 0. Post-run against that baseline, exit **0** — no residue, no probe-authored ref, no foreign delta.

## Executed proof

Lead-executed before probe dispatch (the two load-bearing mechanism claims):

- **D1/A1 group kill — CONFIRMED, both arms.** Faithful mini-floor reproducing the launch/watchdog construct, command file `sleep 60 & wait` under `--timeout 1`, stdout captured through a command substitution:

  | arm | capture | orphan | exit |
  |---|---|---|---|
  | today (single-PID `kill`) | **BLOCKED >15s** | **survives** | — |
  | D1 (`set -m` + group-first kill) | returned **4s** | dead | **1** ✓ |

  So `set -m` works on bash 3.2.57 (`GNU bash, version 3.2.57(1)-release (arm64-apple-darwin25)`), the exit contract survives, End state 2's delete-and-trace red is genuine, and stdout purity holds (`outbytes=0`). The "Terminated" job notice lands on **stderr** and is present in today's code too — not introduced by `set -m`.

- **End state 1's `grep -F` — CONFIRMED load-bearing.** Against the exact line D1 mandates: `grep -c` → **0** (false red), `grep -Fc` → **1**. See M2 for a correction to the plan's stated mechanism.

Probe-executed: `bash -c 'exit 1' 2>&1 | tee /dev/null` → `$?` = **0**; same for `exit 2` (R2). Patched-check re-run proving R1 resolved (below). CLAUDE.md budget probe wrote the Task 1.2 edits and ran the budget suite.

## Findings

### Major

**R1 — the three retirement greps are case-blind and line-wrap fragile** *(raised independently by three probes: `executable-proof`, `default-flip-old-absent`, `retirement-grep-robustness`)*. End states 3/9/12 pin the retirement of `briefly outlive`, `strictly stronger`, and `Exit codes and stdout are untouched` with case-sensitive single-line `grep -c`. Each false-greens on two evasions the tasks themselves are likely to produce, because those tasks rewrite exactly these hard-wrapped comment blocks (wrapped at ~79, ~84 and ~106 cols). The paired manual survey is a declared backstop that gate-audit reads SOFT and never holds on — so the case-blind grep was the **only** hold-capable retirement evidence. This is the recorded `retirement-grep-for-prose-needle-must-be-case-insensitive-or-sentence-initial-capitalization-evades-it` class, and its **third consecutive recurrence** in this campaign.

*Patched, then re-run — REMOVED from the finding set (probe-proven):*

| evasion | old check | patched `-ci` | patched wrap-tolerant |
|---|---|---|---|
| re-cased | **0** false green | **1** ✓ | — |
| line-wrapped | **0** false green | 0 | **1** ✓ |
| correct edit applied | 0 | **0** ✓ | **0** ✓ |

Both companions are load-bearing — neither alone closes both doors. Each returns exactly **1** at the base, so neither false-reds. End state 12's needle was additionally shortened to `stdout are untouched`, verified absent from the plan-mandated replacement text, so it survives the rewrite and still discriminates.

**R2 — the tee swallows the floor's own exit status** *(raised by `consistency-placeholders` and `dependency-feasibility`)*. **The most serious finding of this plan.** Every surface specifying the new tee (D3, Method, End state 5, Task 1.1(a), Task 1.4's header rewording) says only "teed to `<log>`" and never says how the floor's exit status is read across it. The natural rendering an LLM refiner produces — `assert-done-when.sh … 2>&1 | tee <log>` — yields **tee's** status:

```
bash -c 'exit 1' 2>&1 | tee /dev/null  ->  $? = 0
bash -c 'exit 2' 2>&1 | tee /dev/null  ->  $? = 0
```

`doneWhenFloorClause` routes on **nothing but** that code. So a status-swallowing tee collapses both failure codes into success — it **merges a task whose acceptance command failed**, and breaks the plan's own Pivotal "Frozen exit-code contract: … exit 2 never collapses into the floor status" in the very commit claiming to honour it.

The plan's cited `gate_log_path` precedent is **not** a counter-example (verified at this base): `gateCaptureClause` tees on the already-decided success path and nothing branches on a numeric exit there. The real in-repo precedent is the endstate-check dispatch, which already instructs a final `exit_code: <code>` line for exactly this reason.

*Patched:* new design row **D14**, threaded into D3's row, the Method, End state 5, Task 1.1(a), Task 1.1(e)'s card mirror, and Task 1.4's header rewording — redirect-then-read `$?`, or `${PIPESTATUS[0]}` when piping, branching on the captured code and never the pipeline's. Task 1.1(h) gains a clause-scoped assert pinning the preservation token so a status-swallowing tee cannot silently land. **Adjudicated** — a prose/design patch no executed probe re-measures.

**R3 — End state 16 seats only one of two undecidable halves** *(raised by `endstate-crosstask-scope`)*. `version-slots.test.mjs` proves lock-step and a monotonic **floor** (`cmpSemver(current, max) >= 0`), not a step. The plan seated "a bump landed at all" at audit_sha but left "the **next free patch** above the live integration base" decided by nothing — a skipped patch, a minor bump, or a version several patches ahead all satisfy the floor equally. *Patched* by mirroring the landed sibling's wording verbatim (plan 1 End state 12, lines 254–262, its own round-1 R8), which seats **both** halves on the execution-evidence seat. **Adjudicated.**

### Minor (auto-fixed / noted) — 15

**M1 (fixed) — the Context snapshot-base claim was factually false.** "the session worktree's spec-batch and checkpoint commits are docs-only and touch none of these surfaces" is wrong on both halves: ten non-docs files changed since `6fff2ee`, including real code (`dbcd793`) and two full releases; the release-slot family advanced **0.17.0 → 0.17.2**, and `README.md` + both `.claude-plugin/*.json` — Task 2.1's verbatim `Files:` list — are among them. Corrected in place, with the counter-check recorded: **every Phase-1 surface is byte-unchanged** between `6fff2ee` and the stacked base, and every cited anchor re-verified verbatim, so no Phase-1 rework is implied and Task 2.1 is unaffected by construction (it resolves from the live slots at land time).

**M2 (noted) — End state 1's mechanism attribution is wrong, its fix is right.** The plan blames "BSD grep treats the mid-pattern `$` as an anchor". The `grep` actually in scope here is a **shell function wrapping ugrep 7.5.0**, not BSD grep. The `-F` hardening is correct and load-bearing either way; only the stated cause is imprecise. Left as-is deliberately — the plan's own note says the spec is posterity and keeps its wording.

**Remaining 13 noted, not patched:** the D13/D3-registry presence-anywhere semantics (the plan already concedes placement is a backstop, honestly registered); End state 4's four-file grep spanning Tasks 1.1 and 1.4 (correctly a phase-level end state, not a task gate); multi-command `check:` tags on End states 1/8/11; `floor_diagnostic` three-surface scope prose; the Note 5 pin census; the Task 1.4 rebase-first note; the End state 9 survey assignment; A7's budget check framing; End state 14's citation-closure clause.

## Resolutions applied (grill decisions)

`--afk` — Lead self-adjudicated per the standing directive; nothing was unresolvable, so nothing escalated.

1. **R1** → harden all three OLD-absent checks to `-ci` **plus** a wrap-tolerant companion; shorten End state 12's needle; harden Task 1.4's sweep step to `grep -rin`. Re-run proved both evasions caught and no false-red → finding removed.
2. **R2** → add design row **D14** and thread exit-status preservation through all six carrying surfaces + a clause-scoped assert.
3. **R3** → mirror the landed sibling's both-halves audit_sha wording.
4. **M1** → correct the false Context claim, recording the scoped counter-check that keeps Phase 1 intact.

## Adjudications

| # | Finding | Resolution | Provenance |
|---|---|---|---|
| R2 | Tee swallows the floor's exit status | D14 added; threaded to 6 surfaces + Task 1.1(h) assert. Patched, not re-verified by an executed probe | AI-declared (`--afk`), executed evidence |
| R3 | End state 16 seats one of two halves | Mirrors landed sibling plan 1's End state 12 (its round-1 R8) | AI-declared (`--afk`), corpus-measured |
| M1 | Context snapshot-base claim false | Corrected in place; Phase-1 surfaces re-verified byte-unchanged | AI-declared (`--afk`), measured |

No version literal was adjudicated: Task 2.1 resolves the next free patch from the live slots at land time, and the plan already declares every version literal non-authoritative.

## Residual risk

- **The new-session-daemon ceiling stands** — unreachable on bash 3.2 (no `setsid`). A grandchild that double-forks into a new session survives the group kill. Ratified deferral; the rewritten residual note and the grandchild case's banner document it. Confirmed by the executed probe: the group kill contains a process **group**, nothing more.
- **D14 is prose, executed by an LLM refiner.** The Task 1.1(h) assert pins the token in the dispatched clause, but no test proves the refiner's actual rendering preserves status at runtime. The first real done-unmet in a live run is the true proof.
- **The manual same-scope survey halves stay SOFT** — four backstop rows, done-report-only evidence, never a hold. R1's hardening narrows what they must catch but does not replace them.
- **`grep` identity is environment-dependent.** M2's finding generalises: a `/war` worker whose shell lacks the ugrep-wrapping function may see different `grep` semantics. `-F` and `-i` are safe under every implementation in scope; unanchored `$`-bearing patterns are not.
