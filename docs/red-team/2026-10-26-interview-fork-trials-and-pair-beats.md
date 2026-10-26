# Red Team — docs/plans/2026-10-26-interview-fork-trials-and-pair-beats.md (2026-10-26)
**Verdict:** ADJUDICATED — every blocker and needsDecision was patched in place and stamped after nine operator rulings; no probe re-run was spent, so the patched findings are adjudicated, not re-proven (ADR 0043)
**Rounds:** 1
<!-- Cumulative grill sweeps: the Step-1 seed (0, no prior report) + this run's one full sweep. -->

Artifact kind: `impl-plan`. Model/effort from run config: opus / high. Round limit: 3. Provision: `[]` (no `.war-provision.json`). Repo = cwd (the linked worktree `.claude/worktrees/war-planning-pstack-methods-7a0dbe`, HEAD `3295c774`, master merged at `76a8b6fb`). The plan is its own source of truth (merged arm).

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source (merged arm), consistency-placeholders, dependency-feasibility, intent-vs-plan. Bespoke: red-at-base, default-flip-old-absent, census-and-pins, config-section, glossary-headroom, dep-resolves (executed); anchor-check, backstops-and-latitude (analyzed). Executed in sandbox: 7. Lead-run: the four drift-guard probes (unguarded-new-mirror vacuous, default-flip-old-absent executed above, guard-split-deps-edge pass on T1.2's `deps: [1.1]`, touched-doc-fact-coverage pass: schemas.md and war-room de-mirror, fork-trials.md reads defaults by pointer, CONTEXT.md residues gain D32 rows), backstop-legitimacy (three rows failed, see findings), `judge:` grading (End states 12, 13, 14 graded; 13 and 14 became `check:`). `ff-topology`: not triggered (the release Done when anchors on `git merge-base`, never on `^1` or a first-parent diff).
Fallback: none (`Explore` present; `analyzedAgentType` omitted).
Coverage: 14 expected, 14 on target, 0 off target, 0 dropped. Workflow run: `wf_48910edb-5f8` (20 agents, 2,063,223 subagent tokens, 11.8 min).
Escape guard: snapshot exit 0; baseline exit 1 on one added ref, `refs/heads/claude/confident-euler-6c953e` at `76a8b6fb` (14:51, a worktree another Claude session opened inside the window). Provenance: foreign. No probe-authored residue, no dirt. Recorded, not blocking.

## Executed proof
- red-at-base → every End-state `check:` and `Done when:` command parses (`bash -n`) and is red at base for the deliverable-absent clause; the embedded suites are green at base (structure 221, skill-doc-contracts 68, doc-cli 8, war-config 205). T2.1's `git merge-base` exits 128 because the branch does not exist yet, the expected pre-execution state (A3).
- default-flip-old-absent → the `[assumed]`-first literal sits on both enumerated surfaces; each End state's OLD-absent arm stays red while its own surface is stale and greens only after that surface is reworded. A third tracked file carries the literal: `docs/specs/2026-08-04-interview-and-authoring-contract-design.md` (ruling 5).
- census-and-pins → an unregistered `fork-trials.md` reds doc-cli with `references-file placement census failed (default-deny). UNPLACED: […]`; a `VERB_SCAN_EXCLUSIONS` row greens it even with the `war-config.mjs --stdin --fill-defaults` prose (flags claim no verb); structure, skill-doc-contracts, reference-link-integrity and war-pipeline stay green with the stub present; the file-exists idiom exists; `SCAN_DIRS` excludes `skills/war-strategy/references`.
- config-section → `DEFAULTS.interview`, the validate() block and `agents.trial` with preset re-pins: war-config 205 → the agents matrix and the preset tests red only where the plan says T1.3 edits them (`TIER_PATHS`, `BULLET_LABELS`, the thorough/economy literals); workflow-template and stage-workflow green; `{"interview":null}` exits 1 `interview must be an object`; `"600"` exits 1 naming the key; `{}` emits the defaults and `agents.trial`.
- glossary-headroom → both evictions byte-identical; five residues 95–110 B; `CONTEXT.md` 126,814 → 126,224 B (752 B under the hard line); budgets, skill-doc-contracts and reference-link-integrity green without D32 rows (the rows are owed by rule 8, not by a red).
- dep-resolves → no `timeout`/`gtimeout`; `perl` present; the plain `alarm; exec` form kills only the outer bash and leaves a compound command's child running (ruling-free correction, D17); node 24.17; `git clone --no-hardlinks` of a clone matches; the escape guard refuses a dirty tree with exit 1 and no file, and a missing baseline with exit 2; `gh` present.
- Lead re-run after patching (read-only, this worktree): the rewritten End states 1, 6, 9 and 16 and both OLD-absent arms are red at base; End states 13 and 14 are green by design (a discharged duty and a launch precondition).

## Findings
### Critical / Major / Minor
- [Major ×2, executable-proof, dep-resolves] D17's `perl -e 'alarm shift; exec @ARGV'` cap kills only the exec'd bash; a compound check's `node --test` child outlives it, exit 142 not 124. Resolution: D17 and T1.1 prescribe a process-group kill (`setpgrp`, TERM then KILL to `-pgid`, exit 124); `cap: enforced` only with that form; A6 updated.
- [Major, executable-proof] End state 9 and T1.6's `grep -Fq 'fork trials and the pair beat'` is case-sensitive on a prose phrase the latitude list lets a worker reword. Resolution: `grep -Eiq '^## Amendment \(2026-10-26\).*pair beat'` on both.
- [Major ×2, intent-vs-plan] End states 2 and 6 and two Done whens carry a raw backtick inside the needle; the Lead's span extraction truncates the staged command. Resolution: needle `-first probes` with `--`.
- [Major, intent-vs-plan] End state 11 named a Done when instead of a command. Resolution: T2.1's command inlined.
- [Major ×3, coverage-vs-source] Issues #1548, #1848 and #2397 list `## Evidence artifacts` the block omitted. Resolution: one row per artifact, read or unread with a reason.
- [Major, coverage-vs-source] D12's rule "an inconclusive trial backs a ledger row whose Check is the replay command" mapped to no task. Resolution: added to T1.1's `## Provenance`.
- [Major, anchor-check; Minor ×5 across lenses] The census comment was cited by a stale line number. Resolution: cited by construct; the refresh is unconditional in T1.1.
- [Major needsDecision, backstops-and-latitude] End state 12 / B1 named a `red-at-base` probe red-team does not have, and this plan is the only Trials-run plan. Resolution: ruling 1, narrowed to later doctrine-authored plans, `command-diff` and `baseline-repro` named, this plan's exploratory rows exempt.
- [Major needsDecision, backstops-and-latitude] Mechanism latitude listed the war-config test title, which three checks pin. Resolution: ruling 2, dropped; war-review and ADR items narrowed to "beyond the pinned label/heading".
- [Major needsDecision, backstops-and-latitude] B3 named a runner `/war` does not have. Resolution: ruling 3, End state 14 is a `check:` on `git merge-base --is-ancestor 76a8b6fb HEAD`; B3 deleted.
- [Major needsDecision, backstops-and-latitude] Six guardrails were reached by no check. Resolution: ruling 4, End state 16 (`git diff --quiet` on `skills/red-team` and the budget test, no `agents/war-trial.md`, the sandbox form named) and End state 17 (`HARD at audit_sha`, byte identity of the evicted bodies, with the reason it is judged).
- [Minor needsDecision, default-flip-old-absent] A third surface carries the retired wording. Resolution: ruling 5, Context states that dated specs under `docs/specs/` are frozen records.
- [Minor needsDecision, claims-vs-reality] The #2436 comment duty sat under the pre-write Stage 5 header. Resolution: ruling 6, moved to `## Terminal state`.
- [Minor needsDecision, coverage-vs-source] D13's Stage 2 pointer mapped to no task. Resolution: ruling 7, T1.2's pair-beat bullet carries it.
- [Minor needsDecision, backstops-and-latitude] B2 had lapsed (the comment exists) and bundled an open-ended duty. Resolution: ruling 8, End state 13 is a `gh issue view` check; the recurring duty stays doctrine in T1.1.
- [Minor needsDecision ×2, backstops-and-latitude] B4 and B5 named runners that cannot run them. Resolution: ruling 9, B5 becomes a header pin in T1.4's test file, B4 moves to Non-goals as an accepted residual; B6 renumbered B2.
- [Minor, claims-vs-reality] The Context overstated #2411's reach (four named files unchanged, "+1933 lines" wrong) and two suite baselines. Resolution: narrowed to the five changed surfaces; only doc-cli and war-config baselines moved.
- [Minor, claims-vs-reality] T1.3's war-room token `trial subagent` breaks the bullet parser's one-word label grammar. Resolution: `trial-tier`, with the `TIER_PATHS` and `BULLET_LABELS` edits named.
- [Minor ×4] The header said Q1–Q14 while D18 is Q15. Resolution: header records Q15 as the post-echo-back directive.
- [Minor] End state 1 counted headings; End state 5 grepped the bare word `interview`; End state 8 was case-sensitive; D15 carried ‡ with no pin; the lint note said two hits. Resolution: nine exact-heading greps; `DEFAULTS.interview`; `-i`; ‡ dropped from D15; three hits.
- [Minor] A9 claimed a precedent it did not follow; D14 cited the wrong D12; the `gh` reads rule and the `trial tier:` header field were absent from T1.1. Resolution: each fixed in place.

## Resolutions applied (grill decisions)
- End state 12 / B1 replay scope → ruling 1 → End state 12, B1
- war-config test title in latitude → ruling 2 → Mechanism latitude
- B3 runner → ruling 3 → End state 14, Pivotal constraints, B3 deleted
- unreachable guardrails → ruling 4 → End states 16, 17, Critical path
- third `[assumed]`-first surface → ruling 5 → Context
- #2436 duty home → ruling 6 → T1.2, End state 2
- Stage 2 pointer → ruling 7 → T1.2
- lapsed B2 → ruling 8 → End state 13, B2 deleted
- B4, B5 runners → ruling 9 → Non-goals, T1.4, A4, A5
- 12 corrections (group A) → applied without a ruling → D17, A6, A9, End states 1, 2, 5, 6, 8, 9, 11, T1.1, T1.2, T1.3, T1.4, T1.5, T1.6 Done whens, Evidence consumed, Context, header, Notes

## Adjudications
- The `[assumed]`-first wording stays in `docs/specs/2026-08-04-interview-and-authoring-contract-design.md` (frozen record) supersedes the plan's earlier two-surface enumeration as complete — Context — operator-ratified (2026-10-26)
- End states 13 and 14 are `check:` End states green at base by design (a discharged duty, a launch precondition) supersedes their `backstop:` tags — End states 13, 14 — operator-ratified (2026-10-26)

## Residual risk
- The 21 patched findings were adjudicated, not re-proven: no probe re-run was spent. The Lead's read-only re-run of the rewritten checks at base is the only post-patch evidence (red where expected, green by design for 13 and 14).
- End state 16's `git diff --quiet … skills/red-team` passes trivially until a task touches red-team; it is a guardrail, not reach evidence. End state 4's `! grep args.interview` arm is likewise a non-regression guard.
- B1 is the only guard on the Purpose's no-prose-evidence clause until the `trial-replay` follow-up lands.
- A misspelled `interview` section still passes `validate()` (accepted residual, Non-goals).
- The hard-line literal `126976` appears in no check; the budget suite is the oracle. The glossary edit landed at 752 B of margin in the sandbox, measured with the probe's own residue wordings.
- Three advisory `literal-suite-list` lint hits remain by decision (one specific suite as a discriminating check).

## Safety
- All execution ran in `git clone --no-hardlinks` sandboxes under the session scratchpad, deleted afterward. The Lead wrote only the plan file and this report. The one escape-guard delta was another session's worktree ref, recorded above.
