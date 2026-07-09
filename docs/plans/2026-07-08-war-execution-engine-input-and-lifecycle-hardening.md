# WAR execution-engine input & lifecycle hardening — implementation plan

**Source spec:** `docs/specs/2026-07-08-war-execution-engine-input-and-lifecycle-hardening-design.md`
**Slug:** `war-execution-engine-input-and-lifecycle-hardening` (shares the spec's slug, drops `-design`).
**Repo version at authoring:** 0.14.14 — version literals below are non-authoritative; resolve the next free patch from the four release slots at land time.
**Roadmap ordering:** the spec's "build after ADR 0021's plan" constraint is **already satisfied** — `war-run-lifecycle-robustness` landed 2026-07-08 (v0.14.12–14); what remains is contention with this campaign's own plans — lands **after plan 2** (`audit-gate-verdict-fidelity`), whose new evidence dispatch also receives a `dispatchKind` here (intent-consistent extension).

## Commander's Intent

**Purpose.** WAR's engine seams stop converting imperfect input or half-run state into raw `TypeError`s, silent no-ops, or dangerous manual recovery — every trust boundary returns a named clean error, mechanically, and the provisioning lifecycle heals its own provably-safe orphans instead of demanding hand-edited git refs.

**Method.** **(Band 1 — ingest guards)** `war-config.mjs` `validate()` gains the `overrides` non-object guard byte-mirroring the sibling `memory` block idiom. Both sandbox args-parse sites gain a scalar-safe non-null-object guard — hand-mirrored because the Workflow sandbox cannot import, pinned by a drift-guard test: the template **throws** a named error routing to the existing `held:workflow-error` (never a new enum member — ADR 0005); the scaffold falls back to `{}` so the existing titleLine refusal fires cleanly. A thin `dispatch(prompt, opts)` wrapper over **every** `await agent(` spawn site (17 at conversion) throws before spawn when the interpolated prompt contains the literal token `undefined`, naming the dispatch label — generalizing the #586 derivation-path fix to every interpolated field. **(Band 2 — provisioning lifecycle)** `inject-campaign-state.sh` replaces the space-splitting `xargs ls -t` with an indexed-array + process-substitution line-read (bash-3.2-safe; fail-open posture untouched). `provision-worktrees.sh` gains the `readonly EX_*` exit-code catalogue (every coded `die` uses a constant; a test forbids uncatalogued numerics; the surfacing contract stays "any non-zero = halt"), an explicit optional target-repo arg on `ensure-exclude`, and the opt-in `--reclaim-empty-orphan` two-proof self-heal on `ensure-integration` (empty `git log <base>..<branch>` AND absent from origin ⇒ reclaim; either proof fails ⇒ the unchanged exit-3 die — ADR 0003 fail-loud default and ADR 0008 never-destroy-work honored). **(Band 3 — dispatch ergonomics)** Stable `opts.dispatchKind` discriminators on the provisioning dispatches (and the evidence dispatch plan 2 added) so mocks/handlers/audits stop parsing label prefixes; the `ponytail:`/`deliberately-unwired:` marker becomes a recognized auditor dead-code exemption. ADR 0034 + an ADR 0013 addendum ratify.

**End state** (each individually checkable):
1. `validate({overrides: null})` and `validate({overrides: 'x'})` return `{ valid: false, errors: [...] }` containing "overrides must be an object" and do not throw; a valid overrides object validates as before; reverting the guard makes the null case throw (delete-the-feature). (spec criterion 1)
2. Invoking the template Workflow with `args = 'null'`/`'true'`/`'5'` yields `held:workflow-error` naming "args must be a JSON object" — not a raw `TypeError` — with zero agents dispatched; the scaffold normalizes the same scalars to `{}` and produces the clean titleLine refusal; a drift-guard asserts the guard at **both** parse sites. (spec criterion 2)
3. A dispatch whose interpolated prompt contains literal `undefined` throws before spawn naming the dispatch label; present-field control does not throw; reverting the wrapper lets the prompt ship (delete-the-feature). (spec criterion 3)
4. With a campaign directory path containing a space, `inject-campaign-state.sh` still selects and injects the newest active campaign (the `xargs` version fails this); no-campaign ⇒ silent exit 0; newest-first order preserved. (spec criterion 4)
5. Every `die "…" <n>` in `provision-worktrees.sh` uses a catalogued `EX_*` constant (grep assertion — no uncatalogued numeric literal); the catalogue names codes 3/4/5/6/7 with their governing ADRs; the "any non-zero = halt" surfacing contract is documented and asserted. (spec criterion 5)
6. `ensure-exclude <repo-dir>` invoked from a different cwd writes the exclude into `<repo-dir>`'s git dir; the no-arg form is byte-identical to today. (spec criterion 6)
7. With `--reclaim-empty-orphan`, a same-namespace unowned branch proven empty AND origin-absent is deleted and re-cut; the same branch with one unique commit ⇒ exit `EX_FOREIGN` (3), not deleted; present on origin ⇒ exit 3, not deleted; flag absent ⇒ exit 3, byte-identical default. (spec criterion 7)
8. The phase git-topology barrier and the per-task provision-run carry **distinct** `opts.dispatchKind` values; the test mock, `isProvision`, and `isProvisionRun` key on `dispatchKind` with no label-prefix regex; collapsing the kinds fails the distinctness assert (delete-the-feature). (spec criterion 8)
9. `agents/war-auditor.md` names the `ponytail:`/`deliberately-unwired:` marker as a dead-code-finding exemption (presence check, case-tolerant mid-sentence anchor). (spec criterion 9)
10. `agents/war-refiner.md` reflects the explicit-target `ensure-exclude` call; the `dispatchKind` names in template prompts and the refiner modes in `agents/war-refiner.md` are consistent — no orphaned discriminator. (spec criterion 10)
11. `docs/adr/0034-*.md` (engine ingest guards & provision exit-code contract) exists; the ADR 0013 addendum records the deliberately-unwired marker; `CONTEXT.md` carries the six new terms. (spec §6/§7; renumbered — see deltas)
12. Full suites green: `node --test 'skills/**/*.test.mjs'`, every `hooks/` + `skills/` `*.test.sh`, `war-memory.mjs lint docs/learnings/`; no enum set changes anywhere (ADR 0005).
13. The four release slots move together to the resolved next patch.

## Build order (for /war)

### Phase 1 — Ingest guards, provisioning lifecycle, dispatch ergonomics

Seven tasks; one wave edge (Task 1.2 → Task 1.1); otherwise file-disjoint and parallel.

**Task 1.1 — Scaffold-side args guard**
- Files: `skills/red-team/assets/workflow-scaffold.js`, `skills/red-team/assets/workflow-scaffold.test.mjs`
- Plan slice: In the existing `try { A = … JSON.parse(args) … } catch { A = {} }` block, add the non-null-object check to the success path (`typeof x === 'object' && x !== null && !Array.isArray(x)`): a valid scalar (`'null'`, `'true'`, `'5'`) normalizes to `{}` — the same posture as the catch — so the existing "args.fingerprint.titleLine is required" refusal fires cleanly instead of a raw destructure `TypeError`. Test: the scalar cases produce the titleLine refusal, not a TypeError; delete-and-trace. **Cross-plan note:** plans 6 and 8 also edit this file pair (probe-prompt content) — different constructs; roadmap serializes.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject (this repo)

**Task 1.2 — Template: args guard, dispatch() wrapper, dispatchKind, ensure-exclude call site**
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-refiner.md`
- Plan slice: **(B)** Wrap the `const A = typeof args === 'string' ? JSON.parse(args) : (args || {})` line in the existing entry `try{}` and add the mirrored non-null-object guard; on failure `throw new Error('workflow-template: args must be a JSON object, got <type>')` → the existing catch routes `held:workflow-error` (never a new enum member); a malformed string now lands in the same clean class instead of a raw `SyntaxError`. Add the **both-sites drift-guard test** asserting the guard exists in this file AND `workflow-scaffold.js` (deps on Task 1.1 so the scaffold guard is on this task's rebase base — the wave edge). **(C)** Define `const dispatch = (prompt, opts) => { if (/\bundefined\b/.test(prompt)) throw new Error(…names opts.label + "a required interpolation input was missing"…); return agent(prompt, opts) }` and mechanically rename every `await agent(` spawn site (17 at conversion — count is non-authoritative, the construct is "every spawn site") to `await dispatch(`. Reword any legitimate engine-authored prose "undefined" to "unset"/"absent" (spec §8 mitigation). **(H)** Add `dispatchKind` to the spawn `opts` of the provisioning dispatches — `provision-barrier` (phase git-topology barrier), `provision-run` (per-task env-provision), `polish-worktree` (phase-close sweep) — **and** `evidence` on the post-merge evidence dispatch plan 2 added (intent-consistent extension, operator-ratified); source comments at each site name the kind + the paired refiner mode (the recorded comment-lag lesson). Switch `defaultImpl`, `isProvision`, `isProvisionRun` in the test to key on `dispatchKind` — no label-prefix regex — and assert barrier vs provision-run kinds are distinct. **(F call site)** The Provision barrier prompt passes `mainCheckout` explicitly to `ensure-exclude`; mirror the note into `agents/war-refiner.md`'s provisioning-duty section (same commit — both-surfaces rule). Tests: end states 2 (template half + drift guard), 3 (three-case: present/missing/label-named), 8, 10; delete-and-trace each.
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

**Task 1.3 — `overrides` non-object guard**
- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`
- Plan slice: In `validate()`, immediately before the `KNOWN_OVERRIDES` loop, add `if (!isObj(c.overrides)) { errors.push('overrides must be an object') }` and move the loop into the `else` — byte-mirroring the `memory` block's shape three lines above; `isObj` already exists at module top, reuse it; no new export, no `main()` change (a `try/catch` there was rejected — it masks the class instead of naming it). Tests: end state 1's cases. **Cross-plan note:** plans 3, 4, 7 also edit this file pair (matrix helper, `ghUser`, `testPattern` validation) — different constructs in the same `validate()`; roadmap serializes; rebase and touch only the overrides guard region.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.4 — Provision script: exit-code catalogue, ensure-exclude arg, empty-orphan reclaim**
- Files: `skills/war/assets/provision-worktrees.sh`, `skills/war/assets/provision-worktrees.test.sh`
- Plan slice: **(E)** `readonly EX_FOREIGN=3 EX_DIRTY_UNREG=4 EX_OUT_OF_RUN=5 EX_WRONG_BRANCH=6 EX_DIVERGED=7` catalogue + comment block (each code's meaning + governing ADR) near `PROG`/`die`; rewrite every coded `die` (17 sites carrying literals 3/4/5/6/7 at conversion) to use its constant; 1 stays the generic `die` default. Test: grep assertion that no `die "…" <numeric-literal>` survives outside the catalogue; the "any non-zero = halt" surfacing contract documented + asserted. **(F)** `cmd_ensure_exclude` gains an optional positional `<repo-dir>`, resolving via `git -C "<repo-dir>" rev-parse --git-dir` when present; absent ⇒ current cwd behavior byte-identical (back-compat with existing no-arg tests; a required arg was rejected). Test: invoked from a different cwd, the exclude lands in `<repo-dir>`'s git dir. **(G)** `cmd_ensure_integration` gains `--reclaim-empty-orphan` (Lead-supplied only on a sanctioned recovery relaunch): when the branch exists, is unowned, is in this run's exact namespace, and the flag is set — prove `git log <base>..<branch>` empty AND `git ls-remote --exit-code origin <branch>` absent, then delete + re-cut (logging the proof); either proof fails ⇒ the unchanged `EX_FOREIGN` die (never delete a branch with unique commits or one published to origin); no flag ⇒ byte-identical exit 3. Deleting a proven-empty branch resets no work (the recorded conservative-heal lesson: no ahead-check ref-reset path). All bash-3.2-safe. Tests: end states 5, 6, 7 with delete-and-trace. **Cross-plan note:** plan 1 also edits this pair (phantom-land guard in `cmd_land_advance`) — different subcommands; roadmap serializes.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.5 — Campaign-state hook: space-safe ledger sort**
- Files: `hooks/inject-campaign-state.sh`, `hooks/inject-campaign-state.test.sh`
- Plan slice: Replace the `for ledger in $(printf '%s' "$candidates" | xargs ls -t …)` construct with: read `$candidates` into an indexed array via `while IFS= read -r f; do [ -n "$f" ] && arr+=("$f"); done`, then `while IFS= read -r ledger; do …; done < <(ls -t "${arr[@]}" 2>/dev/null)` — closing the space word-split on both the `ls` input and the loop (indexed arrays + process substitution are bash-3.2-safe; a `stat`-based sort was rejected for BSD/GNU divergence). The `is_active` filter, winner/passed-over bookkeeping, and both silent-exit-0 fail-open guards stay byte-untouched. Update the now-stale inline comment that justifies the old idiom (the recorded comment-lag lesson). Test: a campaign directory path containing a space still selects/injects the newest active campaign (RED against the xargs version); silent exit 0 with no campaign; newest-first for multiple.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.6 — Auditor deliberately-unwired marker clause**
- Files: `agents/war-auditor.md`
- Plan slice: One clause in the standing card (near the calibration/latitude constructs): a construct whose adjacent `ponytail:` / `deliberately-unwired:` comment states *why* it is intentionally uncalled (invariant documentation, deliberate ceiling) is **not** a dead-code finding — re-flagging it is out of scope; absent such a comment, dead-code findings proceed as usual. Standing-surface-only by design: the exemption must reach every seat including the inline gate-audit passes, which only the standing card does (the recorded gate-audit-inline-prompts coverage lesson) — no `auditPrompt()` mirror needed for a pure lens-calibration clause, matching the D7-checklist precedent in plan 2. **Cross-plan note:** plans 2, 3, 5, 6, 8 also edit this file — different sections; roadmap serializes.
- requiresTest: false (prose; the clause's presence is grep-checkable at red-team)
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.7 — Doctrine docs: ADR 0034 + ADR 0013 addendum + CONTEXT.md**
- Files: `docs/adr/0034-engine-ingest-guards-and-provision-exit-codes.md` (new), `docs/adr/0013-*.md` (addendum), `CONTEXT.md`
- Plan slice: ADR 0034 (renumbered from the spec's "0023" — plans 1–8 claim 0023–0033; re-resolve against `docs/adr/` at land time): every engine trust boundary returns a named clean error, never a raw crash; the provision exit-code catalogue is the single source of non-zero meanings with "any non-zero = halt" surfacing; the empty-orphan reclaim is opt-in, same-namespace, two-proof-gated — extends ADR 0003 (fail-loud default unchanged) and ADR 0008 (repair toward git; deleting a proven-empty branch resets no work); ADR 0005 enum sets explicitly untouched. ADR 0013 **addendum** (dated section appended, never rewriting the ratified body — operator-ratified resolution of the spec's 0002-vs-0013 fork): the deliberately-unwired marker convention as an audit-lens finding-class exemption. CONTEXT.md: the six terms verbatim from spec §6 — **Ingest guard**, **Undefined-render guard**, **Provision exit-code catalogue**, **Empty-orphan reclaim**, **Dispatch kind**, **Deliberately-unwired marker**.
- requiresTest: false (docs only)
- requiresPackaging: false
- deps: none
- target repo: superproject

### Phase 2 — Release bump (trailing)

Phase edge on Phase 1. **(Operator-ratified delta: the spec's surface list omits the release slots; repo law requires the trailing bump phase.)**

**Task 2.1 — Version bump across the four slots**
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Resolve the next free patch from the four slots at land time (authoring baseline 0.14.14 — non-authoritative; earlier campaign plans will have advanced it). Lockstep: `plugin.json` `version`; `marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status` (replace-in-place, no badge). Keep the blurb plain.
- requiresTest: false (metadata only)
- requiresPackaging: false
- deps: none (single task)
- target repo: superproject

## Deferred validations (backstops)

- **Undefined-render guard false-positive burn-in** (a legitimate prose "undefined" in a future engine prompt) · why deferred: start with the simplest `\bundefined\b` guard and tighten to interpolation-adjacent signatures only on evidence (spec §8) · runner: the first live `/war` runs after landing; a false positive is a loud throw naming the label — trivially diagnosed.
- **Live `--reclaim-empty-orphan` behavior on a real half-run orphan** · why deferred: the fixture test proves both proofs and both refusals; a real half-run's ledger/branch interleaving only occurs in a live recovery relaunch · runner: the next sanctioned recovery relaunch + `/red-team` sandbox probe of this plan.
- **`ensure-exclude` explicit-arg live wiring** (the barrier prompt passing `mainCheckout` and the script honoring it land in the same phase but are only exercised together at a live Provision) · why deferred: the gate proves each half separately; composition needs a live run · runner: the first live `/war` phase after landing (Provision report shows the explicit-target call).
- **Concurrent same-plan runs vs reclaim** (two concurrent runs of the same plan+phase) · why deferred: already undefined behavior today; the two proofs guarantee nothing is lost even then; opt-in flag never fires unattended · runner: accepted residual, recorded in ADR 0034.

## Notes / conscious deviations

- **Five operator-ratified conversion deltas (2026-07-08 volley):** (1) the new ADR renumbers to **0034** (plans 1–8 claim 0023–0033), and the spec's "amend ADR 0002 *or* 0013" fork resolves to an **ADR 0013 addendum** — the marker is an audit-lens finding-class exemption, disposition's home; (2) trailing **release phase added** — spec §5 omits the slots; (3) the spec's "build after ADR 0021's plan" ordering is **already satisfied** (that plan landed 2026-07-08, v0.14.12–14); the remaining ordering is intra-campaign — after plan 2, whose evidence dispatch receives a `dispatchKind` here as an intent-consistent extension; (4) the spawn-site count corrects **~24 → 17** (verified at conversion; the construct is "every `await agent(` site", count non-authoritative); (5) one **wave edge** — Task 1.2 deps on Task 1.1 so the both-sites drift test sees the scaffold guard on its rebase base.
- **Cross-plan contention (for the roadmap table):** `workflow-template.js` + `workflow-template.test.mjs` shared with plans 1, 2, 3, 5, 6, 7, 8 (every plan but 4); `workflow-scaffold.js` + test with plans 6, 8; `war-config.mjs` + test with plans 3, 4, 7; `provision-worktrees.sh` + test with plan 1; `agents/war-refiner.md` with plans 1, 2, 7; `agents/war-auditor.md` with plans 2, 3, 5, 6, 8; `hooks/inject-campaign-state.*` unique; `CONTEXT.md`, `docs/adr/`, release slots with all. Roadmap serializes; every task rebases onto landed content.
- **`held:workflow-error` routing is the existing catch** — no enum member is added anywhere, and `held:workflow-error` is never added to `HARD_ESCALATION_REASONS` (ADR 0005).
- **The mirrored args guard is deliberately not a shared module** — the sandbox cannot import; two sites + a drift-guard test is the correct shape (the `HARD_ESCALATION_REASONS` mirroring discipline).
- **Sibling cwd-resolving subcommands are NOT rewired** beyond `ensure-exclude` (spec §8/§9 YAGNI — they run from the refinery worktree by construction).
- **No whole-repo dead-code lint** (spec §9): the marker is a comment convention + one standing-card clause.
- **`requiresPackaging: false` on every task** — this repo ships no Dockerfile; the packaging floor is vacuous here.

## Open decisions

None — resolved interactively at conversion (operator volley, 2026-07-08): intent + all five deltas approved as-is.
