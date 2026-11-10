---
name: in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round
description: "A Minor/Nit finding disposed absorb + autoFixable:true, inside the task's own Files diff, can still ship unfixed once the task's verdict reaches approve"
metadata: 
  promoted: dev/2026-09-11-backward-chain-doctrine@phase-3
  node_type: memory
  type: project
  provenance: code-verified
  slug: in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-5 (task 5.1), landed fc9cf8c1099156f551c414ef99d34d277451da25 on dev/2026-09-06-engine-and-audit-verdict-integrity +5 recurrences (phase-7 task 7.1, landed 2694f617c02b8ae0a527086792355331c5cc5a79; phase-9 task 9.1, landed b7a74b841bcb02079d86a0d9b72d0ac4bb5e3b99; phase-11 task 11.1, landed 8927103891fdc7902f15a498203f7eaeedd74823; phase-12 task 12.2, landed 48a7120616627a35ecf2a05e76e34d15dcf985a3, all on dev/2026-09-06-engine-and-audit-verdict-integrity; 2026-09-11-backward-chain-doctrine/phase-3 task p3-polish, landed b9e9bfd748e902091e5ef6e336ee2fffc62e9a5b on dev/2026-09-11-backward-chain-doctrine, 2026-09-12 — sharpest form: a real fix round moved the pinned sha twice, yet one finding of the batch shipped unfixed; 2026-10-26-interview-fork-trials-and-pair-beats/phase-1 task 1.1, landed adb270b166190652e1289f8076ef43141e778f9a on dev/2026-10-26-interview-fork-trials-and-pair-beats, 2026-10-26 — Recurrence 7: a three-seat Nit shipped unfixed beside a fixed Major)"
  keywords: 
    - absorb disposition
    - autoFixable
    - fixRounds
    - unfixed finding
    - approve verdict
    - PARTIAL_LOG_RULE
    - byte-identical eviction claim
    - Minor never blocks
    - fix round did not cover finding
    - gate-log stamp
    - zero fix rounds
    - fixRounds 0
    - citationOf
    - schemas.md drift
    - phaseClose queue not drained
    - drainCause dropped on merge
    - FOLLOW-UP CONSOLIDATION
    - mergeSeat
    - test title lags assertion
    - drainCauseOf header comment
    - STATEMENT BOUNDARIES
    - compound command clause
    - statement-boundary operator set
    - printf append
    - release-slot eligibility
    - design.md stale sentence
    - disposition-eligibility.md
    - CONTEXT.md Disposition entry
    - phaseClose true unfixed
    - chainRecordFix
    - absorbRounds charge order
    - throughRound comment
    - ace fixer row stamped one round lower
    - moving pinned sha not proof of per-finding fix
    - correctiveRoundOf
    - This host has none
    - fork-trials.md per-command cap
    - three seats flagged the same nit
    - host-specific fact in a references file
  tags: 
    - war
    - audit-findings
    - process
    - workflow-template
  created: 2026-09-07
  originSessionId: a2a576b1-d8af-4c79-ad1a-af3d3e5c5c91
  modified: 2026-10-27T02:34:12.158Z
---

# An in-diff `absorb`/`autoFixable:true` finding can ship unfixed even after a real fix round ran

**Rule:** `disposition: absorb` + `autoFixable: true` is a routing tag, not a completion guarantee.
Minor/Nit never blocks approval, so nothing forces any one such finding to be fixed. Only a fresh
Read of the named construct at the landed tip confirms a `suggested_fix` landed.

**Seen seven times** (landing refs are in `metadata.phase`). The shape covers all of these:

- `fixRounds: 0`, with or without `phaseClose: true`. Several findings shipped untouched. The
  `phaseClose: true` ones depended on a polish task that never touched those files.
- `fixRounds: 1`. The round fixed other findings, and the re-audit kept these. All were non-blocking,
  so the verdict went to `approve`.

**Sharper forms:**

- A moving pinned sha is not per-finding proof. In one case two fix cycles moved the sha, yet one
  finding in the batch shipped unfixed, its flagged sentence byte-for-byte unchanged. The round fixed
  the sibling finding.
- Three-seat agreement does not help. All three seats raised the same Nit, and the fix round closed
  the Major and the Minors but skipped the Nit. The later approve rounds did not re-raise it.
- A post-merge gate-audit does not re-check a prior round's in-diff absorb unless its own lens trips
  on the same construct.

**Correction on `fixRounds: 0`:** an earlier form of this lesson said `fixRounds: 0` means no absorb
was ever applied. That overstates it. `run.ace` defaults true, and the ace ladder runs after approve.
Each ace commit charges `absorbRounds`, never `fixRounds`, so `fixRounds` says nothing about absorbs
in either direction. The `aced` record is not per-finding proof either: `recordAcedTouched` needs
only that the commit touched the finding's file, or no file overlap at all plus a panel re-approval.
Its own comment rules that second arm a known residual.

**Moot since this was written:** `PARTIAL_LOG_RULE` was rewritten, so its "you started" and "named
above" wording is gone, from `agents/war-refiner.md` too.

**Still open:** the stale doc and comment nits this lesson collected are tracked in #2660. Fix them there, not here.

**Why:** the tags look like "cheap, will be picked up", so the audit log reads as if the fix landed.
No gate turns that into a duty once the verdict is `approve`.

**How to apply:** never infer a fix from the disposition tag, `autoFixable`, the absence of
`phaseClose`, `fixRounds`, a sha transition, seat count or the batch verdict. Re-Read each named
construct at the landed tip, from a checkout that is really on that tip:
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]].

**Related:** [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] is the
same root fact for terminal and polish tasks, where no further round exists. This lesson shows the
gap also hits an ordinary task that did get a fix round.
[[audit-log-finding-can-be-stale-by-land-time]] is the complement: a finding can also be fixed before
land, so do not assume it is live either. Trust neither direction without a re-Read.
