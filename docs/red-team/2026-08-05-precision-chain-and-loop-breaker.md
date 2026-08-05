# Red Team — precision-chain-and-loop-breaker (2026-08-05)
**Verdict:** ADJUDICATED — every root patched and stamped, zero unstamped; coverage whole (11/11 on-target); no probe re-proof owed remains open.
**Rounds:** 2

## Attack surface
Spine: claims-vs-reality · executable-proof · coverage-vs-source (merged arm — the plan is
its own source of truth) · consistency-placeholders · dependency-feasibility ·
intent-vs-plan. Bespoke: anchor-check (16 cited constructs) · command-diff ·
baseline-repro (round census) · ff-topology (mandatory — three-dot floor base +
land-barrier anchors) · default-flip-old-absent. Executed in sandbox: executable-proof,
command-diff, ff-topology, default-flip-old-absent, plus round-2 re-runs of
executable-proof / ff-topology / default-flip-old-absent against the patched plan (the
ADR 0043 two-arm test: executed probes whose measurements the patches changed).
Lead-run: unguarded-new-mirror (pass — the done-unmet mirror append pairs with its
arbiters in one task) · guard-split-deps-edge (pass — content edges 2.3→[2.1, 2.2],
4.2→[4.1]; Task 5.5 lands its guard a phase after its fact by rule 7) ·
backstop-legitimacy (all three rows legitimate) · `judge:`-tag grading (two commandable
tags converted — End states 1 and 11; End states 13 and 14 justified-judged with stated
reasons). Fallback: none — all analyzed probes ran on the preferred type.
Run config: probes + confirms on opus/high (`agents.redteam`, fail-open config read).

## Executed proof
- command-diff (clean pass): all seven existing `Done when:`/`check:` suites green at
  base `3e48529` in a `git clone --no-hardlinks` sandbox — `workflow-template.test.mjs`,
  `land-decision.test.mjs`, `war-config.test.mjs`, `red-team-gate.test.mjs`,
  `campaign-ledger.test.mjs`, `version-slots.test.mjs`, `assert-test-in-diff.test.sh`;
  `assert-done-when.sh`/`.test.sh` absent as the expected Task 2.1 deliverable.
- ff-topology (r1 + r2): synthetic fast-forward fixture (base → integration → 3 ff task
  merges → `--no-ff` phase land) proved the original "land barrier"/"confirmed tip"/"the
  gate log" anchors had non-equivalent referents; the patched integrated-tip definition
  re-evaluated well-defined at a single unambiguous commit, with one dispatch-reachability
  precision applied (unconditional per phase — the `mergedTasksForGateAudit`-empty arm
  included).
- baseline-repro: census re-derived at `3e48529` — median **2** invocation-rounds across
  the 12 newest reports (2026-07-26 →), 17 reports since 2026-07-24; the 7-round outlier
  confirmed (its rounds 2 and 4 were 100% patch-induced, pre-ADR-0043). The plan's
  original "median ≈ 1.5 across the 12 newest (2026-07-24 →)" was wrong on both numbers
  and is corrected in place.
- default-flip-old-absent (r1 + r2): repo-wide OLD-value sweeps found carriers outside
  the plan's Files lists (two legacy specs, ADR 0013 §6, the companion spec, README's
  five Design-notes citations, two references files invisible to the guard corpus) — all
  resolved by carve-out, amendment, or coverage per the grill decisions below.
- Escape guard: pre-run snapshot clean (220 refs); post-run exit 1 on both rounds with a
  single delta — `M docs/plans/2026-08-05-precision-chain-and-loop-breaker.md` —
  provenance-cleared as the Lead's own sanctioned grill patching (the one write the
  skill's invariants authorize); no refs added, moved, or removed.

## Findings
Root findings (29/16/12 gate findings deduped; every blocker/`needsDecision` below is
patched into the plan and stamped `adjudicated` — the r2-re-proven ones were removed by
probe re-run per ADR 0043):

### Critical
- [Critical] "A condition no seat attests lands `unverified`" had **no attestation
  channel** — the gate-audit seat result shape is findings-only, so every clean condition
  would land `unverified`. → F1: positive `endStateAttestations` channel
  (`{condition, status, evidence}`, one row per claimed condition) in the seat schema
  (Task 1.2), threaded through prompt + handoff (Task 3.2), shared `endStateBlock` so all
  three gate-audit-family seats return rows.

