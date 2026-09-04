---
name: endstate-check-record-only-artifact-states-lack-directed-unverified-mapping-on-seat-surfaces
description: "A source comment asserting seats read a state as `unverified` is not a directive; grep the seat prompt const and standing card."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: endstate-check-record-only-artifact-states-lack-directed-unverified-mapping-on-seat-surfaces
  phase: 2026-08-25-engine-reliability-and-filing-fidelity/4.1+4.2 (phase-close audit follow-up)
  keywords: 
    - endstate-check
    - intake_lint
    - cmd_bytes_mismatch
    - record-only artifact
    - unverified attestation
    - endStateBlock
    - ENDSTATE_CHECK_RESULT
    - comment code mismatch
    - ADR 0025
    - never-executed row
    - war-auditor.md
  tags: 
    - war
    - endstate-check
    - gate-audit
    - attestation
    - comment-lag
  created: 2026-08-26
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-26T15:25:26.614Z
---

# A source comment can assert an attestation mapping that no seat-facing surface actually directs

**Still open** (Minor `follow-up` from phase 2026-08-25-engine-reliability-and-filing-fidelity/4.1; no issue number recorded).

## Durable rule

When a dispatch grows a new record-only, never-executed artifact state, a header comment on the
emitting side saying "this maps to X" does not tell the consuming seat anything. Verify a "seats
will read it as X" claim by grepping the seat-facing prompt const and the standing agent card for
the new tokens. Never trust the comment beside the emitting code.

**Why:** the endstate-check dispatch in `skills/war/assets/workflow-template.js` writes two
record-only states, `intake_lint: unsupported check literal (...) — row not executed` and
`cmd_bytes_mismatch: written .cmd bytes != declared check literal`. Both artifacts are present,
readable, and tip-stamped, so none of the `unverified` triggers the seat prompt names (missing,
unreadable, stale `tip_sha`, #1395 environmental red) fires. The `ENDSTATE_CHECK_RESULT` header
comment says both states "also map to 'unverified'", but the shared `endStateBlock` prompt const
and `agents/war-auditor.md` carry neither token (`agents/war-refiner.md` names them only on the
writing side). A seat reading the line literally could attest `unmet` for a row that never ran and
hold a land on a transport hiccup. The default-deny fallback (a condition no seat attests lands
`unverified`) covers only a seat that stays silent.

**How to apply:** the fix spans three surfaces in one commit: the `endStateBlock` const (search
`ATTESTATION (D8`), `agents/war-auditor.md`, and the `unverified` glossary row in `CONTEXT.md`.
Until then, treat an `intake_lint:` or `cmd_bytes_mismatch:` artifact as `unverified`, never
`unmet`. This is the ADR 0025 standing-card-versus-dispatched-prompt cascade; a comment between
them is neither surface.

## Related

- [[endstate-check-cmd-capture-truncates-at-embedded-backtick-in-check-literal]]: the transport defect whose fix introduced this gap.
- [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]]: SOFT-not-a-hold precedent for an artifact-channel gap.
- [[source-comment-lags-emitted-prompt-after-rewrite]]: the general comment-versus-prompt drift pattern.

> archived 2026-09-04: resolved — moved to archive
