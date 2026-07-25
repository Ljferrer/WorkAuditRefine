# Red Team — docs/plans/2026-07-24-runbook-and-standing-record-coherence.md (2026-07-24)
**Verdict:** CLEARED-WITH-NOTES — seven rounds; final micro-round 0 blockers / 0 needsDecision / 3 Minors, all auto-fixed in the plan before this report.

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders,
dependency-feasibility, intent-vs-plan — every round. Bespoke across rounds 1–7: ff-topology
(mandatory — End state 9 anchors a three-dot merge-topology base; never skipped), anchor-existence,
t29-census-truth, task16-integration, doctrine-census-wrap, doc-contract-lock-redprovable,
guard-deny-string-truth, default-flip-old-absent (drift-guard spine), already-spent-keeps,
manifest-envelope-feasibility, absence-floor-nonvacuity, lock-c-shape, task11-row-split,
plan-self-consistency, task15-enumeration-completeness, t2-scope-satisfiability,
normalization-recipe, campaign-footprint-record, t2-region-declaration, token-set-equality-floor,
t2-structural-region, token-set-equality-final, patch-self-consistency, final-spec-execution,
round6-patch-consistency. Executed in sandbox: every `technique: executed` probe (throwaway
`cp -R` copies / synthetic git repos; the live worktree never written). artifactKind: `impl-plan`.
Fallback: none — all analyzed probes dispatched on `Explore`.

Rounds: r1 `wf_e338e52c-01b` (16 probes, BLOCKED — 16 blockers / 12 root defects) · r2
`wf_6aa5d373-637` (BLOCKED — 9 defects, all in the r1 patches) · r3 `wf_4856642e-cba` (BLOCKED —
7 Majors, **3 refuted by direct measurement**, 4 real) · r4 `wf_9dc44788-d07` (BLOCKED — 4 root
defects, all in the r3 patches) · r5 `wf_04c127ad-87d` (BLOCKED — blocker surface reduced to the
two r4 constructs; operator grilled interactively) · r6 `wf_e574711b-790` (BLOCKED — 1 new Major
+ A2 completion; first zero-finding spine passes) · r7 `wf_02123020-0ef` (micro-round,
**CLEARED-WITH-NOTES**). Plan patch commits: `629f90d` (r1–2), `65bcbdf` (r3), `7e6a585` (r4),
`30e8edd` (r5, operator-adjudicated), `fe36ddd` (r6), + the r7 Minor sweep (this commit).

## Executed proof
- Base suites green at every round's base: `node --test 'skills/**/*.test.mjs'` 926/926;
  `bash hooks/validate-auditor-git.test.sh` 87/87;
  `bash skills/war/assets/provision-worktrees.test.sh` 380/380.
- Final equality-floor spec (r7): implemented verbatim from Task 1.5 floor (iii) → GREEN on a
  correct full-enumeration message (flags abutting `)`/`;`, concrete `--sort=refname`); RED on
  long-forms-only (omitting `-a`/`-r`/`-v`); RED on the live partial message; J-series 87/87 with
  the correct message swapped in.
- MUST-carry lock-step (r7): simulated Task 1.2(d) passes End state 4's checks; leaving
  `skills/war/SKILL.md`'s mirror sentence unedited fails them.
- Structural region (r7): first-bare-`#` locator selects exactly the invariant sentence at base
  (lines 1278–1281) and catches the two-paragraph evasion round 6 proved against the last-bare-`#`
  form; floor (iii) holds simultaneously.
- ff-topology (r4–r6): End state 9's three-dot subset-plus-named-absentee predicate sound under
  both fast-forward and `--no-ff` topologies; equality would false-RED; subset still catches a
  genuine collateral file.
- Envelope feasibility (r1): `totalTokens`/`totalToolCalls`/`agentCount` attested from this
  campaign's own task-completion envelopes (18/1898609/409, 7/554519/159, 27/2108110/508) — the
  plan carries the attestation because nothing in the tree evidences the envelope shape.

## Findings
### Major (all resolved in place; the defining ones)
- [Major r1] End state 9 demanded diff-equality while expecting `hooks/validate-auditor-git.test.sh`
  byte-untouched → unsatisfiable on the happy path. → subset + one named permitted absentee.
- [Major r1] Task 1.2(e) mandated the paraphrase `mines one from arbitrary prose` → End state 5's
  census home would return zero under every form. → literal `mined from arbitrary prose` mandated,
  do-not-paraphrase warning.
- [Major r1] End state 2 had no committed guard → lock (c) added (Task 1.3, third wave,
  `deps: [1.1, 1.2]`).
- [Major r3, REFUTED ×3] probe claimed the absence floors match zero / are vacuous → direct
  measurement: every key matches exactly 1 under raw/`tr`-only/`sed`+`tr` alike. Downgraded to one
  Minor (the `tr`-only recipe truly does not defend a *future* re-wrap: proven 0/0/1 on a re-wrap
  fixture) and fixed with the `sed 's/^[[:space:]]*#[[:space:]]*//'` strip.
- [Major r3] Task 1.5's replacement text named 3/6 value flags + 5/9 bare tokens and claimed
  "enumerated exactly" — re-committing the misdescription defect the task removes. → full 15-token
  transcription; evolved r4→r6 into derived token-set equality (see Adjudications).
- [Major r3] `T2\.` key jointly unsatisfiable with floor (iii) (90 file-wide / 3 in-block hits, one
  byte-pinned). → sentence-scoped; evolved r4→r6 into the structural region (see Adjudications).
