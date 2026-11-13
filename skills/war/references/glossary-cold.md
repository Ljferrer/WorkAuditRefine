# Glossary cold home — evicted and born-cold glossary entries

The unbudgeted cold home (ADR 0042: `references/` files carry no byte budget) for evicted and
born-cold glossary bodies. The glossary was `CONTEXT.md` until #2636 moved it to `GLOSSARY.md`. Each evicted body below was byte-identical to its pre-eviction
`CONTEXT.md` text (`GLOSSARY.md` text for waves 7 and 8) **at eviction time**. Only repo-root-relative links were re-anchored for this file's
depth. Each body moved under an additive per-term heading. The glossary keeps the `**Term**:` heading plus
one fixed-shape trigger pointer (`when <trigger>, read skills/war/references/glossary-cold.md`).
A born-cold body is authored here first and has no pre-eviction text to match (waves 5, 6, 9 and 10). `GLOSSARY.md`
holds only its `**Term**:` heading plus the same trigger pointer. One
pointer may carry several terms when a whole cold cluster leaves together (waves 4, 8 and 9). Prose
temperature is branch
frequency (ADR 0042): these are cold but still authoritative. Never delete a body; evict more the
same way.

**Coldness criterion** (one standing criterion): a term qualifies when it names a
retired mechanism, or when it is fully narrated in its own operative home. That home is a `references/` file, an
owning skill's SKILL.md, or its ADR, so the glossary needs only a pointer. Incident-only recovery
and one-command forensics entries are the standing example. The selections for waves 1-3, 5 and 7 are recorded in
the D32 row's comments in `skills/war/assets/skill-doc-contracts.test.mjs`. That row pins those
GLOSSARY.md pointers to their bodies here. Wave 4's bodies are deliberately unpinned, selected for
carrying no live drift-guard key, and so are wave 8's. Wave 8 is #2273, plan 2026-11-08-model-routing-and-prompt-byte-budgets
Task 1.2. It moved the bodies from `## Worker block` through `## memory-mined` to bring `GLOSSARY.md` under its
advisory line. `skills/red-team/assets/workflow-scaffold.test.mjs` pins wave 6's four born-cold merge-provenance bodies instead.
The `living-adr-terms` row in `skills/war/assets/skill-doc-contracts.test.mjs` pins wave 9's three living-ADR bodies.
Wave 10 (plan 2026-11-08-shell-floors-tests-and-lint Task 2.5) adds three born-cold shell-floor bodies. Only
`## assert-submodules-ready` fit a `GLOSSARY.md` pointer under its advisory line, and the D32 row pins it. The
other two have no pointer, and the `shell-floor-cold-terms` row in the same test file pins them.

