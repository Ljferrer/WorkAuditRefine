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
  modified: 2026-07-28T01:29:44.641Z
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
