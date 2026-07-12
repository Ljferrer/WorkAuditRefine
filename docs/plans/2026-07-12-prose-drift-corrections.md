# Prose-drift corrections — bash-not-node snippets, docker-bullet classifier scope, land-isolation §5.3 push contract

Source spec: docs/specs/2026-07-12-prose-drift-corrections-design.md
Issues addressed: #741, #799, #804
Stacks on: `docs/plans/2026-07-12-memory-tooling-frictions.md` (ADR 0011 — this plan lands ninth and last; overlap with predecessors is `skills/war/SKILL.md` (campaign-ledger-ingestion-contract, sweep-owned there, likely no edit) and the four release slots, both absorbed by stack order)

**DOC-ONLY plan: zero behavior change.** No shell script, engine, hook, or memory logic moves.
The only test additions are the two paired doc-contract guards the spec mandates. If any
correction appears to need a code change, that is scope creep — record it as a follow-up issue,
never implement it here.

## AI-Commander's Intent

- **Purpose:** three prose surfaces describe mechanisms differently from the landed code; a Lead
  or agent following them verbatim gets SyntaxErrors on every provision call (#741), a wrong
  mental model of the gate-time classifier (#799), or wires a CAS caller to an unreliable
  rejection token (#804). Correct all three and lock the two SKILL.md corrections against
  re-drift.
- **Method:** pure text corrections, located by named construct never line number; each SKILL.md
  fix paired with an assert-OLD-absent guard (plus anti-vacuous presence companion) in the
  existing doc-contract suite, each guard proven red against the pre-fix prose with the evidence
  recorded in the implementation commit message body (auditor-verifiable at the pinned
  `audit_sha`); every token sweep is grep-floor + mandatory manual same-scope survey with hits +
  stragglers (empty lists stated) recorded as a `Survey:` block in the commit message body.
  Never touch CLAUDE.md (ratified pointer line) or `docs/learnings/` (historical provenance
  records).
- **End state:**
  1. `skills/war/SKILL.md` contains zero `node`-prefixed `.sh` invocations (both the
     `${CLAUDE_PLUGIN_ROOT}` form and the `…`-elided form), at least one `bash`-prefixed
     `provision-worktrees.sh` invocation (anti-vacuous), and every `.mjs` helper still uses
     `node`.
  2. The Setup step-3 "Daemon reachable" bullet no longer attributes the platform-signature list
     to the gate-time classifier; it scopes the list to Setup-time per-image probe-build deferral
     only, states the real gate-time key (`classOf` re-runs the failing gate at the
     classification base and compares failing identifiers), retains the shared-`'introduced'`
     fail-safe-fallthrough clause reworded truthfully (the list's presence in this bullet is now
     locked by a doc-contract guard; the fallthrough remains the behavioral fail-safe — the
     bullet must no longer claim "no structure test"), and still names all three platform
     signatures.
  3. `skills/war/assets/skill-doc-contracts.test.mjs` carries two new guards at the next free
     D-numbers (self-discovered across the D-series test files at implementation time; D13/D14
     free at survey base), same construct-anchored extraction style as D10/D12: (a) interpreter
     guard — no `node <path>.sh` invocation shape anywhere in `skills/war/SKILL.md`, plus at
     least one `bash`-prefixed `provision-worktrees.sh` invocation present; its failure message
     says "use bash, or rephrase the example without a literal `node …*.sh` invocation shape";
     (b) misattribution guard — the clause `signature list is what the gate-time classifier keys
     on` (case-insensitive, mid-sentence anchor) absent from the whole file, AND the three
     platform signatures (`EBADPLATFORM`, `no matching manifest for <platform>`,
     `exec format error`) present *inside the extracted "Daemon reachable" bullet* (bullet
     isolated by its `**Daemon reachable**` marker, D10-style intended-location extraction —
     never a whole-file presence check).
  4. The Task 1.1 implementation commit message body carries a `Red-proof:` block with the
     pasted failing assertion output of each new guard run against the pre-fix prose, plus the
     `Survey:` block for both sweeps — verifiable at the pinned `audit_sha` via `git log`.
  5. `git grep`-style checks of `skills/war/assets/workflow-template.js` and `agents/*.md` for
     the `node <path>.sh` invocation shape record zero matches in the `Survey:` block (mirrored
     prompt surfaces confirmed clean); any match found is listed in the done-report for a Lead
     follow-up issue, never edited here (non-goal: no workflow-template.js change).
  6. §5.3 of `docs/specs/2026-06-25-concurrent-run-land-isolation-design.md` shows the landed
     contract — `git push origin HEAD:refs/heads/<working>`, classification solely on the
     `[rejected]` token, the 0/2/3 exit contract, follower `update-ref` only after push success
     plus `ls-remote` readback — plus a supersession pointer naming the `cmd_land_advance`
     subcommand of `skills/war/assets/provision-worktrees.sh` (its header comment is the full
     contract of record). No remaining instruction to classify on the `non-fast-forward`
     literal; accurate descriptions of git's non-ff rejection *mechanism* (decision table, §3b
     prose, invariants) intact; the full match-adjudication table (each `non-fast-forward` /
     `<merge-sha>:refs/heads` match → class (a) corrected or class (b) untouched, located by
     construct) recorded in the Task 1.2 commit's `Survey:` block.
  7. `node --test skills/war/assets/skill-doc-contracts.test.mjs` and the full
     `node --test 'skills/**/*.test.mjs'` suite are green at the merge tip; `git diff` shows no
     edits to CLAUDE.md or under `docs/learnings/`.
  8. All four release slots are bumped together to the next free patch (Phase 2).

## Build order (for /war)

- **Predecessor-consistency check:** intent heading (`## AI-Commander's Intent`, ADR 0014), bold
  Purpose/Method/numbered End state, `Stacks on:` line, contention bullet, directive-form
  release phase, commit-message `Survey:` block convention, and backstops-section style all
  match the 2026-07-12 predecessors (spot-checked against `memory-tooling-frictions` and
  `campaign-ledger-ingestion-contract`). The draft's non-bold intent keys and missing
  `Stacks on:` line were the divergences; fixed to match.
- **Contention (stacks ninth and last):**
  - Release slots (`README.md`, both `.claude-plugin/*.json`): shared with all eight prior
    plans' release phases — serial by construction; Task 2.1 resolves its patch number from the
    live tip, never from any plan literal.
  - `skills/war/SKILL.md`: in the **campaign-ledger-ingestion-contract** plan's Task 1.2 Files
    as sweep-owned (likely no edit) and grepped read-only by **memory-tooling-frictions**. Both
    land before this plan; Task 1.1's worker rebases onto a tip already containing any edits and
    re-runs both sweeps against that base — the spec's 15-occurrence count is a survey-time
    snapshot, never asserted anywhere in this plan or its guards.
  - `skills/war/assets/skill-doc-contracts.test.mjs`: in no prior plan's footprint.
  - `docs/specs/2026-06-25-concurrent-run-land-isolation-design.md`: no prior plan touches it,
    but **land-path-verification-hygiene** edits `provision-worktrees.sh`; Task 1.2 transcribes
    from the *landed* `cmd_land_advance` header at execution time (its re-verify step), so the
    correction cannot fossilize a pre-change contract.

1. Phase 1 — Doc-precision pass (Task 1.1 ∥ Task 1.2, file-disjoint)
2. Phase 2 — release (four version slots, must land last)

## Phase 1 — Doc-precision pass

### Task 1.1: SKILL.md interpreter sweep + docker-bullet reword + paired guards (#741, #799)

- Files: `skills/war/SKILL.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice:
  - **#741 sweep (spec §4.1):** grep `skills/war/SKILL.md` for `node` immediately invoking a
    path ending `.sh` — both the `${CLAUDE_PLUGIN_ROOT}/…/provision-worktrees.sh` form and the
    ellipsis-elided `…/provision-worktrees.sh` form — and replace the `node` prefix with `bash`
    on every match. Pure text substitution; `.mjs` invocations (`war-config.mjs`,
    `war-memory.mjs`) keep `node`. Grep is a floor: hand-scan the full SKILL.md (all sections'
    prose, recipes, inline code spans) for any other `.sh` asset invoked with `node`, any prose
    *describing* a node invocation of a bash script, and any nearby comment/title restating the
    wrong interpreter; fix stragglers in the same change. Re-survey against this task's own
    dispatch base — never trust or assert the spec's survey-time occurrence count.
  - **Mirrored-surface check (End state 5):** grep `skills/war/assets/workflow-template.js` and
    `agents/*.md` for the same `node <path>.sh` invocation shape; record the (expected-zero)
    match list in the `Survey:` block. If a match exists: do NOT edit those files (non-goal) —
    list it in the done-report for the Lead to file a follow-up issue.
  - **#799 reword (spec §4.2):** in the Setup step-3 "Daemon reachable" bullet (locate by the
    `EBADPLATFORM` construct), replace the sentence "This same signature list is what the
    gate-time classifier keys on" with the correctly-scoped statement: the signature list
    governs only Setup-time per-image probe-build deferral; the gate-time `gate_failure_class`
    classifier (`classOf` in `workflow-template.js`) keys on re-running the failing gate at the
    classification base and comparing failing identifiers; the two mechanisms share only the
    `'introduced'` fallthrough. Retain the fail-safe-fallthrough clause but reword its tail
    truthfully: the new misattribution guard presence-locks the three signature names inside
    this bullet, so the bullet must no longer say "no structure test" — say instead that the
    fallthrough remains the behavioral fail-safe while a doc-contract guard locks the list's
    presence in this bullet (see Notes: spec-internal contradiction resolved). Token sweep: grep
    for `signature list` and `gate-time classifier`, handle every match; then hand-scan the
    whole Setup step-3 bullet list and the Checkpoint `gate_failed` routing prose for sibling
    restatements of the misattribution. Record hits + stragglers (empty stated) in the
    `Survey:` block.
  - **Guards (spec §4.3):** add two tests beside the existing guards in
    `skills/war/assets/skill-doc-contracts.test.mjs`, taking the next free D-numbers
    (self-discover across the D-series files — `skill-doc-contracts.test.mjs`,
    `war-config.test.mjs`, `workflow-template.test.mjs`; D13/D14 free at survey base), same
    construct-anchored extraction style, no AST parser:
    - Interpreter guard: assert no match of `node ` followed by a non-whitespace path token
      ending `.sh` (must also match the ellipsis-elided form; match the invocation shape, not
      "node" and ".sh" merely co-occurring in prose), AND at least one `bash`-prefixed
      `provision-worktrees.sh` invocation present (anti-vacuous — no other D-series guard locks
      the land recipes' presence). Failure message: "use bash, or rephrase the example without a
      literal `node …*.sh` invocation shape" — the false-trip on cautionary literal examples is
      accepted; the message tells the future editor to rephrase, not delete the guard.
    - Misattribution guard: assert the clause `signature list is what the gate-time classifier
      keys on` (case-insensitive, mid-sentence anchor — the corrected sentence legitimately
      still contains the bare term "gate-time classifier" to *deny* the coupling, so never key
      on the bare term) is absent from the whole file, AND extract the "Daemon reachable" bullet
      by its `**Daemon reachable**` marker (D10-style bullet isolation — an
      intended-location lock, not presence-anywhere; robust if `EBADPLATFORM` ever appears
      elsewhere in the file) and assert it still names `EBADPLATFORM`,
      `no matching manifest for <platform>`, and `exec format error` — fails loudly if the
      bullet is deleted rather than corrected.
    - **Red-proof (worker procedure only — never a gate step):** before applying each prose fix,
      run its guard against the pre-fix SKILL.md text; capture the failing assertion output;
      apply the fix; observe green. Paste both failure outputs as a `Red-proof:` block in the
      implementation commit message body. The auditor verifies statically at the pinned
      `audit_sha`: read the `Red-proof:` block via `git log`, then confirm via
      `git show <phase-base>:skills/war/SKILL.md` that the base text contains the exact stale
      tokens the guard's regex bans (a mechanical string check needing no test execution —
      auditors cannot write or run node).
  - Out of scope: `docs/learnings/` quotes of the old #799 sentence are historical records —
    never edit them; CLAUDE.md untouchable.
- requiresTest: true — doc-only change, but the spec mandates the two paired guards in this
  slice; the modified `skill-doc-contracts.test.mjs` matches the `assert-test-in-diff.sh`
  floor's `skills/**/*.test.mjs` pattern (changed path, Added or Modified both count).
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Land-isolation spec §5.3 rewrite + supersession pointer (#804)

- Files: `docs/specs/2026-06-25-concurrent-run-land-isolation-design.md`
- Plan slice (spec §4.4): rewrite the §5.3 pseudocode block's `land-advance` annotations to the
  landed contract:
  - push is the named-source form `git push origin HEAD:refs/heads/<working>` (HEAD *is* the
    merge SHA in the detached `_refinery`), never a bare-SHA refspec, never `--force`;
  - classification is solely on the `[rejected]` token: exit `0` = accepted (or already-landed),
    `2` = CAS loss → reland loop, `3` = any other push error or readback mismatch → escalate;
    never key on the `non-fast-forward` literal (red-team-proved unreliable for this push form);
  - the local follower `update-ref` advances only after push success plus the `ls-remote`
    readback.

  Directly above or below the block, add the supersession pointer naming the **`cmd_land_advance`
  subcommand** of `skills/war/assets/provision-worktrees.sh` as the authoritative contract, with
  its header comment as the full contract of record — the subcommand name is the stable anchor
  (a sibling plan may relocate or rewrite the header; the function name survives refactors the
  comment does not). Do both rewrite and pointer — rewrite alone re-rots; pointer alone leaves
  live-looking wrong pseudocode.

  Token sweep: grep the spec for `non-fast-forward` and `<merge-sha>:refs/heads`, adjudicate
  every match into (a) stale classification-token/push-form claim → correct, or (b) accurate
  description of git's non-ff rejection *mechanism* → leave untouched. Survey-time verdicts for
  orientation (re-adjudicate against the actual base): the §5.3 classification instruction is
  class (a); the decision-table, §3b, and invariants mechanism prose are class (b). Record the
  **full adjudication table** — every match, located by construct, with its a/b verdict and
  one-line reason — in the commit message `Survey:` block, so the auditor checks the
  adjudication itself, not just the presence of edits. Then hand-scan §3b, §5.3–§5.5, the
  invariants list, and the red-team findings appendix for other restatements of the superseded
  bare-SHA push or token-classification mechanics; the appendix recording the *original*
  superseded design remains as history unless it reads as a live instruction.

  Before rewriting, re-verify each corrected fact against the live `cmd_land_advance` header
  comment (tour-narrative lesson: doc code-facts rot silently) — transcribe from the header, do
  not trust this plan's restatement if they disagree; halt and escalate on any disagreement
  (that would mean the contract moved again).
- requiresTest: false — pure doc edit in `docs/specs/`; no doc-contract test covers that
  directory (spec constraint 2), and inventing one is out of scope. This is the `no-test` route
  by design; justification recorded here for the floor's route.
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — release

### Task 2.1: version bump — four slots, next free patch

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: `skills/war/SKILL.md` and `skills/war/assets/skill-doc-contracts.test.mjs` are
  shipped plugin surfaces, so users only receive these corrections via a release. Bump all four
  slots together to the **next free patch above the live integration base at land time** —
  `.claude-plugin/plugin.json` `version`, `.claude-plugin/marketplace.json` `metadata.version`
  and `plugins[0].version`, and the `README.md` `## Status` line (replace-in-place, never a
  badge, never an empty field); `skills/war/assets/version-slots.test.mjs` is the lock-step
  arbiter — run it as part of the gate evidence. Never emit a resolved semver literal from this
  plan — it stacks ninth behind eight stacked release bumps, so any plan-time literal lags (the
  stacked-release lesson). Standalone fallback: a run outside the campaign resolves the next
  free patch from the four slots themselves at land time.
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump; no new test.
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- Spec validation criterion 5 (`node --test 'skills/**/*.test.mjs'` fully green,
  `war-memory.mjs lint docs/learnings/` unaffected) · why deferred: the per-task gate
  (self-discovered via `resolveGate`) already runs the JS suites, and no task touches
  `docs/learnings/` so the lint is unaffected by construction · runner: the /war merge gate per
  task, plus the campaign-level CI redaction lint on the PR.
- **Land-isolation §5.3 re-rot: unguarded** — no doc-contract test covers `docs/specs/`, so the
  corrected §5.3 can silently drift again · backstop: the supersession pointer (a reader who
  follows it reaches `cmd_land_advance` ground truth even if the pseudocode re-rots) · runner:
  the Lead files ONE follow-up issue at phase close proposing the general spec-truth sweep
  (spec §9 non-goal — separate work, now with a named owner instead of a prose waiver, per
  ADR 0017).
- **#799 replacement sentence's new code-facts are unguarded prose** (`classOf`,
  classification-base re-run, failing-identifier comparison, shared `'introduced'`
  fallthrough — workflow-template.js internals that sibling plans may change) · why deferred:
  the guard locks the OLD clause's absence by design; presence-coupling the new sentence to the
  `classOf` construct would be a new cross-file drift-guard class this doc-only plan does not
  open (adjudicated: option (b), accept as unguarded and record) · runner: the same Lead-filed
  follow-up issue (doc-truth sweep candidate list names this sentence).

