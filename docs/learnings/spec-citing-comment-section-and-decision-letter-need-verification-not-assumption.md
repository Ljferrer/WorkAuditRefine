---
name: spec-citing-comment-section-and-decision-letter-need-verification-not-assumption
description: "A code comment citing a spec section number or a D-letter decision-tree label is easy to get wrong by inference from surrounding prose — verify the section/label against the actual spec structure, and qualify a D-letter with the spec's date whenever two specs sharing the D1-D6 taxonomy coexist in the same file"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: spec-citing-comment-section-and-decision-letter-need-verification-not-assumption
  phase: "auditor-guard-policy-and-mirror-truth/phase-1 task 1.1 (audit findings, resolved in a fix round before land, dev/2026-07-26-auditor-guard-policy-and-mirror-truth, 2026-07-27)"
  keywords: 
    - spec section citation
    - D-letter decision label
    - decision tree taxonomy
    - D1 D6 namespace collision
    - resolved design tree
    - comment cites wrong section
    - bare decision letter
    - spec date qualifier
    - cross-spec comment ambiguity
  tags: 
    - documentation
    - comment-hygiene
    - audit-pattern
  created: 2026-07-27
  originSessionId: 0ad881e1-4bbc-43c6-8e45-8597d9cec1cf
  modified: 2026-07-28T03:33:14.753Z
---

# Verify a spec-citing comment's section/label; qualify a shared D-letter with the spec's date

**Pattern (recorded as a generic pattern, not a live instance — both findings below were resolved
in a fix round before this phase landed; per the finding-match discipline, do not cite the
original file/line as a current defect):**

1. **Section-number citation drift.** A newly-added comment cited "spec §5" for a decision that
   the same spec actually ratifies in §3 ("Resolved design tree" — the D1-D6 decision table); §5
   was in fact the "Surface changes (files touched)" table, which only *mentions* the comment
   line in passing. The immediately preceding, pre-existing comment in the same file used the
   correct convention (citing the design-tree section for a ratification). **Lesson:** when
   writing a comment that cites "spec §N" for a *decision*, re-check which section of the actual
   spec ratifies decisions (usually a "Resolved design tree" / decision-table section) versus
   which section merely *lists* the file the decision touches (a "Surface changes" table) — these
   are easy to conflate because both sections mention the same construct.

2. **Bare D-letter collision across sequential specs.** This repo's specs share a repeatable
   `D1`-`D6` "Resolved design tree" decision-letter taxonomy. When two specs on the same slug
   family coexist in the same source file's comments (a `2026-07-22` spec's `D6` and a
   `2026-07-26` spec's own, unrelated `D6`), a bare `D6` reference two lines from a
   correctly-date-qualified reference ("...the 2026-07-26 spec's D3") reads as if it belongs to
   the same spec, even when the plan's own explicit caution says "don't renumber, and qualify new
   references" — qualifying only the *new* half of a two-reference pair still leaves the *old*
   half locally ambiguous. **Lesson:** whenever editing a comment that already carries a bare
   D-letter and the same edit adds a qualified reference to a different spec's D-letter nearby,
   qualify the pre-existing bare reference too (e.g. "the 2026-07-22 spec's D6"), even though the
   caution about *not renumbering* only forbids changing the letter itself, not adding a date
   qualifier to disambiguate it.

**Why durable:** this repo's convention of giving every design spec its own `D1`-`D6` decision
table (see `docs/specs/*-design.md` §3) means letter collisions across specs sharing a slug family
are structural, not a one-off — any future spec revision that reuses the same lettered slots will
hit the same namespace hazard the plan's own "D-letter namespace caution" already anticipated.

**Provenance note:** both findings are sourced from this phase's initial task-1.1 audit
(`disposition: absorb`, `autoFixable: true`); neither recurs in the same task's later
`gate-audit:approve` pass (`gateEvidence:true`, pinned `auditSha:
4e15632bc2313ee9e3c1965c3d952006fb9bf4f3`), which instead surfaces different residual findings —
consistent with both having been fixed in a round before land. I could not independently confirm
the fixed state myself: my session cwd is a different concurrent plan's worktree, and no live
task worktree under `.git/worktrees/*` matched this plan's slug at the threaded landed tip
(`c4f74cb8f0d1807f69e7bdc472d4e7a56aea9441`) — the candidates named `p1-1.1`/`p1-polish` resolved
to a different plan, `2026-07-26-dispatch-args-and-floor-coverage`. Recorded as a pattern only,
per the finding-match discipline; never cite the original `hooks/validate-auditor-git.test.sh`
lines as a current instance.
