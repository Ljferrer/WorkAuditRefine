# Fork trials and the pair beat — the interview runs the experiment

The doctrine home for the two methods a `/war-strategy` interview uses to settle a fork
before the operator ratifies it (plan `2026-10-26-interview-fork-trials-and-pair-beats`,
D1–D3, D5, D7, D9–D13, D15, D17, D18). A **fork trial** runs a bounded throwaway experiment
and lets the result decide a fact. A **pair beat** puts two structurally different designs
beside one frozen brief and lets the operator choose. Every trial lands as one `TRIAL-<n>`
row in the plan's `**Trials run**` block. Plan prose is never evidence that a design works.

[plan-interview.md](plan-interview.md) points here from Stage 1b and Stage 2; `SKILL.md` §4
and `/war-machine` point here by name. No other surface restates this file. Commands below
are written from the plugin root (`${CLAUDE_PLUGIN_ROOT}`); in the plugin repo itself that
is the repo root.

## When a fork qualifies

Stage 1b bins every unknown. A **fork** is a question only when the necessity test passes:
name the two different plans the answer forks between, or it is not a question. Classify
each fork that passes:

- **fact → fork trial.** The answer is observable by running something: a command's exit
  code, a test's red or green, a file's size, a tool's presence. Run the trial. The result
  decides, and the fork costs the operator zero questions.
- **interface → pair beat.** The answer is a design choice with consequences for other
  code: an exported contract, an artifact grammar, a floored mechanism. Run the pair beat
  (its own section below). It costs one question.
- **preference → ask.** The answer is a taste, a priority or a scope call. Ask it as an
  ordinary Stage 2 question with a `Recommended:` line.

Intent material (Purpose, Method, End states) is never settled by a trial or a pair beat.
A trial settles a fact. It never writes an End state (ADR 0013). A fork that would write
intent is asked, or it is absent.

Two necessity twins guard the two methods. The fork twin: name the two plans the answer
forks between. The pair twin: name two structurally different shapes. A beat that cannot
name two shapes is a verifier beat ([strategy-verifier.md](strategy-verifier.md)), not a
pair beat.

## Running a fork trial

**Pre-register before the run.** Write the row's question, its outcome branches (`if A:
<consequence> · if B: <consequence>`) and its `bound:` field before any command runs. A
row without a pre-registered question is an exploratory run and settles nothing (see
`## Provenance`).

**The one sandbox form.** Every executed trial runs in a throwaway clone under the
session's scratchpad directory, never in the checkout:

```
git clone --no-hardlinks <repo> <scratchpad>/trial-<n>
git -C <scratchpad>/trial-<n> remote remove origin
```

Never `cp -R` (a copied linked worktree drives the real repo) and never `git worktree add`
(it shares the ref store). The clone's `origin` is the real checkout, so remove it: a push
from the clone is a write into the real repo. A clone carries committed state only.
**Overlay the private draft:** copy the Stage 1b draft and any other uncommitted edit into
the clone explicitly before the trial reads them.

**The dirty-tree rule (PIN-1 (a)).** Bare invoke keeps the private draft in the scratchpad,
never in the checkout, and overlays it into the clone. Convert mode makes a WIP commit of
the on-disk draft first. A trial on a still-dirty tree never runs: the row reads
`infra-failed — dirty tree`.

**The escape guard around each trial.** The guard is `/red-team`'s
`skills/red-team/assets/assert-no-repo-escape.sh`. Its header carries the exit codes, the
check list and the triage rules. Run it on the real checkout, once before and once after
each trial, with an absolute scratch file outside the tree:

```
bash ${CLAUDE_PLUGIN_ROOT}/skills/red-team/assets/assert-no-repo-escape.sh --repo <repo> --snapshot <scratchpad>/guard-<n>.txt
# the trial runs here
bash ${CLAUDE_PLUGIN_ROOT}/skills/red-team/assets/assert-no-repo-escape.sh --repo <repo> --baseline <scratchpad>/guard-<n>.txt
```

