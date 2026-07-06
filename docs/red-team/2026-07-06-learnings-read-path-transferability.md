# Red Team — Learnings read-path & transferability (2026-07-06)

**Verdict:** CLEARED-WITH-NOTES — the keystone mechanism was proven in a sandbox; the gate's sole blocker was refuted by direct check; two genuinely-missing pieces were fixed; both deferred decisions were grilled and ratified; the patched plan re-verified clean. One cosmetic note remains.

## Attack surface
Spine (4 of 6 — `coverage-vs-source` dropped: no source spec; `executable-proof` dropped: no runnable code/test blocks shipped): `claims-vs-reality`, `consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan`. Bespoke: `repo-flag-feasibility` (executed), `anchor-fidelity` (analyzed), `open-decisions` (analyzed). Executed in a throwaway repo copy: `repo-flag-feasibility`.

## Executed proof
- **`repo-flag-feasibility` → PASS** (Node v24.17.0, throwaway `cp -R` copy): `render-index --local <tmp> --repo <tmp>` writes **only** the local `MEMORY.md` and surfaces repo-root files as rows bearing the trailing `[repo]` marker; `query … --repo` returns a repo-sourced hit (both roots searched); both `render-index` and `query` **fail open** (exit 0, no crash) on a non-existent `--repo`. The plan's foundational assumption — that `--repo` is a real, wired flag and `walkCorpus` skips absent roots — is confirmed.

## Findings
### Major
- **[gate blocker — REFUTED by Lead]** `anchor-fidelity`: *"no prose-gate test suite exists for `skills/war/SKILL.md`."* False. [war-config.test.mjs:708](../../skills/war/assets/war-config.test.mjs) (`doc-contract:` tests calling `readDoc('skills/war/SKILL.md')`) and [war-pipeline-structure.test.sh:22](../../skills/war-machine/war-pipeline-structure.test.sh) both grep that file. The round-1 haiku probe and its confirmer both missed them. **Resolution:** named `war-config.test.mjs` as Task 2's explicit test home (kills the "self-discover" ambiguity).
- **[verified real]** Task 3's test home genuinely absent: no `*.test.*` greps the prose of `skills/lessons-learned/SKILL.md` (`safe-swap.test.sh` guards the shell script, not the doc). "Extend the existing suite" had no referent. **Resolution:** Task 3 now **creates** `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`.
- **[verified real]** False claim *"the migrate/evict modes already pass `--repo`."* Migrate's final render **does** ([migration.md:139](../../skills/lessons-learned/references/migration.md)); the **evict** re-render ([migration.md:178](../../skills/lessons-learned/references/migration.md)) deliberately does **not** — eviction abandons the repo root and must drop `[repo]` markers. Task 3's blanket "every render-index gains `--repo`" would regress eviction. **Resolution:** Task 3 clause 2 rewritten — Phase 5 gains `--repo`, migrate already has it, evict stays local-only by design.

### needsDecision (grilled → ratified by operator)
- **CLAUDE.md pointer wording** (Tasks 2/3/4 must emit byte-identical) → operator **approved** the recommended path-agnostic line (must be path-agnostic: it lands in consumer repos where `war-memory.mjs` is not at `skills/_shared/`); Task 4 may append one repo-specific retrieval sentence. Recorded verbatim in the plan's *Resolved by /red-team* section.
- **Setup seed when `memory.retrieval: false`** but repo root exists → operator: **YES** (seeding is a render, not a retrieval; serves non-WAR sessions). Wired into Task 2 clause 1; skipped only when the Node probe reports memory unavailable.
- **Shared name for the seed render** (Task 2 ↔ Task 3 ambiguity) → resolved: named the *Setup seed render* in Task 2; Task 3 Phase 0 references the identical flag set.
- **Task 1 "contradiction"** (line 26) → adjudicated **not a defect** — the no-`--repo` form is the deliberate absent-root branch (byte-identical to today). Clarifying clause added.

### Minor
- `intent-vs-plan`: End-state condition 3 mixes the trigger precondition and the operation in one clause. **Accepted as-is** — it resolves unambiguously from Method (line 6) and Tasks 2/3.

## Resolutions applied
| Finding | Resolution | Plan ref |
|---|---|---|
| war/SKILL.md test home "missing" (refuted) | Named `war-config.test.mjs` as the home | Task 2 Files + Mapped tests |
| lessons-learned/SKILL.md test home truly missing | Create a new `doc-contract` test | Task 3 Files + Mapped tests |
| migrate/evict `--repo` false claim | Phase-5 gains `--repo`; migrate already has it; evict stays local-only | Task 3 clause 2 |
| Pointer wording undecided | Ratified verbatim line | *Resolved by /red-team* §1; Tasks 2/3/4 reference it |
| Seed on `retrieval:false` undecided | YES | *Resolved by /red-team* §2; Task 2 clause 1 |
| Seed-render name ambiguity | Named *Setup seed render* | Task 2 clause 1 + Task 3 clause 1 |
| Task 1 "contradiction" | Clarified as deliberate conditional | Task 1 plan slice |

## Re-verify
Re-ran the 3 probes that had findings (`consistency-placeholders`, `anchor-fidelity`, `open-decisions`) against the patched plan → **all PASS, findings empty** (gate: **CLEARED**, 3/3 on-target, 0 off-target, 0 dropped). The 4 round-1 clean passes are unaffected by the doc-only patch.

## Residual risk
- One cosmetic Minor (end-state condition 3 phrasing) — accepted.
- Round-1 `anchor-fidelity` ran on a haiku Explore agent that missed `war-config.test.mjs`; the Lead's direct grep is the authority. Naming the test home in the plan removes the ambiguity for the implementing worker.
- Release baseline **0.14.4** is a literal (master @ 0.14.3) — re-verify the next free patch against the landed integration tip at execution time.

**Terminal verdict: CLEARED-WITH-NOTES — ready for `/war`.**
