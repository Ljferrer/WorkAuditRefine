---
name: absence-guard-verb-specific-coverage-gap
description: "checkout guard misses switch; enum verb classes"
metadata: 
  node_type: memory
  slug: absence-guard-verb-specific-coverage-gap
  phase: 4
  type: project
  keywords: [equivalence class, git switch detach, latent false negative, syntactic token scan, under-specified grep, regression gate hole]
  tags: 
    - war
    - clean-surface
    - absence-guard
    - grep-guard
    - git
    - refinery
    - audit-finding
  files: 
    - skills/war/assets/refinery-surface.test.sh
  relates: 
    - "[[retire-token-needs-clean-surface-gate-test]]"
    - "[[gate-under-covers-after-cross-branch-merge-new-runner]]"
  created: 2026-06-25
  originSessionId: war-phase-4-t8
---

# Absence guards are verb-specific: cover the full equivalence class, not just the observed form

## The durable rule

An absence guard that forbids a *semantic behavior* by scanning for the *syntactic token* of the
current reference impl is under-specified. One grep for one verb is a latent false-negative the
moment the surface evolves to an equivalent verb. Enumerate the full equivalence class in the
guard's comment, then scan for ALL verbs in it.

Original finding (t8, Minor): `refinery-surface.test.sh` scanned `checkout origin/` without
`--detach` but missed the equivalent `git switch origin/<working>` (non-detached, same forbidden
"Refinery operating in main checkout" behavior).

**Fixed:** `refinery-surface.test.sh` now has ABSENCE CHECK 2 (`checkout origin/`) and ABSENCE
CHECK 3 (`switch origin/`) — both requiring `--detach` on the same line, byte-identical mirrors.

**Why it matters:** the refinery-surface test is a long-lived regression gate; a verb-gap gives
the appearance of coverage without providing it.

## Related

[[gate-under-covers-after-cross-branch-merge-new-runner]] is the same class at the runner level
(`node --test` gate silently missing `*.test.sh` runners) — covers the *visible* surface, not the
*intended* one.

> archived 2026-07-11: resolved — moved to archive
