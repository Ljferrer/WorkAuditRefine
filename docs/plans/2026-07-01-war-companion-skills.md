# WAR companion skills — `/war-help`, `/war-strategy`, `/war-campaign` Implementation Plan

**Goal:** ship the three companion skills that make WAR self-teaching and self-driving — the orientation
card, the authoring primer, and the autonomous multi-plan campaign runner (hopper) — plus their README
sections, and release **v0.9.0**. Decomposed by **code boundary**: four fully file-disjoint parallel tasks in
one phase, then a trailing release phase.

**Source spec:** [`docs/specs/2026-07-01-war-companion-skills-design.md`](../specs/2026-07-01-war-companion-skills-design.md)
— **read it at Rev 1**: the campaign feed model is **ledger + inbox** (uncommitted, multi-writer-safe adds);
the roadmap is authoring input + on-demand snapshot, never the live channel. ADR:
[`docs/adr/0011-campaign-stack-and-plow-branch-model.md`](../adr/0011-campaign-stack-and-plow-branch-model.md)
(already landed — no ADR work in this plan). CONTEXT.md already carries all six campaign terms (Frozen phase
base, Code-boundary decomposition, Roadmap, Campaign ledger, Inbox, Hopper) — **no CONTEXT.md work either**.

Memory hooks: [[frontmatter-tools-negation-check-single-line-only]] (T3 parses frontmatter, never a
single-line grep), [[weak-test-assertion-passes-without-feature-being-exercised]] (temp-break proofs for both
test surfaces), [[regex-slice-disambiguation-relies-on-match-order-not-anchoring]] +
[[regex-extract-live-code-lazy-quantifier-fragility]] (anchored line-based `Files:` parsing, no lazy
quantifiers), [[release-bump-slots-canonical-no-badge]], [[stacked-release-plan-version-literal-lags-operator-target]],
[[war-branch-base-off-latest-master-not-prior-tip]], [[gate-under-covers-after-cross-branch-merge-new-runner]],
[[plan-line-number-refs-stale-use-construct-locator]] (README edits anchor by construct),
[[default-flip-must-audit-all-doc-surfaces]] (README is the one remaining doc surface — spec + CONTEXT.md
landed in the grill session).

**Ratify with `/red-team` before `/war`.** Specifically verify: (a) GitHub PR retarget-on-delete (spec §10)
— the campaign's bottom-up merge relies on it; (b) the `campaign-ledger.mjs` contention-refusal semantics
against a real 2-plan fixture; (c) the `disable-model-invocation: true` frontmatter key is honored by the
harness for plugin skills.

## Coordination

- **Target version:** **v0.9.0** (minor — three new user-facing skills). Bumps `0.8.14 → 0.9.0`.
  **Fallback:** if the live tip has moved past 0.8.14, re-baseline to the next free version off the live tip
  and note it — the operator target (minor bump) is authoritative, not the literal.
- **Integration base:** latest `origin/master` at run start.
- **File-disjointness map (Phase 1 — all four tasks parallel):** T1 → `skills/war-help/**` only; T2 →
  `skills/war-strategy/**` only; T3 → `skills/war-campaign/**` only; T4 → `README.md` only (sections — the
  `## Status` slot is owned by T5). No overlaps; no intra-phase `deps`.
- **Cross-phase same-file:** T4 and T5 both touch `README.md` (different regions, serialized by the phase
  edge). T5 alone touches `plugin.json`/`marketplace.json`.
- **Commit boundaries:** five tasks, one commit each.
- **Gate reach:** the new `skills/war-campaign/assets/campaign-ledger.test.mjs` is picked up by the
  `node --test 'skills/**/*.test.mjs'` glob; the new `skills/war-strategy/war-strategy-structure.test.sh` by
  the `find … '*.test.sh'` sweep — the self-discovering gate needs **no edits**.

## Operator decisions — RESOLVED (bake in exactly)

- **Topology:** 2 phases — Phase 1 = 4 parallel file-disjoint tasks (3 skills + README), Phase 2 = release.
- **Version:** v0.9.0.
- **T2 layout:** templates + rule **inline in SKILL.md** (they are the printed payload; no references/ hop).
- **T3 feed model (spec Rev 1):** ledger+inbox is the live feed; roadmap = authoring input + on-demand
  snapshot; helper = CRUD + **mechanical contention check**; roadmap render/ingest beyond `init` = agent
  prose, not helper code.
