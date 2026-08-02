---
name: servitor-verify-on-write-worktree-can-lag-just-landed-phase
description: "Servitor verify-on-write checkout can lag the landed phase"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: servitor-verify-on-write-worktree-can-lag-just-landed-phase
  phase: guard-floor-and-scope-hook-coverage-completeness/servitor-wrapup +19 recurrences (latest cli-main-guard-normalization/phase-1 tasks 1.1-1.2 wrap-up, 2026-07-23) — MECHANIZED at phase servitor-wrapup-landed-tip (2026-07-22)
  promoted: dev/2026-07-22-cli-main-guard-normalization@phase-1
  tags:
    - servitor
    - memory-protocol
    - worktree
    - verification
    - process
  created: 2026-07-10
  updated: 2026-07-23
  keywords:
    - phase boundary persistence
    - cross-phase gitdir sweep
    - trailing release phase persistence check
    - p2-2.17
    - landed tip anchor
    - Landed tip prompt line
    - landedTipAnchor
    - grounding ladder
    - tipSha hoist
    - ADR 0034
    - premise retired
    - stale worktree
    - D3 verify-on-write
    - servitor cwd
    - landed phase
    - worktree lag
    - absence check
    - branch mismatch
    - phase wrap-up
    - checkout stale
    - gate-audit rationale
    - positive confirmation
    - session-stable lag
    - HEAD ref check
    - task worktree gitdir
    - war-worktrees
    - worktree name collision
    - reserved worktree name _refinery
    - gitdir numeric suffix
    - reaped task worktree
    - gate-audit confirmed-tip fallback
    - main checkout no worktree
    - branch not locally fetched
    - packed-refs absent
    - version-slots test
    - release version bump verification
    - loose ref present no checkout
    - same branch reused across phases
    - campaign branch persistence
    - servitor cwd is a linked worktree
    - Glob bare directory pattern returns nothing
    - Glob wildcard file suffix required
    - false negative live worktree enumeration
    - HEAD suffix glob pattern
    - nested task worktree under session worktree
    - war/wt path convention
    - task worktree naming scheme drift
    - release phase version bump confirmed via task worktree
    - p3-3.1
    - cross-phase fix persistence
    - trailing release phase wrap-up
    - test orchestration harness gap not phase-specific
    - p2-2.13
    - p2-2.16
    - _refinery6
    - persistent worktree fixture
    - cross-campaign recurrence
    - long-lived session worktree
    - war-memory-hardening
    - cli-main-guard-normalization
    - realpathSync gitdir sweep
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
  modified: 2026-07-23T20:42:04.754Z
---

# A servitor's own worktree checkout can lag the phase it is wrapping up

## MECHANIZED (phase `servitor-wrapup-landed-tip`, landed 2026-07-22) — read this first

The engine now threads the fix this lesson's 13 prior recurrences argued for. Confirmed
`code-verified` at the true landed tip (via the `.claude/war/wt/2026-07-22-servitor-wrapup-landed-tip-2026-07-22/_refinery/`
worktree — this servitor's own cwd was ITSELF stale for this exact wrap-up):

- `skills/war/assets/workflow-template.js` (comment `LANDED-TIP ANCHOR (hoisted;
  spec D1)`) hoists the `tipSha` computation that used to live only inside the handoff block to
  run BEFORE the Wrap-up dispatch, then derives `landedTipAnchor = tipSha || 'landed tip
  unrecorded — ground via the gate-audit auditSha entries in your audit-log input'` — a named
  placeholder pre-resolved before interpolation so the `pt` tag's undefined-guard can never fire
  (ADR 0034). `handoff.tipSha` itself is byte-identical to the pre-hoist value (moved verbatim).
- The Wrap-up prompt now carries a `Landed tip: ${landedTipAnchor} on ${ph.workingBranch} (plan
  slug: ...)` line plus a "LANDED-TIP GROUNDING" clause (a compact four-step ladder: cwd preflight
  → `gitdir`-matched worktree lookup → ref-check dead-end → gate-audit fallback — i.e. this
  lesson's own techniques below, now handed to the servitor up front instead of
  rediscovered per-phase).
- `agents/war-servitor.md`'s Inputs bullet mirrors the same anchor + ladder (both surfaces landed
  in the same task per the standing-instruction/dispatched-prompt coverage-split discipline — see
  [[standing-instruction-vs-dispatched-prompt-coverage-split]]).
- The premise this lesson exists to correct ("your working tree IS the committed tip") is retired
  at both surfaces — neither asserts it in any form anymore.

**Practical upshot for future D3 checks:** before running the worktree-hunt
technique below, first check whether the spawn prompt itself already carries a `Landed tip:` line
— when present, that IS the grounding, no worktree hunt needed. The worktree-hunt techniques
documented below remain the fallback for any invocation whose prompt lacks the
anchor (a null/unrecorded tip resolves to the named placeholder, which itself directs the
gate-audit-`auditSha` fallback).

