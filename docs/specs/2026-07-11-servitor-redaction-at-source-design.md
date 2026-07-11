# Servitor redaction at source — repo-relative locate-cues on both prompt surfaces

Source: `/survey-corps` 2026-07-11, from one servitor-memory friction filed off the 2026-07-08
memory-frictions campaign.
Not yet a plan — convert with `/war-strategy`, then validate with `/red-team`.

**Issues addressed: #726.**

## 1. Context — the gap / problem

When the servitor writes a `type: project` lesson whose body or absence-note names the file it
inspected, the D3 VERIFY-ON-WRITE locate-cue directive ("verify still present before acting — found
at `<path>` @ phase X") gives no format constraint on `<path>`. The servitor fills it with the
absolute checkout path it happened to Read/Grep (e.g. `/Users/<name>/GitHub/WorkAuditRefine/...`).
At Gate-2 promotion the fail-closed redaction lint (`LINT_PATTERNS` `home-path` entry in
`skills/_shared/war-memory.mjs`, `/\/(?:Users|home)\/[A-Za-z0-9._-]+/`) correctly flags the path and
demotes the lesson to the local root, forcing a manual placeholder substitution per lesson before it
can be committed. This recurred on at least three lessons in the 2026-07-08 memory-frictions
campaign (`war-memory-candidates-apply-default-flip-pending-verification`,
`adr-citing-local-only-lesson-creates-dangling-repo-link`,
`servitor-verify-on-write-worktree-can-lag-just-landed-phase`).

The paths are **incidental** — they name the checkout the servitor happened to inspect, not a
durable fact. The lint is doing its job (it is the net); the defect is upstream: the directive that
*produces* the paths never tells the servitor what shape a durable locate-cue takes. Verified at
master tip: neither `agents/war-servitor.md` (D3 bullet, "Referent **found** →" clause, and the
finding-match clause) nor the dispatched servitor Wrap-up prompt (the `D3 VERIFY-ON-WRITE` `pt`
clause inside the Wrap-up `agent(...)` dispatch in `skills/war/assets/workflow-template.js`) carries
any repo-relative or placeholder-path instruction.

## 2. Pivotal constraints

1. **Prompt-surface split (both surfaces, same commit).** The D3 directive lives on the standing
   card (`agents/war-servitor.md`) AND in the string-built dispatched prompt (the Wrap-up `pt`
   block in `workflow-template.js`). Per the `standing-instruction-vs-dispatched-prompt-coverage-split`
   lesson, a behavior change must land on both in the same commit **with** a both-surfaces drift
   test — the surfaces drift silently otherwise.
2. **The lint is the net, not the decision.** `LINT_PATTERNS` and the fail-closed demotion path in
   `war-memory.mjs` are untouched. A lesson that still carries an absolute home path (servitor
   non-compliance, hand-authored lesson, any other producer) must still be flagged and demoted —
   the directive reduces the false-positive-on-incidental-paths workload; it never substitutes for
   the lint.
3. **`ServitorResult.files_written` stays absolute.** The Return contract (war-servitor.md `## Return`
   section; the `RETURN:` `pt` clause in the Wrap-up dispatch) requires absolute paths under the
   local memory root — the Lead's Gate-2 reconciliation is an absolute-prefix check. The new
   directive governs **lesson body content** (body, description, absence-notes, locate-cues) only,
   and must say so explicitly, or a compliant servitor will "helpfully" relativize `files_written`
   and fail the phase.
4. **Prose-enforced directive.** LLM compliance cannot be code-asserted; what IS testable is that
   both surfaces carry the directive (drift guard) and that the net still catches non-compliance
   (existing lint tests). No new hook, no new gate, no enum change — ADR 0005 / ADR 0008 surfaces
   are untouched.
5. **Drift-guard floor must match the true count.** The `D3 — both-surfaces directive registry`
   test in `workflow-template.test.mjs` asserts `REGISTRY.length >=` a floor. Per the #693
   off-by-one lesson (presence-count floor below true occurrence count = silent-drop gap), adding a
   row must raise the floor to the new true row count, not leave slack.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Fix location: source directive vs. lint auto-rewrite vs. Gate-2 auto-substitution | **Source directive.** Auto-rewrite would make the lint mutate content it should only report on; Gate-2 substitution keeps the manual toil, just moves it. The lint stays the unchanged net. |
| Path vocabulary | Repo-relative paths (e.g. `skills/_shared/war-memory.mjs`) **preferred** for in-repo referents; the three placeholders `<repo-root>`, `<session-worktree>`, `<local-memory-root>` for locations outside the repo tree or where the root itself is the point. These are exactly the substitutions the operator already performed manually in the three tripped lessons. |
| Where the directive lives in each surface | **Inside D3 VERIFY-ON-WRITE** — the point where the locate-cue and absence-note formats are defined — on both surfaces; not a new section. The finding-match clause references "the locate-cue", so fixing the cue's definition covers it without a second edit point. |
| Drift-guard shape | **A new row in the existing `D3 — both-surfaces directive registry`** in `workflow-template.test.mjs` (surfaces: `war-servitor.md` + the dispatched servitor Wrap-up prompt; anchors matching the shared directive wording). No bespoke test — the registry is the established mechanism for exactly this class. |
| Directive scope boundary | Applies to lesson **content** (body, `description`, absence-notes, locate-cues); explicitly **excludes** `ServitorResult.files_written` — the exclusion is stated in the directive text itself on both surfaces. |
| Registry floor | Bump the `REGISTRY.length >=` assertion (and its message) to the new true row count in the same edit. |
| Locate-cue exemplar | Reword the exemplar on both surfaces from `found at <path>` to name a repo-relative example, so the model's few-shot anchor demonstrates the compliant shape rather than a free variable. |

## 4. Mechanics

### `agents/war-servitor.md` (standing card)

Extend the **D3 — Verify-on-write** discipline with a path-hygiene clause covering both D3 arms
(found → locate-cue; absent → absence-note):

- Any path written into lesson content (body, description, locate-cue, absence-note) is
  **repo-relative** for in-repo referents (e.g. `skills/war/assets/workflow-template.js`), or one of
  the placeholders `<repo-root>`, `<session-worktree>`, `<local-memory-root>` for out-of-tree
  locations — **never** an absolute home/checkout path (`/Users/...`, `/home/...`). Rationale line:
  the checkout path is incidental; the fail-closed Gate-2 redaction lint demotes any `type: project`
  lesson carrying one.
- Explicit carve-out in the same clause: this governs lesson content only — the
  `ServitorResult.files_written` return contract (see `## Return`) still requires **absolute** paths
  and is unchanged.
- Update the locate-cue exemplar in the "Referent **found**" bullet to show a repo-relative path.
  The finding-match clause ("include the locate-cue") inherits the fixed definition — verify no
  other absolute-path exemplar remains on the card.

### `skills/war/assets/workflow-template.js` (dispatched Wrap-up prompt)

Mirror the same clause into the `D3 VERIFY-ON-WRITE` `pt` line of the servitor Wrap-up dispatch
(the `agent(...)` call guarded by `landResult.status === 'landed' && memoryLocalRoot`), keeping the
wording aligned with the standing card closely enough that one anchor set matches both surfaces.
Same commit as the standing-card edit.

Sweep step: grep both surfaces for remaining absolute-path exemplars and unconstrained `<path>`
locate-cue prose (`found at`, `/Users/`, `absence-note`). **Grep is a floor, not a ceiling** — also
hand-scan the full servitor-facing prose on both surfaces (every D-discipline, the finding-match
clause, the Return section, and the Wrap-up `pt` block end to end) for absolute-path exemplars the
tokens miss, and list any stragglers as survey-derived corrections in the implementing task.

### `skills/war/assets/workflow-template.test.mjs` (drift guard)

Add one row to the `REGISTRY` array inside the `D3 — both-surfaces directive registry` test:

- `name`: servitor path-hygiene (repo-relative / placeholder locate-cues; files_written stays absolute)
- `surfaces`: `['war-servitor.md', servitorMd]`, `['servitor Wrap-up prompt', servitorP]` — same
  pair as the existing servitor rows.
- `anchors`: regexes matching the shared directive wording — at minimum: repo-relative, each of the
  three placeholder tokens (`<repo-root>`, `<session-worktree>`, `<local-memory-root>`), a
  never-absolute-home-path anchor, and the files_written-stays-absolute carve-out. Anchor on
  distinctive mid-sentence fragments (per the `prompt-only-clause-grep-guard-must-tolerate-sentence-case`
  lesson: case-insensitive, mid-sentence anchors).
- Raise the `REGISTRY.length >=` floor and its message to the new true row count.

Delete-the-feature check for the guard: removing the clause from **either** surface must fail the
registry row (each anchor is asserted per-surface, so this holds by the registry's existing loop).

### `skills/_shared/war-memory.mjs` + `war-memory.test.mjs` (the net — no change)

No edit. The existing tests already pin the net's behavior and act as this spec's
delete-the-feature backstop on the lint side: `routeRoot('project', true, /*lintHit*/ true)` →
`'local'` (fail-closed demotion) and the `home-path` pattern test (a body containing
`/Users/<name>/...` produces `home-path` hits). The implementing task asserts the diff to this file
family is empty.

## 5. Surface changes

| File | Change |
|---|---|
| `agents/war-servitor.md` | Path-hygiene clause added to D3; locate-cue exemplar reworded; files_written carve-out stated |
| `skills/war/assets/workflow-template.js` | Same clause mirrored into the Wrap-up `D3 VERIFY-ON-WRITE` `pt` line (same commit) |
| `skills/war/assets/workflow-template.test.mjs` | New registry row in the `D3 — both-surfaces directive registry` test; `REGISTRY.length` floor raised |
| `skills/_shared/war-memory.mjs` | **None** (asserted unchanged) |
| `skills/_shared/war-memory.test.mjs` | **None** (asserted unchanged) |

## 6. New domain terms (CONTEXT.md)

None. "Locate-cue", "absence-note", "Gate-2 promotion", and "redaction lint" are already in the
ubiquitous language; this spec constrains an existing term's format rather than coining one.

## 7. Recommended ADRs

None. This is a prompt-prose fix inside the existing prompt-surface-split and Gate-2 doctrines; no
architectural decision changes. (ADR 0005 / ADR 0008 surfaces untouched — no enum members, no git
semantics.)

## 8. Open risks / implementation notes

- **Anchor brittleness vs. wording freedom.** The registry row couples both surfaces to shared
  wording. Keep the directive sentence structurally identical on both surfaces (the established
  practice for existing servitor rows) so one anchor set holds; anchor placeholders as literal
  tokens (`<repo-root>` etc. — regex-escape the angle brackets) which are load-bearing and will not
  be reworded.
- **Compliance is probabilistic.** A servitor can still emit an absolute path; the lint demotes it
  exactly as today. The success metric is fewer manual Gate-2 substitutions, not zero lint hits —
  do not tighten the lint or add enforcement on the strength of this directive.
- **Existing repo lessons are not swept.** Already-promoted lessons passed the lint (they were
  hand-substituted); no retroactive body rewrite. A future recurrence-update inherits the new
  directive naturally via the same-slug local-copy flow.
- **The `pt` tag throws on undefined interpolation** — the new prompt line is static prose (no new
  `${}` interpolations), so no new throw surface; keep it that way.
- Anchor all edits by named construct (the `D3 VERIFY-ON-WRITE` clause, the `REGISTRY` array, the
  `## Return` section) — never by line number; the Wrap-up block's position moves.

## 9. Non-goals / deferred

- **No lint change** — patterns, fail-closed posture, and demote-report-never-drop are out of scope.
- **No Gate-2 auto-substitution** of flagged paths (mutating content at the net contradicts
  report-only linting).
- **No hook enforcement** of path shape on servitor Writes (`validate-servitor-provenance.sh`
  stays a provenance/shape gate; content-linting a body at PreToolUse is the lint's job at Gate-2).
- **No retroactive sweep** of existing `docs/learnings/` bodies.
- **No relativization of `ServitorResult.files_written`** — explicitly the opposite: the absolute
  contract is re-stated inside the new directive's carve-out.

## 10. Validation criteria

1. `agents/war-servitor.md` D3 carries the path-hygiene directive: grep the card for
   `repo-relative` and each of `<repo-root>`, `<session-worktree>`, `<local-memory-root>` — all
   present within the D3 discipline.
2. The dispatched servitor Wrap-up prompt carries the same directive: the `D3 VERIFY-ON-WRITE` `pt`
   clause in `workflow-template.js` greps for the same four tokens.
3. Both surface edits land in the **same commit** (one task owns both files; `git show --stat` of
   the task commit lists both).
4. The directive on both surfaces explicitly excludes `ServitorResult.files_written` from
   relativization (grep each surface for the carve-out adjacent to the path-hygiene clause), and
   the Return/RETURN absolute-path contract text is byte-unchanged on both surfaces.
5. A new row exists in the `D3 — both-surfaces directive registry` test (`workflow-template.test.mjs`)
   binding `war-servitor.md` + the dispatched Wrap-up prompt to the directive's anchors, and the
   `REGISTRY.length >=` floor equals the new true row count.
6. Delete-the-feature (directive): temporarily reverting the clause on **either single surface**
   makes the registry test fail (run once per surface in a scratch tree; both must red).
7. Delete-the-feature (net unchanged): a lesson body containing an absolute home path
   (`/Users/<name>/...`) still produces a `home-path` lint hit and routes `local` — the existing
   `war-memory.test.mjs` assertions (`routeRoot('project', true, true) === 'local'`; the
   `home-path` pattern test) pass unmodified, and `git diff` for
   `skills/_shared/war-memory.mjs` + `skills/_shared/war-memory.test.mjs` is empty.
8. Full JS suite green: `node --test 'skills/**/*.test.mjs'`.
9. Sweep completeness: grep of both surfaces for `/Users/` and unconstrained `found at <path>`
   exemplars returns no servitor-facing hit, **and** the implementing task's report lists the
   manual same-scope prose survey (both surfaces end to end) with any survey-derived corrections
   applied or explicitly none found.