The guard is fail-closed on the row, never on the interview. Snapshot exit 1 naming a
dirty tree is the dirty-tree rule above. Snapshot exit 1 naming a pre-run junk ref writes
no snapshot, so the trial never runs: the row reads `infra-failed — guard unsettled` and
names the ref. A baseline exit 1 is triaged by action-provenance:
re-read each named delta (a ref, or an ignored file written inside the window) and ask
whether this trial authored it. A delta another session, worktree or IDE wrote is
**foreign**: record it on the row and proceed. A delta this trial wrote is an escape:
remove it, stamp the row `infra-failed — guard unsettled`, and report it. An exit 1 left
un-triaged, or any exit 2, also stamps `infra-failed — guard unsettled`. Such a row backs
only `[assumed:]`. The header line `escape-guard:` of the Trials block reads `clean` only
when every trial's guard settled.

**Base attestation.** Before the clone, and after any convert-mode WIP commit, read the
checkout's sha (in convert mode, the WIP commit):

```
git -C <repo> rev-parse HEAD
```

After the clone, read the base from the clone, never from the checkout:

```
git -C <scratchpad>/trial-<n> rev-parse HEAD
```

The row records the clone sha as `base: <sha>`, and a settled claim cites it as
`(verified: TRIAL-n at <base>)`. A clone sha that differs from the checkout's sha is
`infra-failed — base mismatch`. A plan's earlier measurement base is never the comparand:
a checkout ahead of it, or a convert-mode WIP commit, is a valid base.

**Removal attestation.** After the baseline, `rm -rf` the clone and record `removed:
<path>` on the row. A row without `removed:` is open.

**Outcomes.** Exactly one of `settled`, `inconclusive`, `infra-failed — <reason>`. A trial
is `settled` when the observation lands on one pre-registered branch. It is `inconclusive`
when the observation lands on neither, or the wall cap cut it. It is `infra-failed` when
the sandbox, the guard or the base failed, not the question. **One retry, only on
`infra-failed`.** The retry is a new row that names the failed one. An `inconclusive` row
is never retried: it backs a ledger row instead (`## Provenance`).

**Clone-root-relative commands.** Every fenced `command` on a row is written relative to
the clone root, with no scratchpad path, no absolute path and no `cd`. The replay runner
reads the fence and runs it in a fresh clone. Run each command from the clone root in the
same Bash call that defines the cap, e.g. `cd <scratchpad>/trial-<n> && cap <s> bash -c
'<command>'`; the Bash cwd resets between calls, so a separate `cd` lands the next command
in the real checkout.

**The per-command cap.** Each command runs under the per-command timeout from `## Bounds`.
A host with `timeout` may use `timeout <s> <command>`. This host has none, so the portable
form is a process-group kill: fork, `setpgrp` in the child, exec the command, and on the
alarm send TERM then KILL to the negative pgid and exit 124, the code `timeout` uses:

```
cap() { perl -e 'my $t = shift; my $pid = fork; if ($pid == 0) { setpgrp(0, 0); exec @ARGV or exit 127 } $SIG{ALRM} = sub { kill TERM => -$pid; sleep 1; kill KILL => -$pid; exit 124 }; alarm $t; waitpid $pid, 0; exit(($? & 127) ? 128 + ($? & 127) : $? >> 8)' "$@"; }
cap <s> bash -c '<command>'
```

The row records `cap: enforced` only with this form or with `timeout`. The plain
`perl -e 'alarm shift; exec @ARGV'` one-liner kills only the outer bash, leaves a compound
command's child running and exits 142. It never earns `cap: enforced`; a sweep that used it
records `cap: unenforced`, and the wall cap alone bounds the run. Check `command -v perl`
once per interview (ledger A6 of the authoring plan).

**Scope of a trial.** `gh` reads are allowed. No network write of any kind: no push, no
issue or PR write, no comment. A trial that must execute a shipped artifact (a binary, an
app bundle, firmware) is out of scope here: route it to the REA lane
([artifact-evidence.md](artifact-evidence.md)) or to `/red-team`.

## The sweep row

Reachability step 3 is the plan author's duty and stays untouched: run each End-state check
at the base and prove it red ([backward-chain-plan.md](backward-chain-plan.md)
`## The reachability probe`). The `TRIAL-<n> · sweep` row is that step's bounded, recorded
run, and it records steps 3, 4 and 5 together:

- `base: <sha>` from the clone, `sandbox: <path>`, `bound: wall <s> s · cmd <s> s`, and
  `cap: enforced | unenforced`;
