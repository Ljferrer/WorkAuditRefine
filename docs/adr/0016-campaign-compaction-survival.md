# Compaction survival: write-ahead checkpoint + post-compact re-injection (self-compaction rejected)

**Status:** accepted (design ratified 2026-07-03; implementation tracked by the spec below)

An overnight `/war-campaign` run outlives many context windows. When compaction fires — at a moment
nobody controls — the Lead's working context is replaced by a summary, and the campaign thread can be
lost: which plan is in flight, which run/task ids are live, what to do next. The obvious fix is to have
the model *steer* compaction — trigger `/compact` itself before a long wait, sense the context
percentage, or shape the summary via `PreCompact`. Every one of those depends on a platform capability
the model does not have (verified 2026-07-03 against code.claude.com/docs). A future reader will ask why
this design leans on an uncommitted markdown file and a `SessionStart` hook instead of just compacting on
purpose; this records why the steer-it approach is a dead end and what we do instead. Full mechanics:
[the design spec](../specs/2026-07-03-campaign-compaction-survival.md).

## Decision

Make compaction *timing irrelevant* rather than steer it. Two halves, one principle: **the resume brief
is always fresh before the wait, and it is deterministically restored after the window turns over.**

1. **`CAMPAIGN-STATE.md` is a write-ahead checkpoint.** The Lead rewrites `.claude/campaigns/<id>/
   CAMPAIGN-STATE.md` (sibling of `ledger.json`, uncommitted, single-writer, plain markdown) *before*
   every long-wait dispatch — launching `/red-team`, launching each `/war` phase, entering a
   `--wait-for-merge` wait — and at every plan boundary. Because the brief is written *ahead* of the
   dispatch it will wait on, its freshness never depends on when compaction fires. The invariant is that
   the file always lets a fresh context resume from NOW: queue status, in-flight run/task ids, the
   continuation sequence, and gotchas. It is a **brief toward git truth, never the authority** — resume
   still reconciles toward git (`git ls-remote`, `gh pr view`) before acting, per [ADR-0008](0008-git-is-the-resume-source-of-truth.md).

2. **A campaign-gated `SessionStart` hook re-injects it after compaction.** `hooks/inject-campaign-state.sh`
   is registered under `SessionStart` matcher `compact|clear|resume`; when a campaign is active (a
   `.claude/campaigns/*/ledger.json` parses and has at least one non-`landed` plan) it inlines the state
   file's content into `additionalContext`, selecting the latest campaign by ledger mtime. The write-ahead
   half is a prompt directive; **this hook is the code-enforced half of survival** — deterministic, not
   dependent on the Lead remembering to do anything at re-entry.

## Considered options

- **Agent-triggered `/compact` before a long wait (rejected).** There is no agent-side trigger for
  compaction — the model cannot invoke `/compact`; only the user or the auto-compactor can. A skill that
  says "compact now" is a no-op.
- **Threshold sensing / a `--no-self-compaction` knob (rejected).** The context percentage is unobservable
  to hooks and to the model — it is surfaced to the statusline only, not to any programmatic surface, and
  the auto-compact threshold is not configurable. There is nothing to sense and nothing to tune, so a
  sensor or a threshold knob has no input.
- **`PreCompact` participation — blocking or summary-shaping (rejected).** Blocking auto-compaction does
  not buy time; it rides straight into the hard context ceiling and deadlocks the session. Shaping the
  summary is not a reliable substitute for restoring the actual state file. `PreCompact` is dropped
  entirely; the re-anchor happens at `SessionStart` *after* the window has turned over, where the full
  state file can be inlined verbatim.

## Consequences

- **Session-binding looseness.** The hook gates on "a campaign looks active in this repo," not on "this
  session is the campaign Lead" — the two are indistinguishable at `SessionStart`. A non-Lead session
  opened in a repo with an active-looking ledger eats one ~2k-token false-positive injection per
  compaction. Accepted: the payload is small, self-describing, and harmless; the alternative (proving
  session identity) has no platform hook.
- **Write-ahead is a prompt directive, not code-enforced.** Nothing forces the Lead to rewrite the file on
  time; a Lead that skips a write-ahead point leaves a stale brief. Accepted as the honest boundary — the
  code-enforced half (the hook) still fires, and a stale-but-present brief plus git reconciliation beats no
  brief. The spec's manual `/compact` smoke (validation criterion 8) exercises the end-to-end path a unit
  test cannot.
- **The hook fires in any repo with the plugin installed and an active-looking ledger** — including repos
  that merely contain a campaign directory. It is fail-open silent (exit 0, empty stdout) on no campaign or
  any internal error, so the blast radius of a false match is the one bounded injection above, never a
  wedged session start.

## References

- Design spec: [`docs/specs/2026-07-03-campaign-compaction-survival.md`](../specs/2026-07-03-campaign-compaction-survival.md)
  — platform facts (§2, verified 2026-07-03), resolved design tree (§3), the honest boundary (§4), and the
  validation criteria including the manual smoke.
- [ADR-0008](0008-git-is-the-resume-source-of-truth.md) — the brief-toward-git-truth discipline this
  design inherits: git branch state outranks any local record, including this checkpoint.
- [ADR-0011](0011-campaign-stack-and-plow-branch-model.md) — the stacked-branch campaign model whose
  overnight duration makes compaction survival load-bearing.
- The 2026-07-03 compaction failure (operator-supplied) — the originating defect.
