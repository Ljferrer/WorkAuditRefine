# Red-team — 2026-07-24-memory-tooling-hardening

**Verdict: CLEARED** (after 1 round + patch, 2026-07-26). `/war` may execute this plan.

Plan: `docs/plans/2026-07-24-memory-tooling-hardening.md` · Source spec:
`docs/specs/2026-07-24-memory-tooling-hardening-design.md` · `artifactKind`: `impl-plan` ·
repo: dedicated worktree `_redteam-plan6` @ `23f853c` (plan 5's Phase-2 merge — the
stack-and-plow base, ADR 0011) · Campaign plan **6 of 6**, last in the stack.

## Coverage

| | |
|---|---|
| Probes | 13 (6 spine + 7 bespoke) — 7 executed, 6 analyzed |
| Probe status | 4 pass · 5 fail · 4 warn |
| Coverage | expected 13, on-target 13, off-target 0, **dropped 0** — not `INCOMPLETE` |
| Adversarial confirm | 5/5 `reproduced: true`; self-confound gate passed on every one |
| Escape guard | `assert-no-repo-escape.sh --repo <worktree>` → **exit 0** (clean tree, no junk refs) |

Round-1 gate: **BLOCKED** — 6 blocker rows over **5 distinct defects** (two pairs were the
same defect independently found by two probes), plus 8 minors.

Every blocker was independently reproduced by the Lead at the plan-6 base before any patch
was written, per the recorded `reproduce-a-gate-blocker-before-patching-or-escalating` and
`verify-stacked-plan-facts-at-campaign-base-not-lead-worktree` lessons. **All five
reproduced.** One reproduction attempt initially returned a false negative: blocker III's
quoted sentence wraps across plan lines 284–285, so a single-line `grep 'sits before the'`
found nothing. A line-wrap-safe re-check (`tr '\n' ' '` then grep) found it — the exact
failure mode recorded in
`misattribution-pairing-spanning-two-lines-defeats-line-based-repo-grep`. Had the Lead
stopped at the first grep, a real Major would have been dismissed as a probe hallucination.

## Blockers and resolutions

### I — Critical: the specified `--target` guard *accepts* the bare flag

Found by `executable-proof` **and** `consistency-placeholders` independently.

The draft's three-way resolution read: `argv.target === undefined` → default; otherwise
`const t = Number(argv.target)`; `Number.isFinite(t) && t > 0` → accept; otherwise refuse.
`parseArgv` maps a bare `--target` to boolean `true`, `Number(true) === 1`, and
`Number.isFinite(1) && 1 > 0` is true — so the bare flag took the **accept** arm with
`target = 1`, reproducing the exact #1059 defect the task exists to close. The plan's four
refusal cases reduced to three, and the one it calls **mandatory** did not fire.

The plan was also internally contradictory: End state 1 expects the stderr diagnostic to
render the token as `true`, which can only happen if a boolean reaches the refusal arm —
which the stated predicate guaranteed it never would.

`executable-proof` implemented the draft guard verbatim in a sandbox copy of
`war-memory.mjs` and ran all four cases: bare `--target` → exit 0 with
`{"target": 1, "verdict": "warn", "cutIndex": 3}`, byte-identical to the pre-guard run.
It then proved the fix and ran the suite green (82 pass, 0 fail).

**Resolved — mechanical, no operator decision.** Task 1.1's Plan slice now specifies
`const t = typeof argv.target === 'string' ? Number(argv.target) : NaN;`, with the
`typeof` test called out as load-bearing rather than defensive padding, an explicit
`argv.target === true` → refuse branch named as the equivalent alternative, and a
prohibition on any resolution that reaches `Number()` with a non-string. Lead
re-verification of the patched resolution:

| case | today | drafted guard | patched guard |
|---|---|---|---|
| flagless | 17000 | 17000 | 17000 |
| bare `--target` | 1 | **1** ← defect | REFUSE |
| `--target 2000` | 2000 | 2000 | 2000 |
| `--target abc` | NaN | REFUSE | REFUSE |
| `--target 0` | 0 | REFUSE | REFUSE |
| `--target -5` | -5 | REFUSE | REFUSE |

### II — Major (`needsDecision`): the "lessons live in the local memory root" premise is false

