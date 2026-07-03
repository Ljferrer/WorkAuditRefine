# WAR pipeline skills — `/war-survey-corps`, `/war-machine`, `/war-aftermath`

Turn the README Pro Tip's three prose commands into war-native skills, bracketing the existing
`/war-campaign`, so the full issues→specs→plans→campaign→cleanup pipeline is four slash commands.

## 1. Context — the gap / problem

The README `### Pro Tip` section is the de-facto WAR outer loop, but three of its four steps are
copy-paste prose the operator re-types every time:

1. a free-form "spin up a workflow to inspect open issues → synthesize design specs" prompt,
2. a free-form `/loop` + `/grill-with-docs` prompt to convert specs into plans,
3. `/war-campaign` (already a skill — the only step that is one),
4. a free-form "clean up any stray branches and issues" prompt.

Prose steps drift, aren't discoverable, and can't be scheduled. Step 4's pain is documented: in the
"War room preset for Fable" session the operator had to paste a ~20-branch `git branch -a -vv` dump
of stale `claude/*` session branches and `.claude/worktrees/` directories and drive their deletion
by hand across three prompts, because no skill owned cleanup beyond a single run's teardown.

This spec defines three new skills — `/war-survey-corps` (issues → specs), `/war-machine`
(specs → plans + roadmap), `/war-aftermath` (evidence-gated cleanup) — and the small doctrine
amendment (`## AI-Commander's Intent`) that makes the middle step schedulable.

## 2. Pivotal constraints

- **`/war-campaign` never auto-invokes** (`disable-model-invocation: true`; a campaign is a ~12+
  hour commitment). `/war-machine` therefore stops at plans and *prints* the campaign command.
- **Commander's Intent doctrine (ADR 0013)**: staff-drafted, commander-confirmed, never
  Lead-invented. This spec adds exactly **one** sanctioned exception — the provenance-marked
  `## AI-Commander's Intent` heading emitted only by `/war-machine --afk` — and amends every
  surface that states the old absolute.
- **AFK doctrine**: `--afk` means self-adjudicate and escalate only the unresolvable; for a
  list-processing skill "escalate" means *skip the item and report it*, never stall.
- **Evidence-gated destruction**: nothing is deleted or closed without a checkable chain
  (`git merge-base --is-ancestor` against `git ls-remote` truth, `gh pr view` MERGED state) —
  the same git-wins precedence the resume doctrine already uses.
