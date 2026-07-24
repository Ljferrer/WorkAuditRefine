# Red-team report — 2026-07-22-audit-adjudication-threading

- **Plan:** `docs/plans/2026-07-22-audit-adjudication-threading.md`
- **Source spec:** `docs/specs/2026-07-22-audit-adjudication-threading-design.md` (issue #985)
- **Artifact kind:** impl-plan (computed)
- **Mode:** `--afk` (campaign 2026-07-22-run-resilience-and-hardening, plan 2/9; self-adjudicated)
- **Runs:** Workflows `wf_3f3d0acb-4ad` (initial 12 probes + 1 resume), `wf_75a3f4d1-95a` (post-patch fresh pass), `wf_55613827-4be` (decisive matcher + final consistency) — verified against a clean worktree of the plan-2 dev tip (`c188553`, i.e. WITH the predecessor plan landed), redteam agents on opus/high

## Verdict

**CLEARED-WITH-NOTES** (final gate: 0 blockers, 0 needsDecision, 4 minors; 7/7 on-target, 0 dropped; prior rounds' blockers all resolved by plan patches and re-proven).

## Attack surface / executed proof

- Spine lenses ran against the stacked tip; bespoke probes: anchor-snippet-fidelity, renumber-collateral (executed — simulated the SKILL.md step renumber, full JS+shell suites stayed green), gate-audit-emission-sites (executed — applied the three-site edit in a sandbox; suite green incl. the byte-identity back-compat test), tests-baseline (executed — JS suite green, shell loop green, redaction lint clean at the stacked tip), default-flip-old-absent (executed), stacking-rebase-cleanliness, end-state re-verifies, matcher-non-vacuity (executed, decisive), final-consistency.
- Lead-run: backstop-legitimacy (3 AI-declared entries — each names a concrete D9-rooted deferral reason, runner, and timing; all legitimate, all flagged for operator attention), unguarded-new-mirror (vacuous pass — no new inline mirror; ADR 0005 surfaces byte-untouched), ff-topology (not derived — no merge-topology evidence anchors).

## Findings and resolutions applied (5 patch rounds)

1. **[Major → RESOLVED] End state 4's verification guard was broken both ways.** Fixture-proven: the bare `grep -n 'args.adjudications' skills/war/SKILL.md` false-negates on sentence-start casing and passes when the token sits in an unrelated section. **Patch:** two section-scoped, case-insensitive `awk`-bounded checks (Decompose-gate section; recovery runbook), each required to hit. Confirm agent verified all four section anchors resolve uniquely and both checks are correctly RED today.
2. **[Major, needsDecision → RESOLVED] End state 7 ("no sole-producer claim survives") had no RED-able enforcement.** Adjudicated toward encoding: new mapped test (e), scoped to the two surfaces present at Task 1.1's tip (later-wave prose surfaces stay under the explicitly-accepted grep+survey floor — a wider test would RED in-wave).
3. **[Major → RESOLVED] The Lead's own first patch for (2) was itself vacuous.** The `only`/`sole` token matcher passes on the very text it must reject (neither surface carries an exclusivity token; exclusivity is implicit) and false-positives on unrelated "only when…" clauses. **Patch:** matcher respecified — every `red-team report` sentence in the scoped blocks must carry a second-producer clause. **Decisively proven** in-sandbox: RED on the current (reverted) text, GREEN after the two-producer rewrite, no false-positives.
4. **[needsDecision ×2 → RESOLVED] `lenses.md` two-axis conflation.** The plan borrowed spec §4.F's *producer*-exclusivity exemption to shield `lenses.md`'s *destination* phrase, which Task 1.1's gate-audit emission sites make under-inclusive by the plan's own reasoning. **Adjudication:** axes split — producer wording untouched (§4.F stands), destination phrase widened; `lenses.md` added to Task 1.3's Files; three contradicting sentences corrected.
5. **[Minors → fixed in place]** Gate-audit block tails ("each currently ends…" was false for 2 of 3 — insertion point clarified to "immediately after `intentClause`, before the trailing `Default: SOFT…` line"); `intentClause` untouched-site list corrected (no provision-barrier/refiner sites exist; the ace/absorb fix-worker site does); D3 registry rationale-comment correction added to Task 1.1's survey scope with End state 9's "byte-unchanged" scoped to rows+floor; wave DAG hardened (`1.2 → 1.1 → 1.3`, Task 1.1 `deps: [1.2]` — 1.1's prose cites the SKILL.md procedure 1.2 lands); "identical phrase" claim corrected to same-meaning.

## Adjudications

| Adjudicated value | Supersedes |
|---|---|
| End state 4 verification = two section-scoped case-insensitive awk+grep checks, each must hit | bare repo-wide case-sensitive `grep -n` |
| Mapped test (e): scoped single-producer absence test; matcher = red-team-report sentence missing its second-producer clause (never `only`/`sole` tokens); red-first proven | un-encoded grep + manual survey as End state 7's only enforcement; then the vacuous only/sole matcher |
| `lenses.md`: producer wording exempt (§4.F), destination phrase widened by Task 1.3 | "untouched per §4.F" (conflated the producer and destination axes) |
| Task 1.1 `deps: [1.2]` (waves 1.2 → 1.1 → 1.3), prose-coherence edge | 1.1 ∥ 1.2 parallel wave |
| End state 9 "byte-unchanged" scopes to REGISTRY rows + floor assertion; Task 1.1 corrects the registry rationale comment its edit falsifies | unscoped "byte-unchanged" that would forbid correcting a false comment |

No version/release-slot adjudications — version literals stay non-authoritative (slots resolved at land).

## Residual risk (minors, noted)

- **AI-declared intent + backstops (ADR 0014):** whole intent block AI-authored; 3 AI-declared backstops (live confirmation-note behavior; suppression-risk outcome; Lead-procedure adherence/ledger persistence — all D9 judgment-over-prose deferrals with named `/war-review`/inspection runners). No operator ratification; flagged at the approval surface.
- Spec §4.B's "each currently ends" wording remains wrong in the *spec* (decision record, byte-untouched by convention); the plan now carries the correction.
- The `war-auditor.md` "mirrored verbatim" formatting nit from plan 1 remains adjacent context, not this plan's scope.
- Escape-guard exits 1 across rounds were the Lead's in-flight plan patches (the file /red-team is authorized to write), each verified via `git status` as the only dirty path — never a probe escape.
