# Executed red-team probes are trusted only behind a post-run sandbox-escape guard

**Status:** accepted (design ratified 2026-07-08; implemented by the spec and plan below)

`/red-team`'s executed probes run real Bash to *prove* a claim in a throwaway sandbox — but the Bash
tool resets cwd between calls, so a probe that relied on a prior `cd` and then ran a bare `git push`
pushed to the **real** remote instead of its sandbox copy ([[redteam-executed-probe-cwd-reset-hits-real-remote]]).
The only barrier was the SCOPE-LOCK preamble: prose telling the probe to stay in its copy. Prevention
prose is not a barrier — a cwd reset, an ambient-context slip, or an out-of-band edit defeats it, and
a verdict computed after such an escape is silently untrustworthy. Full mechanics:
[the design spec](../specs/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing-design.md) §3–§4
and [the plan](../plans/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing.md).

## Decision

**A verdict from a run with executed probes is untrusted until a deterministic post-run guard confirms
the real repo and remote are unmutated. The SCOPE-LOCK preamble is a prevention layer, never the sole
barrier.**

1. **The scope-lock is hardened prevention (Layer 2).** `scopeLock('executed')` directs every git call
   through `git -C <abs-sandbox>` with absolute paths throughout, never relying on a prior `cd`, and
   never a bare `git push` — the comment cites the recorded cwd-reset escape. This lowers the escape
   *probability*; it does not by itself establish trust.

2. **A post-run escape guard is the detection authority (Layer 3).** `assert-no-repo-escape.sh --repo
   <repo>` runs **between the Workflow return and the gate**, with the floor-family exit contract
   (0 = clean, 1 = escape detected, 2 = git error — the 2-vs-1 distinction never collapses). It asserts
   (a) `git -C <repo> status --porcelain` is empty and (b) no local ref and no `ls-remote origin` ref
   matches the throwaway-sandbox junk pattern. A nonzero result routes the verdict through the existing
   **self-confound gate** (ADR 0020) — never `CLEARED` — until the state is clean.

3. **The harness is a detection guard, not a jail.** This ratifies the previously-deferred execution
   harness as a *post-run detection* check. An agent-type confinement hook that intercepts every probe
   Bash call (a "probe jail") is a **recorded non-goal (D6)** — disproportionate; the post-run guard
   closes the trust gap without a new confinement surface.

## Relationship to prior ADRs

- **Detection routes through [ADR 0020](0020-diagnosis-discipline-self-confound-gate.md).** The guard is
  the detector; the self-confound gate is the adjudication authority that quarantines the verdict on a
  positive result. The guard does not itself decide the verdict — it forces the diagnosis pre-flight.
- **The probe jail is rejected under [ADR 0002](0002-scope-by-agent-type.md)'s cost frame.** 0002 scopes
  confinement by `agent_type` where it is proportionate; a per-Bash-call red-team-probe jail is not, so
  this ADR closes the same gap with a cheaper post-run check instead of a new agent-type branch.
- **The guard is a gate/floor member under [ADR 0006](0006-deterministic-test-floor.md).** It is a
  deterministic shell check with the 0/1/2 floor exit contract, not an advisory finding.
- **Sibling of [ADR 0032](0032-red-team-grades-by-artifact-kind.md)** — the same spec ratifies both;
  0032 makes the grading trustworthy, 0033 makes the execution trustworthy.

## Considered options

- **Trust the SCOPE-LOCK preamble alone (rejected).** Prevention prose is defeated by a cwd reset — the
  exact recorded escape. A verdict needs a *detection* layer, not a louder warning.
- **A per-Bash-call probe jail keyed on a red-team-probe `agent_type` (rejected, D6).** Disproportionate
  for the trust gap; the post-run guard is the cheaper barrier.
- **Fold the git-error exit into the escape exit (rejected).** A `git error` (exit 2) is an
  environment/tooling failure, not proof of an escape (exit 1); collapsing them would quarantine clean
  verdicts on a transient git hiccup and blur the diagnosis.

## Consequences

- **The junk-ref pattern is a heuristic ceiling.** It matches the throwaway-sandbox naming the scaffold
  uses; a probe inventing an unrelated ref name slips it. Acceptable — the `status --porcelain` half is
  exact and the common escape (a bare push of the working branch) is caught. `ponytail:` a full ref-diff
  snapshot is the named upgrade path, built only if a second escape slips the pattern (a declared
  backstop, runner: the guard's own output each run + the lessons feed).
- **A clean run is byte-for-byte unchanged.** The guard runs, returns 0, and adds nothing to the verdict;
  it only ever quarantines, never clears.

## References

- Design spec:
  [`docs/specs/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing-design.md`](../specs/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing-design.md)
  §3 (design tree), §4 (mechanics), §6 (terms), §9 (non-goals), §10 (validation criteria).
- Implementation plan:
  [`docs/plans/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing.md`](../plans/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing.md).
- [ADR 0020](0020-diagnosis-discipline-self-confound-gate.md) — the self-confound gate a positive guard
  result routes the verdict through.
- [ADR 0002](0002-scope-by-agent-type.md) — the confinement-by-`agent_type` frame under which the probe
  jail is rejected as disproportionate.
- [ADR 0006](0006-deterministic-test-floor.md) — the deterministic floor exit-contract idiom the guard
  follows.
- [ADR 0032](0032-red-team-grades-by-artifact-kind.md) — the sibling grading-trust decision from the same spec.
- Memory lesson (the originating escape): [[redteam-executed-probe-cwd-reset-hits-real-remote]].
