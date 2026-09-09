# Red Team — Codex red-team: local experimental port with observable verification (2026-09-08)
**Verdict:** ADJUDICATED — initial gate BLOCKED (8 blocker rows / 9 needsDecision rows, 7 distinct roots); 2 factual roots patched (1 Lead re-verified in a sandbox), 5 roots ruled by the operator and patched; every row Lead-stamped `adjudicated: true`, no probe re-dispatch; `routeUpstream: false`.
**Rounds:** 1
<!-- Cumulative grill sweeps: the Step-1 seed + this run's sweeps. Strict form — the next run's seeding re-reads exactly this line; an integer, nothing else. -->

## Run header
- Host: Claude (Step-0 independent review per `docs/red-team-comparison/REVIEW.md`). Lead model: claude-fable-5-1. Probe/confirm model: opus / effort high (from `.claude/war/config.json` `agents.redteam`).
- Tool identity: work-audit-refine plugin 0.21.12 (`skills/red-team`); scaffold and gate byte-identical to the repo copies at HEAD.
- Target: branch `codex/red-team-review-claude`, HEAD `5061033b9fcd9d1d4c2f160b70ce39859d1a020e`, parent = frozen baseline `9bc8f676fac1794838f556ed74f2c0d1a9b7bac5` (`origin/codex-port`). Working tree clean at launch.
- Original plan SHA-256: `159b6de7bcfb7075e7ffd5c4bc5f133ef84a3a5276f5cde5a731b4f990f73b57` (matches REVIEW.md and the byte-identical blob on `codex/red-team-review-codex`). The original blob survives in commit `5061033b`.
- artifactKind: `impl-plan`. Source of truth: merged arm (Part 1). Prior-report seed: 0 (no prior report). Round limit: 3 (`run.redteamRoundLimit`). Provision: `[]` (no `.war-provision.json`, no submodules). `Explore` present; no analyzed-agent fallback engaged.
- Raw evidence, preserved before any patch: `docs/red-team/evidence/2026-09-08-codex-red-team-migration/workflow-output.json` (12 post-confirmation probe results), `gate-initial.json` (first gate output, `--rounds=0 --round-limit=3`, verdict BLOCKED), `escape-guard.txt`. Post-adjudication: `gate-adjudicated.json` (`--rounds=1 --round-limit=3`, verdict ADJUDICATED).
- Workflow run `wf_62a3d17d-07c`: 18 agents (12 probes + 6 adversarial confirms), 0 errors, 0 dropped, ~1.6M subagent tokens, 27 min.
- Disclosure: none. This review ran with no implementation ledger and no Codex findings in context.

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source (merged arm + per-issue evidence join), consistency-placeholders, dependency-feasibility, intent-vs-plan. Bespoke: acceptance-gate-claims (executed), adapter-baseline-repro (executed), construct-anchor-check, drift-guard-doctrine, backstop-legitimacy-judge, war-dispatch-checkpoint (analyzed). Executed in sandbox: executable-proof, acceptance-gate-claims, adapter-baseline-repro.
Lead-run doctrine probes: `unguarded-new-mirror` vacuous (no task touches `workflow-template.js`); `default-flip-old-absent` vacuous (no default-flip task); `guard-split-deps-edge` vacuous (one task per phase); `touched-doc-fact-coverage` delegated to drift-guard-doctrine (finding below). `ff-topology` not triggered (no merge-topology anchor by token or by prose read).
Fallback: none (all analyzed probes ran on Explore).
Coverage: expected 12, onTarget 12, offTarget [], dropped [].

