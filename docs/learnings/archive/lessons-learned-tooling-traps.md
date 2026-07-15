---
name: lessons-learned-tooling-traps
description: "archive --candidates is dry-run (--apply mutates); inbound subcommand exists"
metadata:
  node_type: memory
  type: project
  keywords: [war-memory archive, mass archive, hot set wipe, safe-swap, variable clobber, destructive default, memory restore]
  provenance: code-verified
  phase: ops/2026-07-04
  originSessionId: c9826f69-a02b-4f51-b701-a3f4033e1864
---

Two /lessons-learned tooling traps (ops/2026-07-04), both absorbed by the staging invariant (live store never touched):

1. **`war-memory archive --candidates` — SUPERSEDED (v0.14.19, memory-and-lessons-learned-hygiene t1.1; code-verified 2026-07-11):** `--candidates` alone is now a non-destructive dry-run listing; mutation requires explicit `--apply` (or an explicit slug list). `cmdArchive` gates its mutation loop on `argv.apply`, and a `war-memory inbound <slug>` subcommand mechanizes the hub-inbound-count check. Historical trap (pre-v0.14.19): it archived every candidate — at a render REFUSE, the entire hot set. Recovery remains append-note + rename, so a byte-exact restore is possible. (Folded from war-memory-candidates-apply-default-flip-pending-verification, now archived.)

2. **`safe-swap.sh commit` global-variable clobber** — RESOLVED on master (commit 1f3c6fb): `do_verify`'s vars are now `local` in `skills/lessons-learned/assets/safe-swap.sh`, and `safe-swap.test.sh` CASE 4 covers the commit path end-to-end.

**Why:** both traps look like successful/harmless commands until you inspect state.
**How to apply:** `archive --candidates` is safe to run as a listing; add `--apply` only deliberately, or archive explicit slugs. After any safe-swap `commit` error, check `ls memory*` before retrying.

> archived 2026-07-15: resolved — moved to archive