## The durable rule

Origin incident (2026-07-10, phase "guard-floor-and-scope-hook-coverage-completeness" wrap-up):
every phase-1-introduced referent was absent from the servitor's session-worktree cwd. Root cause:
the servitor's Read/Grep tools operate on whatever is physically checked out at the threaded cwd —
a worktree base is frozen at provision time (ADR 0001); nothing in the servitor's own toolset
re-syncs it after land.

**The rule:** when D3 verify-on-write reports a referent absent, do **not** immediately conclude
"the landed tree lacks this" or "the fix wasn't actually applied." First weigh whether the local
checkout could simply be behind the branch the phase actually landed on. Concretely:
- Tag the fact `agent-unverified` with an absence-note that names *this* limitation ("referent not
  found in servitor's cwd @ phase X — cwd may lag the landed branch, verify against
  `dev/<branch>` before acting"), rather than asserting a negative finding about the landed code.
- Never write a memory fact claiming a plan/code mismatch ("the fix didn't land") purely from a
  local-checkout absence — that requires reading the actual landed branch/commit, which the
  servitor's Read tool cannot target directly (no Bash, no `git checkout`).
- The trap extends to positive claims, not just absences: a gate-audit's own approved,
  `gateEvidence:true` "verified MET" rationale can still be read against a stale checkout by the
  servitor that inherits it — an "approve" verdict never substitutes for the servitor's own D3
  re-grep of the named construct.

**Why it matters:** this is the single highest-leverage check before writing any phase-close
memory that names a specific new symbol/pattern/file from the phase just landed — getting it wrong
produces a confidently-wrong `code-verified`-tagged lesson that will mislead a future agent
searching for that referent.

## The gitdir-sweep technique (the fallback when the prompt lacks the anchor)

`.git/worktrees/` (readable via Glob/Read, no Bash needed) lists every live worktree in the repo
by name, including the phase's own per-task worktree (named after the task id, e.g. `p1-1.1`) and
the run-scoped `_refinery` worktree. Each one's `HEAD` file names its checked-out branch and its
`gitdir` file gives the absolute filesystem path the worktree is physically checked out at.
Reading `HEAD`/`gitdir` for the phase's own worktree, confirming it matches the phase (see the
wrinkles below), and then Read/Grep-ing the referent **at that physical path** instead of at the
servitor's own stale cwd gives a true `code-verified` read of the landed code. Grepping each
`gitdir`'s physical-path segment for the phase's own plan slug (from the spawn prompt) is the
fastest way to pick the right entry out of 50+ worktree registrations.

**Glob gotcha:** a bare `Glob('.git/worktrees/*')` pattern returns nothing and reads as "no live
worktrees" even when many entries exist — Glob matches *files*, not bare directory names, so the
pattern must target a file one level inside (`'.git/worktrees/*/HEAD'` or
`'.git/worktrees/*/gitdir'`), never the bare directory glob. Re-run with the file-suffixed pattern
before concluding "zero live worktrees" — a bare-glob false-negative would otherwise wrongly
trigger the trust-the-audit-log fallback in a session where a direct `code-verified` read was
available all along.

## Collision and naming wrinkles

- **Name collisions:** ANY fixed/reserved worktree name the WAR engine uses per-run — task ids
  (`p1-1.1`) AND the constant `_refinery` alike — can collide across concurrently-active plans in
  the same repo, and git resolves every collision with a numeric suffix (`_refinery`, `_refinery2`,
  `_refinery3`, …). Never trust a bare name lookup under `.git/worktrees/`; always (a) enumerate
  every entry whose `gitdir` file's physical path contains the phase's own plan-slug (from the
  spawn prompt), and (b) prefer the merge/`_refinery` worktree's `HEAD` sha, compared directly
  against the spawn prompt's stated landed-tip sha, as the strongest positive match — a
  branch-name match is good, a sha match is better (a merge worktree is typically left checked out
  at the precise merge commit rather than a moving branch ref).
- **Reaped worktrees:** the technique has a precondition — the worktree must still be on disk.
  Post-land, Refine reaps task worktrees, so by servitor wrap-up time a plausible task-id match
  under `.git/worktrees/<task-id>/` may (a) not exist at all, or (b) exist but resolve to an
  unrelated concurrent plan (never assume presence proves relevance — check `gitdir` every time,
  even when the task-id string matches exactly).