Found by `claims-vs-reality` **and** `intent-vs-plan` independently.

The draft carried no `docs/learnings/` files at all, justified by the claim that its three
backing lessons "live in the local memory root, which task worktrees cannot see." All
three are committed at the **repo** root and plainly visible in the plan's own base.
Spec §9 defers "lesson-file updates" but never claims they are local-root-only — the plan
invented that premise. The servitor could not have run the backstop as written either: it
is write-scoped to the local memory root, so a repo-root stamp needs the reviewed-PR path.

**Operator ruling: stamp in-task** (option a — the plans 1–5 convention). Deferring would
have shipped a release whose own corpus asserts the defects are live; the tighten lesson's
`description` becomes code-traceably false the moment Task 1.1's guard lands.

**Resolved.** Each lesson is added to its owning task's `Files:` list with a stamp
instruction (1.1 → tighten, 1.2 → seeding, 1.3 → die), keeping the three tasks
file-disjoint. New **End state 9** ("Records true") is explicitly **phase-scoped** — the
tighten lesson's stamp names both arms (1.1's CLI paths and 1.2's fence) and is only true
once both have merged, so Task 1.1's plan slice warns an auditor not to read it as a claim
about the fence at that task's own scope. Backstop row 1 is rewritten from "stamp the
lessons" to "confirm all three stamps on the integrated Phase-1 tip" — the only part that
genuinely cannot run inside one task's diff.

### III — Major: the unknown-verb "routes through the catch **or** sits before the `try` — either"

