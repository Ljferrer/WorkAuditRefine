# Servitor wrap-up grounds on a threaded landed-tip anchor — retire the cwd-is-tip premise from both prompt surfaces

**Source issues:** #990 — "Servitor wrap-up asserts its working tree is the committed tip — false in the modal case, and no landed-tip anchor is threaded."

**Sequencing note (survey manifest is authoritative):** this group depends on and must land after
`audit-adjudication-threading` (itself after `auditor-guard-ergonomics`). The chain exists solely to
serialize edits to the D3 both-surfaces directive registry and its exact no-slack row-count floor (#693)
in `skills/war/assets/workflow-template.test.mjs`, which all three groups touch.

## 1. Context — the gap / problem

The WAR engine dispatches the phase wrap-up servitor with **no landed-tip anchor**. Neither the
dispatched Wrap-up prompt string-built in `skills/war/assets/workflow-template.js` (the block guarded by
`landResult.status === 'landed' && memoryLocalRoot`) nor the standing card `agents/war-servitor.md`
threads the landed tip SHA or any readable checkout guidance. Worse, both surfaces assert the opposite of
observed reality:

- the Wrap-up prompt's `FINDING-MATCH CHECK` sentence: *"your post-land working tree IS the committed
  tip — no new capability needed"*;
- `agents/war-servitor.md` §Finding-match check: *"your post-land working tree \*is\* the committed tip,
  so this needs no new capability"*.

The lesson `docs/learnings/servitor-verify-on-write-worktree-can-lag-just-landed-phase.md`
(`code-verified`, 11 recorded recurrences across at least five campaigns, 2026-07-10 → 2026-07-19)
proves the premise false in the **modal** case: the servitor's cwd is routinely the main checkout or a
stale session worktree, with the landed branch present only as a loose local ref or never fetched at all.
Three of the last four wrap-ups hit the identical "main checkout, zero live worktrees" topology. The
consequence is confidently-wrong `code-verified` lesson tags, or rounds wasted hunting task worktrees
that Refine already reaped.

The engine already *has* the anchor: the land dispatch's contract returns
`{ mode: 'land-phase', status: 'landed', working_sha: '<merge-sha>' }`, and the handoff block (ADR 0013)
already computes exactly the right value — `tipSha` = `landResult.working_sha`, falling back to the last
SHA-shaped `gateHeadSha` in `mergedTasksForGateAudit`. It is computed *after* the Wrap-up dispatch and
never shown to the servitor. The gate-audit entries in `auditLog` (which the servitor *does* receive as
JSON) carry pinned `auditSha`/`gateHeadSha` values, but nothing tells the servitor they are its fallback
grounding surface.

ADR 0029 ("Capture grounds on the committed tip, not the working tree") ratified the finding-match check
and itself carries the same false premise twice (decision item 1: *"it runs after land, so its working
tree **is** the committed tip"*; the ADR 0002 bullet: *"its post-land working tree already reflects the
committed tip"*). The decision — ground captures on the committed tip — is correct and unchanged; the
stated *mechanism* (read your own cwd) is what the recurrences broke.

## 2. Pivotal constraints

1. **Both-prompt-surface split rule (ADR 0025).** Any servitor behavior change edits
   `agents/war-servitor.md` AND the string-built Wrap-up prompt in
   `skills/war/assets/workflow-template.js` in the same commit — they are hand-mirrored and drift
   silently.
2. **D3 both-surfaces directive registry, exact no-slack floor (#693).** The registry in
   `workflow-template.test.mjs` (test `D3 — both-surfaces directive registry`) has
   `REGISTRY.length >= 10` where the floor message enumerates the true row set — the floor **equals**
   the true row count, no slack. A new both-surfaces directive lands its row in the registry **in the
   same task**, bumping the floor and its enumerating message together. This is the shared surface that
   forces serialization behind `audit-adjudication-threading`.
3. **Servitor confinement is untouchable here (ADR 0002).** No Bash, Read/Grep/Glob/Write/Edit only,
   writes hook-gated to the local memory root. Every mechanic in this spec must work through Read/Grep/
   Glob against paths the prompt names — no `git checkout`, no fetch, no new tools.
4. **`pt` tag rejects undefined interpolation (ADR 0034).** `working_sha` is contract-promised but not
   schema-`required` in `MERGE_RESULT` — a raw `${landResult.working_sha}` interpolation can throw the
   engine into `held:workflow-error`. Any threaded value must be pre-resolved to a defined string.
5. **Ratified-decision handling:** this group plausibly amends ADR 0029. Historical ADRs are superseded,
   never rewritten; the originating spec/plan
   (`docs/specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md`,
   `docs/plans/2026-07-08-memory-and-lessons-learned-hygiene.md`) stay uncorrected per convention
   (dated statements record drift as of authoring time). The design tree must resolve the ADR treatment
   explicitly.
6. **Anchor by named construct, never line number** — line numbers rot across the serial merge queue.
7. **Existing registry-row anchors must survive.** The current `servitor finding-match check` row anchors
   (`/finding-match/i`, `/named construct/i`, `/pattern, not live instance/i`, `/agent-unverified/i`)
   must stay green — the rewrite touches only the false-premise parenthetical, not the finding-match
   discipline itself.

## 3. Resolved design tree

| Decision | Options considered | Resolution + why |
|---|---|---|
| D1 — where the landed-tip SHA comes from | (a) interpolate `landResult.working_sha` raw; (b) hoist the handoff `tipSha` computation above the Wrap-up dispatch and reuse it in both; (c) a third, independent computation | **(b) Hoist and reuse.** The handoff block already computes the exact semantics wanted (`working_sha`, else last SHA-shaped `gateHeadSha` from `mergedTasksForGateAudit`, else null) — one source of truth, zero new semantics, and the handoff's own behavior is unchanged by the move. (a) violates the `pt` undefined guard (constraint 4); (c) invites drift between two tip definitions. When the hoisted value is null, the prompt renders a named placeholder ("landed tip unrecorded — ground via the gate-audit `auditSha` entries in your audit-log input"), never `undefined`. |
| D2 — how the servitor reaches the landed tree with no new capability | (a) engine provisions a fresh post-land worktree at the tip for the servitor; (b) grant the servitor read-only git Bash; (c) prompt-borne stale-cwd preflight + fallback ladder using existing Read/Grep/Glob | **(c) Prompt-borne ladder.** (a) adds a provision/reap lifecycle for a read-only consumer and re-creates the very reaping race the lesson documents; (b) reverses ADR 0002's no-Bash servitor confinement — enormous blast radius for a capture-time convenience. The 11 recurrences already distilled a working ladder that needs only Read/Grep/Glob: it becomes standing guidance instead of per-session detective work. |
| D3 — ladder content (distilled from the lesson, Recurrences 2–11) | full recurrence history inline vs. compact operational ladder | **Compact ladder, four steps:** (1) *preflight* — read the cwd's `.git` gitlink / `<repo-root>/.git/HEAD` and compare against the threaded landed tip + working branch; match ⇒ direct Read/Grep is `code-verified`-capable; (2) *worktree lookup* — enumerate `.git/worktrees/*` entries and match by each entry's `gitdir` physical path containing this plan's slug — never trust bare names (task-id and `_refinery` names collide across concurrent plans and git auto-suffixes numerically); a worktree `HEAD` equal to the threaded tip SHA is the strongest match; read referents at that entry's `gitdir` path; (3) *ref check* — a loose/packed ref for the landed branch without a live worktree is still a dead end for Read — do not spend rounds on it; (4) *gate-audit fallback* — trust the pinned `auditSha` verdicts (`gateEvidence:true`) in the audit-log input, and record anything else `agent-unverified` with the checkout-topology evidence in the absence-note; never assert a plan/code mismatch from a lagging view. The lesson file remains the canonical long-form detail (it is prefetch-retrievable); the prompt carries only the ladder. |
| D4 — where the ladder lives on each surface | duplicate inside D3 verify-on-write *and* finding-match; or one shared clause both reference | **One shared clause.** Standing card: a new subsection ("Landed-tip grounding — run before any D3 / finding-match read") adjacent to the admission checklist; both D3's absence-note arm and the finding-match check point at it. Template: one new `pt` block adjacent to the existing `FINDING-MATCH CHECK` sentence, plus a "Landed tip:" input line near the phase header. The hazard is one mechanism (stale cwd) — duplicating it per-discipline is drift surface. |
| D5 — the false-premise sentences | leave and merely add the ladder; or rewrite at both surfaces | **Rewrite at both surfaces, same commit.** The parenthetical "(your post-land working tree IS the committed tip — no new capability needed)" and its standing-card twin are replaced with an explicit inversion: the working tree is **not** assumed to be the committed tip — ground on the threaded landed tip via the grounding ladder. Leaving a directive that contradicts the adjacent ladder guarantees the servitor receives two incompatible instructions. |
| D6 — registry treatment | (a) widen the existing `servitor finding-match check` row's anchors to cover the new clause; (b) add a new registry row for the landed-tip grounding directive and bump the floor | **(b) New row + floor bump.** The grounding ladder is a distinct both-surfaces directive; folding its anchors into the finding-match row means a per-surface revert of *only* the ladder could stay green behind the finding-match tokens. Add one row (anchors chosen from tokens unique to the new clause — e.g. stale-cwd, `gitdir`, "not assumed", gate-audit fallback; exact regexes are implementation latitude, but each must red on a per-surface revert), bump the floor `REGISTRY.length >= 10` → `>= 11`, and update the enumerating floor message in the same edit (#693 no-slack). The existing finding-match row is untouched (constraint 7). |
| D7 — ADR 0029 treatment | (a) new superseding ADR; (b) rewrite ADR 0029's body sentences in place; (c) append-only dated **Amendment** section to ADR 0029 | **(c) Append-only amendment.** The ADR's *decision* (capture grounds on the committed tip) stands — this change strengthens it. A superseding ADR (a) for an intact decision fragments the record; in-place rewriting (b) falsifies history. The amendment names the two superseded premise sentences (decision item 1's "its working tree **is** the committed tip"; the ADR 0002 bullet's "already reflects the committed tip"), records the 11-recurrence evidence and the new mechanism (threaded landed-tip anchor + grounding ladder), and updates the Status line to "accepted; amended 2026-07-22". The originating 2026-07-08 spec and plan stay uncorrected per convention (constraint 5). |
| D8 — lesson file | archive as resolved; or append a mitigation note | **Mitigation note, never archive.** The lesson is a heavily cross-linked hub (`retiring-a-resolved-memory-must-check-inbound-links-hubs-stay`); temperature moves are out of scope here anyway. Append a short dated "Mechanized (#990)" note: the ladder is now threaded into both wrap-up prompt surfaces; recurrences stay as canonical detail. Keep the frontmatter `description` one line (projection byte budget is description-driven). |
| D9 — CONTEXT.md | mint a new glossary term; or extend the existing entry; or nothing | **Extend the existing `Finding-match check` entry** with one `_Avoid_` clause naming the trap ("assuming the wrap-up cwd is the committed tip — ground on the threaded landed-tip anchor"). No new term minted — the ladder is a mechanic of the existing term, not a new concept. |

## 4. Mechanics

### Engine (`skills/war/assets/workflow-template.js`)

- Hoist the handoff `tipSha` computation (currently inside the `handoff` block: `working_sha` when
  status is `landed` and SHA-shaped, else the last SHA-shaped `gateHeadSha` in
  `mergedTasksForGateAudit`, else null) to just above the Wrap-up dispatch; the handoff block consumes
  the hoisted value unchanged. Note the guard order is safe: Wrap-up fires only on
  `landResult.status === 'landed'`, a strict subset of the handoff's emit conditions.
- Wrap-up prompt gains a threaded input line near the phase header, e.g.
  `Landed tip: <tipSha> on <ph.workingBranch>` — with the null case pre-resolved to the named
  placeholder string before interpolation (constraint 4).
- One new `pt` block — the **landed-tip grounding ladder** (D3's four steps, compact) — adjacent to the
  existing `FINDING-MATCH CHECK` block; the finding-match parenthetical is rewritten per D5 to point at
  the ladder and the threaded tip instead of asserting cwd-is-tip.

### Standing card (`agents/war-servitor.md`)

- `## Inputs` gains the landed-tip anchor bullet (the tip SHA + working branch the phase landed on, or
  the named unrecorded-placeholder semantics).
- New subsection "Landed-tip grounding" carrying the same four-step ladder; the D3 absence-note arm and
  the Finding-match check paragraph reference it; the Finding-match premise sentence rewritten per D5.
- Same commit as the template edits (constraint 1).

### Drift guards (`skills/war/assets/workflow-template.test.mjs`)

- New D3-registry row for the grounding directive across both surfaces; floor bump + enumerating-message
  update (D6).
- Premise-absence guard: `assert.doesNotMatch` on **both** surface strings (whole-string regex, not
  line-scoped — a pairing that wraps a line break must still be caught, per the
  `misattribution-pairing-spanning-two-lines` lesson) for the cwd-is-tip assertion pattern
  (e.g. working-tree … is/IS/reflects … committed tip in an asserting, non-negated form).
- Threaded-value tests: with the fake land dispatch returning a known `working_sha`, the dispatched
  servitor prompt contains that SHA; with `working_sha` absent, the prompt renders the fallback
  (`gateHeadSha` of the last pinned merge, else the named placeholder) and the dispatch does **not**
  throw (the `pt` guard stays unhit). Existing handoff `tipSha` tests stay green — the hoist is
  behavior-neutral.

### Docs

- `docs/adr/0029-capture-grounds-on-committed-tip.md`: append-only dated Amendment per D7.
- `docs/learnings/servitor-verify-on-write-worktree-can-lag-just-landed-phase.md`: dated mitigation
  note per D8 (a normal worker edit landing via the phase PR, not a servitor write).
- `CONTEXT.md`: one `_Avoid_` clause added to the existing `Finding-match check` entry per D9.

### Premise-sweep discipline (token sweep + mandatory manual survey)

Implementation step: grep the repo's committed surfaces for the premise pairing (working-tree ↔
committed-tip assertions, e.g. `grep -rn "committed tip"` over `agents/`, `skills/war/assets/`,
`docs/adr/`, `CONTEXT.md`) and handle every asserting match. **Grep is a floor, not a ceiling — after
the grep, hand-scan the same-scope prose/comments/tests of each target file for same-meaning siblings
that encode the premise in different words.** Survey-derived stragglers already identified while
authoring this spec:

- ADR 0029's ADR-0002 bullet phrases it as *"already **reflects** the committed tip"* — no "is", survives
  a naive `is the committed tip` grep; covered by the D7 amendment.
- `docs/specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md` and
  `docs/plans/2026-07-08-memory-and-lessons-learned-hygiene.md` repeat the premise — **deliberately
  uncorrected** per the historical-artifact convention (constraint 5); they must not be edited.
- `CONTEXT.md`'s `Finding-match check` entry does **not** assert the premise (it says "at the landed
  tip") — no correction needed there beyond the D9 `_Avoid_` addition.
- Stale copies under `.claude/teams/` and `.claude/war/runs/` are uncommitted run scratch — out of
  scope, never edited.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war/assets/workflow-template.js` | Hoist `tipSha` above the Wrap-up dispatch; thread `Landed tip:` line; add the grounding-ladder `pt` block; rewrite the `FINDING-MATCH CHECK` premise parenthetical |
| `agents/war-servitor.md` | Inputs bullet for the landed-tip anchor; "Landed-tip grounding" subsection; premise sentence rewritten; D3 absence-note references the ladder |
| `skills/war/assets/workflow-template.test.mjs` | New D3-registry row; floor `>= 10` → `>= 11` + message update; premise-absence `doesNotMatch` guards; threaded-SHA presence + absent-`working_sha` fallback tests |
| `docs/adr/0029-capture-grounds-on-committed-tip.md` | Append-only dated Amendment; Status line updated |
| `docs/learnings/servitor-verify-on-write-worktree-can-lag-just-landed-phase.md` | Dated "Mechanized (#990)" mitigation note |
| `CONTEXT.md` | One `_Avoid_` clause on the existing `Finding-match check` entry |

## 6. New domain terms (CONTEXT.md)

None minted. The landed-tip grounding ladder is recorded as a mechanic of the existing
**Finding-match check** entry (one `_Avoid_` addition, D9).

## 7. Recommended ADRs

No new ADR. ADR 0029 receives an append-only dated Amendment (D7) — decision unchanged, mechanism
corrected: grounding is via the threaded landed-tip anchor + prompt-borne ladder, not the servitor's own
working tree.

## 8. Open risks / implementation notes

- **Ladder obedience is prompt-enforced** (same named residual ADR 0029 already records): the drift
  guards prove both surfaces carry the directive, not that a live servitor honors it. Backstop runner:
  the first landed phase after this change — its wrap-up should show the ladder in use (or the gate-audit
  fallback taken) instead of a stale-cwd `code-verified` write.
- **Registry contention:** the D6 floor bump collides with `audit-adjudication-threading`'s registry
  edits by design — this plan lands after it and rebases onto its landed registry state; the floor value
  written here is "current true row count + 1", resolved at land time, never a literal frozen from this
  spec.
- **`working_sha` absence path:** the fallback rendering must be exercised by test, not just written —
  the `pt` undefined-interpolation guard converts a missed edge into `held:workflow-error` for every
  landed phase, a far worse failure than the one being fixed.
- **Premise-absence regex care:** the guard must not false-positive on the *negated* form the new prose
  introduces ("is NOT assumed to be the committed tip") — anchor the asserting form, or scope the
  `doesNotMatch` to exclude the negation token.

## 9. Non-goals / deferred

- **No servitor capability change** — no Bash, no git verbs, no allowlist widening (ADR 0002 intact).
- **No engine-provisioned wrap-up worktree** (D2 option (a)) — rejected, not deferred.
- **No correction of the 2026-07-08 originating spec/plan** — historical artifacts stay as authored.
- **No back-fix of already-written stale lessons** — `/lessons-learned` housekeeping territory, exactly
  as ADR 0029 scoped it.
- **No auditor-side changes** — the auditor analogue (`audit-worktree-pre-impl-tip-stale-verdict`) is
  already governed by committed-tree grounding at the pinned `audit_sha`; untouched here.

## 10. Validation criteria

1. `node --test skills/war/assets/workflow-template.test.mjs` green; `node --test 'skills/**/*.test.mjs'`
   green.
2. The `D3 — both-surfaces directive registry` test carries a new grounding-ladder row asserting both
   `war-servitor.md` and the dispatched servitor Wrap-up prompt; reverting the new clause on **either**
   surface alone reds that row (delete-the-feature, per surface).
3. The registry floor assertion reads `REGISTRY.length >= 11` (or current-true-count + 1 after rebase)
   and its message enumerates the new row — no slack (#693).
4. The existing `servitor finding-match check` row passes unmodified — its four anchors
   (`finding-match`, `named construct`, `pattern, not live instance`, `agent-unverified`) survive the
   premise rewrite.
5. A whole-string `doesNotMatch` guard proves neither `agents/war-servitor.md` nor the dispatched
   servitor prompt asserts the cwd-is-tip premise in any asserting form ("is/reflects the committed
   tip"), while the negated grounding prose passes.
6. With the test's fake land dispatch returning `working_sha: '<known-sha>'`, the dispatched servitor
   prompt contains `<known-sha>`; with `working_sha` deleted from the fake result, the dispatch does not
   throw and the prompt renders the documented fallback (last pinned `gateHeadSha`, else the named
   placeholder) — never the string `undefined`.
7. Existing handoff tests stay green: `handoff.tipSha` semantics are byte-identical before/after the
   hoist.
8. `docs/adr/0029-capture-grounds-on-committed-tip.md` contains a dated Amendment section naming both
   superseded premise sentences; its original body above the amendment is byte-unchanged.
9. `docs/learnings/servitor-verify-on-write-worktree-can-lag-just-landed-phase.md` carries the dated
   mitigation note; its frontmatter `description` remains one line.
10. `CONTEXT.md`'s `Finding-match check` entry carries the new `_Avoid_` clause; no new glossary term
    exists.
11. Redaction lint green: `node skills/_shared/war-memory.mjs lint docs/learnings/`.