- **Uncommitted cross-session state lives under the MAIN checkout's `.claude/`**, never in git
  (precedent: campaign ledger + inbox). The survey manifest follows:
  `<main-checkout>/.claude/aot/YYYY-MM-DD-survey.json`. The anchor matters: sessions here run in
  per-session git worktrees that each carry their *own* `.claude/`, so a cwd-relative path would
  strand the manifest in whichever worktree wrote it (and a scorched-earth worktree removal could
  delete it). All three skills resolve the anchor from any linked worktree via
  `git rev-parse --path-format=absolute --git-common-dir` (the main `.git`'s parent).
- **No silent caps**: every swept issue is accounted for in the survey's closing coverage report —
  mapped to a spec or explicitly deferred with a reason.
- **Code-boundary decomposition** governs all plan/roadmap authoring; the templates and the rule
  stay owned by `/war-strategy` — the new skills consume them, never fork them.
- **Teardown ordering**: worktrees are reaped **by path before** their branches are deleted
  (established WAR teardown discipline).

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Where does `/war-machine` stop? | At plans + roadmap. Prints a ready-to-paste `/war-campaign <roadmap>` handoff; never launches it. |
| 2 | Survey→machine handoff | Uncommitted **survey manifest** at `.claude/aot/YYYY-MM-DD-survey.json` (specs created, issues each addresses, ordering hints). Fallback when absent/stale: infer unimplemented specs (no plan references it), present the guess, ask. |
| 3 | Which issues does the survey sweep? | All open issues **except** run-bookkeeping labels (`phase:*`, `status:*`, `task`, `run:*`, legacy `coven`). `war-followup` issues explicitly **included**. |
| 4 | Survey output shape | Specs + manifest only (manifest carries `dependsOn` ordering hints). The **roadmap is authored by `/war-machine`**, once real plan file-footprints exist. |
| 5 | Survey autonomy | Fully autonomous; ends with an every-issue-accounted-for coverage report. Writes specs to the working tree, **never commits** (the autonomous path's commit belongs to `/war-machine --afk` — §4.2). Optional `--erwin` flag = pause after clustering for group approval (the commander reviews the battle plan). |
| 6 | What `/war-machine` raises to the human | The **ADR triad** (hard to reverse / surprising without context / real trade-off) + one **mandatory** raise per plan: the Commander's Intent echo-back confirm. Everything else self-decided and logged in `## Notes / conscious deviations` (ratified later by `/red-team`). One `AskUserQuestion` volley per spec. |
| 7 | `/war-machine` execution shape | Lead-driven **serial** iteration (the `/loop` spirit, no scheduler). Per spec: a drafter agent + an adversarial grill agent in parallel (fresh context per spec); strictly one spec at a time so sibling plans see each other's file footprints (honest contention). |
| 8 | `/war-aftermath` scope + model | Four evidence-gated classes (stray WAR branches, orphaned run worktrees, WAR bookkeeping issues, survey-swept issues whose fix landed). Report → one confirm → execute safe list; `--afk` skips the confirm but executes only the provably-safe class. |
| 9 | `--scorched-earth` | Widens candidates to **all** local branches + worktrees, lowers the bar to force-delete (⚠-flagged unmerged rows). A non-negotiable **protected core** survives even `--scorched-earth --afk`. The combo is documented as **dangerously destructive**. |
| 10 | `/war-machine --afk` and intent | Triad decisions self-adjudicated → deviations log. Emits **`## AI-Commander's Intent`** — the *only* sanctioned Lead-invented intent — after checking it against predecessor intent blocks in `docs/plans/`; divergence is recorded, never silently shipped. |
| 11 | Packaging | Only `/war-aftermath` is `disable-model-invocation: true`. Version bump **+0.1.0** (relative, not a literal) across the four canonical slots. README Pro Tip rewritten to the four-command sequence; `/war-help` card +3 rows; `war-strategy` §5 closing offer points at `/war-survey-corps`; CONTEXT.md + ADR surfaces amended. |

## 4. Mechanics

### 4.0 The streamlined Pro Tip (target state)

```
/war-survey-corps                                   # open issues → grouped design specs + survey manifest
/war-machine                                        # specs → implementation plans + roadmap (interviews you lightly)
/war-campaign docs/roadmaps/<date>-<slug>-roadmap.md
/war-aftermath                                      # evidence-gated cleanup of branches, worktrees, issues
```

Every step has an autonomous mode — `/war-machine --afk`, `/war-campaign` (unattended by default:
it passes `--afk --ace` to each `/war` itself; there are no operator `--afk`/`--ace` flags on its
own invocation), `/war-aftermath --afk` — so the sequence remains cron-able end to end. The
clean-tree prerequisite is owned by `/war-machine --afk`'s closing commit (§4.2): `/war` refuses
a dirty tree, so the autonomous path cannot leave specs/plans/roadmap uncommitted. The README
keeps the `### Pro Tip` heading; the body is replaced.

### 4.1 `/war-survey-corps` — issues → specs

An `Agent` + `Workflow` skill (the SKILL.md authorizes the Workflow tool, like `/red-team` and
`/lessons-learned`). Model-invocable.

**Invocation:** `/war-survey-corps [--erwin]`

1. **Sweep.** `gh issue list --state open` on the current repo; drop issues carrying any
   run-bookkeeping label (`phase:*`, `status:*`, `task`, `run:*`, `coven`). `war-followup` issues
   are first-class input — they are WAR's own deferred debt getting its shot at becoming spec'd
   work. Zero issues after the filter → report "nothing to survey" and stop (no empty specs).
2. **Fan out readers.** One agent per issue (or small batch): read body + comments + the code the
   issue touches; return a structured summary (theme, affected files, severity, staleness signals).
3. **Cluster (barrier).** Grouping genuinely needs all summaries at once: cluster issues into
   coherent groups by theme/subsystem/file family, honoring code-boundary thinking one level up
   (groups that would fight over the same files should either merge or carry an ordering edge).
   - **`--erwin`**: present the proposed groups and wait for approval before synthesizing
     (bare invoke skips this gate — the flag makes the survey un-cronable by design).
4. **Synthesize specs.** Per group, one agent authors a war-shaped design spec using the
   `/war-strategy` spec template (§2 of its SKILL.md), written to
   `docs/specs/YYYY-MM-DD-<slug>-design.md`. Each spec lists the issue numbers it addresses.
5. **Completeness critic.** A final agent verifies every swept issue is claimed by exactly one
   spec or explicitly deferred with a reason (an issue that is actually a question, `wontfix`-
   shaped, or already fixed). Strays are flagged, never dropped.
6. **Manifest + report.** Write the survey manifest (schema below) and print the coverage report:
   every swept issue → its spec, or its `deferred: <why>` row. Specs are written to the working
   tree; the operator reviews and commits.

**Survey manifest** — `.claude/aot/YYYY-MM-DD-survey.json` under the **main checkout** (§2
anchor — never the invoking worktree's `.claude/`), uncommitted, latest-wins (a same-day re-run
overwrites — a re-survey supersedes its predecessor):

```json
{
  "createdAt": "<ISO 8601>",
  "surveyed": [412, 415, 444],
  "specs": [
    { "path": "docs/specs/2026-07-02-<slug>-design.md",
      "title": "<one line>",
      "issues": [412, 415],
      "dependsOn": ["docs/specs/<sibling>.md"] }
  ],
  "deferred": [ { "issue": 444, "why": "<reason>" } ],
  "consumed": null
}
```

`dependsOn` is the survey's ordering hint (which clusters build on which); `/war-machine` firms it
up into the roadmap's dependency spine. `consumed` is stamped by `/war-machine`
(`{ "by": "war-machine", "at": "<ISO 8601>", "plans": { "<spec path>": "<plan path>" } }`) —
consumed manifests are **retained, never deleted**: `/war-aftermath` needs the issue↔spec↔plan
chain to close swept issues later.

### 4.2 `/war-machine` — specs → plans + roadmap

Relies on `/war-strategy` for the plan + roadmap templates and its with-artifact conversion
doctrine ("Given a SPEC: author the war-shaped plan into `docs/plans/` yourself"). Model-invocable.

**Invocation:** `/war-machine [spec-paths…] [--afk]`

**Input selection precedence:**
1. **Explicit paths** given → use exactly those.
2. **Fresh survey manifest** — the latest `.claude/aot/*-survey.json` (main-checkout anchor, §2)
   with `consumed: null` whose listed specs still exist; filter to specs with no corresponding
   plan. Non-empty → take exactly that list, no questions ("the survey just ran").
3. **Fallback inference** — scan `docs/specs/*.md` for specs no plan references. "References"
   must match the corpus, where nearly all plans cite specs by *relative* markdown link: match
   `docs/specs/<name>`, `../specs/<name>`, **or the spec's basename**. Even then, absence is a
   **hint, not proof** — at least one landed spec in this repo has zero plan references in any
   form — so the inferred list is presented for the operator to confirm and edit, never
   auto-converted. **`--afk` + no fresh manifest + no explicit paths → report the inferred list
   and exit without converting** (survey-first discipline: unattended conversion is gated on a
   manifest or explicit args; asking would stall the cron, guessing would convert
   already-implemented specs).

**Per spec (strictly serial — one at a time, so each successive plan's roadmap contention row can
see the file footprints of the plans already authored):**

1. Spawn in parallel: a **drafter** agent (authors the war-shaped plan from the spec + codebase,
   per the `/war-strategy` plan template and code-boundary rule) and an **adversarial grill**
   agent (asks the full question tree `grill-with-docs` would have asked the operator). Fresh
   context per spec — ten specs never share one bloated window.
2. The drafter answers the grill's questions from the spec + codebase. Questions that survive
   unresolved are classified by the **ADR triad**: raised to the operator only if hard to
   reverse, surprising without context, or a genuine trade-off. Everything else is self-decided
   and logged in the plan's `## Notes / conscious deviations` (ratified later by `/red-team`,
   which the campaign runs per plan — `/war-machine` never red-teams).
3. **Interactive:** one `AskUserQuestion` volley per spec — the drafted `## Commander's Intent`
   echo-back confirm (mandatory, per ADR 0013) plus the triad survivors.
   **`--afk`:** triad survivors are self-adjudicated into the deviations log. The plan carries
   **`## AI-Commander's Intent`** instead — the one sanctioned Lead-invented intent block,
   provenance marked by the heading itself. Before committing to it, the machine reads prior
   intent blocks (`## Commander's Intent` / `## AI-Commander's Intent` across `docs/plans/*.md`)
   and checks the synthetic intent is in line with its predecessors (tone, scope, standing
   constraints); a divergence is recorded in the deviations log, never silently shipped. A spec
   that cannot be converted without an operator decision is **skipped and reported**, not stalled on.
4. Write the plan to `docs/plans/YYYY-MM-DD-<slug>.md` (no `-plan` suffix — matching the entire
   existing corpus). Each plan cites its source spec path near the top (the `docs/specs/…` link
   `/red-team` step 1 greps for — and the third link in the aftermath evidence chain).

**After the last spec:** author the roadmap (`docs/roadmaps/YYYY-MM-DD-<slug>-roadmap.md`, per the
`/war-strategy` roadmap template) — dependency spine from manifest `dependsOn` hints + actual plan
`Files:` footprints; shared-file contention table from those same footprints. Stamp the manifest
`consumed`. **Under `--afk`, close with one commit of the pipeline artifacts** (the specs it
consumed, its plans, the roadmap) onto the current branch — `/war` refuses a dirty tree, so an
unattended sequence must not leave them uncommitted; interactive runs leave the tree for operator
review instead. Print the handoff and stop:

```
/war-campaign docs/roadmaps/<date>-<slug>-roadmap.md
```

**Upgrade path:** an `--afk` plan later getting a human pass runs `/war-strategy <plan>` to replace
`## AI-Commander's Intent` with an interviewed, operator-confirmed `## Commander's Intent`.

### 4.3 `/war-aftermath` — evidence-gated cleanup

`disable-model-invocation: true` — a deleting verb must never fire because a sentence
pattern-matched.

**Invocation:** `/war-aftermath [--afk] [--scorched-earth]`

**Default scope — four classes, each with a checkable evidence chain:**

| Class | Candidates | Evidence gate |
|---|---|---|
| Stray WAR branches | `integration/<plan-slug>/phase-N`, task branches; working branches with merged PRs | Tip reachable from the working/landing branch (`git merge-base --is-ancestor` against `git ls-remote` truth); `gh pr view` = `MERGED` |
| Orphaned run worktrees | `<worktreeRoot>/<runId>/` dirs incl. `_refinery`, `_polish` — **landed runs only** | Run ledger says landed **and** the landed SHA is reachable on the working/landing branch (`git ls-remote` truth — the ledger alone is the weakest authority); reaped **by path before** any branch delete. **Dead runs** (`held:phase-incomplete` / `held:workflow-error`) are **needs-human rows, never in the safe list**: doctrine preserves a dead phase's git state for resume or inspection. Only `--scorched-earth` may burn them, ⚠-flagged |
| WAR bookkeeping issues | Phase epics `status:done` still open; task sub-issues of landed phases | Label state + the phase's landed SHA reachable |
| Survey-swept issues | Issues mapped in a survey manifest whose spec's plan's PR **merged** | Chain: issue → spec (manifest) → plan (its source-spec line) → PR (campaign ledger PR#, or `gh pr list --search`) = `MERGED`; close with a comment linking the landing PR |

**Out of scope by default:** anything referenced by an *active* run/campaign ledger (checked
first), unmerged branches (reported, never deleted), issues with no evidence chain.

**"Active" is a defined predicate, not a vibe** — the campaign ledger has no campaign-level
terminal marker, so: a campaign ledger is *active* iff any plan entry is non-terminal
(`status: "queued"`, or a recorded `stopPoint` with `status ≠ "landed"`), reconciled toward git
before being trusted (a "queued" entry whose branch/PR git shows landed is not evidence of life).
The implementation may add a campaign-level terminal marker to the ledger instead; either way the
predicate must be stated, not improvised.

**Class-4 join rule:** the campaign ledger records plan paths as *absolute* paths resolved against
the campaign Lead's cwd (routinely a session worktree that may no longer exist), while the
manifest records repo-relative paths — so the manifest→ledger join matches by plan
**basename/slug**, never full path; `gh pr list --search "<plan filename>"` is the sanctioned
fallback when no ledger entry matches.

**Interaction model:** always produce the categorized dry-run report first — safe-to-delete rows
with their evidence, vs. needs-human rows. Interactive: one confirm, then execute the safe list
only. `--afk`: skip the confirm, execute only the provably-safe class, report the rest.

**`--scorched-earth`** widens the candidate set and lowers the evidence bar:

- **Candidates:** *every* local branch and worktree — `claude/*` session branches, `feat/*`,
  stale `dev/*`, and their `.claude/worktrees/` directories — not just WAR namespaces.
- **Bar:** force-delete (`git branch -D`, `git worktree remove --force`) even when the upstream is
  gone or commits are unmerged; unmerged-commit rows are ⚠-flagged in the report, not skipped.
- **Protected core (survives even `--scorched-earth --afk`; correctness, not preference):** the
  current branch + worktree, the default branch, any worktree belonging to a running session, and
  anything referenced by an active run/campaign ledger. Survey manifests under `.claude/aot/` are
  never deleted — an invariant the §2 main-checkout anchor makes structural (pipeline state never
  lives inside a removable session worktree's `.claude/`).
- Interactively, scorched-earth still goes through report → one confirm. **`--afk
  --scorched-earth` is documented — in the SKILL.md and the README — as a dangerously destructive
  combo** (unmerged work is deleted with no human review), and the skill prints a loud warning
  banner before proceeding.

### 4.4 Downstream doctrine change — recognizing `## AI-Commander's Intent`

Today `skills/war/SKILL.md`'s plan-read step extracts `## Commander's Intent` **verbatim** and
states "`--afk`: `intent = null` … The Lead **never** invents intent (ADR 0013)". An unrecognized
heading is treated as a *missing section*: interactive runs ask at the approval gate; `--afk`
runs silently degrade to `intent = null`. The heading literal lives on **five** surfaces — two
executable, three doctrine mirrors — and all five change (plus one comment touch-up):

- **`skills/war/SKILL.md`** (plan-read/intent-extraction step — executable): extract *either*
  heading verbatim into `args.intent`; the never-invents sentence gains the pointer to the
  amended doctrine (the Lead still never invents intent — `/war-machine --afk` is the sole
  authoring surface allowed to).
- **`skills/red-team/assets/workflow-scaffold.js`** (the `intent-vs-plan` probe prompt —
  executable): hardcodes the single heading in both its positive and negative branches; as
  written it would judge an `## AI-Commander's Intent` plan as having *no* intent section. Both
  branches recognize either heading.
- **`skills/red-team/references/lenses.md`** (`intent-vs-plan` prose lens): judges either
  heading; an `## AI-Commander's Intent` block is treated as intent present (its End-state
  conditions individually checkable etc.), with a Minor note recommending the human upgrade path.
- **`skills/war/references/schemas.md`** (the `args.intent` contract): currently states the old
  absolute verbatim ("never Lead-invented; missing section → `null`") against the single heading
  — amended to name both headings and the sanctioned exception.
- **`skills/war/references/design.md`** (the intent-threading bullet): same single-heading
  contract pin — amended likewise.
- **`skills/war/assets/workflow-template.js`**: **no functional change** (it consumes the
  `args.intent` string), but its contract *comments* name the single heading — updated to name
  either, so the comments don't assert a superseded contract.
- **`CONTEXT.md`**: the Commander's Intent entry gains the exception; new terms below.
- **ADR 0013**: amended (status note + link) by the new ADR (§7).

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war-survey-corps/SKILL.md` | new — §4.1 (+ `assets/` workflow scaffold if the implementation wants one) |
| `skills/war-machine/SKILL.md` | new — §4.2 |
| `skills/war-aftermath/SKILL.md` | new — §4.3, `disable-model-invocation: true` |
| `.claude-plugin/plugin.json` | register the three skills; version +0.1.0 |
| `.claude-plugin/marketplace.json` | version +0.1.0 (both fields) |
| `README.md` | Pro Tip body → the four-command sequence (§4.0) + the `--afk --scorched-earth` danger callout; `## Status` slot per release convention |
| `skills/war-help/SKILL.md` | command table +3 rows |
| `skills/war-strategy/SKILL.md` | §5 closing offer → point at `/war-survey-corps` instead of narrating the manual pattern |
| `skills/war/SKILL.md` | intent-extraction step recognizes both headings (§4.4) |
| `skills/red-team/assets/workflow-scaffold.js` | `intent-vs-plan` probe prompt recognizes both headings, both branches (§4.4) |
| `skills/red-team/references/lenses.md` | `intent-vs-plan` lens recognizes both headings (§4.4) |
| `skills/war/references/schemas.md` | `args.intent` contract names both headings + the exception (§4.4) |
| `skills/war/references/design.md` | intent-threading bullet names both headings (§4.4) |
| `skills/war/assets/workflow-template.js` | contract comments only — no functional change (§4.4) |
| `CONTEXT.md` | new terms (§6); amend Commander's Intent entry |
| `docs/adr/0013-commanders-intent-and-disposition-routing.md` | status note linking the amending ADR |
| `docs/adr/00XX-ai-commanders-intent…md` | new ADR (§7) |
| new structure test(s) | per repo convention (`war-strategy-structure.test.sh` style) asserting the load-bearing tokens of §10 |

Version literals are deliberately absent: the bump is **+0.1.0 relative to the version at land
time** — the operator's target at release adjudication is authoritative, and this repo has learned
that stacked plans with hardcoded version literals go stale.

## 6. New domain terms (CONTEXT.md)

- **Survey manifest** — the uncommitted record a survey run leaves at
  `.claude/aot/YYYY-MM-DD-survey.json`: the specs it created, the issues each addresses, ordering
  hints, and a consumed stamp. The cross-session handoff from `/war-survey-corps` to
  `/war-machine`, and the first link in `/war-aftermath`'s swept-issue evidence chain. Retained
  after consumption; never committed. *Avoid:* survey ledger, spec index.
- **AI-Commander's Intent** — the provenance-marked intent heading (`## AI-Commander's Intent`)
  emitted only by `/war-machine --afk`: the **single sanctioned exception** to "the Lead never
  invents intent," checked against predecessor intent blocks before being committed to, and
  readable downstream exactly like operator intent. The heading *is* the provenance record.
  *Avoid:* synthetic intent (as a config value); treating it as operator-confirmed.
- **Scorched-earth sweep** — `/war-aftermath`'s opt-in widened mode: every local branch and
  worktree is a candidate and unmerged work is force-deleted after ⚠-flagging. Only the protected
  core is exempt. *Avoid:* deep clean, full cleanup (neither names the force-delete semantics).
- **Protected core** — the set no aftermath mode may touch: the current branch + worktree, the
  default branch, running sessions' worktrees, and anything referenced by an active run/campaign
  ledger. Correctness, not preference — deleting these breaks live state. *Avoid:* exclusion
  list, denylist (both sound configurable; the core is not).
- **Commander's Intent** *(amended)* — add: the one exception to never-Lead-invented is the
  **AI-Commander's Intent** block `/war-machine --afk` authors, marked by its own heading.

## 7. Recommended ADRs

One: **"AI-Commander's Intent — the sanctioned synthetic-intent exception"** (amends ADR 0013).
Records the trade-off: an un-cronable pipeline (intent requires a human) vs. Lead-invented intent
(doctrine violation) — resolved by a provenance-marked heading that keeps downstream consumers
(`/war`, `/red-team`, auditors, post-mortems) able to *see* the intent was synthetic, plus the
predecessor-consistency check bounding what a synthetic intent may claim. Hard to reverse (plans
in the wild carry the heading), surprising without context, a real trade-off — all three ADR
criteria hold.

The trio's pipeline shape (bracketing `/war-campaign`) is deliberately **not** an ADR: it is
restatable from the README and easily reversible.

## 8. Open risks / implementation notes

- **"Running session" detection** (protected core) has no clean disk signal. Layered, in
  descending trust: the current process's own worktree (the floor); the per-worktree transcript
  project dir (`~/.claude/projects/<munged-worktree-path>`) with mtime inside a recency window —
  the primary liveness signal (dir *existence* is no signal; dirs outlive their worktrees).
  Uncommitted changes in a worktree are **not** a liveness signal (live session worktrees are
  routinely clean) — they are an unmerged-*work* flag: data-loss protection, ⚠-flagged
  regardless of liveness. Resolve the exact mtime window at plan time; `/red-team` should probe it.
- **Manifest consumed ≠ deleted** — aftermath's swept-issue closure reads consumed manifests;
  nothing in the pipeline (including scorched-earth) may delete `.claude/aot/`.
- **The evidence chain depends on the plan citing its source spec** — `/war-machine` must emit the
  `docs/specs/…` reference in every plan it authors (also what `/red-team` step 1 greps for).
  A hand-authored plan without the line simply never participates in swept-issue closure.
- **Same-day survey collision**: `YYYY-MM-DD-survey.json` overwrites on a same-day re-run —
  intended (a re-survey supersedes), but the SKILL.md should say so.
- **Heading-recognition must be complete**: any *other* current or future surface that extracts
  intent by heading must accept both forms; §4.4 enumerates today's five surfaces (two executable:
  the war SKILL.md extraction step and the red-team scaffold probe; three doctrine mirrors:
  lenses.md, schemas.md, design.md — plus workflow-template.js's comments). The structure test
  should pin all of them; a fresh grep for the heading literal at implementation time guards
  against surfaces added since this spec.
- **`--erwin` makes a survey un-cronable** — by design; document it next to the flag.
- **Roadmap staleness**: the machine-authored roadmap is an authoring input + snapshot, never the
  live queue (campaign-ledger doctrine, rev 1 note in `/war-strategy`); the handoff print should
  not imply otherwise.
- **Issue-close comments are outward-facing** — aftermath closing swept issues posts comments;
  under `--afk` this happens unattended, which is accepted (evidence-gated) but worth stating in
  the SKILL.md so operators know closes are visible to watchers.

## 9. Non-goals / deferred

- **No auto-invocation of `/war-campaign`** — the trio brackets it; the human (or their cron
  entry) launches it.
- **`/war-machine` does not run `/red-team`** — the campaign hardens each plan before execution;
  the handoff print reminds standalone `/war` users to red-team manually.
- **No background pollers or daemons** — the survey manifest is a passive file; aftermath runs
  when invoked.
- **No remote scorched-earth** — remote branch deletion stays in the default evidence-gated scope
  (merged-PR head branches); scorched-earth widens *local* candidates only.
- **The Recommended Auxiliary Plugins section is untouched** — Grill Me stays required
  (`/war-strategy`'s handoff and the grill agent's question-tree emulation both lean on it).
- **No new committed state** — the manifest is uncommitted by design; specs/plans/roadmaps are
  ordinary files committed by the operator (interactive) or by `/war-machine --afk`'s closing
  commit (autonomous — §4.2).
- **No `--erwin` equivalent for `/war-machine`** — its interactive mode already *is* the gated
  mode; the flag exists only where the default is fully autonomous.

## 10. Validation criteria

1. `plugin.json` lists all ten skill dirs (seven existing + three new); each new
   `skills/<name>/SKILL.md` exists with frontmatter `name:` matching its directory.
2. `war-aftermath` frontmatter contains `disable-model-invocation: true`; `war-survey-corps` and
   `war-machine` do not (checked against both single-line and YAML-block frontmatter forms).
3. `skills/war-aftermath/SKILL.md` **and** `README.md` both contain a "dangerously destructive"
   callout tied to the `--afk` + `--scorched-earth` combination.
4. All five §4.4 heading surfaces name both `## Commander's Intent` and `## AI-Commander's
   Intent`: `skills/war/SKILL.md` (extraction step), `skills/red-team/assets/workflow-scaffold.js`
   (probe prompt, both branches), `skills/red-team/references/lenses.md`,
   `skills/war/references/schemas.md`, `skills/war/references/design.md` — and
   `skills/war/assets/workflow-template.js`'s contract comments no longer assert the
   single-heading contract.
5. `CONTEXT.md` defines Survey manifest, AI-Commander's Intent, Scorched-earth sweep, and
   Protected core; its Commander's Intent entry names the `--afk` exception.
6. The README `### Pro Tip` section contains the four commands in pipeline order and none of the
   three replaced prose blocks.
7. The `/war-help` command table has one row per new skill (ten commands total on the card's map,
   counting `/war-help` itself).
8. `skills/war-strategy/SKILL.md` §5 references `/war-survey-corps` (not the manual
   spin-up-a-workflow narration).
9. Both `war-survey-corps` and `war-machine` SKILL.md documents state the manifest path pattern
   `.claude/aot/YYYY-MM-DD-survey.json` **and** the main-checkout anchor rule (resolved via
   `git rev-parse --path-format=absolute --git-common-dir`, never the invoking worktree);
   `war-machine`'s states the selection precedence (explicit args → fresh manifest → infer + ask)
   and the consumed-stamp semantics.
10. `war-machine` SKILL.md contains the predecessor-consistency instruction (read prior
    `docs/plans/*.md` intent blocks before committing an AI-Commander's Intent), the
    skip-and-report rule for unconvertible specs under `--afk`, the `--afk` no-fresh-manifest
    rule (report the inferred list, exit without converting), and the `--afk` closing commit of
    pipeline artifacts.
11. The new ADR exists; ADR 0013 carries a status note linking it.
12. Version bumped +0.1.0 from the pre-land version across all four canonical slots
    (`plugin.json`, `marketplace.json` ×2, README `## Status`) — verified by hand; no cross-slot
    test exists.
13. A structure test (repo `*.test.sh` convention) asserts the greppable tokens behind criteria
    2, 3, 4, 9, and 10, and runs green.
14. `war-aftermath` SKILL.md routes dead runs (`held:phase-incomplete` / `held:workflow-error`)
    to needs-human (git state preserved for resume/inspection — never auto-deleted, never under
    `--afk`) and states the active-campaign predicate (any non-terminal plan entry, reconciled
    toward git) verbatim enough to grep.
