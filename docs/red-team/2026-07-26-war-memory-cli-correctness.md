# Red-team report — war-memory CLI correctness & lint completeness

- **Plan:** `docs/plans/2026-07-26-war-memory-cli-correctness.md` (patched in place; verified tip `4453863`)
- **Source spec:** `docs/specs/2026-07-26-war-memory-cli-correctness-design.md`
- **Run:** `wf_53228ce5-e83`, 2026-07-27, `artifactKind: impl-plan`, opus/high (config `agents.redteam`)
- **Rounds:** round 0 (14 probes, 20 agents) → plan patch `4453863` → round 1 (single-agent re-verify of all 12 blocking findings)

## Verdict: **CLEARED**

All 14 probes on-target, none dropped, none off-target. 12 blocking findings (8 gate blockers, 4 additional `needsDecision`) patched into the plan and re-verified RESOLVED at `4453863`. All 5 Minors were absorbed by the same patches.

## Attack surface

6 spine lenses + 8 bespoke probes (snippet-fidelity, baseline-repro, anchor-check, lesson-prose-source-fidelity, ff-topology, default-flip-old-absent, unguarded-new-mirror, backstop-legitimacy). Executed 6 / analyzed 8; round-0 statuses: 4 pass, 5 fail, 5 warn.

**Baselines proved live** (baseline-repro, snippet-fidelity — both `pass`, completed pre-incident): all four quoted pre-fix snippets verbatim-present; all "red pre-fix" claims genuinely red today (invalid `--top-k`/`--budget` bind or default silently at exit 0; nested `archive/` violation lints clean; a refused-shape query still logs).

## Findings and resolutions applied (all at `4453863`)

