# Red Team — docs/plans/2026-10-20-rea-artifact-evidence.md (2026-10-20)
**Verdict:** ADJUDICATED — every blocker and `needsDecision` was patched in place and stamped; the two executed probes whose measurement the patches changed were re-run (attempt 2 of 2 clean); the analyzed findings were adjudicated without a re-run (ADR 0043).
**Rounds:** 1
<!-- Cumulative grill sweeps: the Step-1 seed (0, no prior report) + this run's one full sweep. -->

Artifact kind: `impl-plan`. Model/effort from run config: opus / high. Round limit: 3. Provision: `[]` (no `.war-provision.json`, structural fallback empty). Repo = cwd (the linked worktree `.claude/worktrees/rea-repo-review-f0b9a4`, HEAD `81b81330`).

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source (merged arm: the plan is its own source), consistency-placeholders, dependency-feasibility, intent-vs-plan. Bespoke: red-at-base, anchor-check, dep-resolves, default-flip-old-absent, unguarded-new-mirror, guard-split-deps-edge, touched-doc-fact-coverage. Executed in sandbox: executable-proof, red-at-base, dep-resolves, default-flip-old-absent.
Fallback: none (`Explore` present; `analyzedAgentType` omitted).
Lead-run checks: `ff-topology` not triggered (the plan anchors on `git merge-base`, never on `^1`, `--first-parent` or a three-dot floor base); `judge:` rule vacuous (no `HARD` or `judge:` End state); backstop legitimacy: B1, B2, B4 pass; B3's runner was wrong (it named this run, but the probe it needs is a Task 1.6 deliverable) and is patched.
Coverage: 13 expected, 13 on target, 0 off target, 0 dropped. Workflow runs: `wf_3c4219b9` (round 1, all 13 probes), `wf_854d068b` (re-verify attempt 1, 2 executed probes), `wf_ff3e32a0` (re-verify attempt 2, 2 executed probes).

## Executed proof
- red-at-base (attempt 2) → 32 commands (20 End-state checks, 12 Done-whens) run verbatim in a throwaway clone at `81b81330` with the patched plan copied in: 32 red, 0 green, 0 errored for any reason other than the missing deliverable. `bash -n` passes on all 32; every awk program parses. End state 2's stray backtick (attempt 1's one error) is fixed.
- default-flip-old-absent (attempt 2) → 18 OLD-absent arms across Tasks 1.1, 1.2, 1.3, 1.5 and End states 12 and 16 are each red at base; with every surface edited all 18 go green; every leave-one-out case stays red in its owning task, including the partial edit that removes only the parenthetical pair from `schemas.md:80`. Two Minors (a missing End-state-12 arm, two test-fixture comments) were auto-fixed after the run.
- dep-resolves → `rea --version` = 6.5.0 on PATH; TAP prints `ok N - title` with no suffix and `# TODO` on a todo row (the `$` anchor matters); BSD awk `exit !f` idiom returns 0/1 as the plan assumes; the escaped-newline JSON payload decodes to a real newline; `get_evidence_bundle detail=summary` is MCP-only. Found: `~/.zshrc` exports reached interactive shells only (resolved by decision 2).
- executable-proof → ran the plan's runnable artifacts; its one Major was the ADR 0053 contradiction (prose), adjudicated with the claims-vs-reality root.

