---
name: entry-validation-unconditional-phase-field-check-comment-overclaims-runtime-path
description: "Hoisted entry-validation phase-field check is unconditional by design; its comment overclaims a zero-task phase builds the Provision-barrier prompt — that path is inside if(tasks.length), never runs for zero tasks"
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
`for (const t of (tasks || []))` loop, phase Engine-routes-contract-surfaces/1.1, 2026-07-12):** two
problem classes feed one hoisted `problems` array and a single `throw` at the very top of the
per-run try body — before any `pt`-tagged prompt is built and before git is touched. The
DERIVATION class (missing `planSlug`/`runId`/`worktreeRoot`/`phase.id`) is conditional — it only
fires when some task lacks explicit `branch`/`worktree`. The PHASE-FIELD class
(`ph.title`/`workingBranch`/`integrationBranch`) is checked **unconditionally**, regardless of task
count or explicitness, because those three fields are interpolated fallback-free via the `pt` tag
in *some* downstream prompts. Reusable takeaway: when a required field feeds a fallback-free
build-time interpolation (see [[pt-tagged-prompt-value-identity-beats-whole-prompt-undefined-scan]]),
validate it unconditionally at entry rather than letting the `pt` tag's own undefined-interpolation
throw fire deep inside prompt construction — the entry check turns an opaque mid-build death into a
named `held:workflow-error` with git untouched and zero agents spawned.

**The nit found on audit (disposition: note, Nit, not absorb-eligible — spans two files so it isn't
single-file):** the code comment (`workflow-template.js`, directly above the `const problems = []`
block) and the mirrored blockquote in `skills/war/references/schemas.md` (the "Entry validation
(H)" section) both justify the unconditional check by claiming "even a zero-task phase builds the
Provision-barrier prompt from these fields." That's not true: the Provision barrier is built inside
`if (tasks.length)`, and the merge/land prompts only build when `landDecision === 'landed'` and
only for merged tasks — a zero-task phase never reaches any of those `pt`-tagged builds; it hits
`held:nothing-merged` first. The check is unconditional **by design decision** (defensive,
plan-mandated), not because a zero-task phase runtime-requires it. Behavior is unaffected — this is
a doc-accuracy gap, not a functional defect.

**The durable, reusable rule:** when a comment justifies an "unconditional" guard by naming a
specific downstream consumer, verify that consumer's own conditionality — don't let "this check is
unconditional" imply "so is the code path it protects." And separately: a doc/comment inaccuracy
that spans **two files** (here: the source comment + its mirrored `schemas.md` blockquote) is
**not absorb-eligible** under this repo's disposition rules (absorb requires single-file scope) —
it will land as a bare `note` and persist past the phase unless a human or a later task
specifically picks it up. Don't assume a `note`-dispositioned doc nit self-resolves; it doesn't,
by construction.

Related: [[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]] (the sibling #742 fix
in the same task, same "route the engine error to a named held: state at the right boundary"
theme), [[source-comment-lags-emitted-prompt-after-rewrite]] (a different comment-accuracy failure
mode — drift after rewrite, vs. this one being wrong from the start).
