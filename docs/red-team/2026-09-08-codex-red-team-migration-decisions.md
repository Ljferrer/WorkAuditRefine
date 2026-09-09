# Red Team decisions log — Codex red-team migration (2026-09-08, Claude Step-0 review)

Companion to `2026-09-08-codex-red-team-migration.md`. Records every open question the review raised, every option offered, and the operator's answer verbatim. Raw material lives in `evidence/2026-09-08-codex-red-team-migration/`.

## Models and effort

| Role | Model id | Effort | Source of setting | Count |
|---|---|---|---|---|
| Red Team Lead (this session) | `claude-fable-5-1` | session default, not pinned | Claude Code session | 1 |
| Analyzed probes and confirms | `claude-opus-5` (config alias `opus`) on agent type `Explore` | `high` | `.claude/war/config.json` → `agents.redteam` | 14 (9 probes + 5 confirms) |
| Executed probes and confirm | `claude-opus-5` on agent type `workflow-subagent` | `high` | same | 4 (3 probes + 1 confirm) |

Tool: work-audit-refine plugin 0.21.12, `skills/red-team`. Workflow run `wf_62a3d17d-07c`, 18 agents, 0 errors, 0 dropped, about 1.6M subagent tokens, 27 minutes. Gate: `red-team-gate.mjs --stdin --rounds=<n> --round-limit=3`.

## Factual findings patched without a question

1. Task 2 edited `SKILL.md`, `agents/openai.yaml`, `references/host.md` but never ran `red-team-structure.test.mjs`. Fix: test added to Task 2 Files and Done-when. Re-verified in a sandbox: with the test in the command, a mutated `openai.yaml` goes red (pass 6, fail 1).
2. New adapter test files and live-host skips joined no reviewed census. Fix: `scripts/ci/test-inventory.json` and `scripts/ci/baseline-skips.json` added to task Files, census duty stated in the Build order.

## Open questions, options offered, and answers

### Q1. End state 6: where does the judging seat run?
Finding: End state 6 is `HARD at audit_sha` with a "final Snipe plan-faithfulness seat", but no task schedules that seat, and the plan routes away from WAR dispatch. A mechanical floor (ledger exists, sections present, links resolve) is commandable and was not commanded.
Options offered:
- (a) Explicit `/snipe` in Task 3 plus a mechanical `check:` (recommended).
- (b) Re-tag End state 6 as backstop B3 with an operator runner and timing.
- (c) Keep wholly judged, record that no command guards the ledger.
Answer: "Explicit /snipe in Task 3 + mechanical check (Recommended)".
Patch: End state 6 gains a `check:` (ledger cases in `red-team-structure.test.mjs`) and names the `/snipe` seat at the Phase-3 audit_sha. Task 1 starts the ledger skeleton. Task 3 closes with the `/snipe` invocation.

### Q2. End state 5: the hypothesis regression clause
Finding: "a regression scenario derived from each chosen hypothesis" is checked only by structural and packaging tests. The plan itself says structural tests prove delivery, not comprehension.
Options offered:
- (a) Narrow End state 5 to delivery; route hypothesis confirmation to the End state 6 experiment table and B1 (recommended).
- (b) Require a deterministic behavior-proxy fixture with a failure control per hypothesis.
Answer: "Narrow to delivery; route hypotheses to ledger + B1 (Recommended)".
Patch: End state 5 text narrowed, routing sentence added.

### Q3. Touched-doc facts: guard, de-mirror, or defer?
Finding: the Validation interpretation stated the trichotomy generically and picked no branch per fact. Uncovered facts: package identity and invocation, profile catalog, artifact version, package digest, diagnostic command.
Options offered:
- (a) Guard identity, invocation and catalog by extraction and equality in `package-red-team.test.mjs`; de-mirror version and digest to the receipt (recommended).
- (b) Guard every fact.
- (c) Defer all through a new backstop row.
Answer: "Guard identity/invocation/catalog; de-mirror version/digest (Recommended)".
Patch: Validation interpretation rewritten with named choices; Task 2 slice carries the same duty.

