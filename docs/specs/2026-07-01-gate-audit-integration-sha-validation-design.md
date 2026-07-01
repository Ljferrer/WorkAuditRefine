# Validate `integration_sha` before it becomes the gate-audit pin — Design

**Status:** proposed — hygiene patch, targets **v0.8.12** (current is v0.8.11; operator confirms final version). **Severity:** low.
**Source:** GitHub #393 · memory `gate-audit-pin-bracket-test-blocked-by-git-guard` (the `cat-file -t` recommendation).

## Problem — an agent-emitted sha reaches the auditor unvalidated

The post-merge gate-audit seat pins its evidence to a sha (`gateHeadSha`) so the read-only auditor can confirm the
gate ran at the integration tip. That pin is copied **verbatim** from a free-form schema field the war-refiner
LLM fills from prose — nothing checks it is a real 40-hex object.

- **#393 — `gateHeadSha` can be a malformed/synthetic sha.** `MERGE_RESULT.integration_sha` is a bare
  `{ type: 'string' }` ([workflow-template.js:47](../../skills/war/assets/workflow-template.js)) that the refiner
  populates from a directive ("populate integration_sha with the rebased integration tip",
  [:371](../../skills/war/assets/workflow-template.js) and [:438](../../skills/war/assets/workflow-template.js)).
  It is then copied straight into `gateHeadSha` at the two push sites
  ([:457](../../skills/war/assets/workflow-template.js) and [:468](../../skills/war/assets/workflow-template.js))
  with only a null-coalesce sentinel: `*.integration_sha ?? '(integration_sha unrecorded)'`. A hallucinated /
  repeating-tail value (e.g. `8478834b3c9e0e8b3c9e0e8b…`, on which `git cat-file -t` fails) sails through. This is
  **not** a string-truncation / interpolation defect — there is no slice/substr/concat that builds the sha (the
  issue's original hypothesis is misdiagnosed); the gap is the missing format-guard between refiner emission and
  auditor consumption.

Impact is **SOFT and by accident.** The auditor's existing cannot-confirm branch
([:498–513](../../skills/war/assets/workflow-template.js)) SOFT-downgrades on a `rev-parse HEAD` **mismatch**, so a
synthetic pin happens to downgrade too — but as a mismatch, not because the pin was recognised as malformed. The
auditor is never told to `cat-file -t` the pin first, so it burns a round reasoning about an unverifiable object.

## Decisions

- **D1 — Format-guard the pin at the copy site (Recommended).** In
  [workflow-template.js](../../skills/war/assets/workflow-template.js), define one helper near the top of the
  Refine block:
  ```js
  // ponytail: guard the agent-emitted pin at the copy site, not via a schema `pattern` —
  //           the model must still be able to emit the '(integration_sha …)' sentinel legitimately.
  const pinOrSentinel = s =>
    (typeof s === 'string' && /^[0-9a-f]{7,40}$/.test(s)) ? s : '(integration_sha unrecorded/malformed)'
  ```
  Replace both `gateHeadSha: *.integration_sha ?? '(integration_sha unrecorded)'` occurrences
  ([:457](../../skills/war/assets/workflow-template.js), [:468](../../skills/war/assets/workflow-template.js)) with
  `gateHeadSha: pinOrSentinel(noTestMr.integration_sha)` / `gateHeadSha: pinOrSentinel(mr.integration_sha)`. A
  synthetic sha now collapses to the sentinel, which the auditor already SOFT-downgrades — **no new control flow.**

- **D2 — Tell the auditor to `cat-file -t` the pin first.** In the gate-audit prompt, before the bracket
  `rev-parse HEAD` pin-check ([:503–506](../../skills/war/assets/workflow-template.js)), add a step: run
  `git -C ${refineryPath} cat-file -t ${gateHeadSha}` — if it fails **or** the pin is the sentinel, the pin is
  malformed/synthetic, so record the SOFT note directly and skip the bracket test. Fold this into the existing
  cannot-confirm branch, reusing the same required note fields ([:511–513](../../skills/war/assets/workflow-template.js));
  do not add a new outcome. `cat-file` is already a read-only verb the auditor's git guard peels (memory
  `guard-c-peel-resolves-pin-blocker-but-scoped-to-read-verbs-only`), so no guard change is needed.

Both fixes ship together: D1 stops most bad pins at the source; D2 makes the auditor recognise a malformed pin
deliberately (as malformed) rather than accidentally (as a mismatch), for the residue D1's regex can't catch (a
40-hex string that is a valid shape but not a real object).

## Mechanics

- The regex is deliberately loose — `[0-9a-f]{7,40}` accepts short and full shas — because it only rejects the
  *non-sha* shapes (empty, prose, obviously-truncated tails). Object existence is D2's job (`cat-file -t`), run in
  the worktree where the object would actually resolve. Neither fix asserts the pin equals the tip — that stays the
  existing bracket test.
- No `pattern` on `MERGE_RESULT.integration_sha`: the schema field must still accept the sentinel the model emits
  when it genuinely has no sha, so the guard lives at the copy site, not the schema.
- `validate-auditor-git.sh` is **not touched** — its read-only `-C` peel already covers `cat-file` at HEAD
  (memory `guard-c-peel-resolves-pin-blocker-but-scoped-to-read-verbs-only`); #393's "Related" sub-item (a
  plugin-root vs worktree divergence to reconcile) is stale.

## Affected files

`skills/war/assets/workflow-template.js` (only) · `skills/war/assets/workflow-template.test.mjs` (D1 unit test).

## Alternatives considered

- **Add a `pattern` to `MERGE_RESULT.integration_sha`** — rejected: it would reject the legitimate
  `'(integration_sha …)'` sentinel the refiner emits when there is no sha; guarding at the copy site keeps that
  path intact.
- **Leave as-is (rely on the accidental mismatch downgrade)** — rejected: the SOFT downgrade is a side effect of a
  `rev-parse` mismatch, not a recognition that the pin is malformed; a burned audit round on an unverifiable object
  is avoidable with a one-line guard.
- **New HARD escalation for a malformed pin** — rejected: over-built. A malformed pin is a cannot-confirm case, and
  cannot-confirm is SOFT by the stale-tip defusing rule ([:498–500](../../skills/war/assets/workflow-template.js)).

## Validation criteria

- `grep -n 'pinOrSentinel' skills/war/assets/workflow-template.js` shows one definition + two call sites (the two
  former `?? '(integration_sha unrecorded)'` copy sites); `grep -c "integration_sha unrecorded'" skills/war/assets/workflow-template.js`
  drops to `0` (both replaced).
- D1 unit test in `workflow-template.test.mjs`: extract `pinOrSentinel` from `templateText` (same harness that
  compiles the body) and assert `pinOrSentinel('8478834b3c9e0e8b3c9e0e8b')` (repeating malformed tail) returns the
  sentinel, `pinOrSentinel('deadbeef')` returns `'deadbeef'`, and `pinOrSentinel(undefined)` returns the sentinel.
- `grep -n 'cat-file -t' skills/war/assets/workflow-template.js` returns a hit inside the gate-audit prompt
  (currently zero — verified at HEAD).
