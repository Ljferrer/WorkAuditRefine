---
name: reclaim-empty-orphan-proof-swallows-git-log-error-as-empty
description: "git log 2>/dev/null||true reads a git error as a proven-empty branch"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: reclaim-empty-orphan-proof-swallows-git-log-error-as-empty
  phase: war-engine-harden-r3/t1.4
  keywords: 
    - reclaim-empty-orphan
    - ensure-integration
    - two-proof self-heal
    - git log error swallowed
    - 2>/dev/null || true
    - orphan branch deletion
    - ADR 0008 never destroy work
    - false empty proof
    - unresolvable base
  tags: 
    - provisioning
    - gotcha
    - safety-critical
  created: 2026-07-10
  promoted: true
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# A safety-critical "proven empty" proof can pass on a git ERROR, not just a genuinely empty diff

**What.** `cmd_ensure_integration`'s opt-in `--reclaim-empty-orphan` two-proof self-heal (ADR 0008)
computes proof (1) as:

```sh
orphan_commits="$(git log --oneline "$base..$branch" 2>/dev/null || true)"
if [ -z "$orphan_commits" ] && ! git ls-remote --exit-code origin "refs/heads/$branch" ...
```

`2>/dev/null || true` swallows ANY `git log` failure into empty stdout — not just a genuinely
empty commit range. If `$base` is unresolvable (typo'd or absent ref), `git log` exits non-zero
with empty stdout, so `[ -z "$orphan_commits" ]` **falsely passes** proof 1. Combined with an
unreachable/typo'd origin also reading as "absent" in proof 2 (same swallow-pattern), the branch
would be `git branch -D`-deleted even though it might carry real unique commits — undercutting the
ADR 0008 "never destroy work" invariant this exact mechanism exists to guarantee.

**Verified still present at land** (war-engine-harden-r3/t1.4, gate-audit Minor finding,
disposition `follow-up` — not absorbed): `skills/war/assets/provision-worktrees.sh`,
`cmd_ensure_integration`, the `if [ "$reclaim" -eq 1 ]; then` block (~line 271-281 at the landed
tip). Locate cue: grep `orphan_commits="\$(git log`.

**Why it shipped anyway (Minor, not blocking):** not reachable via the sanctioned recovery
relaunch path (the Lead supplies the real frozen phase base, which resolves), and the flag is
opt-in — blast radius requires operator misuse of `--reclaim-empty-orphan` with a bad `$base`.

**How to apply / fix pattern:** before trusting an empty-output proof from a command that can also
fail, either (a) verify the referenced ref/remote resolves first (`git rev-parse --verify --quiet
"$base"`, die loud on failure), or (b) capture the command's exit status SEPARATELY from its
output — do not let `2>/dev/null || true` (or any `... || true`) collapse "command failed" and
"command succeeded with empty result" into the same branch. This is a general pattern for any
proof-of-absence built on shell command output, not specific to this one call site.

Related: [[provision-nonidempotent-orphan-integration-branch-blocks-relaunch]] (the resolved
symptom this self-heal fixes), [[fail-open-design-bounds-xargs-word-split-blast-radius]] (same
"swallowed failure mode is bounded by opt-in/scope" reasoning applied elsewhere in this repo).
