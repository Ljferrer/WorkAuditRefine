# /war Setup — branch-gated procedures

Verbatim evictions from `skills/war/SKILL.md` (prompt-surface simplification, spec §4.3; the moved
blocks below are byte-identical to their pre-eviction SKILL.md text). Each block is read on the
trigger named at its eviction site; the surrounding Setup / launch steps stay in the SKILL. Positional
words inside the moved blocks ("above", "below") refer to their original SKILL.md positions.

## Crash-heal pre-flight (Setup step 2)

Trigger: `git worktree list` shows a leftover `p*-publication` path or the desired working branch
checked out anywhere unexpected.

**Crash-heal pre-flight (before `resolve-working-branch`):** scan `git worktree list` for a leftover `p*-publication` path (a Gate-2 publication worktree a prior crash left behind) or the desired working branch checked out anywhere unexpected — clean ⇒ `bash ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/provision-worktrees.sh remove-publication-worktree <path>`; dirty ⇒ escalate to the operator. A leaked publication checkout would otherwise make `resolve-working-branch` see a collision and silently fork a fresh `dev/<date>-<slug>` branch (the silent-campaign-fork hazard). 

## `--afk` sanity floor (Setup step 3 — test-floor proposal)

Trigger: an `--afk` run is about to take the proposed test-floor glob set.

     - **`--afk` sanity floor.** Take the proposal only if **each token matches ≥ 1 existing repo file** (the same `Glob` sample); otherwise fall back to `null` with a ledger note that records the **rejected proposal verbatim** (the full proposed token set) plus its **zero-match tokens** (which tokens matched no file) — this pending-proposal record is exactly what the per-phase launch re-check (below) reads, and adopts once every token matches and the value re-passes the validator's `overrides.testPattern` check. The residual — an over-wide but file-matching pattern that admits a test the gate ignores — is **caught downstream** by the post-merge gate-audit **`execution-evidence`** pass: a mapped test provably unrun at the confirmed tip is a **HARD** finding.

## Per-phase pending-proposal re-check (phase launch)

Trigger: at a phase launch, the ledger carries a pending rejected `testPattern` proposal (the `--afk`
sanity floor's fallback note) and the value to thread is still `null`.

**Per-phase pending-proposal re-check.** `overrides.testPattern` is **per-phase-resolved**, not decided once at Setup and pinned unchanged for the run: before threading it, when the ledger carries a **pending rejected proposal** (the `--afk` sanity floor's fallback note, above) **and** the value to thread is still `null`, re-run the sanity floor's own rule — **each token matches ≥ 1 existing repo file** (the same `Glob` sample) — against the **current** tree. Every token now matching ⇒ before adopting, **re-assert the validator's full `overrides.testPattern` check** — the glob-safe charset rule `war-config.mjs`'s `validate()` enforces (only `[A-Za-z0-9_.*?/[] -]`; no quotes, `;`, backticks, `$`, or newlines; non-empty) together with its per-token glob-**shape** checks, all surfaced by one run with one non-zero exit — against the proposal string, e.g. `node ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/war-config.mjs --stdin` on `{"overrides":{"testPattern":"<proposal>"}}`: the proposal never rode that key while rejected, so `validate()` never saw it, and it is about to be embedded single-quoted into agent shell lines — the exact surface the guard exists for. Validator-clean ⇒ **adopt** the proposal as this and every subsequent phase's `plan.testPattern`, appending an **adoption note** to the ledger. Validator-**failing** (any error — charset or per-token shape) ⇒ the proposal is **never** adopted — the ledger note records the failure and **closes** the proposal (a validator violation is a property of the proposal string, not the tree — it cannot self-heal, so it is never re-checked again). Not every token matching ⇒ keep `null`; the proposal stays pending for the next phase launch. Adoption is **monotonic** (`null` → the Setup proposal, once) — never a freshly minted pattern, never a revocation, and never a new interactive ask; scoped entirely to the `--afk` sanity-floor fallback path (interactive Setup has no mechanical rejection to re-check). Like every other ledger note, this one is a **lagging record, not a resume authority** (git > labels > ledger, ADR 0008). 