### Major
- `done-unmet` supplied only the escalation reason; the `no-test` pattern needs **two enum
  slots** (`FLOOR_STATUSES` keys on `MergeResult.status`). → F2: two-slot widening
  (schemas union in Task 1.2; `FLOOR_STATUSES` + result schema + `MERGE_TASK_FLOOR_ONLY`
  partition in Task 2.3).
- `routeUpstream`'s "still open" read against the gate's stamp-inclusive `open` union
  fires on every `ADJUDICATED` run at rounds ≥ 2, colliding the campaign triage arms.
  → F3: both arms key on the unstamped subset; `routeUpstream ⇒ BLOCKED` invariant
  pinned; `=`-attached flags.
- The `**Rounds:**` literal matched neither existing report form; the seeding test was
  assigned to a gate that never parses markdown; no same-slug lookup rule. → F4:
  strict-form dedicated line, Lead-seeded (glob newest-by-date, strict regex), all legacy
  variants seed 0, clean slate.
- "Land barrier"/"confirmed tip"/"the gate log" had three non-equivalent referents under
  fast-forward topology. → F5: integrated-tip definition, unconditional per phase,
  per-condition artifacts stamped with the tip SHA, gate-dedupe dropped, `gate:` tags
  attest from the evidence as actually captured.
- The `testPattern` charset rejects legitimate acceptance commands (`&`, `=`, quotes).
  → F6: charset dropped; file-threading + timeout + the stated trust boundary (same
  class as `plan.gate`, always executed unvalidated).
- Retired wordings survive on surfaces no task read: two legacy specs (four-status enum),
  ADR 0013 §6 + two specs (judgment-path), the companion spec + README (step-3 arm /
  spec citations). → F7 + README extension: posterity carve-out for landed specs
  (never updated); ADR 0013 amendment (Task 5.3); ADR 0046 — specs are posterity, skill
  doctrine surfaces AND README cite only maintained-truthful homes; four skill citations
  + five README citations retired; `doc-cli-consistency.test.mjs` guard with corpus
  widened (`seeding.md`, `design.md`, README).
- Task 1.2's Done-when basis was code-refuted (`doc-cli-consistency.test.mjs` never reads
  schemas.md) → basis rewritten; the schemas OLD-absent assert given a real owner
  (Task 3.2 doc-claim row, the `war-config.test.mjs` schemas-guard pattern).
- The mirror-arbiter constraint named the wrong guard (`land-decision.test.mjs`
  disclaims the role) → restated to the real deepEqual arbiters + the partition pin;
  End states 4/5 checks widened/split to the commands that prove their conjuncts.
- Census median wrong (≈1.5 → **2**), window wrong (2026-07-24 → 2026-07-26) → corrected;
  the fast-fail backstop's calibration basis updated.
- Five smaller Majors: Task 2.2's self-contradictory "empty-absent" grep (rescoped to the
  exit-0 contract), guard-corpus blindness (widened), wrapped `Done when:` bullets
  (full-bullet soft-wrap parse rule), absent-config limit (Lead default-3 fallback,
  limit never unset), Step 5 round-unit collision (per-blocker bounds renamed
  "re-verify attempts").

### Minor (auto-noted / auto-fixed)
- Case-insensitivity qualifier extended to all eight OLD-absent sites (r2 found three
  unqualified). Accumulating scan named in Task 2.2 (the current first-hit `break`
  under-emits plural mappedTests). `--rounds=<n>` flag form pinned against the gate's
  positional-path scan. Resolved-limit threading made explicit. Purpose reworded
  ("`met` only on evidence a seat can cite … never by silence"). Intent-vs-plan's
  upgrade-path note: n/a (operator-authored intent).

## Resolutions applied (grill decisions)
- F1 attestation channel → positive `endStateAttestations` rows → Tasks 1.2/3.2, D8.
- F2 two-slot `done-unmet` → status union + `FLOOR_STATUSES` + partition pin → Tasks
  1.2/2.3, D1, ADR 0005 constraint, End state 4.
