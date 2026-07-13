---
name: wave-loop-thunk-catch-prevents-null-result-infinite-redispatch
description: "Wave-loop per-task thunks must wrap their whole body in try/catch returning verdict:'escalate' — else an uncaught engine throw is NULLed by parallel, dropped by results.filter(Boolean), and re-dispatched every wave until mislabeled unrunnable-deps"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: wave-loop-thunk-catch-prevents-null-result-infinite-redispatch
  phase: "Engine-routes-contract-surfaces/1.1 (2026-07-12, fixes"
  keywords: 
    - wave-loop invariant
    - nextWave
    - parallel null drop
    - results.filter(Boolean)
    - unrunnable-deps mislabel
    - infinite redispatch
    - held:escalation
    - engine error
    - thunk try catch
    - work audit thunk
    - HARD_ESCALATION_REASONS
    - token burn
  tags: 
    - workflow-template
    - engine
    - wave-loop
    - escalation
    - design-pattern
  created: 2026-07-12
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
---

# One dispatch, exactly one collected result: wrap the WHOLE per-task thunk, not just the risky bits

**The defect this closes (#742):** the wave loop's `parallel(wave.map(task => async () => {...}))`
only had try/catch around *parts* of the per-task work+audit thunk. An engine-side throw outside
those guarded parts (e.g. inside `provisionStep`, a `pt`-tagged prompt build, or the old
`assertReportedPathsInWorktree`/now `normalizeReportedPaths` path-contract check) rejected the
thunk. The live `parallel` implementation turns a rejected thunk into a `null` in the results
array; `results.filter(Boolean)` then silently drops it. Because the task's `done.add(task.id)`
never ran, `nextWave()` sees it as still-runnable and **re-dispatches the same already-complete,
already-pushed, gate-green task every wave iteration** (~660k tokens/round) until a post-loop
ghost-dependency sweep eventually mislabels it `unrunnable-deps` — a confusing terminal state with
no trace of the real engine error.

**The fix (verify still present before acting — found at
`skills/war/assets/workflow-template.js`, the `results = await parallel(wave.map(...))` block, the
per-task async arrow, phase Engine-routes-contract-surfaces/1.1, 2026-07-12):** the ENTIRE thunk
body — `provisionStep`, every `pt`-tagged worker/fix prompt build, `normalizeReportedPaths`, and
`auditRound` — is now inside one `try { ... } catch (err) { return { task, verdict: 'escalate',
seats: [], expected: 0, blocked: \`engine error during work/audit: ${err.message}\` } }`. `'escalate'`
was already a member of `HARD_ESCALATION_REASONS` (ADR 0005 untouched — no new escalation kind was
invented), so this reuses the existing hard-block path: the collection loop threads `blocked`
verbatim and the phase lands on `held:escalation` with the true diagnostic message, instead of
silently looping.

**The general, reusable rule:** in any wave/queue loop built on a `parallel` (or `Promise.allSettled`
-like) helper that **drops** a rejected entry rather than surfacing it, a per-item thunk's try/catch
must wrap the *entire* body, not just the parts that look risky at review time — partial coverage
reproduces the exact "one dispatch must yield exactly one collected result" invariant violation,
just with a smaller blast radius. When adding a new call inside such a thunk (a new prompt build, a
new normalization step), it lands inside the existing catch-all by construction — no per-call
try/catch needed, and none should be added (it would just re-narrow the coverage).

**Where this money-shot log line lives**: the invariant is documented as a comment directly above
the `try {` (thunk entry, not literally beside the `catch`) — plan asked for "a comment at the
catch"; the auditor judged the thunk-entry placement fully intent-consistent (arguably clearer for
a reader entering the block) and non-deviating (disposition: note, Nit, no fix required).

Related: [[done-report-path-contract-scoped-to-primary-worker-call-site]] (the
`normalizeReportedPaths` call this catch now also guards — renamed from
`assertReportedPathsInWorktree` in the same task), [[held-escalation-lead-manual-completion]] (what
`held:escalation` means downstream), [[war-phantom-land-reports-success-without-advancing-integration]]
(a different "silent no-op looks like progress" engine hazard in the same file).
