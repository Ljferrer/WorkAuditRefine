# Glossary cold home — evicted CONTEXT.md entries

The unbudgeted cold home (ADR 0042: `references/` files carry no byte budget) for evicted
`CONTEXT.md` glossary bodies. Each body below was byte-identical to its pre-eviction `CONTEXT.md`
text **at eviction time** (only repo-root-relative links were re-anchored for this file's depth),
moved under an additive per-term heading — and the glossary keeps the `**Term**:` heading plus
one fixed-shape trigger pointer (`when <trigger>, read skills/war/references/glossary-cold.md`). One
pointer may carry several terms when a whole cold cluster leaves together (wave 4). Prose
temperature is branch
frequency (ADR 0042): these are cold but still authoritative — never delete a body; evict more the
same way. **Coldness criterion** (one standing criterion; selections through wave 3 are recorded in
the D32 row's comments in `skills/war/assets/skill-doc-contracts.test.mjs`, which pins those
CONTEXT.md pointers to their bodies here — wave 4's bodies are deliberately unpinned, selected for
carrying no live drift-guard key): a term qualifies when it names a
retired mechanism, or when it is fully narrated in its own operative home (a `references/` file, an
owning skill's SKILL.md, or its ADR) so the glossary needs only a pointer — incident-only recovery
and one-command forensics entries are the standing example. Bold glossary cross-references inside
the moved bodies resolve in `CONTEXT.md`, their original home, or here when the referenced term has
itself since been evicted — stated as the rule rather than a
dated enumeration, which rots as bodies are added (#1908). A reference may be a shortened or
differently-cased form of its CONTEXT.md heading (**phantom land** → `**Phantom land**`,
**Land primitive** → `**Land primitive (single land chokepoint)**`); resolve by term, not by
byte-match.

## provision base divergence

The local working-branch ref and `origin/<working>` are **neither equal nor ancestor-related** when
`cmd_ensure_integration` cuts a phase's integration branch. A **fail-loud halt** — the script dies
non-zero carrying both SHAs and the two repair directions, cuts no branch, and the phase never starts —
never a silent pick of one side (ADR 0008: repair toward git). Equal / behind / ahead resolve
automatically (cut at the origin tip when behind, with a guarded follower fast-forward); only true
divergence halts.
_Avoid_: silently picking local or origin; conflating it with a fetch failure / no-origin (which falls
back to today's local cut with a warning).

## Orphan adoption (`record-as-owned`)

Repairing the owned-file ledger *toward git* so a non-empty partial-phase integration branch — real
merged commits left by a held/escalated run whose local state was torn down — becomes a legitimate
resume target. The `record-as-owned` subcommand proves the branch strictly descends the frozen base,
prints its ahead-commits for the Lead to map to merged tasks
([ADR 0008](../../../docs/adr/0008-git-is-the-resume-source-of-truth.md) — an unexplained commit halts), and
appends the ref to the run's owned-file ledger, **moving no ref**. The ADR 0008-conformant opposite of
reclaim-deletion — **Empty-orphan reclaim** *deletes* a branch proven empty; adoption *keeps* one proven
non-empty — and the tooled, proof-carrying form of a recovery relaunch's owned-file continuity.
_Avoid_: resetting or moving the branch (adoption records toward git, never mutates it); conflating it
with empty-orphan reclaim (opposite direction — keep vs delete).

## Stale prior attempt

An unmerged remote `war/<slug>/pN-tK` task branch whose tip is **not an ancestor** of the frozen phase
base's integration tip — left by a prior run whose local state was torn down, so it never merged and
shares only an older base. It blocks the identically-named relaunch push (a non-fast-forward rejection);
at the Provision barrier the fresh-cut stale-remote probe catches it (the `STALE_REMOTE` marker) and
classifies it as a per-task **`env-blocked`** outcome — the worker is never spawned, **siblings
proceed**, never a phase halt. Reconciled only by Lead-sanctioned remote deletion
(`--reclaim-stale-remote`, proof-gated, prints its restore command) or by adopting the remote tip —
**never** a force-push. A remote tip that *is* an ancestor of the frozen tip is already-integrated work
that warns and proceeds, not a stale prior attempt.
_Avoid_: SHA inequality as the test (ancestry is — an already-merged remote is not stale); force-pushing
over it; treating it as a phase halt (it is per-task `env-blocked`).

## Dead-agent land failure

A `held:land-failed` root cause where the `land:phase-<N>` dispatch itself never produced a
trustworthy `MergeResult` — it died (returned `null`; the observed class: a transient API error, 0
tokens, `land-advance` never ran) or returned a status the primary land routing chain's arms do not
recognize. A terminal `else` on that chain, mirroring the baseline-proceed re-land's existing
`reLand ? reLand.status : 'error'` fallback idiom, pushes one escalated `phase-<N>-land` entry
(`reason:'error'`, `detail: landResult` — `null` on a dead dispatch) and sets
`landDecision = 'held:land-failed'`: a **reused** enum member, no `land-decision.mjs` change
([ADR 0005](../../../docs/adr/0005-dead-phase-halts-the-dag.md) enum discipline). Distinct from a **Dead
phase**: the *Workflow itself* completed normally (`status: completed`, `handoff` present) — only its
land *sub-dispatch* produced no usable result. A land dispatch that *throws* instead routes
`held:workflow-error` via the top-level catch; the two constructs partition the failure space.
_Avoid_: conflating with **Dead phase** (there the whole Workflow never completed); treating the
printed `resumeFromRunId` hint as the recovery — it replays the run's journal live, re-running
already-merged `merge:*` agents' gate + push-first CAS, which is exactly wrong when the integration
tip is already complete and green.

## Near-miss diagnostic

The advisory stderr block `assert-test-in-diff.sh` emits on exit 1 when the diff contains test-shaped
files the **active** pattern set does not match — it names the active set and each near-miss path so
the `no-test` route says "your pattern missed these" instead of "add a test". Never affects the exit
code; carried to the add-test worker and the exhaustion escalation as `MergeResult.floor_diagnostic`.
_Avoid_: routing on it (fail-open advisory — absent ⇒ every consumer byte-identical); calling it a
floor failure reason (`no-test` is the reason; this is context on it); conflating the near-miss set
with the active pattern set (the scan is a fixed documented shape list, not the matcher).

## Land-truth guard

The `land-advance` (**Land primitive**) assertion set that makes a `landed` result **provable against
git** rather than self-reported. Immediately before the push it captures the **pre-push origin tip**
(`git ls-remote origin refs/heads/<working>`; a failed readback exits non-zero and never collapses
into the first-land carve-out), and it refuses a **phantom land** (exit 3) when `<merge-sha>` equals
that pre-push origin tip **and** the local follower already sits at it; the post-push readback still
confirms origin advanced to `<merge-sha>`. Immediately before that push — and deliberately *after* the
early-return arms, so already-landed reconciliation stays cwd-independent — it also asserts
`HEAD == <merge-sha>`: the push source is `HEAD:`, so a wrong-cwd invocation dies with the catalogued
`EX_WRONG_BRANCH` (6) naming both SHAs and the expected cwd (normally the detached `_refinery`) rather
than surfacing as a misleading `[rejected]` exit 2 — which is what makes exit 2 mean **only** a real
concurrent advance ([ADR 0023 amendment](../../../docs/adr/0023-land-asserts-git-ground-truth.md)). Where the
pre-push origin-tip capture proves *where* the ref is going, the precheck proves *what* is going there.
Anchored on the **origin tip, never the local follower** (which lags). A `landDecision:'landed'` is
trustworthy only downstream of it — extends
[ADR 0008](../../../docs/adr/0008-git-is-the-resume-source-of-truth.md) onto the land path
([ADR 0023](../../../docs/adr/0023-land-asserts-git-ground-truth.md)).
_Avoid_: anchoring the advance check on the local follower ref (it lags); treating the post-push
readback alone as sufficient (it passes on a phantom, which never advanced origin).

## Route-upstream

The loop-breaker exit: a plan that cannot stop churning in verification is routed back to the
`/war-strategy` interview instead of ground forever. Carried as the typed gate output field
`routeUpstream: boolean` — pure arithmetic over the unstamped subset (the round limit reached with
an unstamped root open, or an unstamped `needsDecision` at rounds ≥ 2) — with the pinned invariant
`routeUpstream: true` ⇒ verdict `BLOCKED` (a stamped-out `ADJUDICATED` run never routes upstream;
an `INCOMPLETE` run re-runs its probes instead of routing). On a route-upstream terminal the report
gains the `## Route upstream` block — the residual questions as the regrill agenda plus the exact
re-entry command — and `/war-campaign`'s step-3 triage halts with `stopPoint:
redteam-route-upstream`, never skip-and-continue (ADR 0011).
_Avoid_: a sixth verdict, a `KNOWN_LAND_DECISIONS` member, or Lead-invented prose (ADR 0043
precedence untouched — the field rides beside the verdict); emitting the field with no rounds
inputs (absent inputs ⇒ absent outputs).

## patch-equivalence probe

The `git cherry <landing-ref> <sha>` check (landing ref first) that tests whether a gate-failing
candidate's patches already landed under a rewritten SHA. Zero `+` lines among ≥1 `-` lines ⇒ every
patch is already in the landing branch by patch-id — **proven equivalent**, the evidence a
tip-reachability gate cannot produce, and grounds for a `known-stranded.tsv` row in the
**acknowledged-stranded** bucket. Any `+` line ⇒ patch-equivalence is **not proven** (squashes and
conflict-resolved rebases legitimately change patch-ids) ⇒ needs-human, no row — never read as
proof of unmerged work. Never a deletion license (ADR 0027 C3).
_Avoid_: treating a zero-`+` result as permission to delete; reading a `+` line as proof of unmerged
work; probing against a stale local landing ref; trusting an empty result (suspect — check argument
order).

## residual-set verification

The mandatory post-batch Class-1 check: after a batched `git push origin --delete`, re-list
remote heads and two-sided-diff the survivors against the pre-batch snapshot's hold set (the
exact-name complement of the delete list). A missing hold-set ref is a data-loss row reported
with its snapshot SHA and restore command; a surviving delete-list ref is a failed-delete row;
the run is not clean until the diff is empty or fully reported.
_Avoid_: trusting the delete loop's own exclusion filter; declaring a sweep clean on push success
alone; auto-retrying a failed delete into a second unverified batch.

## churny shared docs

The pathspec (`docs/plans docs/specs docs/roadmaps`) whose files a stacked branch predictably conflicts
on against master; snapped to master's canonical copy by `snap-shared-docs.sh` (merge master,
`checkout --theirs` under the pathspec, byte-identity guard outside it, fast-forward push, never
`--force`). ADR 0011 stack-and-plow is the primary recurrence reducer; the snap is the residual fallback.
_Avoid_: rebasing or force-pushing a docs-only conflict; `--theirs`-ing a code-touching doc outside the
pathspec.

## Retired-token sweep

A Lead-run, judgment-triggered check at every landed phase close (manual completions via the §4.3
escalation-completion recipe included) — never plan-declared, judged from the **mandatory**
landed-phase diff plus the plan slice / Commander's Intent: did this phase retire, rename, or
consolidate a land, merge, or escalation mechanism? Runs **two hot-only nets** over both memory roots
— a tip-true `git grep` of `origin/<working>` (a completeness floor, not a ceiling) plus the
fully-flagged ranked `war-memory query --local <root> --repo <root>` — then a bounded hand-scan,
adjudicating every hit **load-bearing** (a no-longer-sanctioned recipe step) or **exempt** (narration,
or still-live-in-context), never via an allowlist. Repo-root load-bearing hits route to one
dedup-checked consolidated `war-followup` issue per triggering phase; local-root hits are counts only
on gh-mirrored surfaces, slugs in the uncommitted ledger notes. Every landed phase carries a mandatory
`retired-token sweep:` record line. The clause lives under `## Per phase (in DAG order)` in
`skills/war/SKILL.md` (*defined-but-not-yet-emitted; produced in Task 1.1, same phase*).
_Avoid_: conflating with **Phase-close coherence sweep** (findings-queue-driven, engine-dispatched,
fail-open polish; [ADR 0012](../../../docs/adr/0012-intra-phase-visibility-and-phase-close-sweep.md)); treating
it as a gate (it never blocks or holds a land); an exemption allowlist (adjudication is per-hit);
assuming it edits lesson bodies (it only files debt and records).

## done-unmet route

The blocking floor route for a red `Done when:` — after the gate, the refiner runs the task's own
acceptance command in the task worktree via `assert-done-when.sh` (file-threaded via `--cmd-file`,
never interpolated; timeout-bounded; exit 2 is a git/env error and never collapses into the floor
status). Exit 1 returns `MergeResult.status: "done-unmet"` and routes a bounded "make this command
pass" fix sub-loop sharing `run.roundLimit` (the `no-test` pattern); exhaustion escalates via the
`done-unmet` member of `HARD_ESCALATION_REASONS` — the two-slot widening (result status + escalation
reason), per ADR 0005 enum discipline.
_Avoid_: gate-failed (the suite is green; the task's own `Done when:` command is red); a new land
decision (the route reuses the existing floor-family slots, like `no-test`/`unpackaged`).

<!-- Wave 4 (#1651, 2026-09-03): seven cold clusters, 18,562 B moved byte-identical out of
     CONTEXT.md to bring it back under the ADR 0042 advisory line. Each cluster leaves one
     grouped trigger pointer behind. Every body below was selected for carrying NO live
     drift-guard key, so none is D32-pinned; **Campaign ledger**, **Plan-index table** and
     **Staged phase script** were considered and kept hot (the first two phrase a campaign-ledger
     CLI command, which this file's verb-scan exclusion in doc-cli-consistency.test.mjs forbids;
     the third is D24-pinned). -->

## Traversal equivalence class

The full set of `..`-bearing path shapes a scope guard must reject: bare `..`, leading `../*`, embedded
`*/../*`, and trailing `*/..`. A guard covering a proper subset has a latent sandbox-escape hole even
when downstream branches incidentally deny the rest.
_Avoid_: rejecting only the shape that bit us (`*/../*|*/..`) — the class, not the instance, is what the
guard covers; the reject arm stays pre-`case` so it binds every agent type (ADR 0002 D5).

## Verb equivalence class (absence guard)

The set of git verbs that express one forbidden behavior (e.g. `checkout` and `switch` both re-attach a
branch). A git-surface absence guard enumerates the class in a comment and scans every verb; scanning
one verb is false coverage the moment the surface adopts an equivalent.
_Avoid_: scanning one verb and trusting review to remember the rest — a new equivalent verb is added to
both the enumerating comment and the scan.

## Subtree-anchored search root

A guard test's grep/find root resolved to the narrowest subtree from `$SCRIPT_DIR` (never the repo root),
so it cannot scan stale `.claude/worktrees/**` checkouts. A repo-root scan that omits a `.claude/`
exclusion is environment-dependent and a green worktree run does not prove it correct.
_Avoid_: a bare repo-root `grep -r`/`find` without a `.claude` exclusion — enforced by the
`hooks/guard-conventions.test.sh` search-root lint (a deliberate exception carries an inline
`# guard-conventions: allow <reason>` tag).

## Floor⊆gate parity

The tested (not inspected) equality between the test floor's discovery predicates
(`assert-test-in-diff.sh`) and the gate's (`resolveGate` in `war-config.mjs`). Any asymmetry over- or
under-credits test presence.
_Avoid_: hand-mirroring the exclusion set (`node_modules`, `.git`, `.claude`) and the name globs across
the two mechanisms with no cross-check — the parity test asserts against `resolveGate`'s *output string*,
so a semantics-preserving refactor cannot break it.

## Precondition marker

A specific loud stderr token (e.g. `REL_GUARD_PRECONDITION_FAILED`) a guard emits when its environment is
non-isolatable. A `gate_failed` carrying one is classified `environment`, never `introduced` — the reader
consults stderr markers, not just TAP stdout.
_Avoid_: classifying a marker-bearing `gate_failed` as `introduced` (blaming the code for a
non-isolatable environment); the marker is carried in `gate_output` uncurated.

## Construct locator

A plan/prompt reference by enclosing symbol or comment header (plus a change description) rather than a
`:N-M` line range — stable across integration churn because the symbol name survives the serial merge
queue where a line number does not.
_Avoid_: a raw line-range literal (stale on any prior land); reserve `:N-M` for a flat config file with
no named construct, and then qualify it as approximate against a named base sha.

## Stack-fragile literal

Any plan/prompt value pinned to the drafting base that rots the instant an earlier stacked task lands —
line ranges, `*.test.sh` enumerations, suite counts, mirrored-constant final arrays, hardcoded version
bumps, flat-key abbreviations of nested paths. The authoritative form is always the live artifact (the
construct, the self-discovery gate, the canonical export, the worktree baseline).
_Avoid_: restating a value the live artifact already carries — reference the artifact and let the drift
guard or the self-discovery gate be the arbiter.

## Defined-but-not-yet-emitted slice

A foundation task's constant/field/prose-ref added *before* its emitter task lands; benign **iff** the
plan carries a "produced in Task N" cross-link. Without the link, auditors misgrade the inert slice as
dead code or an omission.
_Avoid_: shipping a mirrored constant/schema/prose-ref whose emitter is a later task without the
cross-link — and, as an auditor, holding an inert slice that the cross-link explains.

## Grep as floor

A token sweep is a completeness *floor*, not a *ceiling*: it must be backed by a manual same-scope
title/comment survey, because same-meaning siblings encode the concept in different words and survive
the sweep silently. (Extends the existing floor/ceiling language.)
_Avoid_: treating "grep X, handle every match" as a completeness proof; call out each straggler the
manual survey catches as a survey-derived correction.

## Stale-looking-but-correct calibration

The auditor discipline of demoting a plan↔candidate divergence to Nit **only** when the live artifact
confirms benignity — done once per pattern in the standing auditor surface rather than re-litigated per
seat, per pass.
_Avoid_: a blanket amnesty — a demonstrably-untrue claim still blocks; the demotion is gated on
live-artifact confirmation, never unconditional.

## Ingest guard

A defensive check at an engine trust boundary (config file, Workflow `args`, session cwd, a relaunch's git
state) that converts imperfect input into a *named* clean error, never a raw `TypeError` / crash. The
`overrides` object guard, the args non-null-object guard, and the undefined-render guard are all ingest
guards.
_Avoid_: input sanitizer (implies mutation; these reject, not clean).

## Undefined-render guard

The `pt` tagged prompt template's identity check that no interpolated **value** entering a dispatched
prompt is `undefined`; a missing prompt input throws at build time (before spawn, naming the adjacent
literal fragment) instead of silently sending garbage to a sub-agent. Checks value identity, never prompt
text — quoted prose "undefined" can never trip it (revised 2026-07-10, Option B).
_Avoid_: prompt validator (too broad — this checks one signature).

## Provision exit-code catalogue

The named-constant table in `provision-worktrees.sh` (`EX_FOREIGN=3`, `EX_DIVERGED=7`, …) that is the
single source of the script's non-zero exit meanings; the surfacing contract is "any non-zero = halt."
_Avoid_: error codes (undifferentiated from git's own).

## Empty-orphan reclaim

The opt-in, evidence-gated self-heal by which the Provision barrier deletes and re-cuts a half-run's
orphaned integration branch **only** after proving it carries no unique commits and is absent from origin.
Distinct from ADR 0021's owned-file-continuity recovery relaunch (which *reuses* a branch carrying landed
commits).
_Avoid_: force reclaim, branch cleanup (neither names the two proofs).

## Dispatch kind

The stable `opts.dispatchKind` discriminator (`provision-barrier`, `provision-run`, `polish-worktree`, …)
that identifies *which* engine dispatch a call is, so handlers/mocks/audits key on it rather than parsing
`label` prefixes or matching on `phase` alone.
_Avoid_: dispatch type (collides with `agent_type`).

## Deliberately-unwired marker

The recognized `ponytail:` / `deliberately-unwired:` comment naming *why* a construct is intentionally
uncalled; the audit lens does not raise dead-code findings against it.
_Avoid_: dead-code exemption (sounds like a suppression list).

## Gate composition point

The single site in `workflow-template.js`, immediately after entry validation, where `plan.gate` is
normalized once, in place — idempotently, via a hand-mirrored inline `resolveGate` (the
sandbox-cannot-import rule), drift-guarded by its D2 mirror-registry row — to its self-discovering
form; every gate-bearing dispatch site downstream renders the composed string without itself changing.
Distinct from the Lead's Setup `--resolve-gate` pre-resolution, now the belt to this composition
point's suspenders ([ADR 0036](../../../docs/adr/0036-gate-self-discovery-composition-engine-owned.md)).
_Avoid_: conflating it with `resolveGate` itself (the canonical function this point calls inline);
expecting composition per dispatch site — it fires once, upstream of them all.

## Spec-truth guard

_Superseded 2026-08-16 by [ADR 0046](../../../docs/adr/0046-specs-are-posterity-skills-cite-maintained-surfaces.md):
emitted as rows D15–D17 (locking prose-drift-corrected spec sentences), then frozen — never
extended. The posterity rule retires the growth premise: "only a guarded claim is drift-proof"
inverts to "specs are frozen, so locked sentences cannot rot". The rows stay as historical locks;
the entry below (its "defined-but-not-yet-emitted" claim now stale) is kept for archaeology._

A per-claim, construct-anchored doc-contract row in `skill-doc-contracts.test.mjs` locking a
`docs/specs/` (or SKILL.md) code-fact sentence to the mechanics it actually describes — the
`docs/specs/` sibling of the file's existing SKILL.md rows (D10/D12 style: locate by construct, extract
by regex, assert the truth-bearing tokens). A **defined-but-not-yet-emitted slice** as of this entry:
its first rows are produced in Task 2.1 of the
[gate-evidence-and-prose-truth plan](../../../docs/plans/2026-07-14-gate-evidence-and-prose-truth.md).
_Avoid_: a blanket markdown/AST parser over every `docs/specs/*.md` file (the ratified ceiling stays
per-claim, not per-file); treating an unguarded spec claim as verified — only a guarded claim is
drift-proof.

## Posterity corpus

The directory-scanned live-surface set the ADR 0046 citation rule sweeps — every `skills/*/SKILL.md`,
every `skills/*/references/*.md`, every `agents/*.md`, plus `README.md` — derived from the tree,
never from an editable in-file list; maintained by `posterityCorpus()` in
`skills/_shared/doc-cli-consistency.test.mjs`.
_Avoid_: conflating it with the verb-rule corpus (enumerated, deliberately narrower).

## Verb-scan placement census

The default-deny partition assert making every `skills/*/references/*.md` file either verb-scanned
(`EVICTION_DESTINATIONS`) or reason-excluded (`VERB_SCAN_EXCLUSIONS`); a new references file is red
until consciously placed; both lists live in `skills/_shared/doc-cli-consistency.test.mjs`.
_Avoid_: "exclusion" as suppression — an excluded entry carries a stated reason and is still
posterity-scanned.

## Graduation candidate

A durable lesson whose recurrence trail shows **≥2 re-triggers** and whose content describes a
**machine-checkable invariant** (a greppable pattern, a diff property, an enum mirror), flagged by the
`/lessons-learned` housekeeping pass for promotion from prose to machine enforcement (hook, floor,
drift-guard test, or lint) with a one-line proposed enforcement shape. Flag-only: the operator decides
what, if anything, is filed or built.
_Avoid_: auto-filed issue, auto-built hook (the flag never implements); treating every recurring lesson
as a candidate (only machine-checkable ones qualify).

## Concept hub

A lesson that is dead as a bug warning yet load-bearing as a vocabulary anchor (≥2 inbound `[[links]]`
from siblings citing it as "same family as …"). Archived only with an explicit hub WARN; when its rule
is resolved it is downgraded to a compressed `RESOLVED — kept as concept anchor` stub that retains its
hot index row rather than removed ([ADR 0028](../../../docs/adr/0028-memory-store-integrity-tool-enforced.md)).
_Avoid_: treating inbound-ref count as staleness (a hub is stale as a warning, live as vocabulary);
dropping the hot index row on archive (the stub keeps it).

## Link trichotomy (HOT / COLD / MISSING)

The three-way classification of a `[[wikilink]]` target — HOT (`<root>/<slug>.md`, keep), COLD
(`<root>/archive/<slug>.md`, keep — a legal cold link into the queryable-forever archive), MISSING
(neither — the only removal candidate). Adjudicated centrally by the archive-aware `safe-swap verify`,
never by a hot-only `ls <staging>/<slug>.md` in a fan-out verifier.
_Avoid_: calling a cold link dangling (it resolves via `resolves_in()`); a verifier recommending removal
from a hot-only `ls` (the central check is the sole authority).

## Non-destructive default (`--candidates`)

A flag that reads like a query and *lists* like a query: `war-memory archive --candidates` reports the
ranked candidate set and mutates nothing (a dry-run); archiving requires an explicit `--apply` or an
explicit slug list (`archive <slug>…`). The mechanical replacement for the "never run `--candidates`"
prose gotcha ([ADR 0028](../../../docs/adr/0028-memory-store-integrity-tool-enforced.md)).
_Avoid_: a query-shaped flag that mutates by default (the retired footgun — `--candidates` archived the
whole ranked set); assuming `--candidates` alone still moves files.

## Seed set

The capped, manifest-mirrored portable-lesson corpus shipped at `docs/seed/seed.tar.gz` — the initial 29
scrubbed war-game lessons, each redaction-lint-clean and free of `[[wikilinks]]`. Packed, verified, and
evicted by `seed-pack.mjs`; capped on both axes at ≤ 50 members and ≤ 1,500,000 B uncompressed
([ADR 0039](../../../docs/adr/0039-seed-set-capped-manifest-mirrored-tarball.md)). A portable, plugin-shipped
source corpus, not a per-repo store — distinct from either **Memory root**.
_Avoid_: seed render (the Phase-0 `MEMORY.md` projection of lessons a repo already has); "corpus" left
unqualified (name the seed set explicitly so it is never read as a repo's own memory).

## Seed candidate

A portable lesson nominated for the seed set. The bare `/lessons-learned` pass adds one directly inside
`WorkAuditRefine` (gated, re-packed); from any other repo it travels as a `seed-candidate` GitHub issue
on `Ljferrer/WorkAuditRefine` carrying the full lesson body, filed only after both-states slug dedup and
a fail-closed redaction lint on the drafted issue.
_Avoid_: memory-mined (a different mining loop over a repo's own defect-shaped lessons, filed under that
label instead of `seed-candidate`).

## Warm-seed

Injecting the seed set into a repo's chosen memory root via `/lessons-learned seed`: unpack, ask the
destination (`docs/learnings/` vs the local root), skip any slug already present in either root, and
stamp each placed member's frontmatter with `metadata.seededFrom`.
_Avoid_: seed render (that projects lessons a root already has — warm-seed instead *adds* new ones);
sync (re-running `seed` only tops up; nothing tracks or updates a downstream repo's copy afterward).

## Seed archive

The overflow tier at `docs/seed/archive/` — capped at ≤ 500 members and ≤ 100 MB, grown only by
`seed-pack.mjs evict` (append-only, never deletes), pruned only by hand.
_Avoid_: the memory roots' cold `archive/` tier (per-repo eviction of a repo's own live lessons — a
different mechanism with different caps; see **Hot set** / **Cold set**).

## Roadmap

The ordered **index of plans** (a meta-plan, not a plan). Its load-bearing parts are the **dependency
spine** (strict landing order) and the **shared-file contention table** — **Code-boundary decomposition**
applied one level up: plans touching a shared file (or the four release-slot files) **serialize** in
queue order; file-independent plans are free-ordered (usually by version/severity). Authored via the
`/war-strategy` template. An **authoring input and on-demand snapshot** of a campaign: `/war-campaign`
ingests it to seed the **Campaign ledger**, and can render the ledger back out as a committable roadmap
(machine switches, review). It is **not** the live feed — the running queue never lives in git, so two
writers can never merge-conflict on it.
_Avoid_: a generic product roadmap; treating it as a plan `/war` can execute directly (it indexes
plans); treating the committed file as live campaign state (that's the **Campaign ledger**).

## Inbox

The multi-writer add path of a campaign: `.claude/campaigns/<id>/inbox/`, one file per added plan
(maildir-style — atomic by construction, no locks). Any chat, human, or cron drops a plan reference in;
the **Hopper** sweeps the inbox at every plan boundary, runs the shared-file contention check against
the remaining queue, and inserts in dependency-safe order.
_Avoid_: writing the queue directly from a second chat (single-writer ledger); using git as the add
transport (the conflict surface the inbox exists to remove). A drop whose resolved plan path already has a ledger entry — **any** status, `landed` included — is **not** queued a second time: `sweep` refreshes that entry's `files` and reports it under `skipped`, so a re-add can never mint an undrainable duplicate.

## Hopper

The autonomous loop that executes a campaign — one chat running `/red-team <plan>` then
`/war <plan> … --afk --ace` over each plan in **Campaign-ledger** queue order, driven by the
`/war-campaign` skill. Default AFK model is **stack-and-plow**: plan N's working branch bases off plan
N-1's landed tip and its PR targets plan N-1's branch (stacked PRs, merged bottom-up; deleting each
merged branch cascades the next onto master). `--wait-for-merge` switches to **base-off-master** (wait
for PR N-1 to merge, base plan N off fresh `origin/master`). Live-appendable via the **Inbox**, swept at
each plan boundary.
_Avoid_: pointing every stacked PR at master (cumulative diffs → shared-doc conflicts — the stacked PR
target is plan N-1's branch); assuming Mode A works overnight (it needs a human merging each PR).

## Write-ahead checkpoint

The discipline of updating the resume brief (**CAMPAIGN-STATE.md**) *before* dispatching the thing you'll
wait on — each `/red-team` launch, each `/war` phase, each `--wait-for-merge` wait, and every plan boundary.
Freshness never depends on when compaction fires: the brief already describes *now* before the Lead blocks.
_Avoid_: writing the checkpoint *after* the wait (compaction can strike mid-wait); treating it as
code-enforced (it is a Lead prompt directive — the code-enforced half is **Post-compact re-injection**).

## CAMPAIGN-STATE.md

The Lead's curated, uncommitted resume brief — a sibling of the ledger at `.claude/campaigns/<id>/`,
plain markdown, single-writer — carrying queue status, in-flight run/task ids, the continuation sequence,
and gotchas so a fresh context can resume from *now*.
_Avoid_: treating it as the authority — it is a brief *toward* git truth, not the ledger (resume still
reconciles toward git per the ADR 0008 discipline).

## Post-compact re-injection

The campaign-gated `SessionStart(compact|clear|resume)` hook that restores **CAMPAIGN-STATE.md** into a
fresh window after compaction — the code-enforced half of survival (paired with the **Write-ahead
checkpoint** prompt directive). Silent and harmless in any session not running a campaign.
_Avoid_: `PreCompact` blocking or summary-shaping to steer compaction — rejected (no trigger, no sensor,
blocking rides into the ceiling); see the ADR.