- [Major r4] r3's region anchor was the defective sentence's own opener (`Exit 3 is shared by`)
  while the plan's suggested replacement opens `Exit 3 is reached by` — locator evaporates on a
  compliant edit. → worker-declared region (r4), itself proven unauditable (r5): a partial quote
  hid a `T2.` in the unquoted remainder. → structural region (r5, operator-adjudicated).
- [Major r4] the `15/15` presence floor was a per-token substring grep; `-a` ⊂ `--all`, `-r` ⊂
  `--remotes`, `-v` ⊂ `--verbose`/`-vv` — a long-forms-only message scored 15/15 while omitting
  three tokens. → token-set equality derived from the case arms (r5, operator-adjudicated),
  terminator + collapse completed r6.
- [Major r6, new] Task 1.2(d) widened schemas.md's MUST-carry list but not `skills/war/SKILL.md`'s
  own binding MUST-carry mirror sentence (SKILL.md:68) → would land a fresh two-record divergence.
  → 1.2(d) extends the mirror in the same edit; End state 4 checks the pair in lock-step.

### Minor (r7 notes, auto-fixed in the plan)
- [Minor] The two schemas.md heading anchors are **prefixes** of the live headings
  (`## ledger.json — run state at …`, `## Run manifest — …`), not exact lines → prefix-match noted
  at Task 1.1 and lock (b).
- [Minor] The "vacuous key" rejection rationale was overstated: the rejected phrase matches once
  under the plan's own normalized form — it is rejected as a *line-local* key, not as inherently
  unmatchable → rationale corrected at End state 7 and backstop key (4).
- [Minor] Backstop taxonomy said key (2) pins no pre-change count while key (2)'s own text pins 1
  for its never-carries sub-key → clause scoped to the `manifest` census half.

## Resolutions applied (grill decisions)
- r5 blocker "worker-declared region unauditable" → operator: **structural region** → End state 11,
  Task 1.6 floor (i), backstop key (5).
- r5 needsDecision "equality scope: whole-message vs enumeration-region" → operator:
  **whole-message** → Task 1.5 floor (iii), End state 7.
- r5 "what closes the loop" → operator: **narrow round 6**, then (after r6's near-green) operator:
  **micro-round 7** → this verdict.
- r6 needsDecision "token terminator" / "collapse scope" → Lead-completed under `--afk` as forced
  choices (the rejected reading of each REDs correct deliverables): charset terminator
  `[A-Za-z0-9=<>_-]`; collapse everything after `=`, placeholder or concrete value alike.

## Adjudications
<!-- Machine-readable: the WAR Lead reads these rows and threads them into the auditor prompts (auditPrompt() and the gate-audit seats). Version precedence: task instruction > red-team adjudication > plan body literal. Leave empty (or omit) when no authoritative value was adjudicated — an empty block is byte-identical no-op for the auditor. -->
- Task 1.6 scanned region = the census comment lines strictly between the block's **first** bare
  `#` paragraph-break line and its `#   (b) ` detail line, located from the
  `PAIR9="$(setup_origin_pair)"` fixture anchor; the done-report quote is evidence only,
  reconciled against this region — supersedes the worker-declared-region, opening-literal
  (`Exit 3 is shared by`), and file-wide readings — End state 11 / Task 1.6 floor (i) / backstop
  key (5); operator-adjudicated 2026-07-24 (red-team round 5, hardened round 6).
- Task 1.5 floor (iii) = **whole-message** token-set equality, derivation: arm side `|`-split with
  trailing `*` stripped; message side boundary-anchored (start/space/`(`/`,`), token running to
  the first character outside `[A-Za-z0-9=<>_-]`, everything after `=` discarded (placeholder or
  concrete value alike), the floor-(i) literal `=-attached` yielding no token; consequence: the
  deny string names no denied token — supersedes the `15/15` substring floor and the
  "enumerated exactly" partial list — Task 1.5 / End state 7; operator-adjudicated 2026-07-24
  (round 5), Lead-completed terminator + collapse under `--afk` (round 6, forced choices).
- `skills/war/assets/provision-worktrees.test.sh` campaign contention set = plans **1, 2, 5**
  (sequential, distinct case families) — supersedes the roadmap's recorded `1, 5` (row-2 Files
  cell, `1 → 5` dependency line, contention row all predate the Task 1.6 fold); the roadmap
  correction is campaign-Lead bookkeeping at campaign close, deliberately not a task in this plan.
- #1085 closes on **neither** this plan's PR **nor** plan 4's — plan 4's vehicle is a Lead-filed
  `war-followup` naming `agents/war-auditor.md` + the `workflow-template.js` dispatched clause;
  this plan's PR cites #1085 as partially addressed, no closing keyword.

## Residual risk
- The plan is prose-floor heavy by design (docs-truth sweep): its floors are greps and derivations
  the refiner and gate-audit seats run, not committed tests — except lock (a)/(b)/(c), which are
  committed. The Deferred-validations integrated-tip sweep is the union-level backstop; runner:
  the Lead at Phase-1 land.
- `hooks/validate-auditor-git.test.sh` rides Task 1.5's Files as a straggler-comment home and is
  expected byte-untouched — End state 9's named-absentee predicate covers the expected path.
- Envelope field names rest on this campaign's observed task-completion envelopes; the
  null-tolerated posture covers a future harness rename.
- Six of seven rounds' new defects were introduced by the patch loop itself (rounds 2–6); the
  terminal mechanism that converged was: reproduce-before-patch (r3), remove-literals-instead-of-
  adding-them (r4), a mechanical pre-verify self-consistency sweep (r4 onward), and interactive
  operator adjudication of construct-shape decisions (r5–r7).
