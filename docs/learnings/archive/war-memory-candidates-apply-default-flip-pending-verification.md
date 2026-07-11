---
name: war-memory-candidates-apply-default-flip-pending-verification
description: archive --candidates claimed non-destructive by default now (needs --apply); unverified in this checkout
metadata: 
  node_type: memory
  type: project
  keywords: 
    - war-memory archive
    - "--candidates"
    - "--apply"
    - non-destructive default
    - dry-run archive
    - destructive default
    - mass archive
    - hot set wipe
    - war-memory inbound
    - supersession pending
    - verify before trust
  provenance: agent-unverified
  slug: war-memory-candidates-apply-default-flip-pending-verification
  phase: memory-and-lessons-learned-hygiene/t1.1
  tags: 
    - memory
    - war-memory-cli
    - supersession-candidate
    - verify-before-trust
  created: 2026-07-09
  relates: 
    - "[[lessons-learned-tooling-traps]]"
    - "[[retiring-a-resolved-memory-must-check-inbound-links-hubs-stay]]"
    - "[[land-local-follower-ref-can-lag-sync-before-next-phase]]"
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# `war-memory archive --candidates` reportedly flipped to non-destructive-by-default (Task 1.1) — NOT independently verified

**Claim (from the phase's gate-audit log, task t1.1, end-states 1-2):** `archive --candidates` without
`--apply` now archives **zero** files and only prints the ranked candidate list (`walkCorpus` shows every
candidate still hot afterward); `archive --candidates --apply` archives exactly the ranked set; explicit-slug
`archive <slug>...` is unchanged. A new `war-memory inbound <slug>` subcommand is also claimed added, mechanizing
the hub-inbound-count check that [[retiring-a-resolved-memory-must-check-inbound-links-hubs-stay]] currently
documents as a manual `grep -rl "\[\[<slug>\]\]"`.

**Why this is `agent-unverified` despite specific gate-audit evidence:** at servitor write time neither
accessible checkout — `<repo-root>/skills/_shared/war-memory.mjs` (main repo root) nor
the session worktree's copy — contains an `argv.apply` gate on `cmdArchive`'s mutation loop, or any `inbound`
dispatch case (`Grep` for `inbound` returned zero matches in both; `cmdArchive`'s `for (const slug of slugs)`
loop unconditionally archives regardless of `--apply`). The landed branch
(`dev/2026-07-08-memory-and-lessons-learned-hygiene`) was not checked out anywhere the servitor's Read/Grep
tools could reach — this is the exact worktree-staleness tripwire
[[land-local-follower-ref-can-lag-sync-before-next-phase]] already documents: "write facts from such a
worktree as `agent-unverified` with an absence-note," even when the audit trail is strong.

**How to apply:** before trusting this claim or acting on it, `Grep` `skills/_shared/war-memory.mjs` at the
current tip for `argv.apply` inside `cmdArchive` and for an `inbound` CLI case. If confirmed present, this
file's claim graduates to `code-verified` and should be folded into **[[lessons-learned-tooling-traps]]**
as a superseding update to its item 1 (which currently still asserts the pre-phase "archives ALL" behavior
and is `code-verified`/`type: project` — editable in place once this claim is independently confirmed, per
the tier-precedence rule that a lower-tier fact may not silently overwrite a higher-tier one until verified
at the same-or-higher tier).

> merged into [[lessons-learned-tooling-traps]] (2026-07-11): claim independently code-verified (argv.apply dry-run gate + inbound subcommand present); folded as a superseding update to its item 1.

> archived 2026-07-11: resolved — moved to archive
