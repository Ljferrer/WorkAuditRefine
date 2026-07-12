# Memory tooling frictions — projection dedup + budget headroom, mining-citation hygiene, migrate pre-flight guard

Issues addressed: #820, #821, #822, #823

## 1. Context — the gap / problem

Four verified frictions in the memory-system tool-chain (all `skills/_shared/war-memory.mjs` and its consuming skill prose; none touch the run engine):

- **#821 — cross-root slug dedup missing.** `buildProjection` in `skills/_shared/war-memory.mjs` maps *every* hot record to a MEMORY.md row (`hot.map(projectionRow)`), and `walkCorpus` concatenates the local and repo roots verbatim. Gate-2 promotion (ADR 0022) is copy-with-marker — the `metadata.promoted`-stamped local copy stays hot by design as the canonical recurrence-edit target — so every promoted lesson emits **two rows for one fact** against the single hard cap.
- **#820 — repo rows consume nearly the whole cap.** The single `HARD_BYTES` = 24,400 B / `HARD_LINES` = 200 cap has no per-root awareness. The 113 hot `docs/learnings/` lessons measured 22,720 B of projection at issue time (< 1.7 KB headroom). Repo-root frontmatter `description` lines are git-tracked, so the local housekeeping pass cannot shrink them; once repo rows fill the cap, every future servitor write and render hits the `refuse` verdict regardless of local hygiene. `archiveCandidates` ranks purely by tier + age with no root awareness, so it nominates repo-root lessons the local pass cannot act on.
- **#822 — mining citation self-trips the redaction lint.** Step 0 "Mine", step 3 ("Draft the issue") of `skills/survey-corps/SKILL.md` offers the citation form `<local-root>/<slug>.md` without mandating the placeholder stay literal. A drafter that resolves it to the real local memory root produces a home-directory path, which matches the `home-path` entry in `LINT_PATTERNS` (`war-memory.mjs`), and the mandatory fail-closed lint at step 5 withholds the entire otherwise-clean issue. The lint is correct; the directive is the gap.
- **#823 — migrate pre-flight fails on the most common state.** The `/lessons-learned` migrate "Pre-flight — the opt-in gate" instructs `war-config.mjs .claude/war/config.json --fill-defaults`, but `main()` in `skills/war/assets/war-config.mjs` catches the `readFileSync` failure and exits 1 (`cannot read <path>`) — so the instructed command fails on a fresh clone with no config. Only adjacent prose covers the gap; the other two consumers already guard it (`skills/war/SKILL.md` checks existence first; `skills/red-team/SKILL.md` is fail-open on nonzero exit).

Coupling: the #821 dedup directly recovers projection bytes for #820 — one duplicated slug is one whole recovered row.

## 2. Pivotal constraints

1. **The redaction lint stays fail-closed. No auto-scrub, ever.** #822 is fixed in prose, not by softening `LINT_PATTERNS` or adding scrubbing.
2. **Gate-2 promotion semantics are ratified and untouched** (ADR 0022): copy-with-marker, local copy stays hot as the canonical recurrence-edit target. The dedup lives in projection rendering, never in the promotion path.
3. **`MEMORY.md` is a generated projection** — budgets are hard 200 lines / 24,400 bytes (`render` refuses above), advisory 17,000 bytes. Those constants do not move.
4. **`/war`'s fail-loud consumption of `war-config.mjs` must not be perturbed.** The CLI's exit-1-on-unreadable-file contract is deliberately consumed fail-loud by the /war Lead; #823 is fixed at the sole exposed prose surface, not by widening the CLI.
5. **Archiving is a move + note, never a deletion**; repo-root archiving travels via a reviewed commit, local archiving does not.
6. **Anchor by named construct, never line number** — all references below are to named functions/headings.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Where does cross-root dedup live? | In `buildProjection` only (filter the hot set by slug before `projectionRow` mapping). Not in `walkCorpus` — query ranking, `inboundCiters`, and lint walks keep seeing both copies. |
| Which copy wins a slug collision? | The **repo-root** record (it carries the `[repo]` marker readers rely on; the local copy is the edit target, not the published fact). |
| Does the deduped or full hot set feed `archiveCandidates`? | The **deduped** set — a shadowed local duplicate costs zero projection bytes, so archiving it recovers nothing and it must not be nominated as a budget candidate. |
| Per-root byte budgets? | **No** (deferred). Single cap retained; dedup + repo-side description diet restore headroom without new budgeting machinery. |
| Root-aware `archiveCandidates` ranking? | **Yes, minimal**: within equal provenance tier, local-root candidates rank before repo-root (age still the final tiebreak) — local archiving is actionable without a PR. |
| Repo-side remediation for #820? | A reviewed change to `docs/learnings/`: tighten the longest frontmatter `description` lines and archive (move to `docs/learnings/archive/` + note) the lowest-tier candidates until the headroom target in §10 holds. Projection size is driven by `description` lines, not bodies. |
| #822 fix surface? | `skills/survey-corps/SKILL.md` prose only (Step 0 "Mine", step 3): the `<local-root>` placeholder must stay **literal** (or cite slug-only); resolving it is forbidden. No lint change. |
| #823 fix surface? | `skills/lessons-learned/SKILL.md` prose only: an explicit `test -f` absent-file branch ahead of the `--fill-defaults` invocation (absent → defaults, i.e. `commitLearnings: false`). No `war-config.mjs` change. |