- one entry per check, `E<k> · parse ok | parse error · exit <code> · token yes | no ·
  red | green | transport failure`. A transport failure (a truncated check, an unrunnable
  embed, a missing tool) is recorded as such, never as red;
- the step-4 reach walk: for each End state, the owning task whose `Files:` and the gate's
  tools can make it true, or the gap;
- on the wall cap, `partial — ran k of m` names how many checks ran.

Each End-state line in `## Commander's Intent` keeps its own step-5 result (`red at base:
TRIAL-<n>`, or the reason it could not run). A check green at base reopens the End state:
rewrite it until it is red, then re-run the sweep. The row never says "validated"; it says
what ran, what it printed and what that means for the chain. Re-run the sweep after any
check edit, at Stage 4 and before echo-back 1.

## The pair beat

A pair beat is mandatory on three triggers:

1. a new or reshaped **exported contract** (an export, a CLI surface, a schema another
   file consumes);
2. a new or reshaped **artifact grammar with two or more consumers** (a row shape, a tag
   form, a block that two surfaces parse);
3. a mechanism floored into **`Binding guardrails:` with two or more non-equivalent
   realizations**.

The necessity twin: name two structurally different shapes, or it is a verifier beat.

**The frozen brief** comes before any candidate: the problem, the constraints, the evidence
in hand, the caller's usage, and three to six named criteria. Freeze it, then draft. Two
candidates by default, three at most. One reframe is allowed when the candidates diverge
wildly (the brief was wrong, not the candidates); a second reframe is a new fork. Score
each candidate against each criterion, name the chosen shape, name what was rejected and
why, and name any graft taken from a rejected candidate.

**The question.** A pair beat costs exactly one question of the `Qk/14` budget: the two
candidates, the scores, a `Recommended:` line. The operator may decline the pair by bare
assent to the recommendation, or by naming a reason. The row then reads
`chosen: <design> (user) — pair declined: <reason>`. A declined pair is never a `WAIVE-<n>`
row: the beat ran, the brief exists, and the record carries both shapes.

The pair row's Source cell in the design tree cites the row: `(user) Q<k>, after TRIAL-<n>`.

## The Trials run block

Every trial lands as one row in one block. The label line is exact:

```
**Trials run** — one row per trial:
```

The header, on the lines after the label, carries three provenance lines:

```
bounds: wall <s> s · cmd <s> s · excerpt <n> · config: <path> (section present | absent | unreadable) · overrides: none | <key>=<value> (user) Q<k> · trial tier: <model>/<effort> (config, or default)
tokens: <n> · wall: <m> min (source: workflow usage | agent usage | n/a)
escape-guard: clean | unsettled
```

The row grammar is one `·`-separated line per trial:

```
- TRIAL-<n> · fact | pair | sweep · <fields>
```

`TRIAL-<n>` reuses the PIN token law: digits only, right-delimited (`TRIAL-1` never matches
inside `TRIAL-12`), numbered in run order, never re-minted. The fields are the ones each
section above names: a fact row carries the question, `settles:`, `bound:`, `base:`,
`sandbox:`, `guard:`, `cap:`, `result:`, `removed:` and the wall time; a pair row carries
the brief, the criteria, the candidates, the scores, `chosen:`, `rejected:` and `grafts:`;
a sweep row carries the sweep fields. The `command` and `observed` text rides a nested
fence under the bullet, indented under the row:

```
- TRIAL-3 · fact · does a new references file trip a pin? · settles: D13 · bound: wall <s> s · cmd <s> s · base: <sha> · sandbox: <scratchpad>/trial-3 · guard: snapshot 0 / baseline 0 · cap: enforced · result: settled — only the placement census reds · removed: <scratchpad>/trial-3 · wall: 2 min
    ```
    command: node --test skills/_shared/doc-cli-consistency.test.mjs
    observed: AssertionError: references-file placement census failed (default-deny). UNPLACED: [...]
    ```
```

Inside a fence, no line starts at column 0 with `## `, `### ` or `- Files:`: the extraction
surfaces read those tokens at column 0 and a fenced copy would be read as a heading or a
task. The `observed` excerpt is capped at `excerptLines` lines from `## Bounds`; a longer
observation is cut with a `… (<k> more lines)` tail. A plan whose interview ran no trial
carries the block with the single row `None — no fork qualified`.