## Executed proof
- `node --test 'adapters/codex/**/*.test.mjs'` at HEAD in an isolated clone → 113 tests, 108 pass, 0 fail, 5 skipped (live-host opt-ins). Baseline green.
- Snipe package builder (`adapters/codex/package-snipe.mjs`) builds into a temp dir and the built package passes its inventory check after relocation → the Task 2 pattern exists.
- `snipe-actual-host.test.mjs` and `planning-actual-host.test.mjs` run offline cases with a fake executable when live calls are disabled → the Task 2 "always-on offline cases" pattern exists.
- `overrides.testPattern: 'skills/*.test.mjs adapters/codex/*.test.mjs'` passes `war-config.mjs --fill-defaults`; `resolveGate` composes the declared two-glob gate; `assert-test-in-diff.sh` default discovery routes an adapter-only test diff to `no-test` (exit 1) and passes with the override; `assert-packaging-in-diff.sh` is Docker-COPY only → all four Build-order claims hold.
- Regression demonstration for the Task 2 gap, on the Snipe sibling: flipping `allow_implicit_invocation: false → true` in `agents/openai.yaml` leaves `package-snipe.test.mjs` green (3/3) while `snipe-structure.test.mjs` goes red.
- Lead re-verification after the patch (fresh clone, same mutation): `node --test adapters/codex/package-snipe.test.mjs adapters/codex/skills/snipe/snipe-structure.test.mjs` → pass 6, fail 1. The patched Task-2-shaped command now detects the instruction-surface regression.
- #2097 snapshot: readable at `/Users/ljf/GitHub/WorkAuditRefine/docs/port/red-team-research/2026-09-08-issue-2097.json` (untracked root checkout), SHA-256 `b0f8f558f764e37f97f5266802cd34e9fea1e2f794b21e218e18fabcb026124c`, 13 comments, issue 2097. No separate checksum file beside it.
- Escape guard: pre-run snapshot exit 0; post-run `--baseline` exit 1 with one moved ref `refs/heads/war/2026-09-06-engine-and-audit-verdict-integrity/p13-13.1`. Provenance: foreign (a concurrent `/war` campaign committing in its own `.claude/war-worktrees/.../p13-13.1` at 18:42, 19:00, 19:01 per reflog); working tree porcelain-clean; no probe-authored residue. Recorded, not an escape.

## Findings
### Major (patched in place, factual)
- [Major] Task 2 edits `SKILL.md`, `agents/openai.yaml`, `references/host.md` but neither its Files nor its Done-when included `red-team-structure.test.mjs`, so End state 5's own guard never ran before the mandatory Phase-2 stop (five probes converged). Evidence: Snipe sibling regression above. Resolution: test added to Task 2 Files and Done-when; Lead re-verified.
- [Major] The repo carries a reviewed test census (`scripts/ci/test-inventory.json`, exact-match refusal in `scripts/ci/collect.mjs`) and an approved-skip census (`scripts/ci/baseline-skips.json`); five new adapter test files and the new live-host skips were named in no task. Resolution: census files added to Task 1/2/3 Files plus a census-duty paragraph in the Build order.

