# Land-failure routing and recovery ergonomics — a dead land agent never reads as `landed`, and per-phase dispatches carry operator-meaningful identity

Plan file: `docs/plans/2026-07-16-land-failure-recovery.md`
Source spec: [docs/specs/2026-07-16-land-failure-recovery-design.md](../specs/2026-07-16-land-failure-recovery-design.md)
Issues addressed: #925 (constraint-only reference: #929 — this plan must not add a new block-comment-strip victim)
Stacks on: nothing — **first plan in its campaign**; expected integration base is the **live master tip at campaign launch** (ADR 0011 stack-and-plow). Known sibling contention (2026-07-16 specs, verified): `structural-test-integrity` shares `skills/war/assets/workflow-template.test.mjs`, `learnings-recipe-drift-sweep` shares `skills/war/SKILL.md`, `campaign-anchor-comment-truth` may share `skills/war-campaign/SKILL.md`. This plan lands **first**; rebasing over its edits is the later siblings' duty (the campaign roadmap's shared-file-contention table is the cross-plan surface) — no acknowledgment burden lands here.

## Commander's Intent

- **Purpose:** A phase whose `land:phase-<N>` dispatch dies on a transient API error today finishes
  `status: completed` with `landResult: null` — and every arm of the land routing chain is guarded by
  `landResult &&`, so `landDecision` keeps its pre-dispatch `'landed'` value, the DAG advances, the
  epic closes, and the next phase cuts its base from an `origin/<working>` tip that silently lacks
  this phase's content. The harness's unconditional `resumeFromRunId` hint then invites exactly the
  wrong recovery (a live journal replay that re-runs merges + push-first CAS during the same overload
  window). Separately, every phase of every plan renders in the /workflows UI as `workflow-template`
  with one generic description — dispatches carry no operator-meaningful identity. Close all three:
  route the dead/unrouted land to the **existing** `held:land-failed`, steer recovery prose away from
  `resumeFromRunId` at the failure point, and stamp per-phase dispatch identity via a run-scoped
  staged copy of the template.