## Notes / conscious deviations

- **Two tasks total, confirmed (Q1):** #741 + #799 + both guards share one task — both edit
  `skills/war/SKILL.md` and both pair with guards in `skill-doc-contracts.test.mjs`
  (same-file ⇒ same task, code-boundary rule 1; the spec's proven-red-in-the-same-change
  requirement also binds them). Task 1.2 is file-disjoint and runs in the same wave. No further
  split possible.
- **Stale-count discipline (Q2):** the spec's "15 occurrences" is survey-time snapshot only;
  no guard, End-state item, or task step asserts it — sweeps re-run against the dispatch base
  (campaign-ledger lands earlier and lists SKILL.md as sweep-owned).
- **Spec-internal contradiction resolved (Q3):** the spec both mandates the three-signature
  presence companion (§4.3) and requires keeping the "no structure test" clause true (§3). Both
  cannot hold — the companion IS a presence lock on the list members. Adjudicated: keep the
  companion (weak-assertion lesson, 9 recurrences, beats the clause's wording) and reword the
  retained clause truthfully — fallthrough stays the behavioral fail-safe; the list's presence
  in the bullet is now guard-locked. Deviates from spec §3 row "#799 retained-clause truth" and
  §9 "no structure-test lock on the list" as literally worded.
- **Red-proof evidence (Q4, Q12):** transient red-runs leave a `Red-proof:` block (pasted
  failing assertions) in the commit message body; auditor verifies statically at the pinned
  `audit_sha` (base text contains the banned tokens; guard regex matches them) — no auditor
  execution needed. The red-proof is worker procedure only; the gate stays
  `node --test 'skills/**/*.test.mjs'` and every End-state item is checkable at the merge tip.
- **Interpreter-guard false-trip accepted (Q5):** cautionary prose containing a literal
  `node …*.sh` example becomes unwritable in SKILL.md; the guard's failure message says "use
  bash, or rephrase the example" so a future editor rephrases instead of deleting the guard.
- **Interpreter-guard anti-vacuous companion added (Q6):** no existing D-series guard locks the
  land recipes' presence (D10 covers Checkpoint classification, D12 the tour), so the guard also
  asserts ≥1 `bash`-prefixed `provision-worktrees.sh` invocation. Additive to the spec's §4.3
  guard shape.
- **New-sentence rot: option (b) (Q7):** the #799 replacement's code-facts are accepted as
  unguarded prose, recorded in Deferred validations with the follow-up issue as runner — not
  silently dropped, not a new cross-file guard class.
- **#804 re-rot backstopped, not waived (Q8):** explicit Deferred validations entry; the Lead
  files the spec-truth-sweep follow-up issue at phase close (ADR 0017 — no prose waivers).
- **Supersession pointer anchors the subcommand, not the comment (Q9):** `cmd_land_advance` is
  the stable construct; the header comment is cited as the contract's location. Sibling plan
  land-path-verification-hygiene may rewrite the header; the function name survives. Minor
  deviation from spec §4.4's header-comment wording.
- **Adjudication as auditable artifact (Q10):** Task 1.2 records the full a/b match table (by
  construct, with reasons) in the `Survey:` block; the auditor re-derives the verdicts rather
  than only checking edits landed. No line numbers pinned (they rot across the merge queue).
- **requiresTest mapping verified (Q11):** `assert-test-in-diff.sh` matches changed paths
  against `skills/**/*.test.mjs` — the modified guard file satisfies Task 1.1's floor. Task 1.2
  routes `no-test` with justification in-slice; requiresPackaging false on all tasks.
- **Mirrored surfaces checked, not assumed (Q13):** End state 5 makes the worker re-grep
  `workflow-template.js` and `agents/*.md` at its base; a hit routes to a Lead-filed follow-up
  issue (the non-goal forbids editing those files here), never a silent straggler-correct.
- **Own trailing release phase (Q14):** matches every 2026-07-12 predecessor (each plan carries
  its own directive-form release phase; ADR 0011 stack absorbs the base movement). No deferral
  to a campaign-wide release plan exists in this campaign's roadmap.
- **Guard numbering + location lock (Q15):** next free D-numbers self-discovered at
  implementation time (D13/D14 at survey base; the series spans three test files); the
  misattribution guard extracts the "Daemon reachable" bullet by marker (intended-location, per
  the check_f presence-anywhere lesson) rather than asserting signatures anywhere in the file.
- **Predecessor-consistency:** bolded intent keys, `Stacks on:` line, contention bullet under
  Build order, `Survey:` commit-message convention, and directive-form release adopted from the
  2026-07-12 predecessors; draft diverged only in formatting, no scope change.
- **CLAUDE.md is untouchable** (ratified byte-identical pointer line); no sweep extends into it.
  Spec validation criterion 6 (clean `git diff` for CLAUDE.md and `docs/learnings/`) is checked
  by the auditor per task, not by a new mechanical guard.
- Line references in the source spec are approximate at the 2026-07-12 survey base; every task
  locates targets by named construct (`**Daemon reachable**` bullet, §5.3 pseudocode block,
  `cmd_land_advance` subcommand), never by line number.

## Open decisions

None.