**Placement.** The block sits anywhere in Part 1 and is never a new required H2. It
inherits the Evidence consumed block's law by name (`SKILL.md` §2, "Evidence consumed
block"): placement latitude, enumerated aloud at gate 1 beside the Evidence consumed block.
Place it outside `## Context`: the literal lint's `untagged-context-claim` rule reads
`## Context` only, and a `ran k of m` row inside it would trip that rule.

## Provenance

Only a pre-registered `settled` row backs `(verified: TRIAL-n at <base>)`. An inconclusive
or infra-failed row backs only `[assumed:]`. An assumption a trial confirms is retired with
the reason `settled by TRIAL-n`. A trial's base is the sha observed in the clone; a mismatch
is `infra-failed — base mismatch`. Exploratory runs (no prior row) may mint a fork or an
`[assumed:]`, never a settlement.

An inconclusive trial backs an Assumptions-ledger row. That row's Check is the trial's
clone-root-relative replay command, copied from the row's fence, so the first `/red-team`
on the plan can run it in a fresh clone.

## Bounds

Bounds are a safety precaution (ADR 0052 §4), never a budget to spend down. Three bounds are
configurable; their defaults live in `war-config.mjs` and are never restated here. Read
them by pointer:

```
printf '{}' | node ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/war-config.mjs --stdin --fill-defaults
```

and read the `interview` section: `trialWallSeconds` (the wall cap per trial, written into
`bound:` before the run), `commandTimeoutSeconds` (the per-command cap inside a trial and
the sweep) and `excerptLines` (the `observed` cap). The retry count is doctrine, not
config: fixed at 1, only on `infra-failed`.

**The live read, fail-open.** At interview start, read the repo's config the way `/red-team`
reads `agents.redteam`:

```
node ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/war-config.mjs <repo>/.claude/war/config.json --fill-defaults
```

A nonzero exit (missing file, invalid JSON, a config that fails validation) is
`unreadable`: every key falls back to the default read above, and the interview never
stops. On a zero exit, read `present` or `absent` from the raw file's top-level `interview`
key, never from the output, because `--fill-defaults` always fills the section. A key that
is missing or null in the raw section falls back to the default, per key. The header
records which case held: `config: <path> (section present | absent | unreadable)`.

**Operator overrides.** An operator may raise or lower a bound for one interview, on the
record. The override is a `(user)` fact in the header, `overrides: <key>=<value> (user)
Q<k>`, and is never written back to `config.json`; `/war-room` owns that file.

**The trial tier (D18).** The model and effort of the ad hoc subagent that runs a trial
come from `agents.trial { model, effort }` by the same fail-open read. A zero exit
supplies both; anything else inherits the session. The header records
`trial tier: <model>/<effort> (config, or default)`, reading `config` only when the raw
file carries the block. The trial subagent is a
general-purpose agent instructed by this file; no `agents/*.md` card exists for it.

## AFK

Under `/war-machine --afk` fact trials run unattended with `AI-declared` TRIAL rows. Pair
beats: the drafter authors both candidates from one frozen brief and picks; the Source cell
reads `PIN-n · AI-declared [assumed: picked on the frozen criteria, TRIAL-n — if wrong:
<losing candidate>]` with no pipe character inside; the grill refutes the pick as an armed
arm-2 beat and its `if wrong: · caught by:` line rides the Trials pair row. No pair beat is
suppressed. A WAIVE row in an AFK plan stays a defect.

## Grandfather and reporting

The REA plan (`docs/plans/2026-10-20-rea-artifact-evidence.md`) recorded its executed
probes as one "Probes this interview ran" row in its Evidence consumed block. That row is
legacy and stays as written. Every plan authored after this doctrine landed records its
trials in the `**Trials run**` block, never as an Evidence row.

**The usage comment.** After the plan file is written (the interview's `## Terminal state`),
post one comment on issue #2436 of the plugin repo. The issue body holds the template; it
reads:

```
<plan path> · <date> · trials: <n> (fact <a> / pair <b> / sweep <c>) · verifier passes: <n> · subagent tokens: <n> · wall: <m> min · red-team verdict: <when known>
```

The token and wall figures are the header's `tokens:` and `wall:` lines. This is the one
network write the doctrine makes, and it happens after the file exists, never inside a
trial.
