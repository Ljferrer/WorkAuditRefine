# Campaign-ledger ingestion contract — align `init --roadmap` and `extractFiles` with what /war-machine actually emits

Issues addressed: #738, #739, #816

Status: draft for /war-machine conversion. Source group: `campaign-ledger-ingestion-contract`.

## 1. Context — the gap / problem

The `/war-campaign` handoff is `campaign-ledger.mjs init --roadmap <roadmap>` — but the ledger's
two ingestion parsers were contracted against a narrower shape than the pipeline's own ratified
producers emit, so the documented handoff fails on the pipeline's own output:

- **#738 (critical, live).** `resolveRoadmapPlans` in `skills/war-campaign/assets/campaign-ledger.mjs`
  extracts the first `.md` markdown-link from **every** table row in the whole document. A
  `/war-machine`-authored roadmap carries a second linked table — the `## Issue → spec → plan chain`
  (mandated by war-machine SKILL.md §3 so `/aftermath` can close swept issues) — whose rows link
  `../specs/*-design.md`. `init --roadmap` therefore ingests spec files as phantom plans (verified:
  4 real plans + 9 duplicate spec entries from
  `docs/roadmaps/2026-07-11-war-resilience-and-recovery-roadmap.md`) and throws on their unparseable
  footprints. The code's own documented ceilings (a)/(c) describe exactly this shape as
  out-of-contract — but the contract excludes the pipeline's own ratified output, making
  `init --roadmap` unusable on every war-machine roadmap. Only workaround: hand-seeding `--plans`.
