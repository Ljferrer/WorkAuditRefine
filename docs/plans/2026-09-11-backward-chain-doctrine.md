# Backward-chain doctrine — worker, plan author, auditor, fixer chain from the End state

Authored by `/war-strategy` (bare invoke, interview 2026-09-11). Source knowledge: the
`reverse-engineer` skill (work backward from the outcome, find the one bottleneck, chunk with a
done test, route to one next action, say what to ignore) and *The ONE Thing* (Keller & Papasan:
the Focusing Question, the success list versus the to-do list, Goal Setting to the Now, the
accountability cycle). Purpose: fewer corrective rounds to a unanimous, high-confidence audit pass.

**Evidence consumed** — one row per linked artifact:
- issue #2097 (the operator's 20-comment retrospective, 10 sequences with per-round tables) · read via research agent
- PR #2220 (Snipe auditor + fixer discipline injection; the reference-file shape this plan copies) · read
- `docs/port/snipe/*` on `master` and on `origin/codex-port`, plus `docs/port/2026-09-09-engine-pr-2297-finalization-ledger.md` · read via research agent
- `adapters/codex/skills/snipe/references/{auditing-fixes,post-audit-fixes}.md` at `origin/codex/engine-integration` · read via research agent
- 34 issues labeled `enhancement` (open + closed) · read via research agent; 20 relevant, 9 not
- epic phase reports #2101–#2106, `war-followup` issues, `docs/red-team/*.md`, `docs/learnings/*.md` · read via research agent
- AutoIndex `docs/monitoring/alert-audit-2026-09-09/*` (private org repo, local clone) · read via research agent; cited only abstracted (PIN-9)
- *The ONE Thing* checklists · read via research agent from secondary sources; the book's closing per-domain checklist stayed unverified (paywalled) and is not cited
- OpenAI "The Hugging Face incident and the road ahead" (2026-08-26), METR/Redwood independent investigation (2026-08-26) · read via web search + the forked session's deep read (user-supplied handoff); the "Trilogy" poll name and the 533-to-1 figure stayed unverified and are not cited
- `skills/war/references/fix-round-doctrine.md`, `agents/war-worker.md`, `agents/war-auditor.md`, `skills/war/assets/workflow-template.js` prompt builders, `skills/war-strategy/references/plan-interview.md`, `skills/war-machine/SKILL.md` §2 · read at `668e4ff9`
- issue #2302 (the study tracking issue this interview filed) · read (authored at this interview)

## Context — the gap / problem

- A fix worker patches the one site a seat named, and the next round blocks on a sibling site, a
  residue of the fix, or the cause one link upstream. Across 17 recorded sequences the next
  blocker was a sibling 19 times, fix residue 17, a test oracle 12, a consumer 9, an upstream
  cause 8, a premise 4, a regression 3 (verified: research digest of #2097, `docs/port/snipe/*`,
  AutoIndex alert audits, at `668e4ff9`).
