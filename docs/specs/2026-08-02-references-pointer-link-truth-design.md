# Post-eviction references/ integrity pass — pointer shapes, dead links, and the orphaned auditor-teach citation

**Issues addressed:** #1215, #1212, #1216, #1243

## 1. Context — the gap / problem

Plan `2026-07-28-prompt-surface-simplification` evicted doctrine blocks out of `agents/*.md` and
`skills/war/SKILL.md` into `skills/war/references/` under a byte-identical mandate (its End state 2).
That mandate deliberately froze four classes of integrity debt until the plan landed. The plan is now
fully landed, the byte-identity window is closed, and the debt is live at the current tip:

1. **Pointer shape (#1215).** `agents/war-auditor.md` carries four `../`-prefixed pointers to
   `auditor-teach.md` (in its Read-only git guard contract section, both Submodule pre-flight arms,
   and the reserved-lens paragraph under Review through your lens). Lead adjudication row O
   (2026-07-29, threaded into the plan's Tasks 4.1/5.1) settled the shape: agent-card pointers use
   the D4 owner-relative skeleton `skills/war/references/<file>` with no `../` prefix — a seat's cwd
   is a task worktree or the main checkout, so `../` walks out of the repo (the war-refiner.md
   defect fixed by commit 606b72b, now guarded for war-worker.md/war-servitor.md by the Task 5.1
   pointer-shape test in `skills/war/assets/workflow-template.test.mjs`; war-auditor.md is not yet
   covered). The same issue leaves open one design question: whether the submodule-family evictions
   in `worker-servitor-edges.md` should be pulled back inline, since those blocks fire precisely on
   cross-repo tasks where — per adjudication O(3) — no path form resolves at all.
2. **Dead relative links (#1212).** `resume-and-recovery.md` and `submodule-flows.md` (and, same
   class, `worker-servitor-edges.md`) were moved one directory down verbatim, so their moved blocks'
   relative links resolve one level short: `references/design.md` points at a nonexistent
   `references/references/`, `../../docs/adr/…` at `skills/docs/adr/…`, and
   `worker-servitor-edges.md`'s `../docs/adr/0002-scope-by-agent-type.md` at
   `skills/war/docs/…`. Each file's header carries the sanctioned in-plan mitigation — a caveat
   instructing readers to mentally re-base the links — which was always a placeholder for this pass.
3. **Dangling citation (#1243 first half, #1216 finding 2 — the mandated overlap).** Step 4 of
   `auditor-teach.md`'s Gitlink-bump `pin-validity` lens attributes the Lead's pre-flight
   reconciliation to "`SKILL.md`, submodule co-source-of-truth" — but that doctrine moved to
   `submodule-flows.md`'s "Resume — submodule remote as co-source-of-truth" section in the plan's
   phase 2, and `skills/war/SKILL.md` no longer contains the phrase at all. An auditor following the
   citation lands nowhere. #1216 prescribed a header-caveat remedy only because byte-identity was
   still binding; that remedy is superseded here by a direct citation repair, discharging both issues.
4. **Unrecorded revert doctrine (#1243 second half).** A phase-close polish commit absorbing N
   queued findings was reverted wholesale with only git's auto-generated body; the redo pass
   re-derived its queue from findings open at redo time and permanently orphaned one fix (the
   dangling citation above is that orphan). The class recurred two phases later as a
   green-by-deletion revert. The standing adjudication rule exists only as a memory lesson
   (`phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings`) — no live
   doctrine surface records it.

## 2. Pivotal constraints

- **Adjudication O is ratified and not re-opened here.** O(1): a references/ pointer is best-effort
  enrichment, never the sole carrier of a blocking rule. O(2): the D4 owner-relative skeleton —
  bare `references/<file>` on owning surfaces, `skills/war/references/<file>` on agent cards, never
  `../`-prefixed. O(3): no plugin-root anchor is introduced — `${CLAUDE_PLUGIN_ROOT}` is unset
  outside hooks and the Read tool does not expand env vars, so **no path form resolves against a
  foreign target repo**; inline retention of decisive rules is the only cross-repo mitigation.
- **The byte-identity window is closed, but the headers' claims must stay true.** Rewriting link
  targets inside moved blocks is now sanctioned; every header sentence claiming the moved blocks are
  "byte-identical to their pre-eviction text" must be amended in the same diff, or this pass mints a
  new false doc claim (the canonical-doc-precedent failure class).
- **Existing drift guards pin these files.** Fragment/section-presence guards read all four
  references files (`workflow-template.test.mjs` Task 5.1 pointer-shape + moved-fragment test and the
  auditor-teach OLD-absent scans; `skill-doc-contracts.test.mjs` D18/D21 and the relocated-doctrine
  pair tests; `war-config.test.mjs` recovery-relaunch doc-contracts; `land-decision.test.mjs`
  held:land-failed anchor). The pin follows the text (ADR 0025): any guard whose pinned bytes include
  a rewritten link target is updated in the same commit; the full JS suite is the arbiter.
- **ADR 0042 hot/cold law holds.** Evictions are not reversed wholesale; new doctrine defaults to a
  references/ file with a trigger.
- **Auditor guard discipline is untouched.** The citation repair edits only the citation
  parenthetical in step 4; the surrounding no-fetch sentence (fetch is deny-by-design for auditors)
  stays byte-intact.
- **This group never touches `skills/war/SKILL.md`** — the revert doctrine homes in
  `resume-and-recovery.md` (a file this group already owns via #1212), avoiding a cross-group
  SKILL.md collision.
- **Anchor by named construct/section, never line number** (repo standing rule; line numbers rot
  across the serial merge queue).

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Shape for war-auditor.md's four auditor-teach.md pointers | Rewrite all four link targets to `skills/war/references/auditor-teach.md` (adjudication O(2), D4 agent-card form). Link text (`[auditor-teach.md]`) unchanged. |
| Durability of the pointer fix | Extend the existing Task 5.1 pointer-shape guard family in `workflow-template.test.mjs` to `agents/war-auditor.md`: the shape-generic no-`../` regex assert (any depth) plus an exact-count assert of owner-relative `(skills/war/references/auditor-teach.md)` occurrences (four). Guard lands with the fix (ADR 0025 — guard travels with the fact). |
| Pull the worker-servitor-edges.md submodule evictions back inline? | **No — keep evicted.** O(1) is already satisfied: `agents/war-worker.md`'s Submodule/Gitlink-bump sections carry decisive-rules-inline digests covering every blocking rule (remote `-v` verification; ledger-only `merge_sha` authority; blocked-on-missing-dep; gitlink-only diff; superproject gitlink untouched), the dispatched worker prompt threads the runtime `TARGET REPO` / `GITLINK-BUMP` clauses in `workflow-template.js`, and the Task 5.1 test already asserts trigger-pointer + decisive-rule-inline per card. What the reference file sole-carries is enrichment (step ordering, WorkerResult field details), which O(1) permits. Add one header sentence to `worker-servitor-edges.md` making the cross-repo unreachability explicit (see Mechanics) so the posture is recorded on the file itself, not only in the adjudication thread. |
| Dead-link rewrite shape | Each relative target resolves from the file's own directory: sibling reference links `references/<x>.md` → `<x>.md` (link **text and target** both updated, so no fresh text/target mismatch is minted); `../../docs/…` → `../../../docs/…`; `worker-servitor-edges.md`'s `../docs/…` → `../../../docs/…`. |
| Header caveats | Delete the relative-link re-basing caveat sentence from all three headers (`resume-and-recovery.md`, `submodule-flows.md`, `worker-servitor-edges.md`). Amend each header's byte-identity claim to the truthful form: byte-identical **at eviction time**, relative link targets since rewritten to resolve from this file (this pass). The positional-words caveat ("below"/"above") stays — still true and load-bearing. |
| auditor-teach.md citation repair | Rewrite step 4's parenthetical to cite `submodule-flows.md`'s "Resume — submodule remote as co-source-of-truth" section **by section name**. Supersedes #1216's header-caveat remedy; discharges #1216 (its live remainder) and #1243's first half together. `auditor-teach.md`'s header byte-identity claim is amended the same way as the other three. |
| Phase-close revert doctrine home | New trailing section in `resume-and-recovery.md` with a `Trigger:` line and an explicit provenance note ("added post-eviction — not a moved block"), so the file's eviction-provenance header does not misdescribe it. A trigger pointer on `skills/war/SKILL.md`'s phase-close prose is **deferred** (non-goal — cross-group SKILL.md collision). |
| Shared validation | One link-resolution/citation sweep, shipped as a durable test (see Mechanics): every relative markdown link target under `skills/war/references/*.md` resolves file-relative; agent-card pointer targets resolve file-relative **or** repo-root-relative (the D4 shape is deliberately repo-root-anchored and must not false-red); zero hits for the retired citation form. |

## 4. Mechanics

### 4.1 `agents/war-auditor.md` — pointer normalization

The four pointers live in: the Read-only git guard contract intro sentence; the Submodule pre-flight
"submodule task" arm; the Submodule pre-flight "gitlink-bump task" arm; and the reserved-lens
paragraph following the lens catalog. Each `(../skills/war/references/auditor-teach.md)` target
becomes `(skills/war/references/auditor-teach.md)`. No other bytes on those lines change (the
section-fragment parentheticals — "§ Guard-contract mirror architecture" etc. — stay).

Guard: in `workflow-template.test.mjs`, alongside the Task 5.1 pointer-shape asserts, add
war-auditor.md to the shape-generic forbidden-`../` assert (the existing
`/\((?:\.\.\/)+[^)]*skills\/war\/references\/[^)]+\)/` pattern applied to the auditor card text,
which the suite already loads) and an exact-count assert of four owner-relative auditor-teach.md
pointer targets. Cite adjudication O(2) and this spec in the test comment.

### 4.2 `skills/war/references/worker-servitor-edges.md` — keep evicted; truthful header

- Rewrite the body's `(../docs/adr/0002-scope-by-agent-type.md)` link (Servitor confinement section)
  to `(../../../docs/adr/0002-scope-by-agent-type.md)`.
- Header rewrite: delete the sentence instructing readers to re-base relative links; qualify the
  byte-identity claim as at-eviction-time; add one sentence recording the cross-repo posture per
  adjudication O — on a foreign target repo no path form resolves this file, so the standing cards'
  decisive-rules-inline digests and the dispatched `TARGET REPO` / `GITLINK-BUMP` clauses are the
  operative carriers there, and this file is best-effort enrichment.
- **No block is pulled back inline** into `agents/war-worker.md`; the card is expected to need zero
  edits (it stays in scope for the validation sweep and for verifying the inline digests still cover
  every blocking rule — the Task 5.1 moved-fragment test's decisive-rule asserts are the arbiter).

### 4.3 `skills/war/references/resume-and-recovery.md` and `submodule-flows.md` — link truth (#1212)

- In `resume-and-recovery.md`, rewrite every short-resolving relative link target in the moved
  blocks. By construct class (not line number — sweep the whole file):
  - sibling reference links (`references/design.md`, `references/schemas.md`) → bare sibling form
    (`design.md`, `schemas.md`), updating link text to match;
  - ADR links (`../../docs/adr/0023-…`, `0008-…`, `0035-…`) → `../../../docs/adr/…`.
  In-page anchors (`#recovery-relaunch`) are already correct and untouched.
- `submodule-flows.md`'s body carries no short-resolving links (its header links are already
  sibling-correct); only its header caveat/claim rewrite applies.
- Both headers: delete the re-basing caveat sentence; qualify the byte-identity claim as
  at-eviction-time with link targets since rewritten.
- **Grep is a floor:** after the pattern sweeps (`](references/`, `](../../docs/`, `](../docs/`
  over `skills/war/references/*.md`), hand-scan each of the four files end-to-end for any remaining
  relative link or backticked path citation that misresolves from the file's location, and list each
  straggler as a survey-derived correction in the task's done report.

### 4.4 `skills/war/references/auditor-teach.md` — citation repair (#1243 + #1216, merged)

In step 4 of the "Gitlink-bump `pin-validity` lens" section, replace the parenthetical
`` (`SKILL.md`, submodule co-source-of-truth) `` with a citation naming
`` `submodule-flows.md` `` and its section "Resume — submodule remote as co-source-of-truth"
(section name, never a line number; a markdown link is optional — if used, sibling form
`submodule-flows.md`). Every other byte of step 4 — in particular the do-not-fetch discipline and
the best-effort `cat-file -e` allowance — stays intact. Amend the header byte-identity claim as in
4.2/4.3. This supersedes #1216's header-caveat remedy; #1216's finding 1 (qualifier-lock test
comments in `workflow-template.test.mjs`) is verified already fixed at the live tip — no action.

### 4.5 `skills/war/references/resume-and-recovery.md` — phase-close revert doctrine (#1243 second half)

Append a new top-level section (trailing position), shaped to the file's conventions:

- Heading: e.g. `## Phase-close polish reverts — never self-justifying`.
- A `Trigger:` line: you are adjudicating (or about to accept) a phase-close revert whose commit
  body is only git's auto-generated revert message.
- A one-line provenance note: added post-eviction (this pass, #1243) — **not** a moved block; the
  header's eviction provenance does not cover it.
- Body — the standing rule, tool-generic (no raw command recipes beyond git basics, per the
  process-recipe rot lesson): a phase-close revert carrying only an auto-generated body is never
  self-justifying. Before accepting one:
  1. run the gate at the reverted commit itself — a green target means the revert had no gate
     justification;
  2. diff the revert against still-live text for green-by-deletion — an assertion whose subject is
     still present in the guarded file is guard, never obsolescence;
  3. re-land with a real rationale naming which findings are re-opened; and diff the reverted
     commit's fix-set against the redo pass's fix-set **by finding title/file** before treating the
     absorb queue as drained (the redo re-derives its queue from findings open at redo time — the
     recorded orphaning mechanism).

### 4.6 Shared validation sweep — durable link/citation integrity test

Ship one small test (natural home: the doc-contract family in `skills/war/assets/`, e.g. a new
block in `skill-doc-contracts.test.mjs` or a sibling `*.test.mjs`) that:

- enumerates `agents/*.md` and `skills/war/references/*.md` by **directory scan**
  (`readdirSync`), never a hand-enumerated file list (the enumerated-destination `existsSync`
  fail-open lesson — a renamed file must widen the scan, not silently narrow it);
- extracts every markdown link target (`](…)`, skipping `#` in-page anchors and absolute URLs) and
  asserts the target file exists, resolving **file-relative for `skills/war/references/` files**,
  and **file-relative OR repo-root-relative for `agents/` files** — the dual arm exists because the
  D4 agent-card skeleton is deliberately repo-root-anchored and must not false-red (adjudication
  O(2)); a target that resolves under neither root is a failure naming the file and target;
- asserts zero occurrences of the retired citation: a line carrying both `SKILL.md` and
  `co-source-of-truth` inside one parenthetical, scoped to `agents/` + `skills/war/references/`.
  The pattern must **not** be the bare phrase — `submodule-flows.md`'s own section heading and
  `design.md`'s co-source-of-truth paragraph legitimately carry it (the
  backstop-retirement-grep-false-red lesson: sweep for the retired *citation form*, not the
  sanctioned replacement's substring).

Non-vacuity: demonstrate the test RED once by temporarily re-introducing one `../`-prefixed target
(or one short-resolving link) before landing it green.

## 5. Surface changes

| File | Change |
|---|---|
| `agents/war-auditor.md` | Four pointer targets normalized to the D4 agent-card form (no other edits). |
| `agents/war-worker.md` | Expected zero edits — in scope for the sweep and the decisive-rules-inline verification only. |
| `skills/war/references/auditor-teach.md` | Step-4 citation repaired to name submodule-flows.md's section; header byte-identity claim qualified. |
| `skills/war/references/worker-servitor-edges.md` | ADR 0002 link re-based; header caveat replaced with the truthful claim + cross-repo-posture sentence. |
| `skills/war/references/resume-and-recovery.md` | All short-resolving link targets rewritten; header caveat dropped / claim qualified; new trailing revert-doctrine section. |
| `skills/war/references/submodule-flows.md` | Header caveat dropped / claim qualified (body links already correct). |
| `skills/war/assets/workflow-template.test.mjs` | Task 5.1 pointer-shape guard family extended to war-auditor.md (no-`../` + count-of-four). |
| `skills/war/assets/skill-doc-contracts.test.mjs` (or sibling test file) | New link-resolution + retired-citation sweep test (4.6). |

No changes to `skills/war/SKILL.md`, `workflow-template.js`, any hook, or any dispatched prompt
literal. Docs-plus-tests only; no behavioral diff. No release is implied by this spec — if the
campaign's roadmap attaches one, the version is the next free patch resolved from the four slots at
land time (version literals are non-authoritative).

## 6. New domain terms (CONTEXT.md)

None. ("Owner-relative pointer skeleton" is already established by ADR 0042 D4 and adjudication O;
this spec applies it, it does not coin it.)

## 7. Recommended ADRs

None required. Optional (deferred, not part of this group's scope): promoting adjudication row O's
cross-repo pointer doctrine from the red-team report/issue thread into a short ADR, so future
eviction plans cite a durable record instead of an issue comment.

## 8. Open risks / implementation notes

- **Fragment guards may pin rewritten bytes.** Presence-fragment guards over these files were
  authored against the current text; if any pinned fragment happens to include a link target this
  pass rewrites, that guard REDs — update it in the same commit (the pin follows the text, ADR
  0025). The full `node --test 'skills/**/*.test.mjs'` run is the discovery mechanism; do not
  pre-enumerate the guards by line number.
- **Heading→EOF extraction spans.** The relocated-doctrine pair tests extract
  `resume-and-recovery.md` constructs by heading-to-EOF spans; appending the new trailing section
  enlarges a span but leaves every presence assert satisfied. Verify via the suite, not by
  assumption.
- **Dual-resolution checker looseness.** The agents/-side file-relative-OR-repo-root arm could in
  principle mask a dead link that coincidentally resolves under the other root. Accepted: both
  roots are inside the repo, so any resolution is a real file; the alternative (per-shape
  enumeration) reintroduces the enumerated-list fail-open hazard.
- **Link text vs target.** Where a sibling rewrite changes `references/design.md` → `design.md`,
  update the link text too; leaving the old text minting a text/target mismatch is the same
  misdirection class this pass exists to retire.
- **war-worker.md is expected untouched.** If implementation finds a blocking rule sole-carried by
  `worker-servitor-edges.md` (contradicting the D2 resolution's verified premise), that is a spec
  contradiction — escalate as a plan defect, do not silently pull the block inline.

## 9. Non-goals / deferred

- **`agents/war-setup-scout.md`'s two `../`-prefixed links** (`../skills/_shared/provision.mjs`,
  `../skills/war/references/schemas.md`) — identified by the manual survey behind this spec's grep
  sweeps; deliberately out of scope (no issue in this group names the file; both links currently
  resolve as file-relative markdown). Flagged for a follow-up normalization under adjudication
  O(2)'s general agent-card rule.
- **A SKILL.md trigger pointer to the new revert-doctrine section** — deferred to avoid the
  cross-group `skills/war/SKILL.md` collision this group was carved to remove.
- **#1216 finding 1** — the qualifier-lock comment blocks in `workflow-template.test.mjs`; verified
  already fixed at the live tip, no action.
- **Re-opening adjudication O** in any form (pointer shape, plugin-root anchors, cross-repo
  resolution) — settled.
- **Wholesale pull-back of any evicted block** — rejected by the D2 resolution; ADR 0042's hot/cold
  law stands.
- **`refiner-recovery.md`'s missing `Trigger:` line (#1221)** and every other issue outside this
  group's four.

## 10. Validation criteria

1. `grep -n '](../skills/' agents/war-auditor.md agents/war-worker.md` → zero hits, and
   war-auditor.md carries exactly four `(skills/war/references/auditor-teach.md)` link targets.
   **Grep is a floor:** hand-scan both cards end-to-end for any other `../`-prefixed or
   short-resolving link and list each straggler as a survey-derived correction
   (war-setup-scout.md's two links are pre-identified and out of scope per §9).
2. Every relative markdown link target in the four `skills/war/references/` files named in §5
   resolves to an existing file from the file's own directory. **Grep is a floor:** after the
   pattern sweeps (§4.3), hand-scan the same files for backticked prose path citations that
   misresolve and list stragglers as survey-derived corrections.
3. Zero hits for the retired citation form (a parenthetical carrying both `SKILL.md` and
   `co-source-of-truth`) across `agents/` and `skills/war/references/`; `auditor-teach.md` step 4
   cites `submodule-flows.md`'s "Resume — submodule remote as co-source-of-truth" section by name,
   with the step's no-fetch sentences otherwise byte-unchanged. **Grep is a floor:** hand-scan
   auditor-teach.md for any other citation still naming `SKILL.md` as a doctrine home and list
   stragglers.
4. No header under `skills/war/references/` still instructs readers to mentally re-base relative
   links; every remaining byte-identity claim in the four files' headers is qualified as
   at-eviction-time.
5. `resume-and-recovery.md` carries the new trailing section with a `Trigger:` line, the
   not-a-moved-block provenance note, and all three adjudication duties plus the fix-set-comparison
   duty (§4.5) — verifiable by section heading and duty keywords, not line numbers.
6. The extended pointer-shape guard REDs when a `../` prefix is temporarily reintroduced on any
   war-auditor.md pointer (demonstrated-RED evidence in the task's done report), and the new
   link-resolution sweep test REDs on a temporarily short-resolved link (same evidence discipline).
7. `node --test 'skills/**/*.test.mjs'` fully green at the landed tip; any pre-existing doc guard
   whose pinned fragment included a rewritten link target was updated in the same commit.
8. The diff touches only the files enumerated in §5 — no `skills/war/SKILL.md`, no
   `workflow-template.js`, no hooks, no dispatched-prompt literals.
