---
name: lessons-learned-tooling-traps
description: "archive --candidates archives ALL; commit mv bug"
metadata:
  node_type: memory
  type: project
  keywords: [war-memory archive, mass archive, hot set wipe, safe-swap, variable clobber, destructive default, memory restore]
  provenance: code-verified
  phase: ops/2026-07-04
  originSessionId: c9826f69-a02b-4f51-b701-a3f4033e1864
---

Two /lessons-learned tooling traps (ops/2026-07-04), both absorbed by the staging invariant (live store never touched):

1. **`war-memory archive --candidates` is an ACTION, not a listing** — it archives every listed candidate (at a render REFUSE that is the entire hot set). Behavior unchanged as of v0.14.6; the refusal message in `skills/_shared/war-memory.mjs` now states it archives ALL candidates. Recovery: the archive mutation is exactly append-note + rename, so a byte-exact restore is possible.

2. **`safe-swap.sh commit` global-variable clobber** — RESOLVED on master (commit 1f3c6fb): `do_verify`'s vars are now `local` in `skills/lessons-learned/assets/safe-swap.sh`, and `safe-swap.test.sh` CASE 4 covers the commit path end-to-end.

**Why:** both traps look like successful/harmless commands until you inspect state.
**How to apply:** never run `archive --candidates`; archive explicit slugs only. After any safe-swap `commit` error, check `ls memory*` before retrying.