- #2097 Thread B took eight rounds to land one dedup lookup. Every intermediate step was a
  correct local fix to the named site (verified: issue #2097 (2026-09-07)).
- Unanimity came every time the fix was stated as one shared predicate, helper, or proof with a
  proven-red control. It never came from the seat's `fix:` line as written (verified: research
  digest of PR #2297 candidates 1–13 and #2097, at `668e4ff9`).
- `fixRounds` under-reports oscillation: it is 0 on 12 of 14 phases of the newest run. The
  oscillation lives in the ace ladder (14 of 26 tasks spent all 6 charges) and in round-0
  escalations (verified: epic phase reports #2101–#2106 and `.claude/war/runs/` manifests, at
  `668e4ff9`).
- The current fix-round doctrine (`fix-round-doctrine.md`) is site-to-class only. It has no
  backward chain from the End state, no bottleneck-first rule, no ignore-for-now rule, no premise
  check on the finding, and no rule for a class that re-opens one hop per round (verified: the
  file at `668e4ff9`).
- The 2026 OpenAI / Hugging Face incident shows the mirror failure: agents ran a correct backward
  chain toward a scoring rule that did not exist, re-locked their finish line on a peer's say-so,
  and never had a rewarded exit (verified: OpenAI report 2026-08-26, METR/Redwood report
  2026-08-26; the forked session's handoff (user)).
- Every WAR prompt surface is split: standing card in `agents/*.md`, dispatched prompt string-built
  in `workflow-template.js`, with a byte-equal fixture between a `references/` home and the
  prompt (verified: `FIX_ROUND_DOCTRINE_CLAUSE` and its fixture at `668e4ff9`). The stripped
  template has 49,082 bytes of headroom under the args-headroom line (verified: measured with
  `stripFullLineComments` at `668e4ff9`).

## Pivotal constraints

- No schema change: the chain rides in existing fields (`notes`, `rationale`, commit body) (user).
- `run.roundLimit` and `run.absorbRounds` are a safety bound, untouched (PIN-2 ‡).
- The auditor stays read-only; the git verb allowlist is not widened.
- The merged-plan extraction headings stay untouched; the plan-side `Critical path` block is Part 1
  placement latitude, never a new required H2.
- Standing card and dispatched prompt change in the same task (CLAUDE.md prompt-surface rule).
- ADR 0042 hot/cold law: doctrine lives in `references/` with a `when <trigger>, read …` pointer;
  only the `## The rules` blocks ride the prompts byte-equal.

## Resolved design tree

| # | Decision | Resolution | Source | Pins · landing class |
|---|----------|------------|--------|----------------------|
| D1 | Scope | Four roles: worker (first pass), plan author (war-machine drafter + war-strategy interview), auditor on corrective round ≥ 2, fixer on every fix-applying build | (user) | slice |
| D2 | Transport | Convention inside existing fields. Worker `notes`: `Critical path:` then `Ignore for now:`. Fix commit body: `Outcome:` `Chain:` `Bottleneck:` `Fix:` `Ignore for now:`. Auditor `rationale`: `upstream link:` then `relation: <tag>` as the last line. No new schema field | (user) | PIN-4→guardrail |
| D3 | Plan-author home | One file, two pointers: the drafter reads it at spawn, the interview at stage 1b | (user) | slice (T1.5, T2.2) |
| D4 | Corrective round | fix rounds + ace charges (`absorbRounds`); the phase-close sweep and the terminal pass are round 1 by definition | (user) | PIN-5→guardrail |
| D5 | Reach | All seven fix-applying builds carry the fixer block: FIX_NEEDED, ace subset, ace re-entry, ace advisory polish, floor family, phase-close sweep, terminal pass. Rules #2127 | (user) | PIN-6→guardrail |
| D6 | Disclosure chain | Five files. Depth sections in the fixer and audit files keyed on the corrective round. The auditor is the classifier: its `relation:` tag selects the fixer's examples section. No new dispatch site; the classifier subagent is deferred to #2302 | (user) | PIN-7→guardrail |
| D7 | Re-opening class | A class that re-opens one hop per round is a shape signal, never an escalation. Rounds 3–4 reframe: read the history as one chain, re-lock on the cited End state and the intent only, ask the Focusing Question over the whole history, extract the one change | (user) | PIN-11→slice (T1.1) |
| D8 | Round bound | The bounded fix and ace rounds are a safety precaution, not only a cost budget (the incident: 500+ agents on impossible tasks for days). No task raises, removes, or routes around the bound; no doctrine text treats it as an obstacle | (user, forked session) | PIN-2→guardrail ‡ |
| D9 | End-state exit | The option to call an End state a plan defect discloses at corrective round ≥ 5, never earlier, as its own tier `## Round 5 and later` in the fixer and audit files; the engine pointer names it only at ≥ 5. The slice-level `PLAN-DEFECT:` route on the worker card stays available at every round, unchanged | (user, forked session) | PIN-3→slice (T1.1, T1.2, T2.1) ‡ |
| D10 | Incident corrections | (a) re-lock only on the plan's End states and the Commander's Intent, never on a peer finding or own inference; (b) the round-5 exit is a completed outcome, not a failure; (c) a re-opening class is not a plan defect, a wrong or impossible End state is; (d) the outcome line cites the End state number or `Done when:` it chains from; (e) the markers are self-reports: the auditor's own chain is the oracle, #2302's adherence count is the audit over time | (user, forked session) | slice (T1.1, T1.2, T1.3) |
| D11 | History digest | From corrective round 2 the engine threads, to the fixer and the auditor: per prior round each blocker's title, file, severity, `relation:` tag, `upstream link:` line; the fix commit's `Fix:` and `Ignore for now:` lines; one line per task with the relation-tag sequence by round; the worker's round-1 `Critical path:` block; full `rationale` + `suggested_fix` for PIN-29 survivors only. The audit log is in-memory until phase return, so the digest is the fixer's only view of history | (user) | PIN-8→guardrail |
| D12 | Sourcing | Entries from private external repos carry `Source: external (private), abstracted`, with no repo name, number, or infrastructure detail. WAR entries keep issue + comment. Every new entry gets a manual redaction check | (user) | PIN-9→guardrail |
| D13 | Round-1 audit bytes | Round-1 audit prompts stay byte-identical to today; a pinned fixture in `workflow-template.test.mjs` asserts it | (user) | PIN-10→slice (T2.1) |
| D14 | Skeletons | The five reference files carry exactly the headings, rule lists, depth sections, tables and seed entries agreed at Q6–Q10 (recorded in `## Notes / conscious deviations` → Skeleton record). No rule dropped, none added | (user) | PIN-1→guardrail ‡ |
| D15 | Tag drift guard | Four surfaces carry the relation-tag vocabulary: the audit rules block, the fixer file's Round 2 table, the examples file's H2 list, the engine regex. One guard asserts H2 set = tag set ∪ {convergence}; T1.6 binds the three file surfaces, T2.1 adds the engine regex | [assumed: the fixture reads the files and the template's exported regex — if wrong: the guard reads a mirrored literal and joins the mirror registry] | slice (T1.6, T2.1) |
| D16 | Examples bank growth | An entry joins by reviewed PR, or by the Lead's Gate-2 commit when `commitLearnings` is on. The servitor never writes the bank. The file opens with a one-line-per-H2 index; no tag ⇒ the fixer self-selects; N tags ⇒ N sections | (user) | slice (T1.4) |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | The three rules blocks, seven pointers, and the digest builder cost under 12,000 bytes of the 49,082-byte stripped headroom | measured at `668e4ff9`; the fixer block is one constant interpolated seven times | template over the args-headroom line → shorten blocks or strip comments | End state 10 (gate) |
| A2 | The five new references files join `VERB_SCAN_EXCLUSIONS` in the placement census (they phrase no scanned CLI) and never `QUALIFIED_HEADERS` (they are not eviction destinations with a byte-identity header claim) | read `doc-cli-consistency.test.mjs` and `reference-link-integrity.test.mjs` at `668e4ff9` | the census names the right list in its red message | End state 9 (gate) |
| A3 | `auditPrompt` takes the corrective round as a parameter and emits an empty clause at round 1, so round-1 bytes never change | the `intentClause` empty-string threading pattern | PIN-10 fixture red → the clause guard moves | End state 4 (check) |
| A4 | The history digest stays compact: titles and tags, plus full text for PIN-29 survivors only | operator ruling at the mid-budget checkpoint | the fixer misses a detail it cannot recover, because the audit log is in-memory until phase end | End state 6 (check) |
| A5 | The release lands at the next free patch above the live base (the version the slots carry at the rebased base) with a `CHANGELOG.md` entry | the four-slot lock-step test | `version-slots.test.mjs` red | End state 13 (gate) |
| A6 | Seats write `relation: <tag>` as the exact last line of the rationale, so one regex reads it | the exact-form instruction in the audit rules block | no tag → the fixer self-selects from the bank's index (in-band fallback, D16) | End state 7 (check) |
| A7 | A `Critical path` block in Part 1 of a plan is read by no extraction surface | extraction reads the H2 headings named in CLAUDE.md; the Evidence consumed block is the precedent | `/red-team` spine or `/war` decompose misreads it → move it under an existing Part 1 H2 | End state 11 (check: the advisory lint + `/red-team` on this plan) |

## Non-goals / deferred

- Any change to `run.roundLimit` or `run.absorbRounds`, their defaults or validation (PIN-2 ‡).
- New schema fields (`critical_path`, `upstream_link`); #2302 holds the trigger that would revisit this.
- A classifier subagent that picks the fixer's example batch; deferred to #2302 until the bank outgrows a one-section read.
- The `/red-team` spine: the reachability probe does not join it in this plan. Follow-up pointer: file a `war-followup` issue at land naming `skills/red-team` and the probe body in `backward-chain-plan.md`, so joining the spine is a conscious later decision.
- The two `/war-review` counts (marker adherence, sibling re-block rate); #2302 owns them.
- Rewording the ten rules of `fix-round-doctrine.md`; the fixer file composes with them (chain first, then the ten rules) and never restates them.
- The Lead's own prompts in `skills/war/SKILL.md`; the Lead threads nothing new by hand (the engine builds the digest).

## New domain terms · Recommended ADRs

Terms for `CONTEXT.md` (T2.3): **corrective round** (any round that changes code after an audit: a fix round or an ace charge; the sweep and the terminal pass count as round 1); **relation tag** (the auditor's one-word classification of how a new blocker relates to the last fix: sibling, residue, oracle, consumer, upstream, premise, regression, off-path); **critical path block** (the worker's or plan's numbered backward chain with a done test per link and the bottleneck marked); **history digest** (the compact per-round record the engine threads from corrective round 2).

Recommended ADR (T2.3): `docs/adr/0052-backward-chain-doctrine-and-corrective-round-disclosure.md` — the four-role chain, progressive disclosure keyed on the corrective round, the auditor as classifier, the round bound as a safety precaution (PIN-2), the round-5 End-state exit (PIN-3), and the no-schema transport.

## Commander's Intent

- **Purpose:** every corrective round moves the task toward a unanimous pass, because every role chains backward from the cited End state and fixes the class at its earliest unmet link. Fewer rounds, and no round wasted on a site patch, an off-path finding, or a finish line nobody locked.
- **Method:** one reference file per role plus an examples bank; the `## The rules` blocks mirrored byte-equal into the dispatched prompts; depth sections disclosed by the corrective round; the auditor tags each re-block with a relation tag that selects the fixer's examples; a compact history digest threaded from round 2; the End-state exit disclosed at round 5 and scored as a completed outcome.
- **Mechanism latitude:** the corrective-round helper's name and placement; the exact regex that reads `relation: <tag>`; the formatting of the history digest and of the threaded `Critical path:` block; the fixture shape that pins byte equality and the four-surface tag set; the pointer sentence wording on the cards within the fixed `when <trigger>, read references/<file>` shape; section prose inside each reference file within the agreed headings, rule lists, tables and seed entries; substituting any of these mechanisms while the End states and binding guardrails hold is not a plan deviation and warrants no issue.
- **Binding guardrails:**
  - G1. PIN-1 ‡: the five skeletons as agreed (Skeleton record below). No rule dropped, no rule added.
  - G2. PIN-2 ‡: `run.roundLimit` and `run.absorbRounds` untouched. No doctrine text treats them as an obstacle.
  - G3. PIN-3 ‡: the End-state exit discloses only at corrective round ≥ 5; the slice-level `PLAN-DEFECT:` route stays available at every round.
  - G4. The auditor stays read-only; the git verb allowlist is not widened.
  - G5. No schema change (PIN-4). Round-1 audit prompts byte-identical to today, pinned by a fixture (PIN-10).
  - G6. The merged-plan extraction headings stay untouched; the `Critical path` block is Part 1 latitude.
  - G7. External private sources land abstracted, with no repo name or number (PIN-9).
  - G8. Cards and dispatched prompts change in the same task, never split.
  - G9. The corrective-round definition: fix rounds + ace charges; sweep and terminal pass = 1 (PIN-5). The arithmetic is floor because PIN-3 keys on it.
  - G10. All seven fix-applying builds carry the fixer block, the floor family included (PIN-6).
  - G11. The history digest field set as settled (D11, PIN-8). Formatting is latitude.
  - G12. No new dispatch site; the classifier is deferred to #2302; the servitor never writes the examples bank (PIN-7).
- **End state:**
  1. Five reference files exist at the agreed paths, each with exactly the agreed H2 set, rule count, tables and seed-entry slugs; the examples file opens with a one-line-per-H2 index · check: `node --test skills/war/assets/backward-chain.test.mjs`
  2. All seven fix-applying builds render the fixer `## The rules` section byte-equal to `backward-chain-fix.md`, and each names the depth section for its corrective round · check: `node --test skills/war/assets/workflow-template.test.mjs`
  3. The WORK prompt renders the worker `## The rules` section byte-equal to `backward-chain-worker.md` · check: `node --test skills/war/assets/workflow-template.test.mjs`
  4. The audit prompt at corrective round 1 carries no backward-chain clause and equals the round-omitted build byte-for-byte; at round ≥ 2 it carries the audit `## The rules` section byte-equal to `backward-chain-audit.md` · check: `node --test skills/war/assets/workflow-template.test.mjs`
  5. The corrective-round helper returns fix rounds + `absorbRounds` for the per-task builds and 1 for the sweep and the terminal pass; the `## Round 5 and later` pointer appears iff the helper returns ≥ 5 · check: `node --test skills/war/assets/workflow-template.test.mjs`
  6. From corrective round 2 the fixer and audit prompts carry the history digest with the D11 field set, the relation-sequence line, the worker's `Critical path:` block, and full text for PIN-29 survivors only · check: `node --test skills/war/assets/workflow-template.test.mjs`
  7. The relation-tag vocabulary is equal across the audit rules block, the fixer Round 2 table, the examples H2 list (∪ {convergence}) and the engine regex, and the regex reads a `relation: <tag>` last line · check: `node --test skills/war/assets/backward-chain.test.mjs skills/war/assets/workflow-template.test.mjs`
  8. `run.roundLimit` and `run.absorbRounds` defaults and validation are unchanged, and no new doctrine text names either as an obstacle · HARD at audit_sha (the diff touches neither in `war-config.mjs`; the five files carry no sentence that treats the bound as a wall; judged by every seat)
  9. The placement census is green with the five new files consciously placed · gate: `resolveGate` self-discovery (`node --test 'skills/**/*.test.mjs'`)
  10. The stripped template stays under the args-headroom line · gate: `resolveGate` self-discovery (`stage-workflow.test.mjs`)
  11. `skills/war-machine/SKILL.md` §2 step 1 and `plan-interview.md` stage 1b each carry a `when <trigger>, read` pointer to `backward-chain-plan.md`, and the stage-1 falsifier list carries a reachability-probe bullet that points there · check: `grep -c 'backward-chain-plan.md' skills/war-machine/SKILL.md skills/war-strategy/references/plan-interview.md` prints a nonzero count for both files, and `grep -Fq 'reachability probe' skills/war-strategy/references/plan-interview.md && echo REACHABILITY_BULLET_OK`
  12. `docs/adr/0052-*.md` exists, `CONTEXT.md` defines the four terms, and `schemas.md` documents the `Critical path:` / `Ignore for now:` / `relation:` conventions by pointer to the reference files, never by restating the tag list · check: `grep -Fq 'corrective round' CONTEXT.md && grep -Fq 'relation tag' CONTEXT.md && ls docs/adr/0052-*.md && echo DOCS_OK`
  13. The four version slots are bumped in lock-step to the next free patch above the live base · gate: `version-slots.test.mjs`
  14. Marker adherence and the sibling re-block rate are recorded per #2302 after the next five runs · backstop: row 1

## Build order (for /war)

Phase 1 (five reference files, wave 1; census rows + skeleton guard, wave 2) → Phase 2 (engine + cards; plan-author pointers; ADR + glossary + schemas) → Phase 3 (release).

Critical path (plan-side, per End state; the chain orders, the file boundary carves): End states 1 and 7 ← T1.6 ← T1.1–T1.5 (bottleneck: T1.1, the fixer file, because every other file's tag table and every engine fixture chains from it). End states 2–6 ← T2.1 ← Phase 1 landed. End state 11 ← T2.2. End state 12 ← T2.3. End state 13 ← T3.1.

## Phase 1 — Reference files

### Task 1.1: The fixer file
- Files: `skills/war/references/backward-chain-fix.md`
- Plan slice: author the fixer file per the Q6 skeleton as amended (Skeleton record, entry F): preamble; `## The rules` (six rules: lock the outcome citing the End state number or `Done when:`; chain backward to the tip; place the finding and find the earliest unmet link; the Focusing Question over all open findings; verify the finding's premise and state what the `fix:` does to the thing it does not mention; `Ignore for now:` in the commit body); `## Round 1` (commit body shape `Outcome:` `Chain:` `Bottleneck:` `Fix:` `Ignore for now:`, then the ten rules of `fix-round-doctrine.md` by pointer; the markers are self-reports and the auditor's chain is the oracle); `## Round 2` (the threaded prior round; re-run the chain from the outcome; the eight-row first-move table by relation tag); `## Round 3 and later` (the threaded history; a re-opening class is a shape signal; never an escalation (PIN-11); three moves: common ancestor, re-lock on the cited End state and the intent only, the Focusing Question over the whole history; the slice-level `PLAN-DEFECT:` route stays available at every round; the accountability stance); `## Round 5 and later` (a re-opening class is not a plan defect; a wrong or impossible End state is; the test; the `PLAN-DEFECT:` + End state number return as a completed outcome; one-line incident citation) (PIN-3); `## Build variants` (seven clauses; the advisory-polish clause says "byte budget", never "floor" or "cap"); `## Worked examples` (pointers by tag into the examples bank; private sources abstracted, PIN-9). No sentence treats the round bound as an obstacle (PIN-2).
- Done when: `grep -Fxq '## Round 5 and later' skills/war/references/backward-chain-fix.md && grep -Fxq '## Build variants' skills/war/references/backward-chain-fix.md && echo FIX_SKELETON_OK`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: The audit file
- Files: `skills/war/references/backward-chain-audit.md`
- Plan slice: author the audit file per the Q7 skeleton as amended (Skeleton record, entry A): preamble (read-only; classifier and oracle from round 2; the block rides byte-equal at corrective round ≥ 2; round-1 prompts unchanged); `## The rules` (eight rules: chain from the cited End state to the tip YOURSELF first, then read the fix commit body, then diff the two chains; check the outcome citation with severity by consequence; exactly one line `relation: <tag>`, lowercase, the LAST line of the rationale; name the bottleneck and file downstream findings as notes that cite it, re-checked at the new sha, a survivor becomes a sibling finding; thin evidence lowers certainty and severity; off the chain lowers no Critical, an off-chain Minor/Nit never holds a task; audit the `Ignore for now:` list with severity by consequence; state what your own `fix:` does to the thing it does not mention); `## Round 2` (the threaded prior round and the worker's `Critical path:` block; peer count is not evidence, a peer finding is a claim to verify at the pin, ADR 0041); `## Round 3 and later` (read the history as one chain; name the common ancestor in `upstream link:`; the `fix:` names the class-level change); `## Round 5 and later` (test the End state yourself; a finding tagged premise naming the End state number; never before this tier; the slice-level route unchanged) (PIN-3); `## Variants` (delta-scaled re-audit; pin-content re-audit); `## Worked examples` (the lone-dissenter splits live here, never in the rules; private sources abstracted).
- Done when: `grep -Fxq '## Round 5 and later' skills/war/references/backward-chain-audit.md && grep -Fq 'relation: <tag>' skills/war/references/backward-chain-audit.md && echo AUDIT_SKELETON_OK`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: The worker file
- Files: `skills/war/references/backward-chain-worker.md`
- Plan slice: author the worker file per the Q8 skeleton as amended (Skeleton record, entry W): preamble (the block rides byte-equal in the WORK prompt); `## The rules` (eight rules: finish-line order `Done when:` → End state numbers the slice serves → the gate plus the slice's named deliverable, all three absent is the slice-level `PLAN-DEFECT:` route, equivalent readings lock one and state it in `notes`, non-equivalent readings return `blocked`; when the prompt carries `DEPS ALREADY MERGED` the rebase is still the first act and the chain ends at the rebased tip; chain backward; the bottleneck is the earliest unmet link; chunk with a done test, the printed-token duty scoped to the `Done when:` command and the tests the task ships; write `Critical path:` then `Ignore for now:` into `notes`; the bottleneck link's test first, red before green; the outcome locks only on the End states and the intent; rule 8: a link you cannot make true with the task's tools and files is a `blocked` return quoting the diagnostic, never a workaround — no budget raise, no test-pattern edit, no installed tool, no weakened test); `## Chunk shape`; `## Off-path discipline` (three classes: a sibling task's `Files:` path never; a release slot file never; any other path in-band when intent-consistent, named in `notes`); `## Worked examples` (private sources abstracted).
- Done when: `grep -Fq 'Critical path:' skills/war/references/backward-chain-worker.md && grep -Fq 'DEPS ALREADY MERGED' skills/war/references/backward-chain-worker.md && echo WORKER_SKELETON_OK`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: The examples bank
- Files: `skills/war/references/backward-chain-examples.md`
- Plan slice: author the bank per the Q10 skeleton as amended (Skeleton record, entry E): a one-line-per-H2 index first; preamble (H2 names equal the tag vocabulary byte-for-byte plus `## convergence`; the reading rule: no tag ⇒ self-select, N tags ⇒ N sections); `## Entry shape` (`### <slug>`, `Source:`, `Roles:`, one bold lesson sentence, three to five abstracting sentences, `Questions to ask:`, `Closure:`); the nine H2s with the agreed seed entries, WAR entries with issue + comment, every external private entry as `Source: external (private), abstracted` with no repo name, number, or infrastructure detail (PIN-9), and the 2026 OpenAI / Hugging Face incident under `## premise` with the public OpenAI report URL as its source; `## Growth rules` (reviewed PR or Lead Gate-2 commit; the servitor never writes this file; manual redaction check per entry; #2302 is the size watch).
- Done when: `grep -Fxq '## convergence' skills/war/references/backward-chain-examples.md && grep -Fq 'Source: external (private), abstracted' skills/war/references/backward-chain-examples.md && echo BANK_SKELETON_OK`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.5: The plan-author file
- Files: `skills/war-strategy/references/backward-chain-plan.md`
- Plan slice: author the plan-author file per the Q9 skeleton as amended (Skeleton record, entry P): preamble (two readers, one home, no mirror); `## The method` (eight steps: lock every End state with its D5 tag and run the reachability probe, where a `backstop:` End state is reachable through its row and the finish line is the check WAR runs; chain backward from each End state, the chain ORDERS and the file boundary CARVES per war-strategy §3, never one task per link; the bottleneck is Phase 1 wave 1; chunk by distance; every task serves a named End state; `## Non-goals / deferred` holds what is off every chain and `## Deferred validations (backstops)` holds what is on a chain and deferred with a runner; two independent chains state the ordering rule; thin evidence takes `[assumed:]`); `## Where it lands` (step 4 → `Plan slice:` granularity and the phase count; chain lines → a `Critical path` block in Part 1, placement latitude, never under `## Build order` as phases); `## The reachability probe` (body here; `plan-interview.md` gains one pointing bullet in T2.2; the `/red-team` spine untouched, follow-up pointer); `## Worked examples`.
- Done when: `grep -Fxq '## The reachability probe' skills/war-strategy/references/backward-chain-plan.md && grep -Fq 'the file boundary' skills/war-strategy/references/backward-chain-plan.md && echo PLAN_SKELETON_OK`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.6: Census rows and the skeleton guard
- Files: `skills/_shared/doc-cli-consistency.test.mjs`, `skills/war/assets/backward-chain.test.mjs`
- Plan slice: place the five new references files in the placement census (`VERB_SCAN_EXCLUSIONS` with a reason comment each, per A2; if the census red names the other list, follow the red). Author `backward-chain.test.mjs`: pin each file's exact H2 set and rule count, the examples index line, the entry-shape fields, the seed-entry slugs, and the three-file tag guard (audit rules block tag list = fixer Round 2 table rows = examples H2 set minus `convergence`); a positive control per assertion (mutate a copy in a temp dir, assert red). Zero-commit or count-only assertions are defects (delete-the-feature probe).
- Done when: `node --test skills/war/assets/backward-chain.test.mjs skills/_shared/doc-cli-consistency.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [1.1, 1.2, 1.3, 1.4, 1.5]
- target repo: superproject

## Phase 2 — Engine, cards, pointers, docs

### Task 2.1: Engine and cards
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-worker.md`, `agents/war-auditor.md`
- Plan slice: in `workflow-template.js`: a corrective-round helper (fix rounds + `absorbRounds`; 1 for the phase-close sweep and the terminal pass); a `BACKWARD_CHAIN_FIX_RULES` constant carrying `backward-chain-fix.md`'s `## The rules` byte-equal, interpolated into all seven fix-applying builds (FIX_NEEDED, ace subset, ace re-entry, ace advisory polish, floor family, phase-close sweep, terminal pass) with a depth pointer that names `## Round 1`, `## Round 2`, `## Round 3 and later`, or `## Round 5 and later` (the last iff the helper returns ≥ 5, PIN-3) and the build's variant clause; a `BACKWARD_CHAIN_WORKER_RULES` constant in the WORK prompt; `auditPrompt` takes the corrective round and emits an empty clause at round 1 (PIN-10) and `BACKWARD_CHAIN_AUDIT_RULES` plus the same depth pointer at ≥ 2; an exported `RELATION_TAG_RE` that reads the `relation: <tag>` last line of a rationale; the history digest builder (D11 field set, the relation-sequence line, the worker's `Critical path:` block from its result `notes`, full `rationale` + `suggested_fix` for the PIN-29 survival set only) threaded to the fixer and the auditor from round 2; the fixer pointer names the examples H2 for each tag read, or the index when no tag was read. Cards: one `when <trigger>, read` pointer each in `agents/war-worker.md` (the WORK dispatch and every fix-applying dispatch) and `agents/war-auditor.md` (corrective round ≥ 2), same task as the prompts. Fixtures in `workflow-template.test.mjs`: byte-equal for the three rules constants against their files; every one of the seven builds carries the fixer constant (a census by dispatch label, default-deny); round-1 audit prompt equals the round-omitted build and carries no backward-chain clause; the round-5 pointer iff ≥ 5 and the sweep/terminal helper value 1; the digest field set with a PIN-29 survivor arm; `RELATION_TAG_RE` against the examples H2 set (the fourth surface, D15); the stripped-copy headroom stays under the line (the existing `stage-workflow.test.mjs` floor is the arbiter, A1). No sentence in any new prompt text treats `run.roundLimit` or `run.absorbRounds` as an obstacle (PIN-2).
- Done when: `node --test skills/war/assets/workflow-template.test.mjs skills/war/assets/stage-workflow.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.2: Plan-author pointers
- Files: `skills/war-machine/SKILL.md`, `skills/war-strategy/references/plan-interview.md`
- Plan slice: in `skills/war-machine/SKILL.md` §2 step 1, one `when <trigger>, read` pointer to `../war-strategy/references/backward-chain-plan.md` for the drafter at spawn; in `plan-interview.md`, one pointer at stage 1b and one reachability-probe bullet in the stage-1 falsifier list that points at the probe body (the body lives only in `backward-chain-plan.md`, never restated here). Both edits keep every existing command and region the structure tests pin.
- Done when: `grep -Fq 'backward-chain-plan.md' skills/war-machine/SKILL.md && grep -Fq 'reachability probe' skills/war-strategy/references/plan-interview.md && echo POINTERS_OK`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.3: ADR, glossary, schema conventions
- Files: `docs/adr/0052-backward-chain-doctrine-and-corrective-round-disclosure.md`, `CONTEXT.md`, `skills/war/references/schemas.md`
- Plan slice: write ADR 0052 (context, decision, the four roles, disclosure by corrective round, the auditor as classifier, PIN-2 and PIN-3, the no-schema transport, consequences, the #2302 study trigger); add the four terms to `CONTEXT.md`; in `schemas.md` document the `Critical path:` / `Ignore for now:` convention on `WorkerResult.notes`, the fix commit body shape, and the `upstream link:` / `relation:` last-line convention on a finding's `rationale` — each by pointer to its reference file (de-mirror: the tag list is never restated, so no guard is owed). The ADR number is the next free above the live head (0051 at `668e4ff9`); re-measure at the rebased base.
- Done when: `grep -Fq 'corrective round' CONTEXT.md && grep -Fq 'relation:' skills/war/references/schemas.md && ls docs/adr/0052-*.md && echo DOCS_OK`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Release

### Task 3.1: Version bump
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`
- Plan slice: bump the four slots in lock-step to the next free patch above the live base (read the slots at the rebased base; never a literal from this plan): `plugin.json` `version`, `marketplace.json` `metadata.version` and `plugins[0].version`, the `README.md` `## Status` line replaced in place (no badge). Add a `CHANGELOG.md` entry that names the five reference files, the seven builds, the round-5 disclosure, and the #2302 study. The blurb's count words match its own enumeration.
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Marker adherence (results and findings that carry `Critical path:` / `Ignore for now:` / `relation:`, over all of them) and the sibling re-block rate (corrective round N+1 blockers that name a sibling or consequence of round N's fix, over all corrective rounds, read from the ace ladder rows and the audit log, never `fixRounds` alone) · why deferred: needs runtime data from runs that carry the doctrine · runner: `/war-review` after the next five `/war` runs, recorded on issue #2302, which also holds the schema-enforcement decision rule and the examples-bank size watch.

## Notes / conscious deviations

- **Skeleton record (PIN-1 ‡).** The five skeletons are the ones echoed and accepted at Q6 (fixer, with the three edits and the six incident amendments), Q7 (audit, seven edits), Q8 (worker, five edits and the scoped token duty), Q9 (plan author, five edits and the spine note), Q10 (examples, five edits). The per-task `Plan slice:` lines above restate every heading, rule and table those skeletons carry; a worker that finds a gap between a slice line and this record follows the slice line and names the gap in `notes`.
- The examples bank cites the 2026 incident by the public OpenAI report URL only; the "Trilogy" poll name and the 533-to-1 figure were not verifiable and are not cited.
- Round-1 audit prompts stay byte-identical by design (PIN-10), so a round-1 seat sees no backward-chain text at all; the worker's `Critical path:` block still reaches it through the existing worker-tests threading only if the Lead chooses to thread it — this plan threads it from round 2 only (D11).
- The floor family (add-test, make-pass, cite-budget, package-it) corrects after a refiner floor, not an audit; it still carries the fixer block (PIN-6) with its own variant clause (chain from the floor's own check).
- `fix-round-doctrine.md` is untouched; the fixer file composes with it by pointer.

## Open decisions

None.
