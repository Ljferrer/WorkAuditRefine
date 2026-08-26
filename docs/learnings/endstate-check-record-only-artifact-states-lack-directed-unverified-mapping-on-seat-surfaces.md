---
name: endstate-check-record-only-artifact-states-lack-directed-unverified-mapping-on-seat-surfaces
description: "Two new record-only endstate-check artifact states (intake_lint: / cmd_bytes_mismatch:) are asserted by a workflow-template.js source comment to map to 'unverified', but neither the shared endStateBlock seat prompt nor agents/war-auditor.md actually directs that mapping — a seat following only the live prompt could misread a never-executed row as 'unmet' and hold a land"
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

**Code-verified at landed tip `c5458da04dc533da3c531ae96c3cd01e45072814` on
`dev/2026-08-25-engine-reliability-and-filing-fidelity`**, read directly in the live worktree whose
`.git` gitdir resolves to
`<repo-root>/.claude/war-worktrees/2026-08-25-engine-reliability-and-filing-fidelity-2026-08-26/_refinery`
(HEAD confirmed == the landed tip).

## What happened

Phase 4 Task 1 added two new **record-only** endstate-check artifact states for a `check:` literal
the fenced byte transport cannot carry faithfully:
- `intake_lint: unsupported check literal (...) — row not executed` (empty/whitespace-only or
  control-byte literals, linted at dispatch time, never executed), and
- `cmd_bytes_mismatch: written .cmd bytes != declared check literal` (a refiner-write divergence
  caught by the mandated byte-for-byte verify).

Both artifacts are present, readable, and correctly tip-stamped — none of the properties the
`unverified` triggers key on (missing / unreadable / stale tip_sha / `#1395` environmental-red). A
`workflow-template.js` header comment (just above `ENDSTATE_CHECK_RESULT`, near
`// (A3 intake lint / byte-verify) also map to 'unverified'`) *asserts* both new states map to
`unverified` — but grepping the two seat-facing surfaces that actually direct a gate-audit seat's
attestation behavior shows the mapping is comment-only:
- the shared `endStateBlock` prompt const (the live text every gate-audit-family seat receives)
  enumerates only missing/unreadable, stale-tip_sha, and `#1395` environmental-red as `unverified`
  triggers — no mention of `intake_lint:`/`cmd_bytes_mismatch:`;
- `agents/war-auditor.md` has zero occurrences of either token.

The **default-deny fallback** (`endStateBlock`'s own "a condition NO seat attests lands 'unverified',
never 'met'") does cover the benign path, and the handoff derivation's ternary chain
(`att.some(unmet) ? 'unmet' : att.some(met) ? 'met' : 'unverified'`) means a seat that stays silent on
the condition is safe. But a seat that reads the mismatch/lint line literally and follows only the
live prompt text — with no directive telling it these lines mean "never executed" rather than
"failed" — could plausibly attest `unmet` for a row that was never run, turning a Minor/informational
transport hiccup into a false Critical/Major HARD hold.

## The durable pattern

When a dispatch mechanism grows a new **record-only / never-executed** artifact state, a header
comment asserting "this maps to X" on the emitting side is **not** the same as the consuming seat
actually being told that. The comment can drift ahead of (or independent from) the prompt it
describes — this repo's own ADR 0025 doc-and-mirror cascade discipline exists precisely because a
standing card (`agents/war-refiner.md` / `agents/war-auditor.md`) and a dispatched prompt
(`workflow-template.js`'s `pt`-tagged consts) are two *separate* surfaces that must move in the same
commit; a comment sitting between them is neither. **Verify a "seats will read it as X" claim by
grepping the actual seat-facing prompt const and the standing card for the new tokens — not by
trusting the comment beside the artifact-emitting code.**

This phase's own audit correctly caught it: the workflow-template.js gate-audit seat (auditSha
`609820f443bdc92da65a7bce0c53bdb2b4c53ef1`, `gateEvidence: true`) filed it as a Minor `follow-up`
finding (not absorbable in-phase — the honest fix spans `endStateBlock`, `agents/war-auditor.md`, and
`CONTEXT.md`'s `unverified` glossary row, three surfaces, in one commit) rather than a hold, because
the realistic trigger set is narrow (whitespace-only/control-byte literal, or a refiner write
divergence) and both new artifact states are self-describing ("row not executed").

## Locate-cue (verify still present before acting)

`skills/war/assets/workflow-template.js`: the `ENDSTATE_CHECK_RESULT` header comment (search "also
map to 'unverified'") vs. the `endStateBlock` const a few hundred lines below (search "ATTESTATION
(D8"); `agents/war-auditor.md` (grep `intake_lint`/`cmd_bytes_mismatch` — zero hits at this tip).

## Related

- [[endstate-check-cmd-capture-truncates-at-embedded-backtick-in-check-literal]] — the transport
  defect this same phase's fenced byte-verbatim mechanism resolved; this lesson is the residual gap
  the fix itself introduced.
- [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]] — sibling precedent for
  SOFT-not-a-hold treatment of an artifact-channel gap.
- [[source-comment-lags-emitted-prompt-after-rewrite]] — the general comment/prompt-drift pattern
  this instance is a concrete case of.
