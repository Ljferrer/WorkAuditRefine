---
name: servitor-verify-on-write-worktree-can-lag-just-landed-phase
description: "Servitor verify-on-write checkout can lag the landed phase"
metadata:
  type: project
  provenance: code-verified
  slug: servitor-verify-on-write-worktree-can-lag-just-landed-phase
  phase: guard-floor-and-scope-hook-coverage-completeness/servitor-wrapup +7 recurrences (latest Sticky fallback + anchor hygiene/phase-1, 2026-07-15)
  promoted: dev/2026-07-12-war-launch-entry-validation@phase-1
  keywords:
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
    - numeric suffix
  tags:
    - servitor
    - memory-protocol
    - worktree
    - verification
    - process
  created: 2026-07-10
  updated: 2026-07-15
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# A servitor's own worktree checkout can lag the phase it is wrapping up

**What happened (code-verified — directly confirmed by Read/Grep against this session's cwd,
a session worktree under `<repo-root>/.claude/worktrees/`):** while running D3
verify-on-write for phase "guard-floor-and-scope-hook-coverage-completeness" (landed on
`dev/2026-07-08-guard-floor-and-scope-hook-coverage-completeness`), every phase-1-introduced
referent was **absent** from this checkout:

- `hooks/guard-conventions.test.sh` (t1.2's new meta-guard file) does not exist here.
- `hooks/validate-worktree-scope.sh` line 61 still reads the OLD pattern `*/../*|*/..`, not the
  widened `..|../*|*/../*|*/..` t1.1 was supposed to land.
- `skills/war/assets/assert-test-in-diff.test.sh` exists but has no `Case 10` content (t1.6).
- `skills/war/assets/workflow-template.js` has no `assertReportedPathsInWorktree` (t1.8's path
  contract).
- `CONTEXT.md` has no "ADR 0031" text anywhere, and `docs/adr/0031-*.md` does not exist (glob of
  `docs/adr/*.md` tops out at `0025-drift-guard-discipline.md`).

**Root cause (inferred, not independently confirmed):** the servitor's Read/Grep tools operate on
whatever is physically checked out at the threaded cwd, which is a session worktree — not
necessarily fast-forwarded to the phase's just-merged branch tip. A worktree base is frozen at
provision time (ADR 0001); nothing in the servitor's own toolset re-syncs it after land.

**The rule:** when D3 verify-on-write reports a referent absent, do **not** immediately conclude
"the landed tree lacks this" or "the fix wasn't actually applied." First weigh whether the local
checkout could simply be behind the branch the phase actually landed on. Concretely:
- Tag the fact `agent-unverified` with an absence-note that names *this* limitation ("referent not
  found in servitor's cwd @ phase X — cwd may lag the landed branch, verify against
  `dev/<branch>` before acting"), rather than asserting a negative finding about the landed code.
- Never write a memory fact claiming a plan/code mismatch ("the fix didn't land") purely from a
  local-checkout absence — that requires reading the actual landed branch/commit, which the
  servitor's Read tool cannot target directly (no Bash, no `git checkout`).

**Why it matters:** this is the single highest-leverage check before writing any phase-close
memory that names a specific new symbol/pattern/file from the phase just landed — getting it wrong
produces a confidently-wrong `code-verified`-tagged lesson that will mislead a future agent
searching for that referent.

## Recurrences 1–3 (2026-07-11 → 2026-07-12, one session worktree; compressed)

Three further phase wrap-ups hit the same lagging checkout — the worktree HEAD pointed at an
unrelated campaign branch across **four consecutive phases**, so the hazard is **session-stable,
not a per-phase fluke**. The durable edge each recurrence added:

1. **The trap extends to positive claims, not just absences.** A gate-audit's own approved,
   `gateEvidence:true` "verified MET" rationale can still be read against a stale checkout by the
   servitor that inherits it — an "approve" verdict never substitutes for the servitor's own D3
   re-grep of the named construct.
2. **Cheap preflight:** read the worktree's HEAD ref (the cwd's `.git` gitlink →
   `.git/worktrees/<name>/HEAD`) and compare the branch against the one the spawn prompt names as
   landed. A mismatch downgrades confidence on **every** D3 check in that session — treat the
   signal as standing for the rest of the session, don't re-litigate per phase.
3. **When the cwd is a known-stale hazard**, rely on gate-audit confirmations re-verified at the
   pinned `audit_sha` (a stronger claim than a stale-cwd Grep), and record anything else
   `agent-unverified` with the checkout-mismatch evidence inline — never assert a construct
   missing at the *true* landed tip from a lagging view.

One recurrence's stale reading was later proven stale-in-fact: the checkout still asserted
`DEFAULTS.memory.commitLearnings` as `true` after the phase that flipped it, while the live tip
holds `false` — the lag was real, not an audit failure.

## Recurrence 4 (2026-07-12, phase "Engine routes + contract surfaces" / task 1.1) — a concrete fix, not just a downgrade

The hazard recurred a fifth time in the exact same session worktree (still on an unrelated
`claude/survey-corps-*` branch, still lagging by four+ phases). This time a **positive resolution**
was available instead of just downgrading confidence: `.git/worktrees/` (readable via Glob/Read,
no Bash needed) lists every live worktree in the repo by name, including the phase's own per-task
worktree (named after the task id, e.g. `p1-1.1`) and the run-scoped `_refinery` worktree. Each
one's `HEAD` file names its checked-out branch and its `gitdir` file gives the absolute filesystem
path the worktree is physically checked out at (typically under
`<repo-root>/.claude/war-worktrees/<plan-slug>/<task-id>/`, a **session-worktree**-scoped path).
Reading `HEAD` for the task-id-named worktree, confirming it names the phase's actual working
branch (from the spawn prompt), and then Read/Grep-ing the referent **at that path** instead of at
the servitor's own stale cwd gave a true `code-verified` read of the landed code — all four new
symbols from this phase (`normalizeReportedPaths`, `FILES_CHANGED_RULE`, `held:escalation` routing,
the wave-loop-invariant comment) were confirmed present there while the servitor's own cwd still
showed none of them and the OLD (pre-rename) token still present in an unrelated stale file. This
upgrades step 2's "mismatch downgrades confidence" workaround to a first choice: **before settling
for `agent-unverified`, check whether the phase's own task worktree is still on disk under
`.git/worktrees/<task-id>/` and read the referent there.**

## Recurrence 5 (2026-07-12, phase "Engine fidelity + evidence contract" / tasks 1.1+1.2) — technique reused, plus a worktree-name-collision wrinkle

Sixth occurrence, a **new** session worktree this time (`survey-corps-06a1c3`, branch
`claude/survey-corps-06a1c3` — confirmed via `<repo-root>/.git/worktrees/survey-corps-06a1c3/HEAD`),
so this is NOT the same stale worktree as Recurrences 1-4 — a fresh instance of the general hazard,
not a continuation of one session's specific lag. The Recurrence 4 technique (read
`.git/worktrees/<task-id>/gitdir` for the phase's own task worktree, then Read/Grep the referent
there) was applied again and again succeeded fully: all seven of the phase's fixed gaps (#798,
#805, #806, #811, #815, #817, #818) were independently code-verified at
`<repo-root>/.claude/war-worktrees/2026-07-12-audit-gate-evidence-fidelity/p1-1.1/skills/war/assets/workflow-template.js`
and `.../p1-1.2/`, while this servitor's own cwd still showed the OLD pre-fix code for every one of
them (e.g. `spawn('worker')` at the floor-retry site instead of `spawnWorker('fix')`).

