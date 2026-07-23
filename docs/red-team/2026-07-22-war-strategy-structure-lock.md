# Red-team report — war-strategy structure lock (two-site location-anchored lock)

- **Plan:** `docs/plans/2026-07-22-war-strategy-structure-lock.md`
- **Source spec:** `docs/specs/2026-07-22-war-strategy-structure-lock-design.md`
- **Repo base:** `dev/2026-07-22-war-strategy-structure-lock` @ `9d4ec15` (campaign plan 9 of 9)
- **artifactKind:** `impl-plan`
- **Verdict:** **CLEARED-WITH-NOTES** (1 round; zero blockers, zero `needsDecision`; one Minor patched to harden a durable-lesson caveat)
- **Run:** `wf_4b9a3f74-f40` (task `wi27bz2vt`) — model opus / effort high

## Attack surface

- **Executed proof:** 3 probes (2 bespoke + 1 spine) — `fragment-uniqueness-and-discrimination`, `grep-c-counts-lines-not-occurrences`, and the spine `executable-proof`. All in throwaway sandboxes (`cp -R`); target repo never mutated (escape guard exit 0).
- **Analyzed:** 6 probes (5 spine + 1 bespoke `cross-plan-contention`).
- **Coverage:** expected 9, on-target 9, offTarget 0, dropped 0 — coverage whole.
- **Lead-run checks:** backstop-legitimacy (declared `None` — a valid, complete declaration; every §10 criterion runs in-task or at the refiner gate) + the two drift-guard spine probes (`unguarded-new-mirror` vacuous — no inline mirror of a canonical export; `default-flip-old-absent` folded into `fragment-uniqueness-and-discrimination` step D — the new anchors assert each site's presence *independently* and the OLD bare lock's insufficiency is proven). `ff-topology` not mandated — no merge-commit topology anchored.

## Executed proof — highlights

- **`fragment-uniqueness-and-discrimination` (PASS) — the lock-granularity premise proven.** In a `cp -R` sandbox: both proposed anchored fragments `grep -cF` = 1 against `SKILL.md` (§2 at L106, §4 at L195), bare token = 2 lines. Applying Task 1.1's edit (bare `check_f 'plan-literal-lint.mjs'` → two location-anchored `check_f` fragments) and running the edited test against byte-unchanged `SKILL.md` exits 0 with both new `ok -` lines. Discrimination holds: deleting the §2 sentence reds the §2 anchor; deleting the §4 lint-step line reds the §4 anchor (each independently). OLD-lock contrast (folds `default-flip-old-absent`): under the original bare lock, a single-site deletion stays GREEN — proving the granularity gap the plan closes.
- **`grep-c-counts-lines-not-occurrences` (probe warn → finding DISPROVEN by adversarial-confirm; caveat verified accurate).** The probe's first run reported `grep -oc` = 3 (occurrences) and concluded the caveat false on BSD. The self-confound gate caught the confound: this environment's `grep` is a shell function execing **ugrep 7.5.0** (a third-party drop-in), not BSD grep. The **real** system BSD grep (`/usr/bin/grep`, 2.6.0-FreeBSD) on the same fixture (`foo foo\nfoo\n`) returns `grep -c`=2, `grep -oc`=2, `grep -co`=2 (all line-counts), `grep -o | wc -l`=3 — **confirming the plan's caveat for BSD grep**. Re-verified by the Lead deterministically (`/usr/bin/grep -oc 'foo'` = 2). GNU grep is not installed here; the caveat's BSD half is confirmed, the GNU half is the documented stock behavior.
- **`executable-proof` (spine, PASS):** plan commands/snippets execute as written in the sandbox.

## Analyzed — highlights

- **`cross-plan-contention` (PASS):** plan 9's write set (`skills/war-strategy/war-strategy-structure.test.sh` + `docs/learnings/structure-test-check-f-locks-…-location.md`) is disjoint from every sibling. Plan 9 never edits `plan-literal-lint.mjs` (only locks a `SKILL.md` reference to it); the immediately-below sibling plan 8 left `plan-literal-lint.mjs` untouched (one of its three already-normalized survivors), and did not touch the two §-site lines the locks target.
- Spine `claims-vs-reality`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`: all pass, no findings.

## Findings and resolutions

### Minor — patched (grep-c caveat hardened for durability)

`grep-c-counts-lines-not-occurrences` surfaced a Minor: the caveat destined for a durable learnings file asserted "`-o` is overridden by `-c` on GNU and BSD grep". That is **true** for the greps it names (re-verified against real BSD grep), but this very environment ships a `grep` shim (ugrep) where `-oc` counts *occurrences* — so a future agent verifying the claim in-shell (as Task 1.2 instructs) would hit the exact confound the probe did.

**Adjudication (AFK self-adjudicated):** the core claim is correct; the risk is a durable lesson under-specifying the tool. **Patched** Task 1.2's caveat wording to the robust framing: a bare `grep -c` is a **line-count regardless of `-o` on the stock GNU and BSD greps** (verified against `/usr/bin/grep`), plus an explicit environment caveat that a `grep` shimmed to a drop-in such as ugrep may count occurrences under `-oc` — so option (a)'s explicit-location anchor is the safe choice either way. End state 4's generic "counts-lines-not-occurrences caveat" wording is already accurate and unchanged.

### Auto-noted (Minor, non-blocking)

- **AI-drafted intent (`intent-vs-plan`, probe PASS):** the `## AI-Commander's Intent` block is AI-drafted under `/war-machine --afk` (ADR 0014), no operator ratification — the plan's own heading marks this. Intent is well-formed: End-state conditions 1–5 each individually checkable, each mapped to a task (E1–E4 → 1.1/1.2; E5 → refiner gate), collectively sufficient for the Purpose. Ratification path is this red-team validation; human upgrade path is `/war-strategy <plan>`.
- **Backstops declared `None`:** a valid, complete declaration — every spec §10 criterion executes in-task (uniqueness counts, RED discrimination probe, structure-test green, redaction lint, frontmatter byte-identity) or at the refiner gate (full shell suite via `resolveGate` self-discovery). The RED probe's evidence is deliberately uncommitted (done-report only), so gate-audit treats any cannot-confirm on it as SOFT, never a hold.

## Spine lenses — all pass

`claims-vs-reality`, `executable-proof`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility`, `intent-vs-plan` — 6/6 pass (the sole `intent-vs-plan` Minor is the AI-drafted note above).

## Adjudications

| # | ruling | route | re |
|---|--------|-------|----|
| 1 | The Task 1.2 grep-c caveat is TRUE for the greps it names (BSD confirmed via `/usr/bin/grep`; GNU is stock behavior), but **this environment's `grep` is a ugrep shim** where `-oc` counts occurrences. Worker (task 1.2) verifying the claim in-shell must use `/usr/bin/grep` (or note the ugrep shim), and write the hardened caveat wording — prefer option (a) regardless. | red-team r1; **patched** (Task 1.2 caveat) | Probe's first run measured ugrep and mislabeled it BSD grep; self-confound gate corrected it. Durable lesson must not under-specify the tool. |
| 2 | AFK provenance standing — `## AI-Commander's Intent` is AI-drafted (ADR 0014), no operator ratification; intent is the ceiling, plan slice the floor. Backstops `None` is a complete declaration. | auto-noted; ratified | Intent carries no operator ratification. |