- **#739 (major, live).** `extractFiles` in the same file extracts **only backticked** tokens
  (`` /`([^`]+)`/g ``), yet the war-strategy §2 plan template reads
  `- Files: <exact paths this task touches>` with no backtick requirement, and
  `plan-literal-lint.mjs` has no bare-path rule. A `/war-machine`-drafted plan with bare Files
  paths yields an empty footprint → `assertOrderable` throws
  `unparseable footprint … explicit position required`, blocking init; an empty footprint also
  silently weakens mid-run `sweep` contention checks. `isPathShaped()` sits directly above
  `extractFiles`, unused for this.
- **#816 (minor, live).** The fixture-builder comment above `setupCanonicalRoadmap` in
  `campaign-ledger.test.mjs` claims a regressed table extractor ingesting the on-disk decoy would
  be caught by "the exactly-2 assertions (not an ENOENT)". In fact the decoy body has no `Files:`
  block, so the first-line catch is `assertOrderable`'s unparseable-footprint throw (init passes no
  positions); the length-2 assertions never run. The test still goes RED, but via a mechanism the
  comment doesn't name — inviting a future editor to add a `Files:` block to the decoy "to make the
  described discriminator real" and silently change what the test proves.

Common shape: the producer surfaces (war-strategy template, war-machine roadmap directive) and the
consumer parsers (`resolveRoadmapPlans`, `extractFiles`) drifted apart with no contract stated on
either side. This spec pins the contract on **both** sides and corrects the one test comment that
misdescribes the safety net.

## 2. Pivotal constraints

1. **Target-repo-agnostic parsing (ratified ceiling (c)):** the ledger carries no repo naming
   convention — no `../specs/` path heuristic, no `-design.md` suffix filter may discriminate link
   targets. Any fix must be structural, not name-based.
2. **Fail-loud contract:** a roadmap parse yielding 0 plans THROWS (the #585 silent-empty-ledger
   lesson). The fix must preserve this and must not introduce a new silent-skip path.
3. **Single-pass, line-order = queue order:** `resolveRoadmapPlans` reads the document once; row
   order is campaign order. The fix must not reorder or require a second pass.
4. **Templates are inline and locked:** the plan template lives in `skills/war-strategy/SKILL.md`
   §2, locked by `war-strategy-structure.test.sh` (`check_f` verbatim-line locks). The current
   `- Files:` line is *not* locked — the edit is free, but the new wording should gain a lock.
5. **`plan-literal-lint.mjs` is advisory:** report-only, exit 0 by default, `--strict` opt-in,
   never a `/war` gate. A new rule inherits that posture.
6. **Backticks stay the precision mechanism:** the decoy test proves backticked cell tokens are
   never extracted from tables; `extractFiles`' backtick extraction is the documented precision
   contract. A bare-path fallback must not dilute extraction when backticks are present.
7. **Comments must not lag rewritten code** (`source-comment-lags-emitted-prompt-after-rewrite`
   lesson): the ceilings comment block above `resolveRoadmapPlans` and the decoy fixture comment
   must be updated in the same change as the mechanics they describe.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| #738: how to stop chain-table spec links from being ingested | **First-table-only ingestion** (issue option (a)): table-row link extraction applies only to the first contiguous table block in the document; later tables contribute nothing. Structural, name-blind — honors constraint 1. |
| — rejected: filter link targets by `../specs/` path or `-design.md` suffix | Violates ratified ceiling (c) — target-repo-agnostic code carries no repo naming convention. |
| — rejected: issue option (b), de-link specs in the war-machine chain table | Fixes future roadmaps only; every already-committed roadmap stays broken, and the chain table's links serve `/aftermath` and human review. |
| What is "the first table" | The first maximal run of consecutive lines matching the existing leading-`|` test. Once at least one table line has been seen and a non-table line follows, table ingestion is closed for the rest of the document. Bare bulleted/numbered `.md` lines (legacy form 1) remain accepted anywhere — unchanged. |
| Producer-side counterpart | `skills/war-machine/SKILL.md` §3 roadmap-authoring step gains one clause: the plan-index table MUST be the first table in the document; auxiliary tables (issue→spec→plan chain, shared-file contention) come after. The war-strategy roadmap template already shows this order. |
| #739 half 1: where the backtick requirement lives | The §2 plan template `- Files:` line is rewritten to show backticked placeholder paths and state the contract (ledger `extractFiles` reads backticked tokens). A new `check_f` lock on the rewritten line goes into `war-strategy-structure.test.sh`. |
| #739 half 1b: mechanical enforcement | New advisory `plan-literal-lint.mjs` rule `bare-files-path`: flags a `- Files:` line containing a path-shaped token outside backticks. Report-only, same posture as sibling rules. Included (not optional): the lint is the layer that actually reaches `/war-machine` drafters at conversion time. |
| #739 half 2: `extractFiles` fallback shape | **Zero-backtick fallback:** if the collected `Files:` block contains no backticked token at all, split the annotation-stripped block on commas and accept tokens passing the existing `isPathShaped()`. If ≥1 backtick is present, extraction is backtick-only exactly as today (mixed lines defer to backticks — constraint 6). |
| — rejected: always union bare + backticked tokens | Dilutes the precision mechanism; prose words adjacent to backticked paths would leak into footprints on well-formed plans. |
| #816: fix shape | Comment-only reword of the fixture-builder comment above `setupCanonicalRoadmap`: name `assertOrderable`'s unparseable-footprint throw as the first-line catch (decoy has no `Files:` block, init passes no positions), the exactly-2 assertions as the backstop, and warn against ever giving the decoy a `Files:` block. Landed together with the `extractFiles` change so the comment states the final mechanism once. |
| Ceilings comment block above `resolveRoadmapPlans` | Rewritten in the same change: ceiling (a) narrows to first-link-per-row *within the first table*; ceiling (c) is superseded for the chain-table shape (now structurally ignored) but retained for a roadmap whose *first* table links non-plans — that shape still surfaces via the existing backstops (unparseable-footprint throw / ENOENT). |

## 4. Mechanics

### `resolveRoadmapPlans` (campaign-ledger.mjs)

Add a two-flag state machine to the existing single loop: `inTable` (currently on a leading-`|`
line) and `tableClosed` (a table block has ended). A leading-`|` line is considered for link
extraction only while `tableClosed` is false; a non-table line seen after any table line sets
`tableClosed`. No second pass, no reordering. The 0-plan throw is unchanged and now also fires
when a malformed roadmap's first table carries no `.md` links (fail-loud, names both accepted
forms — extend the message to say table ingestion is first-table-only).

### `extractFiles` (campaign-ledger.mjs)

After `stripAnnotations`, run the existing backtick matcher. If it produced zero files **and** the
block is non-empty, iterate the comma-split segments, trim each, and accept whole segments passing
`isPathShaped()` (dedup as today). `stripAnnotations` behavior is unchanged — parentheticals and
trailing em-dash clauses are already removed before the fallback sees the text. This repairs both
consumers: `init` footprints and `sweep`'s mid-run contention intersection.

### War-strategy §2 plan template + structure lock

The template line becomes (exact wording drafted at conversion, contract fixed here):
`- Files:` followed by backticked placeholder paths and a terse annotation that every path is
backticked because the campaign ledger's `extractFiles` reads backticked tokens. Add a matching
`check_f` verbatim lock to `war-strategy-structure.test.sh` beside the existing template-internal
locks (the current line has none — this closes that gap).

### `plan-literal-lint.mjs` rule `bare-files-path`

New `LINT_PATTERNS` entry: on lines matching a `- Files:` prefix, flag when text outside backtick
spans contains a path-shaped token. Message points at the §2 backtick requirement. Tests beside
the sibling rules in `plan-literal-lint.test.mjs` (flagged: bare path; clean: all-backticked;
clean: `Files:` word inside prose).

### `war-machine` SKILL.md §3

One clause added to the roadmap-authoring step: plan-index table first; chain and contention
tables after it (the ledger ingests only the first table).

### Decoy fixture comment (campaign-ledger.test.mjs)

Reword only — no fixture or assertion changes. The decoy (`roadmaps/notes/decoy.md`, no `Files:`
block) still exercises table precision under the first-table restriction because it sits in a
Files-owned cell of the *first* table.

## 5. Surface changes (files touched)

| File | Change |
|---|---|
| `skills/war-campaign/assets/campaign-ledger.mjs` | `resolveRoadmapPlans` first-table state machine + ceilings-comment rewrite + extended 0-plan throw message; `extractFiles` zero-backtick fallback |
| `skills/war-campaign/assets/campaign-ledger.test.mjs` | Chain-table roadmap regression test; bare-path footprint tests; decoy fixture comment reword |
| `skills/war-strategy/SKILL.md` | §2 plan template `- Files:` line backtick requirement |
| `skills/war-strategy/war-strategy-structure.test.sh` | New `check_f` lock on the rewritten `- Files:` template line |
| `skills/war-strategy/assets/plan-literal-lint.mjs` | New `bare-files-path` advisory rule |
| `skills/war-strategy/assets/plan-literal-lint.test.mjs` | Rule tests (flagged / clean / prose-mention) |
| `skills/war-machine/SKILL.md` | §3 clause: plan-index table must be the document's first table |

Same-file note for decomposition: the two `campaign-ledger.mjs` mechanics changes and the test-file
changes overlap — they are one code boundary, not parallelizable.

## 6. New domain terms (CONTEXT.md)

- **Plan-index table** — the first table in a roadmap document; the only table
  `campaign-ledger.mjs init --roadmap` ingests. All later tables (issue→spec→plan chain,
  shared-file contention) are ledger-inert.

## 7. Recommended ADRs

None. The first-table contract is a parser-contract clarification recorded in the
`resolveRoadmapPlans` header comment and both producer SKILL.md surfaces; no standing
architectural decision changes.

## 8. Open risks / implementation notes

- **Bare-path fallback over-acceptance:** `isPathShaped` accepts dot-suffixed prose tokens (e.g. a
  stray `e.g`), so a sloppy bare `Files:` line can pick up non-path tokens. Bounded: the fallback
  fires only on zero-backtick blocks, worst case is an over-wide footprint (over-conservative
  contention ordering), never a throw; the new lint rule pushes drafters back to backticks.
  Accept as a documented ceiling in the `extractFiles` comment.
- **A roadmap whose first table is not the plan index** would ingest wrong links or 0-plan-throw.
  No committed roadmap has this shape; the war-machine clause plus the war-strategy roadmap
  template ordering prevent new ones. The fail-loud throw is the backstop.
- **Legacy spec-index roadmaps** (e.g. `docs/roadmaps/2026-06-26-open-issue-remediation-roadmap.md`,
  whose first table links specs) remain out of contract exactly as before — the first-table
  restriction neither fixes nor worsens them.
- **Comment/prose lock-step:** the ceilings comment, the decoy comment, and the extended throw
  message describe the mechanics changed here — each must land in the same commit as its
  mechanism (constraint 7).
- Anchor all references by named construct (`resolveRoadmapPlans`, `extractFiles`,
  `setupCanonicalRoadmap`, `LINT_PATTERNS`), never line number.

## 9. Non-goals / deferred

- #798 (`recordBaselineDebt` subset dedup) — different subsystem, separate group.
- Retroactively editing committed roadmaps or de-linking chain-table specs (rejected option (b)).
- Any `--strict`/gate promotion of `plan-literal-lint.mjs` — it stays advisory.
- Widening `isPathShaped` or discriminating link targets by name/suffix (ceiling (c) stands).
- The #740–#742 war-followup launch-robustness batch from the same 2026-07-11 session.

## 10. Validation criteria (concrete, testable)

1. **Chain-table regression test (RED without the #738 fix):** a fixture roadmap with a plan-index
   table (2 plans) followed by a chain table linking two on-disk `../specs/*-design.md` files that
   have no `Files:` block → `init --roadmap` yields exactly the 2 plan entries in row order; the
   spec paths appear nowhere in the ledger.
2. **Live-corpus check:** in a sandbox, `init --roadmap` against
   `docs/roadmaps/2026-07-11-war-resilience-and-recovery-roadmap.md` (all 4 linked plans exist on
   disk) succeeds with exactly 4 entries — the shape that today throws after ingesting 13.
3. **Bare-path footprint tests (RED without the #739 fix):** a `Files:` block with bare
   comma-separated paths yields those paths; a mixed block (one backticked token + bare text)
   yields only the backticked token; a plan with no `Files:` block still throws via
   `assertOrderable` at init without positions.
4. **Lint rule tests:** `bare-files-path` flags a bare-path `- Files:` line, stays silent on an
   all-backticked line, and exits 0 by default (advisory posture preserved).
5. **Structure lock:** `war-strategy-structure.test.sh` fails if the rewritten `- Files:` template
   line (with its backtick requirement) is removed or reworded.
6. **Existing decoy test still green** and its comment names `assertOrderable`'s
   unparseable-footprint throw as the first-line catch with the exactly-2 assertions as backstop
   (#816).
7. **Token sweep — old ceiling prose:** grep `campaign-ledger.mjs` and `campaign-ledger.test.mjs`
   for `out of contract`, `first markdown link`, and `ENOENT` and handle every match against the
   new first-table + fallback mechanics. Grep is a floor, not a ceiling: after the grep, hand-scan
   both files' same-scope comments and test titles (every fixture-builder comment and every test
   name describing table extraction or footprint failure modes) and list each straggler found as a
   survey-derived correction.
8. **Token sweep — Files-contract prose:** grep `skills/war-strategy/SKILL.md`,
   `skills/war-machine/SKILL.md`, and `skills/war/SKILL.md` for `Files:` and handle every match
   that restates the Files contract without the backtick requirement. Grep is a floor, not a
   ceiling: after the grep, hand-scan the same-scope surrounding prose (the §2 "Reference the live
   artifact" Files/locators bullet, war-machine §3 roadmap step, plan-decomposition prose) for
   unbackticked path-contract statements the token missed, and list each straggler as a
   survey-derived correction.
9. **Token sweep — first-table contract mentions:** grep the repo's `skills/` tree for
   `resolveRoadmapPlans` and `plan-index table` and confirm every match states or is consistent
   with first-table-only ingestion. Grep is a floor, not a ceiling: after the grep, hand-scan the
   same-scope roadmap-template section of `skills/war-strategy/SKILL.md` and the war-machine
   handoff prose for table-ordering statements the tokens missed, and list each straggler as a
   survey-derived correction.
10. Full suite green: `node --test 'skills/**/*.test.mjs'` and
    `bash skills/war-strategy/war-strategy-structure.test.sh`.
