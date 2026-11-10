---
name: dockerfile-shell-form-parser-heuristic-ceiling
description: "Before grading a narrow-parser gap in assert-packaging-in-diff.sh above Nit, check for a documented ceiling comment and whether a later phase closed it"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: dockerfile-shell-form-parser-heuristic-ceiling
  phase: packaging-floor-enum-wiring/p1-T1 (origin); Floor fixes/task-1 (fix, 2026-07-12)
  date: 2026-07-06
  keywords:
    - parse_dockerfile
    - shell-form COPY only
    - line-continuation joined
    - Dockerfile heuristic parser
    - ponytail ceiling comment
    - JSON exec form deferred
    - assert-packaging-in-diff.sh
    - Dockerfile-outer loop
    - parse-once inversion
    - floor-script-correctness
  tags:
    - heuristic-floor
    - adr-0006
    - parser-ceiling
  related:
    - defined-but-not-yet-emitted-plan-slice-pattern
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
  updated: 2026-07-12
---

# Dockerfile shell-form parser: a documented heuristic ceiling — two of three closed

**Original instance (packaging-floor-enum-wiring T1, 2026-07-06):** `parse_dockerfile` in
`skills/war/assets/assert-packaging-in-diff.sh` read a Dockerfile line-by-line and dispatched on
the first token per physical line. Three related audit-noted ceilings, all originally graded
Nit/informational:

1. **Line-continuation not joined:** a multi-line `COPY \` mis-scoped sources. Fixed 2026-07-12
   ("Floor fixes", `docs/plans/2026-07-12-floor-script-correctness.md` Task 1): `parse_dockerfile`
   now pre-joins backslash continuations into logical lines before tokenizing.
2. **Rename (R) status is diff.renames-default-dependent:** outcome-equivalent, not a gap. Still
   open, an accepted gap.
3. **O(N×M) re-parse, not memoized:** `parse_dockerfile` ran once per `(added-file, Dockerfile)`
   pair. Fixed in the same phase: the loop is now Dockerfile-outer / added-file-inner, locked by a
   test that counts runtime `parse_dockerfile` calls (a static call-site count would be vacuous; see
   [[plan-literal-test-spec-can-be-vacuous-strengthen-under-latitude-rule]]).

**Why durable:** this is the *shape* of finding a Dockerfile/build-manifest heuristic parser will
keep generating as the packaging floor is extended. The `# ponytail:` ceiling comment convention +
ADR 0006's heuristic-floor posture is the standing defense — **before filing a Critical/Major
against a narrow-parser gap, check whether the spec already named the fuller-parser case as
deferred.** Two of three named ceilings in one repo did eventually get fixed in a dedicated
"floor fixes" phase — a documented ceiling is not a permanent exemption, just a deferred one.

**How to apply:** grep the target parser file for existing `# ponytail:` / ceiling comments and the
owning spec section before grading a parser gap above Nit; if a ceiling has an owning-lesson slug,
check whether a later phase closed it before assuming it's still open.

> archived 2026-07-15: resolved — moved to archive