### Q4. B1: report filename clause
Finding: B1 deferred "the date/slug report filename must not cause one host's output to overwrite the other". That is a design choice ownable now, so B1 was over-broad.
Options offered:
- (a) Move naming into Task 1 with a structural assertion (host segment in the path) (recommended).
- (b) Keep procedural separation: each host writes on its own branch, no filename change.
Answer: "Keep procedural separation in B1".
Patch: B1 now states branch separation is the mechanism and no filename change is required.

### Q5. #2097 snapshot location
Finding: the Evidence row cited `docs/port/red-team-research/2026-09-08-issue-2097.json`, which exists on no ref, in no history, and nowhere in the worktree.
Options offered:
- (a) Out-of-repo local artifact; implementers re-fetch with `gh issue view 2097 --comments` (recommended).
- (b) Commit it to `codex-port`.
- (c) Drop the snapshot claim.
Answer (verbatim): "The snapshot is intentionally untracked, outside the review branches. It exists at /Users/ljf/GitHub/WorkAuditRefine/docs/port/red-team-research/2026-09-08-issue-2097.json. Read that preserved snapshot if accessible; otherwise report the access gap. A fresh issue fetch is additional evidence, not necessarily identical to the original snapshot."
Lead check: file readable, 148,970 bytes, 13 comments, issue 2097, SHA-256 `b0f8f558f764e37f97f5266802cd34e9fea1e2f794b21e218e18fabcb026124c`. The sidecar `2026-09-08-issue-2097.metadata.json` beside it records the same SHA-256 and comment count.
Patch: Evidence row names the absolute path, hash, comment count, the read-or-record-gap rule, and the fresh-fetch caveat.

### Q6. Phase-2 completion SHA referent
Finding: the receipt is inside the Phase-2 tree, and a commit cannot carry its own SHA.
Options offered:
- (a) Receipt records the receipt commit's parent; the receipt commit's SHA goes to the handoff and ledger (recommended).
- (b) Amend the receipt commit after the fact.
Answer (verbatim): "Use the recommended approach. Routine bookkeeping choices are within implementer latitude; clarify the plan without asking me to choose unless there's a meaningful consequence for my requirements."
Patch: Task 2 receipt bullet rewritten per (a).

### Q7. `/war --afk` crosses the Phase-2 checkpoint
Finding: `/war`'s only inter-phase halt is the interactive `## Checkpoint (between phases)` wait. Under `--afk` it posts and proceeds, so a WAR `--afk` dispatch would run Phase 3 without the required first installed Codex attempt.
Options offered:
- (a) Name the checkpoint and forbid `--afk`; WAR runs Phases 1–2 only (recommended).
- (b) Split Phase 3 into its own plan file.
Answer (verbatim): "I'm going to implement it in Codex, which doesn't have war yet. I'll instruct it to stop after finishing phase 2".
Patch: Build order states the Codex implementation with an explicit stop after Phase 2, and that `/war`, if ever used, runs Phases 1–2 only and never `--afk`.

## Suggestions not taken
- Q4 option (a), a host segment in the Codex report filename with a structural assertion. The operator chose branch separation instead.
- Q7 option (b), a separate Phase-3 plan file. Not needed because the implementer is instructed to stop.

## Process notes
- Raw probe results and the first gate output were saved to `evidence/` before any plan patch.
- Escape guard reported one moved ref, `war/2026-09-06-engine-and-audit-verdict-integrity/p13-13.1`. A concurrent `/war` campaign committed it in its own worktree during the run. Foreign, not an escape.
- Transcripts under `evidence/.../transcripts/`: the Lead session JSONL and the 18 subagent JSONLs plus the workflow journal. The operator email and any token-shaped strings were redacted before commit.