**New wrinkle — worktree-name collision:** `.git/worktrees/p1-1.1` existed but pointed at a
*different, unrelated* concurrently-run plan's task 1.1
(`.claude/war-worktrees/2026-07-12-war-launch-entry-validation/p1-1.1`) — git had already
auto-suffixed the name for THIS phase's real task 1.1 to `p1-1.11` (`.claude/war-worktrees/2026-07-12-audit-gate-evidence-fidelity/p1-1.1`,
confirmed via that entry's `gitdir` file). **Do not assume `.git/worktrees/<task-id>/` is unique per
task id across the whole repo** — worktree names collide across concurrent plans/runs and git
resolves it with a numeric suffix; always confirm via `gitdir` (the physical path names the
plan-slug directory) rather than trusting the worktree-registry name alone, and check `HEAD` for
the expected working branch too.

## Recurrence 6 (2026-07-15, phase "Sticky fallback + anchor hygiene" / tasks 1.1+1.2) — collision wrinkle is now a recurring pattern, not a one-off

Seventh occurrence, session worktree `survey-corps-8cc638` (its own `.git/worktrees/survey-corps-8cc638/HEAD`
resolved to `refs/heads/master`, not the landed branch — a maximally stale case: neither the phase's
`dev/2026-07-14-red-team-fallback-and-anchor-hygiene` branch NOR even this session's own working
branch). At this cwd, `skills/red-team/assets/workflow-scaffold.js` showed NONE of the phase's new
constructs (no `analyzedFallbackPinned`, no `dispatchedOn`/`fallbackEngaged` stamps), `skills/red-team/SKILL.md`
had no `analyzedAgentType` pre-flight text at all, and `skills/red-team/assets/red-team-gate.test.mjs`
still carried the pre-fix 1c title parenthetical (`"(envGap check precedes KNOWN_SEVERITIES)"`) and
1e's `'deliverableAbsence wins by order'` message — i.e. every referent named in the phase's audit
log read as absent, a maximal false-negative surface if taken at face value.

