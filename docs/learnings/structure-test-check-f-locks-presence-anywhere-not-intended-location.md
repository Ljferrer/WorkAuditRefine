---
name: structure-test-check-f-locks-presence-anywhere-not-intended-location
description: "check_f/check locks prove whole-file presence, not location — use per-location anchors or count"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: structure-test-check-f-locks-presence-anywhere-not-intended-location
  phase: plan-and-prompt-literal-brittleness-and-auditor-calibration/t1.1
  keywords: [check_f, structure test, war-strategy-structure.test.sh, grep -qF, fixed-string lock, whole-file presence, drift guard gap, single-anchor duplicate token, section-specific lock]
  tags:
    - war
    - test-fidelity
    - structure-test
    - drift-guard
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# `check_f`-style structure locks prove whole-file presence, not "present at this specific location"

**What's confirmed (code-verified — `skills/war-strategy/war-strategy-structure.test.sh:21-28`, verify still
present before acting):** the `check_f` helper is `if grep -qF "$1" "$SKILL"; then ok; else fail`. It has no
line-range, section, or occurrence-count constraint — it only proves the fixed string occurs **somewhere** in
the whole file, at least once. `check()` (the regex sibling, line 13) has the identical shape (`grep -q`,
whole-file, presence-only).

**The gotcha (from t1.1's audit, disposition `note`, at `audit_sha` — not independently re-verified against
the landed lines in this checkout, which predates the phase's landed changes; see verification note below):**
when the SAME literal token is meant to be locked at **two structurally distinct locations** in a doc (e.g. a
`plan-literal-lint.mjs` mention inside a §2 convention block AND a separate mention inside a §4 conversion-flow
step), a single `check_f 'plan-literal-lint.mjs'` call is satisfied by **either occurrence alone**. Removing
the §4 mention while keeping the §2 mention (or vice versa) leaves the token still present somewhere in the
file, so the structure test stays green — even though one of the two distinct requirements the plan intended
to lock has silently regressed.

**Why this is easy to miss when authoring a structure test:** the natural read of "lock line X" is "assert
line X survives," but `check_f`/`check` only assert "a string equal to X exists in the file" — they cannot
distinguish "both required occurrences present" from "only one of two occurrences present, and it happens to
contain the shared substring." This is a distinct failure mode from
[[gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity]] (which is about wording drift
between copies of a value expected to be byte-identical across surfaces) — here the two occurrences are
**expected to differ** (different surrounding sentences at different locations) and only their **shared
substring token** is what the lock actually pins.

**How to apply:** when a plan requires a specific token to appear at N distinct locations in one doc, either
(a) add N separate `check_f` calls each anchored on a longer, location-unique fragment (include enough of the
surrounding sentence that each occurrence's fragment differs), or (b) count occurrences explicitly (e.g.
`grep -coF` and assert `-ge N`) instead of a bare presence check, mirroring the aggregate-count pitfall in
[[weak-test-assertion-passes-without-feature-being-exercised]] (which covers the sibling failure of an
aggregate count being satisfiable by fewer distinct items than intended).

**Verification note:** the specific two-site duplicate (`plan-literal-lint.mjs` in the §2 convention block and
the §4 conversion-flow step, `war-strategy-structure.test.sh` lines ~71/73 per the audit finding) was **not**
found in this checkout's copy of `war-strategy-structure.test.sh` — a `grep` for `plan-literal-lint.mjs` in
that file returned no matches, consistent with known worktree-staleness (this checkout predates
`dev/2026-07-08-plan-and-prompt-literal-brittleness-and-auditor-calibration`; see
[[audit-worktree-pre-impl-tip-stale-verdict]]). The `check_f`/`check` **mechanism** itself (whole-file,
presence-only, no location/count anchor) IS confirmed present and unchanged at lines 13-28 of that file in this
checkout, which is why the mechanism-level claim is tagged `code-verified` — re-confirm the specific duplicate
-token instance on the landed branch before citing line numbers.

Related: [[gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity]],
[[weak-test-assertion-passes-without-feature-being-exercised]], [[audit-worktree-pre-impl-tip-stale-verdict]].
