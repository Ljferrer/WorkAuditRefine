---
name: docker-signature-list-scope-conflated-with-gate-classifier
description: "Docker signature list governs Setup deferral, not gate classification"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: docker-signature-list-scope-conflated-with-gate-classifier
  phase: target-repo-agnostic-execution/p3t2
  date: 2026-07-07
  keywords:
    - docker platform-signature list
    - EBADPLATFORM
    - gate-time classifier
    - gate_failure_class
    - classification base re-run
    - Setup docker gate
    - doc scope conflation
  tags:
    - doc-honesty
    - gate-failure-classification
    - docker
  originSessionId: null
---

# A Setup-time heuristic doc bullet can overstate its reach into a sibling gate-time mechanism

`skills/war/SKILL.md`'s Setup step-3 docker bullet ("Daemon reachable") ends: *"This same
signature list is what the gate-time classifier keys on; a docker failure matching none of these
signatures deliberately falls through to the introduced class."* — found verbatim at that bullet
(2026-07-07). This overstates scope: the platform-signature list (`EBADPLATFORM` / `no matching
manifest for <platform>` / `exec format error`) governs only the **Setup-time per-image
probe-build deferral** decision (auto-defer a platform-mismatched image to a `source:'auto'`
backstop, never add it to the gate). The actual **gate-time** `gate_failure_class` classifier (a
sibling task/mechanism) keys on re-running the failing gate at the classification base and
comparing failing identifiers — not on the docker signature list at all. Both surfaces agree the
fail-safe fallthrough is `'introduced'`, so the sentence isn't false on outcome, just imprecise on
mechanism attribution — the same "prose restructured elsewhere, reference bullet lags" shape as
[[adr-policy-table-entry-vs-mechanism-attribution]].

**Why it slipped through as Minor, not blocking:** the sentence is faithful to *this task's own
plan slice and spec §8* ("unmatched variants deliberately fall through to introduced" — true in
both places), and the Lead is the only reader of SKILL.md (the Lead doesn't run the classifier), so
the imprecision has no execution-path impact. Flagged `phaseClose:true` for a same-phase-close
softening once the sibling classifier's exact wording had landed.

**How to apply:** when two mechanisms share a fallback verdict (`'introduced'` here) but operate at
different pipeline stages (Setup-time deferral vs. gate-time classification), a connective sentence
claiming one "is what X keys on" needs re-verification once X's actual implementation lands —
don't let a plausible-sounding cross-reference outlive the code it described before the sibling
task existed.
