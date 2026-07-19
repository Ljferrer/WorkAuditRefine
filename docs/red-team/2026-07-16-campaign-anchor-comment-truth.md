# Red-team report — 2026-07-16-campaign-anchor-comment-truth

**Verdict: CLEARED** (after 3 rounds — round 0 BLOCKED, round 1 re-BLOCKED on the round-0
patches themselves, round 2 clean: 7/7 probes pass, 0 blockers, 0 needsDecision, 0 minors).
Plan: `docs/plans/2026-07-16-campaign-anchor-comment-truth.md`
Source spec: `docs/specs/2026-07-16-campaign-anchor-comment-truth-design.md`
Artifact kind: `impl-plan`. Run: `--afk` (campaign 2026-07-16-engine-integrity-and-sweep-debt,
plan 5/5, resumed 2026-07-19 after a halt-and-hold).
**Base:** `3d741c9` (plan-4 tip = the full stacked base; plans 1–4 landed and, by resume time,
merged to master — `3d741c9` verified an ancestor of `origin/master`).

## Round history (and the mid-run loss this report survives)

- **Round 0** (2026-07-17, `wf_4fbb2b98-f1b`, 8 probes: 6 spine + `anchor-preconditions` +
  `bare-repo-contract-proof`): **BLOCKED** — 3 blockers (B1/B2/B3 below), 9 Minors collapsing
  to 3 fix families.
- **Round 1** (2026-07-17, `wf_3533ce47-a44`, spine + `reverify-adr-shape-and-ledger-contract`):
  **re-BLOCKED** — the Lead's round-0 patches were spliced/incomplete: End state 3 left
  mandating both shapes with a sentence truncated mid-clause; Task 1.1's ADR bullet still
  mandated the reversed in-place rewrite; End states 5/10 became jointly unpassable against the
  patched End state 3. The campaign halt-and-hold fired here (Lead out of context).
- **Loss + recovery (2026-07-19):** the worktree holding the uncommitted round-0/1 patches was
  purged with its /tmp scratchpad. Both rounds' full verdicts were recovered from the prior
  session's workflow state (`wf_4fbb2b98-f1b.json`, `wf_3533ce47-a44.json`); the plan was
  **re-patched from the pristine base in one coherent pass** (never re-splicing the
  intermediate state), applying every adjudication and every round-1 finding, including three
  the campaign checkpoint had not recorded (Open-decisions Q28 mislabel; `2026-07-17` date
  literal → `<land-date>` placeholder; header notice undercounting the spec deviations).
- **Round 2** (2026-07-19, `wf_0a080a3a-fcf`, spine + the reverify probe re-targeted at the
  re-patch): **CLEARED** — 7/7 pass (2 executed, 5 analyzed), findings `[]` across the board.

## Executed proof (throwaway repos/copies, git 2.50.1)

Confirmed across rounds: `git -C <bare> rev-parse --path-format=absolute --git-common-dir`
exits 0 printing the bare git dir, and a **subdirectory of a bare repo resolves upward to it**;
`--is-inside-work-tree` exits 0 printing `false` in a bare repo (exit code cannot discriminate);
non-repo probe exits 128 empty; `resolveCampaignDir` measured: cwd in a bare repo →
**anchored absolute** path under the bare git dir's parent (probe success — NOT fail-open);
cwd outside any repo → relative path returned untouched (genuine fail-open). Commit `cd915c0`
(PR #922) re-inspected: a **pure append** — new dated `## Amendment (2026-07-15)` section +
Status-line pointer, zero ratified body prose modified. Round-2 sandboxes: a full repo copy
(`sb` copies of the base worktree) + throwaway bare/non-repo probe dirs; the base repo was
never mutated by any probe.

## Findings and resolutions applied

- **B1+B2 (round 0, Major×2, one needsDecision — ADR 0016 edit shape):** the draft mandated an
  **in-place rewrite** of the ratified 2026-07-15 amendment's parenthetical, citing PR #922 as
  in-place precedent. The precedent claim was **proven false** (see above — #922 is the append
  precedent), and landed plan 1 states the dated-amendment convention three times on this very
  base. **Adjudicated (append):** the fix is an appended `## Amendment (<land-date>)` section,
  ratified 2026-07-15 text byte-unchanged, Status line repointed only; the per-sentence bound
  is retired. Propagated to Method, End state 3, Task 1.1's ADR bullet, Q4, Q28, Open
  decisions, Purpose, and the header notice.
- **B3 (round 0, Major — one contract for three sites):** the plan mandated the hook's
  three-part contract ("consumers still behave fail-open one level down") at
  `resolveCampaignDir` too; **measured false** at that site (bare ⇒ anchored absolute, above).
  **Adjudicated (split):** hook keeps the three-part contract; the ledger takes a
  site-specific contract (probe failure ⇒ relative path untouched = fail-open; bare ⇒ probe
  success, anchored absolute, not fail-open, merely harmless — and the hook's rationale is
  never copied there). Propagated to Method, End state 2, Task 1.1's ledger bullet, Q30, Open
  decisions, and recorded as a conscious spec-§3 deviation in the header notice.
- **Round-1 Criticals (C1–C3):** all three were artifacts of the round-0 patch application
  (splice damage, one stale worker-facing surface, End states 5/10 vs 3 jointly unpassable).
  Resolved by the pristine re-patch: End state 3 rewritten whole to the append shape; Task
  1.1's ADR bullet rewritten; End state 5's ADR arm scoped to the **new** amendment section
  only; End state 10 reclassifies the ADR's ratified amendment as a sanctioned carrier
  (supersession, not removal), with clause (a) naming only the hook and ledger as
  claim-dropping sites.
- **Minors (round 0/1, all applied):** End state 9's justification corrected (the ledger suite
  **does** exercise `resolveCampaignDir` behaviorally end-to-end via the CLI; the only
  text-level scan is the bundled-routine token sweep, which comment rewording must not — and
  does not — trip); End state 2's benign-`bare` enumeration corrected (`bare assert.throws`
  lives in the sibling test file — replaced with the in-file `const bare` match variable);
  End state 10(c) reclassifies `docs/specs/2026-07-16-aftermath-class1-…` under
  "not a repo learning/test"; End state 11's lesson-note wording matched to the split
  contracts + appended amendment; `<land-date>` placeholder replaces the hard 2026-07-17
  literal; Q4 marked superseded by Q28; Open decisions relabels Q28 as red-team-reversed.

## Escape-guard

`assert-no-repo-escape.sh --repo <base worktree>` reported exactly one modified working-tree
file: the plan itself — the Lead's deliberate uncommitted patch (this commit), not an agent
escape. Verified: porcelain shows only that file; the diff (+104/−58) contains no sandbox
paths or probe artifacts; all executed probes ran in copies/throwaway dirs.

## Verdict

**CLEARED.** Gate output (round 2): `{"verdict":"CLEARED","blockers":[],"needsDecision":[],
"minors":[],"summary":{"probes":7,"pass":7,"fail":0,"warn":0,"expected":7,"onTarget":7}}`.
The plan is executable as patched; its two backstops stand (prose-truth read → this
verification pass + landing-PR review; out-of-footprint carrier stragglers → Lead files
follow-ups at phase close).
