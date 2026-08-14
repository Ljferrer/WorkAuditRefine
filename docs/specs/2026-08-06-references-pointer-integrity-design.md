# References/pointer integrity — plugin-root-anchored agent-card pointers, link-guard hardening, and pointer debt
Issues: #1364, #1278, #1279, #1277, #1275, #1276

## 1. Context — the gap / problem

1. **Agent-card references/ pointers are repo-relative and unresolvable from a foreign target
   repo** (verified: issue #1364 (2026-08-06)). The prompt-surface eviction pattern left the
   auditor, worker, refiner, and servitor cards routing to `skills/war/references/` files via
   repo-root-relative markdown links; a dispatched seat's cwd is the target repo's task worktree,
   so on any repo other than the plugin itself the pointer fails to resolve, and the auditor's
   fail-closed read-only-git Bash guard (`hooks/validate-auditor-git.sh`) denies expanding an
   environment variable to locate the real install root (verified: issue #1364 (2026-08-06)).
   Confirmed at the tip: `agents/war-auditor.md` carries four `(skills/war/references/auditor-teach.md)`
   link targets, `agents/war-worker.md` three and `agents/war-servitor.md` one to
   `worker-servitor-edges.md`, `agents/war-refiner.md` three to `refiner-recovery.md`, and no
   `${CLAUDE_PLUGIN_ROOT}`-anchored form appears anywhere under `agents/` (verified: live tree
   @ `6fff2ee` (2026-08-06), grep of `agents/*.md`). Decisive blocking rules stay inline, so the
   loss is the anti-false-block enrichment — biasing dispatched auditors toward wrongly blocking
   legitimate work on non-plugin repos (verified: issue #1364 (2026-08-06)).
2. **The named fix's precedent attribution is stale.** The source lesson names "the plugin-root-anchored
   path form already used in hook error output"; at the tip no hook script emits that form — the
   live precedents are `hooks/hooks.json` (every hook command is `${CLAUDE_PLUGIN_ROOT}/hooks/<script>`)
   and the provision dispatch in `skills/war/assets/workflow-template.js` (the `SCRIPT` const the
   refiner's provision prompt embeds), whose expansion by the refiner seat's own shell is how every
   landed Provision barrier has run (verified: live tree @ `6fff2ee` (2026-08-06), grep of `hooks/`
   and `workflow-template.js` `SCRIPT` const). [assumed: the variable is exported to Bash-capable
   dispatched seats generally, inferred from landed Provision barriers — if wrong: the anchored
   pointer degrades to unresolvable enrichment for that seat, decisive rules stay inline, nothing
   new blocks.]
3. **war-setup-scout pointer debt** (verified: issue #1278 (2026-08-06)). `agents/war-setup-scout.md`
   carries two `../`-prefixed links — `../skills/_shared/provision.mjs` and
   `../skills/war/references/schemas.md`. Both resolve file-relative today, but break the pointer
   shape the rest of the agent-card family uses; the pointer-shape assert family in
   `skills/war/assets/workflow-template.test.mjs` deliberately excludes this card, its comment
   ending "Add it here once they are repaired" (verified: live tree @ `6fff2ee` (2026-08-06), the
   Task 5.1 worker/servitor-card-evictions test's setup-scout exclusion comment).
4. **skills/war/SKILL.md owes an ADR 0042 trigger pointer** (verified: issue #1279 (2026-08-06)).
   The phase-close-revert doctrine landed as `## Phase-close polish reverts — never self-justifying`
   in `skills/war/references/resume-and-recovery.md`, but the trigger pointer on `skills/war/SKILL.md`
   was deliberately not landed (cross-group file-collision avoidance); the SKILL.md pointers into
   `resume-and-recovery.md` name only the Resume-reconciliation and Checkpoint-outcome-handling
   sections, so the doctrine is reachable only by already knowing it exists — and ADR 0042 says a
   references/ block without a trigger pointer is a defect (verified: live tree @ `6fff2ee`
   (2026-08-06), heading list of `resume-and-recovery.md` and grep of `SKILL.md`).
5. **The auditor-teach step-4 citation has no presence guard** (verified: issue #1277 (2026-08-06)).
   `skills/war/references/auditor-teach.md` step 4 cites `submodule-flows.md`, section
   "Resume — submodule remote as co-source-of-truth" as a backticked filename + quoted section
   name (a non-link citation by resolved decision), and the file header names the same filename;
   `skills/war/assets/reference-link-integrity.test.mjs` carries four tests — dead-link sweep,
   retired-citation absence, header truth, revert-doctrine construct — and none pairs that citation
   to the real heading, so renaming or moving the heading re-orphans the citation with nothing
   going red (verified: live tree @ `6fff2ee` (2026-08-06), suite run: 4 pass / 0 fail).
6. **The OLD-absent caveat pattern is whitespace-brittle** (verified: issue #1275 (2026-08-06)).
   `RETIRED_REBASING_CAVEAT` is `/link paths inside the moved blocks/i`; a normal markdown line-wrap
   inside the phrase reintroduces the retired doctrine while the suite stays green and the plan's
   mandated grep floor reads 0 hits — reproduced by the Lead at the prior plan's landed tip.
   Secondary, same file: `headerRegion` returns the whole file when a scanned file has no `## `
   heading — an unintended fail-open of the header-truth arm, documented in its own docstring.
   Both are unchanged at the tip, and the NEW-present half `/at eviction time/i` shares the
   single-space brittleness (verified: live tree @ `6fff2ee` (2026-08-06), `reference-link-integrity.test.mjs`
   `RETIRED_REBASING_CAVEAT` const, `headerRegion` function, the header-truth arm's NEW-present loop).
7. **A polish comment mints a false doc claim in the pointer-guard family** (verified: issue #1276
   (2026-08-06)). The comment above the `refinerMd` `../`-absence assert appended to the Task 5.1
   worker/servitor-card-evictions test claims the refiner card "must be held by an assert too —
   otherwise 606b72b can silently regress", but the file already carried both a count-pinned assert
   (all three `refiner-recovery.md` pointers, in the Task 1.2 grep-parity test) and an any-depth
   `../`-absence assert beside it — the appended assert is harmless duplication and the comment is
   false, inside a plan whose purpose was retiring false doc claims (verified: live tree @ `6fff2ee`
   (2026-08-06), both assert sites coexist). Secondary cosmetic: the `worker-servitor-edges.md`
   header reflow strands the backticked `skills/war/assets/workflow-template.js` path alone on a
   short line (verified: live tree @ `6fff2ee` (2026-08-06), file header).
8. **Doc-truth cascade the fix itself creates** (survey-derived, live tree @ `6fff2ee` (2026-08-06)):
   `skills/war/references/worker-servitor-edges.md`'s header asserts "On a foreign target repo no
   path form resolves this file at all"; once the anchored pointer form lands, that sentence is
   false for Bash-capable seats. The prior campaign's spec ratified adjudication O(3) — "no
   plugin-root anchor is introduced" — as a scoped decision of that plan; this spec deliberately
   supersedes the anchor half while keeping O(1) (pointer = best-effort enrichment, decisive rules
   inline) intact, and records the supersession as an ADR rather than silent drift.

## 2. Pivotal constraints

- **O(1) survives untouched:** a references/ pointer is best-effort enrichment, never the sole
  carrier of a blocking rule. Every decisive-rules-inline digest on every card stays byte-intact.
- **The anchor supersession is explicit, never silent:** the prior spec's O(2)/O(3) owner-relative
  skeleton was ratified for that plan; changing the family shape requires its own decision record
  (§7) and an OLD-shape-absent gate (the default-flip discipline, war-strategy authoring rule 6).
- **The guard travels with the fact (ADR 0025):** every pointer edit and every re-pinned shape
  assert land in the same diff; the setup-scout family extension lands in the same diff as its
  link repair (issue #1278's own ask).
- **Auditor guard discipline untouched:** no verb widening in `hooks/validate-auditor-git.sh`, no
  hook edits at all; the auditor path stays fail-closed and `fetch` stays excluded.
- **No `workflow-template.js` edits:** all guard work lands in `workflow-template.test.mjs` and
  `reference-link-integrity.test.mjs`; the template's block-span census (`EXPECTED_BLOCK_SPANS`)
  and the negative `!setup-scout` assert scan the template, not the test file, so the family
  extension cannot trip them (verified: live tree @ `6fff2ee` (2026-08-06), the barrier-wiring
  asserts and span-census test in `workflow-template.test.mjs`).
- **Line-based grep cannot see a line wrap.** Any hand grep for a multi-word phrase is a
  completeness floor, never the authority; the suite's whitespace-tolerant regex is the check of
  record, and every sweep in §4/§10 carries the mandatory manual same-scope survey.
- **Anchor by named construct, never line number** — every edit site below is named by test title,
  const name, function name, or heading.
- **All touched prose stays redaction-lint clean** (no home paths, emails, handles, credentials).

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| D1 | Agent-card pointer anchor form | `${CLAUDE_PLUGIN_ROOT}/skills/war/references/<file>.md` (and `${CLAUDE_PLUGIN_ROOT}/skills/_shared/<file>` for the setup-scout provision link) as the single family shape on all five agent cards |
| D2 | Scope of normalization | Markdown link targets pointing into `skills/` only; backticked non-link `references/schemas.md` citations and the refiner card's `../docs/adr/` link are out of scope (§9) |
| D3 | Unexpanded-placeholder fallback | One standing resolution line per card: when the placeholder arrives unexpanded and the repo under review is the plugin itself, strip the `${CLAUDE_PLUGIN_ROOT}/` prefix and resolve repo-relative [assumed: default — if wrong/vetoed: drop the line; WAR-on-itself auditors lose deterministic resolution and fall back to model inference] |
| D4 | Pointer-shape guard family | Re-pin all eight existing shape asserts to the anchored form; add an OLD-shape-absent assert (no bare `](skills/` link target in any card); extend the family to `war-setup-scout.md` (count-pin of 2 + `../`-absence); retire the deliberate-exclusion comment |
| D5 | #1276 duplicate assert | Keep the duplicated `refinerMd` assert (family locality), correct the false comment to say it consolidates the pointer-shape family alongside the pre-existing Task 1.2 count-pin + `../`-absence guards, keeping the ADR 0025/0031 equivalence-class rationale |
| D6 | Link-resolution sweep vs the new form | `reference-link-integrity.test.mjs` Arm 1 maps a leading `${CLAUDE_PLUGIN_ROOT}/` to the repo root (plugin root ≡ repo root in this repo) and its skeleton/exclusion comments are re-truthed |
| D7 | Whitespace-brittle patterns | `RETIRED_REBASING_CAVEAT` → `/link\s+paths\s+inside\s+the\s+moved\s+blocks/i`; NEW-present half → `/at\s+eviction\s+time/i`; each positive control gains a wrapped (embedded-newline) literal so the wrap axis is non-vacuously proven |
| D8 | `headerRegion` fail-open | Fail closed: a scanned file with no `## ` heading is an assertion failure at the call site, never a silent whole-file check; the docstring's fallback sentence goes with it |
| D9 | #1277 presence guard | New arm: extract the backticked filename + quoted section name from `auditor-teach.md` step 4, assert the file exists under `skills/war/references/` and carries a `## ` heading containing that section name; also assert the header region names the same filename |
| D10 | #1279 trigger pointer | One pointer on `skills/war/SKILL.md` in the fixed `when <trigger>, read references/<file>` shape, naming the landed heading, placed beside the phase-close sweep bullets; SKILL.md keeps its own bare `references/<file>` owner-relative skeleton |
| D11 | worker-servitor-edges.md header | Re-truth the "no path form resolves this file at all" sentence to name the anchored pointer + the auditor residual, and unstrand the lone backticked template path (the #1276 cosmetic) in the same edit |

## 4. Mechanics

### 4.1 Agent-card normalization (worker: #1364 + #1278)

Rewrite every `skills/`-targeting markdown link target in `agents/war-auditor.md`,
`agents/war-worker.md`, `agents/war-refiner.md`, `agents/war-servitor.md`, and
`agents/war-setup-scout.md` to the D1 anchored form — link text unchanged, surrounding prose
unchanged except the one D3 resolution line added per card. Snapshot of the family at `6fff2ee`
(2026-08-06): auditor 4, worker 3, refiner 3, servitor 1, setup-scout 2 (one of them the
`skills/_shared/provision.mjs` link). Sweep step: `grep -nE '\]\((\.\./)*skills/' agents/*.md` and
handle every match — then, mandatorily, hand-scan each card's same-scope prose and comments for
non-link path citations and list each straggler as a survey-derived correction (the grep is a
floor, not a ceiling; the survey behind this spec found the backticked `references/schemas.md`
citations, deliberately deferred per §9, and no others).

### 4.2 Pointer-shape guard family (worker: #1364 + #1278 + #1276, one owner for the file)

In `skills/war/assets/workflow-template.test.mjs`:

- Re-pin the eight shape asserts (snapshot at `6fff2ee` (2026-08-06): the Task 1.2 grep-parity
  test's `refinerMd` count-pin and `../`-absence pair, and the Task 5.1
  worker/servitor-card-evictions test's worker/servitor/auditor/refiner count-pins and
  `../`-absence asserts) to the anchored form, updating each assert message and the O(2)-citing
  comments in the same edit — the messages currently say "owner-relative", which becomes false
  bytes after the flip (survey-derived correction from the authoring sweep behind this spec).
- Add the OLD-shape-absent assert: no card may carry a bare `](skills/` link target (a count-pin
  on the new form alone stays green when a stale bare pointer is *added* beside the pinned ones).
- Extend the family to `war-setup-scout.md`: count-pin its two anchored links + the any-depth
  `../`-absence pattern; replace the deliberate-exclusion comment (the one ending "Add it here
  once they are repaired") with the coverage row.
- #1276: correct the false comment above the appended `refinerMd` assert per D5 — state that the
  assert consolidates the pointer-shape family alongside the pre-existing Task 1.2 count-pin +
  `../`-absence guards, keep the ADR 0025/0031 equivalence-class rationale, keep the assert.
- Sweep step: `grep -n 'owner-relative' skills/war/assets/workflow-template.test.mjs` and rewrite
  every hit for the new shape — then, mandatorily, hand-scan the same file's pointer-family test
  titles, comments, and assert messages for shape descriptions the token sweep misses and list
  each straggler as a survey-derived correction (the survey behind this spec found the
  "walks OUT of the repo" rationale sentences in both family comments as such stragglers).

### 4.3 reference-link-integrity.test.mjs hardening (worker: #1275 + #1277 + D6, one owner)

- **Arm 1 (link resolution):** teach the resolver the anchored form — a target beginning
  `${CLAUDE_PLUGIN_ROOT}/` resolves against the repo root; re-truth the arm's skeleton comment
  (it currently ratifies the repo-root-anchored bare form) and delete the setup-scout
  deferred-links parenthetical, which becomes false once §4.1 lands.
- **Arm 3 (header truth), #1275:** replace `RETIRED_REBASING_CAVEAT` with
  `/link\s+paths\s+inside\s+the\s+moved\s+blocks/i` and the NEW-present pattern with
  `/at\s+eviction\s+time/i`; add a wrapped positive control per pattern (a literal carrying a
  newline inside the phrase) so the wrap axis is proven non-vacuously; extend the arm's grep-floor
  comment to state the duty: the hand grep is line-based and cannot see wraps — it remains a
  completeness floor only, the suite regex is the authority.
- **`headerRegion` fail-closed, #1275 secondary:** per D8, no silent whole-file degradation.
- **New presence arm, #1277:** per D9 — extraction + equality, ADR 0025 style: parse step 4's
  citation out of `auditor-teach.md` (fail closed if the citation shape is not found), assert
  `skills/war/references/submodule-flows.md` exists and carries a `## ` heading containing the
  quoted section name, and assert the header region's filename mention matches. A rename of
  `## Resume — submodule remote as co-source-of-truth` now reds instead of silently orphaning.
- Sweep step: after the edits, `grep -rin 'link paths inside the moved blocks' skills/war/references/`
  must read 0 hits — then, mandatorily, hand-scan the scanned roots' headers and the suite's own
  comments for paraphrased reintroductions the literal grep misses and list each straggler as a
  survey-derived correction.

### 4.4 SKILL.md trigger pointer (worker: #1279)

Add one pointer to `skills/war/SKILL.md`, beside the phase-close sweep bullets (the
"Sweeps (phase-close, ADR 0012)" bullet and the "The phase-close sweep is fail-open" bullet), in
the fixed ADR 0042 shape: when judging or authoring a revert of a phase-close polish commit, read
`references/resume-and-recovery.md` (§ Phase-close polish reverts — never self-justifying). The
pointer names the landed heading verbatim; SKILL.md's own owner-relative `references/<file>`
skeleton is unchanged (§9). No edit to `resume-and-recovery.md` itself.

### 4.5 worker-servitor-edges.md header (worker: #1276 secondary + D11)

One edit: re-truth the header's cross-repo sentence (the anchored pointer now resolves for
Bash-capable seats; the auditor residual and the dispatched-prompt carriers remain the operative
mitigation — cite adjudication O(1) as still standing) and reflow the stranded backticked
`skills/war/assets/workflow-template.js` line into its sentence.

## 5. Surface changes

- `agents/war-auditor.md` — 4 pointer targets re-anchored + D3 resolution line.
- `agents/war-worker.md` — 3 pointer targets re-anchored + D3 resolution line.
- `agents/war-refiner.md` — 3 pointer targets re-anchored + D3 resolution line.
- `agents/war-servitor.md` — 1 pointer target re-anchored + D3 resolution line.
- `agents/war-setup-scout.md` — 2 links normalized to the anchored form + D3 resolution line.
- `skills/war/assets/workflow-template.test.mjs` — family re-pin, OLD-shape-absent assert,
  setup-scout extension, exclusion-comment retirement, #1276 comment correction.
- `skills/war/assets/reference-link-integrity.test.mjs` — Arm 1 anchored-form resolution +
  comment re-truth, Arm 3 whitespace-tolerant patterns + wrapped controls + grep-floor duty,
  `headerRegion` fail-closed, new #1277 presence arm.
- `skills/war/SKILL.md` — one ADR 0042 trigger pointer (#1279).
- `skills/war/references/worker-servitor-edges.md` — header re-truth + reflow.
- `skills/war/references/auditor-teach.md` — read-only anchor for the #1277 extraction (no edit
  planned; if the extraction needs a firmer citation shape, the same-diff edit is sanctioned).

## 6. New domain terms (CONTEXT.md)

- **Plugin-root-anchored pointer** — the `${CLAUDE_PLUGIN_ROOT}/`-prefixed agent-card link form
  that resolves against the plugin install root regardless of the dispatched seat's cwd;
  supersedes the owner-relative agent-card skeleton, remains best-effort enrichment under
  adjudication O(1).

## 7. Recommended ADRs

- **Agent-card pointer skeleton is plugin-root-anchored** (next free number after the current
  head): records the supersession of the references-pointer-link-truth adjudication O(2)/O(3)
  anchor decision, the seat-capability matrix (Bash-capable seats expand the placeholder; the
  auditor's resolution rests on harness substitution or the D3 fallback line; O(1)
  inline-decisive-rules is the invariant mitigation), and the OLD-shape-absent gate discipline.

## 8. Open risks / implementation notes

- **Ordering: this group lands after the sibling groups `structural-pin-extractors` and
  `gate2-publication-guard`** — file contention on the shared guard suites; the survey manifest
  carries the machine hint. Re-verify every snapshot count in this spec at the actual dispatch
  base (counts here are dated 2026-08-06 @ `6fff2ee` and the sibling groups touch the same files).
- **Harness substitution of `${CLAUDE_PLUGIN_ROOT}` in agent-card body text is unverified from
  the tree.** [assumed: the harness substitutes the placeholder at dispatch — if wrong: the
  anchored form resolves only via seat-shell expansion, the auditor relies on the D3 fallback
  line, and behavior on foreign repos is never worse than today's unresolvable bare form.]
  Red-team-provable: dispatch a throwaway auditor-type probe whose card carries the placeholder
  and observe whether the text arrives substituted; run it before the plan is ratified.
- **WAR-on-itself auditor regression risk:** the bare form resolves for a plugin-repo auditor
  today; an unexpanded placeholder would not. The D3 fallback line is the mitigation; if D3 is
  vetoed, the plan must record the accepted residual explicitly (ADR 0017 — no prose waivers).
- **Count-pin churn duty:** every count in the extended family carries the standing update duty —
  a future plan adding or dropping a pointer updates the pin in the same diff as the pointer.
- **The #1277 extraction must fail closed** — if step 4's citation shape parses to nothing, the
  arm asserts, never skips (the enumerated-destination existsSync fail-open lesson).

## 9. Non-goals / deferred

- **Backticked non-link `references/schemas.md` citations** on the auditor/worker/refiner Return
  lines — pre-existing house idiom, same foreign-repo exposure, deferred to keep this pass to
  markdown link targets (a follow-up may normalize them under the new ADR).
- **The refiner card's `../docs/adr/` link** — resolves file-relative from `agents/` and carries
  no `skills/` segment; the family patterns deliberately do not flag it.
- **Hook edits, verb-allowlist widening, or threading a resolved root through
  `workflow-template.js` dispatched prompts** — no template or hook changes in this group.
- **Renaming or restructuring `submodule-flows.md`'s co-source-of-truth heading** — the #1277
  guard pins it; renames become a deliberate same-diff update.
- **SKILL.md's own owner-relative `references/<file>` pointer skeleton** — the anchor
  supersession applies to agent cards (dispatched seats); skill surfaces are read in-plugin.
- **Re-opening adjudication O(1)** — pointer-as-enrichment and decisive-rules-inline stand;
  only the anchor half of O(2)/O(3) is superseded, via §7's ADR.
- **Files owned by the sibling groups** `structural-pin-extractors` and `gate2-publication-guard`.

## 10. Validation criteria

1. WHEN the normalization lands THE five agent cards SHALL carry no bare or `../`-prefixed
   `skills/`-targeting link target · check: `grep -nE '\]\((\.\./)*skills/' agents/*.md` → 0 hits,
   then the mandatory manual same-scope survey of each card's prose for non-link path citations,
   each straggler listed as a survey-derived correction.
2. WHEN the normalization lands THE anchored family SHALL be count-complete per card · check:
   `grep -Fc '](${CLAUDE_PLUGIN_ROOT}/skills/' agents/war-auditor.md agents/war-worker.md agents/war-refiner.md agents/war-servitor.md agents/war-setup-scout.md`
   → 4/3/3/1/2 (re-baselined at the dispatch base if a sibling group moved a pointer).
3. WHEN the guard family is re-pinned THE suites SHALL be green · check:
   `node --test skills/war/assets/workflow-template.test.mjs` and
   `node --test skills/war/assets/reference-link-integrity.test.mjs` → 0 fail.
4. WHEN a bare `](skills/war/references/` link target is reintroduced on any agent card THE
   OLD-shape-absent assert SHALL red · check: mutation probe in a throwaway copy — add one bare
   pointer to `agents/war-worker.md`, run the workflow-template suite, expect a failure naming
   the OLD shape.
5. WHEN the setup-scout family extension lands THE deliberate-exclusion comment SHALL be gone ·
   check: `grep -n 'Add it here once they are repaired' skills/war/assets/workflow-template.test.mjs`
   → 0 hits, and a setup-scout count-pin is present.
6. WHEN the #1276 correction lands THE false unguarded-claim comment SHALL be gone and the
   replacement SHALL state consolidation alongside the pre-existing guard · check:
   `grep -n 'must be held by an assert too' skills/war/assets/workflow-template.test.mjs` → 0
   hits; `grep -n 'consolidat' skills/war/assets/workflow-template.test.mjs` → ≥ 1 hit in the
   Task 5.1 family block.
7. WHEN the retired caveat is reintroduced with a line wrap inside the phrase THE header-truth
   arm SHALL red · check: mutation probe — insert the two-line wrapped phrase into a throwaway
   copy of `skills/war/references/submodule-flows.md`, run the link-integrity suite, expect a
   failure; the single-line variant must also still red.
8. WHEN the whitespace-tolerant patterns land THE hand grep floor SHALL be stated as a floor ·
   check: `grep -rin 'link paths inside the moved blocks' skills/war/references/` → 0 hits, plus
   the mandatory manual same-scope survey of the scanned roots' headers and the suite's comments
   for paraphrased reintroductions, each straggler listed as a survey-derived correction.
9. WHEN a `QUALIFIED_HEADERS` file loses every `## ` heading THE header-truth arm SHALL fail
   loudly rather than degrade to a whole-file check · check: mutation probe — strip the headings
   from a throwaway copy, run the suite, expect an assertion naming the file.
10. WHEN `submodule-flows.md`'s co-source-of-truth heading is renamed THE #1277 presence arm
    SHALL red · check: mutation probe — rename the heading in a throwaway copy, run the
    link-integrity suite, expect a failure citing the step-4 citation.
11. WHEN the #1279 pointer lands THE trigger pointer SHALL exist in the fixed shape naming the
    landed heading · check: `grep -n 'Phase-close polish reverts' skills/war/SKILL.md` → ≥ 1 hit
    on a line that also routes to `references/resume-and-recovery.md`.
12. WHEN the header re-truth lands THE stale cross-repo claim SHALL be gone · check:
    `grep -n 'no path form resolves' skills/war/references/worker-servitor-edges.md` → 0 hits,
    and the stranded single-path line is reflowed; then the mandatory manual same-scope survey of
    the remaining references/ headers for sibling copies of the retired claim, each straggler
    listed as a survey-derived correction.
