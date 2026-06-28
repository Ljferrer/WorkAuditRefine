# Dispatched gate-run TMPDIR `.war-task`-free pin parity (G2) — Design

**Status:** proposed — targets **v0.7.2** (prompt/doc + test). **Severity: Minor.**
**Source:** #184 (parity audit, group G2). Lands AFTER G1 (#117-adjacent, v0.7.1) on the shared file `workflow-template.js`.

## Problem — the standing refiner `.md` carries the `.war-task`-free `TMPDIR` pin, but the two dispatched gate-run prompts re-state the gate mechanics without it

The TMPDIR-isolation hardening (guardherm tC / #95b) was scoped to
[war-refiner.md merge-task step 2](../../agents/war-refiner.md) — line 24 instructs running the gate
"with `TMPDIR` set to a freshly-created, `.war-task`-free directory (created outside any worktree — e.g.
`TMPDIR=$(cd / && mktemp -d)`)" — plus the test that asserts it. `workflow-template.js` was deliberately
left out of #95b (it overlapped other plans at the time). The refiner reads its standing `.md`, so the
directive is live in practice for the merge-task gate — but the two **dispatched** gate-run prompts in
[workflow-template.js](../../skills/war/assets/workflow-template.js) re-state the gate-run mechanics
without restating the pin:

- the merge-task `merge:${r.task.id}` agent prompt — the `Run the gate (${plan.gate}) after the rebase in
  the task worktree` clause (line 316);
- the land-phase `land:phase-${ph.id}` agent prompt — the `Run the gate (${plan.gate}). On gate failure
  return gate_failed` clause (line 400).

Confirmed live at HEAD: `grep -cF 'TMPDIR='` on `workflow-template.js` returns **0** (so does `TMPDIR|mktemp`).
The gate does not catch the drift:
[refinery-surface.test.sh PRESENCE CHECK 4](../../skills/war/assets/refinery-surface.test.sh) (line 192)
asserts `grep -qF 'TMPDIR=' "$REFINER_FILE"` against `war-refiner.md` **only** — never against `WORKFLOW_FILE`
(already defined at line 68). This is a completeness/parity gap, not a correctness defect: the standing `.md`
keeps merge-task covered in practice, and severity is further capped because **BSD `mktemp` ignores `TMPDIR`**
(memory: `bsd-mktemp-ignores-tmpdir-gnu-only`) — the pin is only load-bearing on GNU-coreutils CI; on macOS it
is a no-op. Root cause: `standing-instruction-vs-dispatched-prompt-coverage-split`.

## Decisions
- **D1 — Literal mirror, not a re-author.** Copy the ratified war-refiner.md:24 wording verbatim into both
  dispatch fragments. Do NOT generalize, re-word, or invent a new abstraction. The directive is already ratified;
  parity means byte-uniform text, not a fresh design.
- **D2 — Pin BOTH fragments (merge-task + land-phase).** Investigator's recommended default. `_refinery` (where
  the land runs) has no `.war-task` marker of its own, but the gate's discovered `*.test.sh` meta-tests can still
  materialise scratch dirs colliding with ANY ancestor `.war-task`. Pinning both is one mirrored clause in two
  places and lets the test assert `count >= 2`, which a partial fix fails RED.
- **D3 — Wire the parity fix into the gate, same task/commit.** Extend PRESENCE CHECK 4 to also assert against
  `WORKFLOW_FILE` (`count >= 2`). Without this the two surfaces re-drift silently.
- **D4 — Assert the literal token `TMPDIR=`, not `war-task-free`.** Drift-resistant per the existing comment at
  refinery-surface.test.sh:185-187 — the backtick in `` `.war-task`-free `` splits the substring.
- **D5 — Do NOT touch war-refiner.md's own land-phase step or SKILL.md.** war-refiner.md's land-phase step is
  the same omission class, but symmetric-doc is out of strict scope for #184. Deferred-with-note (see below).

## Solution shape

Prompt/doc + test. Three tiny string edits and one test-assertion extension. **No production logic, no
control-flow, no schema.** The added wording is a verbatim mirror of war-refiner.md:24.

1. **workflow-template.js merge-task clause (line 316)** — append a TMPDIR clause to the existing
   `Run the gate (${plan.gate}) after the rebase in the task worktree;` sentence: run the gate with `TMPDIR`
   set to a fresh `.war-task`-free dir (`TMPDIR=$(cd / && mktemp -d)`) so meta-tests that materialise scratch
   dirs isolate from the worktree's `.war-task` marker; the gate's cwd stays the task worktree.
2. **workflow-template.js land-phase clause (line 400)** — mirror the same clause into the
   `Merge: ... Run the gate (${plan.gate}). On gate failure return gate_failed.` sentence. Keep the existing
   detached-land tokens intact (`checkout --detach` at line 398, `_refinery`, `merge --no-ff`) — PRESENCE/ABSENCE
   checks 2/3 assert on them.
3. **refinery-surface.test.sh PRESENCE CHECK 4 (line 192)** — add a sibling assertion against `WORKFLOW_FILE`
   (already defined at line 68): `[ "$(grep -cF 'TMPDIR=' "$WORKFLOW_FILE")" -ge 2 ]`. A partial fix (one
   fragment pinned) fails RED.

