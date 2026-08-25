# The plan interview — one interview, one merged artifact

The Dry-Run Interview adapted to WAR. It runs **once to completion** and terminates only on
the **merged plan** — Part 1 the ratified decision record, Part 2 the decomposed phases, one
file at `docs/plans/YYYY-MM-DD-<slug>.md` per the merged plan template ([SKILL.md §2](../SKILL.md)).
There is no separate spec interview and no conversion seam: what the interview extracts lands
directly in the artifact `/red-team` attacks and `/war` executes. Consumers: `/war-strategy`
(bare invoke and gap reviews) and `/war-machine`'s grill agent (which runs this file's
falsifier probes + provenance scan against a drafted conversion).

## The stages

**Stage 0 — silent recon.** Before any question, three recon lanes, all fail-open:

1. **Static recon** — read the repo tree, `CONTEXT.md`, `docs/adr/`, and the related plans
   under `docs/plans/`.
2. **The run-history recon lane** — read the four run-history corpus classes:
   run manifests (`.claude/war/runs/`) · epic phase reports · the war-followup corpus · `docs/learnings/`
   — plus the issue-linked evidence artifacts (each cited source issue's
   `## Evidence artifacts` section). What this lane read (or could not) lands in the plan's
   **Evidence consumed** block: one row per linked artifact, read or unread-with-reason —
   placement latitude anywhere in Part 1, never a new required H2.
3. **Batched memory prefetch** — one batched call, one query per interview area (scope,
   decomposition, guards, release), mirroring the /war Lead's flag discipline — `--local`
   always, `--repo` when a repo root resolved, fail-open:

```sh
node skills/_shared/war-memory.mjs query --queries <file> --local <local root> --repo docs/learnings
```

(the `--queries <file>` format is JSONL — one `{"label":…,"text":…}` object per line.)

Fail-open means a missing CLI, Node < 24, an absent `docs/learnings/`, or an empty run
corpus never blocks the interview — proceed without the rows (and without a `--local` root
the query writes nothing).

**Stage 1 — silent rehearsal + pre-mortem.** Mentally execute the plan-to-be, then name **at
least two landmine falsifiers** from the WAR falsifier list:

- **same-file collisions** — two parallel tasks touching one file rebase-conflict at the
  serial merge;
- **unregistered mirrors** — an inline copy of a canonical export with no drift-guard
  registry row in the same task;
- **default-flip surface enumeration** — a flipped default with some doc surface still
  carrying the old value and no OLD-absent assert;
- **guard-split deps edges** — a drift guard carved into a different task than its fact,
  without a `deps` edge onto the fact-authoring task;
- **touched-doc silence** — a task rewriting a doc that restates a machine-source-derivable
  fact with neither a guard, a de-mirror, nor an explicit backstop defer;
- **submodule/repo boundaries** — one task spanning two repos (content + gitlink bump are
  two tasks, two phases);
- **release slots** — a version bump not in its own trailing phase, or slots bumped out of
  lock-step;
- **frozen-base staleness** — a literal measured at a base the phase no longer runs at;
- **gate discoverability** — a test the gate's self-discovery sweep never finds;
- **the delete-the-feature probe** — mentally delete the feature: any proposed check that
  still passes is vacuous. This is the box-ticking mitigation — a tagged End state whose
  check cannot fail is worth less than no tag at all;
- **the omittability probe** — the delete-the-feature probe's dual, run over the End-state
  enumeration: for each required outcome ask, "if this had no numbered End state of its own,
  could the run omit it silently with every other check still green?" — a yes means the
  outcome needs its own row, an explicit backstop row, or an explicit non-goal.
  Delete-the-feature catches a check that cannot fail;
  omittability catches an outcome with no check at all;
- **the flush-ceiling smell** — an intent whose ceiling sits flush on the slice floor (no
  mechanism latitude beyond the slices) routes every forced mechanism substitution out-of-band
  as a follow-up issue; the interviewer names it as a plan smell and asks the latitude beat.