| # | Probe | Finding | Resolution |
|---|-------|---------|------------|
| 1 | executable-proof | Task 1.2's `dropped`/`collapses` grep guard is case-sensitive — a re-cased straggler false-negates | Sweep + End state 9 now mandate `grep -in`, token-anchored |
| 2 | executable-proof / consistency-placeholders / default-flip-old-absent | ADR 0028 quotes the hub-WARN verbatim (`inbound refs`); no task owned it, no OLD-absent gate anywhere | ADR 0028 added to Task 1.1 Files; dated **append-only** amendment mandated; per-medium gate: NEW-present on the ADR, OLD-absent on live `skills/`/`hooks/`/`agents/`/`CONTEXT.md`/`README.md` (frozen artifacts + the historical ADR quote exempt) |
| 3 | consistency-placeholders | Existing spawn-CLI hub-WARN test pins the message bytes — the noun flip reds it, and no plan step updated it | Named as required in-task edit (title + regex); End state 8's stay-green clause narrowed to the `inboundCiters` unit tests |
| 4 | intent-vs-plan | End state 1's literal ("A supplied-but-invalid `--top-k`… exits 1") falsified by the `=`-attached residual the same plan freezes (D10) | Purpose + End state 1 narrowed to space-separated values; the `=`-attached form lifted into the Intent as a NAMED still-silent frozen residual. Widening `cmdQuery` to refuse `^(top-k|budget)=` keys was **declined** — D10 is a ratified spec freeze |
| 5 | anchor-check / claims-vs-reality | Contention note claims "the one sibling plan" — the roadmap has three siblings, and plan 4 overlaps `README.md` + `version-slots.test.mjs` in its non-release Phase 1 | Bullet rewritten: three siblings, real overlap named, landing-order mitigation recorded |
| 6 | backstop-legitimacy | Backstop 2's runner (Gate-2) is a propagation vector that would overwrite the Task 1.2-corrected repo copy and land the archived tighten slug hot | Rewritten: in-run runner = Phase 1 **servitor** (recorded `resolved-lesson-stamp…` convention); residual = next `/lessons-learned`; **Lead Gate-2 duty**: exclude the tighten slug (and any archived-repo-copy slug) from promotion |
| 7 | backstop-legitimacy | Backstop 2's justification ruled out only the worker, not the run — the servitor's sole write path IS the local root | Justification re-scoped ("FROM THE WORKER only… but not outside the run's") |
| 8 | backstop-legitimacy | Backstop 1 mis-filed as deferred — the task gate runs the recursive live-tree lint pre-merge and blocking | End state 6 re-filed HARD (gate-log banner = evidence); backstop narrowed to the post-gate window (runner: refiner/Lead at land → CI) |
| 9 | unguarded-new-mirror | The cmdQuery guard shape-copy ships with no coupling to its reference implementation | Coupling comments mandated both ways (each guard arm ↔ `cmdTightenPlan`'s `--target` block) |
| 10 | unguarded-new-mirror | End state 3 hand-types `10`/`4096` — an unguarded inline copy of two canonical exports | Explicit-defaults invocation built from the imported constants |
| 11 | executable-proof (Minor) + intent-vs-plan (Minor) | Doc-sweep "Zero stragglers" claim was scoped too narrowly to support itself | Sweep note widened to the WARN message string; ADR 0028 discovery recorded |
| 12 | — (decompose gate, pre-red-team) | Task 1.2's declared tighten-lesson path no longer resolves (archived 2026-07-27, PR #1167) | Re-anchored to `docs/learnings/archive/…` at `42d6912`; restore-to-hot declined (would re-breach the 17,000 B projection advisory) |

## Adjudications

| # | Delta | Ruling | Route | Moment |
|---|-------|--------|-------|--------|
| 1 | `=`-attached flag form (`--top-k=abc`) silently binds defaults even after Task 1.1 | Stays FROZEN (spec D10, ratified); End state 1/Purpose narrowed to space-separated form; residual is NAMED in the Intent, not waived in prose | in-artifact (`4453863`) | red-team round 0, 2026-07-27 |
| 2 | ADR 0028's verbatim WARN quote goes stale on the noun flip | Append-only dated amendment in Task 1.1 (never edit the historical quote); per-medium gate — NEW-present on the ADR, OLD-absent on live surfaces (plan-1 ADR 0037 precedent) | in-artifact (`4453863`) | red-team round 0, 2026-07-27 |
| 3 | Backstop 2's Gate-2 runner would regress Task 1.2's corrections and duplicate the archived tighten slug hot | In-run runner = Phase 1 servitor; **Lead MUST exclude the tighten slug (and any slug whose repo copy is archived) from this run's Gate-2 promotion selection** — fail-closed | in-artifact (`4453863`); Lead duty threaded to the run | red-team round 0, 2026-07-27 |
| 4 | Tighten lesson archived mid-campaign (PR #1167) broke Task 1.2's declared path | Edit in place at `docs/learnings/archive/…`; do NOT restore hot | in-artifact (`42d6912`) | campaign decompose gate, 2026-07-27 |
| 5 | Version literals | Phase 2 resolves the next free patch from the four slots at land tip (master shipped 0.14.64 via plan 1 ⇒ expect 0.14.65); plan/roadmap literals non-authoritative | standing (plan already states it) | red-team round 0, 2026-07-27 |

## Incident — sandbox escape (contained, diagnosed, state restored)

The post-run escape guard exited 1: the `ff-topology` probe built its synthetic fast-forward fixture **in the shared sandbox worktree** instead of a fresh temp repo — 5 commits on top of `42d6912` (incl. a deliberate `ROGUE2` detection-test mutation) plus working-tree edits. Self-confound gate run first (Lead actions since worktree creation were read-only ⇒ probe action). **Blast radius:** the disposable sandbox only — the real repo was clean (0 dirty files) and both remote tips unchanged. **Taint audit:** 5 probes (incl. both `pass` executed baselines) completed before the mutation window opened (16:25:51); every load-bearing round-0 finding rests on plan text or files the mutations never touched (mutations hit `war-memory.mjs`/`.test.mjs`/the cmdquery lesson; findings anchor on the plan, the roadmap, ADR 0028, and the tighten lesson). Sandbox `reset --hard` + `clean -fd` to `42d6912`; escape guard re-run **exit 0** before this verdict. `ff-topology` itself returned `pass` (0 findings): post-ff, `git diff --name-only <phase-base>..HEAD` and per-task ranges remain computable — End states 3/7 evidence anchors hold.

## Residual risk

- The `=`-attached flag form remains silent by ratified decision (D10) — named in the Intent; closing it requires a `parseArgv` change this plan forbids.
- Worker done-report evidence (End states 1, 5, 8 red-pre-fix claims; End state 4/9 surveys) stays SOFT at gate-audit per the recorded convention — accepted in Notes.
- Recursive `readdirSync` does not descend directory symlinks; unreadable subdirectory skips fail-open (both accepted, one line each, in Notes).
- The plan's no-mid-campaign-archive claim now holds only from this red-team forward (the 2026-07-27 sweep predates it; live-tree lint re-verified clean over all 145 archived files, 0 hits).