- **Method:** One terminal `else` on the primary land routing chain (mirroring the baseline-proceed
  re-land's existing `reLand ? reLand.status : 'error'` fallback idiom) routes both the null result
  and any unrouted status to `held:land-failed` — a **reused** enum member: no new member anywhere,
  `land-decision.mjs` untouched, the emitted-superset comment stays at 6 values, and
  `held:workflow-error` never enters `HARD_ESCALATION_REASONS` (ADR 0005). A **throwing** land
  dispatch keeps routing `held:workflow-error` via the existing top-level catch — the new arm and the
  catch partition the failure space (returned-but-unrouted vs thrown); the observed 529 repro
  returned null with a completed run, which is the arm's case. The Lead runbook's `held:land-failed`
  bullet gains root cause **(c) dead land agent** — with a step-0 already-landed probe so a dispatch
  that died *after* its CAS push is recorded, never re-merged — plus the anti-`resumeFromRunId`
  warning (the hint text is harness-owned; it is countered in skill prose, never edited). Dispatch
  identity ships as a new fail-loud **replace-exactly-once, write-if-absent stager**
  (`stage-workflow.mjs`; `--force` restages deliberately) that writes `war-[c<K>-]<planSlug>-p<N>.js`
  under `$MAIN/.claude/war/runs/<runId>/` with `meta.name`/`meta.description` substituted
  pre-dispatch as pure literals (the Workflow sandbox has no shell/fs — runtime values are never
  computed by the template); an existing staged file is **reused byte-untouched** (approved stage
  injections and journal-replay script stability survive restaging); `/war-campaign` threads the
  queue ordinal explicitly. Guardrails: standing prose (`skills/war/SKILL.md`) and dispatched
  template text move in the same commit; every new source-text assertion is **line-scoped** (never a
  block-comment-strip pre-pass — #929); the doc-parity anchor lines in SKILL.md/schemas.md survive
  intact (the parity suite is the arbiter); no engine-side retry of a dead land dispatch (a blind
  re-dispatch during an overload window compounds the outage — retry discipline stays Lead-side);
  tests over staged copies assert on **text only**, never `import()` (importing the template
  executes the phase).
- **End state:**
  1. **Null land routes `held:land-failed`** — new test in
     `skills/war/assets/workflow-template.test.mjs`: with the Land-phase mock returning `null`,
     `out.landDecision === 'held:land-failed'` and `out.escalated` contains **exactly one** entry
     whose `task` ends `-land`, with `reason === 'error'` (single-push proof). The companion
     `out.servitorResult === null` / zero-servitor-dispatch assertions are recorded as
     pre-existing-behavior regression context (the wrap-up gate already guarantees them) — the
     landDecision + escalated assertions are the load-bearing pair. `node --test
     skills/war/assets/workflow-template.test.mjs` green.
  2. **Unrecognized status never reads landed** — companion test: Land mock returns
     `{ mode:'land-phase', status:'bogus' }` → `landDecision === 'held:land-failed'`, never
     `'landed'`.
  3. **No behavior change on routed paths** — the existing `Task 5` land tests (`land_stale`,
     `gate_failed`, `error`, landed/opportunistic-resync, submodule-pr, and the `#598`
     environment-class test) pass **unmodified**, and `land-decision.test.mjs`'s behavioral
     `workflowEmitted()` extraction still returns exactly the same 6-value emitted set. (Verified at
     survey base: **every** existing impl that reaches the Land dispatch returns an explicit routed
     `mode:'land-phase'` status — zero tests flip under the terminal else; re-inventoried at the
     dispatch base per Task 1.2.)
  4. **Enum + doc parity intact** — `node --test skills/war/assets/land-decision.test.mjs` green,
     including one **new** region-scoped, case-tolerant prose pin: within the §4.3
     `held:land-failed` bullet (extracted by its `**\`held:land-failed\`**` bold header, ending at
     the next `- **` bullet header), `resumeFromRunId` appears paired with a negation token — a pin
     that is **provably red pre-fix** (the bullet carries no `resumeFromRunId` token today, so it
     discriminates the new clause from the six pre-existing never-resume sites elsewhere in the
     file; `Red-proof:` block in the commit body). `skills/war/assets/land-decision.mjs` has an
     **empty diff** (deliberately untouched).
  5. **Runbook prose present** — `grep -in "dead land agent" skills/war/SKILL.md` hits inside the
     §4.3 `held:land-failed` bullet; a same-bullet clause states that `resumeFromRunId` re-runs
     merges/CAS live and must never be used for a land failure; the bullet's root cause (c) carries
     the step-0 already-landed probe; the "Resume vs. recovery relaunch" paragraph carries the
     one-sentence hint warning.
  6. **Schemas prose present** — the `held:land-failed` description bullet in
     `skills/war/references/schemas.md` names the dead-land-agent root cause (a dispatch that died
     producing no `MergeResult` routes here with `reason:'error'`, `detail:null`); the edit touches
     only the bullet's description text after the bold header — the doc-parity (c)/(d) tests
     (enum-union line and per-value bullet headers) stay green **unmodified** as the mechanical
     arbiter.
  7. **Stager derivation proven** — `node --test skills/war/assets/stage-workflow.test.mjs` green:
     basename `war-<slug>-p<N>.js` (and `war-c<K>-<slug>-p<N>.js` with an ordinal); staged text
     carries the derived `meta.name`/`meta.description` literals; the staged copy differs from its
     input template in **exactly** the two meta literals (whole-file equality after substituting the
     shipped literals back); a template with a missing or duplicated anchor exits non-zero; staging
     identical inputs is deterministic (byte-identical); an **existing staged file with different
     content is left byte-untouched, its path printed, exit 0** (write-if-absent — the
     injected-stages / journal-replay stability pin); with **`--force`**, the same pre-existing file
     is overwritten by a fresh substitution (the deliberate-restage escape hatch).
  8. **Anchor guard** — a test in `stage-workflow.test.mjs` asserts the shipped
     `skills/war/assets/workflow-template.js` contains **exactly one** occurrence of each stager
     anchor literal, importing the anchors **from `stage-workflow.mjs`'s exports** (never a second
     hardcoded copy), via **line-scoped** matching (no block-comment stripping anywhere in the new
     assertions).
  9. **Launch + resume + campaign prose** — `grep -n "stage-workflow" skills/war/SKILL.md` hits the
     per-phase launch prose (stage first, dispatch the **printed staged path** as `scriptPath`); the
     `/war` usage line gains `[--campaign-ordinal <K>]`; the `held:phase-incomplete` bullet states
     resume passes the **same staged scriptPath** the launch used;
     `grep -n "stage-workflow\|ordinal" skills/war-campaign/SKILL.md` shows step 4 threading the
     campaign ordinal onto the `/war` invocation.
  10. **`resumeFromRunId` consistency sweep recorded** — `grep -rn "resumeFromRunId" skills/ agents/
      docs/adr/` run at the dispatch base; every hit verified consistent with the
      `held:land-failed` guidance (`held:phase-incomplete`-only, never for land failures — ADR
      0005's dead-phase statements are in-scope-consistent: a `held:land-failed` phase is a
      *completed* workflow, not a dead phase), plus the mandatory manual same-scope survey for
      token-free stragglers ("resume the run", "replay the journal"); the whole outcome recorded as
      a `Survey:` block in the implementation commit body; any needed correction outside the owning
      task's Files routed to a Lead-filed follow-up issue (a ratified ADR found genuinely
      inconsistent gets a *proposed dated amendment* follow-up, never an in-task rewrite).
  11. **Decision record + glossary** — a new ADR (next free number at land time) records the
      run-scoped staged-phase-scripts contract including write-if-absent reuse and the `--force`
      escape hatch, and `CONTEXT.md` gains the **Staged phase script** and **Dead-agent land
      failure** glossary terms (spec §6).
  12. **Release** — all four version slots bump in lock-step to the next free patch above the live
      integration base; `skills/war/assets/version-slots.test.mjs` is the arbiter.

## Build order (for /war)

