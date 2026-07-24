---
name: seeding-md-seed-local-render-block-omits-conditional-repo-flag
description: "seeding.md's `## Seed` local-destination bullet mandates `--repo docs/learnings/` conditionally in prose but the code block right below it shows the bare render-index call — a copy-paste footgun that silently drops [repo] rows"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: seeding-md-seed-local-render-block-omits-conditional-repo-flag
  phase: lessons-learned-seed/2
  keywords: 
    - seeding.md
    - "--repo"
    - render-index --local
    - repo rows dropped
    - conditional flag
    - doc code block
    - Seed mode
    - copy-paste footgun
    - war-memory.mjs
    - local destination
  tags: 
    - war
    - documentation-accuracy
    - memory-system
    - doc-example-drift
  created: 2026-07-22
  originSessionId: 8a3e4cd6-492f-43ba-b10c-46e460a457b9
  modified: 2026-07-22T22:57:04.378Z
---

# `seeding.md`'s `## Seed` local-render code block omits the conditional `--repo` flag its own prose mandates

**Found (code-verified — `skills/lessons-learned/references/seeding.md`, `## Seed` step 5,
"Local destination:" bullet; verify still present before acting):** the prose says "then render,
passing `--repo docs/learnings/` **iff** `$REPO_ROOT` is non-empty:", but the fenced code block
immediately below it shows only:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/_shared/war-memory.mjs" render-index --local "$MEM"
```

— no `--repo` at all, and no branching to show what the "iff non-empty" case looks like. An
operator or agent following the block literally (rather than the prose's conditional) always
renders local-only, which silently drops every `[repo]` row on next render if `$REPO_ROOT` is
in fact non-empty — exactly the footgun this repo already names as a "known trap" (see
`CLAUDE.md`: "`docs/learnings/` on a branch/PR not yet merged ⇒ `render-index --local`-only
silently drops every `[repo]` row — pass `--repo` whenever the dir exists") and that several
existing lessons independently document for *other* call sites
([[archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it]]). This is a fresh
instance at a call site those lessons don't cover, and the phase's own doc-contract test
(`skills/lessons-learned/lessons-learned-doc-contract.test.mjs`) has no assertion scoped to this
specific "Local destination" code block — it locks the `--repo`-carrying render lines elsewhere
(the housekeeping-pass Phase 5 render/archive lines, tests 1 and 13) but not this seed-mode one.
Audited as Nit/disposition:note (non-blocking) and left unfixed at land.

**Why durable:** it is a concrete, repeat instance of a pattern this codebase has hit and
documented multiple times before (an illustrative command block that doesn't reflect a
conditional the adjacent prose requires) — worth flagging on sight rather than re-discovering,
since the fix each time is the same one-line addition (show both branches, or show the `--repo`
form with a comment noting it's conditional) and the miss is otherwise easy to wave through as a
Nit.

**How to apply:** when adding or reviewing a code block that follows an "iff <condition>" prose
instruction, check the code block actually demonstrates the conditional branch — a bare example
that silently picks the "false" branch every time is a latent footgun, not neutral prose. If
`seeding.md` is next touched, consider either showing the `--repo docs/learnings/` form (since a
local-destination run can still have a non-empty `$REPO_ROOT`) or adding a doc-contract test
anchored specifically on this bullet, mirroring the existing Phase-5-render lock.

Related: [[archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it]].
