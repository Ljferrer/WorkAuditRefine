# Memory carries a provenance tier; the servitor's writes are provenance-gated

**Status:** accepted (design ratified; implementation tracked by the spec below)

The servitor distills LLM-authored auditor rationale + escalation text (`auditLog`/`escalated`, [`workflow-template.js:460-461`](../../skills/war/assets/workflow-template.js#L460)) into durable memory with no write-time verification, and those files auto-inject into every future session — so a mistaken rationale calcifies into a recalled "fact" (agent-architecture audit finding M3, 2026-06-29). A future reader will ask why a hook gates *memory content* when the scope hook already gates the *path*, and why facts carry a trust tier; this records it. Full mechanics: [the design spec](../specs/2026-06-29-memory-provenance-design.md).

## Decision

Make a memory fact's trustworthiness **legible and consequential** via a provenance tier, and code-enforce that the tier is present. Three sub-decisions:

1. **Provenance, not verification.** Semantic truth is not code-gateable — the servitor can't run the gate, and "is this learning true" can't be a hook. So the design records *how a fact was established*, not *whether it is true*. (A truth-verification harness is an explicit non-goal, per the audit.)

2. **A single 3-tier provenance ladder.** `metadata.provenance: agent-unverified < code-verified < user-confirmed`, orthogonal to the existing `metadata.type` (category). The ladder is the spine — it serves as the recall-weight order, the correction-precedence rule (a higher tier supersedes a lower, resolving D2's "no user-feedback channel on the autonomous path"), and the verify-on-write outcome, all at once. A fact reaches `code-verified` only when the servitor Read/Grep-confirms its named referent exists; a fact whose referent is **absent** is admitted at `agent-unverified` with an absence-note (not dropped — "absent because removed" is a legitimate learning the servitor often can't distinguish from "absent because wrong").

3. **Prompt discipline + a structural gate.** Tightening the servitor prompt (provenance tagging + verify-on-write) is paired with a PreToolUse hook that rejects a servitor fact-file `Write` whose frontmatter lacks a valid `provenance` tier. The gate is **structural** (the tag is present), never **semantic** (the tag is honest) — it stops the silent erosion of a prompt-only rule, which is the realistic failure mode (D3's verify-cue was already "under-applied" with nothing to catch it).

## Considered options

- **Pure prompt-layer (the audit's recommendation, rejected).** Smallest change, but it is exactly the prompt-only-rule pattern that erodes unobserved; WAR's code-first ethos favors gating the structural part you *can*.
- **Multi-field provenance (`source`+`verified`+`sha`) (rejected).** More queryable, but more fields to populate/gate, and precedence must be derived from a combination rather than read off one tier.
- **Refuse the write on an absent referent (rejected).** Strongest against false premises, but discards legitimate "X was removed/absent" learnings; admit-at-lowest-tier-with-a-note preserves the signal while flagging the risk.

## Consequences

- Every servitor-written fact carries a `provenance` frontmatter field; a tag-less write is denied by `validate-servitor-provenance.sh` (Write-scoped; the `MEMORY.md` index and non-servitor agents are exempt).
- Recall-weighting is **advisory** — the harness injection cannot be made to rank by tier, so the design only makes the tier *visible* (frontmatter + an index marker) and trusts the reading assistant to weight it. The spec is explicit about that ceiling.
- The gate cannot validate an `Edit` (it can't see the merged result), so in-place dedup updates rely on prompt discipline + the file's existing tag — documented, not silently skipped.
- The existing ~87 memory files are grandfathered (untagged); backfill and growth are a `consolidate-memory` job, not part of this change.

## References

- Design spec: [`docs/specs/2026-06-29-memory-provenance-design.md`](../specs/2026-06-29-memory-provenance-design.md) — full mechanics, surface changes, validation criteria.
- Audit finding **M3** (2026-06-29 agent-architecture audit) — the originating defect.
- [ADR-0002](0002-scope-by-agent-type.md) — the `agent_type` PreToolUse gating precedent this hook extends from path to content.
