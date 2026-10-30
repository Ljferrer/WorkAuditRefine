# Red Team — Memory query MCP tool (2026-10-27)
**Verdict:** ADJUDICATED — every blocker and needsDecision is patched and operator-ruled; no probe re-ran on the patches.
**Rounds:** 1

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source (merged arm, the plan is its own source), consistency-placeholders, dependency-feasibility, intent-vs-plan. Bespoke: baseline-repro (executed), budget-headroom (executed), default-flip-old-absent (executed), hook-matrix (analyzed). Lead-run: the four drift-guard spine probes and the backstop-legitimacy check.
Artifact kind: impl-plan. Probes: 10 of 10 on target, 0 dropped. Model: opus, effort high (from `agents.redteam`).
Fallback: none.

## Executed proof
- `war-memory.mjs` exits the process at import when `node:sqlite` is missing (module-level `try { await import('node:sqlite') } … process.exit(1)`), so a server that imports it can never return `memory disabled`.
- `node --test` on a missing test file exits 0, and with `--test-name-pattern` matching nothing it still reports `ℹ pass 1` (the file counts as one test). The plan's original checks were vacuous on both counts.
- The worker's self-query line is pinned on both surfaces by `workflow-template.test.mjs`, so removing it from the template alone goes red.
- `version-slots.test.mjs` also requires a `CHANGELOG.md` entry, which the release task omitted.
- Every rewritten End-state check was re-executed at base `29f62da0` and is red: ES1–4, ES5, ES6, ES8, ES9 exit 1, and ES7 prints `0`.

## Findings
### Major
- [Major] The server "reuses" `war-memory.mjs` and "never exits" → importing that module exits on Node < 24. Resolution: Task 1.1 probes `node:sqlite` first and imports `war-memory.mjs` only after it succeeds; End state 4 proves the same process answers a following request.
- [Major] "Only this tool" for the evidence auditor and worker would strip their REA allowlist → the tool is added beside REA for those two roles. Resolution: new D10; End state 5 asserts REA still passes.
- [Major] The worker card's Bash self-query sentence had no edit, and End state 6 said "four cards" while the test excepted the worker. Resolution: Task 1.3 rewrites the worker card sentence to the tool and rewrites the two named tests; End state 6 covers three `tools:` lines, the worker card body and the template, with the old sentence absent.
- [Major] An in-run raise of the auditor hard line contradicts ADR 0048 and needs the exact `Budget-Raise:` trailer. Resolution: the operator's Q6 answer is recorded as the ADR 0048 gate; Task 1.3 requires the trailer.
- [Major] The Purpose said "every WAR seat" while the refiner stays excluded. Resolution: the Purpose names the four seats; D7 is user-confirmed.
- [Major] Seats choose `local`, and the server would `mkdir -p` there. Resolution: the hook denies a `local` outside `*/.claude/projects/*/memory` or with `..`; the server appends only into an existing directory.
- [Major] No End state proved the registration or the prompt threading. Resolution: new End states 8 (`plugin.json` registration) and 9 (seat prompt lines).
- [Major] Tasks 1.2 and 1.3 copied the A1 tool name with no edge onto Task 1.1's live check. Resolution: Task 1.2 `deps: [1.1]` and takes the observed name.
- [Major] Task 2.1 omitted `CHANGELOG.md`. Resolution: added, with the entry rule.
- [Major] Vacuous checks (missing file, name pattern). Resolution: every new-test check runs `test -f` and greps the named test's TAP `ok` line.
### Minor
- Dupe precedence unspecified → D3 now states it: hot beats archived, repo beats local, `(archived)` only when every copy is archived (operator-ruled).
- Backstop over-broad (claimed A1–A4) → narrowed to A3 and A4; Task 1.1 covers A1 and A2.
- Auto-fixed: dropped the needless set-equality exemption; Task 1.3 and 1.4 Done-when commands gain the census, link-integrity and budget tests; pointer shape per ADR 0047; one tool signature with `topK`; exact full-name hook compare; End state 3 forbids a cwd-derived root; End state 7 grep made case-insensitive; A4 basis corrected; `skills/war/SKILL.md` Setup clause added to Task 1.4; `CONTEXT.md` term capped at 600 B.

## Resolutions applied (grill decisions)
- Worker card self-query sentence → rewrite to the tool → Task 1.3, End state 6.
- Auditor hard-line raise → the Q6 answer is the ADR 0048 operator gate, with the exact trailer → D5, Task 1.3, Notes.
- Purpose scope → the four named seats; refiner exclusion confirmed → Purpose, D7, title.
- Query-log fence → hook anchor on `local` plus no mkdir → D4, Task 1.1, Task 1.2, End states 3 and 5.
- Dupe precedence → hot wins, then repo → D3, End state 2.

## Adjudications
- The auditor card hard line may rise by at most 1,024 B in-run, only with the trailer `Budget-Raise: ADR-0042 agents/war-auditor.md +<bytes>` — supersedes "citing ADR 0042's justification rule in the commit body" — Task 1.3 / D5 — operator-ratified (2026-10-27)

## Residual risk
- A1 (the tool's full name) and A2 (`${CLAUDE_PLUGIN_ROOT}` expansion in `plugin.json` `mcpServers`) stay unverified until Task 1.1's live listing; Task 1.2 waits on it.
- A3 and A4 (subagent reach) stay on the backstop until the first post-release run.
- `docs/learnings/` lessons that restate the hook's role table are in no task; the next servitor or `/lessons-learned` pass updates them.
- `hooks/validate-worktree-scope.test.sh` and other comments that describe the servitor's tool set may go stale; no test reads them.
- Round 1 raised 14 needsDecision findings, above the advisory fast-fail line of 3. All five distinct decisions settled in one grill, so the plan did not route upstream.

## Escape guard
- The post-run guard exited 2: a probe used the Lead's scratch folder as its sandbox, cloned the repo into it, and deleted the snapshot file and the scaffold copy. That is outside the repo, but it left the guard without a baseline.
- Manual check of the real repo instead: the working tree was clean; the only refs moved in the run window were this plan's branch (Lead commits) and the `fingerprint-hook-followups` WAR run's branches; the only new ignored files were `.claude/war/audit-fingerprints/*` entries naming that run's `_refinery`. Those deltas are foreign. No probe-authored delta was found.
- Hypothesis, not promoted: the probe chose the scratch folder because the scaffold copy sat there. Next run, keep the scaffold copy and snapshot in a separate directory from any path a probe might pick.