## 4. Mechanics

### 4.1 `buildProjection` dedup (#821, primary byte recovery for #820)

In `skills/_shared/war-memory.mjs`, after the `temperature === 'hot'` filter and before the `projectionRow` map, collapse the hot set by slug: when the same slug appears in both roots, keep the `root === 'repo'` record and drop the local one from the *projection input only*. `archiveCandidates` is then called on this deduped set (see the invariant-comment sweep below — the "every hot lesson gets exactly one row" invariant inside `buildProjection` becomes "every hot *fact* gets exactly one row; a promoted lesson's local twin is shadowed by its repo row").

Token sweep: **grep `buildProjection` and `projectionRow` across `skills/`, handle every caller/consumer.** Grep is a floor, not a ceiling — after the grep, hand-scan `war-memory.mjs` and `war-memory.test.mjs` same-scope titles and comments (e.g. the `Invariant hot ≡ indexed` comment inside `buildProjection`, the projection-render section header above `projectionRow`, and any test title asserting one-row-per-hot-lesson) and list each straggler prose/comment that still states the pre-dedup invariant as a survey-derived correction in the same commit.

Tests (`skills/_shared/war-memory.test.mjs`): a two-root fixture with a same-slug lesson in both roots asserts exactly one row, carrying the `[repo]` marker; a control slug present only locally still renders; the candidates list from a shadowed-duplicate fixture omits the shadowed local slug.

### 4.2 Root-aware `archiveCandidates` (#820)

In the `archiveCandidates` comparator, insert a root clause between the existing tier comparison and the date tiebreak: equal tier → `local` before `repo` → then oldest first. One comparator clause, one test case (equal-tier local/repo pair ordered local-first).

### 4.3 Repo-side headroom remediation (#820)

A reviewed change to `docs/learnings/` (this is content work, gated by the same fail-closed redaction lint CI already runs): tighten the longest frontmatter `description` lines (they, not bodies, drive projection bytes) and archive the lowest-tier repo candidates — per §4.2's ranking — by explicit slug (never `archive --candidates` without `--apply` review), each as a move into `docs/learnings/archive/` plus a note, until §10's headroom target holds. Cross-check inbound links (`inboundCiters`) before archiving; hubs stay.

### 4.4 Survey-corps citation hygiene (#822)

Amend Step 0 "Mine", step 3 of `skills/survey-corps/SKILL.md`: the lesson-path citation for a local-root lesson MUST use the **literal placeholder** `<local-root>/<slug>.md` (or slug-only); resolving `<local-root>` to a real filesystem path is forbidden — a resolved home path trips the `home-path` redaction pattern and withholds the whole issue.

Token sweep: **grep `<local-root>` in `skills/survey-corps/SKILL.md`, handle every occurrence.** Grep is a floor, not a ceiling — after the grep, hand-scan the same file's remaining steps and comments for any other prose that invites resolving a memory-root path (e.g. step 1's "resolved exactly as `war-memory render-index` resolves the local root" enumeration prose and the step-5 lint recipe) and list each spot that needs the same keep-it-literal caveat as a survey-derived correction.

### 4.5 Migrate pre-flight absent-config guard (#823)

Amend the "Pre-flight — the opt-in gate" step of `skills/lessons-learned/SKILL.md`: first `test -f .claude/war/config.json`; absent → effective defaults (`memory.commitLearnings: false`), skip the resolver call entirely; present → run the existing `--fill-defaults` command unchanged. The Accept branch's `--stdin --fill-defaults` write path already handles the absent-file case and is untouched.

