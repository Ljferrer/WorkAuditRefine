---
name: servitor-verify-on-write-worktree-can-lag-just-landed-phase
description: "Servitor verify-on-write checkout can lag the landed phase"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: servitor-verify-on-write-worktree-can-lag-just-landed-phase
  phase: guard-floor-and-scope-hook-coverage-completeness/servitor-wrapup +9 recurrences (latest learnings-recipe-drift-sweep/1.1-1.3 wrap-up, 2026-07-16)
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
  tags:
    - servitor
    - memory-protocol
    - worktree
    - verification
    - process
  created: 2026-07-10
  updated: 2026-07-17
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

## Recurrence 6 (2026-07-15, phase "Anchor the three surfaces" / campaign-state-anchor tasks 1.1-1.3) — the collision now hits a RESERVED name, `_refinery`

Seventh occurrence, in a session worktree named `survey-corps-8cc638` (branch
`claude/survey-corps-8cc638`) — again not the same worktree as any prior recurrence, and again on a
branch wholly unrelated to the landed phase (`dev/2026-07-15-campaign-state-anchor`). Confirmed via
both this worktree's own `.git` gitlink → `<repo-root>/.git/worktrees/survey-corps-8cc638/gitdir`
(unrelated plan) AND the **main checkout's** detached HEAD (`<repo-root>/.git/HEAD`, sha `0a42e34c…`)
also predating the landed phase — this time NEITHER the session worktree NOR the main checkout had the fix.

Applying the Recurrence 4/5 technique surfaced a new twist: the run-scoped merge worktree is always
named `_refinery` (never task-id-suffixed), so **this reserved name collides across concurrent
plans too**, exactly like the `p1-1.1`-style task-id names in Recurrence 5.
`<repo-root>/.git/worktrees/_refinery/gitdir` pointed at a *different* concurrently-run plan
(`2026-07-14-gate-evidence-and-prose-truth`); the campaign-state-anchor phase's real `_refinery`
worktree had been auto-suffixed to `<repo-root>/.git/worktrees/_refinery3`. Its `HEAD` file held a **detached
commit sha** (`d3d2f5984abc265362421c32994d5f172e1e1f30`) matching **exactly** the phase's stated
landed tip (from the spawn prompt) — a stronger positive signal than a branch-name match, since a
merge worktree is typically left checked out at the precise merge commit rather than a moving branch
ref. Reading the phase's touched files at that worktree's physical path (from its own `gitdir` file,
under `<repo-root>/.claude/war-worktrees/<plan-slug>-<suffix>/_refinery/`) confirmed all of the
phase's landed constructs directly — `code-verified`, not `agent-unverified` — while both this
servitor's own cwd and the main checkout still showed the pre-phase code.

**Generalized rule (supersedes the task-id-only framing of Recurrence 5):** ANY fixed/reserved
worktree name the WAR engine uses per-run — task ids (`p1-1.1`) AND the constant `_refinery` alike —
can collide across concurrently-active plans in the same repo, and git resolves every collision with
a numeric suffix (`_refinery`, `_refinery2`, `_refinery3`, …). Never trust a bare name lookup under
`.git/worktrees/`; always (a) enumerate every entry whose `gitdir` file's physical path contains the
phase's own plan-slug (from the spawn prompt), and (b) prefer the merge/`_refinery` worktree's `HEAD`
sha, compared directly against the spawn prompt's stated landed-tip sha, as the strongest positive
match — a branch-name match is good, a sha match is better.

## Recurrence 7 (2026-07-15, campaign-state-anchor/phase-2 task 2.1 wrap-up) — reaped worktree + a second, non-`_refinery` collision instance