- **Test surface:** T3 `.test.mjs` (helper + safety string-assertions), T2 structure `.test.sh`. T1/T4
  `requiresTest: false` (pure cards/prose — heading greps on presentation are churn).
- **README:** three tight per-skill sections + pipeline line (house pattern), campaign section carries the
  safety note.

---

## Phase 1 — the three skills + README (4 parallel, file-disjoint tasks)

### Task 1 — `/war-help`: the orientation card

**Files:** `skills/war-help/SKILL.md` (new dir, one file).

**`requiresTest`: false** — a static reference card with no runtime logic; grep-verify steps below.

- [ ] **Step 1 — Frontmatter.** `name: war-help`; `description:` states what it prints (orientation card:
  what WAR is, the command set, roles, run flow, prerequisites) and when to auto-invoke (user is new,
  confused, asks "what is WAR / how do I run it"). Auto-invocation **allowed** (no
  `disable-model-invocation`).
- [ ] **Step 2 — The six sections (spec §5, verbatim structure).** (1) One-liner — WAR = Work·Audit·Refine, a
  phase-gated multi-agent executor for a multi-phase plan. (2) Commands table — `/war-strategy` (author) →
  `/war-room` (configure) → `/red-team` (harden) → `/war` (execute) → `/war-campaign` (run many, never
  auto-invokes), plus `/lessons-learned` (tidy memory) and `/war-help` (this). (3) Roles — one line each:
  Lead · Worker · Auditor · Refiner · Servitor. (4) How a run flows — 5 beats: decompose+approve → work →
  audit → refine+land per phase → one PR. (5) Prerequisites — clean tree, `gh` auth, a detected gate.
  (6) Footer — three live deep-dive offers (*"how does auditing work in detail?"*, *"how do I run a hopper of
  plans in one chat?"* → `/war-campaign`, *"what do the roles hand off?"*), the handoff line *"Ready to write
  a plan? Run `/war-strategy`."*, and links to `README.md` + `skills/war/references/design.md`.
- [ ] **Step 3 — Dedup rule (spec §2/§5).** Grep-verify every factual claim resolves to a **link** into
  `README.md` / `references/design.md` / `CONTEXT.md` rather than a restatement. The card is a map. No
  runtime logic anywhere in the file.
- [ ] **Step 4 — Full self-discovering gate → green.** Commit —
  `feat(war-help): orientation card — commands, roles, run flow, deep-dive footer`.

### Task 2 — `/war-strategy`: the authoring primer

**Files:** `skills/war-strategy/SKILL.md`, `skills/war-strategy/war-strategy-structure.test.sh` (new dir).

**`requiresTest`: true** — the templates are the load-bearing payload; a structure test locks them.

- [ ] **Step 1 — SKILL.md.** Frontmatter (`name: war-strategy`; description: loads the WAR-shaped
  spec/plan/roadmap templates + the code-boundary decomposition rule, then hands off to the installed
  authoring skills; auto-invoke when the user is about to write a spec/plan/roadmap for WAR). Body, in order:
  - **Dependency check (spec §6.1 — probe corrected by red-team; this supersedes the spec's verbatim
    command):** run `find -L ~/.claude/skills ~/.claude/plugins .claude/skills -maxdepth 6 -type d
    \( -name grill-with-docs -o -name domain-modeling \) 2>/dev/null` — `-L` because installed skills are
    routinely **symlinks** (`-type d` alone misses them), `-maxdepth 6` because plugin-cache skills live at
    `plugins/cache/<mkt>/<plugin>/<ver>/skills/<name>` (depth 6), `2>/dev/null` because missing roots (most
    repos have no `.claude/skills`) error noisily and force exit 1. Judge emptiness on **stdout only — never
    the exit code**. Empty stdout → print the warning (why the interview matters) + link to the README
    **Grill Me** pro-tip install (one link covers `grill-with-docs`, `grilling`, `domain-modeling`).
  - **The three templates (spec §6.2), inline:** spec template (10 numbered sections), plan template
    (build order / phases / tasks with Files·slice·requiresTest·deps·target-repo / notes / open decisions),
    roadmap template (index table + dependency spine + shared-file contention) with the Rev 1 note — the
    roadmap is authoring input + snapshot; the live queue is the campaign ledger.
  - **The code-boundary decomposition rule (spec §6.3), verbatim:** the mechanics preamble (frozen tip,
    serial merge) + the four numbered consequences (parallel ⇒ file-disjoint; dependency ⇒ phase edge; one
    task = one repo; release = trailing phase) + the heuristics footnote (grep file sets; "add X"+"call X" =
    two phases; cross-cutting rename = one task; `deps` order *when*, never *what base*; the rule scales to
    phases-in-plan and plans-in-roadmap).
  - **Handoff:** route to `/grill-with-docs` + `/domain-modeling` (or `/red-team convert`) — this skill runs
    **no grilling loop of its own**.
  - **Closing offer (spec §6.4):** the real README Pro-Tip pattern (workflow → inspect open issues → cluster
    → synthesize war-shaped specs into `docs/specs/`), optionally seeded by `ponytail-audit`/`ecc:repo-scan`
    as *optional* seeds — never a hard dependency, and **not** `/improve-codebase-architecture` (not part of
    the recommended install set and not portable across machines).
- [ ] **Step 2 — Structure test.** `war-strategy-structure.test.sh` (~15 lines, bash 3.2-safe, no mktemp):
  anchored greps assert SKILL.md contains the three template fences (spec-template heading, plan-template
  heading, roadmap-template heading) and the code-boundary-rule heading. Run → **GREEN**.
- [ ] **Step 3 — Temp-break proof.** Delete one template heading → test **RED**; restore → GREEN
  ([[weak-test-assertion-passes-without-feature-being-exercised]]).
- [ ] **Step 4 — Full self-discovering gate → green.** Commit —
  `feat(war-strategy): authoring primer — templates + code-boundary rule + dep-check handoff, structure test`.

### Task 3 — `/war-campaign`: the hopper (skill + deterministic ledger core)

**Files:** `skills/war-campaign/SKILL.md`, `skills/war-campaign/assets/campaign-ledger.mjs`,
`skills/war-campaign/assets/campaign-ledger.test.mjs` (new dir).

**`requiresTest`: true** — TDD the helper; safety invariants asserted in the same test file.

- [ ] **Step 1 — TDD: write `campaign-ledger.test.mjs` first (RED).** Node stdlib `node:test`, temp-dir
  fixtures. Cases:
  - `init` from a bare plan list and from a roadmap file → same ledger shape:
    `{ campaign, created, mode: "stack"|"wait-for-merge", plans: [{ slug, plan, status, branch, pr, sha,
    stopPoint, files }] }`, statuses start `queued`.
  - **Contention (semantics settled by red-team — overlap is the NORM, not the exception: every
    release-bearing plan in this repo touches `plugin.json`/`marketplace.json`/`README.md`):** an explicitly
    **given order satisfies the check** — the `init` plan-list position and `sweep`'s append order ARE
    orderings. Refusal (error naming the overlapping paths) fires only when no order is derivable: `sweep`
    with multiple simultaneous inbox entries that mutually overlap serializes them deterministically (inbox
    filename order) and reports the chosen order with the overlapping paths named. Named test fixtures:
    (a) two plans overlapping on exactly the release slots → `init` with an explicit list order passes and
    preserves order; (b) disjoint plans pass freely; (c) two mutually-overlapping inbox entries in one
    `sweep` → deterministic serialization, overlap named in the output.
  - **Unparseable footprint** (a plan with no `Files:` lines) → refused unless an explicit position is given.
  - `add <plan>` writes **one new file** under `inbox/` (maildir-style; no ledger touch).
  - `sweep` moves inbox entries into the queue in dependency-safe order and deletes the inbox files.
  - `next` returns the first `queued` plan; `record --status landed --branch … --pr … --sha …` updates that
    entry **atomically** — assert temp+rename (no partial/corrupt ledger after a simulated interrupt; no stray
    temp files after success).
  - **Safety string-assertions on SKILL.md:** parse the full frontmatter block (never a single-line grep —
    [[frontmatter-tools-negation-check-single-line-only]]) and assert `disable-model-invocation: true`;
    scan `skills/war-campaign/**` for `ecc:` / `strategic-compact` and assert any hit is the single
    bundled-routine mention, never an external invocation (spec §12).
- [ ] **Step 2 — Implement `campaign-ledger.mjs` (GREEN).** Node stdlib only (`node:fs`, `node:path`) — no
  new dependency. Subcommands `init / add / sweep / next / record`. `Files:` extraction is **anchored,
  block-based** (red-team-proven on real fixtures; strictly single-line parsing truncates wrapped lists and
  is a bug): anchor `/^\s*(-\s+)?\*{0,2}Files?:\*{0,2}/` (the `s?` also matches the house singular
  `**File:**` form — silent-miss is the unsafe direction for a contention check; tolerates `**Files:**`
  bold, the spec §6.2 template's indented `- Files:` list form, and markdown links; no lazy quantifiers —
  [[regex-extract-live-code-lazy-quantifier-fragility]]), then **consume continuation lines until a blank
  line or a new construct** (heading, `**`, `- [ ]`). Token policy: strip parenthetical/em-dash annotation
  clauses from the joined block BEFORE comma-splitting — but **keep** a parenthetical whose content is
  exactly one backticked path-shaped token (the ``(`path`)`` bare-path form carries a real file); accept a
  backticked token only if **path-shaped**
  (contains `/` or a file extension; no spaces, no `<>` placeholders, not starting with `#`). Test fixtures
  from real plans: a wrapped `Files:` list (this plan's own T3 entry — assert the continuation file
  `campaign-ledger.test.mjs` is captured) and an annotated line (this plan's T5 entry — assert the footprint
  is exactly the 3 files, no `version`/`## Status` junk tokens). Atomic write = write temp file in the same
  dir + `rename`. Refusal messages name the overlapping paths.
- [ ] **Step 3 — Temp-break proof.** Disable the contention intersect (return empty overlap) → the refusal
  case flips **RED**; restore → GREEN.
- [ ] **Step 4 — SKILL.md.** Frontmatter: `name: war-campaign`, **`disable-model-invocation: true`** (the
  skill must never auto-trigger), description says it is explicitly-invoked-only. Body (spec §7 Rev 1):
  - **Invocation:** start (`/war-campaign <plan…|roadmap-path> [--wait-for-merge]` → `init`), bare resume
    (`/war-campaign` → latest unfinished campaign), `add <plan-path>` (from any chat → inbox drop only).
  - **Lifecycle per plan (§7.1):** sweep+select (helper `sweep` then `next`) → provision stack-and-plow
    (plan 1 `dev/<slug-1>` off fresh `origin/master`; plan N `dev/<slug-N>` off plan N-1's tip;
    `--wait-for-merge` → wait for PR N-1 to merge, base off fresh master — ADR 0011) → harden
    (`/red-team <plan>`, self-adjudicating under AFK) → execute (`/war <plan> --working dev/<slug-N>
    --landing dev/<slug-(N-1)> --afk --ace`; plan 1 lands to `master`) → `record` outcome → bundled
    **checkpoint-and-compact** (ledger already durable → built-in `/compact`; best-effort, resume is the
    guarantee) → loop.
  - **State & resume (§7.2):** ledger/inbox/roadmap-snapshot roles; resume = re-read ledger + inbox, then
    **reconcile toward git** (`git ls-remote`, `gh pr view`) before trusting the ledger (ADR 0008
    discipline); machine switch = render ledger → committable roadmap → `init` on the new machine
    (render/ingest is agent prose using the helper's read surface).
  - **Failure (§7.3):** halt-and-hold on can't-CLEAR or `/war` hard-halt (audit-blocked, conflict, dead
    phase, `land_stale`, `held:submodule-pr`): checkpoint → record stop point → `PushNotification` → stop;
    plans below the failure already landed as stacked PRs. Final report always states the **bottom-up merge
    order**.
- [ ] **Step 5 — Full self-discovering gate → green.** Commit —
  `feat(war-campaign): hopper skill — ledger+inbox feed, stack-and-plow, halt-and-hold; deterministic campaign-ledger core (ADR 0011)`.

### Task 4 — README: three companion sections + pipeline line

**Files:** `README.md` — sections only; **do not touch `## Status`** (T5 owns it). Anchor by construct
(existing section headings), never line numbers.

**`requiresTest`: false** — prose; grep-verify.

- [ ] **Step 1 — Three tight sections**, matching the house per-skill pattern (invocation block + one
  paragraph + design-notes link to the spec): `## Get oriented (/war-help)` (short — what the card prints);
  `## Author a plan (/war-strategy)` (templates + the code-boundary rule in one sentence; keep/refit the
  existing **Grill Me** pro-tip blockquote as the install anchor the skill's dep-check links to);
  `## Run a campaign (/war-campaign)` (invocation incl. `add` + `--wait-for-merge`; safety note — never
  auto-invokes, halt-and-hold, stacked PRs merged bottom-up; link ADR 0011 + spec §7).
- [ ] **Step 2 — Pipeline line.** Update the trilogy sentence to the full pipeline: `/war-strategy` authors →
  `/war-room` configures → `/red-team` hardens → `/war` executes → `/war-campaign` runs many; `/war-help`
  orients. Do not restate card content — link (dedup rule, spec §2).
- [ ] **Step 3 — Grep-verify + full gate green.** The Grill-Me anchor survives; three new headings present;
  `## Status` untouched. Commit — `docs(readme): companion-skill sections + pipeline line`.

---

## Phase 2 — Release v0.9.0

### Task 5 — Bump the four canonical version slots + register the three skills

**Files:** `.claude-plugin/plugin.json` (`version` **and** `skills` array),
`.claude-plugin/marketplace.json` (×2: `metadata.version`, `plugins[0].version`), `README.md` `## Status`
(REPLACE-in-place, no badge — [[release-bump-slots-canonical-no-badge]]).

**`requiresTest`: false** — version serialization.

- [ ] **Step 1 — plugin.json:** append `"./skills/war-help"`, `"./skills/war-strategy"`,
  `"./skills/war-campaign"` to `skills`; bump `version` `0.8.14 → 0.9.0`.
- [ ] **Step 2 — marketplace.json ×2 + README `## Status`** → `0.9.0`. Status copy: *WAR companion skills —
  `/war-help` orientation card, `/war-strategy` authoring primer (templates + code-boundary rule),
  `/war-campaign` hopper (ledger+inbox feed, stack-and-plow, halt-and-hold).* Verify all four slots by hand
  ([[version-slots-no-cross-slot-consistency-test]]).
- [ ] **Step 3 — Full self-discovering gate → green.** Commit —
  `chore(release): v0.9.0 — WAR companion skills (/war-help, /war-strategy, /war-campaign)`.

---

## Gate

Run the **full** self-discovering gate before **every** commit:

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

`campaign-ledger.test.mjs` and `war-strategy-structure.test.sh` are self-discovered — no gate edits. Run
**all** post-merge ([[gate-under-covers-after-cross-branch-merge-new-runner]]); count self-discovered, never
a literal ([[task-prompt-suite-count-stale-after-stacking]]).

## Coverage — spec §12 validation criteria → tasks

| Criterion (spec §12) | Task | Proof |
|---|---|---|
| war-help six sections; facts are links; footer names strategy+campaign | T1 | grep-verify step + auditor eyes |
| war-strategy templates + rule; dep-check warns w/ working install link | T2 | structure test + grep-verify |
| war-campaign `disable-model-invocation: true` | T3 | frontmatter-parse assertion in `.test.mjs` |
| ledger core: atomic record, init both sources, add→sweep, contention refusal, unparseable→explicit | T3 | `campaign-ledger.test.mjs` (TDD, temp-break proven) |
| inbox drop mid-run picked up at boundary; no committed file edited | T3 | sweep test + SKILL.md lifecycle prose |
| 2-plan AFK campaign → stacked branches/PRs + bottom-up merge order in report | — | integration behavior; ratify mechanics in `/red-team` (retarget-on-delete) |
| kill + re-invoke resumes from ledger | T3 | resume procedure + atomic-write tests |
| halt-and-hold; nothing above a failed plan starts | T3 | SKILL.md failure section |
| no external `ecc:`/`strategic-compact` invocation | T3 | scan assertion in `.test.mjs` |
| release: four slots + three skill dirs in plugin.json | T5 | by-hand slot verify + gate |

## Deliberate simplifications (ponytail)

- **Roadmap render/ingest = agent prose**, not helper subcommands — it's markdown authoring on demand, zero
  conflict risk; `init` is the only code path that reads a roadmap.
- **No war-help / README structure tests** — headings there are presentation, not contract; T2's templates
  and T3's safety invariants are the only prose worth locking.
- **No cross-machine live feed** — the inbox is local by design; machine switch = snapshot → `init`.
- **Helper is stdlib-only, no locking** — the ledger is single-writer by construction (only the Lead's
  `sweep`/`record` touch it; second chats get exactly one verb: `add` → inbox).
- **Deferred (spec §11):** `--keep-going`, stacked-PR merge poller, ECC `strategic-compact`
  detection/preference, any new grilling engine inside `/war-strategy`.
