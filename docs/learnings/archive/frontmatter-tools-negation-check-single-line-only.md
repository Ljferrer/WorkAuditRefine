---
name: frontmatter-tools-negation-check-single-line-only
description: "Negation grep must scan whole YAML tools block"
metadata: 
  node_type: memory
  type: project
  keywords: [forbidden token grep, block-style YAML, silent pass, awk block extraction, agent allowlist, must not have Bash]
  slug: frontmatter-tools-negation-check-single-line-only
  phase: 1a (F01 servitor allowlist)
  tags: 
    - test-design
    - scope-enforcement
    - confinement
    - yaml
  related: 
    - - scope-hook-blind-to-bash-write-path
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Frontmatter tools: negation check must scan the whole YAML block

**Rule:** a negation test on YAML frontmatter (e.g. "servitor must NOT have Bash") must scan the
entire `tools:` block between the `---` fences, not just the `^tools:` header line — block-style
YAML (`- Bash` on its own line) silently passes a header-line-only grep. Positive grants may stay
line-scoped: a missed positive false-FAILs (safe noise); only the negation is a silent pass.

Fixed in `hooks/validate-worktree-scope.test.sh`: it now extracts the tools block (header + `- `
continuation lines via awk) and greps the whole block; the fix comment cites this slug.

**Why:** the safety invariant rested on an unstated YAML serialization-style assumption.
**How to apply:** for any forbidden-token frontmatter check, assert over the full fenced block.

> archived 2026-07-11: resolved — moved to archive
