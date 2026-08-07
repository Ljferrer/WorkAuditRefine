---
name: servitor-verify-on-write-worktree-can-lag-just-landed-phase
description: "Servitor verify-on-write checkout can lag the landed phase"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: servitor-verify-on-write-worktree-can-lag-just-landed-phase
  phase: guard-floor-and-scope-hook-coverage-completeness/servitor-wrapup +20 recurrences (latest precision-chain-and-loop-breaker/phase-5 wrap-up, 2026-08-05) — MECHANIZED at phase servitor-wrapup-landed-tip (2026-07-22)
  promoted: dev/2026-07-22-aftermath-class1-postdelete-verify@phase-2
  tags:
    - servitor
    - memory-protocol
    - worktree
    - verification
    - process
  created: 2026-07-10
  updated: 2026-08-05
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
    - refinery worktree resets after land
    - ort strategy merge tree-identical
    - first-parent ancestor merge commit
    - Landed tip line present but sweep still short
    - _refinery7
    - p5-polish worktree
    - reflog HEAD history
    - dev branch ref matches but no live worktree
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
  modified: 2026-08-07T00:16:06.428Z
---

# A servitor's own worktree checkout can lag the phase it is wrapping up

## MECHANIZED (phase `servitor-wrapup-landed-tip`, landed 2026-07-22) — read this first

The engine now threads the grounding this lesson's first 13 recurrences re-derived by hand.
`skills/war/assets/workflow-template.js` — at the `LANDED-TIP ANCHOR (hoisted; spec D1)` comment
banner — hoists the `tipSha` computation to run BEFORE the Wrap-up dispatch and derives
`landedTipAnchor` (falling back to the named placeholder `landed tip unrecorded — ground via the
gate-audit auditSha entries in your audit-log input`, ADR 0034). The Wrap-up prompt carries a
`Landed tip: ...` line plus a LANDED-TIP GROUNDING ladder (cwd preflight → `gitdir`-matched
worktree lookup → ref-check dead-end → gate-audit fallback); `agents/war-servitor.md`'s Inputs
bullet mirrors both surfaces (see [[standing-instruction-vs-dispatched-prompt-coverage-split]]).
The premise this lesson corrects ("your working tree IS the committed tip") is retired at both.

**First check for future D3 passes:** a `Landed tip:` line in the spawn prompt IS the grounding —
no worktree hunt needed. Its *absence* is NOT proof the fix regressed (see the live residual
below); fall straight back to the gitdir sweep.

## The rule

The servitor's Read/Grep operate on whatever is physically checked out at its threaded cwd — a
worktree frozen at provision time (ADR 0001), never re-synced after land. When D3 verify-on-write
finds a phase-introduced referent absent, do not conclude "the fix didn't land": first weigh
checkout lag. Never write a plan/code-mismatch memory from a local-checkout absence alone — either
read the referent at a worktree proven to hold the landed tip, or tag the fact `agent-unverified`
with an absence note naming this limitation. Positive claims are exposed too, not just absences: a
gate-audit "verified MET" rationale re-read against a stale checkout is equally suspect. Getting
this wrong produces a confidently-wrong `code-verified` lesson that misleads future agents.

## Recurrences 1–13 (2026-07-10 → 2026-07-22, compressed)

Thirteen wrap-ups across many sessions and campaigns hit the hazard in every cwd topology: session
worktree on an unrelated branch (1–5, 12–13), main checkout with zero live worktrees and the landed
branch never fetched (8) or present only as a loose ref — still unreadable with no Bash and no live
checkout (9–11), and reaped task worktrees whose registry name now points at a different concurrent
plan (7). Staleness is session-stable: one HEAD/branch mismatch downgrades every D3 check for the
rest of the session — don't re-diagnose per phase. When no readable worktree resolves to the phase,
trust the gate-audit's own pinned-`auditSha`, `gateEvidence:true` confirmation over any stale-cwd
read. Ref-presence is per-wrap-up evidence only, never cacheable across phases even on the literal
same branch name. "Main checkout, no live worktree" was the modal wrap-up topology for a stretch —
check loose refs and fall back to the audit trail without hunting for reaped worktrees.

## The gitdir-sweep fallback (Recurrences 4/5/12/13 technique)

`<repo-root>/.git/worktrees/` is readable via Glob/Read with no Bash. Sweep
`Glob '.git/worktrees/*/gitdir'` (and `*/HEAD`), then pick the entry whose `gitdir` physical path
contains the phase's own plan slug (from the spawn prompt); Read/Grep referents at that path for a
true `code-verified` read of the landed tip. `gitdir` holds the full absolute path, so the sweep
works regardless of nesting — task worktrees have appeared under
`.claude/war-worktrees/<plan-slug>/`, `.claude/war/wt/<plan-slug>-<date>/`, and nested inside the
servitor's own session worktree; read the `gitdir` value, never guess a path shape. A `_refinery`
worktree's detached-HEAD sha matching the spawn prompt's stated landed tip is the strongest
positive match — better than a branch-name match. A later phase's task worktree carries every
prior-phase commit (frozen phase base), so it doubles as a persistence check on earlier phases.

- **Glob gotcha:** a bare `Glob('.git/worktrees/*')` matches files, not directories — it returns
  ZERO entries even when dozens exist, falsely triggering the "no live worktrees / trust the audit
  log" fallback. Always use a file-suffixed pattern (`*/HEAD` or `*/gitdir`).
