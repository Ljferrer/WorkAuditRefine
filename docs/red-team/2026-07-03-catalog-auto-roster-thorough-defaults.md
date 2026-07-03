# Red-team report — Catalog-composed `auto` rosters + auditor-nominated widening (RE-SCOPED)

**Plan:** [docs/plans/2026-07-03-catalog-auto-roster-thorough-defaults.md](../plans/2026-07-03-catalog-auto-roster-thorough-defaults.md)
**Run:** `wf_8e0c5607-7c3` (task `wq44bh648`) · 9 probes (6 spine + 3 bespoke), each adversarially confirmed.
**Sandbox tip:** `3bc3d86` (plan-3 branch, later rebased to `d24e615`); `#472` = `328cfda`.
**Verdict:** **CLEAR** — one genuine internal-consistency blocker patched; one doc nit patched; all remaining
fails adjudicated as out-of-scope (AFK self-adjudication, operator's mid-campaign re-scope is authoritative).

## Probe results

| Probe | Kind | Status | Disposition |
|---|---|---|---|
| claims-vs-reality (repo state/preconditions) | spine | pass | — |
| executable-proof | spine | fail | **PATCHED** (blocker, see F1) |
| coverage-vs-source | spine | fail | Out-of-scope misfire + observation (F2, F3) |
| consistency-placeholders | spine | fail | **PATCHED** (nit F4) + explained (F5) |
| dependency-feasibility | spine | pass | — |
| intent-vs-plan | spine | pass | — |
| widening-anchors-present | bespoke | **pass** | Confirms Task 1 code anchors are correct |
| no-472-conflict | bespoke | **pass** | Confirms the re-scope resolved the #472 config conflict |
| task2-docs-nonredundant | bespoke | fail | **Inverted pass** — confirms Task 2 has real (non-#472) work (F6) |

## F1 — End state 4 unmeetable within declared scope (Major, CONFIRMED) → PATCHED

End state condition 4 requires *"no surface still describes the old binary `auto` or the old trio-only
autoEscalate."* But Task 2's Files list omitted `README.md` and `skills/war-room/SKILL.md`, and #472
(`328cfda`) updated only the **model-tiering** prose in those two files — it left the `auto`-**semantics**
untouched: `war-room/SKILL.md:12–13` still reads "1–3 / 1–5 seats by blast radius" and `:22` "union-widens
with the default roster's lenses" (trio-only); `README.md:141` still reads "auto-seeds … 1–3 seats by blast
radius." As written, End state 4 was unmeetable.

**Fix applied:** added `README.md` + `skills/war-room/SKILL.md` to Task 2 (scoped to the `auto`-semantics +
widening clauses **only**, explicitly not #472's model-tiering prose), with a per-file bullet each; corrected
the RE-SCOPE NOTE + Task 2 directive to distinguish "model-tiering prose (#472's, don't touch)" from
"`auto`-semantics + widening prose (Task 2's job, wherever it lives)." This matches the plan's own
Build-order rationale (line 47–48), which already anticipated README prose riding the Task 2 → Task 3 phase
edge. No new Task 1 ∩ Task 2 collision (Task 1 touches only `war-config.mjs`/`workflow-template.js` + tests).

## F2 — NYI deliverables graded as precondition gaps (7× Major, CONFIRMED) → out-of-scope misfire

`coverage-vs-source` flagged `resolveWidenSource`, `RESERVED_LENSES`, `AUDIT_VERDICT.widen`, the inline
mirror, the auto-escalate wiring, and the binary-`auto` SKILL.md line as "missing preconditions." These are
the plan's **deliverables** — exactly what Task 1/Task 2 create — not preconditions. This is the known
`redteam-claims-vs-reality-misfires-on-impl-plans` pattern (a lens grading not-yet-implemented work as
Critical/Major gaps). The `widening-anchors-present` bespoke probe **passed**, independently confirming the
plan's code anchors (lone-seat block `~:446`, `widenRoster :143`, `AUDIT_VERDICT` schema) resolve correctly
against the real tree. **Non-blocking.**

## F3 — #472 left `DEFAULTS.profile = 'balanced'` (Major, CONFIRMED) → observation, out of plan-3 scope

`coverage-vs-source` noted spec D3 wants `DEFAULTS.profile → 'thorough'` but `328cfda` shows `'balanced'`.
This is a **#472 completeness question**, not a plan-3 obligation: the operator's re-scope explicitly keeps
#472's config verbatim and drops D2/D3/D5. Recorded here as an observation for the operator to weigh
separately; **not a plan-3 blocker.**

## F4 — Test-plan item numbering off-by-one (Minor, CONFIRMED) → PATCHED

Plan said "items 4–10" but the mapped tests include spec item 3 (`resolveWidenSource` matrix). Changed to
"items 3–10."

## F5 — Task 3 `deps: none` vs spec "depends on Tasks 1–2" (needsDecision, CONFIRMED) → explained, no change

Task 3 is in **Phase 2**; the phase edge serializes it after Phase-1 Tasks 1–2. Intra-phase `deps` are moot
across a phase boundary, and the plan already states "deps: none (the phase edge does the ordering)."
Deliberate and correct; no change.

## F6 — task2-docs-nonredundant "fail" (6× CONFIRMED) → inverted pass

This bespoke probe verified the 6 surfaces Task 2 targets still describe the OLD mechanism — i.e. Task 2's
work is genuinely needed and **not** redundant with #472. A "fail" here is the *desired* outcome. It also
independently surfaced the same README/war-room semantics gap as F1 (now patched).
