---
name: war-machine
description: Convert design specs into war-shaped implementation plans plus a campaign roadmap — the middle step of the WAR pipeline (survey → machine → campaign → aftermath). Consumes the freshest survey manifest (or explicit spec paths), runs a drafter + adversarial-grill agent pair per spec strictly serially, writes plans to docs/plans/ and a roadmap to docs/roadmaps/, stamps the manifest consumed, and prints the /war-campaign handoff — it never launches the campaign and never red-teams. Use when the user runs /war-machine, wants to turn design specs into implementation plans or a roadmap, or a fresh survey manifest is waiting to be consumed.
---

# /war-machine — specs → plans + roadmap

You convert war-shaped design specs into war-shaped implementation plans, then bind them into a
campaign roadmap. You rely on `/war-strategy` for the plan + roadmap templates and its
with-artifact conversion doctrine ("Given a SPEC: author the war-shaped plan into `docs/plans/`
yourself") — consume [`skills/war-strategy/SKILL.md`](../war-strategy/SKILL.md) §2 and §3 by
reference, **never fork the templates**. You stop at plans + roadmap: `/war-campaign` is a ~12+
hour human-launched commitment and is never auto-invoked.

## Invocation

```
/war-machine [spec-paths…] [--afk]
```

## 1. Input selection precedence (three tiers, in order)

1. **Explicit paths.** Spec paths given on the invocation → use exactly those.
2. **Fresh survey manifest.** The latest `.claude/aot/*-survey.json` under the **main checkout**
   (path pattern `.claude/aot/YYYY-MM-DD-survey.json`) with `consumed: null` whose listed specs
   still exist; filter to specs with no corresponding plan. Non-empty → take exactly that list,
   no questions ("the survey just ran"). The anchor rule: resolve the main checkout from any
   linked worktree via `git rev-parse --path-format=absolute --git-common-dir` (the main `.git`'s
   parent) — **never the invoking worktree's `.claude/`** (session worktrees each carry their own).
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

1. **Spawn in parallel:** a **drafter** agent (authors the war-shaped plan from the spec +
   codebase, per the `/war-strategy` plan template and code-boundary decomposition rule) and an
   **adversarial grill** agent (asks the full question tree `grill-with-docs` would have asked
   the operator). **Fresh context per spec** — ten specs never share one bloated window.
2. The drafter answers the grill's questions from the spec + codebase. Questions that survive
   unresolved are classified by the **ADR triad** — raised to the operator only if **hard to
   reverse**, **surprising without context**, or a **genuine trade-off**. Everything else is
   self-decided and logged in the plan's `## Notes / conscious deviations` (ratified later by
   `/red-team`, which the campaign runs per plan — `/war-machine` never red-teams).
3. **Interactive:** one `AskUserQuestion` volley per spec — the drafted `## Commander's Intent`
   echo-back confirm (mandatory, per ADR 0013) plus the triad survivors.
   **`--afk`:** triad survivors are self-adjudicated into the deviations log. The plan carries
   **`## AI-Commander's Intent`** instead — the one sanctioned Lead-invented intent block
   (ADR 0014, amending [ADR 0013](../../docs/adr/0013-commanders-intent-and-disposition-routing.md)),
   provenance-marked by the heading itself. **Predecessor-consistency check:** before committing
   to a synthetic intent, read the prior intent blocks — either heading, `## Commander's Intent`
   or `## AI-Commander's Intent` — across `docs/plans/*.md` and check the new block is in line
   with its predecessors (tone, scope, standing constraints); a divergence is **recorded in the
   deviations log, never silently shipped**. A spec that cannot be converted without an operator
   decision is **skipped and reported**, never stalled on.
4. **Write the plan** to `docs/plans/YYYY-MM-DD-<slug>.md` (**no `-plan` suffix** — matching the
   entire existing corpus), citing its source spec path near the top — the `docs/specs/…` line
   `/red-team` step 1 greps for, and the third link in `/aftermath`'s swept-issue evidence
   chain (issue → spec → plan → PR).

## 3. After the last spec

1. **Author the roadmap** at `docs/roadmaps/YYYY-MM-DD-<slug>-roadmap.md` per the `/war-strategy`
   roadmap template: dependency spine from the manifest's `dependsOn` hints firmed up by the
   actual plan `Files:` footprints; shared-file contention table from those same footprints.
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

## 5. Upgrade path

An `--afk` plan later getting a human pass runs `/war-strategy <plan>`, which replaces
`## AI-Commander's Intent` with an interviewed, operator-confirmed `## Commander's Intent`.
