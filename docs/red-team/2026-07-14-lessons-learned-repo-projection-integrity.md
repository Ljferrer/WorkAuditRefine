# Red-team report — 2026-07-14-lessons-learned-repo-projection-integrity

- **Plan:** `docs/plans/2026-07-14-lessons-learned-repo-projection-integrity.md`
- **Source spec:** `docs/specs/2026-07-14-lessons-learned-repo-projection-integrity-design.md`
- **artifactKind:** `impl-plan` (per-task `Files:` under `## Build order`; not red-first)
- **Run:** 2026-07-16, campaign `2026-07-14-survey-debt` (plan 3 of 4), self-adjudicating under
  AFK (zero operator volleys — no blocker or needsDecision surfaced)
- **Verdict:** **CLEARED** (gate: `CLEARED-WITH-NOTES` — round 1: 11/11 probes on-target,
  0 blockers / 0 needsDecision / 4 Minors, all resolved below)

## Attack surface / executed proof

One Workflow round (`wf_1d5847ab-342`), model opus / effort high, provision `[]`. 6 spine lenses
+ 5 bespoke probes (baseline-repro, anchor-check-script, anchor-check-docs, command-diff,
predicate-mechanics); 4 executed / 7 analyzed; coverage whole (11/11 on-target, none dropped).

- **Baseline:** `safe-swap.test.sh` and `lessons-learned-doc-contract.test.mjs` both green at
  base (12 doc-contract locks pass); CASES 1–6, the three temp-break proofs, `mkmem`/`add_row`,
  and CASE 1's `gamma` `[repo]`-row fixture all present as the plan names them.
- **`predicate-mechanics` (executed): full pass** — the plan's row-scoped `[repo]`-count design
  proven on fixtures: FAIL fires on zero-repo-row + populated root; PASS after one `[repo]` row;
  WARN (no death) on a nonexistent path, with the `abspath`-style `die` shown to exit hard
  (validating the plan's `[ -d ]` mandate); empty-root skip holds; the whole-file `grep -c`
  false-PASS on a `[repo]` literal in prose demonstrated while the row-scoped pipe stays
  correct; the `|| true` necessity under `pipefail` proven (unguarded pipe dies on exactly the
  FAIL-triggering input). The marker-in-row residual matches what the plan's Notes already
  accept — not over-flagged.
- **`ff-topology` derivation: not triggered** (token grep clean; no merge-topology anchors).
- **`unguarded-new-mirror` (Lead-run): vacuous pass** (no engine/inline-mirror footprint).
- **`default-flip-old-absent`:** no default flip in this plan (an additive fail-closed-on-presence
  check); the OLD-absent concern reduces to the archive bullet's `--repo`-less form, which End
  state 9's grep + the new doc-contract lock close mechanically.

**Escape guard:** exit 1, cleared through the diagnosis pre-flight — the only stray files are the
two campaign-boundary materializations (`2026-07-15-campaign-state-anchor` plan + spec), the
campaign Lead's own sanctioned pre-run state, third consecutive clean adjudication of the same
provenance. Not an escape.

## Findings and resolutions applied

1. **"Fourth check" off-by-one** (anchor-check-docs, `fail`, Minor, internal-contradiction).
   SKILL.md's Phase 6 "It checks:" sentence already enumerates FOUR checks (row→file hard fail,
   unindexed-file warn, dangling-wikilink warn, budget hard fail) — the new repo-completeness
   check is the FIFTH clause (third hard fail), not the fourth. **Patched:** End state 10, End
   state 11's lock description, and the Phase 6 slice bullet relabeled; the prose and the new
   lock are directed to anchor on the clause's own tokens, never an ordinal.
2. **Frozen-anchor lock attribution overclaim** (claims-vs-reality `warn` + command-diff `warn`,
   two independent CONFIRMED Minors converging on one defect). The Notes bullet claimed both
   frozen anchors are "regex-anchored by pre-existing doc-contract locks"; in reality only the
   ``silently drops every `[repo]` row`` phrase is lock-anchored in SKILL.md — the evict
   local-only lock reads `references/migration.md` (`evicted rows lose their` + no `--repo`) and
   does not grip the SKILL.md Common-mistakes evict-exception sentence (verified: rewording that
   sentence reds zero of the 12 locks). **Patched:** the Notes bullet and the slice's "Two
   anchors are frozen" passage now attribute the locks correctly and reclassify the SKILL.md
   evict-exception freeze as same-commit manual discipline the auditor verifies in the diff.
3. **AI-declared intent provenance** (intent-vs-plan, probe `pass`, Minor — confirmation
   artifact). All 13 End-state conditions checkable, task-mapped, collectively sufficient; no
   operator ratified them (ADR 0014). **Auto-noted**; upgrade path is `/war-strategy <plan>`.

## Backstop-legitimacy (AI-declared section)

All three entries legitimate; each carries the mandatory **AI-declared** Minor marker (no human
has ratified these waivers — surfaced here in lieu of the `--afk` approval gate):

- **Live-pass composition on the real repo-adopted store** — justified (prose directive +
  fixture-proven mechanics only compose observably in a live pass); runner named (next
  `/lessons-learned` operator; red-team sandbox probe as fallback).
- **Archive-slug-typo root widening** — an honest accepted residual with a tripwire (first
  observed wrong-root archive files the `--root` disambiguation follow-up); reversible by
  construction (archive is a move, never a delete).
- **Partial-drop reconciliation** — a spec-§9 deferred non-goal with a tripwire runner (any
  observed partial `[repo]`-row loss files the reconciliation follow-up citing this plan).

## Adjudications

None — no operator volleys; no authoritative values changed. Both plan patches (findings 1–2)
are AFK Lead self-adjudications recorded above. Release phase stays directive-form (next free
patch above the live base; slots at the worker's base are authoritative).

## Residual risk

- The SKILL.md evict-exception sentence is now correctly known to be lock-unguarded — its freeze
  rides Task 1.1's same-commit discipline plus auditor diff review (finding 2's reclassification),
  with the migration.md lock as the design-level backstop.
- The wholesale-drop detector deliberately passes partial drops (spec §9 non-goal, backstop 3's
  tripwire).
- All three backstops are AI-declared and ride into `/war` as `args.backstops` with
  `aiDeclared: true`, surfacing at every land and in the campaign wrap-up aggregate.