- **Name-collision rule:** every per-run worktree name — task ids (`p1-1.1`) and the reserved
  `_refinery` alike — collides across concurrently-active plans, and git resolves each collision
  with a numeric suffix (`p1-1.11`, `_refinery8`, climbing per land). Never trust a bare name
  lookup under `.git/worktrees/`; confirm via `gitdir` (plan slug in the path) and `HEAD`, and
  re-run the sweep fresh per wrap-up rather than guessing the next suffix.

## Standing trigger + live residual (Recurrences 14–19, 2026-07-22 → 2026-07-23)

- **Standing trigger:** the session worktree
  `<repo-root>/.claude/worktrees/war-campaign-resilience-roadmap-33290f` has been the servitor's
  cwd for seven wrap-ups across five unrelated campaigns, stale every time with zero
  self-correction — the harness reuses one long-lived worktree across `/war` launches. On sight of
  that cwd, skip any preflight read of the cwd for D3 purposes and go straight to the gitdir sweep.
- **Live residual (why this stays hot despite MECHANIZED):** every wrap-up since the fix landed
  arrived through a test/orchestration harness whose spawn prompts do NOT carry the `Landed tip:`
  line — the production Lead-side `agent()` dispatch threads it; this harness path does not,
  across phases and campaigns alike. The mechanization changes the common case, not the fallback.
- A plan/ADR citing a lower recurrence count over an explicit evidence window is a point-in-time
  citation, not a contradiction of this file's higher running total — don't "correct" it.

## Recurrence 20 (precision-chain-and-loop-breaker/phase-5 wrap-up, 2026-08-05) — Landed tip: line WAS present, gitdir sweep still lands one commit short

The mechanized `Landed tip:` line was present and correctly threaded this time (rung 1
preflight was skippable). The gitdir sweep (`Glob '.git/worktrees/*/gitdir'` matched on the
plan slug `2026-08-05-precision-chain-and-loop-breaker`) found `p5-polish` and the reserved
`_refinery7` entries — but **neither had `HEAD` equal to the threaded landed tip** even though
both are the phase's own worktrees and the sweep found them correctly. Reading `_refinery7`'s
reflog (`.git/worktrees/_refinery7/logs/HEAD`) explained why: the refinery worktree's HEAD
*did* pass through the exact landed tip SHA at land time (`checkout: moving from
origin/dev/<slug> to integration/.../phase-5` immediately followed by `merge
integration/.../phase-5: Merge made by the 'ort' strategy` landing on the tip SHA) — then, one
reflog entry later, checked BACK OUT to `integration/.../phase-5` (one merge-commit behind,
i.e. the phase-close polish commit, not the dev-branch merge commit). This is standard
refiner behavior (the land step pushes to `dev/<slug>` and then returns the refinery worktree
to the phase integration branch for the next phase), not a bug — but it means **even when the
`Landed tip:` line is present and the gitdir sweep succeeds, no live worktree may be
literally parked at that SHA post-land.** The `dev/<slug>` branch *ref itself* resolved
correctly to the landed tip (readable via `Read` on `.git/refs/heads/dev/<slug>`), but per the
Ref-check rung, a ref with no live worktree checked out on it is a dead end for Read (no Bash
to `git checkout`) — do not treat a matching bare ref as sufficient for `code-verified`.

**Resolution used:** treated this as the gate-audit fallback rung (rung 4), but with a
practical refinement — the nearest live worktree (here `p5-polish`, one merge-commit behind
the landed tip) is a legitimate read surface for facts NOT touched by the final dev-merge
commit itself, since a `dev/<slug>` land merge of a phase-integration branch whose first
parent (the prior `dev/<slug>` tip) is already an ancestor of the second parent (the
integration branch tip) is tree-identical to the integration tip — the merge commit only adds
merge metadata, no content diff. Facts were still framed against the pinned `auditSha` values
in the audit-log input (`gateEvidence: true`) as the authoritative fallback, with the
`p5-polish` worktree read used only to CONFIRM specific fixes landed in the phase-close polish
commit itself (content the `auditSha` pin predates).

## Related

[[audit-worktree-pre-impl-tip-stale-verdict]] — the auditor-side analogue.
[[land-local-follower-ref-can-lag-sync-before-next-phase]] — same staleness family at the ref-sync
layer. [[war-launch-worktree-with-working-branch-checked-out-forces-manual-land]] — another
worktree/branch-state trap in the same pipeline stage.
[[audit-log-finding-can-be-stale-by-land-time]] — the negative-finding sibling of the gate-audit
edge above. Facts confirmed via the sweep technique:
[[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]],
[[entry-validation-unconditional-phase-field-check-comment-overclaims-runtime-path]],
[[integrated-tip-authoritative-gate-audit-seat-has-no-gate-log-path-field]],
[[floor-retry-add-test-package-it-worker-stays-base-tier]],
[[baseline-debt-dedup-exact-set-not-subset]],
[[git-common-dir-anchor-idiom-fail-open-gotchas]],
[[git-probing-hook-requires-fixtures-outside-any-git-repo]],
[[release-bump-slots-canonical-no-badge]],
[[byte-convergence-plan-can-mandate-per-file-import-style-variant]].