The two options are not equivalent, and the second breaks the stated contract. `main()` is
called at module scope from the realpath-normalized CLI-entry guard with **no enclosing
try**. Once `die()` becomes a throw (the task's core change), an unknown-verb refusal
placed before the try escapes uncaught: Node prints a stack trace instead of the clean
`seed-pack: unknown verb '<x>'. Verbs: pack, verify, evict`. The same paragraph already
says `main()` wraps "the verb lookup" *inside* the try — the sentence self-contradicts.

No case in `seed-pack.test.mjs` exercises the unknown-verb path (`grep 'unknown verb'` on
that file returns nothing), so End state 6's byte-stability proof would **not** have caught
the regression.

**Resolved — mechanical.** The alternative is dropped; the refusal is pinned inside the
`try`, with the reason stated (module-scope call site, no enclosing try) and the escape
hatch bounded: a worker who insists on placing it earlier must keep a direct
`process.stderr.write` + `process.exit(1)` and never call the now-throwing `die()`. Direct
precedent: plan 5's round-1 ruling dropped its `rev-list` alternative for exactly this
class — a non-equivalent "either" in a plan slice.

### IV — Major (`needsDecision`): backstop entry 2 is stale *and* redundant

The entry deferred `seed-pack.mjs verify docs/seed` to "the Lead at Phase-1 land",
justified by "the campaign's plan 1 re-packs `docs/seed/` and lands **before** this plan."
Both halves are dead at the live base:

1. Plan 1 **already landed** — its re-pack (`1272c00`, #1092) is in this plan's own frozen
   base, and this is plan 6 of 6 with no later re-packer. There is no
   task-base-vs-integrated-tip gap for `docs/seed`.
2. An exact pre-merge proxy already runs **inside the plan's own gate**:
   `skills/lessons-learned/seed-set.test.mjs:24` spawns
   `node <seed-pack.mjs> verify <repo>/docs/seed` and asserts exit 0, with a discriminating
   one-byte-mutation twin. That file matches the gate glob `skills/**/*.test.mjs`, so
   Task 1.3's worker necessarily runs the deferred command against the **reworked**
   verifier and the **shipped** artifacts before merge.

The probe also corrected its own brief: `seed-pack.test.mjs` does *not* cover this — every
case there builds synthetic `mkdtempSync` fixtures; the shipped-corpus coverage lives in
`seed-set.test.mjs`.

**Operator ruling: drop the entry and pin the gate test** (option a).

**Resolved.** Backstop entry 2 is deleted. Task 1.3 now carries a "do not 'fix' the proxy"
instruction requiring `seed-set.test.mjs` to stay **green and byte-unmodified**, and End
state 6 is extended to name it as the pre-merge proof of the shipped-corpus half. ADR 0017
is satisfied — the validation moved *into* the gate, not into prose. The stale Notes
sentence that cited the retired backstop ("The deferred shipped-seed verify backstop
confirms the final pairing") was rewritten in the same pass.

### V — Minor + `needsDecision`: the seeding.md branch predicate contradicts its own prose

Task 1.2 stated the branch condition as "the repo-learnings-dir-present case"; the prose
directly above the fence — which the plan says is *already correct and stays* — reads
"passing `--repo docs/learnings/` **iff** `$REPO_ROOT` is non-empty". Non-equivalent
predicates: a repo can resolve with no `docs/learnings/` yet, and the converse. A worker
following the plan's wording would write a branch comment contradicting the untouched prose
**in the very block whose defect is prose/fence incoherence**.

**Operator ruling: pin `$REPO_ROOT` non-empty** (option a).

**Resolved.** Task 1.2 now names the prose as the authority on the predicate and requires
the branch comments to restate that test. Spec §3 row D4 states it the other way; that row
is recorded in the plan's Notes as a **survey-derived correction** — non-authoritative on
this point, reconciled toward the checkable surface, in the same class as version literals
and construct citations in specs. The spec file itself is left unedited (`/red-team`
patches the plan, never the ratified spec).

## Minors — all absorbed, none deferred

Eight minors were folded into the same patch rather than carried as notes. Four corrected
plan prose that was **mechanically wrong** about how the code behaves — the exact class
that got plan 5 stuck for four rounds:

- **Purpose, `--target abc`:** claimed it "collapses to the 17,000 B advisory as if the
  flag were never passed." It collapses to **NaN** — `target: null`, null cut goal, and an
  **empty** strike list. On a 150-lesson over-budget fixture the default path pre-selects
  58 strikes and the NaN path selects zero. Only the *verdict* coincides.
- **Purpose, zsh threading:** claimed `${TIGHTEN_TARGET:+…}` "drops the flag entirely
  under zsh." It **fuses** it — zsh does not word-split unquoted parameter expansions, so
  the expansion yields one argv word `--target 2000`, which `parseArgv` keys as
  `{"target 2000": true}`, leaving `argv.target === undefined`. Measured under bash 3.2.57
  (argc=9) vs zsh 5.9 (argc=8, and identical under `zsh -f`, so not an rc artifact). The
  observable end state coincides with "dropped", so no downstream reasoning mis-derived —
  but the plan's own Method clause was already exact and the Purpose sentence was not.
- **Task 1.3 hygiene test:** claimed a bare `env: { TMPDIR }` makes "the system `tar` spawn
  fail… exits 1 via `runTar`'s refusal." Wrong in both halves. It strips `PATH`, so the
  test's own `spawnSync('node', …)` cannot resolve the interpreter: `error: ENOENT`,
  `status: null` — no child process, no exit code at all. And `spawnSync('tar', …)`
  resolves fine under the same PATH-less env. The instruction (`{ ...process.env, TMPDIR }`)
  was right; the rationale a worker would verify against was not.
- **Task 1.2 lock numbering:** "continuing the file's `(N)` lock numbering at the next free
  numbers" — the file carries no monotonic file-global sequence. Numbering restarts per
  task banner, and 17–21 are each already used **twice**. "Next free" had no well-defined
  value. Now: number sequentially within the new banner.

The remaining four:

- **migration.md disposition** (found twice): the plan cleared "migration.md's two
  `--repo`-less render lines" as "the deliberately local-only **evict** path, guarded by
  the existing evict lock." Only **one** is. `migration.md:187` is the Evict-section
  re-render and is what `lineWith(migration, 'evicted rows lose their')` anchors on;
  `migration.md:111` sits under `## Step 4 — keywords backfill` on the **migrate** path,
  local-only for an unrelated reason (the repo root is not populated until Step 5) and
  guarded by **no** lock. The outcome (leave both alone) was right; the justification was
  false for one line, and a worker would have gone looking for a lock that does not cover
  it. Corrected in Task 1.2 and End state 7.
- **Absence-lock scope:** Task 1.2's clause (ii) claimed the whole-file `TIGHTEN_TARGET`
  assert "locks the prose against a reintroduced set-then-thread instruction." It is
  *token*-scoped, not shape-scoped. The probe built the lock in a sandbox and ran an
  8-case reintroduction matrix: it reds on fence-level `${V:+ --target $V}`,
  `${V:+"--target=$V"}`, and prose-only `TIGHTEN_TARGET`; it passes green on prose-only
  `${V:+ --target $V}` under a renamed variable, and on `:+` threading added to a
  *different* SKILL.md fence. Control case `${V:-17000}` correctly stays green. The plan
  now states the real scope and explicitly declines to widen the lock beyond what End
  state 3 claims.

## What held up

Four probes returned clean, and two of the three load-bearing baseline reproductions
confirmed the plan's red-today claims exactly:

- `seed-pack-tmpdir-leak-repro` — **pass**. The leak is real and on the described path.
- `sweep-disposition-completeness` — **pass**. Both sweeps run verbatim; every hit is
  accounted for by the plan's four-item disposition list. No undispositioned live site,
  no phantom disposition, nothing outside `skills/`/`hooks/` in a copy-pasteable fence.
- `coverage-vs-source` — **pass**. Every End state maps to a task slice and a mapped test.
- `dependency-feasibility` — **pass**. Three file-disjoint tasks, no deps edges, release
  trailing in its own phase.

The `zsh-dialect-threading-repro` probe confirmed the **divergence is real and the fix is
fully motivated** — it corrected only the mechanism sentence, not the remedy. Task 1.2
retires the expansion regardless, and Task 1.1's `argv.target === undefined` default arm is
correct under the true (fusing) mechanism as well as the claimed (dropping) one.

## Re-gate

All 13 findings were patched into the plan. Re-gate over the open set, with the coverage
shape (fingerprint, repo, expected, per-probe `read_anchor`) carried through intact so the
pass cannot be bought by going blind:

```
verdict: CLEARED · blockers 0 · needsDecision 0 · minors 0
summary: probes 13, expected 13, onTarget 13, offTarget [], dropped []
```

## Residual risks (accepted, not blocking)

- **The absence lock stays token-scoped.** A `:+` respelling under a different variable
  name, in prose or in another SKILL.md fence, is caught only by End state 7's one-time
  sweep, not standing. Widening it is a one-line addition
  (`assert.doesNotMatch(skill, /\$\{[^}]*:\+/)` whole-file, verified in sandbox to red on
  both escape cases while staying green on the rewritten fence and on `${V:-…}`) —
  deliberately deferred because it exceeds what End state 3 claims. Worth a follow-up
  issue if `:+` threading ever reappears.
- **`migration.md:111` remains unguarded.** Correctly cleared, but nothing stops a future
  edit from adding `--repo` to the migrate Step-4 confirm-render, where no repo root exists
  yet. Out of this plan's footprint.
- **The exit-1 collision between `EXIT_REFUSE` and an untagged crash is unchanged** — the
  plan documents this as pre-existing and accepted (grill Q12). The catch distinguishes by
  the tagged `exitCode` property and the stderr channels differ; no test asserts it in
  either direction. Unchanged by this red-team.
- **End state 9 is phase-scoped, not task-scoped.** No single task's gate-audit can confirm
  all three lesson stamps, and the tighten stamp is only true after 1.1 and 1.2 both merge.
  Backstop row 1 owns it at Phase-1 land. An auditor scoring Task 1.1 alone should treat
  the tighten stamp as out-of-scope, per
  `gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream`.

## Adjudications

| # | Question | Ruling | Applied |
|---|---|---|---|
| II | Lesson stamps: in-task vs corrected deferral | **Stamp in-task** (plans 1–5 convention) | Files lists 1.1/1.2/1.3, End state 9, backstop row 1 rewritten, Notes premise corrected |
| IV | Backstop 2: drop / narrow / keep | **Drop, pin the gate test** | Entry deleted, Task 1.3 + End state 6 pin `seed-set.test.mjs` green and byte-unmodified |
| V | seeding.md predicate authority | **`$REPO_ROOT` non-empty** | Task 1.2 predicate pinned, spec D4 recorded as survey-derived correction in Notes |

Blockers I and III were patched without escalation: both are plan-internal contradictions
with a single correct resolution proven by executed probe evidence, not choices between
viable options.