Token sweep: **grep `--fill-defaults` across `skills/`, handle every prose consumer** — confirm each either guards file existence first or is deliberately fail-loud/fail-open, and that no other surface instructs the bare `<path> --fill-defaults` invocation without an absent-file posture. Grep is a floor, not a ceiling — after the grep, hand-scan `skills/lessons-learned/SKILL.md`'s same-scope steps and comments for any other spot that reads config state (e.g. the evict-mode `commitLearnings` prompt) and list each one needing the absent-file caveat as a survey-derived correction.

## 5. Surface changes

- `skills/_shared/war-memory.mjs` — `buildProjection` slug dedup (prefer repo); `archiveCandidates` root-aware comparator; invariant comments updated in the same commit.
- `skills/_shared/war-memory.test.mjs` — dedup, candidates-omit-shadowed, and comparator test cases.
- `docs/learnings/` — description diet + explicit-slug archives (reviewed; lint-gated).
- `skills/survey-corps/SKILL.md` — Step 0 Mine step 3 literal-placeholder mandate (+ survey-derived caveats).
- `skills/lessons-learned/SKILL.md` — pre-flight `test -f` branch (+ survey-derived caveats).

Not touched: `skills/war/assets/war-config.mjs` (contract preserved), `LINT_PATTERNS` (fail-closed preserved), the Gate-2 promotion path in `skills/war/assets/workflow-template.js` (ADR 0022 preserved).

## 6. New domain terms (CONTEXT.md)

None. ("Shadowed local twin" stays spec-local prose, not a glossary term.)

## 7. Recommended ADRs

None. ADR 0015 (two roots) and ADR 0022 (copy-with-marker promotion) are unchanged; the dedup is a projection-rendering detail beneath them.

## 8. Open risks / implementation notes

- **Stale-description window:** between a local recurrence edit and the next Gate-2 promotion, the projection shows the repo copy's older description (prefer-repo dedup). Accepted residual — the promotion overwrite re-syncs it, and the `[repo]` marker's meaning stays truthful.
- **Duplicate rows in query output are out of scope:** `walkCorpus` still returns both copies to the FTS index; a promoted lesson can surface twice in `query` results. Deliberate — dedup at index level would hide the canonical recurrence-edit target from retrieval.
- The `docs/learnings/`-on-unmerged-branch trap applies to §4.3 verification: pass `--repo docs/learnings` to `render-index`, or every `[repo]` row silently drops and the headroom measurement lies.
- Measured byte figures in §1 are point-in-time; re-measure at implementation, do not treat them as assertions.

## 9. Non-goals / deferred

- Per-root byte budgets or split caps in `buildProjection` — deferred until dedup + description diet prove insufficient.
- Any `war-config.mjs` CLI change (graceful absent-to-defaults mode) — the prose guard covers the sole exposed consumer.
- Any change to `LINT_PATTERNS`, lint fail-closed posture, or an auto-scrub path.
- Archiving the local promoted copy at Gate-2 promotion time — conflicts with the ratified recurrence-edit contract.

## 10. Validation criteria

1. `node --test skills/_shared/war-memory.test.mjs` green, including the new cases: same-slug two-root fixture → one row with `[repo]` marker; shadowed local slug absent from `candidates`; equal-tier comparator orders local before repo.
2. Live render after §4.1 + §4.3: `node skills/_shared/war-memory.mjs render-index --local "$CLAUDE_MEMORY_LOCAL" --repo docs/learnings` succeeds (verdict not `refuse`) with **≥ 4,000 bytes headroom** (projection bytes ≤ 20,400) and line count ≤ 200.
3. Redaction lint green on the remediated repo root: `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
4. Every archived repo lesson in §4.3 remains queryable (`query` by its slug terms returns it) and had inbound citers checked; no deletion in the diff — moves only.
5. `skills/survey-corps/SKILL.md` step 3 contains the literal-placeholder mandate; a drafter following it verbatim produces a citation line that passes `lint` (temp-file check per step 5's own recipe).
6. `skills/lessons-learned/SKILL.md` pre-flight, executed on a checkout with no `.claude/war/config.json`, reaches a `commitLearnings: false` determination without a nonzero-exit command in the happy path.
7. All three token sweeps in §4 report their grep hits **and** their manual same-scope survey stragglers (empty straggler lists are stated, not implied).
