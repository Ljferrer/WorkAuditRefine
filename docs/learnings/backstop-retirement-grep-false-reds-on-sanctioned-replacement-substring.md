---
name: backstop-retirement-grep-false-reds-on-sanctioned-replacement-substring
description: "A plan's Deferred-validations backstop bullet mandating a zero-hit retirement grep for retired wording can false-red on correctly-landed work when the plan's own sanctioned replacement text is a superset disjunction that legitimately retains a substring of the retired phrase"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: backstop-retirement-grep-false-reds-on-sanctioned-replacement-substring
  phase: drift-guard-and-floor-diagnostic-hardening/1.3
  tags: 
    - plan-authoring
    - backstop
    - red-team-adjudication
    - false-positive
    - deferred-validation
  keywords: 
    - Deferred validations backstops
    - retirement grep
    - zero-hit expectation
    - scope beats anchor
    - false red
    - adjudicated backstop
    - superset disjunction
    - near-miss advisory
    - land-time re-check
  created: 2026-07-25
  originSessionId: 4eee3466-8bcc-44f9-a6c2-754d46624537
  modified: 2026-07-26T03:06:25.075Z
---

# A Deferred-validations backstop's zero-hit retirement grep can false-red on the plan's own sanctioned replacement

**What happened (code-verified — found at `skills/war/assets/assert-test-in-diff.sh` line 273 @
phase drift-guard-and-floor-diagnostic-hardening/1.3, plan
`docs/plans/2026-07-24-drift-guard-and-floor-diagnostic-hardening.md`):** the plan's
`## Deferred validations (backstops)` section carried an "Integrated-tip sweep re-check" bullet
expecting `grep -rin 'pattern is wrong for this repo' skills/war/assets/assert-test-in-diff.sh`
to return **zero** hits after Task 1.3 landed. Task 1.3's own mandated replacement text — a
two-cause disjunction naming both the `--pattern`/`overrides.testPattern` cause and the
excluded-location cause — legitimately **retains** the phrase `pattern is wrong for this repo`
verbatim inside the new sentence (the plan's own End state 3 sanctions this exact wording). The
landed line reads `...either the pattern is wrong for this repo (--pattern /
overrides.testPattern) or the file sits under an excluded location...` — the retirement grep
returns 1, not 0, against entirely correct, plan-faithful work.

**Why this happens:** a backstop bullet drafted in an earlier red-team round can anchor its
zero-expectation on a short literal that a *later*, ratified replacement (a subsequent round) is
free to keep as a substring of a longer, still-sanctioned sentence. Here the literal had already
been lengthened once (`'pattern is wrong'` → `'pattern is wrong for this repo'`) specifically to
escape an earlier self-contradiction — but lengthening a retained-substring anchor never escapes
the class of problem, it only buys one more round before the same substring reappears inside the
next legitimate replacement.

**How to apply:** before trusting a Deferred-validations retirement grep (or any "expect zero"
backstop) at land time, check whether the mandated *replacement* text is itself a superset or
disjunction that keeps the old phrase alive on purpose. If so, either (a) re-scope the check to a
fragment unique to the **old** wording only — e.g. the old line's distinguishing tail that the
new sentence does NOT reproduce — or (b) read the retirement claim as "the old *sole-cause*
assertion is gone", not "this substring never appears again", and verify that weaker claim
instead. Never edit the landed, plan-sanctioned prose just to force a stale backstop's grep to
return zero — the durable fix belongs in the plan document's backstop bullet, not the code.

Related: [[reproduce-a-gate-blocker-before-patching-or-escalating]] (verify a
red-team/backstop's own numbers before acting on them, generalized here to a land-time
Deferred-validation bullet rather than a red-team gate blocker).
