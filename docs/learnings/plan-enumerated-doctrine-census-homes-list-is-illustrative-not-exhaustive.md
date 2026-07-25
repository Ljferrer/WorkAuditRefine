---
name: plan-enumerated-doctrine-census-homes-list-is-illustrative-not-exhaustive
description: "A plan's End-state clause naming the 'expected homes' of a repo-wide doctrine-phrase census is a convenience reminder, not the ground truth for what counts as 'unexpected' — an independently re-derived hit (e.g. via git log -G) that the list omits is still MET if it classifies to the same ruling class (a planning artifact quoting the doctrine), never a hold"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: plan-enumerated-doctrine-census-homes-list-is-illustrative-not-exhaustive
  phase: "runbook-and-standing-record-coherence/Phase 1, Task 1.3 + phase-1-integrated-tip gate-audit"
  keywords: 
    - doctrine census
    - expected homes
    - never mined from arbitrary prose
    - git log -G
    - wrap-tolerant census
    - classification record
    - planning artifact leave ruling
    - red-team report
    - end state 5
    - enumerate every hit
  tags: 
    - war
    - audit-pipeline
    - doc-truth
    - census
    - standing-records
  created: 2026-07-24
  originSessionId: 4eee3466-8bcc-44f9-a6c2-754d46624537
  modified: 2026-07-25T06:18:46.979Z
---

# A plan's enumerated "expected homes" list for a doctrine-phrase census is illustrative, not exhaustive

**What happened (code-verified — landed tip `3f136c0327713487768aed59f986b665b07f9cb6`, read via the
`_refinery` worktree matching that SHA, gitdir physical path containing this plan's slug —
`.claude/worktrees/2026-07-24-runbook-and-standing-record-coherence-2026-07-24/_refinery/`):** plan
`2026-07-24-runbook-and-standing-record-coherence` End state 5 required a wrap-tolerant repo-wide
census of the restored "never mined from arbitrary prose" doctrine phrase to find it "at exactly the
expected homes … and nowhere else unexpected," and enumerated six expected homes (CONTEXT.md,
`skills/war/SKILL.md` step 5, the 2026-07-22 spec's correction note, a learnings lesson, the plan
itself, and its source spec). `git log -Gmined.from.arbitrary.prose --name-only` over the branch
turns up a **seventh** file the list never names:
`docs/red-team/2026-07-24-runbook-and-standing-record-coherence.md` (line 52, confirmed present at
the landed tip) — this plan's own CLEARED red-team report, which quotes the phrase to specify the
literal-string requirement for lock (a).

**Why this is not a miss:** the plan's own census *procedure* is "enumerate and classify EVERY hit;
never match a pre-declared count" — the enumerated list is a reader's convenience reminder of the
obviously-expected homes, not the exhaustive ground truth the "nowhere else unexpected" clause is
checked against. The correct ruling for the missing seventh hit is plain by class-analogy: it is a
**planning artifact quoting the doctrine to specify it**, the identical class the plan already rules
"leave" for the plan and its source spec. Two independent auditor seats (the task-1.3 review and the
later `phase-1-integrated-tip` gate-audit, `gateEvidence: true`) both re-derived the full historical
hit set via `git log -G` and reached the same conclusion: End state 5 is **MET in substance**, and the
list's omission is a completeness gap in the done report's classification record, never grounds for a
HARD hold or an "unexpected home" verdict.

**The pattern:** when a plan's End-state condition bundles (a) a literal enumerated list of expected
homes with (b) an open-ended "and nowhere else unexpected" tail, the list is advisory scaffolding for
the census-writer, not a closed set to diff against. An audit seat encountering a hit outside the
list should classify it by the **same ruling class** as the nearest listed analog (here: "planning
artifact quoting the doctrine — leave") rather than treating the plan's own list as incomplete or the
extra hit as a violation. Independently re-deriving the census (e.g. `git log -G <phrase>
--name-only`) rather than trusting only the done report's stated classification is what catches this
class of gap — the auditor's own tool ceiling (no shell `grep` for an auditor seat; `git log -G` is
git-verb-allowlisted and available) makes this the practical re-derivation path.

**How to apply:** when authoring a plan's doctrine/phrase-restoration census clause, either (a) drop
the enumerated "expected homes" list entirely and rely solely on "enumerate and classify every hit,"
or (b) explicitly caveat the list as non-exhaustive and instruct the classifier to rule any
unlisted-but-same-class hit (a red-team report, a done report, another plan) the same way as the
nearest listed analog. When *auditing* such a clause, re-derive the hit set independently before
ruling "unexpected home" — a `git log -G` walk is cheap and catches same-class stragglers the plan's
own list missed.

Related: [[plan-survey-token-sweep-misses-untagged-siblings]] (same family — a plan's literal-sweep
instruction is a floor for the *mechanical* step, not a completeness guarantee; there the miss was a
differently-worded sibling, here it is a same-worded hit outside a hand-enumerated allowlist).