## Findings
### Critical / Major / Minor
- [Major ×4, lenses: claims-vs-reality, consistency-placeholders, dependency-feasibility, touched-doc-fact-coverage] Task 1.7's doc-token guard "extracts the first bold literal" on three surfaces → each surface already has a different first bold literal, so End state 20 was red by construction. Evidence: `plan-interview.md:3`, `lenses.md:5`, red-team `SKILL.md:8`. Resolution: every mapped surface now carries a fixed lead-in (`Artifact recon lane — marker `, `Target artifacts marker: `, `Marker: `) and the extractor anchors on it, fails closed when absent.
- [Major ×2] Task 1.3's `skills/war/SKILL.md` exemplar put the bold marker value on an unmapped surface and used a repo-root-relative link that resolves to a dead path from that file. Resolution: the exemplar names the constant and links `references/artifact-evidence-lead.md`, skill-relative like every other link in the file.
- [Major ×4 + needsDecision ×3] ADR 0053 was told both to point at the hook's file path and never to name it. Resolution: by-role wording only; Task 1.5's Done when asserts the path and the matcher value absent.
- [Major, coverage-vs-source] The six-key manifest schema (G6) had no owner any worker or seat reads. Resolution: `target-artifacts.mjs` exports `MANIFEST_KEYS`, `artifact-evidence.md` carries a `Manifest keys: ` line, Task 1.7's guard binds them, the dispatched clause points at the line.
- [Major needsDecision, intent-vs-plan] G7 and G8 (the seat's verdict contract) and the REA-absent path had no End-state predicate. Resolution: End states 22 and 23 (decision 4).
- [Major needsDecision, unguarded-new-mirror] `war-config.test.mjs`'s F07 drift guards run the inline `validateRoster` / `resolveWidenSource` bodies in a bare `new Function`; the new constants would be undefined. Resolution: the F07 extract-and-inject pattern is extended (decision 5).
- [Minor needsDecision, coverage-vs-source] A hand-edited roster row could seat the evidence auditor with `run.evidence` off. Resolution: `validate()` rejects an evidence-type row unless the knob is on (decision 1).
- [Minor needsDecision, dep-resolves] A1 was false: the exports lived in `~/.zshrc` only. Resolution: moved to `~/.zshenv` (plus `JAVA_HOME`), verified with `zsh -c 'rea doctor --json'`; D20 adds progressively disclosed setup guidance for zsh, bash and fish (decision 2).
- [Minor needsDecision, touched-doc-fact-coverage] No export named the seat's lens. Resolution: `EVIDENCE_LENS` export (decision 3).
- [Minor ×2, default-flip-old-absent, round 1 and attempt 1] D19 missed OLD surfaces: `war-config.mjs`'s `resolveWidenSource` comment, the `schemas.md` row's `**none reserved**` and "never reserved-selectable", the `widen?` field comment, two test-fixture comments. Resolution: D19 now enumerates seven sites, every arm red at base (attempt 2).
- [Minor ×27, auto-noted or auto-fixed] Stage 0 lane count (three → four), the `tr '\n' ' '` pointer grep across hard-wrapped lines, case-insensitive OLD greps, D3's "six items" placeholder spelled out, the D12 label collision (design-tree D12 vs plan-interview D12) disambiguated, allowlist literal form pinned (full `mcp__rea__<tool>` names, suffix compare), two more deny labels (`war-servitor`, `war-refiner`), the `MANIFEST_PATH_TEMPLATE` registry row grepped in Task 2.3, End state 9's clause added to Task 2.3's Done when, the Part 1 glossary de-mirrored, roster-row facts de-mirrored to `validateRoster`, the parser's JSON output shape pinned, the schema-slot loop's entry-validation contract stated, End state 14's always-true arm removed. Accepted as residual: the double suite run in Task 1.1 and Task 2.3 Done whens (TAP pass plus an unpiped pass, about 220 s each).

## Resolutions applied (grill decisions)
- run.evidence coupling → A: `validate()` rejects an evidence-type roster row unless `run.evidence` is `true` → Task 1.1 slice, End state 12, G1, both check titles.
- REA env in seat shells → A: exports moved to `~/.zshenv` on this machine; D20 (PIN-17) adds `skills/war-room/references/rea-setup.md` and a doctor-based presence check → A1, G1, Pivotal constraints, End state 2, Task 2.4.
- Seat lens identity → A: `EVIDENCE_LENS` export → D15, D18, Task 1.1, Task 2.4, glossary.
- Seat verdict contract → A: End states 22 and 23 → Task 2.3 titles and Done when.
- F07 drift guards → A: extend extract-and-inject → Task 1.1 slice.
- Backstop B3 runner (Lead-run legitimacy check) → the first `/red-team` run on a plan that carries a `**Target artifacts**` block after this plan lands.

## Adjudications
- `validate()` rejects an evidence-type roster row unless `run.evidence` is `true` supersedes the offer-side-only gate — Task 1.1, End state 12, G1 — operator-ratified (2026-10-20)
- `EVIDENCE_LENS` (`artifact-evidence`) exported from `war-config.mjs` and contained in `WIDEN_BARRED_LENSES` supersedes membership-only guarding — D15, D18, Task 2.4 — operator-ratified (2026-10-20)
- End states 22 and 23 (seat verdict contract IDENTICAL on card and skeleton; REA-absent path) supersede backstop-only coverage of G7, G8 and G3 — Task 2.3 — operator-ratified (2026-10-20)
- D19 enumerates seven OLD sites (the `schemas.md` widen row clause and `widen?` comment, both `resolveWidenSource` header comments, both auto-escalation sentences, two test-fixture comments) supersedes the three-surface enumeration — Task 1.1, Task 1.3, Task 1.5, End state 12 — AI-declared (probe-proven, attempt 2)
- D20 (PIN-17): REA setup guidance disclosed at the `run.evidence` opt-in, presence check = MCP registry probe or `rea doctor --json` in a non-interactive shell — Task 2.4, End state 2 — operator-ratified (2026-10-20)
- Backstop B3 runner: the first `/red-team` run on an artifact-carrying plan after this plan lands supersedes "`/red-team` on this plan" — Deferred validations — AI-declared (Lead-run legitimacy check)
- ADR 0053 names the evidence-auditor MCP hook by role only supersedes the file-path pointer — Task 1.5, New domain terms — AI-declared (factual contradiction)

## Residual risk
- The loop-budget advisory fired: 13 `needsDecision` findings in round 1 (seven distinct roots). The operator, who authored the plan in the same session, chose to adjudicate in place rather than route upstream; every root was settled in one attempt.
- The post-run escape guard returned 1 after the Lead's plan patches (`M docs/plans/2026-10-20-rea-artifact-evidence.md`). Provenance: Lead-authored, the sanctioned write. The guard returned 0 immediately after each Workflow run, before any patch. No probe-authored residue, no ref delta.
- Task 1.1 and Task 2.3 Done whens run `workflow-template.test.mjs` twice (TAP for the titles, unpiped for node's exit), about 220 s each. Accepted: the done-when floor's child shell has no `pipefail`.
- The template's prompt-literal share has 6,315 B of advisory headroom; Task 2.3's clause, skeleton and staleness line will WARN there. The plan sanctions the WARN; the hard line stays the gate.
- `agents/war-auditor.md` still states the widen refusal in closed form (backstop B4; 45 B of headroom pins the card untouched).
- REA-dependent behavior is proven only by backstops B1 to B3 (CI never has REA), by design (D13).
