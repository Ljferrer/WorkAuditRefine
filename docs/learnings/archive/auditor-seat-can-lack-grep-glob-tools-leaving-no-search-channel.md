---
name: auditor-seat-can-lack-grep-glob-tools-leaving-no-search-channel
description: "A live auditor seat may have no Grep/Glob tool while shell grep is guard-denied, leaving no search channel"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - auditor
    - Grep tool
    - Glob tool
    - search channel
    - validate-auditor-git.sh
    - tool provisioning
    - no search tool
    - git log -S
    - git blame -L
    - degraded search
  provenance: agent-unverified
  slug: auditor-seat-can-lack-grep-glob-tools-leaving-no-search-channel
  phase: 2026-08-06-gate-audit-finding-routing/2.1
  tags: 
    - auditor
    - tooling
    - gate-audit
  created: 2026-08-15
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-16T02:54:03.729Z
---

# An auditor seat can be dispatched with the Grep/Glob remedy stated, but the tools absent

## What happened

Field datum from the Task 2.1 audit run of `2026-08-06-gate-audit-finding-routing`, phase 2 —
this is a runtime/harness observation, not a repo-code fact, so it cannot be D3-verified via
Read/Grep (no referent exists to inspect; the absence is about tool *provisioning* at dispatch
time, which is external to the repo). The `agents/war-auditor.md` card's frontmatter DOES declare
`tools: Read, Grep, Glob, Bash` (code-verified present at the landed tip), and both the read-only
git guard's forbidden-character deny message and the new SEARCH-TOOLING RULE bullet (Task
2.1(c)/#1412 fix 3) tell a denied seat to "search with the Grep/Glob tools instead of shell
grep/git grep".

In this seat's own session, the Grep tool returned "No such tool available: Grep — search file
contents with grep via the Bash tool instead", while the guard denied both a quoted
`grep -rn "tok" path` (forbidden character: quotes) and a bare `grep -n tok path` ("not a git
command"). Net effect: no search channel at all — the remedy the guard and the doctrine both
point to was unavailable, forcing whole-file Reads.

## Durable rule

- Do not assume a card's `tools:` frontmatter is what actually gets provisioned at dispatch —
  when authoring guard/deny messages or doctrine that names a specific tool as "the" remedy,
  consider a fallback that degrades gracefully (e.g. `git log -S<token>` / `git log -G<regex>` /
  `git blame -L /regex/,+n` are all inside the read-only git guard's allowlist and work without
  Grep/Glob).
- If a future auditor-guard message revision is scoped (e.g. a metacharacter-specific deny),
  consider phrasing the remedy as "Read/Grep/Glob tools" (plural, degrading) rather than a single
  named tool, and/or naming the git-only fallback path explicitly.
- Treat this as a recurring risk to design guard messages against, not as a currently-broken
  repo fact — the underlying cause (tool provisioning per seat) lives outside this repo and could
  already differ by the time this is read.

## Locate cue

`agents/war-auditor.md` frontmatter `tools:` line and the "Search with the Grep/Glob tools" bullet
(~line 27) — verify still present before acting. `hooks/validate-auditor-git.sh` forbidden-char
deny message (~line 91) names the same remedy.

> archived 2026-08-25: resolved — moved to archive
