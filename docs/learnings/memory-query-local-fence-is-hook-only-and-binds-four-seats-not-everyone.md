---
name: memory-query-local-fence-is-hook-only-and-binds-four-seats-not-everyone
description: "The local anchor for memory_query lives only in the hook, so the main session and non-WAR agents append the query log unfenced"
metadata:
  node_type: memory
  type: project
  keywords:
    - memory_query
    - local fence
    - memory_fence
    - query log append
    - war-memory-mcp
    - unhooked caller
    - main session
    - PIN-4
    - D4
    - four seats
    - overclaim
  provenance: code-verified
  slug: memory-query-local-fence-is-hook-only-and-binds-four-seats-not-everyone
  phase: "2026-10-27-memory-query-mcp-tool/phase-1 tasks 1.1, 1.2, 1.4"
  tags:
    - war
    - hooks
    - mcp
    - memory
    - guard
    - residual
  created: 2026-10-27
  originSessionId: c3af584e-8b97-41a9-9abc-594c7cf1d33c
  modified: 2026-10-27T13:44:13.739Z
---

# The `local` fence for `memory_query` exists only in the hook

**Fact.** The server's `appendQueryLogIfPresent` checks only that `local` is an existing directory. It does not test the `*/.claude/projects/*/memory` anchor. The server header says the hook owns that anchor. The hook runs `memory_fence` only in the arms for the four seats: `war-auditor`, `war-servitor`, `war-evidence-auditor` and `war-worker`. The `*) exit 0` arm passes the main session and any non-WAR agent.

**Consequence.** A call from an unhooked caller with `local=<any existing absolute directory>` appends one `war-memory-queries.jsonl` line there. The server refuses a relative `local`. It never creates a directory. The impact is one JSON line in a directory the caller named.

**Why it landed this way.** Plan decision D4 puts the fence in the hook. Audit seats raised a server-side copy of the anchor more than once, as an `ask` and then as a note. The cost of a copy is two homes for one pattern that can drift apart. The landed server carries no anchor check. The hook header records the string-glob residual: it admits a memory-shaped path under any root, and it cannot see a symlink at that path. `repo` is not fenced, because the server only reads it.

**Doc trap.** Two prose clauses in the first drafts claimed more than the hook does:
- The `CLAUDE.md` Guard architecture clause said a `..` segment and the memory fence were denied "for everyone". It now says the hook denies a bad `local` for the four memory-tool seats. A `..` segment is the part that binds everyone.
- The ADR 0002 amendment said the refiner reads lessons through the Lead's prefetch. The refiner gets no prefetch block and no memory tool, so the sentence was false.

Describe the fence as a value that **matches** the memory-root glob, not one that sits **under** it. The hook denies a path beneath the memory dir unless its last segment is again `memory`.

**How to apply.**
- Do not file the unhooked-caller append as a bug. Closing it means a second copy of the anchor in the server.
- When you write a doc clause about this fence, name the four seats.
- Same family: [[release-blurb-overstates-guard-semantics]].

**Locate-cue (verify still present before acting).** `skills/_shared/war-memory-mcp.mjs`, the `appendQueryLogIfPresent` function and the header sentence that gives the anchor to the hook. `hooks/validate-evidence-auditor-mcp.sh`, the `memory_fence` function and the `*) exit 0` arm of the `case "$atype" in` block. `CLAUDE.md`, the Guard architecture paragraph, the clause "for the four memory-tool seats". Found at landed tip fcdc744e, read through the run's `_refinery` worktree (HEAD equal to the tip).

Related: [[bash-case-glob-path-fence-needs-an-absolute-prefix-arm-and-its-star-spans-slash]], [[evidence-mcp-hook-checks-tool-names-only-so-foreign-server-suffix-and-output-directory-writes-pass]].
