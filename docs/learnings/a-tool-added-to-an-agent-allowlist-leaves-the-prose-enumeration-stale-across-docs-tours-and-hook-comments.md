---
name: a-tool-added-to-an-agent-allowlist-leaves-the-prose-enumeration-stale-across-docs-tours-and-hook-comments
description: Adding a tool to the servitor tools line left an only-Read/Grep/Glob/Write/Edit enumeration stale in many surfaces no test reads
metadata:
  node_type: memory
  type: project
  keywords:
    - servitor allowlist
    - tools line
    - enumeration drift
    - only Read Grep Glob Write Edit
    - stale prose
    - architect tour
    - hook header comment
    - doc-truth sweep
    - grep the old string
    - allowlist change
  provenance: code-verified
  slug: a-tool-added-to-an-agent-allowlist-leaves-the-prose-enumeration-stale-across-docs-tours-and-hook-comments
  phase: 2026-10-27-memory-query-mcp-tool/phase-1 tasks 1.3 and p1-polish
  tags:
    - war
    - doc-truth
    - servitor
    - cascade
    - sweep
  created: 2026-10-27
  originSessionId: c3af584e-8b97-41a9-9abc-594c7cf1d33c
  modified: 2026-10-27T13:45:29.835Z
---

# One allowlist, many prose copies

**What happened.** Task 1.3 added the memory query tool to the `tools:` line of `agents/war-servitor.md`. Eight surfaces narrate that allowlist as "only" or "exactly" `Read/Grep/Glob/Write/Edit`:
- `agents/war-servitor.md`, the local-memory-root bullet;
- `skills/war/SKILL.md`, the servitor confinement bullet;
- `skills/war/references/schemas.md`, the servitor schema prose;
- `skills/war/references/design.md`, the servitor role bullet;
- `skills/war/references/worker-servitor-edges.md`, the Servitor confinement paragraph;
- `.tours/architect-war-system.tour`, the servitor wrap-up step;
- the header of `hooks/validate-worktree-scope.sh`;
- a comment in `hooks/validate-worktree-scope.test.sh`.

No plan task listed most of them. The structural assertion in the scope-hook test checks only that the allowlist tools are present and `Bash` is absent. So the stale prose stayed green. Auditors found the surfaces in three waves: the card bullet at task 1.3, the reference and hook comments at the same task's cascade check, and the `SKILL.md`, `schemas.md`, `design.md` and tour lines at the phase-close polish audit.

**State at land.** Each of the eight now says "plus the read-only memory query tool". One surface keeps the old wording by design: `docs/adr/0022-servitor-local-root-writes-gate-2-promotion.md` still says `learningsTarget` feeds "the worker self-query `--repo`". It is a dated decision record, so it stays.

**How to apply.**
- When you change any agent's tool allowlist, Grep for both spellings of the old enumeration: `Read/Grep/Glob/Write/Edit` and `Read, Grep, Glob, Write, Edit`. Search `skills/`, `agents/`, `hooks/`, `.tours/`, `docs/adr/` and `CONTEXT.md`.
- A tour file is JSON with very long lines. Use a Grep with a short window around the match.
- Do not stop at the plan's `Files:` list. Route finds outside the slice to the phase-close sweep.

Same family: [[default-flip-must-audit-all-doc-surfaces]], [[a-new-agents-tier-leaves-adr-0050-readme-and-design-md-tier-lists-stale]], [[plan-survey-token-sweep-misses-untagged-siblings]].

**Locate-cue (verify still present before acting).** Grep `Read/Grep/Glob/Write/Edit` over `skills/war/SKILL.md`, `skills/war/references/schemas.md`, `skills/war/references/design.md` and `.tours/architect-war-system.tour`, and `Read, Grep, Glob, Write, Edit` over `skills/war/references/worker-servitor-edges.md` and `hooks/validate-worktree-scope.sh`. Each hit carries "plus the read-only memory query tool". Found at landed tip fcdc744e, read through the run's `_refinery` worktree (HEAD equal to the tip).
