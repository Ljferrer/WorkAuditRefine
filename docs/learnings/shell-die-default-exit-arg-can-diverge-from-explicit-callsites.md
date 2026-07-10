---
name: shell-die-default-exit-arg-can-diverge-from-explicit-callsites
description: "A shell die() helper's ${2:-N} default exit code is a latent trap when every current call site passes the code explicitly"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: shell-die-default-exit-arg-can-diverge-from-explicit-callsites
  phase: red-team-plan-vs-state-grading-and-probe-sandboxing/t1.3
  keywords: [die function, default argument, bash default exit code, floor script exit contract, 0/1/2 contract, latent trap, positional parameter default, assert-no-repo-escape.sh]
  tags:
    - shell
    - floor-script
    - exit-codes
    - gotcha
  related: "[[floor-script-exit-codes-1-vs-2-route-differently]]"
  created: 2026-07-10
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# A shell `die()` helper's default exit arg can silently diverge from an intentional exit-code contract

## The pattern
`die()` implemented as `die() { echo "$1" >&2; exit ${2:-1}; }` (or similar) picks a default exit
code for callers that omit the second argument. When a script has a deliberate multi-code contract
(e.g. the floor-family 0/1/2 convention — see [[floor-script-exit-codes-1-vs-2-route-differently]]:
1 = the named/expected route, 2 = infra/git error that must never collapse into 1), the helper's
*default* does not have to match that contract as long as **every current call site passes the code
explicitly**. That's true today, but it's a latent trap: a future call to `die "message"` (no second
arg) silently inherits the helper's own default rather than the script's actual convention, and
nothing forces the author to notice — no test can catch a call site that doesn't exist yet.

Concretely (t1.3, `assert-no-repo-escape.sh`, a new post-run escape guard with a 0/1/2 contract
where 2 = git error and must never collapse into 1 = escape signal): `die()` defaulted to
`${2:-1}` while every existing call site passed `2` explicitly. Graded Nit (informational only) —
not a slice deviation, no current call is wrong — but flagged because the mismatch would only bite
on a *future* edit, is invisible in a diff review of that future edit (the new call just looks like
`die "msg"`), and the multi-exit-code convention is exactly the kind of thing this repo treats as
load-bearing elsewhere.

**Referent not verified in this checkout** @ phase red-team-plan-vs-state-grading-and-probe-sandboxing
(worktree predates that branch's merge — `assert-no-repo-escape.sh` does not exist here) — verify
`skills/red-team/assets/assert-no-repo-escape.sh`'s `die()` signature before citing specifics.

## How to apply
When a shell script's `die()`/`fail()` helper has a fallback default exit code and the script also
has a deliberate multi-code exit contract, either (a) make the default match the contract's
"normal error" code (so an omitted arg fails safe into the conservative code, not the possibly-wrong
one), or (b) require every call site to pass the code explicitly and say so in a comment next to the
helper — don't leave a silent default that only one code path currently avoids by convention.

[[floor-script-exit-codes-1-vs-2-route-differently]]