At phase-2 wrap-up for plan `campaign-state-anchor` (task 2.1, End-state 8 version-bump), the
phase's own task worktree no longer existed on disk: a glob for `.claude/war-worktrees/*campaign-
state-anchor*` under `<repo-root>` returned nothing — Refine/Land had already reaped it by the time
the servitor ran. `<repo-root>/.git/worktrees/p2-2.1` DID exist under that exact task-id name, but
its `gitdir`/`HEAD` named an unrelated concurrent plan (`gate-evidence-and-prose-truth`, branch
`war/2026-07-14-gate-evidence-and-prose-truth/p2-2.1`) — a second, independent instance of
Recurrence 5's worktree-name-collision wrinkle, this time on a plain per-task name (`p2-2.1`) rather
than `_refinery`.

**New edge:** the Recurrence 4/5 "read the phase's own task worktree" technique has a
precondition — the worktree must still be on disk. Post-land, Refine reaps task worktrees, so by
servitor wrap-up time a plausible task-id match under `.git/worktrees/<task-id>/` may (a) not exist
at all, or (b) exist but resolve to an unrelated concurrent plan (never assume presence proves
relevance — check `gitdir` every time, even when the task-id string matches exactly). When no live
task worktree resolves to the right plan, fall back to Recurrence 3's approach: trust the
gate-audit's own direct-read confirmation at the pinned confirmed tip (here: `gateEvidence:true`,
an approved verdict that read the landed blobs directly and named the confirmed SHA) rather than
asserting anything from the servitor's own stale cwd.

## Recurrence 8 (2026-07-17, phase "Release" / structural-test-integrity task 2.1 wrap-up) — main checkout, no worktree at all, branch not even locally fetched

Eighth occurrence, and a new floor under the whole pattern: this time the servitor's threaded cwd
was the **main checkout** itself (no `.git` gitlink, `<repo-root>/.git/HEAD` reads
`ref: refs/heads/master`), not a session or task worktree. `<repo-root>/.git/worktrees/` was
entirely empty (no live worktrees of any kind), and a Grep of `<repo-root>/.git/packed-refs` for
the landed branch name (`dev/2026-07-16-structural-test-integrity`) found nothing — the branch has
**no local ref at all**, packed or loose. This is a stricter version of Recurrence 7's "worktree
reaped" edge: there the task worktree was gone but a same-named collision worktree still existed to
mislead a naive lookup; here there is nothing under `.git/worktrees/` to even collide with, and the
landed branch isn't resolvable locally by name at any path.

The plan's own intent named the concrete version-bump target (`0.14.43` → `0.14.44` across the four
`version-slots.test.mjs`-locked slots — see [[release-bump-slots-canonical-no-badge]]), giving a
sharp, checkable value. Reading `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`
at the main checkout showed `0.14.42` in every slot — **older than even the plan's stated
pre-bump base** (`0.14.43`), confirming this is stale-checkout lag rather than a legitimate
alternate value. Per Recurrence 3/7's fallback, the version-bump fact was **not** asserted
`code-verified` from this reading; it rests on the audit log's own `gate-audit:approve` verdict
(`gateEvidence:true`, pinned `auditSha: f03b682794599580c87e2e9823182ef4468d4490`) as the trusted
positive confirmation instead.

**New rule (extends Recurrence 7's fallback precondition):** before falling back to "no live task
worktree resolves — trust gate-audit," first confirm the landed branch has **any** local ref at
all (`Glob .git/worktrees/*` for a live checkout, then `Grep` `.git/packed-refs` for the branch
name, then check `.git/refs/heads/<branch>` directly). All-absent is a stronger, cheaper signal
than a worktree-name collision that the servitor's cwd/main-checkout is not just behind but was
**never fetched to** this local git — the D3 read must fall back to trusting the audit trail
immediately, without wasting a round hunting for a worktree that cannot exist.

## Recurrence 9 (2026-07-16, phase "Retired-token sweep clause, drift guard, glossary term, and lesson note" / learnings-recipe-drift-sweep tasks 1.1-1.3 wrap-up) — loose ref present, still no readable checkout

Ninth occurrence, a variant of Recurrence 8: main checkout again (`<repo-root>/.git/HEAD` →
`ref: refs/heads/master`), `<repo-root>/.git/worktrees/` again entirely empty. This time the
landed branch (`dev/2026-07-16-learnings-recipe-drift-sweep`) **was** resolvable — a local **loose**
ref existed at `<repo-root>/.git/refs/heads/dev/2026-07-16-learnings-recipe-drift-sweep` (not in
`packed-refs`) — but a resolvable ref is still not a checkout: with no Bash tool and no live
worktree, there is no path the Read tool can target to see that branch's blobs. The outcome is
identical to Recurrence 8's fallback despite the ref being present: trust the phase's own
`gate-audit:approve` verdict (`gateEvidence:true`, pinned `auditSha: c247088d`) rather than assert
anything `code-verified` from the stale main checkout. **Refinement to Recurrence 8's rule:** "any
local ref at all" is necessary but not sufficient for a direct read — a loose ref with zero live
worktrees is the same dead end as no ref, just reached one Grep later; don't spend a round
concluding "the branch exists locally" and treat that alone as progress toward a direct read.

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
[[git-common-dir-anchor-idiom-fail-open-gotchas]],
[[git-probing-hook-requires-fixtures-outside-any-git-repo]] — facts Recurrence 6 confirmed
`code-verified` using this same technique.
[[release-bump-slots-canonical-no-badge]] — the version-slot fact Recurrence 8 could not
`code-verified`-confirm from the stale main checkout.
