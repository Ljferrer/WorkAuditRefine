# Issue #2485 RCA: pin-transfer holds, empty recovery, stale install

Research record for [#2485](https://github.com/Ljferrer/WorkAuditRefine/issues/2485). Data as of 2026-10-28. Input to a `/war-strategy` plan. Not a plan and not a fix.

Method: six opus readers (engine code, journals, task-integrated replay, provision, history and doctrine, related issues), two adversarial refuters per claim, one completeness critic, one synthesizer. 84 claims verified: 82 stand, 1 contested, 1 refuted. Field evidence comes from the workflow journals of the three Aligned runs, the WAR run behind #2412, and one AutoIndex run. Replay scripts and outputs sit beside this file.

## Summary

1. Bug 1 (five `pin-transfer:unverified` holds) has one engine cause. An ace worker committed and pushed a new commit, then returned `status: blocked`. The engine treats a blocked ace as "no commit", so the new commit is neither reverted nor audited. The merge-slot proof then sees that the branch tip's tree differs from the approved tree and refuses. The refusal is correct. The escalation note names the wrong cause.
2. Bug 2 (`preMerged: []` on the sanctioned recovery) has its own cause. Every merged task fails `task-integrated.sh`, because Git does not parse the `WAR-Task` lines. The lines are present. They sit in a paragraph that is not the last one, or they are missing from ace commits, which never receive the provenance clause.
3. The `empty-unmatched` holds and the dep-failed cascade follow from bug 2 alone.
4. Bug 3 (stale `node_modules`) is a third gap. Provision ran. The branch was checked out at its old tip, the merge-slot rebase pulled in a sibling's lockfile change, and nothing re-provisions after that rebase.
5. The issue's two hypotheses (no-op rebase, `remote_sha` null compare) are refuted for these holds.
6. The issue's "Expected" bullet 1 is unsafe. Equal patch ids span the unjudged commit on both sides. The tree check is the only guard. Operators already merged the five unjudged commits by hand, so they now sit on Aligned master.

## Bug 1: the blocked-but-committed ace

### The five holds

| run (workflow) | task | approved sha | blocked ace (dispatch, sha) | proof failure |
|---|---|---|---|---|
| 0904ec15 (wf_bc3dec9d-0e3) | t1-6 | 663f635d (panel) | ace:polish:t1-6:a1, 79f095a6 | tree 04d4b916 != a3c97430, 4 of 4 attempts |
| 0904ec15 (wf_bc3dec9d-0e3) | t1-7 | 151c7d7e (approved ace a3) | ace:reentry:t1-7:a4, 0154b92d | d11b8477 != 262ab477, 4 of 4. Real rebase to 1b14b0b9 |
| dee61ebe recovery (wf_da88f0a6-75f) | t1-13 | 4e6460a4 (approved subset a2) | ace:reentry:t1-13:a3, 293d2e40 | eb1233c1 != abc05e13, 4 of 4 |
| 4db2fccb p1 (wf_e9e56b5b-585) | t1-8 | b67dfe14 (panel) | ace:polish:t1-8:a1, ead67f93 | cb8e16b5 != a1961c99, 4 of 4. Real rebase to 29bcefa9 |
| 4db2fccb p2 (wf_7d3171c8-829) | t2-2 | b65aa329 (panel) | ace:polish:t2-2:a1, 5ffeb15c | e2c8336d != 15db8fad, 4 of 4 |
| WAR afbb9f2a (wf_72bd8b1d-095), #2412 row 1 | 2.4 | 795376d9 (approved ace a2) | ace:reentry:2.4:a3, e9e9ff2c | 0bd5c3ab != 996d9e1f, 6 of 6 |
| AutoIndex (wf_1a80b62a-9c0), 2026-10-07, unfiled | t2-3 | not in reports | ace:polish:t2-3:a1, f9e71b3b | 8400d25d != c10d222d, 6 of 6 |

In every row the blocked commit is a direct child of the approved commit. In every row no `ace-gate` or `audit` dispatch follows the blocked ace. Control census: 18 of 18 Aligned tasks whose last ace returned `implemented`, or that had no ace, needed one `git-pin` and merged. All 5 whose last ace returned `blocked` needed `roundLimit` git-pins and escalated.

A scan of every workflow journal on this machine found 13 ace results with `status: blocked` plus a `head_sha`. Seven held (the rows above). The other six returned the unchanged pre-ace tip and merged with one git-pin.

### Causal chain

1. The panel approves the task at X.
2. The ace prompts (ADVISORY POLISH, ACE BISECTION SUBSET, ACE RE-ENTRY BATCH, and the chain clause) say: put the `Ace-Charge` trailer "as its OWN final paragraph".
3. The Claude Code harness injects an attribution reminder into every agent session (550 of 550 Aligned sessions). It says to end commit messages with a `Co-Authored-By` line. Later runs add `Claude-Session`.
4. The worker writes both blocks in a `git commit -F -` heredoc: an `Ace-Charge` paragraph, then a separate `Co-Authored-By` paragraph. Git parses trailers only from the last paragraph. `git interpret-trailers --parse` sees only `Co-Authored-By`. No git hook or template is involved.
5. The two rules are compatible. One final block holding `Ace-Charge` and then `Co-Authored-By` parses correctly (5ef973bf, 795376d9). The reminder also says the user's own instructions take precedence. The WAR wording "OWN final paragraph" causes the split.
6. Every blocked worker pushed before it checked its trailers. The only repair left was amend plus force push. Three rules forbid that: the worker card's force-with-lease carve-out (dispatch rebase only), the ace prompts' "ONE commit only", and the subset and re-entry "never any shared ref or history rewrite" clause. #2380 row 3 shows the harness classifier denying even the sanctioned force-with-lease.
7. The worker returns `status: blocked` with the pushed `head_sha` Y. The WORKER_RESULT contract does not tie `head_sha` to `status`. Nothing says `blocked` means no commit.
8. The engine assumes it does. In `aceStage`, `aceWhy = deathOf(ace) || blockedReason(ace)` is truthy for any blocked result. The success body under `if (!aceWhy && typeof ace.head_sha === 'string' && ace.head_sha)` is skipped. The else arm only routes a "failed absorb" note to the sweep. It skips the absorb charge, `chainRecordFix`, `aceReaudit`, `r.aceSha`, `r.aceReverted` and `r.reentryBase`. The task keeps verdict `approve`. `aceBisect` (`swWhy`) and `aceReentry` (`rwWhy`) abandon the same way. The guard dates from 0ec02222 (2026-07-01).
9. No arm compares `ace.head_sha` or the real branch tip with the approved tip before the merge slot. The merge dispatch merges the branch tip, not the approved sha.
10. The pin-transfer probe measures the whole branch. Both ranges include Y, so patch ids and content ids match and the probe reports `transferred`.
11. `verifyPinTransfer` sets `approved = r.aceSha || seats[].audit_sha` (X) and `content_sha = BEFORE.source_sha` (Y). The clause `proof.approved_tree !== proof.content_tree` fires. It was the only failing clause in all 26 attempts (20 Aligned, 6 WAR). The `remote_sha` throw arm sits after that `continue` and was never reached.
12. The loop retries `roundLimit` times (sonnet first, opus after, via `spawnRefinerRecovery`), then returns a bare null. The merge slot pushes `escalate` with the note "pin transfer has no independent Git proof of the approved content and reported destination" and logs `pin-transfer:unverified`. Fifteen opus dispatches were spent on a deterministic fact.

### What the trailer layout does and does not decide

12 of 38 Aligned ace commits have the unparsable layout. Seven of those workers returned `implemented`, were re-audited, and merged. Five returned `blocked` and held. Only the blocked ones mention a "Self-confound check" in their notes. The AutoIndex t2-3 hold has a different worker-side cause: its commit message came from a sibling task through a shared scratchpad file and carries the wrong `WAR-Task` trailer, now on AutoIndex main as 86fe9707. The engine defect is "blocked ace that committed", whatever the worker-side cause.

### History

The tree check first appears in f53c979c (2026-09-09). From 0ec02222 to 148837c3 there was no probe. From 148837c3 to f53c979c the probe read a blocked-but-committed ace as `transferred` and merged it without a panel judgment. Local journals hold no ace-labelled results before 2026-09, so that exposure cannot be measured.

### Other silent-merge arms checked

Audit pin reconciliation binds every judged sha to the branch tip at judgment time. Every task merge passes the tree check. The sweep and terminal merges have no approved-versus-tip compare, but nothing commits to the polish branch between judgment and merge. The hole is confined to the three ace arms. One narrow residual: the final segmented merge does not bind its source to `pinProof.head_sha` (a TOCTOU with no field evidence).

## Bug 2: recovery cannot prove any merged task

The provision barrier in wf_da88f0a6-75f ran `task-integrated.sh` on all 13 tasks. All returned exit 1 `NO_TASK_PROOF`. A replay of master's helper against the barrier-time refs (integration d5cadab, phase base d9347c6) reproduces all 13 markers (`task-integrated-replay.txt`).

| task | merged | failing rule | layout cause | proves if Ace-Charge counted | proves if raw WAR-Task line counted |
|---|---|---|---|---|---|
| t1-1 | yes | mixed history (3) | 2968e830 Ace-Charge unparsed | no | yes |
| t1-2 | yes | mixed history (3) | ace commit with no WAR-Task | yes | yes |
| t1-3 | yes | no WAR-Task commit (2) | 2ac97a2: WAR-Task line, then a Co-Authored-By paragraph | yes | yes |
| t1-4 | yes | no WAR-Task commit (2) | 1574d40, same layout | yes | yes |
| t1-5 | yes | mixed history (3) | 88c6bf0 and ff453646 unparsed, tip 5c40c21 is the engine's forward revert | no | no |
| t1-8 | yes | mixed history (3) | fix commit 6db0eef: WAR-Task present, unparsed | no | yes |
| t1-9 | yes | mixed history (3) | ace commit with no WAR-Task | yes | yes |
| t1-10 | yes | mixed history (3) | 163221b and ee258ca unparsed | no | yes |
| t1-12 | yes | mixed history (3) | ace commit with no WAR-Task | yes | yes |
| t1-6, t1-7 | no | not integrated (1) | correct refusal | | |
| t1-11 | no | zero-commit branch (2) | correct refusal | | |
| t1-13 | no | absent branch | correct refusal | | |

Facts:
- All 9 merged first-pass commits contain a literal `WAR-Task: <branch>` line. Git does not parse it when a later paragraph ends the message.
- Rule 4 (owned-path content) never failed. All merges were fast-forward.
- `taskProvenanceClause` reaches only the first-pass and fix-round prompts. The ace, floor-fix, polish and terminal prompts omit it (#2327). The standing worker card step 5 still asks for `WAR-Task` on every commit. So bug 2 has two independent causes: the paragraph layout, and the missing clause on ace dispatches. Fixing either alone leaves tasks unproven (`task-integrated-variants.txt`).
- t1-5's tip is the engine's forward revert (`git revert --no-edit`). It carries no trailer. A commit-msg hook does not fire on `git revert --no-edit` (git 2.54). No trailer-only fix proves t1-5.
- The same layout fault undercounts the absorb-charge seed. t1-7 used 4 charges and was seeded 2. t1-6 was seeded 0 despite 79f095a6.
- WAR repo history since 2026-09-10: 117 commits carry a raw `WAR-Task` line, 66 parse. Of the 51 that fail, 35 end in an `Ace-Charge` or `Ace-Subset` paragraph and 16 end in a `Co-Authored-By` paragraph.
- Doctrine drift: ADR 0035 Decision item 2 still describes the old ancestor-plus-`rev-list --count` rule, which ADR 0008's amendment and `refiner-recovery.md` forbid.

Status: the per-task rows come from one reader's replay. The scripts beside this file reproduce them. They were not in the cross-verified claim set.

## Downstream consequences

**Empty-unmatched (t1-2, t1-3, t1-4).** With `preMerged: []`, each branch was checked out at an old tip already on the integration branch. Each worker made no commit, so `head_sha` equals the dispatch base. At pin transfer N=0, the probe returns `empty-unmatched`, a hard escalation. The `already_upstream` arm needs N>0, so `preMerged` is the only path that can adopt an ancestor branch.

**Dep-failed (8 tasks in the recovery, t2-1 in 4db2fccb p2).** Pure consequence of the holds.

**Stale `node_modules` (t1-1 gate_failed in the recovery).**
- Provision ran. provision-run:t1-1 executed the pinned `npm ci` and returned ok.
- The worktree path was new. The branch was reused. `ensure-worktree`'s existing-branch arm checks out the old tip 2968e83 and ignores the integration-tip argument.
- 2968e83's lockfile has no `expo-secure-store`. The dependency came from t1-2, the importing suites from t1-10. Both reached the worktree only when the pin-transfer probe rebased it to a27ea749. No dispatch re-provisions after that rebase. The merge-task, environment-proceed and baseline-proceed prompts carry no provision clause.
- `_refinery` had no `node_modules`, so the base re-run could not run there. `gate-failure-classification.md` claims `_refinery` is gate-capable. Only the land barrier provisions it.
- The same failure hit fresh worktrees in normal runs (wf_e9e56b5b-585 merge:t1-2 and merge:t1-7, wf_bc3dec9d-0e3 work:t1-12). Agents ran `npm ci` on their own there.
- The ADR 0040 environment-proceed path cannot fix this class. It re-runs the gate in the same stale worktree.
- Status: one reader report, partly truncated in synthesis. Not cross-verified.

**Unjudged commits on default branches.** All five Aligned ace patches are on Aligned master (79f095a6, 0154b92d, ead67f93 by patch id as 00ae8a8, 2a233e2, 6c46995; 293d2e40 and 5ffeb15c by ancestry). The engine's hold worked. The misleading note plus the issue's own expectation led the operator to merge by hand.

## What the issue got wrong

| issue text | finding |
|---|---|
| No-op rebase mishandled | Refuted. t1-7 and t1-8 were real rebases. The tree check does not depend on the rebase. |
| `remote_sha` null compare (#2325) | Refuted for these holds. For t2-2 both sides were explicit nulls and matched. A #2325 throw gives `held:workflow-error`, not the escalate note. The hazard stays latent. |
| Expected 1: transferred plus equal patch ids should merge | Unsafe. That merges the unjudged commit. |
| Only 7 of 39 commits carry WAR-Task | The lines are present. Git does not parse them. |
| Stale node_modules in a reused worktree | The worktree was new and provision ran. The branch tip was stale and the rebase was unprovisioned. |
| Three tasks across two runs | Five in Aligned, plus WAR 2.4 (#2412 row 1) and the unfiled AutoIndex t2-3. |
| #2412 row 1 "empty agent result" | Refuted. That dispatch was ace:reentry:2.3:a2. Task 2.4 has the #2485 signature. |

## Related issues

| issue | relation | one line |
|---|---|---|
| #2412 row 1 | same defect | Task 2.4 blocked ace at e9e9ff2c, then 6 tree-mismatch git-pins |
| #2327 | bug 2 family | Trailer prompt-only, ace dispatches omit it. Its fix elements prove 5 or 8 of 9 tasks, never t1-5 |
| #2325, #2308, #2309 | same function, different check | `remote_sha` compare throws. Latent, masked here |
| #1973 | context | `already_upstream` fail-closed arm. Why an ancestor branch cannot adopt at the merge slot |
| #2330 | sibling | Fix loop's last round never audited. Same committed-but-unjudged family |
| #2380 row 3 | constraint | Harness classifier denies the sanctioned force-with-lease. Worker repair is unreliable |
| #2006, #2206 | doctrine | Old rev-list conjunct. ADR 0035 item 2 drift |
| #1770 | context | Adopted task gives an empty three-dot diff. Seen on t1-2, t1-3, t1-4 |
| #2346 | adjacent to bug 3 | Worktree reuse hygiene. Same "reused state not re-provisioned" surface |
| #2123 | adjacent to bug 2 | Worker card claims its rules ride every ace prompt. They do not |
| #2442 rows 2 and 3, #2326, #2329, #2379 | ace family, unclassified | Dead ace-gate reverts, no backgrounded-gate continuation, batch reverted on incomplete gate |
| #2473, #2484, #1916, #1910 | not assessed | |

## Constraints a fix must respect

- ADR 0013 and ADR 0012: the ace path never turns a mergeable task into a hold. The #2485 holds already break this. A relabel alone keeps breaking it.
- ADR 0049: no approval at a sha the gate did not pass. The agent's self-report is a cross-check, never the source (PIN-18). Empty-equals-empty never transfers a pin.
- ADR 0005 and the enum mirror: never add `held:workflow-error` to the hard reasons. A new hard reason changes `land-decision.mjs`, the hand mirror in `workflow-template.js`, and the drift-guard test together.
- ADR 0034: every trust boundary returns a named error.
- ADR 0008 and ADR 0035: repair records toward git. Recovery is adoption plus re-dispatch, never deletion. ADR 0035 item 2 text is stale.
- ADR 0002: workers write only under their `.war-task` worktree. A commit-msg hook needs target-repo config writes.
- ADR 0021 and ADR 0040: provision at the barrier with the env-outcome shape. One environment re-run at the gate site.
- ADR 0042: new prompt text goes to a `references/` file plus a trigger pointer.
- CLAUDE.md: a worker or refiner behavior change updates the standing card and the dispatched prompt in the same commit.

## Fix surface candidates

Options for the plan, not decisions.

1. **Trailer layout wording.** Replace "as its OWN final paragraph" in the three ace prompts and the chain clause with "in the one final trailer block, with WAR-Task and any attribution lines". Mirror in the worker card. Require `git interpret-trailers --parse` before push. Prompt-only. Does not cover the AutoIndex cause.
2. **Engine arm for blocked with a moved head.** In all three ace arms, read the real branch tip with an engine-side rev-parse. Never trust `head_sha`. If the tip moved and is not a revert-only move, either force-revert through `r.aceReverted` and the revert clause, or charge the absorb and re-audit. Keeps never-hold and ADR 0049. A test fixture with `status: blocked` plus a moved `head_sha` lands today because the `pin-confirm` mock returns equal trees.
3. **Typed result from `verifyPinTransfer`.** Return a reason. Stop retrying when a well-formed proof fails only the tree clause. Route that case to a distinct reason or to the pin content re-audit. The re-audit arm needs `probeStatus === 'mismatch'`, so the tree mismatch must force that route explicitly, and the re-audit diff must come from `pins[0]`. Never relax the tree clause.
4. **Escalation note.** Name "branch tip carries content committed after approval" apart from proof or destination faults.
5. **Provenance on every dispatch.** Add `taskProvenanceClause` to the ace and floor-fix prompts. Alternatives: a mechanical trailer. A refuter showed a third route with no force push: repair trailers during the refiner's merge-slot rebase, which already rewrites the task commits locally and lands them by fast-forward. Patch id and tree stay identical. The engine's forward revert must also carry a trailer (`revert --no-commit` plus `commit --trailer`), or the helper must treat an owned commit plus its exact revert as bookkeeping. Replay target: 9 of 9.
6. **`task-integrated.sh` accepts `Ace-Charge`.** Proves 5 of 9 alone. Raw body-line parsing is spoofable. Fix the ADR 0035 item 2 drift with it.
7. **Re-provision on reuse and after the merge-slot rebase.** Re-run `run.provision` when the lockfile differs between the provisioned tree and the rebased tip. Make `_refinery` gate-capable or correct the doc. Open option: on a sanctioned recovery, reset an integrated-but-unproven branch to the frozen tip. That conflicts with ADR 0012's never-reset-on-reuse rule.
8. **Absorb-charge seed.** `absorbChargesClause` reads `integration..branch`, which is empty for an ancestor branch and undercounts unparsed trailers.
9. **Hardening only.** Bind the final segmented merge's source to `pinProof.head_sha`.

## Open questions for the interview

1. When the tip moved, revert Y (keeps never-hold, discards a possibly good fix) or re-audit Y (can land the fix)?
2. Why did workers with the same layout split 5 `blocked` to 7 `implemented`? Only the blocked ones cite a "Self-confound check". Is ADR 0020 wording the trigger?
3. Which revert fix: a trailered engine revert, or helper support for owned-commit-plus-revert pairs?
4. Is a commit-msg hook acceptable under ADR 0002, given the config writes and the `--no-verify` bypass? Or is the merge-slot rebase repair the better route?
5. Should a sanctioned recovery reset an integrated-but-unproven branch to the frozen tip?
6. Should the AutoIndex t2-3 instance join #2485? Should the wrong-task trailer on 86fe9707 be filed?
7. Did WAR run bed27f73 seed its absorb rounds from an unparsed `Ace-Charge: 2.4:3`? It labels its first 2.4 ace "a3".
8. Who changed Aligned's config to roundLimit 4 and worker model opus during the runs, then reverted it? Unverified.
9. Issues #2442, #2326, #2329, #2379, #2473, #2484, #1916 and #1910 have no family ruling yet.
10. The bug 3 reader report was truncated in synthesis after its sixth claim. Its ruling on the environment-proceed classifier was not reviewed.

## Files beside this README

- `task-integrated-replay.txt`: the helper's verdict per task at the barrier-time refs.
- `task-integrated-variants.txt`: the same replay under four helper variants (original, Ace-Charge counted, raw WAR-Task line counted, raw any trailer counted).
- `ti-variant.sh`: the replay script. Read-only against a checkout of the Aligned repo.