The Recurrence 4/5 technique was applied and, **again**, hit the exact Recurrence-5 name-collision
wrinkle: `.git/worktrees/p1-1.1/gitdir` pointed at a *different concurrent plan*
(`.claude/war-worktrees/2026-07-14-gate-evidence-and-prose-truth-2026-07-15/p1-1.1`); this phase's
real task 1.1 was auto-suffixed to `p1-1.11`
(`.claude/war-worktrees/2026-07-14-red-team-fallback-and-anchor-hygiene-2026-07-16/p1-1.1`), and its
task 1.2 to `p1-1.21`. Reading the referents at those two paths confirmed ALL of the phase's changes
present and correct: `analyzedFallbackPinned`/`stampResult`/the sticky-pin comments in
`workflow-scaffold.js`, and the corrected 1c/1e titles in `red-team-gate.test.mjs` (verified via
that task worktree's own `COMMIT_EDITMSG`, which also documents its own `Survey:` block satisfying
End state 10). **Takeaway: the numeric-suffix collision is not a one-off — treat it as the norm
whenever multiple plans/phases run concurrently in the same repo, and always resolve the task
worktree by walking `.git/worktrees/*/gitdir` for a path containing the CURRENT phase's plan slug,
never by assuming the bare `p1-<task-id>` name resolves to the right plan.**

## Related

[[audit-worktree-pre-impl-tip-stale-verdict]] — the auditor-side analogue (audit worktree HEAD can
be stale relative to `audit_sha`). [[land-local-follower-ref-can-lag-sync-before-next-phase]] —
same staleness family at the ref-sync layer. [[war-launch-worktree-with-working-branch-checked-out-forces-manual-land]]
— another worktree/branch-state trap in the same pipeline stage.
[[audit-log-finding-can-be-stale-by-land-time]] — the negative-finding sibling of the gate-audit
edge above. [[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]] and
[[entry-validation-unconditional-phase-field-check-comment-overclaims-runtime-path]] — the facts
Recurrence 4's task-worktree technique was used to verify.
[[integrated-tip-authoritative-gate-audit-seat-has-no-gate-log-path-field]],
[[floor-retry-add-test-package-it-worker-stays-base-tier]],
[[baseline-debt-dedup-exact-set-not-subset]] — facts Recurrence 5 confirmed RESOLVED using this
same technique.
