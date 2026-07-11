---
name: provision-nonidempotent-orphan-integration-branch-blocks-relaunch
description: Half-run provision orphans branch → relaunch exit 3; RESOLVED (opt-in) by --reclaim-empty-orphan two-proof self-heal on ensure-integration
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: provision-nonidempotent-orphan-integration-branch-blocks-relaunch
  phase: memsub/p2; resolved war-engine-harden-r3/t1.4 (2026-07-10)
  keywords: 
    - provision-barrier
    - ensure-integration
    - foreign-branch
    - exit-3
    - EX_FOREIGN
    - ADR-0003
    - ADR-0008
    - owned-refs
    - orphan-branch
    - reclaim-empty-orphan
    - non-idempotent
    - held-escalation
    - self-heal
  tags: 
    - provisioning
    - exit-codes
    - gotcha
  created: 2026-07-07
  promoted: true
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# Half-run provision orphans an integration branch and blocks relaunch — now self-heals opt-in, but the "empty" proof trusts a swallowed git-log error

**Original symptom (memsub/p2, trigger fixed in commit 22be2a6):** `record_owned_file` in
`skills/war/assets/provision-worktrees.sh` lacked `mkdir -p "$(dirname "$ofile")"` before the
append, so a missing `teams/<runId>/` dir could kill `ensure-integration` after the branch was
created but before ownership was recorded — leaving an orphan `integration/<planSlug>/phase-N`
branch that a relaunch then refuses to reuse (`EX_FOREIGN`, exit 3, per ADR 0003).

**RESOLVED (opt-in) — war-engine-harden-r3/t1.4, 2026-07-10:** `cmd_ensure_integration` now accepts
`--reclaim-empty-orphan` (Lead-supplied only on a sanctioned recovery relaunch) — a TWO-PROOF
self-heal that mechanizes the manual recipe below: (1) `git log --oneline "$base..$branch"` empty
— no unique commits, so deletion resets no work; (2) `git ls-remote --exit-code origin
"refs/heads/$branch"` absent — never published. Both proofs must hold or the branch is left
untouched and the die is unchanged (`EX_FOREIGN`, exit 3). Flag absent → byte-identical prior
behavior. Verified present at `skills/war/assets/provision-worktrees.sh` (landed tip,
`cmd_ensure_integration`, ~line 271-283).

**New residual gotcha in the self-heal itself:** proof (1) is implemented as
`orphan_commits="$(git log --oneline "$base..$branch" 2>/dev/null || true)"` — this swallows ANY
`git log` failure (e.g. an unresolvable `$base`) into empty stdout, so an unresolvable base would
falsely satisfy "proven empty" and, combined with an unreachable origin also reading as "absent"
in proof (2), could delete a branch that in fact carries real unique commits. This was flagged at
gate-audit (Minor, disposition `follow-up`, not absorbed — needs a `git rev-parse --verify --quiet
"$base"` guard or separate exit-status capture) and is confirmed **still present** in the landed
tip. Full detail: [[reclaim-empty-orphan-proof-swallows-git-log-error-as-empty]].

**Durable residue (still holds):**
- A phase returning `held:escalation` with **every** worker escalating on "Provision precondition
  violated: worktree/branch does not exist" is a **provision-barrier failure** — diagnose the
  provision refiner's transcript, not the workers'.
- The integration branch is `integration/<planSlug>/phase-N` — derived from slug+phase, **not**
  runId. A fresh runId does NOT dodge a collision with an orphan branch; the orphan must be
  cleared (by hand, or now by `--reclaim-empty-orphan` on a sanctioned relaunch) regardless.
- ADR 0003 still holds: `cmd_ensure_integration` refuses (exit 3 / `EX_FOREIGN`) to reuse an
  integration branch it does not own. **Never delete an orphan integration branch without first
  proving it carries no unique commits** — otherwise you discard landed work (ADR 0008).

**How to apply:** on a genuinely half-run orphan, prefer `--reclaim-empty-orphan` over the old
manual `git branch -D` recipe now that it exists — but until the proof-1 gotcha above is fixed,
manually sanity-check that `$base` resolves (`git rev-parse --verify --quiet "$base"`) before
trusting the flag on an unusual/typo'd base.

Related: [[provision-ensure-exclude-cwd-contract]], [[provision-barrier-refiner-owned-not-worker-self-create]], [[held-escalation-lead-manual-completion]], [[reclaim-empty-orphan-proof-swallows-git-log-error-as-empty]].
