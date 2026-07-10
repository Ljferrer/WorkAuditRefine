# Mechanize WAR's GitHub side-effects — implementation plan

**Source spec:** `docs/specs/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization-design.md`
**Slug:** `github-issue-lifecycle-and-run-bookkeeping-mechanization` (shares the spec's slug, drops `-design`).
**Repo version at authoring:** 0.14.14 — version literals below are non-authoritative; resolve the next free patch from the four release slots at land time.
**Roadmap ordering:** lands **after** plan 1 (`land-path-integrity-and-status-enum-discipline`) — the floor's landed-phase branch keys on the phase-level `landed` decision and the phase-vs-task status vocabulary that plan stabilizes (spec §8).

## Commander's Intent

**Purpose.** WAR's GitHub surface becomes verified, not trusted — issue filing, epic close-on-done, the active `gh` account, stranded-remote acknowledgement, and the stacked-doc snap each get a mechanism instead of a prose sentence, so none can silently drift from run state again.

**Method.** A new `gh-preflight.sh` asserts the active `gh` account equals `overrides.ghUser` before every gh write batch — switching on drift, re-verifying via `gh api user`, failing loud on unrecoverable mismatch; the knob ships `null` (no personal handle in any committed file — C1). A new Lead-invoked floor `assert-issues-filed.sh` (exit contract 0/1/2, `2` never collapsing into `1` — C5) asserts at the Checkpoint that the ledger's `epic_issue` and every `tasks[].issue` exist on live `gh` (C4: reconcile toward gh, never trust the ledger alone), and on a landed phase that the epic is `CLOSED` + `status:done`; its `--close-epic` mode makes label-and-close one atomic action, and the floor's done-but-open route makes the coupling non-bypassable. A committed `docs/aftermath/known-stranded.tsv` (ref + landing-PR evidence per row) routes permanently-stranded remotes to a new **acknowledged-stranded** report bucket — suppressed from needs-human, never auto-deleted, the tip-reachable + PR-merged deletion bar untouched (C3). `snap-shared-docs.sh` packages the proven merge-master/`--theirs`/fast-forward recipe for churny shared docs (byte-identity guard outside the pathspec; never `--force` — C6), with ADR 0011 stack-and-plow reaffirmed as the primary recurrence reducer (C7). Everything is Lead-side — zero confined-agent capability widening (C2, ADR 0002).

**End state** (each individually checkable):
1. `gh-preflight.sh ""` exits 0 without invoking `gh` (stub fails if called); with stub active=`B` expected=`A` it runs `gh auth switch … --user A`, re-verifies via `gh api user --jq .login`, exits 0; when the switch doesn't take it exits non-zero printing both wanted and actual login — asserted in `gh-preflight.test.sh`. (spec criteria 1–3)
2. `assert-issues-filed.sh assert <ledger> <phase>` exits 0 against a fixture ledger whose `epic_issue` + every `tasks[].issue` exist per the `gh` stub; exits 1 naming the missing issue when one is null/not-found; a gh/network/ledger-parse failure exits 2, never 1 — the full contract asserted in `assert-issues-filed.test.sh`. (spec criteria 4–5)
3. On a landed phase whose epic is `state:OPEN` with `status:done`, the floor exits 1 (`done-but-open`); `state:CLOSED` exits 0. (spec criterion 6)
4. `--close-epic <n> --sha <sha>` issues both the label edit (`+status:done`/`−status:in-progress`) and `gh issue close --reason completed` with the landed-SHA comment in one call (stub argv asserted); after it, end state 3 passes for that epic. (spec criterion 7)
5. `war-config.test.mjs` accepts `overrides.ghUser: "someuser"`, rejects a non-string, and the shipped `DEFAULTS.overrides.ghUser` is `null`; `KNOWN_OVERRIDES` gains `ghUser`. (spec criterion 8)
6. `docs/aftermath/known-stranded.tsv` exists with the churny `remote_ref`/`landed_pr`/`note` schema, seeded from the recorded stranded-set learning (exact refs resolved against `git ls-remote` at execution — see deltas); every **data** row carries a populated `landed_pr` **or** (for a genuinely PR-less stranded ref such as a `claude/*` session remote) a `note` documenting the PR-less reason with `landed_pr` = `-`; the seed may legitimately be **empty** — all 26 recorded refs were manually cleared from origin after recording, so at land time the seed resolves to whatever subset still shows on `git ls-remote` (possibly none): the committed file + the consultation mechanism are the deliverable, not a non-empty row count. `skills/aftermath/SKILL.md` Class-1 reasoning routes an allowlist-matched ref to the **acknowledged-stranded** bucket (exact `refs/heads/<ref>` match, never substring) — excluded from needs-human, never entering any delete list; a non-allowlisted ref failing the deletion gate still reports needs-human. (spec criteria 9–10; live behavior → backstops)
7. `snap-shared-docs.test.sh`: on a fixture where branch and master differ only under the churny-doc pathspec, the helper resolves to master's copy, the code diff outside the pathspec is empty, and the push fast-forwards; a fixture with a code difference outside the pathspec makes the guard refuse to push. (spec criterion 11)
8. None of the **new** gh-auth artifacts (`gh-preflight.sh`, `assert-issues-filed.sh`, `known-stranded.tsv`, the two new ADRs, the `war-config` `ghUser` default) hardcodes the literal expected-account handle; `node skills/_shared/war-memory.mjs lint docs/learnings/` stays green. (spec criterion 12 — the **pre-existing** public author/owner identity in `plugin.json`/`marketplace.json`/`README.md` is legitimate and explicitly out of scope; end state 8 is checked against the new artifacts only, never a blanket repo grep.)
9. `skills/war/SKILL.md` names `gh-preflight.sh` before **every** gh write batch it hosts — Decompose (file-epics + per-phase sub-issues), the per-phase update+mirror batch (`## Per phase`), Checkpoint (close), and the Finish PR — `assert-issues-filed.sh assert` as the Checkpoint gate before the DAG advances, and `--close-epic` as the landed-phase action; `skills/aftermath/SKILL.md` names `gh-preflight.sh` before its issue-close batch; `skills/war-room/SKILL.md` surfaces the `overrides.ghUser` knob. (spec §4.1 — every enumerated batch site, keyed by named construct)
10. `docs/adr/0026-*.md` (GitHub side-effects mechanically gated) and `docs/adr/0027-*.md` (known-stranded allowlist, deletion bar unchanged) exist; `CONTEXT.md` carries the four new terms. (spec §7, ADRs renumbered — see deltas)
11. `node --test 'skills/**/*.test.mjs'` and every `hooks/` + `skills/` `*.test.sh` pass.
12. The four release slots move together to the resolved next patch.

## Build order (for /war)

### Phase 1 — Preflight, floor, allowlist, snap (Lead-side mechanisms)

Seven tasks, file-disjoint; one wave edge (Task 1.2 → Task 1.1).

**Task 1.1 — `gh-preflight.sh` + test**
- Files: `skills/_shared/gh-preflight.sh` (new), `skills/_shared/gh-preflight.test.sh` (new)
- Plan slice: Single argument = expected account (the Lead passes `overrides.ghUser`). Empty/unset ⇒ exit 0 immediately, no `gh` invocation (C1 no-op path). Else read the active account — prefer `gh api user --jq .login` as authoritative; the `gh auth status` "Active account" parse is version-fragile, and a parse miss is a tooling error (exit 2-style non-zero), never a silent 0 (spec §8). Match ⇒ exit 0. Drift ⇒ `gh auth switch --hostname github.com --user <expected>`, re-verify via `gh api user --jq .login`; verified ⇒ 0; still mismatched ⇒ **fail loud, non-zero, printing both wanted and actual login**. bash-3.2-safe, cwd-independent, `die` idiom of the floor family. Test with a stubbed `gh` on PATH: no-op path (stub fails if invoked), drift-switch path (argv recorded), fail-loud path (switch doesn't take); delete-and-trace each.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject (this repo)

**Task 1.2 — `assert-issues-filed.sh` floor + test**
- Files: `skills/war/assets/assert-issues-filed.sh` (new), `skills/war/assets/assert-issues-filed.test.sh` (new)
- Plan slice: Sibling of the `assert-*-in-diff.sh` family — same bash-3.2-safe style, same exit contract (C5): 0 = verified, 1 = named route (`issues-missing` / `done-but-open`), 2 = gh/ledger/ref/tooling error, **never collapsed into 1**. Modes: **`assert <ledger.json> <phase-id>`** — parse the phase's `epic_issue` and every `tasks[].issue` (schema fields at `skills/war/references/schemas.md` ledger block); each must be non-null and `gh issue view <n> --json state,labels` must confirm existence; on a phase being landed, additionally require epic `state == CLOSED` **and** label `status:done` (the close-coupling teeth) — else exit 1 `done-but-open`. Runs `skills/_shared/gh-preflight.sh` first (resolve path relative to the script's own dir, cwd-independent) so an account flip can't fake a 2. **`--close-epic <n> --sha <sha>`** — atomic: `gh issue edit <n> --add-label status:done --remove-label status:in-progress` then `gh issue close <n> --reason completed --comment "<phase> landed @ <sha>"`, preflight first. The floor keys ONLY on the ledger's own fields — it never reads plan prose, so the recorded `No GitHub issue filed` audit-finding rationalization can never be conflated again. Lead-invoked, never refiner-side (C2). Test: fixture ledger + stubbed `gh` covering all-filed ⇒ 0, one-null / not-found ⇒ 1 naming the issue, gh network failure ⇒ 2 (asserted ≠ 1), done-but-open ⇒ 1, closed ⇒ 0, `--close-epic` argv pair recorded; delete-and-trace each.
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

**Task 1.3 — `overrides.ghUser` config knob**
- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`, `skills/war-room/SKILL.md`
- Plan slice: Add `ghUser: null` to `DEFAULTS.overrides` and `'ghUser'` to `KNOWN_OVERRIDES` (the validation loop already handles known-key + type checks — extend with string|null validation matching the loop's existing idiom). `war-config.test.mjs`: accepts `overrides.ghUser: "someuser"`, rejects non-string (e.g. `42`), asserts shipped default `null`. `skills/war-room/SKILL.md`: one line surfacing the knob (personal `gh` account for multi-account machines; stays in local `.claude/war/config.json`, ships null). The committed default and all committed prose must never contain a real handle (C1; end state 8).
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.4 — `/war` SKILL.md wiring prose**
- Files: `skills/war/SKILL.md`
- Plan slice: Decompose section: name `gh-preflight.sh` (with `overrides.ghUser`) at the head of the file-epics batch and each per-phase sub-issue batch. Checkpoint section: `assert-issues-filed.sh assert <ledger> <phase>` runs before the DAG advances — exit 1 blocks the advance surfacing the missing/open item; exit 2 escalates as tooling error, never a silent pass; on a landed phase the Lead runs `--close-epic <n> --sha <sha>` instead of separate label/close commands. **Per phase section: name `gh-preflight.sh` before the per-phase "update issues + ledger … and mirror the phase report + escalations as a comment on the phase epic issue" batch** (spec §4.1 site 3's *mirror* half — this write lives under `## Per phase`, and it executes **before** the `## Checkpoint` floor, so the Checkpoint's embedded preflight cannot guard it; without its own preflight an account flip here silently drops the epic label/comment — the exact spec §1 failure mode). **Finish section: name `gh-preflight.sh` before the single working→landing PR batch** (spec §4.1's Finish-PR site). Anchor insertions by the existing Decompose / Per-phase / Checkpoint / Finish constructs (never line numbers). No refiner/auditor/servitor prompt gains any gh verb (C2) — this is Lead prose only.
- requiresTest: false (prose; the scripts it names are tested in Tasks 1.1/1.2)
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.5 — Aftermath allowlist + bucket**
- Files: `skills/aftermath/SKILL.md`, `docs/aftermath/known-stranded.tsv` (new)
- Plan slice: Create `docs/aftermath/known-stranded.tsv` — tab-separated `remote_ref`, `landed_pr`, `note`; `#` comments and blanks ignored. **Seed derivation (operator-ratified delta):** the learning `docs/learnings/aftermath-2026-07-03-stranded-remote-set.md` records ref FAMILIES (`integration/pipelineskills/*` + `war/pipelineskills/*`, `integration/memsub/*` + `war/memsub/*`, `war/compaction/*`, `war/followup444/*`, the `claude/*` session remotes), not an enumerated ref list, and its recorded count is non-authoritative (25 vs 26 across records) — resolve the exact rows against `git ls-remote` at execution, matching those families, each row's `landed_pr` taken from the learning's landing-PR evidence (PR #473 pipelineskills, #496 memsub, #508 compaction, #455 followup444) — **except** the two `claude/*` session remotes, which the learning records as having **no per-branch merged PR**: such a genuinely PR-less stranded ref carries `landed_pr` = `-` and a `note` documenting the reason (the honesty discipline is preserved — every row is justified by a PR *or* a documented note, never blank). Rows for refs deleted since recording are omitted; **at land time all 26 recorded refs are already gone from origin (`git ls-remote` = 0), so the seed legitimately resolves to empty** — the committed file (with its schema/comment header) plus the Class-1 consultation are the deliverable, not a non-empty row count. `skills/aftermath/SKILL.md` Class-1 remote-branch reasoning: after deriving the candidate set from `git ls-remote` truth, a candidate matching an allowlist row **by exact `refs/heads/<ref>` name — never substring** (so `…/p1-task1` never shadows `…/p1-task10`) routes to the new **acknowledged-stranded** bucket: printed for the record, excluded from needs-human, never entering any delete list. The deletion gate (tip-reachable + PR-merged) is byte-untouched — an allowlist row is an acknowledgement, never a deletion license (C3); clearing one stays a deliberate manual push outside aftermath's gates. Adding a row requires `landed_pr` populated **or** a `note` documenting a genuinely PR-less stranded ref (the relaxed invariant above). **Also (spec §4.1 "mirrored where aftermath does closes"): `skills/aftermath/SKILL.md` names `gh-preflight.sh` (with `overrides.ghUser`) before its issue-close batch** — the aftermath gh-write site, in the aftermath skill — so a mid-run account flip never silently drops an aftermath close. Lead prose only; no confined-agent gh verb (C2).
- requiresTest: false (prose + committed data; live suppression behavior → backstops)
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.6 — `snap-shared-docs.sh` + test**
- Files: `skills/war-campaign/assets/snap-shared-docs.sh` (new), `skills/war-campaign/assets/snap-shared-docs.test.sh` (new)
- Plan slice: One argument: `<branch>`. In a detached scratch worktree off `origin/<branch>`: (1) `git merge --no-edit origin/master`; resolve each unmerged path under the canonical churny-doc pathspec (`docs/plans docs/specs docs/roadmaps`) with `git checkout --theirs -- "$f" && git add -- "$f"` (`--theirs` in a merge-of-master = master's canonical copy); any unmerged path OUTSIDE the pathspec ⇒ refuse (a code-touching doc is never blindly `--theirs`'d — spec §8). (2) Guard before push: zero unmerged paths remain AND `git diff origin/<branch> HEAD -- . ':(exclude)docs/plans' ':(exclude)docs/specs' ':(exclude)docs/roadmaps'` is empty. (3) `git push origin HEAD:refs/heads/<branch>` — first parent = old tip ⇒ fast-forward; wrong content auto-rejects non-ff (C6); **never `--force`**. (4) Verify `git merge-tree --messages origin/master origin/<branch>` shows 0 CONFLICT. `while IFS= read -r` iteration, quoted paths, bash-3.2-safe. The recipe's canonical statement is spec §4.5 (the originating record is a local memory, not a repo learning — cite the spec, not a learnings path). Test: fixture repo with a docs-only divergence ⇒ resolves to master's copy, outside-pathspec diff empty, push fast-forwards; fixture with a code change outside the pathspec ⇒ guard refuses; delete-and-trace.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.7 — Doctrine docs: ADR 0026 + ADR 0027 + CONTEXT.md**
- Files: `docs/adr/0026-github-side-effects-mechanically-gated.md` (new), `docs/adr/0027-aftermath-known-stranded-allowlist.md` (new), `CONTEXT.md`
- Plan slice: ADR 0026 per spec §7 (retitled from the spec's stale 0023 — plans 1–3 claim 0023/0024/0025; re-resolve against `docs/adr/` at land time): issue-lifecycle floor keyed on the ledger orthogonal to plan prose; gh preflight with `overrides.ghUser` shipping null (C1); close-on-done coupling (`status:done` cannot outlive an open epic); Lead-side only, no confined-agent widening (C2/ADR 0002). ADR 0027 (from the spec's 0024): acknowledged-stranded suppression via committed `known-stranded.tsv` evidenced by landing PRs, deletion bar explicitly unchanged (C3). The stacked-doc snap gets **no** ADR — it reaffirms ADR 0011 (C7). CONTEXT.md: the four terms verbatim from spec §6 — **gh preflight**, **issue-lifecycle floor**, **acknowledged-stranded**, **churny shared docs**.
- requiresTest: false (docs only)
- requiresPackaging: false
- deps: none
- target repo: superproject

### Phase 2 — Release bump (trailing)

Phase edge on Phase 1. **(Operator-ratified delta: the spec's surface list omits the release slots; repo law requires the trailing bump phase.)**

**Task 2.1 — Version bump across the four slots**
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Resolve the next free patch from the four slots at land time (authoring baseline 0.14.14 — non-authoritative; earlier campaign plans will have advanced it). Lockstep: `plugin.json` `version`; `marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status` (replace-in-place, no badge). Keep the Status blurb plain; it must not contain a personal handle (end state 8).
- requiresTest: false (metadata only)
- requiresPackaging: false
- deps: none (single task)
- target repo: superproject

## Deferred validations (backstops)

- **Live allowlist suppression + unchanged deletion bar (spec criteria 9–10, live half)** · why deferred: aftermath classification is Lead-executed prose over live `git ls-remote`/`gh` state — no test asset family exists for the aftermath skill, and stubbing the full classification adds a test surface the spec doesn't designate · runner: the first `/aftermath` run after landing (report must show the acknowledged-stranded bucket and zero allowlisted refs in needs-human or any delete list) + `/red-team` prose-contract read.
- **Preflight-before-every-batch is prose-enforced Lead discipline** · why deferred: the standing instruction cannot be mechanically forced onto future Lead sessions; the floor's own embedded preflight covers the checkpoint path · runner: `/red-team` prose check (every gh-batch site in `skills/war/SKILL.md` + `skills/aftermath/SKILL.md` names the preflight) + first live run.
- **The floor cannot see a task never recorded in the ledger at all (spec §8 ponytail) — accepted limitation, not a mechanically-validated deferral** · why deferred: guarding recorded-but-unfiled and done-but-open covers the observed failures; a wholly-absent bookkeeping intent has **no** automated runner in this repo — no run-`ledger.json` validator exists (the schema block in `skills/war/references/schemas.md` constrains only the *shape* of task entries that are present, never cross-references the plan's task list; `campaign-ledger.test.mjs` is a different, campaign-scope ledger) · runner: **human ledger review at Decompose** (the Lead reads the ledger's `tasks[]` against the plan's task list before dispatch) + the ADR 0026 doctrine note documenting the limitation. No claim of mechanical validation.
- **`snap-shared-docs.sh` against a real stacked conflict** · why deferred: the fixture test proves the guard logic; a live GitHub mergeability lag (`merge-tree` verify step) only manifests on a real stack · runner: the next `/war-campaign` stacking event that surfaces a docs-only conflict.

## Notes / conscious deviations

- **Red-team rounds 1–2 patches (2026-07-09, Lead self-adjudicated AFK):** (1) **preflight coverage** — Task 1.4/1.5 + end-state 9 extended from 2 batch sites to **every** spec §4.1 gh-write site, keyed by named construct: Decompose (file-epics + per-phase sub-issues), the **per-phase update+mirror** batch (`## Per phase` — round 2 caught that spec site 3's *mirror* half lives here, not under `## Checkpoint`, and executes before the Checkpoint floor), Checkpoint (close), **Finish PR**, and **aftermath close** — so backstop #2 verifies a state the tasks actually create; (2) **known-stranded `landed_pr` invariant relaxed** — the two `claude/*` session remotes have no per-branch merged PR (learning + spec §2 both say so), so a genuinely PR-less ref uses `landed_pr` = `-` + a documenting `note`; also recorded the execution reality that all 26 recorded refs are already gone from origin (seed resolves empty — mechanism, not row count, is the deliverable); (3) **end-state 8 re-scoped** to the spec's criterion-12 wording — the new gh-auth artifacts + the `war-config` default, explicitly excluding the pre-existing public author identity (`Ljferrer` legitimately in plugin.json/marketplace.json/README), so end-state 8 is never a blanket repo grep; (4) **backstop (c) relabeled** as an accepted limitation with an honest runner (human ledger review at Decompose + the ADR note) — no run-`ledger.json` validator exists, so "ledger schema validation" was a false runner claim.
- **Four operator-ratified conversion deltas (2026-07-08 volley):** (1) ADRs renumbered **0026/0027** — the spec's 0023/0024 predate plans 1–3 claiming 0023–0025; (2) trailing **release phase added** — the spec's §5 omits the release slots, repo law requires them; (3) the tsv **seed derives exact refs from the learning's families against `git ls-remote` at execution** — the learning lists families, not literal refs, and its recorded count (25 vs 26) is inconsistent, so the count is non-authoritative; (4) Task 1.2 carries a **`deps` wave edge on Task 1.1** — the floor invokes the preflight, so its green gate needs the script present on its rebase base.
- **Depends on plan 1 at the roadmap level** (spec §8): the floor's landed-phase branch keys on the phase-level `landed` decision and the phase-vs-task status vocabulary plan 1 pins with drift-guards. Ordering-only — no file contention with plan 1 except `skills/war/SKILL.md` (below).
- **Cross-plan contention (for the roadmap table):** `skills/war/assets/war-config.mjs` + `war-config.test.mjs` are also edited by plan 3 (drift-guards Task 1.2 — preset matrix); `skills/war/SKILL.md` is also edited by plan 1 (Task 1.3 D6/D7 prose); `CONTEXT.md`, `docs/adr/`, and the three release-slot files are shared with all prior plans. `skills/_shared/` gains files in both plan 3 (`doc-cli-consistency.test.mjs`) and this plan (`gh-preflight.sh` + test) — different files, no collision. Roadmap serializes; this plan rebases onto landed content.
- **The stacked-doc recipe's originating record is a local memory** (`stacked-pr-shared-doc-conflict-fix-merge-theirs`), not a repo learning — no `docs/learnings/` file exists for it. The plan cites spec §4.5 as the recipe's canonical statement; Task 1.6 must not reference a learnings path.
- **No PreToolUse hook intercepting `gh` calls** (spec §9): rejected as over-built; preflight-before-batch + the checkpoint floor cover the observed failures. Revisit only if a batch bypasses the preflight in practice.
- **`requiresPackaging: false` on every task** — this repo ships no Dockerfile; the packaging floor is vacuous here.

## Open decisions

None — resolved interactively at conversion (operator volley, 2026-07-08): intent + all four deltas approved as-is.
