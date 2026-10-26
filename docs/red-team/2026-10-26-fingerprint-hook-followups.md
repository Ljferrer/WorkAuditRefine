# Red Team — Audit tree fingerprint hook follow-ups (2026-10-26)
**Verdict:** ADJUDICATED — every blocker is patched in the plan; the last two (the README OLD-absent oracle) were re-verified by the Lead in a sandbox release, not by a probe re-run.
**Rounds:** 2

Plan: `docs/plans/2026-10-26-fingerprint-hook-followups.md` (merged arm: the plan is its own source of truth). Artifact kind: `impl-plan`. Probe model: opus, effort high (from `agents.redteam`). Round limit: 3 (default). Provision: none (no `.war-provision.json`, empty structural fallback).

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility, intent-vs-plan. Bespoke: `default-flip-old-absent` (executed), `ripgrep-probe-replay` (executed), `git-behavior-replay` (executed), `prototype-compose` (executed), `fixture-nested-worktree` (analyzed). Executed in sandbox: executable-proof and the four executed bespoke probes. Lead-run: the four drift-guard spine probes, the backstop-legitimacy check and the `judge:`-tag grading.
Fallback: none (every analyzed probe ran on `Explore`).

Coverage: 11 of 11 probes on target in both rounds, none dropped.

## Executed proof
- Round 1: the ripgrep probe replayed on the Claude Code 2.1.311 embedded ripgrep. Every Context claim reproduced. The parent-of-checkout case showed that the drafted D4 rule over-marks.
- Round 1: a sentinel `core.fsmonitor` hook ran under `git ls-files -v` and `git check-ignore`, not only under `git status`. `-c core.fsmonitor=false` stopped it each time.
- Round 1: a minimal Phase 1 prototype turned row d9 red (one temp file per clean fingerprint). The tilde prototype turned only t13 red, as planned.
- Round 2: the T3.1 README check missed three reworded stale blurbs. The Lead replaced it with a clause-tied check and ran it against 11 blurbs: 5 compliant came out green, 6 stale came out red, and the current README came out red.
- Round 2 (Lead): T3.1's full Done-when in a clone with a correct 0.21.18 release printed `RELEASE_OK`. A 0.22.0 bump failed, as did the base.
- Both rounds: every Done-when command failed at the base, so none passes before its task lands. The `lexical_dir` oracle matched a simulated one-word fix.

## Findings

### Major (all patched)
- [Major] The new `ls-files -v` call had no fsmonitor override → `ls-files` runs a configured fsmonitor command (sentinel count 2). Resolution: D1, PIN-1 and T1.1 put `-c core.fsmonitor=false` on every index-reading git call.
- [Major] A Grep walk built on plain `git check-ignore` runs fsmonitor in the touch arm → the fix is a new guardrail plus End state 20 (a structural row: every `check-ignore` carries `--no-index` and `-c core.fsmonitor=false`).
- [Major] Plain `check-ignore` calls `.claude` not ignored once a file under it is tracked (this repo tracks `.claude/war/config.json`). Ripgrep still skips it, so a realization on plain `check-ignore` under-touches. Resolution: D4 decides "ignored" by pattern (`--no-index`). End state 18 adds a tracked-content row, with the tracked file placed off the walk path.
- [Major, needsDecision] A Grep rooted at the main checkout's parent: the drafted D4 marked every task worktree, but ripgrep never enters them. Resolution: the operator ruled the per-folder rule. End state 19 adds a row.
- [Major] The T3.1 README OLD-absent check matched only the verbatim old wording, then only backticked `~-` in "unresolved"-free sentences. Resolution: a clause-tied perl check, Lead-verified (see Executed proof).

### Minor (auto-fixed)
- `-c` placement: the test shim selects calls by `<worktree> status`, so the `-c` flags go before `-C`. The shim gains an ` ls-files ` arm.
- Row d9's one-temp-file limit is now named in T1.1.
- The untracked-cache behavior hide did not reproduce on APFS. A4 now expects a structural row, and its cross-reference points at End state 4.
- The fixture recipe for the nested-worktree rows: `.claude/` in the fixture exclude, a registered worktree in a wtQ-style window, and negative rows that assert the start record first.
- A folder that no work tree holds is not ignored and is no error. D6's mark-on-error covers only a git failure inside a work tree.
- Oracles: the `lexical_dir` check is scoped to its header and made case-insensitive. The negative t13 title grep is case-insensitive. End state 14 and T3.1 now require the next patch and the first `## ` heading.
- End state 11 covers the test comment above t12 and every hook comment that named `~<name>` as the only unresolved tilde form. End state 1 drops its vacuous Phase 2 extension.
- The plan cited this report before it existed; it exists now.

## Resolutions applied (grill decisions)
- Grep root above the main checkout → per-folder rule, operator-ratified (2026-10-26) → D4, D6, T2.1 slice, End state 19.
- End state 5 judged by a seat → a test row (a shim slows `git ls-files` past the deadline), operator-ratified (2026-10-26) → End state 5, T1.1 slice and Done-when.

## Adjudications
<!-- No authoritative value (version or release-slot literal) was adjudicated: T3.1 still resolves the next free patch at land. -->

## Lead checks
- Drift-guard spine probes: `unguarded-new-mirror` vacuous (no `workflow-template.js` edit). `guard-split-deps-edge` vacuous (no guard split from its fact). `default-flip-old-absent` ran as a bespoke probe (see Findings). `touched-doc-fact-coverage`: T3.1's version facts are guarded by `version-slots.test.mjs`; no other machine-source fact is restated.
- Backstop legitimacy: B1 and B2 each name a concrete reason, a runner and a time. No pre-merge gate covers them (End state 8 and 19's rows cover the fixture half).
- `judge:` grading: End state 5 converted to a check (operator). End state 11 stays judged, with its reason stated (a grep cannot tell whether a comment's claim is true).

## Escape guard
- Round 1: the post-run guard could not run with `--baseline`. Round-1 probes picked `scratchpad/rt` as their own sandbox name and `rm -rf`'d the Lead's snapshot there. Self-confound: the Lead's choice of an in-scratchpad path caused it. The Lead's substitute survey: the working tree was clean, no file under the repo was newer than launch, and the session branch was unchanged. Every moved ref belonged to another session's `/war` run (`war/2026-10-26-interview-fork-trials-and-pair-beats/*`) or to the app's background fetch (`origin/master`, `--porcelain --no-write-fetch-head`). No probe command named a real-repo git write.
- Round 2: the snapshot sat in a `mktemp -d` dir outside the scratchpad. The guard exited 1 on three moved refs, `war/2026-10-26-interview-fork-trials-and-pair-beats/p1-1.1`, `p1-1.3` and `p1-1.6`: foreign (another session's live `/war` run; zero probe commands reference them). Recorded, not deleted.
- Probe residue in the session scratchpad (outside the repo) was removed after each round.

## Residual risk
- The README oracle approximates prose. A blurb could still word `~-` so that it slips the clause check. The T3.1 auditor seat reads the blurb as well.
- D4 models ripgrep's ignore files through git's (`.gitignore`, `info/exclude`). Ripgrep's extra `.ignore` and `.rgignore` files only cause over-touch. Backstop B1 re-checks the tool flags after a Claude Code upgrade.
- The untracked-cache End state rests on a structural row, because no simple behavior fixture shows the hide.