- F3 unstamped-subset predicate + `routeUpstream ⇒ BLOCKED` invariant + defensive
  proceed-wins sentence → Tasks 4.1/5.1, D3/D4, End state 8.
- F4 strict-form Rounds line, Lead-seeded, legacy-seeds-0 clean slate → Task 4.2, D10,
  A2, lenses.md template.
- F5 integrated-tip execution point, unconditional, no dedupe → D2, Task 3.2, End
  states 6/7, CONTEXT definition.
- F6 charset dropped; file-threading + timeout + trust boundary → D11, A3, Task 2.1.
- F7 + README extension: posterity carve-outs, ADR 0013 amendment, ADR 0046 (reach
  includes README), citation retirements, guard corpus widening → Tasks 3.2/5.1/5.3/5.4,
  Notes, End state 15.
- F8 judge-tag conversions: End state 1 → `skill-doc-contracts.test.mjs` D-row (Task
  1.1); End state 11 → doc-guard rows (new Task 5.5, phase-after-fact per rule 7); End
  states 13/14 stay judged with stated reasons.

## Adjudications
<!-- Machine-readable: the WAR Lead reads these rows and threads them into the auditor prompts. Version precedence: task instruction > red-team adjudication > plan body literal. -->
- census median `2 invocation-rounds (12 newest, 2026-07-26 →)` supersedes `≈ 1.5 (2026-07-24 →)` — Context + fast-fail backstop calibration — operator-ratified (2026-08-05)
- `**Rounds:** <integer>` strict dedicated line, Lead-seeded, all legacy variants seed 0 supersedes lenient/legacy header credit (the 08-05 report's `**Rounds: 4**` does NOT seed) — D10/A2/Task 4.2 — operator-ratified (2026-08-05)
- `routeUpstream` = unstamped-subset arithmetic with the `routeUpstream ⇒ BLOCKED` invariant supersedes the ambiguous "still open" wording — Task 4.1/End state 8 — operator-ratified (2026-08-05)
- `done-unmet` is BOTH an escalation reason and a `MergeResult.status`/`FLOOR_STATUSES` member supersedes reason-only — D1/Tasks 1.2+2.3 — operator-ratified (2026-08-05)
- endstate-check dispatch runs UNCONDITIONALLY per phase at the integrated tip supersedes the evidence-dispatch-conditional reading — D2/Task 3.2 — operator-ratified (2026-08-05, F5) with unconditional-arm precision AI-declared from ff-topology r2
- no charset validation on `Done when:`/`check:` commands (file-threading + timeout + plan-trust boundary) supersedes the `testPattern` charset claim — D11/A3/Task 2.1 — operator-ratified (2026-08-05)
- ADR 0046's reach includes `README.md` (five Design-notes citations retired; guard corpus includes README) supersedes skill-surfaces-only scope — Task 5.4/End state 15 — operator-ratified (2026-08-05)
- release = next free MINOR above the live base (0.17.0 at authoring, non-authoritative) supersedes the template's next-free-patch default — Task 6.1/A7 — operator-ratified (2026-08-05)

## Residual risk
- End state 13 stays judged: no test suite exists for `skills/war-review/`; minting one
  for two prose rows is out of proportion (F8, recorded).
- End state 14's check cannot fail on a wholly absent release (disclosed in the tag; bump
  presence judged at audit_sha; `Done when:` still runs the suite at merge).
- plan-literal-lint advisory: the `assert-done-when.test.sh` literal in Task 2.1's
  `Done when:` is the new deliverable's own suite name, not a gate enumeration — accepted.
- Three legacy landed specs + ADR 0013's pre-amendment body keep retired wordings as
  sanctioned posterity survivors (F7 carve-out; every plan OLD-absent assert is scoped to
  live surfaces).
- Fast-fail thresholds ship prose-advisory in `loop-budget.md`; gate-typing deferred on
  field data (calibration basis: median 2).
- The red-green/vacuity floor stays a named backstop — the authoring-side
  delete-the-feature probe and the test-fidelity seat are the interim mitigations.
- Guard exit-1 on both rounds: the plan file's own grill patches, provenance-cleared as
  Lead-authored (sanctioned); no ref deltas.