### Major / Minor (operator-ruled, patched, adjudicated)
- [Major] End state 6 (`HARD at audit_sha`, "final Snipe plan-faithfulness seat") scheduled no seat and no command guarded the commandable floor. Resolution: Task 3 closes with an explicit `/snipe` invocation pinning a plan-faithfulness seat at the Phase-3 audit_sha; End state 6 gains a `check:` (ledger cases in `red-team-structure.test.mjs`: pinned path, enumerated sections, experiment table with one disposition per hypothesis, resolving relative links); Task 1 starts the ledger skeleton those cases guard.
- [Major] End state 5's "regression scenario derived from each chosen hypothesis" was checked only by structural tests the plan itself calls non-probative for behavior. Resolution: End state 5 narrowed to delivery/packaging; hypothesis confirmation routed to End state 6's experiment table and B1.
- [Major] touched-doc-fact-coverage: the trichotomy was stated generically with no per-fact choice. Resolution: guard package identity, qualified invocation and profile catalog by extraction and equality in `package-red-team.test.mjs`; de-mirror artifact version and package digest to the receipt beside their reproducing command. Recorded in Validation interpretation and the Task 2 slice.
- [Major] B1 deferred host-distinct report filenames, a design choice ownable now. Resolution: operator keeps procedural separation; B1 now states branch separation is the mechanism and no filename change is required. The deferral clause is gone, so B1 is no longer over-broad.
- [Minor] Evidence row for #2097 cited a repo-relative path that exists on no ref. Resolution: row now names the absolute untracked location, its SHA-256 and comment count, the read-or-record-gap rule, and that a fresh fetch is additional evidence, not the snapshot.
- [Minor] "Record the Phase-2 completion SHA" inside the Phase-2 tree was self-referential. Resolution: receipt records the last implementation commit (receipt commit's parent) plus digest; the receipt commit's own SHA goes to the handoff and ledger.
- [Minor] `/war --afk` would cross the PIN-15 checkpoint. Resolution: Build order states the operator implements in Codex with an explicit stop after Phase 2, and `/war`, if ever used, runs Phases 1–2 only and never `--afk`, naming the interactive checkpoint wait as the sole halt.

## Resolutions applied (grill decisions)
- Task 2 structure-test omission → patch → Task 2 Files, Task 2 Done-when.
- Test census omission → patch → Build order paragraph, Tasks 1–3 Files.
- End state 6 judging seat → explicit `/snipe` in Task 3 + mechanical `check:` → End state 6, Task 1 ledger bullet, Task 3 ledger bullet.
- End state 5 regression clause → narrow to delivery, route hypotheses → End state 5.
- Touched-doc facts → guard identity/invocation/catalog, de-mirror version/digest → Validation interpretation, Task 2 slice.
- B1 filename clause → keep procedural separation → B1.
- #2097 snapshot location → absolute untracked path + hash → Evidence table.
- Phase-2 SHA referent → parent commit in receipt, receipt SHA in handoff → Task 2 slice.
- WAR `--afk` → Codex implementation with explicit stop, `/war` Phases 1–2 only, never `--afk` → Build order.

## Adjudications
<!-- Machine-readable: the WAR Lead reads these rows and threads them into the auditor prompts (auditPrompt() and the gate-audit seats). Version precedence: task instruction > red-team adjudication > plan body literal. Each row carries its own provenance token. -->
- Explicit `/snipe` plan-faithfulness seat at the Phase-3 audit_sha, plus ledger `check:` in `red-team-structure.test.mjs` supersedes the unscheduled "final Snipe plan-faithfulness seat" — End state 6 — operator-ratified (2026-09-08)
- End state 5 = delivery/packaging only supersedes "including a regression scenario derived from each chosen hypothesis" — End state 5 — operator-ratified (2026-09-08)
- Guard identity/invocation/catalog in `package-red-team.test.mjs`; de-mirror version/digest to the receipt supersedes the generic guard/de-mirror/backstop sentence — Validation interpretation — operator-ratified (2026-09-08)
- Branch separation is the report-collision mechanism, no filename change supersedes "the date/slug report filename must not cause one host's output to overwrite the other" — B1 — operator-ratified (2026-09-08)
- `/Users/ljf/GitHub/WorkAuditRefine/docs/port/red-team-research/2026-09-08-issue-2097.json` (untracked, SHA-256 `b0f8f558…124c`) supersedes the repo-relative `docs/port/red-team-research/2026-09-08-issue-2097.json` — Evidence table — operator-ratified (2026-09-08)
- Receipt records the receipt commit's parent SHA; the receipt commit's SHA goes to the handoff and ledger supersedes "Record the Phase-2 completion SHA" — Task 2 — operator-ratified (2026-09-08), referent choice delegated to the Lead as routine bookkeeping
- Codex implementation with an explicit stop after Phase 2; `/war` Phases 1–2 only, never `--afk` supersedes the unqualified WAR-dispatch contingency — Build order — operator-ratified (2026-09-08)

## Residual risk
- No probe was re-dispatched after the patches; the Lead re-verified only the Task 2 acceptance gap in a sandbox. The other rows are adjudicated on operator rulings and the patch text.
- Open-issue counts in the Evidence table (232 open / 186 war-followup) are time-qualified; at review time 238 / 193. Not a defect.
- The #2097 snapshot has no checksum sidecar; the SHA-256 recorded here is this review's measurement.
- A concurrent `/war` campaign shares this repository's ref store; the guard reported one foreign ref move (recorded above).