**Stage 1b — private full-template draft.** Before Q1, draft the entire merged template
privately, every slot filled and tagged (evidence tags, D4). Bin every unknown:
**settled** (recon answered it) · **executor's-latitude** (any reasonable implementation
serves the intent) · **default-and-tag** (pick a default, tag it
`[assumed: <default> — if wrong: <consequence>]`) · **fork** (ask the operator). Necessity
test for a fork: name the two different plans the answer forks between — if you cannot, it
is not a question. Intent material (Purpose / Method / End states) is **never**
default-and-tagged: it is asked, or it is absent (ADR 0013).

**Stage 2 — the interview.** Run under the question contract:

- a status line opens every turn: `Locked: <n> · Open forks: <m> · Qk/14` (question budget
  default 14, visible in the status line, operator-raisable — D8);
- **one question per turn**, the highest-value open fork first;
- every question ships `Recommended: <option> — <basis>` with the basis graded (verified /
  prior-lesson / assumption);
- bare assent ("yes", "ok", "sounds right") accepts the recommendation and records it
  `(user)`;
- at least two falsifier questions land **early** — the stage-1 pre-mortem's landmines,
  posed as questions;
- **the latitude beat** (decisive slot) — once the End states are drafted, ask: *"Which
  mechanisms named in Method are implementer's choice? What is the actual floor?"* — landing
  as the intent's optional `Mechanism latitude:` / `Binding guardrails:` sub-bullets
  ([SKILL.md §2](../SKILL.md)). Default posture: mechanisms named in Method are reference
  realizations unless promoted into the guardrails list;
