---
name: release-blurb-quoted-code-literal-can-diverge-from-actual-identifier
description: "README Status blurb quotes `fs.readdirSync(dir, { recursive: true })` but cmdLint's real identifier is `t` — a grep for the rendered literal finds nothing"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: release-blurb-quoted-code-literal-can-diverge-from-actual-identifier
  phase: "2026-07-26-war-memory-cli-correctness/phase-2 task 2.1 (gate-audit Nit, disposition note)"
  keywords: 
    - release blurb
    - README Status
    - code literal in prose
    - identifier mismatch
    - cmdLint
    - readdirSync
    - grep the rendered literal
    - blurb accuracy
    - quoted code snippet drift
  tags: 
    - release-blurb
    - docs
    - plan-fidelity
  created: 2026-07-27
  originSessionId: 0ad881e1-4bbc-43c6-8e45-8597d9cec1cf
  modified: 2026-08-17T21:30:13.821Z
---

# A release blurb quoting a code call can rename the variable, silently defeating a later grep

**What happened (code-verified at the landed tip):** `war-memory-cli-correctness`'s Task 2.1
release blurb (`README.md` `## Status`, item (2)) writes:

> `lint <dir>` now enumerates with `fs.readdirSync(dir, { recursive: true })`

but the real call in `skills/_shared/war-memory.mjs`'s `cmdLint` directory branch reads:

```js
files = fs.readdirSync(t, { recursive: true }).filter((f) => f.endsWith('.md')).map((f) => path.join(t, f));
```

The identifier is `t`, not `dir`. The audit found this a Nit, `disposition: note`,
`phaseClose: false` — not a false code fact (the same sentence introduces `<dir>` as the CLI
argument name, so a careful reader parses `dir` as *that* argument rather than a claim about the
source identifier) — but a reader who greps the repo for the exact rendered literal
(`fs.readdirSync(dir, { recursive: true })`) finds zero hits, because the only real occurrence
uses `t`.

**Verified still present at land** (via the `_refinery1` task worktree at
`.claude/war/worktrees/2026-07-26-war-memory-cli-correctness-2026-07-27/_refinery/`, whose detached
`HEAD` equals the landed tip `62956fd0b1f34d408ab1251a2b8fd8d5201ed444`): `README.md`'s `## Status`
line still reads `fs.readdirSync(dir, { recursive: true })`, and `skills/_shared/war-memory.mjs`'s
`cmdLint` directory branch still calls `fs.readdirSync(t, { recursive: true })`. Non-blocking; the
task's two blurb requirements (recursive-walk phrasing, count-word consistency) were both satisfied
regardless.

**The pattern:** when a release blurb or Status line quotes a source call verbatim to ground a
claim in code, copy the call's *actual identifier names*, not a reader-friendly placeholder that
happens to collide with a nearby CLI-argument name (`<dir>` here). A near-miss like this is easy to
wave off as cosmetic, but it silently defeats the exact kind of "grep the rendered literal to prove
it's true" verification this repo relies on for blurb/lesson trueing-up sweeps (see
[[plan-survey-token-sweep-misses-untagged-siblings]] for the sibling grep-is-a-floor discipline).
Prefer quoting the call with its parameter elided (`fs.readdirSync(…, { recursive: true })`) when
the exact identifier isn't the point, or use the real identifier if it is.

## Related

[[plan-survey-token-sweep-misses-untagged-siblings]] — grep sweeps are a floor, not a ceiling, for
verifying blurb/lesson prose against code. [[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]]
and [[release-blurb-overstates-guard-semantics]] — sibling release-blurb-precision findings from
earlier phases in this same family.

## Recurrence 1 (2026-07-28, plan `2026-07-28-audit-evidence-precedence`, phase 2 "Release", task 2.1) — a bold-markdown lead-in quoted with a closing `**` the artifact doesn't carry

