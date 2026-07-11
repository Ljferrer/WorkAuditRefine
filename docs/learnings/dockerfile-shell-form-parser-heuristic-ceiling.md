---
name: dockerfile-shell-form-parser-heuristic-ceiling
description: "Dockerfile parser in assert-packaging-in-diff.sh is shell-form-only, line-by-line — a ceiling"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: dockerfile-shell-form-parser-heuristic-ceiling
  phase: packaging-floor-enum-wiring/p1-T1
  date: 2026-07-06
  keywords:
    - parse_dockerfile
    - shell-form COPY only
    - line-continuation not joined
    - Dockerfile heuristic parser
    - ponytail ceiling comment
    - JSON exec form deferred
    - assert-packaging-in-diff.sh
  tags:
    - heuristic-floor
    - adr-0006
    - parser-ceiling
  related:
    - defined-but-not-yet-emitted-plan-slice-pattern
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Dockerfile shell-form parser: a documented heuristic ceiling, not a defect

**Instance (packaging-floor-enum-wiring T1, 2026-07-06):** `parse_dockerfile` in
`skills/war/assets/assert-packaging-in-diff.sh` (verify still present before acting — found there
@ this phase) reads a Dockerfile line-by-line and dispatches on the first token per physical line.
Three related audit-noted ceilings, all graded Nit/informational, none blocking:

1. **Line-continuation not joined** (line ~256): a multi-line `COPY \` / `  a.py b.py \` / `  ./`
   tokenizes the first physical line as `COPY` `\` and mis-scopes sources. Not a violation — spec
   §9 explicitly defers JSON/heredoc forms and states shell-form COPY covers the incident + every
   §10.1 case; line-continuation is the same "fuller parser" ceiling family.
2. **Rename (R) status is diff.renames-default-dependent** (line ~110): `git diff --name-status`
   runs without `-M/--find-renames`. If a consumer disables `diff.renames`, a rename surfaces as
   D+A instead of R — but the flag OUTCOME is unaffected (the added target path still flags
   identically), only the R-vs-A path *label* differs. Outcome-equivalent, not a gap.
3. **O(N×M) re-parse, not memoized** (line ~498): `parse_dockerfile` is invoked fresh per
   `(added-file, Dockerfile)` pair via `git show`, even though its output is a pure function of the
   Dockerfile alone. Correct, just wasteful; YAGNI for small WAR diffs.

**Why durable:** this is the *shape* of finding a Dockerfile/build-manifest heuristic parser will
keep generating as the packaging floor is extended (new instruction forms, new consumers disabling
git defaults, new fan-out call sites). The `# ponytail:` ceiling comment convention + ADR 0006's
heuristic-floor posture is the standing defense — **before filing a Critical/Major against a
narrow-parser gap, check whether the spec already named the fuller-parser case as deferred** (here,
spec §9). If the spec is silent on the specific gap, it's still typically Nit-gradable as
"documented heuristic ceiling family," not a plan violation, as long as the incident repro + named
§10.1 cases stay green.

**How to apply:** grep the target parser file for existing `# ponytail:` / ceiling comments and the
owning spec section before grading a parser gap above Nit.
