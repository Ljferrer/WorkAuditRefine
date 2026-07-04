# Rename pipeline-edge skills — `/war-survey-corps` → `/survey-corps`, `/war-aftermath` → `/aftermath`

## Commander's Intent

*(Drafted verbatim from the operator's invocation — ratify or amend at `/red-team`.)*

- **Purpose:** Convert the names of the two pipeline-edge skills — `/war-survey-corps` → `/survey-corps`
  and `/war-aftermath` → `/aftermath`. This changes the behavior of **no** skill; it is a pure rename
  with a high blast radius, and the blast radius is handled exhaustively rather than avoided.
- **Method:** One cross-cutting rename sweep over every **live** surface carrying the old names —
  skill directories (`git mv`), frontmatter, the plugin manifest, README (including its heading
  anchors), CONTEXT.md, sibling SKILL.md cross-references, and the pipeline structure test — followed
  by a +0.0.1 version bump in a trailing release phase. Historical artifacts under `docs/` keep the
  old names: they record what was true when written.
- **End state** (each independently checkable):
  1. `skills/survey-corps/` and `skills/aftermath/` exist (moved via `git mv`, history preserved),
     each SKILL.md frontmatter `name:` matches its new directory; `skills/war-survey-corps/` and
     `skills/war-aftermath/` no longer exist.
  2. Behavior unchanged: `skills/aftermath/SKILL.md` still carries `disable-model-invocation: true`;
     no skill body logic, flags, or contracts are altered — only name tokens.
  3. `grep -rF war-survey-corps` and `grep -rF war-aftermath` over the live surfaces —
     `.claude-plugin/`, `README.md`, `CONTEXT.md`, `skills/` — return **zero** matches (sole
     exemption: the structure test's own absence-assertion arguments, which must name the old
     tokens to guard against them; `docs/` is out of scope as history).
  4. `skills/war-machine/war-pipeline-structure.test.sh` passes against the new paths and gains
     paired presence + absence guards pinning the rename.
  5. The version reads **current + 0.0.1** — a patch bump over whatever the slots read at
     execution time, NOT a finite literal (another in-flight plan may land 0.14.0 first) — and is
     identical in all four slots: `plugin.json` `version`, `marketplace.json` `metadata.version`
     **and** `plugins[0].version`, and the README `## Status` blurb (replace-in-place).

## Build order (for /war)

1. **Phase 1 — Rename sweep** (one cross-cutting task)
2. **Phase 2 — Release, patch bump +0.0.1** (trailing, lands last; version resolved at execution time)

---

## Phase 1 — Rename sweep

### Task 1: `git mv` both skill directories and update every live reference

- **Files:**
  - `skills/war-survey-corps/` → `skills/survey-corps/` (`git mv`; then edit `SKILL.md`)
  - `skills/war-aftermath/` → `skills/aftermath/` (`git mv`; then edit `SKILL.md`)
  - `.claude-plugin/plugin.json` (skills array entries only — **not** the version field, which is Phase 2's)
  - `README.md` (12 old-name occurrences incl. two `###` headings whose anchors change)
  - `CONTEXT.md` (3 occurrences, ~lines 504–516)
  - `skills/war-help/SKILL.md` (frontmatter description + 2 command-table rows incl. README anchor links)
  - `skills/war-machine/SKILL.md` (2 `/war-aftermath` references, ~lines 67 and 77)
  - `skills/war-strategy/SKILL.md` (§5 closing offer, ~line 142)
  - `skills/war-machine/war-pipeline-structure.test.sh` (path vars, comments, new guards)
- **Plan slice:** The full occurrence inventory (verified against HEAD `a9c0241` on 2026-07-03; counts
  are `grep -c` per token — anchor edits by construct, not line number):

  | Surface | `war-survey-corps` | `war-aftermath` | What changes |
  |---|---|---|---|
  | `skills/war-survey-corps/SKILL.md` | 4 | 1 | frontmatter `name: survey-corps`; description's "runs /war-survey-corps" and usage/title `/survey-corps [--erwin]`; the `/war-aftermath` cross-ref (~line 101) → `/aftermath` |
  | `skills/war-aftermath/SKILL.md` | 0 | 3 | frontmatter `name: aftermath`; title `# /aftermath — evidence-gated cleanup`; usage `/aftermath [--afk] [--scorched-earth]` |
  | `.claude-plugin/plugin.json` | 1 | 1 | `"./skills/war-survey-corps"` → `"./skills/survey-corps"`, `"./skills/war-aftermath"` → `"./skills/aftermath"` |
  | `README.md` | 5 | 7 | pipeline-order line (~73), `### Turn issues into specs (\`/survey-corps\`)` heading + section body (~174–179), `### Clean up (\`/aftermath\`)` heading + section body incl. the scorched-earth warning (~214–224), pipeline block + afk paragraph (~261–267) |
  | `CONTEXT.md` | 1 | 2 | survey-manifest term (~504–505) and scorched-earth term (~516) |
  | `skills/war-help/SKILL.md` | 3 | 3 | description + table cell + URL anchor; anchor links become `#turn-issues-into-specs-survey-corps` and `#clean-up-aftermath` (heading rename moves the anchors — links must move with them) |
  | `skills/war-machine/SKILL.md` | 0 | 2 | `/war-aftermath` → `/aftermath` in the evidence-chain and retained-manifest notes |
  | `skills/war-strategy/SKILL.md` | 1 | 0 | §5 closing offer → `/survey-corps` |
  | `war-pipeline-structure.test.sh` | 1 | 3 | `SURVEY=…/skills/survey-corps/SKILL.md`, `AFTERMATH=…/skills/aftermath/SKILL.md`; comment headers naming `war-aftermath` follow ([[source-comment-lags-emitted-prompt-after-rewrite]]) |

  **Deliberately unchanged** (each is prose that never carried the slash-command name):
  - "Survey Corps" persona prose inside the renamed SKILL.md ("You are the **Survey Corps**") — the
    persona keeps its name; only the command token changes.
  - `skills/war-machine/SKILL.md` description's "(survey → machine → campaign → aftermath)" — already prefix-free.
  - `CONTEXT.md` ~line 521 "The set no aftermath mode may touch" — generic prose, still accurate.
  - `docs/plans/2026-07-02-war-pipeline-skills.md`, `docs/specs/2026-07-02-war-pipeline-skills-design.md`,
    `docs/red-team/2026-07-02-war-pipeline-skills.md` — historical record, exempt.
  - The `--erwin` flag, `war-followup` label, and every behavioral contract in both skills.

  **Test surface** (the mapped test for this task): update `war-pipeline-structure.test.sh` path
  vars so criteria 2/3/9 re-anchor to the new paths, then append a rename criterion with **paired**
  presence + absence assertions ([[weak-test-assertion-passes-without-feature-being-exercised]]):
  - Presence: `has "$SURVEY" 'name: survey-corps'`, `has "$AFTERMATH" 'name: aftermath'`,
    plugin.json carries `./skills/survey-corps` and `./skills/aftermath`, README carries
    `` `/survey-corps` `` and `` `/aftermath` ``, war-help carries both new anchors.
  - Absence: a `lacks()` helper (inverse of `has()`) asserting `war-survey-corps` and
    `war-aftermath` absent from an **explicitly enumerated** file list — README.md, CONTEXT.md,
    plugin.json, both renamed SKILL.md files, war-help/war-machine/war-strategy SKILL.md — never a
    repo-root recursive grep ([[absence-guard-search-root-must-anchor-to-subtree]]). The test file
    itself is not in the list: its assertion arguments legitimately carry the old tokens.
  - The existing `fm_has_key "$AFTERMATH" 'disable-model-invocation'` assertion, passing against
    the new path, is End-state #2's committed guard.
- **requiresTest:** true (the updated + extended structure test is the mapped test; the gate's
  `*.test.sh` sweep self-discovers it — no gate edits)
- **deps:** []
- **target repo:** superproject

---

## Phase 2 — Release, patch bump +0.0.1

### Task 1: bump the version in all four slots + README Status blurb

- **Files:**
  - `.claude-plugin/plugin.json` (`version`)
  - `.claude-plugin/marketplace.json` (`metadata.version` **and** `plugins[0].version`)
  - `README.md` (`## Status` — replace-in-place, per the repo's own release table above that heading)
- **Plan slice:** **This plan commits to no finite version literal** — another plan in flight bumps
  to 0.14.0, and landing order is not knowable at authoring time
  ([[stacked-release-plan-version-literal-lags-operator-target]]). The worker resolves the target at
  execution time: read `version` from `.claude-plugin/plugin.json` on its dispatch base, increment
  the **patch** digit by 1 (`X.Y.Z` → `X.Y.Z+1` — e.g. `0.13.0`→`0.13.1`, or `0.14.0`→`0.14.1` if
  the other plan landed first), and write that value into all four slots. Replace the `## Status`
  paragraph with (worker substitutes the resolved version for the placeholder):

  > **\<RESOLVED-VERSION\>** — Pipeline-edge skill renames: `/war-survey-corps` → `/survey-corps` and
  > `/war-aftermath` → `/aftermath` — pure rename, zero behavior change; every live reference,
  > both README anchors, and the pipeline structure test updated (historical `docs/` untouched).

  No cross-slot consistency test exists — verify all four slots agree by hand before commit
  ([[version-slots-no-cross-slot-consistency-test]]).
- **requiresTest:** false (mirrored value slots; hand-verified)
- **deps:** []
- **target repo:** superproject

---

## Notes / conscious deviations (ratify in /red-team)

1. **No deprecated aliases.** The operator asked to *convert* the names, not to add a compatibility
   layer; typing the old command after release simply finds no skill, and README + `/war-help` teach
   the new names. Adding alias stubs would contradict the zero-behavior-change framing.
2. **`docs/` is history, not a live surface.** The 2026-07-02 spec/plan/red-team artifacts keep the
   old names; rewriting them would falsify the record. The absence guard scopes accordingly.
3. **plugin.json is touched in both phases** (skills array in Phase 1, version in Phase 2). Legal:
   phases land serially — this is the release-trailing-phase rule working as intended, not a
   same-file collision within a phase.
4. **Uncommitted runtime artifacts need no migration.** The survey manifest schema
   (`.claude/aot/YYYY-MM-DD-survey.json`) does not embed the producing skill's name — verified by
   the repo-wide grep — so `/war-machine`'s manifest consumption is name-decoupled.
5. **Installed plugin cache is out of scope.** Users pick up the rename via the normal
   marketplace-version dispatch (which is exactly why Phase 2 must bump `marketplace.json`).
6. **Version is relative by operator directive.** The operator stated a sibling plan in flight will
   bump to 0.14.0; this plan therefore specifies "+0.0.1 over the version found at execution time"
   rather than a literal, so it lands correctly on either side of that plan. If a `/red-team` pass
   later adjudicates a concrete number, that adjudication is authoritative
   ([[redteam-adjudication-is-authoritative-version-source]]).

## Open decisions (resolved by /red-team)

- None blocking. Red-team probes should target: the no-alias stance (deviation 1), absence-guard
  scope (End state 3's exemption list), and whether any surface outside the grep'd token set
  references the skills by name (e.g. a prose "the aftermath skill" without the token —
  [[plan-survey-token-sweep-misses-untagged-siblings]]).
