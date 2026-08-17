---
name: readme-status-blurb-homes-list-is-editorial-not-exhaustive
description: "A README ## Status-blurb bullet's Homes:/Home: list can omit a surface the bullet's own prose names — the authoring checklist states no exhaustiveness rule, so this is calibrated disposition:note (informational), not absorb, especially once the phase is at its terminal polish round"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: readme-status-blurb-homes-list-is-editorial-not-exhaustive
  phase: "2026-08-06-handoff-schemas-contract/phase-3, task 3.1 audit + p3-polish gate-audit"
  keywords: 
    - Homes list
    - Status blurb
    - README Status
    - authoring checklist
    - note disposition
    - absorb bar
    - release slot
    - terminal phase-close polish
    - under-attribution
    - Home vs Homes
    - schemas.md
    - workflow-template.js
    - cross-task coherence
  tags: 
    - war
    - release
    - readme
    - audit-findings
    - process
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T17:07:25.060Z
---

# A README Status-blurb bullet's `Homes:`/`Home:` list is editorial, not an exhaustive enumeration

**Code-verified** at landed tip `432d9d361f6ebe3c850048bd137250c7744d68a6` on
`dev/2026-08-06-handoff-schemas-contract`, read via the `_refinery` worktree matching that SHA
(gitdir physical path containing this plan's slug:
`<repo-root>/.claude/war-worktrees/2026-08-06-handoff-schemas-contract-2026-08-17/_refinery/`).

Phase 3's Status blurb (`README.md` `## Status`) carries five bullets, each ending in a `Home:`/
`Homes:` list of link-formatted file paths. Three of the five bullets, verified directly at the
landed tip, name a surface in their own prose that their own `Homes:`/`Home:` list omits:

- Line 363 (`#1331`, follow-up filing + clock-read manifests): prose says the Run-manifest contract
  "on both surfaces" mandates real clock reads and names a `schemas.md` `followUps` row, but the
  Homes list reads only `workflow-template.js`, `agents/war-refiner.md`, `skills/war/SKILL.md`,
  `skills/war-review/SKILL.md` — no `schemas.md`.
- Line 364 (`#1333`/`#1289`, return-contract truth sweep): prose names "the engine's
  `ACCEPTANCE_IDS_RULE`" and "the worker card" (`skills/war/assets/workflow-template.js` and
  `agents/war-worker.md`), but the trailing `Home:` is singular — `schemas.md` only.
- Line 367 (Phase-2 engine truth, `#1395`/`#1411`/`#1413`/`#1408`): prose names
  `skills/war/SKILL.md` inline for the `--queries` JSONL contract, but the Homes list reads
  `workflow-template.js`, `land-decision.mjs`, `war-memory.mjs` — no `skills/war/SKILL.md`.

Line 366 (`#1381`, the reuse-path hygiene bullet) is the control: its Homes list *does* include
`schemas.md`, `[provision-worktrees.sh]`, `[workflow-template.js]`, `[agents/war-refiner.md]`,
`[resume-and-recovery.md]` — because a prior finding on this exact bullet was `absorb`ed by an
earlier phase-close polish task in the same phase.

**Why these are `note`, not `absorb`/`follow-up`, and never a plan-faithfulness defect:**

1. **No exhaustiveness rule exists.** `README.md`'s own `### Status-blurb authoring checklist`
   (confirmed at the landed tip, `README.md` lines 328-357) states seven items — bound every
   absolute, repeat a guard's scope word, trigger surface not topology, conditional side effects,
   scoped labels, appositives, provenance — and **none of the seven mandates a `Homes:` list be
   exhaustive**. Omitting a named surface from the list is an editorial granularity choice, not a
   checklist violation.
2. **The plan slice never mandates Homes-list exhaustiveness either.** Task 3.1's plan slice
   mandates identifier truth, count-word/enumeration match, and no-wider-than-implementation guard
   semantics — never an exhaustive `Homes:` enumeration — so this is outside a plan-mandated
   same-scope sweep, a survey straggler rather than a worker omission.
3. **The omissions pre-date the diff under audit.** They were present at the phase-3 base, not
   introduced by task 3.1 or `p3-polish`'s own changes — an `absorb` bar (touches no version/release
   slot the diff itself modified beyond the one already-fixed bullet) refuses them for that reason
   too.
4. **Terminal-round bar.** When these findings surfaced from `p3-polish`'s own gate-audit — the
   phase's terminal round — `absorb` would have no further round to land it; see
   [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]]'s Recurrence
   (`p3-polish`, 2026-08-17) for the full disposition-routing mechanics of this exact audit round.

**The pattern:** a Status-blurb bullet's `Homes:`/`Home:` list is a **convenience pointer**, not a
closed set the bullet's prose is diffed against — the same shape as
`plan-enumerated-doctrine-census-homes-list-is-illustrative-not-exhaustive` (archived) for a
different artifact (a plan's census clause vs. a README blurb's own cross-reference), but the same
underlying calibration: an enumerated "homes"/"expected locations" list next to open-ended
descriptive prose is scaffolding for the reader, and a same-class hit/reference the list omits is
informational (`note`), never a HARD/`absorb` violation — **unless** a specific finding on that exact
bullet was already `absorb`ed in an earlier round (as line 366 shows), in which case the fixed
bullet's list should be trusted as the corrected baseline, while its still-uncorrected siblings stay
`note`.

**How to apply:** when auditing a README (or similar) Status/changelog blurb whose bullets pair
prose with a trailing `Homes:`/`Home:` pointer list, do not treat a prose-named-but-unlisted surface
as a defect by default — check (a) whether an authoring checklist or plan slice mandates
exhaustiveness (usually it does not), (b) whether the omission pre-dates the diff under audit, and
(c) whether this is the phase's terminal round. All three favor `note`; only a fresh, diff-introduced
omission on a non-terminal round, with the surface genuinely load-bearing to a reader (e.g., the sole
pointer to a contract file), should be considered for `absorb`/`follow-up`.

**Locate-cue (verify still present before acting):** `README.md`, `## Status` section, the five
bullet points following the version-slot summary line; the `### Status-blurb authoring checklist`
above it (`README.md` lines 328-357 at the cited tip).

Related: [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] (the
disposition-routing mechanics that applied to these three findings);
[[release-blurb-overstates-guard-semantics]] (the sibling family of Status-blurb calibration rules
the same checklist's item 7 cites by name).