- **the strategy-verifier** — the arming principle:
  **arm any beat whose wrong branch surfaces only at run time** (four arms, enumerated in
  the charter's arming checklist); arming is by rule, dispatch-without-asking — skips flow
  the other way, as operator-uttered `WAIVE-<n>` rows (the pin-ledger law below).
  When a beat arms per the checklist, read
  [references/strategy-verifier.md](strategy-verifier.md).

**Stage 3 — mid-budget checkpoint.** Once, near the budget's midpoint: surface the riskiest
still-live assumption and ask it directly.

**Stage 4 — coverage sweep + two echo-backs.** Sweep the decisive slots (table below) for
unfilled rows, run the omittability probe over the drafted End-state enumeration (an
outcome no row covers gets a row, a backstop, or a non-goal — never silence), and
enumerate the Evidence consumed block aloud (every linked artifact read or
unread-with-reason), then close with **two echo-backs**, each requiring an explicit
confirm:

1. the **decision record** (Part 1) — including the Defaulted-decisions recap: every
   `[assumed:]` row read back aloud, so silence never ratifies a default;
2. the **decomposed phases** (Part 2) — drafted silently under the code-boundary
   decomposition rules ([SKILL.md §3](../SKILL.md)), echoed as the phase → task → `Files:`
   skeleton.

Echo-back 1 is **gate 1** — the confirm gate carrying the inseparable pair: the advisory
lint stays exit-0 report-only ↔ gate 1 carries the hard **enumerate-aloud** duty over its
findings. Every pin-rule gap and Evidence-consumed gap the lint reports, and every
`WAIVE-<n>` row — one-shot and standing alike — is enumerated aloud and resolved
fix-or-waive on the record before the confirm counts. Pins whose landing class is a duty
or fence (marked ‡ in the design tree) are read **twice** at echo-back reconciliation —
once in the echo-back's own sweep, once against the floor list.

**Stage 5 — two silent gates.** Before writing the file:

- the **provenance gate** (completeness): scan every claim of fact — an untagged claim of fact is a bug;
  memory/training is never a `(verified:)` source (verify against the live repo, or tag `[assumed:]`);
- the **executor gate**: "could `/war` decompose-dispatch this, and `/red-team` attack it,
  with zero operator questions?" — a "no" reopens the interview while budget remains;
  otherwise default-and-tag the residue and record it in the ledger.

## The ratified-pin ledger + the WAIVE channel

Ratified interview state is **artifact-borne** — the principle, verbatim:
state that must survive to a gate lands in the artifact, not the transcript.
Every mechanism below serves it.

- **`PIN-<n>` token grammar:** digits-only id, matched as a whole right-delimited token —
  `PIN-1` never matches inside `PIN-13`; amendment pins mint fresh numbers, letter suffixes
  are illegal. The `PIN-` prefix carries reconciliation join keys only — it is never a
  skip token.
- **Landing class per pin:** design-tree rows carry their ratified pin ids and a
  landing-class cell (pin→class pairs; a single-class cell covers all row pins). The
  class→section map: guardrail → `Binding guardrails:` · slice → the named task's
  `Plan slice:` · end-state → the End state list · backstop →
  `## Deferred validations (backstops)` · context / non-goal → the definition row
  suffices. Class-less pins fall back to anywhere-citation. The advisory
  `plan-literal-lint.mjs` checks the map mechanically — report-only, exit 0; the hard half
  of the pair is gate 1's enumerate-aloud duty (Stage 4).
- **The `WAIVE-<n>` channel:** `WAIVE-<n>` is the skip token (verifier skips are operator
  utterances — the charter owns the semantics). Waive rows are artifact-borne in the plan:
  id · beat · fired arm · scope · reason, right-delimited id, inheriting the Evidence
  consumed block's placement latitude and its never-a-new-required-H2 law by name.
  Canonical standing-skip example: a class-scoped standing skip records
  the class scope in the scope field and the utterance point in beat.

## Terminal state

The merged plan at `docs/plans/YYYY-MM-DD-<slug>.md` — never a standalone spec, never a
spec + plan pair. **The 1:N → roadmap rule:** when rehearsal shows the work exceeds one plan,
the deliverable is N merged plans + a roadmap ([SKILL.md §2](../SKILL.md)'s roadmap
template) — the roadmap layer models the split, never a file split of a single plan's
decision record from its phases. Stop rules: saturation (no live forks left) · completion
bar (every decisive slot filled) · budget exhaustion (default-and-tag the rest, recap them
in echo-back 1) · operator exit.

## The decisive-slots table

What the interview extracts, hard-linked to where it lands and who consumes it — an
interview that leaves a row unfilled has not finished:

| Interview extract | Lands in | Consumer |
|---|---|---|
| validation criteria + checks | tagged End states in `## Commander's Intent` (D18 — one numbered list, each tagged per D5) | `/red-team` grading · `/war` gate-audit |
| mechanism latitude + the actual floor (the latitude beat — asked always; an explicit "none" is a complete answer) | optional `Mechanism latitude:` / `Binding guardrails:` sub-bullets in `## Commander's Intent` | `/war` execution seats — in-band mechanism-substitution reading |
| constraints / landmines | `## Pivotal constraints` | `/red-team` probe derivation |
| file footprints | per-task `Files:` | decomposition rule 1 + campaign contention |
| deferred-validation candidates | `## Deferred validations (backstops)` | land-time surfacing (ADR 0017) |
| target repos | per-task `target repo:` | decomposition rule 3 |
| mirrors / default-flips / guard-splits / touched-doc facts | task carve-outs per the drift-guard rules 5–8 | drift-guard floors · `/red-team` spine probes |
| assumptions | `## Assumptions ledger` | `/red-team`'s `[assumed]`-first probes |
| new domain terms | `## New domain terms · Recommended ADRs` | CONTEXT.md glossary |
| choices passing the ADR triad (hard to reverse · surprising without context · a genuine trade-off) | ADR recommendations | `docs/adr/` |

## Evidence + slot law (shared with the template)

- **Evidence tags (D4):** `(user)` · `(verified: <source> at <base>)` ·
  `[assumed: <default> — if wrong: <consequence>]`; issue-derived facts use
  `(verified: issue #N (<date>))` (D11).
- **Staleness (D12):** literals are dated snapshots at a stated base; re-measure at the
  task's rebased base.
- **Done-when law (D5):** `Done when: <command>` is required iff `requiresTest: true`, and
  permitted (not required) on any other task; otherwise `None — <basis>`. Every End state carries
  exactly one tag from the closed set `check:` | `gate:` | `HARD at audit_sha` (observable +
  judge seat) | `backstop:` row.
- **AFK provenance (D14):** AI-authored rows/tags carry a per-row `AI-declared` marker
  (ADR 0014).

## Gap-review binding (D9)

With-artifact reviews ([SKILL.md §4](../SKILL.md)) run under this same question contract —
status line, one question per turn, recommendation-first, bare-assent semantics, falsifiers
early. A gap review is a shorter interview, not a different discipline.
