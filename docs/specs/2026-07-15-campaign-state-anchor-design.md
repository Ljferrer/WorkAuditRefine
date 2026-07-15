# Campaign state anchors at the main checkout — hook, ledger CLI, and placement prose stop trusting the Lead's cwd

Date: 2026-07-15
Status: draft (operator-reported defect, claims verified against the live tree 2026-07-15) — awaiting conversion

## 1. Context — the gap / problem

ADR 0016's compaction-survival guarantee has two halves; the code-enforced half is
`hooks/inject-campaign-state.sh`, a `SessionStart(compact|clear|resume)` hook that re-injects
`CAMPAIGN-STATE.md` for the active campaign. The hook resolves its scan root as
`$CLAUDE_PROJECT_DIR`, falling back to the hook payload's `.cwd`, then requires
`<root>/.claude/campaigns` to exist and exits 0 **silently** when it doesn't (the fail-open
guard block near the top of the script).

A campaign Lead normally runs from a session git worktree (`.claude/worktrees/<name>/`). With
`CLAUDE_PROJECT_DIR` unset (verified in a live worktree session, 2026-07-15) the scan root is the
worktree, which has no `.claude/campaigns` — so the re-injection guarantee never fires, and
nothing reports that it stopped firing. The root cause is systemic, not a hook bug in isolation:
**campaign-state placement is coupled to the Lead's cwd on three surfaces at once** —

- the **reader**: the hook's scan-root resolution described above;
- the **writer**: `campaign-ledger.mjs`'s CLI resolves `--campaign` (default
  `.claude/campaigns/default`) against `process.cwd()` — see the `campaignDir` assignment at the
  top of `main()`;
- the **contract**: `skills/war-campaign/SKILL.md` states the path as `.claude/campaigns/<id>/…`
  with no anchor rule, while the sibling pipeline skills already ratified one —
  `MAIN=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")` appears in
  `skills/survey-corps/SKILL.md`, `skills/war-machine/SKILL.md`, `skills/war/SKILL.md`, and
  `skills/war-review/SKILL.md`, with `skills/war/references/schemas.md` spelling out "never the
  invoking worktree's `.claude/`", locked by `skills/war-machine/war-pipeline-structure.test.sh`
  criterion 9. The campaign surfaces missed the rule.

The originating spec (`docs/specs/2026-07-03-campaign-compaction-survival.md`, "Worktree vs
main-checkout cwd" note) ratified cwd-anchoring on the assumption that "campaigns live under the
*session's* project dir". Observed fallout disproved that assumption three ways (all verified on
the live machine, 2026-07-15):

1. **Stranded state.** A prior campaign wrote its state inside a session worktree so the hook
   could find it; `.claude/worktrees/survey-corps-06a1c3/.claude/campaigns/2026-07-12-memory-mined-debt/`
   still exists there (all plans `landed` — dead weight). `/aftermath` reaped a *different* such
   worktree, leaving the main checkout's `.claude/campaigns` a dangling symlink into the reaped
   path; that dangling symlink made `campaign-ledger.mjs init` throw a raw ENOENT until it was
   removed by hand on 2026-07-15. Worktrees are disposable; campaign state must outlive them.
2. **Symlink workaround.** `.claude/worktrees/survey-corps-8cc638/.claude/campaigns` is a manual
   symlink to the main checkout's campaigns dir — must be redone per worktree.
3. **Copy workaround.** `.claude/worktrees/sleepy-kepler-e49e59/.claude/campaigns/2026-07-14-survey-debt/`
   is a byte-identical *copy* of the live campaign (3 plans open). Two ledgers for the same
   campaign now exist; they diverge on the Lead's next write, and the hook's latest-by-mtime
   selection means whichever copy was touched last shadows the other — a stale brief can win.

## 2. Pivotal constraints

- **Fail-open is non-negotiable** (ADR 0016 consequences): the hook fires in *any* repo with the
  plugin installed and must never wedge a session start — no nonzero exit, no partial payload.
  Any new probe (git) must degrade to today's behavior when it fails.
- **macOS bash 3.2** for the hook; `jq` is the only hard dependency today. `git` may be probed
  but never required.
- The anchor idiom is already ratified repo-wide: `dirname "$(git rev-parse
  --path-format=absolute --git-common-dir)"` = main checkout, for linked worktrees *and* when
  already in the main checkout. Reuse it verbatim; don't invent a second idiom.
- `campaign-ledger.mjs` is Node-stdlib-only (no npm deps). `node:child_process` is stdlib; a git
  probe is admissible, an npm dep is not.
- Campaign state is uncommitted by design (never in git); ADR 0008 discipline (reconcile toward
  git truth) is unchanged.
