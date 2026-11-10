---
name: reclaim-empty-orphan-proof-swallows-git-log-error-as-empty
description: "--reclaim-empty-orphan proof-1 (git log rc) is FIXED (partial-phase-recovery-and-branch-hygiene/t1); proof-2 (ls-remote --exit-code origin) still swallows a network/git error as 'origin-absent' — residual, low-harm"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: reclaim-empty-orphan-proof-swallows-git-log-error-as-empty
  phase: war-engine-harden-r3/t1.4; proof-1 fixed partial-phase-recovery-and-branch-hygiene/t1 (2026-07-11); proof-2 still open (#728 residual)
  keywords: 
    - reclaim-empty-orphan
    - ensure-integration
    - two-proof self-heal
    - three-proof self-heal
    - git log error swallowed
    - ls-remote --exit-code
    - 2>/dev/null || true
    - orphan branch deletion
    - ADR 0008 never destroy work
    - false empty proof
    - unresolvable base
    - proof-2 open
  tags: 
    - provisioning
    - gotcha
    - safety-critical
  created: 2026-07-10
  updated: 2026-07-11
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# A safety-critical "proven empty" proof can pass on a git ERROR, not just a genuinely empty diff

**Status update (2026-07-11, partial-phase-recovery-and-branch-hygiene/t1, §4.5): proof-1 is
FIXED.** `cmd_ensure_integration`'s `--reclaim-empty-orphan` self-heal now runs THREE proofs before
deleting an orphan (verified code-present, `skills/war/assets/provision-worktrees.sh`,
`cmd_ensure_integration`, ~line 289-312 at this phase's landed tip): (0) `git rev-parse --verify
--quiet "$base^{commit}"` — an unresolvable base dies `EX_FOREIGN` BEFORE proof 1 even runs; (1)
`git log --oneline "$base..$branch"` with the rc captured SEPARATELY via the `_tmp_err` idiom
(`orphan_rc=0; orphan_commits="$(git log ... 2>"$_tmp_err")" || orphan_rc=$?`) — a non-zero rc now
dies `EX_FOREIGN` surfacing git's own stderr, never swallowed into "empty" via `2>/dev/null ||
true`; (2) `git ls-remote --exit-code origin "refs/heads/$branch"` absent — **unchanged, still the
pre-existing swallow shape below.**

**Proof-2 gotcha REMAINS (audit-confirmed live at the same landed tip, Nit/note, non-blocking,
out of the §4.5 slice — end state 1 named only proof 1):**
```sh
&& ! git ls-remote --exit-code origin "refs/heads/$branch" >/dev/null 2>&1
```
The `!` treats ANY non-zero `ls-remote` exit — a genuine network/connection error (e.g. rc 128), not
just "ref genuinely absent" — as `true` ("absent"), so a sanctioned reclaim could still delete a
branch on an unproven origin state. **Why low-harm even though open:** by the time proof 2 runs,
proof 1 has already established the branch carries zero unique commits vs `$base` (i.e. `branch ==
base`), so anything deletable at that point is a no-op to re-cut regardless of what proof 2
concludes — the residual risk is narrower than it looks, but the "every destructive proof fails
loud on command error" invariant this file's title asserts is still not fully true for this
call site.

**How to apply / fix pattern (still valid, now half-applied):** before trusting an empty-output
proof from a command that can also fail, either (a) verify the referenced ref/remote resolves
first, or (b) capture the command's exit status SEPARATELY from its output — do not let `... ||
true` collapse "command failed" and "command succeeded with empty result" into the same branch.
Proof 1 now does (b); proof 2 still needs it (e.g. capture `ls-remote`'s rc separately and
distinguish rc-2 "ref absent" from other non-zero rc "error", dying loud on the latter).

Related: [[provision-nonidempotent-orphan-integration-branch-blocks-relaunch]] (the resolved
symptom this self-heal fixes), [[fail-open-design-bounds-xargs-word-split-blast-radius]] (same
"swallowed failure mode is bounded by opt-in/scope" reasoning applied elsewhere in this repo).

> archived 2026-07-11: resolved (proof-1) — kept in archive per policy (temperature transitions are
> war-memory's job, not the servitor's); proof-2 is a still-open residual, tracked here rather than
> restored to hot.
