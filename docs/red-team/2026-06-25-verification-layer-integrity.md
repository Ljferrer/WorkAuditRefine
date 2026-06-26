# Red Team — Verification-Layer Integrity (F07 · F12) (2026-06-25)

**Verdict:** CLEARED-WITH-NOTES (adjudicated) — plan is sound; 7 genuine defects patched in place. Mechanical gate returned **BLOCKED (17 blockers)**; ~half are the documented impl-plan misfire (not-yet-built tasks graded "absent"). Verified against the **stacked base `b6493c6`** (plan 2 builds on the v0.6.1 audit-scheduler-integrity plan). Ready for `/war`.

## Attack surface
Spine (5) + bespoke (5): `anchor-mirror-check`, `resolvegate-contract-exec` (executed), `gate-baseline` (executed), `drift-test-feasibility`, `coverage-f07-f12`. Coverage 10/10 on-target, 0 off-target, 0 dropped (true BLOCKED). 3 executed in sandbox.

## Executed proof
- `gate-baseline`/`resolvegate-contract-exec`: confirmed the unquoted `node --test skills/**/*.test.mjs` is shell-dependent (bash 3.2 under-covers); the quoted form + the F12 `find`-based bash discovery work. **Surfaced a real gap: the repo has FOUR `*.test.sh` suites — the plan/spec name only three (omitting `skills/war/assets/refinery-surface.test.sh`).** The F12 self-discovery `find` clause catches it (validating the F12 design); the plan's own hardcoded dogfood gate did not.
- `anchor-mirror-check`: all inline mirrors exist and match canonical, but the cited line numbers drifted post-plan-1 (decideLand 291-295 → **372-374**; spawnOpts 94-98 → 95-99; covenSeats 158-166 → 166-169).
- `drift-test-feasibility`: the regex-extract + `new Function` rebuild is feasible; flagged that the inline closes over template-scope locals (`ROLE_MODEL`, `DEFAULTS`) that must be injected on rebuild, and the spawnOpts condition is written differently (logically equivalent — the undefined-effort row proves it).

## Findings (genuine defects) & Resolutions applied
1. **[Critical] Version drift** — plan targets v0.5.3 (below the live v0.6.1). → **Patched** to **v0.6.2** (Scope, Build order, Task 4, Open decision 3) + baseline-drift note.
2. **[Critical] Gate glob unquoted** + **only 3 of 4 bash suites** named. → **Patched:** gate block now quotes `'skills/**/*.test.mjs'` and uses F12 self-discovery (`find … *.test.sh`), covering all four incl. `refinery-surface`.
3. **[Major] Line-number drift** (decideLand 291-295 → 367-374, etc.; F07 spec also stale). → **Patched** Task 3 cites + a "extract by construct, not line" directive; spec back-port noted.
4. **[Major] Meta-guard markers not 1:1 with drift tests** — the line-93 marker covers BOTH spawnOpts+covenSeats; the line-69 `run.provision` marker is **data-only** (no canonical fn). A naive "every marker → a logic test" meta-guard fails. → **Patched** Task 3: registry must **classify** markers (logic-mirror → ≥1 test; data-mirror → allowlisted).
5. **[Major] Coverage meta-test missed node breadth** (Open decision #1). → **Resolved/patched:** Task 2 also asserts every `*.test.{mjs,js}` is reachable by the declared node glob.
6. **[Major] Signature reconciliation** — inline rebuild must inject `ROLE_MODEL`/`DEFAULTS`/`agents`; the spawnOpts undefined-effort row proves the `a.effort && …` vs `=== 'default'` equivalence. → **Patched** into Task 3.
7. **[Major] Incomplete bump list** — Task 4 omitted `marketplace.json`. → **Patched** (both fields + README Status replace-slot).

## Resolutions applied (decisions, `--afk` autonomous)
- Open #1 → add node breadth (patched). Open #2 → `resolveGate` still appends discovery under `overrides.gate` (patched). Open #3 → v0.6.2 standalone. F12 spec open-#2 (resolveGate ↔ Part B) → composes cleanly (provisioning is a separate barrier, not part of the gate string).

## Adjudicated as NON-defects (the misfire)
- `resolveGate` "does not exist", Task 2 grep-anchors "non-existent", drift tests "not implemented" — all correct for an implementation plan (the work `/war` will build); each maps to a task. F07→tests-only (D2 mirror-elimination deferred) and F12→self-discovery are documented operator supersessions, not gaps.

## Residual risk
- `find $(...)` word-splitting assumes test paths have no spaces (true today; accepted).
- Line numbers are advisory (drift); the plan now directs extraction by construct. Acceptable.
