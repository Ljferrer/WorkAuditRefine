# Red-team report — docs/plans/2026-08-06-redteam-rounds-config-telemetry.md

- **Verdict:** ADJUDICATED (gate-emitted; ADR 0043 — every blocker patched and adjudication-rowed, not probe-re-verified)
- **Rounds:** 1
- **Date:** 2026-08-16 · **Round limit:** 3 (config `run.redteamRoundLimit`) · **routeUpstream:** false
- **Base:** the **stacked** tip `879c62d` on `dev/2026-08-06-verdict-adjudication-integrity` (PR #1448 still open, so plan 7 stacks per ADR 0011 rather than cutting from master `a489067`)
- **artifactKind:** impl-plan (merged arm — Part 1 is its own source of truth)
- **Escape guard:** pre-run `--snapshot` exit 0 · post-run `--baseline` exit 0 — no probe residue, no ref deltas
- **ff-topology:** derived **vacuous** — the plan anchors no merge-commit topology

## Harness correction — probes ran against the wrong tip, validity re-established

The run passed `repo` as the main checkout, which sits on **master `a489067`** — not the stacked base
`879c62d`. The recorded lesson `war-branch-base-off-latest-master-not-prior-tip` gives the exact
validity test: *a red-team run against a prior tip stays valid iff the plan's target files are
byte-identical between that tip and the chosen base.* Diff-checked:

- `skills/war-campaign/`, `skills/war-review/`, `skills/war-room/`, `docs/learnings/archive/` — **byte-identical** between the two tips ⇒ 14 of 15 probes remain valid.
- `skills/red-team/assets/workflow-scaffold.test.mjs` — **differs** (master carries 0 `(a) Proceed` hits; the stacked base carries 5) ⇒ **`guard-green-under-task12-edits` was invalidated** and was **re-run by the Lead at `879c62d`**.

**Re-verification result (the 5→7 coupling, the plan's highest-risk claim).** In a
`git clone --no-hardlinks` sandbox at `879c62d`, Task 1.2's End-state-5 arm-(c) stamp edit was applied
verbatim and plan 6's guard re-run: **77/77 green, before and after.** End state 11's
"green by construction" claim **holds**. Mechanism: the surface-4 partition uses `.includes()` on the
(b)/(c) lines, so extra code spans there are harmless; the exact-`deepEqual` risk lives only on the
arm-(a) enumeration segment before its first `(`, which Task 1.2 does not touch.

## Attack surface / Executed proof

15/15 probes on target, 0 dropped, 0 off-target: 6 spine + 9 bespoke (`guard-green-under-task12-edits`,
`cli-refusal-pre-and-post`, `sweep-idempotence-semantics`, `endstate-command-diff`, `stacked-base-drift`,
`percommit-issue-citation-phrasing`, `default-flip-old-absent`, `unguarded-new-mirror`,
`guard-split-deps-edge`). 6 executed in throwaway clones, 9 analyzed. All three mandatory ADR-0025
drift-guard spine probes ran; none vacuous. 25 agents, 0 errors.

Gate accounting: **18 blockers, 8 needsDecision, 12 minors → 20 distinct roots**, all patched.

## The load-bearing finding — the plan's own carve-out re-mints the defect it exists to close

D2 sanctioned "a landed entry does not block (a genuine re-run of a landed plan is a legitimate new
queue item)". Executed against a guarded scratch implementation, that arm reproduces **Context 1
verbatim** and destroys real state:

1. Plan `a.md` lands run 1 — `status: landed, branch: campaign/a-run1, pr: 101, sha: aaa1111, redteamRounds: 3`.
2. Re-add + sweep appends entry #2, `status: queued`. `next()` correctly returns #2.
3. The Lead records the re-run the only way `record()` accepts — by plan path. `record()` is
   `ledger.plans.find(p => p.plan === target)`, **first-match**, so it hits **entry #1** and overwrites
   run 1's `branch`/`pr`/`sha`/`redteamRounds`.
4. Entry #2 stays `queued` **forever**, so `is_active` (`[.plans[] | select(.status != "landed")] | length > 0`)
   keeps the campaign active permanently.

Constraint 1 and the Non-goals forbid fixing this in `record()`/`next()`, so it cannot be closed
downstream — and End state 2's mandated test would have **enshrined the poisoning append as correct**.
Both `record()` and `next()` first-match semantics were re-read from source at the base and confirm the
mechanism.

**Adjudicated (AI-declared, AFK):** D2 reversed — **a landed entry also blocks the append**, skip +
`files` refresh, reported under `skipped: [{ plan, reason: 'landed' }]`. Chosen over the probe's
option (a) (reset the landed entry to `queued`) because that variant *destroys run 1's landed record*;
leaving the landed entry byte-intact apart from `files` keeps one entry per path, a drainable queue,
and the history. A deliberate re-run of a landed plan becomes an explicit operator act, never a sweep
side effect. End state 2 reversed to match and must assert **both** halves.

## Other roots patched

**Check defects (the plan's gates could not detect its own work).**
- **ES4** retirement grep was case-sensitive — a sentence-initial `// Proceed arm:` survivor evades it entirely and the End state reads green with the defect live (reproduced). Now `-i`.
- **ES5** was non-discriminating: `grep -n 'redteamRounds' war-campaign/SKILL.md` exits 0 with 4 hits at base and 0 with 5 after. Re-anchored to the arm-(c) line (0 → 1). *Lead-reproduced independently.*
- **ES6/9/10/11/12 were two-command pairs.** The land-barrier dispatch runs and artifacts **exactly one command per condition row**, so the second half of every pair was silently uncaptured. All fused into single commands.
- **ES14's `check:` was not a runnable command at all** — `gh issue view <N> --comments` parses `<N>` as a shell **input redirection**, becoming `gh issue view --comments < N` and dying before `gh` starts. It also verified issue-close comments, a *different proposition* from commit citation. Replaced with a real range loop.
- **ES9/ES10 had NEW-present halves with no OLD-absent half** — an append-only edit satisfied the whole gate with the retired `campaigns/<id>/ledger.json` and `prior campaign ledgers` sources still live. OLD-absent halves added.

**ES14 per-commit phrasing — the third plan in a row.** Same defect corrected in plan 6: the wording
invites a per-commit reading the repo has already ratified against. Reworded to the range-level rule
naming the two by-construction non-citing commit classes. **This is now a systematic authoring
artifact, not a one-off — the remaining plans should be swept for it.**

**Design/coverage roots.**
- **D1's prose half had zero End-state coverage** — D1's remedy is explicitly "Both", but no condition checked the prose, so the plan could be Done with the guard landed and the SKILL.md still mandating the pointless re-add loop. New **End state 16**.
- **Scope self-contradiction**: D1 and the Method say arms **(b)/(c)**; the issue→task map and Task 1.2's slice qualified arm **(b) alone**. Arm (c) now carries the qualification too, on its single physical line so constraint 8 and plan 6's guard both hold.
- **A fifth sentence goes false and no task edited it** — step 1's "Sweep + select." bullet still claims sweep "inserts" every drop. Added as a fifth Task 1.2 edit.
- **D5 destroyed a live safety signal**: "contention-check only genuinely-new entries" meant a refreshed footprint's **new** paths were never checked against anything — even though D4/A2 exist *because* the regrill may have changed `Files:`. Corrected to check refreshed entries too, minus their own prior copy.
- **`added` membership was unpinned** and the plan's two statements pulled opposite ways. Pinned: `added` lists only genuinely-new entries; skipped drops appear only under `skipped`.
- **`/war-campaign resume` does not exist** (two probes agreed). The file's Invocation block lists exactly three forms; the resume form is the bare invocation. Corrected at both sites — unguarded prose that would have landed a fictional command into campaign doctrine.
- **Two unguarded mirrors (ADR 0025).** Task 1.4 shipped three hand-copied constants plus a prose restatement of `routeUpstream()`'s arithmetic with no guard in the task; `war-config.test.mjs` added to its `Files:` with an extraction pin, and it gains a real `Done when`. Task 1.2 grew an unguarded prose mirror of `makePlanEntry`'s field set; ES7 now names the maintained home (ADR 0046) instead of re-enumerating.

## Adjudications

| # | Adjudicated value | Supersedes | Provenance |
|---|---|---|---|
| 1 | D2: a **landed** entry also blocks the append (skip + `files` refresh, `reason: 'landed'`) | "a landed entry does not block … a legitimate new queue item" | AI-declared (2026-08-16), executed proof; chosen over reset-to-queued to preserve the landed record |
| 2 | ES2 reversed to assert no second entry **and** landed fields unchanged | "appends a fresh queued entry" | AI-declared (2026-08-16) |
| 3 | ES6/9/10/11/12 fused to one command each | two-command pairs | AI-declared (2026-08-16), dispatch captures one per row |
| 4 | ES14 range-level + runnable range loop | per-commit phrasing + `gh issue view <N>` | AI-declared (2026-08-16), ratified lesson |
| 5 | ES4 `-i`; ES5 anchored to arm (c) | case-sensitive / non-discriminating forms | AI-declared (2026-08-16), both reproduced |
| 6 | D5 checks refreshed entries minus their own prior copy | "only over genuinely-new entries" | AI-declared (2026-08-16) |
| 7 | `added` = genuinely-new only | unpinned | AI-declared (2026-08-16) |
| 8 | Task 1.4 gains `war-config.test.mjs` + a real `Done when`; ES7 cites the maintained home | unguarded mirrors | AI-declared (2026-08-16), ADR 0025 |

## Residual risk (12 minors, auto-noted)

- The D2 reversal means a genuine re-run of a landed plan now requires an explicit operator act. That is the intended trade — surfaced here rather than buried, and reversible by a plan edit.
- Task 1.4's `routeUpstream()` consequence clause remains prose; the extraction pin binds the *default and economy values*, not the predicate, which is the unguardable half.
- The harness base error above is a Lead defect, not a plan defect; the invalidated probe was re-run and its claim holds.

## Verdict

**ADJUDICATED** — gate-emitted at rounds 1 of 3, `routeUpstream: false`, coverage whole (15/15 on
target, 0 dropped, 0 off-target). All 18 blockers patched in place and stamped `adjudicated: true`;
none was probe-re-verified, so the run terminates ADJUDICATED rather than CLEARED. Every rewritten
check was **executed at the base** by the Lead — seven confirmed discriminating (red at base), ES11
confirmed correctly green.