Bold glossary cross-references inside
the moved bodies resolve in the glossary (`GLOSSARY.md`), their original home. They resolve here when the referenced term has
itself since been evicted. This is stated as the rule rather than a
dated enumeration, which rots as bodies are added (#1908). A reference may be a shortened or
differently-cased form of its GLOSSARY.md heading (**phantom land** → `**Phantom land**`,
**Land primitive** → `**Land primitive (single land chokepoint)**`). Resolve by term, not by
byte-match. Post-eviction edits: § Relaunch attempt keeps its definition and points at
`run-manifest.md` § Relaunch for the rules (#2120), and § Promotion's overwrite parenthetical gained
the `stale-local` hold (#2713).

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
confirms origin advanced to `<merge-sha>`, with one re-read after 2 s and a loud exit 3 on a second
miss. A server-side `[remote rejected]` push is pushed again, at most 3 times after 10, 20 and 40 s,
only while a fresh read still shows the pre-push origin tip (#2626). A retry that lands exits 0 through
the normal readback, a retry that meets `[rejected]` exits 2, and spent retries, a moved origin or a
failed read exit 3. `<merge-sha>` resolves to its full SHA first. Immediately before that push — and deliberately *after* the
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
re-entry command, or the `**Budget spent:**` line in its place when the seed already met the round
limit — and `/war-campaign`'s step-3 triage halts with `stopPoint: redteam-route-upstream`, never
skip-and-continue (ADR 0011).
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
`retired-token sweep:` record line. The clause lives in `skills/war/references/retired-token-sweep.md`, and its trigger pointer
sits under `## Per phase (in DAG order)` in `skills/war/SKILL.md`.
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
     CONTEXT.md (now GLOSSARY.md) to bring it back under the ADR 0042 advisory line. Each cluster leaves one
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
evicted by `seed-pack.mjs`; capped on both axes at ≤ 110 members and ≤ 1,500,000 B uncompressed
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

## Executor gate

The final silent gate before the merged plan file is written: *could `/war` decompose-dispatch this,
and `/red-team` attack it, with zero operator questions?* A "no" reopens the interview while question
budget remains; otherwise the residue is default-and-tagged and recorded in the ledger. Runs beside the
provenance gate (the untagged-claim scan — an untagged claim of fact is a bug).
_Avoid_: the run-time **gate command** / gate-audit (those gate merges and lands; this gates
authoring completeness).

## Decisive slot

One row of the interview doctrine's decisive-slots table: an interview extract hard-linked to where it
lands in the merged plan and which consumer reads it there (validation criteria → tagged End states;
constraints → `## Pivotal constraints`; file footprints → per-task `Files:`; assumptions → the ledger;
new terms → this glossary). The interview's completion bar: an interview with an unfilled decisive slot
has not finished.
_Avoid_: treating a slot as an optional heading; filling one in free prose where its consumer never
reads.

## Fork trial

A bounded throwaway experiment the interviewer runs itself to settle a Stage 1b fact fork before the
operator ratifies a design. The question, its outcome branches and its `bound:` are pre-registered
before the run; the run happens in a `git clone --no-hardlinks` sandbox with the escape guard
snapshot before and baseline after it; the result lands as one `TRIAL-<n> · fact` row in the
**Trials run block**. Outcomes: `settled` · `inconclusive` · `infra-failed`, with one retry only on
`infra-failed`. A fork trial costs no question of the budget. Doctrine: `fork-trials.md`.
_Avoid_: a preference fork (that is a question to the operator, never a trial); plan prose as
evidence that a design works; `cp -R` or `git worktree add` as the sandbox; a trial that executes a
shipped artifact (the REA lane or `/red-team`); an exploratory run with no prior row minting a
settlement (it may mint a fork or an `[assumed:]`).

## Pair beat

The interview beat that settles a consequential interface by comparing two structurally different
candidate designs drawn from one frozen brief (problem, constraints, evidence, the caller's usage,
3–6 criteria named before any candidate). It fires on three triggers: a new or reshaped exported
contract; a new or reshaped artifact grammar with two or more consumers; a mechanism floored into
`Binding guardrails:` with two or more non-equivalent realizations. Two candidates by default, three
at most, one reframe on wild divergence; the beat costs one question of `Qk/14`. The operator may
decline by bare assent, and the row then records `chosen: <design> (user) — pair declined: <reason>`.
Under `--afk` the drafter authors both candidates and picks; the grill refutes the pick. Doctrine:
`fork-trials.md`.
_Avoid_: a WAIVE row for a declined pair; two shapes that differ only in naming (the necessity twin
makes that a verifier beat); a candidate authored before the brief is frozen; a suppressed pair beat
under `--afk`.

## Trials run block

The one Part 1 block, labelled `**Trials run** — one row per trial:`, that records every fork trial,
pair beat and sweep an interview ran: a header carrying the bounds and their config source, the
trial tier, token and wall-time use, the escape-guard state and the `budget-check:` line, then one
`- TRIAL-<n> · fact | pair | sweep · <fields>` row per trial, with `command` and `observed` in a
nested fence. `TRIAL-<n>` reuses the PIN token grammar (digits-only, right-delimited). Placement
latitude anywhere in Part 1 outside `## Context`, inheriting the Evidence consumed block's law by
name; `None — no fork qualified` when nothing qualified. Only a pre-registered `settled` row backs a
`(verified: TRIAL-n at <base>)` citation; an inconclusive row backs an Assumptions-ledger row whose
Check is the trial's replay command. Grammar: `fork-trials.md`.
_Avoid_: a new required H2 for the block; a `(verified:)` citation of an inconclusive or
infra-failed row; the word "validated" on a sweep row; a column-0 `## `, `### ` or `- Files:` line
inside a fence.

## Tip probe

The read-only refiner dispatch the engine sends after every ace result, dead or not. It runs at all four ace
sites (polish, subset, re-entry, terminal). It reads the task branch from git. It reads the tip sha and tree and the name-only file list,
and the commit count and ancestry from the pre-dispatch tip. A moved tip is
re-audited through the ace re-audit seam or forward-reverted to the last approved tree. A tip whose
tree equals the approved tree takes the failed-absorb arm. A dead or unusable probe forward-reverts
the range and lands. Only a tip that does not descend from the pre-dispatch tip ends in the
merge-slot hold. Canonical: `tipProbe` in `skills/war/assets/workflow-template.js` (#2485 D2, D5).
_Avoid_: the worker's `head_sha` or file list as the source (a disagreeing worker list is a
cross-check only); a hold for a mergeable task.

## Merge-commit provenance

How WAR proves a task merged. The refiner merges each rebased task branch with
`git merge --no-ff --no-commit` plus a commit carrying the exact trailer `WAR-Task: <task branch>`.
`task-integrated.sh` proves ownership from the first-parent merge commit whose trailer names the task
and whose second parent equals the task tip. So untrailered floor-fix and revert commits on the task
branch prove through that merge commit. The engine confirms the merge by its parents, the rebased
ancestry, tree equality and the trailer. A repeated reconcile on an existing such merge reports
merged and makes no second merge. Polish and terminal merges stay fast-forward and are never proven
this way (#2485 D8).
_Avoid_: a fast-forward task merge or a worker-side trailer as the proof; a per-commit `WAR-Task`
scan of the task branch.

## Provision tree marker

The one line `provision_tree: <sha>` that every provision run writes into the worktree's
`.war/provision_tree` file: the HEAD tree it ran on, with `.war/` added to `info/exclude`. Before any
refiner gate, and before a dep-wave worker's gate, the provision steps re-run when `HEAD^{tree}`
differs from the marker. An absent marker counts as a changed tree. The gate-log preamble repeats
the line after `tip_sha`. Canonical: `PROVISION_TREE_LINE` and `PROVISION_RERUN_CLAUSE` in
`skills/war/assets/workflow-template.js` (#2485 D15).
_Avoid_: keying the re-run on the commit sha (a rebase that keeps the tree needs no re-run);
treating a missing marker as provisioned.

## Launch identity of a recovery

The rule that a recovery relaunch executes from the same plugin root and version as the launch it
recovers. The run manifest records `pluginRoot`, `pluginVersion` and `pluginSha` at run start, so a
mismatch shows after the fact; refusing a mismatched launch is filed, not built (#2495). Doctrine:
`launch-identity.md` (#2485 D22).
_Avoid_: recovering a run from a different installed version or a local checkout; reusing the
recovered launch's `runId` (a recovery still mints a fresh one).

## Relaunch attempt

One Workflow run of a phase that a prior run of the same phase did not finish — a `resumeFromRunId`
retry or a recovery relaunch. The run manifest's relaunch rules and the `attempts[]` shape live
only in `skills/war/references/run-manifest.md` § Relaunch.
_Avoid_: overwriting one field of the pair; dropping a died attempt's counts; reading the manifest
on resume (it is telemetry, never resume input).

## stranded upstream

A local WAR branch's tracking ref pinned at the worker's pre-rebase remote SHA — the refiner
rebases task branches locally in the serial merge queue and **never force-pushes**, so the tracked
remote ref never advances to the rebased tip that lands. Makes `git branch -d` check
merged-into-upstream and refuse a branch whose content is already in master. Recovery, only after
the gate passes on the **local SHA**: `git branch --unset-upstream <branch>` then `git branch -d <branch>` (restoring
git's own merged-into-HEAD check), never `-D`; a needs-human outcome after the unset restores
tracking (`git branch -u`).
_Avoid_: reading the `-d` refusal as an unmerged-work signal; escalating to `-D` in a default-mode
sweep.

## Run root

Born cold (2026-11-08, [ADR 0059](../../../docs/adr/0059-run-root-follows-the-launch-checkout.md)).
The checkout whose `.claude/war/` holds a run's worktrees, staged scripts, args files and manifest.
It is the launch checkout's top level for a launch from a linked worktree, and `$MAIN` for a launch from the
main checkout. The rule, its resolve commands and the paths that stay at `$MAIN` live in
`skills/war/references/setup.md` § Run root, the one canonical statement.
_Avoid_: anchoring a run's folders at `$MAIN` for a linked-worktree launch. Avoid restating the rule here or
on any other surface instead of pointing at setup.md.

## Denial class

Born cold (2026-11-08). One of the auditor git guard's named deny groups, plus `other` for any other denial from
`hooks/validate-auditor-git.sh`. The named groups are chain-operator, grouping,
metacharacter, grep form, branch read form and not-git. `/war-review` keys each class on the hook's deny text. It reports
the auditor guard denials per auditor seat by class against the 0.25 target
(`skills/war-review/SKILL.md`). Grep form and metacharacter are the search classes.
_Avoid_: counting a denial from a non-auditor transcript into the per-seat rate. Avoid reading an `other`
denial that carries a known deny phrase as a new class (it is drift between the keys and the hook).

## Worker block

A worker — initial *or* fix — returning `status:'blocked'` (or dying / returning null), which
**escalates the task immediately** carrying the worker's `blocked_reason`, decided uniformly by the
`blockedReason` predicate at every worker-dispatch site.
_Avoid_: conflating it with `env-blocked` (a provision failure — the worker was never spawned) or
`audit-blocked` (the audit/fix loop exhausted `roundLimit` without unanimous approve). All three hold
the land, but a *worker block* is the worker itself reporting it cannot proceed, with a reason.

## Repo-per-phase (cross-repo structure)

A phase targets **exactly one** repo, so cross-repo work is a **phase→phase** edge in the existing phase
DAG, never a mix inside one phase. A submodule change is its **own phase** that lands into the submodule
repo (its integration branch, task worktrees, and land all in that repo); the dependent **superproject**
phase runs after and reads the landed/merged SHA from the **ledger** to drive its gitlink-bump task. The
serialization is intrinsic — a superproject task cannot consume new submodule code before the pin is
bumped, which cannot happen before the submodule SHA exists — so the phase boundary costs no ordering
that was not already required.
_Avoid_: a mixed-repo phase; a mid-phase cross-repo barrier; threading the SHA outside the ledger.

## Submodule-as-repo (topology stance)

For the duration of its phase a submodule is driven as a **standalone repo** — its own integration branch,
its own task worktrees, its own provision list and gate, all in the nested repo; the auditor reviews
**inside** it (a real file diff, no gitlink in view). The superproject's pin is irrelevant until the later
gitlink-bump task. This is *why* the auditor-blindness failure cannot occur on a submodule task: there is
no superproject gitlink in the diff to be blind to.
_Avoid_: editing the in-place gitlink working tree; treating the submodule as a sub-area of the
superproject's worktree.

## Gitlink-bump task

A superproject task whose entire diff is advancing a submodule **gitlink** (the pin the superproject
records for a submodule path) to a SHA produced by a submodule task it **depends on**. Mechanical, but
a first-class task so the cross-repo SHA dependency is an explicit graph edge, not hidden in a body.
_Avoid_: "the bump" as a refiner step; pin task.

## Pin-validity (auditor lens for gitlink diffs)

The lens that judges a submodule-**gitlink** change. A gitlink-only diff is **valid** only on a declared
**gitlink-bump task**, and only if the new SHA is (1) **reachable on the submodule remote** — pushed, so
a fresh clone/CI can resolve it (a *local-only* commit fails) — and (2) the SHA the depended-on submodule
task produced. The remote ref it is reachable from need **not** be the default branch: a submodule
legitimately pinned to a feature branch is allowed, so the bar is *reachable on the remote*, not
*merged-to-mainline*. A gitlink move on **any other** task — one no bump task declared — is a hard
**refuse**; the same lens thereby guards against accidental or invisible submodule edits.
_Avoid_: requiring the pin to track the default branch; approving a pin to a local-only SHA.

## PR-and-hold landing (default submodule-landing authority)

WAR pushes the submodule task's *branch* and opens a **PR in the submodule repo**, then **holds** the
phase (`held:submodule-pr`) until an external actor merges it; on resume WAR reads the *actual merged
SHA* and runs the dependent gitlink-bump task. The default because it respects the submodule repo's own
review/CI and is squash/rebase-merge-correct (only the merge author knows the SHA a pin may reference).
_Avoid_: auto-merging the submodule PR; bumping the gitlink to the pre-merge branch tip.

## WAR-owned submodule (opt-in landing authority)

A submodule the operator **declares** WAR may land on directly — WAR runs the submodule's own
integration→working CAS land (mirroring the superproject), authoring the merge commit itself, so it
knows the landed SHA immediately and the run completes straight through with no hold. For submodules
this superproject solely controls; never the default.
_Avoid_: assuming WAR owns every submodule; landing on a shared library's mainline by default.

## AFK landing confirmation

Because `--afk` removes the human who would merge a `held:submodule-pr`, an AFK run cannot clear that
hold. So at **launch** WAR must confirm every touched submodule is a **WAR-owned submodule** (2A);
an un-owned submodule under `--afk` is **refused up front**, never started and left to stall on a hold
nobody can clear.
_Avoid_: entering an AFK run that will deadlock on a submodule PR.

## Submodule reachability precondition (red-team check)

A submodule WAR will land into must be **reachable by `gh`** from the run's account. A submodule on a
non-GitHub host — or one needing a different account — is **out of scope**: WAR does not land it, and
`/red-team` must **flag the unreachable submodule up front** rather than letting a run discover it at
resume. Reachability is a launch-time precondition, not a runtime surprise.
_Avoid_: starting a submodule phase whose remote `gh` cannot resolve; deferring the check to resume.

## Submodule base branch

The branch a submodule phase's integration branch is cut from and (under PR-and-hold) the PR targets.
Resolved by **explicit signal only**: a run-config override → the `.gitmodules` `branch` field → otherwise
**raised to the human** at launch. The remote default branch may be *offered* as a suggestion but is
**never silently adopted**. Ambiguity is escalated, not guessed — consistent with WAR's worker/auditor
"stop and escalate instead of guessing" rule.
_Avoid_: silently assuming `main`/`master`/the remote default; inferring the base mid-run.

## Undeclared submodule touch (the fail-closed guard)

Any submodule mutation **not** routed through a declared submodule task (content) or gitlink-bump task
(pin) — an in-place gitlink edit, an accidental pin move, or a worker whose target falls under a
`.gitmodules` path without the `target repo` tag. It is **refused** wherever caught (worker block, auditor
hard-refuse, refiner push-refuse). The guard runs in two modes: **refuse-all** (increment 1, before
first-class support) and **refuse-undeclared / route-declared** (increment 2); the net survives the relax —
anything off the explicit first-class path is still refused.
_Avoid_: treating a gitlink-only diff as reviewable; letting an untagged submodule-path edit through.

## Gate-evidence artifact

The tee'd full gate stdout+stderr file under `_refinery/.war/gate-<taskId>.<unique>/gate.log`; the `execution-evidence`
seat's source of per-mapped-test PASS evidence (inline `gate_output` is context only). Phase-ephemeral
(fresh directory per logical gate attempt; destroyed by `_refinery` heal and phase teardown) —
audit input, never a resume/adjudication record.
_Avoid_: minting a HARD provably-unrun finding from a possibly-curated inline `gate_output` paste (the
HARD determination is made only against the captured file); treating a missing artifact as a hold (missing
⇒ SOFT cannot-confirm).

## Critical path block

The worker's or the plan's numbered backward chain from the finish line to the tip: each link a
condition with a done test, exactly one link marked as the bottleneck (the earliest unmet link).
The worker writes `Critical path:` then `Ignore for now:` into `WorkerResult.notes` (shape:
`backward-chain-worker.md` `## Chunk shape`); the plan author writes one line per End state in Part
1 (placement latitude, never under `## Build order`; `backward-chain-plan.md`). The fixer's
counterpart is the commit-body block `Outcome:` `Chain:` `Bottleneck:` `Fix:` `Ignore for now:`,
echoed into `notes`.
_Avoid_: a new schema field or plan H2; a link without a done test (a guess, not a link); reading
the block as evidence (the seat runs its own chain and diffs the two).

## Pin transfer

An audit approval carried to a new SHA by a mechanical predicate, not a re-convened panel (canonical:
`pinTransfers` in `skills/war/assets/workflow-template.js`). *Seat-approval transfer*: a wave-side
ace whose git-derived file set (the tip probe's read) is a subset of the findings' file set re-runs only
the originating seats; the rest transfer to the ace sha. *Rebase pin transfer*: at the merge slot, a
conflict-free rebase plus `git patch-id --stable` equality of the task's own diff, before and after,
carries the panel pin to the rebased tip. Neither accounts an approval at a SHA the gate never
passed; a mismatch degrades to the in-lock full panel for that task alone. After a target move, a
mismatch holds the task instead (#2309).
Arms and shape: `skills/war/references/schemas.md`.

## test-floor pattern (`overrides.testPattern`)

The glob set the **Test floor** matches a task's diff against, pinned at Setup *together with* the gate
so floor ⊆ gate holds on any target repo, then **resolved per phase** (see **Pending testPattern
proposal**). Threaded end-to-end like `plan.gate`, never parsed out of the gate command (the globs live
in the target's test-runner config, not the command line). The gate's unconditional `*.test.sh`
discovery is always unioned in; `null` (default) = the built-in WAR-repo gate-mirror defaults,
byte-identical to today.
_Avoid_: deriving it by parsing the gate command; pinning a pattern independent of the confirmed gate
(floor ⊆ gate is one decision).

## Pending testPattern proposal

A Setup-proposed **test-floor pattern** the `--afk` sanity floor rejected (it had zero-match tokens),
recorded verbatim in the ledger and re-checked at each phase launch until adopted (or closed — a
validator-failing proposal cannot self-heal and is never re-checked). Adoption is
monotonic (`null` → the Setup proposal, once, for that and every subsequent phase) and never a fresh
interactive ask — it is why `overrides.testPattern` is *per-phase-resolved* rather than decided once
per run.
_Avoid_: treating the Setup confirmation as the final word on the value; minting a new pattern at
re-check time (the pending proposal is the only adoptable value); reading the ledger note as a resume
authority (git > labels > ledger).

## Packaging floor

The deterministic guarantee that a file a task adds beside individually-COPY'd siblings of a
Dockerfile is either packaged (a `COPY` line), excluded (`.dockerignore`), or exempted
(`requiresPackaging: false`) before it can merge — enforced by a tested shell assertion at
merge-task, the artifact-side sibling of the **Test floor**. Coarse and heuristic by design: the
floor proves enumerated packaging kept up with the diff; the opt-in docker-build gate (when the
operator accepts it at Setup) is the definitive artifact check. When unsure (unparseable
`.dockerignore` pattern), it flags — never silently excuses.
_Avoid_: docker gate (that is the executed build, a separate mechanism); treating a floor pass as
proof the image builds.

## `requiresPackaging` (task field)

Whether the packaging floor applies to a task's diff. Defaults `true`; the Lead sets it `false` at
decompose for tasks whose added files legitimately never ship in an image. Independent of
`requiresTest` — a task can require a test but not packaging, and vice versa.
_Avoid_: packagingExempt (state the requirement positively, default-on).

## `unpackaged` (merge outcome)

The refiner's merge-task result when the packaging floor flags an added file. Not a failing gate —
it routes a bounded fix-worker (add the `COPY`, or `.dockerignore` it; never delete the file) plus
a full re-audit, and escalates hard only on budget exhaustion.
_Avoid_: gate-failed (the suite is green; the *image manifest* lags the diff).

## Artifact-kind

The class of artifact `/red-team` is verifying (`impl-plan` / `tdd-plan` / `design-doc` / `prd`), computed
by the Lead pre-flight and threaded into every probe. Drives whether a claimed-but-absent symbol is a
deliverable baseline (suppressed) or a precondition failure (a finding). Defaults to `impl-plan` when
absent — the suppression-safe choice.
_Avoid_: "plan type", "mode" — and never default to a kind that *un*-suppresses future-work absence;
`impl-plan` leans safe because the reverse direction re-opens the false-Critical misfire.

## env-gap finding

A probe finding flagged `envGap: true` — recording a PROVISION-STEP failure inside an executed probe's
own sandbox (the setup broke; the artifact under test did not). `classify()` demotes it to an
informational Minor regardless of severity or probe status, checked adjacent to and after the
`deliverableAbsence` flag (a finding carrying both demotes via `deliverableAbsence` first). `needsDecision`
is not cleared by the flag — a self-declared ambiguity still blocks.
_Avoid_: conflating it with /war's **`env-blocked`** — that is a per-task *provisioning* outcome (the
worker is never spawned); an env-gap finding is a /red-team probe-*result* flag (the probe ran to
completion and reports the broken environment as a note).

## Sandbox-escape guard

The deterministic post-run check (`assert-no-repo-escape.sh`, floor exit contract 0/1/2) that no executed
probe mutated the real repo working tree or pushed a junk remote ref. Runs between the Workflow return and
the gate; a positive result routes the verdict through the self-confound gate (ADR 0020), never `CLEARED`
until the state is clean (a provenance-cleared foreign delta is clean state and does not block `CLEARED`).
The hardened `git -C` scope-lock is prevention (Layer 2); this guard is the detection authority (Layer 3).
_Avoid_: "cleanup", "sandbox jail" — it is detection, not confinement; the agent-type probe jail is a
recorded non-goal (D6).

## Ref-diff baseline

The pre-run ref-set snapshot `assert-no-repo-escape.sh --snapshot` writes outside the `--repo` working
tree (the full local `git for-each-ref` set) — the exact half of the post-run `--baseline` check: a
name-agnostic diff over `refs/heads/`/`refs/tags/` that closes the #1244 pattern-slipping-branch hole a
name allowlist could not, and that excludes `refs/remotes/*` (which moves on an ordinary `fetch`).
_Avoid_: conflating it with the unconditional pre-run local-integrity refusal (clean porcelain, no
junk-pattern ref) — that refusal runs first and blocks baselining pre-existing residue; the baseline
file is the separate artifact the post-run diff compares against.

## Adjudicated flag

The typed per-finding `adjudicated: true` the Lead stamps on a finding object in the gate-input working
copy at grill time, then re-pipes through the gate via `--stdin` — the only channel by which adjudication
reaches `verdict()`.
_Avoid_: a string `'true'`, a truthy value, or NLP over finding text — the gate reads a strict boolean
`=== true` on the finding itself, matching the `deliverableAbsence`/`envGap` typed-flag pattern.

## Adjudication provenance marker

The per-row `operator-ratified (<date>)` / `AI-declared` token every row of a report's `## Adjudications`
block carries (ADR 0014 family) — finer-grained than the heading-level intent marker, because one run
can mix operator rulings with Lead self-adjudication (`--afk`) inside the same report.
_Avoid_: a block-level provenance stamp — the marker is per-row precisely because a single report can
mix operator-ratified and AI-declared rows side by side.

## analyzed-agent fallback

The red-team scaffold's sticky re-route of analyzed probes/confirms from the preferred read-only agent
type to `general-purpose` when the harness lacks the preferred type: the FIRST dead preferred dispatch
pins the whole run (#890), and every later analyzed dispatch routes to `general-purpose` proactively —
not a per-item re-dispatch. The Lead's SKILL.md Step-3 pre-flight can pre-empt it entirely by passing
`analyzedAgentType` up front; the pin is the in-run backstop when the Lead doesn't (or can't enumerate
the registry).
_Avoid_: "capability check" — the scaffold fallback is reactive (detect the first dead dispatch, pin,
re-route), never itself a pre-flight harness query (that is the separate Lead-side Step-3 check).

## Verify-on-write

The servitor's discipline of Read/Grep-confirming a named file/flag/symbol exists before recording a
fact about it: found → `code-verified`; absent → `agent-unverified` with an absence-note. Distinct
from running the gate (which the servitor cannot do).
_Avoid_: fact-checking, validation (it confirms *existence*, not *truth*).

## Memory root

One of the two directories a lesson can canonically live in: the **repo root** (committable — travels
with clones, merges across users, reviewed like code) or the **local root** (private to one
machine/user, never committed). A lesson belongs to exactly one root, routed by its `metadata.type`
and the redaction lint.
_Avoid_: "the memory dir" (which one?); treating the roots as mirrors (they hold different lessons).

## Promotion

The Lead's Gate-2 act of publishing a `type: project` lesson from the local root into the repo root — a
**copy-with-marker**, completed only **after the push succeeds**: the repo copy rides the phase PR (a
same-slug repo file is **overwritten on recurrence**, unless the repo copy carries text the local
copy lacks: then the local copy is held as `stale-local`, kept in the local root and reported, never
dropped), and the local original gains a nested
`metadata.promoted: <workingBranch>@phase-<N>` marker and is **never deleted** — it stays recall-visible
(to `render-index`/prefetch/`/lessons-learned`) and is retired only by a future `/lessons-learned` pass
once the merge is confirmed. A failed push or a redaction flag leaves the lesson unmarked in the local
root — never dropped. The servitor never promotes; the Lead is the sole repo-root writer
([ADR 0022](../../../docs/adr/0022-servitor-local-root-writes-gate-2-promotion.md)).
_Avoid_: "move" / "publish-and-delete" (the local original survives); treating it as a servitor write.

## Hot set / Cold set

The temperature split of a memory root, encoded by *location*: hot lessons sit in the root itself and
each gets one row in the index projection; cold lessons sit in `archive/` — no projection row, still
indexed and retrievable by query, forever. Archiving is a file move plus a dated body note; it is
never a deletion.
_Avoid_: deleted/retired-as-removed (cold lessons remain queryable); a status field (the path *is* the
state).

## Index projection

The generated, size-capped rendering of both roots' hot sets into the **local** `MEMORY.md` (the
session auto-load file) — a two-column router (`[[slug]]` + summary cell), one row per hot lesson,
capped by *selection* (archive candidates) **and per-cell budgets** (the cell budget). Both are
view-mechanisms: neither drops knowledge, which stays whole in the lesson files (deep recall is the
`query` path, not the projection). Generated-only: no process or person edits it in place; writers write
lesson files and the projection is re-rendered atomically. The repo root carries no projection — a
committed generated file is a merge-conflict surface.
_Avoid_: "the index" as a hand-maintained file; compaction (the projection is regenerated, not
trimmed); a committed copy; reading a terse or truncated row as lost detail (the row routes; `query`
retrieves the full lesson).

## Cell budget

The per-cell render cap on a projection row's summary cell (`SUMMARY_CELL_BYTES`) — a *view-only*
truncation: the lesson file keeps its full text, only the row's rendering is bounded, and the trailing
provenance tier / `[repo]` markers are never cut (the `safe-swap` extractors and row classifiers key on
them). One of the index projection's two cap mechanisms; the other is *selection*.
_Avoid_: treating a capped cell as lost content (the file is intact; `query` returns it in full);
conflating it with the advisory line (the cell budget caps one cell, the advisory line caps the whole
projection).

## Usage-scored eviction

The tighten ranking of eviction candidates by ascending uses, then descending redundancy, then ascending
hits, behind hard floors: `user-confirmed` tier, concept hubs (≥2 hot citers), and lessons under 8 days old.
A silent log degrades to tier + age order. Nothing is blended into a weighted composite.
_Avoid_: reading zero as zero value (the log misses the operator's own reading); a weighted score.

## Always-loaded test

A lesson keeps its index row if a session needs it before it knows to query: a standing operator rule,
or a trap that fires where no task text would surface it. Query and prefetch reach the rest from the cold
set ([ADR 0055](../../../docs/adr/0055-archive-reachable-memory-index-holds-only-what-a-query-cannot-surface.md)).
_Avoid_: reading eviction as a loss (it removes a row, never a lesson).

## Derived memory index

The SQLite/FTS5 index built **in memory, per invocation**, from both roots' lesson files (hot + cold).
It never exists on disk — nothing to commit, back up, corrupt, or heal. The canonical store is always
the text.
_Avoid_: memory database as a source of truth or as a file; index staleness (it is rebuilt on every
use).

## Redaction lint

The deterministic, fail-closed content check a lesson must pass to sit in the repo root: a flagged
lesson (home paths, emails, account handles, credential-shaped strings) is demoted to the local root
and reported — never committed, never dropped. First of three publication gates (lint → PR review →
repo CI).
_Avoid_: treating it as truth- or quality-checking (it checks *publishability*).

## Memory prefetch

The Lead-side retrieval step at phase launch: one query per prospective seat (task text plus the
seat's role/lens), each result capped and injected into that agent's spawn prompt. Per-seat queries
mean different auditor lenses receive different lessons. Fails open — a phase without memory runs
lesson-less, logged.
_Avoid_: agents querying at spawn time (seats may, mid-task, as an extra); a shared identical
memory block for all seats.

## Finding-match check

The servitor's obligation to re-confirm that an audit finding's *named construct* (the specific defect,
not merely the file) still matches at the landed tip before recording it as a live gotcha — match →
`code-verified` with the file/line locate-cue; no match (fixed in-flight) → the generic pattern at
`agent-unverified`, never a live file/line. Extends verify-on-write (which checks referent *existence*
only) ([ADR 0029](../../../docs/adr/0029-capture-grounds-on-committed-tip.md)).
_Avoid_: recording a stale audit-log finding's file/line as a current instance (the log outlives the
fix round that resolved it); conflating file-exists with finding-still-matches; assuming the wrap-up
cwd is the committed tip (ground on the threaded landed-tip anchor via the grounding ladder instead).

## Budget-Raise trailer

The machine-checkable citation a merge diff must carry when it *raises* any `hard:`/`advisory:`
ceiling constant in `prompt-surface-budgets.test.mjs` — a `Budget-Raise:` commit trailer citing
ADR 0042, the surface, and the byte delta (exact form: `assert-budget-raise-cited.sh`, a landed
merge-path floor that refuses an uncited raise). Ratchet-downs need no trailer.
_Avoid_: prose justification alone (the floor greps the trailer, not the commit body's argument).

## gh preflight

The pre-batch assertion (`gh-preflight.sh <overrides.ghUser>`) that the active `gh` account is the run's
`overrides.ghUser`, re-switching on drift (`gh auth switch`) and re-verifying via `gh api user --jq
.login`, failing loud on an unrecoverable mismatch, so a mid-run account flip never silently drops a
write batch. Unset `ghUser` ⇒ exit 0 no-op (single-account repos and the shipped default untouched).
_Avoid_: relying on a once-at-session-start auth check.

## issue-lifecycle floor

The Lead-invoked check (`assert-issues-filed.sh`) that phase epics and task sub-issues named in the
ledger actually exist on `gh`, and are closed with `status:done` on a landed phase. A hard gate at the
checkpoint keyed on the ledger's own fields (orthogonal to any plan's `No GitHub issue filed` line);
issue filing is verified, not doctrinal. Mirrors the `assert-*-in-diff.sh` `0/1/2` exit contract — a `2`
(gh/ledger/ref error) never collapses into the `1` named route.
_Avoid_: trusting the ledger's `epic_issue`/`issue` fields as proof of filing.

## acknowledged-stranded

An aftermath report bucket for remote branches an operator has permanently accepted as stranded (content
landed under rewritten SHAs), recorded in `docs/aftermath/known-stranded.tsv` with a landing PR (or a
documented PR-less `note`). Suppressed from needs-human, never auto-deleted, the tip-reachable +
PR-merged deletion bar unchanged. Matched by exact `refs/heads/<ref>` name, never a substring.
_Avoid_: re-deriving them as fresh needs-human rows every run; treating an allowlist row as a deletion
license.

## Campaign ledger

The uncommitted per-run state of a campaign at `.claude/campaigns/<id>/ledger.json` — the plan queue
plus per-plan outcome — the entry shape's maintained home is `makePlanEntry` in `campaign-ledger.mjs`
(ADR 0046), cited rather than re-enumerated here so the field set cannot rot on this surface
(ADR 0025). **Single-writer** (the campaign
Lead), written atomically (temp file + rename), owned by `campaign-ledger.mjs`. The resume source: a
re-invoked campaign re-reads ledger + **Inbox** and continues; on resume the Lead reconciles the ledger
*toward git* (`git ls-remote`, `gh pr view`) before trusting it.
_Avoid_: committing it (that's the **Roadmap** snapshot's job); editing it by hand mid-run.

## Memory mining

The survey's opening step: turning qualifying hot lessons from both memory roots into real
tracker issues — lint-guarded (a redaction hit withholds the issue, never scrubs it) and
slug-deduped (open or closed prior filing → never re-filed) — before the issue sweep runs, so
lesson-recorded debt enters the pipeline as ordinary issues.
_Avoid_: memory sweep (the sweep is the issue step); treating mined lessons as a parallel channel
(they become real issues or are reported, nothing else).

## memory-mined

The provenance label on an issue that originated as a lesson; the body's lesson citation is the
durable issue↔lesson link. Distinct from `war-followup` (a run's own deferred debt).
_Avoid_: reusing `war-followup` for mined issues (conflates two provenances).

## Living ADR

An ADR whose body carries current law and is rewritten in place when a decision changes
([ADR 0063](../../../docs/adr/0063-living-adrs-git-is-the-archive.md)). Git is the archive: the
retired text stays reachable at the commit that introduced it. Each change adds one **Decision log**
line. Docs, plans, references, cards and ADRs follow this policy lifecycle. Red-team reports, run
manifests, `docs/learnings/` frontmatter, consumed specs and released `CHANGELOG.md` entries are
records, written once.
_Avoid_: a dated `## Amendment (…)` section or a bold dated run-in below the old text. Avoid exempting an
ADR from an absence guard because it was once append-only.

## Decision log

The `## Decision log` section every ADR keeps, one line per change:
`- YYYY-MM-DD · <what flipped> · <driving issue>`. A line that reverses or narrows an earlier
decision adds `· failed because: <one clause>` after the driving issue. A line that retires text
ends with `· retired: docs/adr/<file> @ <sha>`, where the sha is the commit that introduced the
retired text: the oldest hit of `git log --reverse -S'<retired literal>' --format=%h -- <file> | head -1`.
A fold's line carries the folded heading's date and title, so a dated citation still resolves.
_Avoid_: the commit that last held the text as the `retired:` sha; a `failed because:` clause that
restates the old text; putting `failed because:` after `retired:`.

## Sha-pinned citation

An ADR citation of the form `docs/adr/<file> @ <sha>`: it means the file at that commit, so it is
the form for citing retired text. It is one of three citation forms. A bare citation (`ADR 0013`)
means current law. A dated citation (`ADR 0013 (2026-08-25)`, `ADR 0013 amendment 2026-08-25` or
`ADR 0013, amended 2026-08-25`) resolves to that date's **Decision log** line.
_Avoid_: a bare citation for text a later rewrite retired; a branch name in place of the sha.

## No-fix sentinel

A `suggested_fix` text that names no fix, such as "None needed.", "n/a" or a lone dash. The floors
and the fix-less checks read it as blank (canonical: `noFixText` and `NO_FIX_SENTINELS` in
`skills/war/assets/workflow-template.js`), so a Major whose fix is "None" is fix-less.
_Avoid_: reading a sentinel as a concrete fix; restating the sentinel list here.

## Reconciled follow-up

A `demote:absorb-regressed` row that a later ace fixed before land. The filing pass moves it to
`notes` as `reconciled:aced-later`, logged with the aced sha, and never files it (canonical: the
file-followups reconcile step in `skills/war/assets/workflow-template.js`).
_Avoid_: filing an issue for a finding the run already fixed.

## Polish claim

The first same-wave polish commit to touch a file outside every wave task's `files` owns that file
for the wave. A later same-wave polish commit on the claimed file is forward-reverted, and its rows
go to the phase-close queue ([ADR 0061](../../../docs/adr/0061-polish-claim-and-net-zero-clash-range.md)).
_Avoid_: letting two polish commits in one wave edit one unclaimed file.

## Net-zero clash range

The commits after a task's approved sha that are exactly a clashing polish commit and its
forward-revert, with the same tree as the approved sha. The merge slot moves the task branch back
to the approved sha, so the pair never replays: the one exception to the no-reset rule
([ADR 0061](../../../docs/adr/0061-polish-claim-and-net-zero-clash-range.md)).
_Avoid_: treating any other range as net-zero; a reset outside this exact shape.

## Enforcement ladder

The six enforcement levels ranked from engine code down to the prompt: engine, capability, hook,
git structure, check before merge, prompt. Each rule is enforced at the highest level that can
express it ([ADR 0060](../../../docs/adr/0060-enforce-each-rule-at-the-highest-level-that-can-express-it.md)).
_Avoid_: a prompt-only rule for a write to shared state.

## Least start

Each seat starts with the least context, the fewest tools and the least permission its dispatch
needs, and gains more only at a named trigger. The triggers are a `references/` pointer for
context, `ToolSearch` for tools and a per-`agent_type` guard arm for permission
([ADR 0060](../../../docs/adr/0060-enforce-each-rule-at-the-highest-level-that-can-express-it.md)).
_Avoid_: a card with no `tools:` line; widening every seat's guard arm for one seat's need.

## assert-submodules-ready

The `provision-worktrees.sh` verb that checks every submodule a worktree declares is initialized.
`ensure-worktree` and `ensure-refinery-worktree` init any uninitialized submodule and then call it, so a provisioned worktree is
submodule-ready or the Provision barrier fails `env-blocked`. `assert-done-when.sh` calls it before it
runs a Done-when command, so a worktree that is not ready is an env error there, never the `done-unmet`
route. Exit codes: the catalogue in
[ADR 0034](../../../docs/adr/0034-engine-ingest-guards-and-provision-exit-codes.md). Contract:
[ADR 0021](../../../docs/adr/0021-run-lifecycle-provision-contract.md).
_Avoid_: reading a not-ready worktree as a failed acceptance check; a gate run in a worktree this verb
never checked.

## `overrides.doneWhenPreamble`

The config key that holds one shell line the refiner stages above a task's `Done when:` command in the
floor's cmd file, for example a line that puts an interpreter the gate already uses on `PATH`. The Lead
threads it as `plan.doneWhenPreamble` at every phase launch. When the floor's command is not found, its
diagnostic names this key. Default and validation: `DEFAULTS.overrides` in
`skills/war/assets/war-config.mjs`. Rules: `skills/war/references/setup.md` § Done-when preamble.
_Avoid_: editing a plan's Done-when command to add environment setup; reading a prose first token's
command-not-found as a missing interpreter (that is a threading defect).

## Pending test-floor pattern

The `--pending-pattern` set the Lead threads to the **Test floor** as `plan.testPatternPending`: a
**Pending testPattern proposal** that passed the same validator as `overrides.testPattern`. The floor
consults it only when the active set matches no diff test file. If a pending token matches one, the
floor adopts the set for that task and prints `adopted-pending-pattern:`. The marker never changes
`plan.testPattern`, and adoption for the run stays the phase-launch re-check's job. Rules:
`skills/war/references/setup.md` § Per-phase pending-proposal re-check and the `assert-test-in-diff.sh` header.
_Avoid_: threading a validator-failing or closed proposal; treating a floor adoption as the run's new
`overrides.testPattern`.
