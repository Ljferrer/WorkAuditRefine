---
name: war-machine
description: Convert design specs into merged implementation plans plus a campaign roadmap — the middle step of the WAR pipeline (survey → machine → campaign → aftermath). Consumes the freshest survey manifest (or explicit spec paths), runs a drafter + adversarial-grill agent pair per spec strictly serially, writes plans to docs/plans/ and a roadmap to docs/roadmaps/, stamps the manifest consumed, and prints the /war-campaign handoff — it never launches the campaign and never red-teams. Use when the user runs /war-machine, wants to turn design specs into implementation plans or a roadmap, or a fresh survey manifest is waiting to be consumed.
---

# /war-machine — specs → plans + roadmap

You convert war-shaped design specs (the input shape) into merged implementation plans, then bind
them into a campaign roadmap. You rely on `/war-strategy` for the merged plan + roadmap templates
and its with-artifact conversion doctrine ("Given a SPEC (the input shape): author the merged plan
into `docs/plans/` yourself") — consume [`skills/war-strategy/SKILL.md`](../war-strategy/SKILL.md)
§2 and §3 by reference, **never fork the templates**. You stop at plans + roadmap: `/war-campaign`
is a ~12+ hour human-launched commitment and is never auto-invoked.

**Merged-output directive.** Conversion emits the merged shape — one plan whose Part 1 is the
decision digest distilled from the source spec (citing the spec path; issue-derived claims keep
the `(verified: issue #N (<date>))` source form, D11) and whose Part 2 is the decomposed phases,
per the `/war-strategy` §2 merged plan template. The spec's assumption rows — its
`## Assumptions ledger` where it has one, otherwise its `[assumed: … — if wrong: …]` design-tree
entries and open-risk notes — are never dropped silently: each is carried forward
or retired with a stated reason (D19), in the plan's own ledger.

**Release-phase directive.** When a drafted plan carries a trailing release phase, the drafter
emits the **directive form**, never a resolved `v<semver>` literal: *"bump all four slots to the
next free patch above the live integration base at land time"* — stacked campaign plans advance
the base out from under any version string authored early, so a literal always lags the live tip.
The plan must also **state the expected integration base** it stacks on and the
**standalone-fallback rule** (a plan run through plain `/war` resolves the next free patch from the
four slots itself). Reference the four slots by the `/war-strategy` §2 next-free-patch convention
rather than restating a target semver.

**Guard-split deps-edge directive.** When a drafted task authors a **drift guard** over a fact
authored by a **different task in the same phase**, that guard task MUST carry
`deps: [<the fact-authoring task>]` — **same wave is insufficient**: every task worktree in a phase
is cut from one **frozen** phase base, so an unedged guard is implemented and audited against a base
that lacks the fact it guards, red by construction through no fault of its own diff. The grill agent
asks it of every drafted phase. Where no edge is possible — it would create a cycle, say — merge
the two tasks or move the guard a phase later; a split the drafter can neither edge nor resolve is
raised via the **ADR triad**, never silently shipped. Canonical record: the 2026-08-02 amendment to
[ADR 0025](../../docs/adr/0025-drift-guard-discipline.md), which `/war-strategy` §3 carries as its
authoring rule 7 (consumed here by reference, like the templates). Downstream, `/red-team`'s
`guard-split-deps-edge` spine probe flags an unedged split as a plan defect (`needsDecision`) and
grills it — adding the edge at drafting time is what keeps that off the campaign's critical path.

## Invocation

```
/war-machine [spec-paths…] [--afk]
```

## 1. Input selection precedence (three tiers, in order)

1. **Explicit paths.** Spec paths given on the invocation → use exactly those.
2. **Fresh survey manifest.** The latest `.claude/aot/*-survey.json` under the **main checkout**
   (path pattern `.claude/aot/YYYY-MM-DD-survey.json`) with `consumed: null` whose listed specs
   still exist; filter to specs with no corresponding plan. Non-empty → take exactly that list,
   no questions ("the survey just ran"). Resolve the main checkout via
   `git rev-parse --path-format=absolute --git-common-dir` — **never the invoking worktree's
   `.claude/`**.
3. **Fallback inference.** Scan `docs/specs/*.md` for specs no plan references. "References"
   must match the corpus, where nearly all plans cite specs by *relative* markdown link: match
   `docs/specs/<name>`, `../specs/<name>`, **or the spec's basename**. Even then, absence is a
   **hint, not proof** — at least one landed spec in this repo has zero plan references in any
   form — so present the inferred list for the operator to confirm and edit, **never
   auto-convert**. **`--afk` + no fresh manifest + no explicit paths → report the inferred list
   and exit without converting** (survey-first discipline: unattended conversion is gated on a
   manifest or explicit args; asking would stall the cron, guessing would convert
   already-implemented specs).

## 2. Per spec — strictly serial

One spec at a time — never a batch — so each successive plan's roadmap contention row can see the
file footprints of the plans already authored (honest contention).

1. **Spawn in parallel:** a **drafter** agent (authors the merged-shape plan from the spec +
   codebase, per the `/war-strategy` §2 merged plan template and code-boundary decomposition
   rule) and an **adversarial grill** agent (runs
   [`plan-interview.md`](../war-strategy/references/plan-interview.md)'s falsifier probes +
   provenance scan against the draft; any behavioral claim about the repo — what a function
   ingests, what a command emits — is proven by executing it in a throwaway sandbox, never by
   analysis alone). **Fresh context per spec** — ten specs never share one bloated window.
2. The drafter answers the grill's questions from the spec + codebase. Questions that survive
   unresolved are classified by the **ADR triad** — raised to the operator only if **hard to
   reverse**, **surprising without context**, or a **genuine trade-off**. Everything else is
   self-decided and logged in the plan's `## Notes / conscious deviations` (ratified later by
   `/red-team`, which the campaign runs per plan — `/war-machine` never red-teams).
