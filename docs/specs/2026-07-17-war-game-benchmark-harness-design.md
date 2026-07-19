# WAR//GAME benchmark harness — an autonomous match runner that pits WAR-at-defaults against raw Fable on sealed long-horizon task packs

Date: 2026-07-17
Status: draft — awaiting conversion

## 1. Context — the gap / problem

WAR's claim is verification discipline you can reproduce: audits as the product, plans not vibes, runs that compound. The claim has receipts (the 2026-06-25→26 overnight, the 2026-07-16→17 scheduled campaign) but no *controlled comparison* — every number is single-arm. Meanwhile the strongest available raw model (fable) ships in our own default config as the fix seat; the obvious skeptic's question is unanswered: **would raw Fable alone, in the same harness, do as well or better than the whole machine?**

The operator-held methodology document (WAR//GAME design v1, 2026-07-17, in the operator's `Documents/WAR/`) pre-registers the experiment: two arms (W = Claude Code + this plugin at stock `DEFAULTS`, no config file; F = same Claude Code, no plugin, model `claude-fable-5`), sealed purpose-built task packs in three human-hour tiers (T1 sortie 4–8 h, T2 operation 2–3 days, T3 campaign 1–2 wk of five dependent milestones), execution-based grading against hidden acceptance suites, paired statistics, pass^3 reliability, METR-style horizon curve. What does not exist is the **harness**: the thing that runs matches unattended, grades them, and writes down what happened without fabricating a number. That is what this spec resolves.

The harness cannot live in this repo or any repo an arm container can reach: task packs carry hidden suites and sealed reference solutions, and Arm W runs *this plugin* — a workspace that can see its own grader is a leaked answer key. So this spec authors the design here (where the machine reads specs), but every artifact it describes lands in a **new private sibling repo, `war-game`**, and the per-task `Files:` targets of the eventual plan carry `target repo: war-game` throughout.

## 2. Pivotal constraints

- **Firewall is load-bearing.** `hidden/` (suites, reference solutions, rubrics) is never mounted into an arm container; arm egress is an allowlist (model API, scratch GitHub org, package registries). Grading happens after workspace freeze, in a separate grader container. Any breach voids the match, recorded as `void:leak`.
- **Parity is the experiment.** One variable differs between arms: the plugin. Same image digest, same Claude Code version, same ceilings, same stall watchdog (20 min quiet → one fixed nudge, max 3), same `DONE.md` done-contract, same PRD-voiced task materials with zero WAR vocabulary. Arm W runs bare `DEFAULTS` — the runner must fail loudly if a `.claude/war/config.json` exists in a W workspace.
- **Telemetry honesty is inherited, verbatim, from `/war-review` doctrine:** never fabricate a number; any metric whose source is absent or unparseable renders `n/a`, each metric degrading independently; token counts are best-effort harness reads, not billing truth.
- **Autonomy end-to-end.** A queued match set runs overnight with zero operator involvement: scripted ratification stub (fixed accept-defaults policy, every answer logged), hard escalations end the match and are graded as-is (halt-and-hold is a result, not an error), results append to a single ledger via atomic temp+rename (campaign-ledger discipline, not its code).
- **Pins or it didn't happen.** Every match manifest records: plugin version + commit SHA (or `absent`), Claude Code version, model IDs per seat, image digest, task-pack SHA, mode (`cold`|`hot`). Version literals in prose stay unpinned ("0.14.x"); manifests carry the real SHAs.
- **Pack validity is fail-closed.** A task pack is runnable only after `pack-validate` proves: hidden suite fails on the skeleton (fail2pass), passes on the sealed reference (pass2pass), weights sum to 1, ceilings present, and — for T3 — each milestone's suite actually imports the prior milestone's surface (the dependency is real, not narrated).

## 3. Resolved design

A `war-game` repo with four executable surfaces and two document surfaces:

1. **`packs/`** — task packs (`spec/`, `skeleton/`, `hidden/`, `pack.json`). Authored in firewalled generator sessions (memory off, transcripts sealed); red-teamed as packs (ambiguity, implementation-choice-encoding tests, fake dependencies) before acceptance.
2. **`runner/`** — the match loop: provision fresh container from pinned digest → push skeleton to scratch org → launch the arm headless with its frozen driver prompt → watchdog/ceilings/stub → stop on `DONE.md` | ledger-drained (W) | ceiling | hard escalation → freeze workspace snapshot → hand off to grader → emit manifest → append results ledger. Match order interleaves arms (W,F,W,F,…) so provider drift distributes evenly.
3. **`grader/`** — clean-clone scoring in its own container: hidden suite per milestone at final tip; (T3) per-milestone at its landing SHA where recoverable, else `n/a`; milestone-integrity regression check (milestone i at final tip vs at landing); declared-gate check with the 50%-cap rule; JSON out. Agent-authored tests never score.
4. **`report/`** — reads the results ledger, renders the pre-registered metric battery (completion, horizon logistic + 50% point with bootstrap CI, pass^3, milestone survival, $/completed-milestone, nudge/compaction counts) with **no filter argument** — every match renders or the report says why (`void:*` rows shown, never dropped).
5. **`PROTOCOL.md`** — the frozen pre-registration (hypotheses H1–H4, decision rule, ceilings T1 6 h/8M · T2 16 h/30M · T3 48 h/80M tokens, driver prompts verbatim) — amended only by dated appendix, never edited in place.
6. **`manifest-schema.json`** — the match manifest contract; `report/` and `grader/` both validate against it, fail-closed.

## 4. Mechanics

- **Match identity:** `(packSha, arm, trial, mode)`; `matchId` = `<tier>-<pack-slug>-<arm>-trial<N>`. Cold mode (primary): fresh memory root per match, `commitLearnings` untouched (default false). Hot mode (phase 2): memory persists across a declared match sequence; Arm F gets a persistent `NOTES/` directory for parity.
- **Arm W driver:** T1/T2 — `/war-strategy` convert provided spec → `/red-team <plan>` → `/war <plan> --afk`; T3 — `/war-machine --afk` over the provided specs → `/war-campaign <roadmap>`. The runner invokes commands; it never edits plugin behavior.
- **Arm F driver:** the frozen PROTOCOL.md prompt — implement `spec/` completely, work autonomously, write `DONE.md` when done; explicit permission to plan/decompose/spawn subagents/use worktrees.
- **Stop conditions and their `endReason` enum:** `done`, `ceiling:wall`, `ceiling:tokens`, `hard-escalation`, `abandoned` (arm exits without `DONE.md` and off-ramps the watchdog's nudge budget), `void:leak`, `void:harness`. Enum is canonical in one module; grader and report import it, never restate it.
- **Grading cap rule:** red declared-gate at final tip caps task completion at 50% of measured — shipping broken is a result.
- **Results ledger:** append-only JSONL, atomic temp+rename per row, one row per match manifest.

## 5. Surface changes

- **This repo (WorkAuditRefine): this spec file only.** No skill, hook, agent, or engine change. The plugin is the *subject* of the experiment; the experiment must not alter it. Any WAR defect the harness exposes routes through the normal loop (issue → survey-corps), never patched from `war-game`.
- **New repo `war-game` (private):** everything in §3. Node ≥ 24, stdlib-only where feasible (campaign-ledger discipline); container tooling for runner/grader isolation.
- **Scratch GitHub org:** disposable remotes for arm pushes/PR stacks; wiped between trials by the runner (aftermath-style: evidence first, `git ls-remote` truth, then delete).

## 6. Validation criteria

1. `pack-validate` rejects a pack whose hidden suite passes on the skeleton, and accepts it once the suite fails-on-skeleton and passes-on-reference — demonstrated with a deliberately broken fixture pack and a good one.
2. A W workspace containing a stray `.claude/war/config.json` refuses to launch, loudly, before any tokens burn.
3. A full Skirmish match (one T1 pack, both arms, one trial) runs end-to-end with zero operator input: both manifests validate against `manifest-schema.json`, the results ledger gains exactly two rows, and the report renders both.
4. Grader determinism: grading the same frozen workspace twice yields byte-identical grade JSON.
5. Telemetry honesty: deleting a transcript file from a frozen workspace and re-grading renders that manifest's `tokens` as `n/a` while every other field survives.
6. Hidden-suite unreachability: from inside an arm container, every route to `war-game` (clone URL, raw fetch) fails; the probe is a scripted check in the runner's preflight, not a promise.
7. Ledger atomicity: kill -9 the runner mid-append; the ledger parses clean with the prior row count.
8. The report script contains no mechanism to exclude a match (inspection + a test that a `void:*` row still renders).

## 7. Non-goals

- No leaderboard, no public benchmark release in v1 — packs stay sealed so they stay reusable.
- No harness support for third-party agent scaffolds in v1; the 2×2 ablation (W-fable, F-opus) is config, not new machinery.
- No LLM-judge quality panel in v1 (phase 2; primary metric is execution-based).
- The harness never repairs, resumes, or coaches an arm beyond the fixed nudge — a dead run is data.