Same pattern, markdown bold markers instead of a code call. `code-verified` at the landed tip
`5f018f183eefa225ee900afd7e33dca9c5dfb4e8` (`_refinery` worktree whose `HEAD` equals that SHA,
gitdir `<repo-root>/.claude/war-worktrees/2026-07-28-audit-evidence-precedence-2026-07-28/_refinery/`).
The `## Status` blurb writes: "`skills/war/SKILL.md` gains one `**Lead evidence bindings**`
paragraph" — a reader grepping the rendered literal `**Lead evidence bindings**` (closing markers
included) finds nothing, because the real lead-in is `**Lead evidence bindings (phase-close + Gate
2; ADR 0041).**` — the bold markers close only after the parenthetical, not right after the phrase.
The D27 row in `skill-doc-contracts.test.mjs` deliberately anchors on the open prefix
`/\*\*Lead evidence bindings/` (no closing `**`) for exactly this reason — the guard's own extraction
already accounts for the variable close position; the blurb's grep-friendly quoting didn't. Multiple
auditor seats flagged this independently. `disposition: note`, Nit, non-blocking, not fixed before
land — `## Status` is a release slot.

**Sharper form of the rule:** when quoting a bold-markdown lead-in (not just a code call) verbatim
in release prose, quote through the actual close position — if the bold run continues past the
"headline" phrase into a parenthetical or qualifier, either quote the whole run or quote only the
open prefix (no closing `**`) the way a drift guard anchoring on that construct already does.

## Recurrence 2 (2026-08-17, plan `2026-08-06-structural-pin-extractors`, phase 2 "Release",
task 2.1) — a code-span EXPRESSION (identifier plus comparison glue), not a renamed identifier,
byte-mismatches the landed assert call

A third sub-shape of the same failure mode: the diverging half is neither a renamed identifier nor
a markdown-close position, but the comparison operator glued onto an otherwise-correct identifier.
`code-verified` — read directly at the `_refinery18` worktree whose `HEAD` is byte-equal to the
landed tip `1c059bdb6451f51ae8203190d8af781a4f2bb2ba` (gitdir physical path containing this plan's
slug: `<repo-root>/.claude/war-worktrees/2026-08-06-structural-pin-extractors-2026-08-17/_refinery/`),
`README.md` line 364. The blurb renders the anti-vacuity floor as the code span
`` `DONE_WHEN_SITES.length === 6` ``, but the landed assert in
`skills/war/assets/workflow-template.test.mjs` is `assert.equal(DONE_WHEN_SITES.length, 6, '...')`
— a call, not a `===` comparison. A reader grepping the exact rendered literal
`DONE_WHEN_SITES.length === 6` finds zero hits; only the identifier half
(`DONE_WHEN_SITES.length`) byte-matches. Nit, `disposition: note`, non-blocking — the audit also
confirmed this "render the assert as a semantically-equivalent `===` condition" is an established
house style already present in the prior 0.17.9 blurb, not a new deviation, and every *other*
backticked literal and quoted-prose fragment in the same three-bullet paragraph was individually
checked against the pinned phase-1 diff and byte-matched.

**Sharper form for this sub-shape:** when a blurb renders a Node `assert.*` call as a
reader-friendly boolean condition (`X === Y` for `assert.equal(X, Y, ...)`, `X` for
`assert.ok(X, ...)`), that rendering is a deliberate, established house-style trade (semantic
clarity over grep-ability) rather than a defect to fix — but it means "grep the rendered literal to
verify it's true" (the discipline [[plan-survey-token-sweep-misses-untagged-siblings]] names) does
not apply to condition-style code spans the way it does to verbatim call quotes; verify those
against the call's actual arguments by reading the source, not by grepping the span.

Related: [[bounded-window-measurement-comment-self-invalidates-when-its-own-release-commit-lands]]
(same phase, same paragraph, a sibling but distinct release-prose imprecision — a diff-footprint
absolute rather than a quoted-literal mismatch).

> archived 2026-08-15: resolved — moved to archive