3. **Interactive:** one `AskUserQuestion` volley per spec — the drafted `## Commander's Intent`
   echo-back confirm (mandatory, per ADR 0013) plus the triad survivors.
   When invoked with `--afk`, read [references/afk-conversion.md](references/afk-conversion.md).
4. **Write the plan** to `docs/plans/YYYY-MM-DD-<slug>.md` (**no `-plan` suffix** — matching the
   entire existing corpus). The Part 1 digest cites the source spec path — provenance for the
   decision record (a merged plan is its own source of truth for `/red-team` step 1's merged
   arm; the citation is evidence, not a routing hook) and the third link in `/aftermath`'s
   swept-issue evidence chain (issue → spec → plan → PR).
5. **Lint the finalized plan** — run `node skills/war-strategy/assets/plan-literal-lint.mjs <plan>`
   on the plan just written and **surface its advisory hits in the conversion report**: stack-fragile
   literals (`:N-M` locators, `*.test.sh` gate lists, suite counts, release-version literals) and
   **un-backticked `- Files:` paths** (the campaign ledger reads backticked tokens). Report-only — it
   **never blocks** conversion (exit 0 by default; `/war-strategy` §2 owns the rule set).

## 3. After the last spec

1. **Author the roadmap** at `docs/roadmaps/YYYY-MM-DD-<slug>-roadmap.md` per the `/war-strategy`
   roadmap template: dependency spine from the manifest's `dependsOn` hints firmed up by the
   actual plan `Files:` footprints; shared-file contention table from those same footprints. The
   **plan-index table MUST be the first table in the document** — auxiliary tables (the
   issue→spec→plan chain, shared-file contention) come after it, because `/war-campaign`'s campaign
   ledger ingests **only the first table** (`init --roadmap`); a chain or contention table placed
   first would be ingested as the plan index instead of the real plans.
2. **Stamp the manifest consumed** — consumed-stamp semantics: replace `consumed: null` with
   `{ "by": "war-machine", "at": "<ISO 8601>", "plans": { "<spec path>": "<plan path>" } }`.
   Consumed manifests are **retained, never deleted** — `/aftermath` reads the
   issue↔spec↔plan chain to close swept issues later.
3. **`--afk` closing commit:** close with **one commit of the pipeline artifacts** — the specs it
   consumed, its plans, the roadmap — onto the current branch (operator-ratified). `/war` refuses
   a dirty tree, so an unattended sequence must not leave them uncommitted. **Interactive runs
   commit nothing** — leave the tree for operator review.

## 4. Handoff — print and stop

```
/war-campaign docs/roadmaps/<date>-<slug>-roadmap.md
```

The roadmap is authoring input + an on-demand committable snapshot — **never the live queue**
(that is the campaign ledger; `/war-strategy` §2 rev 1 note). Remind the operator: the campaign
runs `/red-team` per plan before executing it; anyone running a plan through standalone `/war`
must red-team it manually. Then **stop** — never launch the campaign.
