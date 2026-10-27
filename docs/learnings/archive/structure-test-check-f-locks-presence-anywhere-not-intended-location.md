---
name: structure-test-check-f-locks-presence-anywhere-not-intended-location
description: "check_f fixed-string structure lock proves whole-file presence, not the specific section it was meant to guard"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: structure-test-check-f-locks-presence-anywhere-not-intended-location
  phase: plan-and-prompt-literal-brittleness-and-auditor-calibration/t1.1
  keywords: [check_f, check_n, check_x, structure test, war-strategy-structure.test.sh, grep -qF, grep -cxF, grep -qxF, fixed-string lock, whole-file presence, drift guard gap, single-anchor duplicate token, section-specific lock, shared heading across example fences, exact-line occurrence count, trial_x, trial_f, substring heading pin, heading named in prose, mapping pin head and tail, fork-trials.md headings]
  tags:
    - war
    - test-fidelity
    - structure-test
    - drift-guard
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
  modified: 2026-10-27T02:34:25.494Z
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

**Instance closure (2026-07-23, phase "Lock granularity + lesson closure" on
`dev/2026-07-22-war-strategy-structure-lock`):** the specific two-site instance flagged above —
`plan-literal-lint.mjs` in the §2 convention block and the §4 conversion-flow step, pinned by one
bare `check_f` — *was* confirmed present on the integrated tree (superseding the verification
note's earlier stale-worktree "not found") and is now closed by two location-unique `check_f`
anchors (issue #991; code-verified — found at `skills/war-strategy/war-strategy-structure.test.sh`
lines 78-79, each `grep -cF` = 1 against `skills/war-strategy/SKILL.md` lines 106 and 195); the
mechanism-level guidance (options (a)/(b) in "How to apply") stays live for future structure
tests, with the added caveat that a bare `grep -c` is a **line-count, not an occurrence-count** —
it reports the number of matching *lines* regardless of `-o` on the stock GNU and BSD greps
(verified against real BSD grep `/usr/bin/grep`), so a `-oc`/`-co` "count recipe" is a line-count
in disguise on those greps — prefer option (a). (Environment caveat, red-team-verified: a `grep`
shimmed to a third-party drop-in such as ugrep may instead count *occurrences* under `-oc`, so a
count recipe is doubly unsafe — option (a)'s explicit-location anchor sidesteps the whole
question.)

**Instance 2 — a named-helper generalization of option (b) (2026-08-05, phase
`2026-08-04-interview-and-authoring-contract`/1, Task 1):** the same blind spot recurred in
`skills/war-strategy/war-strategy-structure.test.sh`, but with a sharper shape than the original
two-site duplicate: the plan's merged-template fence and its two required "example" fenced docs
(`### Example A`, `### Example B`) legitimately quote several of the SAME Part-1 heading lines
verbatim (`## Pivotal constraints`, `## Non-goals / deferred`, `## New domain terms · Recommended
ADRs`), so a bare `check_f '## Pivotal constraints'` is satisfied by any one of three occurrences —
deleting the heading from the real template fence alone leaves the pin green because both examples
still carry it. The audit (task 1's roster) flagged this as exactly the `check_f`-locks-presence-
anywhere pattern this lesson names, Minor, disposition `absorb`. It was fixed before land — verified
`code-verified` at the landed tip (378b868a5bab995f86c74ec8aad0d50d11516199 on
`dev/2026-08-05-2026-08-04-interview-and-authoring-contract`, read via the `_refinery` worktree
whose `gitdir` physical path contains this plan's slug) — by promoting option (b) into two **named,
reusable helpers** rather than a one-off `grep -c` recipe:
- `check_n(pattern, n)` — `grep -cxF -e "$1"`, asserts the **exact-whole-line occurrence count**
  equals `n` (the option-(b) fix, generalized: found at
  `skills/war-strategy/war-strategy-structure.test.sh`, defined beside `check`/`check_f`/`check_x`).
- `check_x(pattern)` — `grep -qxF -e "$1"`, asserts an **exact whole line** exists (distinct from
  `check_f`'s substring match) — for a fence-only heading (Example B's AI-declared backstops
  variant) that also appears as a backticked mention inside a longer prose sentence elsewhere in the
  file, where `check_f` would be satisfied by the prose mention alone.
Both helpers close the option-(b) line-count caveat this lesson's Instance 1 already recorded (a
bare `grep -c` is a *line*-count, not an *occurrence*-count, on stock GNU/BSD grep) by using
`grep -cxF`/`grep -qxF` (whole-**line** match, not `-o` occurrence match) — the exact-line
constraint is what makes counting lines equivalent to counting occurrences here, sidestepping the
GNU/BSD/ugrep `-oc` ambiguity Instance 1 flagged. **Generalizes the "How to apply" guidance:** when
a template file legitimately repeats a shared-heading fragment across N sibling fenced example docs
(not just two structurally-distinct sections of one real document, Instance 1's shape), name the
occurrence-count and exact-line helpers once and reuse them per heading, rather than writing a
`grep -c`/longer-fragment ad hoc recipe per pin.

**Instance 3 — a second target file, and a mapping pin (2026-10-26, phase
`2026-10-26-interview-fork-trials-and-pair-beats`/1, task 1.2; code-verified at the phase-1
integration tip, read via the run-scoped `_refinery` worktree, rung 2; verify still present before
acting).** The new `skills/war-strategy/references/fork-trials.md` names `## Provenance` and
`## Bounds` in backticked prose as well as in headings. The first pin helper `trial_f` in
`skills/war-strategy/war-strategy-structure.test.sh` is a substring `grep -qF`, so deleting either
H2 left its pin green (Minor, `absorb`). The fix is `trial_x`, the exact-whole-line twin of `check_x`
(`grep -qxF`), which now pins the nine ratified headings. Keep `trial_f` for doctrine phrases only.
A second blind spot sat in the Stage 1b classify sentence of `references/plan-interview.md`. A pin on
only the right-hand clause (`→ a fork trial, zero questions`) survives swapping the two routes
between categories. The fix pins each category head and its route tail as a pair on the same line
(search `Each category binds to its own clause`). **Generalizes:** for a mapping A → B, pin A's head
and B's tail together, or pin the whole line. A pin on one side alone survives a swap.

Related: [[gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity]],
[[weak-test-assertion-passes-without-feature-being-exercised]], [[audit-worktree-pre-impl-tip-stale-verdict]].

> archived 2026-07-11: resolved — moved to archive; instance-closure note appended 2026-07-23
> to mirror the repo-root copy's resolution record (`docs/learnings/structure-test-check-f-locks-presence-anywhere-not-intended-location.md`);
> Instance 2 appended 2026-08-05 (a second, sharper occurrence of the same blind spot, closed via
> named `check_n`/`check_x` helpers rather than an ad hoc `grep -c` recipe).