- The 2026-07-03 spec's cwd note and ADR 0016's prose describe the current behavior — the change
  must amend ADR 0016 explicitly, not silently diverge from it.
- Existing hook test fixtures are plain temp dirs (not git repos); the design must keep those 11
  cases meaningful as the *fallback-path* coverage.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Hook scan root | Compute `root` as today (`$CLAUDE_PROJECT_DIR` else payload `.cwd`), then attempt `main=$(dirname "$(git -C "$root" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)")`; on success use `$main`, on any failure (git missing, not a repo, bare) keep `$root`. Anchor applies **on top of both** sources — `CLAUDE_PROJECT_DIR` pointing at a worktree anchors too. |
| Writer (ledger CLI) root | In `main()`, resolve a **relative** `--campaign` (and the default) against the same git anchor via a `node:child_process` `execFileSync('git', …)` probe, falling back to cwd when the probe fails. An **absolute** `--campaign` passes through untouched. All subcommands route through the one `campaignDir` assignment, so one fix covers init/add/sweep/record/next. |
| Placement contract (SKILL prose) | `skills/war-campaign/SKILL.md` State & resume section gains the anchor rule in the same wording family as survey-corps/war-machine ("resolve the main checkout via `git rev-parse --path-format=absolute --git-common-dir`; never the invoking worktree's `.claude/`"), and every `campaign-ledger.mjs` invocation example passes an anchored `--campaign`. |
| Silence when state is elsewhere | New hook variant: when the anchored root yields **no active campaign** but `<main>/.claude/worktrees/*/.claude/campaigns/*/ledger.json` contains an **active** ledger (same `is_active` predicate), emit a bounded warning banner naming the stranded path — no state body, exit 0. All-landed stranded ledgers stay silent (litter, not signal). |
| Dangling-symlink ENOENT at init | The original report's mechanism is stale — `init()` already uses `mkdirSync(…, { recursive: true })` (since the ledger's first commit). The real trigger was the dangling `campaigns` symlink: recursive mkdir *through* a dangling link still throws ENOENT. Fix: catch ENOENT around the two `mkdirSync` calls in `init()` and rethrow naming `campaignDir` and the dangling-symlink possibility. |
| Drift guard | Add a criterion to `skills/war-machine/war-pipeline-structure.test.sh` asserting `skills/war-campaign/SKILL.md` states `--git-common-dir` and `main checkout` (same `has` helper as criterion 9). Hook behavior is locked by new test cases (§10). |
| ADR | Amend ADR 0016 in place (dated note): scan root anchors at the main checkout; supersedes the 2026-07-03 spec's "Worktree vs main-checkout cwd" note. |
| Existing on-disk mess | Operator checklist, not a plan task (uncommitted local state, no commit can land it): delete the all-landed `2026-07-12-memory-mined-debt` dir stranded in `survey-corps-06a1c3`; after the fix lands, delete the copy in `sleepy-kepler-e49e59` (main's copy is authoritative — byte-identical as of 2026-07-15) and the symlink in `survey-corps-8cc638`. |

## 4. Mechanics

**Hook (`hooks/inject-campaign-state.sh`).** After the existing `root` resolution and before the
`[ -d "$root/.claude/campaigns" ]` guard, one anchor block: probe git as in §3; on success
reassign `root`. The stranded-state warning slots in where the hook currently exits silently
(no campaigns dir, or no active ledger): glob
`"$root"/.claude/worktrees/*/.claude/campaigns/*/ledger.json`, run each through `is_active`,
and on the first hit emit the standard one-JSON-object payload whose `additionalContext` is a
two-line warning (active campaign ledger found at `<path>`, outside the durable
`<main>/.claude/campaigns` root — state there will not survive worktree reaping; move it) —
then exit 0. Everything else (mtime selection, size gate, payload variants) is untouched.

**Ledger CLI (`skills/war-campaign/assets/campaign-ledger.mjs`).** A small `resolveCampaignDir`
helper wrapping the `campaignDir` assignment in `main()`: absolute → as-is; relative → join to
the git anchor when the probe succeeds, else to cwd (today's behavior). Exported functions keep
taking `campaignDir` verbatim — the anchor is a CLI-layer concern, so library callers and every
existing test are unaffected. `init()` additionally wraps its `mkdirSync` pair per §3.

**Prose + guards.** SKILL.md anchor rule and examples; structure-test criterion; hook test cases
per §10; ADR 0016 amendment paragraph.

## 5. Surface changes

- `hooks/inject-campaign-state.sh` — anchor block + stranded-state warning variant
- `hooks/inject-campaign-state.test.sh` — new cases (§10); cases 1–11 unchanged as fallback coverage
- `skills/war-campaign/SKILL.md` — anchor rule + anchored invocation examples
- `skills/war-campaign/assets/campaign-ledger.mjs` — `resolveCampaignDir` at the CLI layer; `init()` ENOENT rethrow
- `skills/war-campaign/assets/campaign-ledger.test.mjs` — coverage for both
- `skills/war-machine/war-pipeline-structure.test.sh` — war-campaign anchor-prose criterion
- `docs/adr/0016-campaign-compaction-survival.md` — amendment note

## 6. New domain terms (CONTEXT.md)

None — "main checkout" and the `--git-common-dir` anchor are already established vocabulary
(survey-corps / war-machine / war / schemas.md).

## 7. Recommended ADRs

Amend ADR 0016 (no new ADR): the decision's §2 gains the anchored scan root and the
stranded-state warning; the consequences note that the 2026-07-03 spec's "campaigns live under
the session's project dir" assumption is superseded — campaign state lives under the **main
checkout's** `.claude/campaigns`, because session worktrees are disposable (`/aftermath` reaps
them) and campaign state must outlive any one session.

## 8. Open risks / implementation notes

- **Submodule edge:** inside a submodule worktree, `--git-common-dir` resolves into the
  superproject's `.git/modules/…`, whose parent is not a checkout root. Accepted residual:
  campaigns are a superproject concern; the Lead never runs a campaign from inside a submodule.
  The fallback keeps the hook fail-open regardless.
- **Hook cost:** one `git rev-parse` per SessionStart(compact|clear|resume) firing — negligible,
  and only in repos that reach the probe.
- **Two ledgers during transition:** until the operator deletes the worktree copy of
  `2026-07-14-survey-debt`, hook selection is mtime-racy between main and the copy. The anchor
  fix makes the hook read only main's; the checklist in §3 removes the race entirely.
- **`CLAUDE_PROJECT_DIR` semantics:** unset in the observed worktree session, but if the harness
  ever sets it to the worktree path, the anchor-on-top design already covers it; if it sets it to
  the main checkout, the anchor is a no-op. No branch on provenance needed.
- **Operator checklist (uncommitted local state, do after the fix lands):**
  1. `rm -r .claude/worktrees/survey-corps-06a1c3/.claude/campaigns` (all plans landed; verified 2026-07-15)
  2. `rm -r .claude/worktrees/sleepy-kepler-e49e59/.claude/campaigns` (copy; main is authoritative)
  3. `rm .claude/worktrees/survey-corps-8cc638/.claude/campaigns` (symlink workaround, obsolete)

## 9. Non-goals / deferred

- No injection of stranded worktree ledgers (warning only — injecting them would legitimize the
  wrong placement and reintroduce the mtime race).
- No git dependency hard-required anywhere; every probe degrades to current behavior.
- No committing of campaign state, no `.gitignore` changes, no change to ledger schema, inbox
  protocol, or `is_active` semantics.
- No edit to the 2026-07-03 spec itself (specs are point-in-time records; the ADR amendment
  carries the supersession).

## 10. Validation criteria

1. **Anchor, cwd source:** temp git repo + linked worktree, active campaign under the *main*
   checkout only; hook invoked with stdin `cwd` = worktree path, `CLAUDE_PROJECT_DIR` unset →
   payload inlines the state-file sentinel. (New hook test case.)
2. **Anchor, env source:** same fixture, `CLAUDE_PROJECT_DIR` = worktree path → same payload.
3. **Fallback:** existing cases 1–11 (non-git temp dirs) pass unmodified; additionally with
   `git` shadowed off `PATH`, case 5's fixture still injects via the unanchored root.
4. **Stranded-state warning:** fixture with an *active* ledger only under
   `<main>/.claude/worktrees/x/.claude/campaigns/…` → warning payload naming the path, exit 0;
   sibling fixture with an all-`landed` stranded ledger → empty stdout, exit 0.
5. **Ledger CLI anchor:** from a linked-worktree cwd, a relative `--campaign` writes under the
   main checkout; an absolute `--campaign` is untouched; outside a git repo the relative path
   resolves against cwd (today's behavior). (campaign-ledger.test.mjs.)
6. **Init through a dangling symlink** names `campaignDir` in the thrown error, not a bare
   ENOENT stack.
7. **Drift guard:** war-pipeline-structure.test.sh fails if the war-campaign SKILL loses the
   `--git-common-dir` / `main checkout` anchor prose.
8. **Manual smoke:** with the live `2026-07-14-survey-debt` campaign in the main checkout and no
   worktree symlink/copy present, `/compact` + resume from a session-worktree Lead re-injects the
   brief.