- **Contention (verified):** the 2026-07-16 sibling specs overlap this plan only at
  `workflow-template.test.mjs` (structural-test-integrity), `skills/war/SKILL.md`
  (learnings-recipe-drift-sweep), and possibly `skills/war-campaign/SKILL.md`
  (campaign-anchor-comment-truth) — this plan is queue position 1 and lands first; later siblings
  rebase over its edits. The four release slots are serial by stack order, resolved at land time.
- **Why one content phase:** every surface can land together; the only ordering need is
  *within-phase* — the launch prose documents the stager's landed CLI, which is a `deps` wave edge,
  never a phase edge (nothing must be *landed* first except the release).

1. **Phase 1 — Land-failure routing, recovery prose, and dispatch identity**
   (wave 1: Task 1.1 ∥ 1.3 ∥ 1.4 ∥ 1.5, file-disjoint; wave 2: Task 1.2, `deps: [1.1]`)
2. **Phase 2 — Release** (four version slots, lands last per doctrine)

## Phase 1 — Land-failure routing, recovery prose, and dispatch identity

### Task 1.1: The stager — `stage-workflow.mjs` + tests (new files)

- Files: `skills/war/assets/stage-workflow.mjs`, `skills/war/assets/stage-workflow.test.mjs`
- Plan slice: New staging helper per spec decisions 6–8. **CLI** (suggested positional form, matching
  the `provision-worktrees.sh` precedent — Task 1.1 fixes the final shape; Task 1.2 documents the
  landed shape verbatim): `node stage-workflow.mjs <templatePath> <stagedDir> <planSlug> <phaseId>
  [campaignOrdinal] [--force]`. Behavior:
  - **Write-if-absent + `--force` (operator-ratified at the volley):** if
    `<stagedDir>/<derived basename>` already exists and `--force` is absent, leave it
    **byte-untouched**, print its absolute path, exit 0 — an existing staged file is the run's
    script (it may carry approved injected stages per spec decision 10, and a journal replay must
    see identical bytes even across a mid-run plugin upgrade). A deliberate restage passes
    `--force` — the only path that overwrites an existing staged file (fresh substitution from the
    current shipped template).
  - Otherwise read the template, replace **exactly once** each of the two meta anchor literals —
    the `name: 'war-phase'` literal and the shipped `description:` literal (`WAR per-phase
    execution: Work, Audit, Refine, Land, then Wrap-up learnings for one phase.`) — with the derived
    identity, `mkdir -p` the staged dir, write the file, print the staged **absolute path** (the
    `scriptPath` the Lead dispatches). Exit **non-zero with a named error** when either anchor is
    missing or matches more than once (fail-loud, never a silent fork). Nothing outside the two
    anchors changes; the fresh-write path is deterministic (same inputs ⇒ same bytes).
  - Export the two **anchor constants** (the single authoritative copy the anchor-guard test
    imports — never a second hardcoded set) with a mirror-side coupling comment naming
    `workflow-template.js`'s `export const meta` block as the canonical source and the anchor-guard
    test as the arbiter. Export pure `deriveName(planSlug, phaseId, campaignOrdinal?)` →
    `war-[c<K>-]<planSlug>-p<N>` (basename = that + `.js`; `meta.name` = basename minus `.js`) and
    `deriveDescription(...)` → `WAR phase <N> of <planSlug>[ (campaign plan <K>)]: Work, Audit,
    Refine, Land, then Wrap-up learnings.` — the title format lives in these two functions only.
    `planSlug` passes through **verbatim** (long dated basenames accepted — UI truncation beats
    lossy shortening; it is the same token branch names derive from).
  **Tests** (`stage-workflow.test.mjs`) — assert on staged **text** and the exported pure functions;
  **never `import()`/execute a staged copy or the shipped template** (the template's top-level body
  *is* the phase run). Each guard names its red condition (mentally-delete check):
  (a) `deriveName`/`deriveDescription` with and without an ordinal (red: format drift);
  (b) staging a minimal both-anchors fixture **and** the shipped `workflow-template.js` yields text
  carrying the derived meta literals, differing from the input in **exactly** the two literals —
  whole-file equality after substituting the shipped literals back (red: any stray rewrite);
  (c) missing-anchor and duplicated-anchor fixtures exit non-zero via
  `execFileSync(process.execPath, …)` against scratch dirs (red: delete the exactly-once check and
  the duplicated-anchor arm passes);
  (d) determinism — two fresh stagings byte-identical (red: timestamp/nondeterminism);
  (e) **write-if-absent** — a pre-existing staged file with *different* content is left
  byte-untouched, its path printed, exit 0 (red: overwrite regression — End state 7);
  (f) **anchor guard (End state 8)** — the shipped template contains exactly one occurrence of each
  **imported** anchor constant, line-scoped raw-source matching, **no block-comment-strip
  pre-pass** (#929, lesson `glob-literal-fools-block-comment-strip-regex-in-structural-tests`)
  (red: a second copy of an anchor literal anywhere in the template, e.g. a careless coupling
  comment);
  (g) **`--force` restage** — the same pre-existing different-content staged file is overwritten
  with a fresh substitution when `--force` is passed (red: flag ignored, stale bytes survive).
- requiresTest: true (mapped evidence: `stage-workflow.test.mjs` in this diff, matched by the
  `skills/**/*.test.mjs` floor pattern)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Terminal else arm + runbook/launch prose + drift-guard pin (coupled task)

- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`,
  `skills/war/SKILL.md`, `skills/war/assets/land-decision.test.mjs`
- Plan slice:
  - **Terminal else arm (`workflow-template.js`, spec decision 2):** on the primary land routing
    chain — the `landResult &&`-guarded arms that follow the `land:phase-<N>` dispatch under the
    `---- LAND — only when no hard escalation is open ----` banner comment (the `submodule-pr`
    direct return, the `HARD_ESCALATION_REASONS.includes(landResult.status)` arm, both
    `gate_failed` classification arms, the `error || gate_failed` demotion arm, the
    landed/opportunistic-resync arm) — append a **terminal `else`**: push
    `{ task: `phase-${ph.id}-land`, reason: landResult ? String(landResult.status || 'error') :
    'error', detail: landResult }` onto `escalated`, set `landDecision = 'held:land-failed'`, and
    `log` one line naming the dead/unrouted land dispatch. This mirrors the baseline-proceed
    re-land's existing `reLand ? reLand.status : 'error'` fallback idiom and catches **both** the
    null result and a non-null result whose status matches no routed value. **Partition note (keep
    as a code comment):** a land dispatch that *throws* still routes `held:workflow-error` via the
    existing top-level catch — this arm owns only the returned-but-unrouted case (the observed 529
    repro: run completed, `landResult: null`). Every existing arm is untouched byte-for-byte; the
    emitted-superset comment above the `let landResult = null` declaration **stays at 6 values**
    (`held:land-failed` is reused — ADR 0005; `land-decision.mjs` is deliberately absent from this
    task's Files). The fallback reason string is escalation metadata only, never an enum member
    (spec §8 latitude: a flat `'error'` for the non-null unrouted case is equally acceptable). The
    wrap-up gate (`landResult && landResult.status === 'landed'`) and the handoff condition are
    untouched — no `handoff` on `held:land-failed`, identical to today's routed `held:land-failed`
    paths (spec non-goal).
  - **Header comment (spec decision 10, same commit as the SKILL.md launch prose —
    standing/dispatched split):** update the header line `The Lead may inject APPROVED extra stages
    by editing a copy of this file` to name the **staged per-phase copy** (the `stage-workflow.mjs`
    output under the run's `.claude/war/runs/<runId>/` directory) as *the* sanctioned copy for
    approved stage injection. Also add the **canonical-side coupling comment** adjacent to the
    `export const meta` block naming `stage-workflow.mjs` as the anchor mirror — phrased
    **referentially, restating neither anchor's bytes** (quoting `name: 'war-phase'` in a comment
    would red Task 1.1's exactly-once anchor guard, which is already on the integration tip this
    worker rebases onto). The meta block itself is **byte-unchanged**.
  - **Engine tests (`workflow-template.test.mjs`)**, beside the existing
    `Task 5 — land step error → landDecision held:land-failed` tests: **(i)** Land-phase mock
    returns `null` → `held:land-failed`, **exactly one** escalated entry whose `task` ends `-land`,
    `reason === 'error'` (single-push proof); plus `servitorResult === null` and zero recorded
    `war-servitor` calls, annotated as pre-existing-behavior regression context (green even without
    the arm — the load-bearing assertions are the first two; red condition: delete the terminal
    else → `landDecision` reads `'landed'`). **(ii)** Land mock returns
    `{ mode:'land-phase', status:'bogus' }` → `held:land-failed`, never `'landed'` (same red
    condition). **(iii)** one line-scoped source-text assertion pinning the arm's attachment point
    via its unique discriminating token `landResult ? String(landResult.status || 'error') :
    'error'` (the baseline sub-chain's sibling fallback reads `reLand ?` — so this pin cannot
    silently migrate to the wrong chain; red condition: arm deleted or moved out of the primary
    chain). Line-scoped single-line regex over the raw `src`, in the style of the existing `#99`
    source-text test — **never** a block-comment-strip pre-pass (#929).
    **Land-mock inventory duty (survey-base finding + re-run):** verified at survey base — every
    impl reaching the Land dispatch returns an explicit routed `mode:'land-phase'` status and no
    test title/decoy comment describes the pre-fix fall-through, so **zero existing tests flip**
    under the new arm; re-run the inventory at the dispatch base (`grep -n "phase === 'Land'"` +
    the `landDecision, 'landed'` assertion sites), retitle any test whose semantics the arm changes
    **in the same commit** (relaxed-assertion lesson), and record the inventory in the commit-body
    `Survey:` block.
  - **`skills/war/SKILL.md` §4.3 `held:land-failed` bullet (spec decisions 4–5):** add root cause
    **(c) dead land agent** after (b), carrying the literal token `dead land agent` (End state 5's
    grep). Predicate — the escalated `phase-<N>-land` entry carries a **null/evidence-free
    `detail`** (the dispatch died producing no `MergeResult`; observed class: transient API 529
    with 0 tokens — `land-advance` never ran) **or a `reason` that is no `MergeResult` status**
    (an unrouted/contract-breaking return — same ownership: no trustworthy landing evidence either
    way); (c) is diagnosed from the escalation payload before probing (a)/(b)'s git predicates.
    Recovery — **step 0, already-landed probe** (the dead-AFTER-push case): `git -C <_refinery>
    fetch origin <working>` then `git merge-base --is-ancestor <integration-tip>
    origin/<working>`; when it holds, the dispatch died *after* its CAS push succeeded — the land
    already happened: record it (ledger/epic close per the manual-land bookkeeping), run the
    closing `sync-follower` assertion, and proceed to the existing "Capture learnings on every
    landed phase" manual-servitor step (`servitorResult` is absent — the Lead spawns the servitor
    itself); **never** re-merge (a second `--no-ff` merge would mint an empty phantom phase
    commit). When the probe fails, run the **same one-primitive land every land uses** — the
    escalation-completion recipe already in §4.3 (fetch, detach `_refinery` at `origin/<working>`,
    `git merge --no-ff` the integration tip, resolved gate, a **single** `land-advance`, closing
    `sync-follower` assertion; the detached-`_refinery` topology is collision-safe, so no
    (a)-interaction) — or the full [Recovery relaunch](#recovery-relaunch) when the operator
    prefers a fresh run; same green-gate guard and `--afk`-auto / interactive-offer discipline as
    (a)/(b). In the **same bullet**, the anti-hint warning: the Workflow tool's printed
    `resumeFromRunId` hint is generic harness text — following it after a land failure
    re-dispatches the already-merged tasks' `merge:*` agents **live** (the journal replay re-runs
    the gate and the push-first CAS, design.md §6) and is exactly wrong during a transient-API
    window when the integration tip is already complete and green; `resumeFromRunId` stays
    `held:phase-incomplete`-only, **never** for a land failure.
  - **"Resume vs. recovery relaunch" paragraph:** add the same one-sentence hint warning (spec
    decision 5).
  - **Per-phase launch prose** (the `Run **one Workflow per phase**` paragraph): insert the staging
    step — resolve the run's staged-scripts directory `$MAIN/.claude/war/runs/<runId>/` (the
    per-run directory **sibling of the run manifest** `<runId>.json`, same Lead `runId` =
    `<plan-slug>-<YYYY-MM-DD>`, using the **same main-checkout anchor idiom the Run-manifest
    section already documents** — no new anchor code; untracked-ness rides the existing
    `ensure-exclude`, no `.gitignore` change); run the **landed** `stage-workflow.mjs` CLI
    (document the real CLI exactly as merged by Task 1.1) with the shipped template path, the
    staged dir, `planSlug`, `phase.id`, and the optional campaign ordinal (from the `/war`
    invocation's `--campaign-ordinal <K>` when present; absent ⇒ the `c<K>` segment is simply
    omitted — `/war` never scans campaign ledgers itself); dispatch the **printed staged absolute
    path** as the Workflow `scriptPath` — never `assets/workflow-template.js` directly. Note the
    write-if-absent semantics: a same-run relaunch or resume **reuses** the existing staged script
    (injected stages and replay stability survive); a deliberate template-edit propagation passes
    `--force`. Optional fail-open telemetry (latitude): record the staged path in the run
    manifest's phase-launch stamp — never resume input. Extend the `/war` **usage line**
    (`/war <plan-file> [--working <branch>] …`) with `[--campaign-ordinal <K>]`.
  - **`held:phase-incomplete` resume bullet:** resume passes the **same staged scriptPath** the
    launch used — `Workflow({ scriptPath: <staged path>, resumeFromRunId })` — stable across Lead
    restarts (staged copies persist for the run's life, never in a reapable worktree).
  - **Drift-guard pin (`land-decision.test.mjs`, spec decision 11):** ONE new prose pin,
    **region-scoped + case-tolerant + mid-sentence-anchored** (lesson
    `prompt-only-clause-grep-guard-must-tolerate-sentence-case`): extract the §4.3
    `held:land-failed` bullet by its `**\`held:land-failed\`**` bold header (ending at the next
    `- **` bullet header), then assert the region pairs `resumeFromRunId` with a negation token
    (never/not/forbidden), case-insensitive. Discrimination is structural: the bullet carries **no**
    `resumeFromRunId` token today (the file's six existing never-resume sites all live outside it),
    so the pin is **provably red pre-fix** — paste the failing run as a `Red-proof:` block in the
    commit body. The existing 4-surface doc-parity tests and negative guards stay green
    **unmodified** — the SKILL.md edits must leave the `` `landDecision` ∈ `` return-contract line
    and the `not in the known set` §4.2 line intact with unchanged token sets (the parity suite is
    the mechanical arbiter — End state 4).
  - **Sweep (End state 10, grep floor + mandatory survey):**
    `grep -rn "resumeFromRunId" skills/ agents/ docs/adr/` at the dispatch base — verify every hit
    consistent with the guidance. Known hit set at authoring (snapshot, non-authoritative):
    `skills/war/SKILL.md` (owned — corrected here), `skills/war/references/schemas.md`
    `held:phase-incomplete` bullet (consistent — that *is* the legitimate resume case),
    `skills/war/references/design.md` §6 (the contract statement — consistent),
    `workflow-template.js` comment (owned), `war-config.test.mjs` doc-contract G (already pins the
    recovery-relaunch never-`resumeFromRunId` clause — must stay green untouched),
    `docs/adr/0005`/`0008`/`0021` (**verified consistent at authoring**: ADR 0005's
    "`resumeFromRunId` is the only safe re-attempt" is scoped to *dead phases*
    (`held:phase-incomplete`), and a `held:land-failed` phase is a completed workflow — verify-only;
    were any ADR statement judged genuinely inconsistent, route a follow-up proposing a **dated
    amendment**, never an in-task rewrite of a ratified decision record). **Grep is a completeness
    floor, not a ceiling — after the grep, hand-scan SKILL.md's Resume and Checkpoint sections and
    the template's prompt text for same-meaning stragglers phrased without the token ("resume the
    run", "replay the journal") and list each as a survey-derived correction** when inside this
    task's Files; anything outside routes to a Lead-filed follow-up issue. Record the full outcome
    as a `Survey:` block in the implementation commit body.
- requiresTest: true (mapped evidence: the `workflow-template.test.mjs` and
  `land-decision.test.mjs` changes in this diff)
- requiresPackaging: false
- deps: [1.1] (wave edge — the launch prose documents the stager's **landed** CLI, live-artifact
  rule, and the anchor guard is already on the tip to police the meta-adjacent comment edit)
- target repo: superproject

### Task 1.3: schemas.md — dead-land-agent root cause on the `held:land-failed` bullet

- Files: `skills/war/references/schemas.md`
- Plan slice: Extend the `- **`held:land-failed`**` description bullet (under the
  `The full \`landDecision\` enum:` anchor): the in-flow land step failed **or the land dispatch
  died / returned an unrouted result** — a dispatch that died producing no `MergeResult` routes
  here with `reason:'error'`, `detail:null`; the Lead re-runs the land per SKILL.md §4.3's
  root-cause branches. Edit **only** the description text after the bold header: the
  `landDecision:` enum union line and every per-value bullet **header** must survive intact — the
  doc-parity (c)/(d) extractions in `land-decision.test.mjs` are the mechanical arbiter
  (End state 6). The `held:phase-incomplete` bullet's `resumeFromRunId` mention is out of scope
  here (Task 1.2's sweep verifies it; it is the legitimate resume case).
- requiresTest: false — description-prose only; the existing `land-decision.test.mjs` parity suite
  is the guard, unmodified (no-test route recorded here for the floor)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: war-campaign — thread the queue ordinal (spec decision 9)

- Files: `skills/war-campaign/SKILL.md`
- Plan slice: In step 4 (**Execute**) of the per-plan lifecycle, thread the plan's campaign ordinal
  onto the `/war` invocation:
  `/war <plan> --working dev/<slug-N> --landing dev/<slug-(N-1)> --campaign-ordinal <N> --afk --ace`
  — plus one sentence: the ordinal is the plan's **1-based position in the ledger's `plans[]` queue
  at selection time** (the step-1 `next` pick — the same position the `dev/<slug-N>` stacking
  derives from); it is **display identity only** — `/war` uses it solely to stamp the
  `war-c<K>-…` staged phase-script basenames and never scans campaign ledgers itself; a plain
  `/war` run omits the flag and the `c<K>` segment is simply absent. The `--campaign-ordinal <K>`
  flag literal is **pinned by this plan** on both surfaces (this task and Task 1.2's launch prose)
  so parallel authoring cannot diverge.
- requiresTest: false — prose-only (docs tier)
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.5: ADR + CONTEXT.md glossary terms

- Files: `docs/adr/0037-run-scoped-staged-phase-scripts.md`, `CONTEXT.md`
- Plan slice: Author the ADR recording the **run-scoped staged phase scripts** contract (spec §7;
  resolve the number to the **next free ADR at land time** — 0037 as of authoring,
  non-authoritative): per-phase dispatches run a run-scoped staged copy
  `war-[c<K>-]<planSlug>-p<N>.js` under `$MAIN/.claude/war/runs/<runId>/`, because the harness
  renders the workflow title from the dispatched script's **basename** and the description from
  `meta.description` — so both are substituted **pre-dispatch as pure literals** (the sandbox has
  no shell/fs; runtime values are deferred to agents, never computed by the template); the stager's
  replace-exactly-once fail-loud rule (missing/duplicated anchor ⇒ non-zero exit, never a silent
  fork); **write-if-absent reuse with the explicit `--force` restage escape hatch** (an existing
  staged file is the run's script — approved stage injections and journal-replay byte-stability
  survive restaging; a same-`runId` recovery relaunch or plain re-run benignly reuses the same
  staged script, since the Lead `runId` is `<plan-slug>-<YYYY-MM-DD>` and can recur same-day; a
  deliberate template-edit propagation passes `--force`); the staged-copy home and
  **manifest-equivalent retention** (kept, not reaped — dispatch provenance for `/war-review`); the
  resume same-scriptPath requirement; and the staged copy as the sole sanctioned home for approved
  stage injection. Note in the ADR's context that the null-arm routing fix needs **no** new ADR —
  it operates entirely inside ADR 0005's reuse discipline. Add the two `CONTEXT.md` glossary
  entries per spec §6 in the existing entry style: **Staged phase script** and **Dead-agent land
  failure**. Annotate `stage-workflow.mjs` references as *defined-but-not-yet-emitted; produced in
  Task 1.1 (same phase)* so an auditor cross-links the producing task rather than flagging a
  dangling ref.
- requiresTest: false — docs-only (docs tier)
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: This plan changes engine behavior (`workflow-template.js`), ships a new asset
  (`stage-workflow.mjs`), and rewrites shipped skill prose — users only receive it via a release.
  Bump all four release slots together to the **next free patch above the live integration base at
  land time** (never a resolved semver literal, per the /war-strategy §2 next-free-patch
  convention): `plugin.json` `version`, `marketplace.json` `metadata.version` **and**
  `plugins[0].version`, and the `README.md` `## Status` line (replace-in-place, never emptied, no
  badge). Expected integration base: the working-branch tip after this plan's Phase 1 lands — this
  plan is first in its campaign, stacking on the live master tip; if anything else lands first, its
  bumps advance the base (version literals anywhere are non-authoritative — the stacked-release lag
  lesson). Standalone fallback: a run of this plan through plain `/war` resolves the next free
  patch from the four slots itself. `skills/war/assets/version-slots.test.mjs` is the lock-step
  arbiter — a partial bump is a red test (End state 12).
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Live staged-dispatch observation (spec criterion 11 + harness-unknowns probe): after the first
  staged dispatch on the released plugin, the /workflows UI renders the phase title as
  `war-[c<K>-]<planSlug>-p<N>` with the plan+phase description, **and** one
  `held:phase-incomplete`-class resume passing the **staged** scriptPath replays cleanly (whether
  the harness keys `meta.name`/journal identity beyond display is unknowable from this repo) · why
  deferred: the title renderer and resume validation are harness-owned and only observable live; the
  automated proxy is End state 7's basename/meta assertions · runner: operator, at the next `/war`
  phase launch (and first natural resume) on the released plugin.
- Out-of-footprint sweep stragglers: any End-state-10 `resumeFromRunId` (or same-meaning) hit
  needing correction outside Task 1.2's Files — including any ADR judged to need a dated
  amendment — is found-but-not-corrected in-task · why deferred: editing it in-task would break
  Phase-1 file-disjointness, and ratified ADRs take amendments via review, not in-task rewrites ·
  runner: the Lead files one follow-up issue per straggler at phase close, from the `Survey:` block
  (ADR 0017 — named owner, never a prose waiver).

## Notes / conscious deviations

- **Throw/null partition (grill Q4, verified in-tree):** the template's whole body runs inside
  `try{}` whose catch routes `held:workflow-error` — a *throwing* land dispatch already routes there
  (HARD, no re-land) and is untouched; the terminal else owns only the *returned*-but-unrouted case,
  which is the observed 529 repro (run completed, `landResult:null`, handoff present). The two
  constructs partition the failure space; a code comment on the arm states this.
- **Task 1.2 is deliberately one coupled task (grill Q29):** the else arm and the header/meta
  comments share `workflow-template.js`; the header comment and the launch prose must share a commit
  (standing/dispatched split); the never-resume pin travels with the prose it guards. **Revert
  coupling (accepted):** reverting the identity rider alone means reverting Task 1.1 *plus* Task
  1.2's launch-prose paragraphs — the spec bundles both concerns; a partial revert that left SKILL.md
  pointing at a deleted `stage-workflow.mjs` is forbidden by the same standing/dispatched rule that
  coupled them.
- **`deps: [1.1]` on Task 1.2, not a phase edge:** "add X" + "document/invoke X from Y" = one phase,
  two waves; the wave-2 worker documents the stager's **landed** CLI and is policed by the
  already-merged anchor guard while editing meta-adjacent comments.
- **Write-if-absent + `--force` staging (grill Q15/Q16/Q21 — operator-ratified (b) at the volley):**
  refines spec decision 7's "idempotent restaging" into stage-once, reuse-per-run-dir with an
  explicit restage flag. Forcing constraints: decision 10 makes the staged copy the sanctioned
  injection home (a silent overwrite restage would clobber approved injections), and spec §8
  requires scriptPath byte-stability under journal replay even across a mid-run plugin upgrade.
  Consequence: the same-day `runId` collision (`<plan-slug>-<YYYY-MM-DD>` recurs for a recovery
  relaunch or plain re-run — spec decision 8's "new runId ⇒ own directory" holds only across
  days/distinct runIds) is **benign reuse by construction**: same phase ⇒ same basename ⇒ the
  correct script is reused; different phases never collide. An operator who edits the *shipped*
  template mid-run propagates it with `--force` — documented in the ADR.
- **Ordinal is display-only, frozen at selection time (grill Q17):** K is read from the ledger's
  `plans[]` at the step-1 `next` pick; a later inbox `sweep` can shift not-yet-run plans' positions,
  so two runs of one campaign *can* render the same `c<K>` for different plans — accepted:
  provenance disambiguates via run dir + slug in the basename; no ledger stamp, no stability
  contract (YAGNI).
- **Stager stays fs-only (grill Q20):** no git probe inside `stage-workflow.mjs` — destination
  anchoring is the Lead's launch-prose duty via the already-documented run-manifest `$MAIN` idiom;
  an unconditional git probe would create the test-hermeticity coupling the
  `git-probing-hook-requires-fixtures-outside-any-git-repo` lesson records. Deliberate, recorded.
- **Mirrored-pairs inventory (grill Q10/Q11):** (1) inline `HARD_ESCALATION_REASONS` — untouched,
  pinned by the existing inline-mirror drift guard; (2) the 6-value emitted-superset comment —
  untouched, pinned by the `behavioral ⊆: exactly 6` test; (3) template header comment ↔ SKILL.md
  launch prose — one task/commit (Task 1.2), the new header wording itself **unguarded: accepted
  residual** (an engine-comment prose-drift guard is the guard class the gate-evidence plan's #892
  precedent declined to open; the load-bearing facts are covered by the anchor guard and the
  SKILL.md pin); (4) stager anchors ↔ template meta literals — a real third copy, guarded by the
  imported-constant anchor test plus two-sided coupling comments, the template side phrased
  referentially (restating an anchor's bytes in a comment would red the exactly-once guard).
- **Anchor-guard placement (grill Q24):** `stage-workflow.test.mjs`, not
  `workflow-template.test.mjs` — it imports the stager's exported anchors (no fourth copy), and it
  keeps this plan out of the structural-test-integrity sibling's census footprint; cross-file
  reads are the repo norm (`land-decision.test.mjs` already reads the template via `readAsset`).
- **Survey-base zero-flip finding (grill Q22/Q23):** all Land-phase mock sites in
  `workflow-template.test.mjs` return explicit routed `mode:'land-phase'` statuses and no
  title/decoy comment describes the pre-fix fall-through — no existing test flips under the arm;
  Task 1.2 re-runs the inventory at its dispatch base and retitles in-commit if that changes.
- **Test (i)'s servitor assertions are regression context, not proof (grill Q26):** the wrap-up
  gate already skips the servitor on a null result pre-fix; the load-bearing assertions are
  `landDecision` and the single `-land` escalated entry.
- **No handoff on `held:land-failed` (grill Q8):** identical to today's routed `held:land-failed`
  paths — the phase report + ledger carry the debt, and after a (c)-recovery manual land the next
  phase decomposes from plan + ledger exactly as after any manual land today.
- **No auto-resume leak (grill Q9, verified):** a dead-land phase returns `status: completed`, so
  §4.2 step 1 never classifies it `held:phase-incomplete`; step 3 takes the returned
  `held:land-failed` straight to the §4.3 bullet — which is where the anti-hint sentence sits, the
  exact prose an `--afk` Lead reads at that moment.
- **Null-result hardening of other dispatch sites is a spec §9 non-goal (grill Q3):** deliberately
  out of scope and absent from End state, so gate-audit cannot score the asymmetry unmet; a broader
  sweep is a separate survey if wanted.
- **§8 latitudes are design latitudes, not validations (grill Q30):** the fallback-reason string
  form, the optional manifest cross-link, and long-basename acceptance decide *shapes*, not checks —
  nothing validation-shaped lives only in prose, so no ADR 0017 waiver exposure.
- **CLAUDE.md's "docs/adr/ (0001–0022)" range prose is stale (grill Q27, observed in passing):**
  ADRs reach ≥0036; CLAUDE.md is out of this plan's footprint and high-contention across siblings —
  noted for a doc-truth sweep, not edited here.
- **ADR number 0037 and the known sweep-hit list are survey-base snapshots** — resolve/re-run at
  implementation time (stacked-plan literal lesson).
- **requiresTest/tier routing:** Tasks 1.3/1.4/1.5 are all-`.md` docs-tier tasks; Tasks 1.1/1.2
  route the base worker tier with mapped `skills/**/*.test.mjs` evidence in-diff;
  requiresPackaging false everywhere (meta-repo, no Dockerfile in the footprint).
- **Anchors by named construct throughout** — the LAND banner comment, the `land:phase-<N>` label,
  the `relandDiscrimination` helper, `export const meta`, `let landResult = null`, the
  `Run **one Workflow per phase**` paragraph — never line numbers (the issue's reader evidence was
  line-numbered; line numbers rot across the serial merge queue).

## Open decisions

- None — the single operator survivor (stager restage semantics) was ratified at the volley:
  **write-if-absent + explicit `--force` restage**.