## Affected files

- [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) — merge-task
  `merge:` prompt gate clause (line 316) **and** land-phase `land:` prompt gate clause (line 400): append the
  TMPDIR mirror clause to each. **Shared file with G1** — see contention note below.
- [`skills/war/assets/refinery-surface.test.sh`](../../skills/war/assets/refinery-surface.test.sh) — extend
  PRESENCE CHECK 4 (line 192) to also assert `grep -cF 'TMPDIR=' "$WORKFLOW_FILE" >= 2`. **G2-only.**
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` — version bump (see below).

## Test plan

TDD, one slice. `refinery-surface.test.sh` is already a discovered `*.test.sh` runner, so extending PRESENCE
CHECK 4 needs **no new wiring** — the self-discovering gate picks it up (F12 lesson).

1. **RED** — extend PRESENCE CHECK 4 with the `WORKFLOW_FILE` sibling assertion
   (`grep -cF 'TMPDIR=' "$WORKFLOW_FILE"` `>= 2`). On current HEAD `workflow-template.js` has **0** `TMPDIR=`
   hits, so the check fails. Run `bash skills/war/assets/refinery-surface.test.sh` → RED.
2. **GREEN** — apply the two prompt edits (lines 316, 400). Re-run → count is 2, check passes.
3. **Full gate** — run the self-discovering multi-runner and confirm no ABSENCE-check regression:
   ```
   node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
     -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
   ```
   (Quote the node glob — bash 3.2 under-covers unquoted.) The proposed clause `TMPDIR=$(cd / && mktemp -d)`
   introduces **no** `checkout origin/`/`switch origin/` (non-detached) token and **no** "from the Lead"
   positive-instruction token, so ABSENCE checks 2/3 stay green — re-run to confirm.

Assert on the literal token `TMPDIR=` (D4); do NOT assert the contiguous `war-task-free` substring.

## Alternatives considered

- **Pin only merge-task, leave land-phase unpinned with a one-line comment** (the lighter option). Rejected:
  `_refinery`'s discovered meta-tests can still materialise scratch dirs colliding with an ancestor `.war-task`,
  and pinning both is the same single clause; the `count >= 2` assertion is strictly stronger than `count >= 1`.
- **Centralise the TMPDIR pin into one shared template constant.** Rejected: over-build for three string edits
  of already-ratified wording (no new abstraction, D1). The pin is short enough to mirror inline.
- **Generalize/re-word the directive for clarity.** Rejected: the wording is ratified at war-refiner.md:24;
  re-authoring risks drift and re-litigation for a Minor parity gap.

## Out of scope / Deferred

- **war-refiner.md's own land-phase step + SKILL.md gate contract prose** — war-refiner.md land-phase (step 2)
  is the same omission class (only merge-task step 2 carries the pin). Symmetric-doc is **deferred-with-note**:
  the WAR run must close #184 WITH a note that this surface remains unpinned, not imply full TMPDIR parity across
  all refiner surfaces. Track as a follow-up.
- Any production JS logic, schema, or control-flow change — none touched.
- The G1 auditor gate-audit surface (`gate-audit:` execution-evidence lens, lines 336-369) — disjoint construct
  and root cause; that is #117/#193's lens, not this prompt-hermeticity surface.

## Version bump

Replace-in-place all four canonical slots to **0.7.2** (after G1 lands at 0.7.1):

- `.claude-plugin/plugin.json` — `version` (currently `0.7.0` at HEAD; G1 advances to `0.7.1`).
- `.claude-plugin/marketplace.json` — `metadata.version` **and** `plugins[0].version` (do not omit the second;
  stale = silent no-op release).
- `README.md` `## Status` — replace-in-place (the slot currently holds the 0.7.0 manifest paragraph; G1 replaces
  it with a 0.7.1 paragraph). Write a 0.7.2 dispatched-gate-run-TMPDIR-parity paragraph, lineage
  "Builds on v0.7.1". No badge.

## Serial landing / shared-file contention

**G2 lands AFTER G1 (v0.7.1).** Both groups edit `skills/war/assets/workflow-template.js`, but in **disjoint
regions**:

- G1: the auditor gate-audit surface (lines 317/321/344-351) — the `integration_sha`/execution-evidence lens.
- G2: the gate-RUN dispatch clauses at **line 316** (merge-task) and **line 400** (land-phase).

G1 amends the existing `gate_output` clause at line 317 (adding `integration_sha` population), which sits
**adjacent** to G2's merge-task clause (line 316).
The spec writer/worker MUST verify there is **no textual overlap** when applying G2's line-316 edit on top of
the landed G1 tip — re-anchor on the named construct (`merge:${r.task.id}` agent call, the
`Run the gate (${plan.gate}) after the rebase in the task worktree` sentence) rather than a literal line number,
since G1 may have shifted lines. `refinery-surface.test.sh` is G2-only — no contention there.

## Coverage

| Issue | Coverage |
|---|---|
| #184 | full (both dispatched gate-run prompts pinned + gate assertion extended); deferred-with-note: war-refiner.md land-phase step + SKILL.md symmetric-doc — close #184 WITH that note |
