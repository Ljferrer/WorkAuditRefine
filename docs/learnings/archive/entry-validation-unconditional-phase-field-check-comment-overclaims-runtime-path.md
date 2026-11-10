---
name: entry-validation-unconditional-phase-field-check-comment-overclaims-runtime-path
description: "Validate fields that feed fallback-free pt interpolation unconditionally at entry, and never justify an unconditional guard by naming a downstream path that is itself conditional"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: entry-validation-unconditional-phase-field-check-comment-overclaims-runtime-path
  phase: "Engine-routes-contract-surfaces/1.1 (2026-07-12, fixes"
  keywords:
    - entry-validation problems[]
    - hoisted problems array
    - pt-tagged interpolation
    - fail-fast at entry
    - held:workflow-error
    - phase.title workingBranch integrationBranch
    - unconditional by design
    - zero-task phase
    - Provision-barrier prompt
    - if(tasks.length)
    - cross-file doc inaccuracy
    - schemas.md blockquote
    - comment accuracy
  tags:
    - workflow-template
    - engine
    - validation
    - doc-accuracy
    - design-pattern
  created: 2026-07-12
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
---

# Fail-fast entry validation is a good pattern; don't justify "unconditional" by citing a path that's actually conditional

**The pattern (fixes #740, verify still present before acting — found at
`skills/war/assets/workflow-template.js`, the `const problems = []` block right before the
`for (const t of (tasks || []))` loop):** two problem classes feed one hoisted `problems` array and
a single `throw` at the very top of the per-run try body — before any `pt`-tagged prompt is built
and before git is touched. The DERIVATION class (missing `planSlug`/`runId`/`worktreeRoot`/`phase.id`)
is conditional — it only fires when some task lacks explicit `branch`/`worktree`. The PHASE-FIELD
class (`ph.title`/`workingBranch`/`integrationBranch`) is checked **unconditionally**, because those
three fields are interpolated fallback-free via the `pt` tag in *some* downstream prompts.

**Rule:** when a required field feeds a fallback-free build-time interpolation (see
[[pt-tagged-prompt-value-identity-beats-whole-prompt-undefined-scan]]), validate it unconditionally
at entry rather than letting the `pt` tag's own undefined-interpolation throw fire deep inside
prompt construction. The entry check turns an opaque mid-build death into a named
`held:workflow-error` with git untouched and zero agents spawned.

**The nit found on audit:** the code comment above the `const problems = []` block and the mirrored
blockquote in `skills/war/references/schemas.md` (the "Entry validation (H)" section) both justified
the check by claiming "even a zero-task phase builds the Provision-barrier prompt from these
fields." That's not true: the Provision barrier is built inside `if (tasks.length)`, and the
merge/land prompts only build when `landDecision === 'landed'` and only for merged tasks. A
zero-task phase hits `held:nothing-merged` first. The check is unconditional **by design decision**
(defensive, plan-mandated). Behavior is unaffected — this is a doc-accuracy gap.

**Rule:** when a comment justifies an "unconditional" guard by naming a specific downstream
consumer, verify that consumer's own conditionality. Don't let "this check is unconditional" imply
"so is the code path it protects."

Related: [[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]] (the sibling #742 fix
in the same task, same "route the engine error to a named held: state at the right boundary"
theme), [[source-comment-lags-emitted-prompt-after-rewrite]] (a different comment-accuracy failure
mode — drift after rewrite, vs. this one being wrong from the start).

> archived 2026-07-26: resolved — moved to archive
