---
name: structure-test-check-f-locks-presence-anywhere-not-intended-location
description: "A check_f fixed-string structure lock proves whole-file presence, not the specific section it was meant to guard; anchor each location or pin exact lines"
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

**The mechanism:** in `skills/war-strategy/war-strategy-structure.test.sh`, the `check_f` helper is `if grep -qF "$1" "$SKILL"; then ok; else fail`. It has no line-range, section, or occurrence-count constraint. It only proves the fixed string occurs **somewhere** in the file. `check()`, the regex sibling, has the same shape (`grep -q`, whole-file, presence-only).

**The gotcha:** when the SAME literal token must be locked at **two distinct locations** in a doc (e.g. a `plan-literal-lint.mjs` mention in a §2 convention block AND in a §4 conversion-flow step), one `check_f 'plan-literal-lint.mjs'` call is satisfied by **either occurrence alone**. Removing one mention leaves the test green, though one of the two requirements has silently regressed.

**Why this is easy to miss:** the natural read of "lock line X" is "assert line X survives". But `check_f`/`check` only assert "a string equal to X exists in the file". They cannot tell "both occurrences present" from "only one present". This differs from [[gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity]] (wording drift between copies meant to be byte-identical). Here the two occurrences are **expected to differ**, and only their **shared token** is what the lock pins.

**How to apply:** when a plan requires a token at N distinct locations in one doc, either
(a) add N separate `check_f` calls, each anchored on a longer, location-unique fragment, or
(b) count occurrences explicitly, mirroring the aggregate-count pitfall in [[weak-test-assertion-passes-without-feature-being-exercised]].

**Caveat on (b):** a bare `grep -c` is a **line-count, not an occurrence-count**. It reports matching *lines* regardless of `-o` on the stock GNU and BSD greps, so a `-oc`/`-co` "count recipe" is a line-count in disguise. A `grep` shimmed to a drop-in such as ugrep may instead count *occurrences* under `-oc`, so a count recipe is doubly unsafe. Prefer (a), or use whole-line matching as below.

**Instance 1 (closed):** the `plan-literal-lint.mjs` two-site duplicate was closed by two location-unique `check_f` anchors (issue #991).

**Instance 2 — named helpers for option (b):** the plan's merged-template fence and its two example fenced docs (`### Example A`, `### Example B`) legitimately quote the same Part-1 heading lines (`## Pivotal constraints`, `## Non-goals / deferred`, `## New domain terms · Recommended ADRs`). A bare `check_f '## Pivotal constraints'` was satisfied by any one of three occurrences. The fix promoted option (b) into two reusable helpers in `war-strategy-structure.test.sh`, defined beside `check`/`check_f`:
- `check_n(pattern, n)` — `grep -cxF -e "$1"`, asserts the **exact-whole-line occurrence count** equals `n`.
- `check_x(pattern)` — `grep -qxF -e "$1"`, asserts an **exact whole line** exists, for a heading that also appears as a backticked mention inside a prose sentence.
The whole-line match (`-x`) makes counting lines equal to counting occurrences, which sidesteps the `-oc` ambiguity above. When a template repeats a shared heading across N sibling fenced examples, name these helpers once and reuse them per heading.

**Instance 3 — a second file, and a mapping pin:** `skills/war-strategy/references/fork-trials.md` names `## Provenance` and `## Bounds` in backticked prose as well as in headings. The pin helper `trial_f` is a substring `grep -qF`, so deleting either H2 left its pin green. The fix is `trial_x`, the exact-whole-line twin of `check_x` (`grep -qxF`), which now pins the ratified headings. Keep `trial_f` for doctrine phrases only. A second blind spot sat in the Stage 1b classify sentence of `references/plan-interview.md`: a pin on only the right-hand clause (`→ a fork trial, zero questions`) survives swapping the two routes between categories. The fix pins each category head and its route tail as a pair on the same line (search `Each category binds to its own clause`). **Mapping rule:** for a mapping A → B, pin A's head and B's tail together, or pin the whole line. A pin on one side alone survives a swap.

Related: [[gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity]],
[[weak-test-assertion-passes-without-feature-being-exercised]], [[audit-worktree-pre-impl-tip-stale-verdict]].

> archived 2026-07-11: resolved — moved to archive
