# Memory-store hygiene — implementation plan

**Source spec:** `docs/specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md`
**Slug:** `memory-and-lessons-learned-hygiene` (shares the spec's slug, drops `-design`).
**Repo version at authoring:** 0.14.14 — version literals below are non-authoritative; resolve the next free patch from the four release slots at land time.
**Roadmap ordering:** lands **after** plan 2 (`audit-gate-verdict-fidelity`) — the committed-tree-grounding clause consumes plan 2's pinned, validated `audit_sha` and edits the same auditor prompt surfaces (spec §8); sequencing avoids both the missing-referent and the cross-plan same-string collision.

## Commander's Intent

**Purpose.** Memory-store integrity moves from remembered discipline into the tooling — link/archive-aware retirement, non-destructive tooling defaults, and committed-tree capture — leaving only genuine curation judgment (which hub to keep, which lesson to compress) to the operator.

**Method.** `war-memory` gains `inbound <slug>` (the mechanical hub count the Phase-3 prose grep becomes) and a non-destructive `--candidates` (lists the ranked set; mutation requires `--apply` or explicit slugs), plus an advisory concept-hub WARN on archive (≥2 hot inbound refs; exit 0 — archive is link-safe, the WARN surfaces the lost hot index row). `safe-swap.sh verify`'s already-archive-aware `resolves_in()` semantics are frozen by test as the **sole authority** on link removal; the fan-out verifier prompt gets the **HOT / COLD / MISSING** trichotomy and is forbidden from recommending removal on a hot-only `ls`. The servitor's D3 gains the **finding-match check**: an audit-log-sourced finding is re-confirmed against the landed tip before recording — matched → `code-verified` with locate-cue; unmatched (fixed in-flight) → the generic pattern at `agent-unverified`, never a live file/line. Auditor verify-and-close / already-done claims ground on `git show <audit_sha>:<path>` (and `git log -S`/`-G` for history-shaped questions), the working-tree grep demoted to advisory — the auditor git allowlist is **not** widened (no `grep` verb). Every dispatched-prompt clause lands with its `agents/*.md` mirror in the same task; drift-guards pin both surfaces. ADRs 0028 + 0029 ratify the two halves.

**End state** (each individually checkable):
1. `node skills/_shared/war-memory.mjs archive --candidates --local <staging>` without `--apply` archives **zero** files and prints the ranked candidate list; `walkCorpus` after shows every candidate still hot. (spec criterion 1)
2. `archive --candidates --apply` archives exactly the ranked set; `archive <slug>…` with explicit slugs archives exactly those, unchanged. (spec criterion 2)
3. `war-memory inbound <slug>` returns the correct inbound `[[slug]]` count across both roots, excludes the slug's own file, lists the citing slugs; zero-inbound returns 0. (spec criterion 3)
4. Archiving a slug with ≥2 hot inbound refs emits the concept-hub WARN to stderr and still exits 0. (spec criterion 4)
5. `safe-swap.sh verify` reports no dangling wikilink for a `[[link]]` resolving only into `archive/<slug>.md`, and flags a link resolving in neither hot nor `archive/` — asserted in `safe-swap.test.sh` (added if the cases are not already present). (spec criterion 5)
6. `skills/lessons-learned/SKILL.md` carries the HOT/COLD/MISSING trichotomy in the verifier prompt, no surviving instruction produces a hot-only `ls` removal verdict, and the Phase-3 hub check invokes `war-memory inbound` — asserted by greps in the existing `lessons-learned-doc-contract.test.mjs`. (spec criterion 6)
7. `agents/war-servitor.md` **and** the dispatched servitor prompt in `workflow-template.js` both carry the finding-match clause; a both-surfaces drift-guard in `workflow-template.test.mjs` fails if either lacks it. (spec criterion 7)
8. The auditor surfaces (standing + dispatched) state verify-and-close/already-done no-op claims ground against `git show <audit_sha>:<path>`, working-tree grep advisory only; `git grep` remains absent from `validate-auditor-git.sh` (allowlist byte-unchanged) and `git show <sha>:<path>` is accepted by the guard — asserted in the auditor-guard test. (spec criterion 8)
9. `docs/adr/0028-*.md` (memory-store integrity tool-enforced) and `docs/adr/0029-*.md` (capture grounds on the committed tip) exist; `CONTEXT.md` carries the five new terms. (spec §6/§7; ADRs renumbered — see deltas)
10. Full suite green: `node --test 'skills/**/*.test.mjs'`, the `hooks/`+`skills/` shell-test loop, and `node skills/_shared/war-memory.mjs lint docs/learnings/`. (spec criterion 9)
11. The four release slots move together to the resolved next patch.

## Build order (for /war)

### Phase 1 — Tooling defaults, link authority, capture grounding

Five file-disjoint tasks, no intra-phase deps — run in parallel.

**Task 1.1 — `war-memory` non-destructive `--candidates` + `inbound` + hub WARN**
- Files: `skills/_shared/war-memory.mjs`, `skills/_shared/war-memory.test.mjs`
- Plan slice: **(dry-run flip)** In `cmdArchive`: when `argv.candidates` is set and `argv.apply` is not, print the ranked candidate list (reuse `archiveCandidates`/`buildProjection`) and return without mutating; mutation only with `--candidates --apply` or the unchanged explicit-slug path (`argv._.slice(1)`). Reword `war-memory.mjs`'s own render `refuse`/`warn` messages that mention `--candidates` to say it *lists* (the "`archive <slug>…` archives just the ones you pick" half stays). **(inbound)** New `inbound <slug> [--repo <root>]` subcommand + dispatch case: walk both roots via `walkCorpus`, count files whose body contains `[[<slug>]]` excluding the slug's own file, print count + citing slugs; pure read, no `requireLocal`. **(hub WARN)** In `cmdArchive`, per slug about to be archived: compute hot inbound count; ≥2 ⇒ stderr `WARN: archiving concept hub '<slug>' (<n> inbound refs) — its index row disappears; consider keep-compress stub`; non-blocking, exit 0. **(call-site sweep)** Grep `skills/`, `docs/`, `references/` for `archive --candidates` call sites expecting mutation — expected zero (the SKILL already forbids running it); a hit in a file owned by another task of this plan (e.g. `skills/lessons-learned/SKILL.md`) is flagged to the Lead, never edited here (file ownership stays with its task). Tests: criteria 1–4 (dry-run zero-mutation + list, `--apply` archives ranked set, explicit slugs unchanged, inbound count/self-exclusion/zero case, hub WARN emitted + exit 0); delete-and-trace each.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject (this repo)

**Task 1.2 — Freeze `safe-swap` archive-aware link semantics**
- Files: `skills/lessons-learned/assets/safe-swap.test.sh`
- Plan slice: `safe-swap.sh` itself is **deliberately byte-unchanged** — `do_verify`'s `resolves_in()` already treats `archive/<slug>.md` as resolved for both the index-row hard-fail and the dangling-link warn; this task freezes that behavior against future edits. Add (if not already present — check first, the recorded verify-no-op rule applies) two cases to `safe-swap.test.sh`: a `[[link]]` whose target exists only in `archive/<slug>.md` produces `ok    no dangling wikilinks` (not flagged); a link to a slug in neither hot nor `archive/` **is** flagged. Delete-and-trace: breaking `resolves_in()`'s archive arm in a scratch copy makes the first case fail.
- requiresTest: true (the diff is the test)
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.3 — Verifier trichotomy + tool-driven hub check (lessons-learned prose)**
- Files: `skills/lessons-learned/SKILL.md`, `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`
- Plan slice: **(Phase-2 verifier prompt)** State the trichotomy: every `[[link]]` target is HOT (`<root>/<slug>.md` — keep), COLD (`<root>/archive/<slug>.md` — keep, legal cold link), or MISSING (neither — the only removal candidate); a verifier **never** recommends removing a link or index row from a hot-only `ls <staging>/<slug>.md`; all dangling/row adjudication defers to the central archive-aware `safe-swap verify`. Reword any surviving "check the staging dir" phrasing that produces the hot-only `ls`. **(Phase-3 hub check)** Replace the prose grep with a `node skills/_shared/war-memory.mjs inbound <slug>` call per `retire`/`merge` candidate whose count the agent must report; the existing ≥2-refs → concept-hub → keep-compress-stub decision text (the "check inbound links" construct and its gotcha) is **retained verbatim** — only the counting mechanism changes. Extend the existing `lessons-learned-doc-contract.test.mjs` with criterion-6 greps: trichotomy present (case-tolerant, mid-sentence anchors), `war-memory… inbound` named in Phase 3, and the hot-only-`ls`-verdict phrasing absent.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.4 — Capture grounding: servitor finding-match + auditor committed-SHA (all mirrors, one task)**
- Files: `agents/war-servitor.md`, `agents/war-auditor.md`, `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `hooks/validate-auditor-git.test.sh`
- Plan slice: One task because both clauses edit `workflow-template.js` (spec §8 flags the collision) and every dispatched clause needs its standing mirror in the same commit. **(servitor)** Extend D3 in `agents/war-servitor.md` with the finding-match clause for audit-log-sourced facts: before recording an audit finding as a live gotcha, re-Grep/Read the **named construct** (the specific defect, not merely the file) at the landed tip — the servitor's post-land working tree *is* the committed tip, no new capability; match → `code-verified` + locate-cue; no match → record only the generic pattern at `agent-unverified` with the note "audit finding resolved in a fix round before land — recorded as pattern, not live instance", never the file/line as a current instance. Mirror the clause into the dispatched servitor prompt in `workflow-template.js` (near the `servitorMemClause` construct). **(auditor)** Add to `agents/war-auditor.md` and the dispatched auditor prompt: verify-and-close / already-done no-op claims ground against the pinned `audit_sha` — `git show <audit_sha>:<path>` for blob reads (allowlisted), `git log -S<token>`/`-G<regex>` for history-shaped questions (pick the verb per claim shape — `-S` answers "when did the count change", not "is the token present at the path"); the working-tree grep is advisory only, never the sole basis. Coordinates with plan 2's pin surfaces — this plan lands after plan 2, so the clause references the already-landed `audit_sha` machinery. **(tests)** `workflow-template.test.mjs`: both-surfaces drift-guards for the finding-match clause and the committed-grounding clause (token-anchored, case-tolerant; the servitor prompt is `memClause`-built, the auditor prompt via `auditPrompt()` — anchor each at its real construct). `hooks/validate-auditor-git.test.sh`: assert `git show <sha>:<path>` is accepted and a `git grep` invocation is denied (allowlist byte-unchanged — the spec explicitly defers widening).
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.5 — Doctrine docs: ADR 0028 + ADR 0029 + CONTEXT.md terms**
- Files: `docs/adr/0028-memory-store-integrity-tool-enforced.md` (new), `docs/adr/0029-capture-grounds-on-committed-tip.md` (new), `CONTEXT.md`
- Plan slice: ADR 0028 (housekeeping half, from the spec's stale "0023" — plans 1–4 claim 0023–0027; re-resolve against `docs/adr/` at land time): `--candidates` non-destructive by default; archive emits inbound-hub counts; archive-aware `safe-swap verify` is the sole link-removal authority; concept hubs downgrade to stub, never dropped. ADR 0029 (capture half, from the spec's "0024"): the servitor finding-match check and committed-SHA grounding for verify-and-close; extends ADR 0007, pairs with plan 2's pin-to-integrated-tip ADR (0024); auditor allowlist explicitly unwidened. Two ADRs, not one — disjoint subsystems (spec §7). CONTEXT.md: the five terms verbatim from spec §6 — **Concept hub**, **Link trichotomy (HOT/COLD/MISSING)**, **Non-destructive default (`--candidates`)**, **Finding-match check**, **Committed-tree grounding**.
- requiresTest: false (docs only)
- requiresPackaging: false
- deps: none
- target repo: superproject

### Phase 2 — Release bump (trailing)

Phase edge on Phase 1. **(Operator-ratified delta: the spec's surface list omits the release slots; repo law requires the trailing bump phase.)**

**Task 2.1 — Version bump across the four slots**
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Resolve the next free patch from the four slots at land time (authoring baseline 0.14.14 — non-authoritative; earlier campaign plans will have advanced it). Lockstep: `plugin.json` `version`; `marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status` (replace-in-place, no badge). Keep the blurb plain — describing the `--candidates` flip must not re-quote retired mutation wording in a way that trips its own absence check (the recorded release-blurb trap).
- requiresTest: false (metadata only)
- requiresPackaging: false
- deps: none (single task)
- target repo: superproject

## Deferred validations (backstops)

- **Live housekeeping behavior of the trichotomy prompt** (fan-out verifiers actually deferring removal verdicts to `safe-swap verify`) · why deferred: prompt-enforced agent behavior — the doc-contract greps prove the prose, not the obedience · runner: the next `/lessons-learned` pass (its report must show zero hot-only-`ls` removal recommendations) + `/red-team` prose-contract read.
- **Servitor finding-match obedience at capture time** · why deferred: same — the drift-guard proves both surfaces carry the clause, not that a live servitor honors it · runner: the first landed phase after this plan lands (Lead spot-checks any audit-log-sourced lesson's provenance against the tip) + `/red-team`.
- **Auditor committed-grounding in a real verify-and-close** · why deferred: needs a live no-op claim to exercise; the guard test proves verb admissibility only · runner: the next `/war` run containing a VERIFY-shaped task; the recorded `verify-task-no-op-is-correct-when-already-covered` 3-check audit consumes the `git show` evidence.
- **`--candidates` call-site sweep completeness** · why deferred: the sweep greps the current tree; a future doc re-introducing a mutating `--candidates` example is out of this plan's reach · runner: the plan-3 (drift-guards) doc/CLI consistency posture + `/lessons-learned` gotcha review.

## Notes / conscious deviations

- **Six operator-ratified conversion deltas (2026-07-08 volley):** (1) ADRs renumbered **0028/0029** — the spec's 0023/0024 predate plans 1–4 claiming 0023–0027; (2) trailing **release phase added** — spec §5 omits the release slots; (3) **one work phase**, deviating from spec §7's "land in separate phases" remark — all five tasks are file-disjoint, and the capture half's dependency is on **plan 2 landing** (roadmap-level ordering), not on any task inside this plan; phase edges are for what must be *landed* first, and nothing here lands before anything else here; (4) criterion 6's doc grep lands in the **existing** `lessons-learned-doc-contract.test.mjs` (verified present at conversion); (5) **`safe-swap.sh` appears in no Files list** — it is deliberately byte-unchanged, and naming a no-diff file is the recorded plan-file-list trap (`plan-affected-file-list-doc-completeness-vs-correctness`); (6) the `--candidates` call-site sweep is scoped so `skills/lessons-learned/SKILL.md` wording stays owned by Task 1.3 — Task 1.1 flags cross-file hits to the Lead instead of editing them.
- **Roadmap dependency on plan 2** (spec §8): the committed-grounding clause references plan 2's pinned `audit_sha` and edits auditor prompt strings plan 2 also touches. This plan lands after plan 2; Task 1.4's worker rebases onto a tree where those surfaces are final.
- **Cross-plan contention (for the roadmap table):** `workflow-template.js` + `workflow-template.test.mjs` shared with plans 1–3; `agents/war-auditor.md` with plans 2–3; `agents/war-servitor.md` unique to this plan; `skills/_shared/war-memory.mjs` + test unique; `CONTEXT.md`, `docs/adr/`, release slots shared with all. Roadmap serializes; this plan rebases onto landed content.
- **Auditor allowlist unwidened** (spec §9): `git show <audit_sha>:<path>` + `git log -S/-G` cover the need; the guard test asserts `grep` stays denied — the test is the mechanical record of the deliberate non-widening.
- **Hub WARN is advisory by design** (spec §8): archive is link-safe (cold links resolve), so blocking on inbound count would be a false gate; the WARN surfaces the lost hot index row, the decision stays human.
- **No rm-blocker** (spec design tree): the pipeline archives, never deletes; `safe-swap verify`'s archive-aware dangling check already catches a true orphan.
- **`requiresPackaging: false` on every task** — this repo ships no Dockerfile; the packaging floor is vacuous here.

## Open decisions

None — resolved interactively at conversion (operator volley, 2026-07-08): intent + all six deltas approved as-is.