- **Nesting:** the task worktree's physical path is not reliably a sibling of `<repo-root>` — it
  can be nested several levels inside the servitor's own session worktree
  (`<session-worktree>/.claude/war/wt/<plan-slug>-<date>/<task-id>/`). The
  `Glob '.git/worktrees/*/gitdir'` sweep still finds it regardless of nesting depth because
  `gitdir` always holds the full absolute path — read that value rather than guessing a path
  shape.
- **Cross-phase reads:** a later phase's task worktree is cut from the frozen phase base which
  already includes earlier phases' merged commits — a valid single read site for both the trailing
  phase's own change AND a persistence check on earlier phases' content.

## Fallback ladder when no direct read is possible

When no live worktree resolves to the right plan: before falling back to "trust gate-audit,"
first confirm the landed branch has **any** local ref at all (`Glob .git/worktrees/*/HEAD` for a
live checkout, then `Grep` `.git/packed-refs` for the branch name, then check
`.git/refs/heads/<branch>` directly). All-absent is a strong, cheap signal the cwd/main-checkout
was **never fetched to** this local git — fall back to trusting the audit trail immediately. A
resolvable **loose** ref with zero live worktrees is the same dead end one Grep later — a ref is
still not a checkout; don't treat "the branch exists locally" alone as progress toward a direct
read. The fallback itself: rely on gate-audit confirmations re-verified at the pinned `audit_sha`
(a stronger claim than a stale-cwd Grep), and record anything else `agent-unverified` with the
checkout-mismatch evidence inline — never assert a construct missing at the *true* landed tip
from a lagging view. Ref-presence checks are per-wrap-up, not cacheable across phases even on the
literal same branch name.

## Frequency signal (19 recurrences, 2026-07-10 → 2026-07-23; narratives compressed 2026-08-02)

- The hazard is **session-stable, not a per-phase fluke**: one session worktree stayed on an
  unrelated branch across four consecutive phases (Recurrences 1–3); one specific worktree
  (`war-campaign-resilience-roadmap-33290f`) recurred stale across **seven** wrap-ups spanning
  five unrelated campaigns (Recurrences 12, 14–19) — the harness reuses one long-lived worktree
  across many separate `/war` launches. Once a worktree name has been flagged stale here, assume
  it stays the servitor's cwd — and stays stale — indefinitely; go straight to the `gitdir`-sweep
  on sight of that name.
- "Main checkout, no live worktree" is the **modal** topology at wrap-up time (Recurrences 8–11)
  — go straight to the loose-ref check and gate-audit fallback rather than hunting for a
  task/`_refinery` worktree Refine has already reaped.
- The mechanized `Landed tip:` anchor never appeared in the spawn prompts of Recurrences 14–19 —
  a test/orchestration-harness dispatch path (not the production Lead-side `agent()` dispatch),
  harness-wide across campaigns. The anchor's *absence* is not proof the fix didn't land; on
  absence, fall straight back to the `gitdir`-sweep. The fallback techniques above remain
  operative for that path.
- The numbered `_refinery` suffix keeps climbing (`_refinery8` by Recurrence 19) — always re-run
  the sweep fresh per wrap-up rather than guessing the next suffix from the last-seen number.
- Aside (Recurrence 14): a plan/ADR citing a lower recurrence count than this file's frontmatter
  is a window-bounded point-in-time citation, not a contradiction to reconcile — don't "correct"
  the plan-directed number to match the live running total.

## Related

[[audit-worktree-pre-impl-tip-stale-verdict]] — the auditor-side analogue (audit worktree HEAD can
be stale relative to `audit_sha`). [[land-local-follower-ref-can-lag-sync-before-next-phase]] —
same staleness family at the ref-sync layer. [[war-launch-worktree-with-working-branch-checked-out-forces-manual-land]]
— another worktree/branch-state trap in the same pipeline stage.
[[audit-log-finding-can-be-stale-by-land-time]] — the negative-finding sibling of the gate-audit
edge above. [[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]] and
[[entry-validation-unconditional-phase-field-check-comment-overclaims-runtime-path]] — facts
the task-worktree technique was used to verify.
[[integrated-tip-authoritative-gate-audit-seat-has-no-gate-log-path-field]],
[[floor-retry-add-test-package-it-worker-stays-base-tier]],
[[baseline-debt-dedup-exact-set-not-subset]] — facts confirmed RESOLVED using this
same technique.
[[git-common-dir-anchor-idiom-fail-open-gotchas]],
[[git-probing-hook-requires-fixtures-outside-any-git-repo]] — facts confirmed
`code-verified` using this same technique.
[[release-bump-slots-canonical-no-badge]] — the version-slot facts repeatedly confirmed (or, from
a stale main checkout, deliberately NOT confirmed) via this technique across the release-phase
recurrences. [[byte-convergence-plan-can-mandate-per-file-import-style-variant]] — a fact
Recurrence 19 confirmed `code-verified` via the `_refinery8` worktree.
