# Red-Team Report — Committed Repo Provisioning Manifest (#51 · Part B D4)

**Plan:** `docs/plans/2026-06-26-committed-provisioning-manifest.md` · **Spec:** `docs/specs/2026-06-26-committed-provisioning-manifest.md`
**Date:** 2026-06-26 · **Verdict:** **CLEARED-WITH-NOTES** (Phase-0 design ratification; 1 real design hole found → patched)

> Run note: this is the plan's **Phase 0** — a design ratification gated before any code. Red-teamed against a clean
> `origin/dev` checkout (`68f288c`, plans 1–3 + plan-4 Phase 1/2 landed); plan-4's v0.6.9 release was still in flight, so
> the sandbox read v0.6.8.

## Attack surface
7 probes, coverage whole (expected 7 / on-target 7 / off-target 0 / dropped 0). 5 analyzed + 2 executed. Spine:
claims-vs-reality (fail — all "not-yet-built" misfire), executable-proof (**pass** — built `readManifest` from the plan,
all 6 cases green), coverage-vs-source (warn — 7/7 sub-items + Phase-0 gate + test plan + 9-point decision record all
mapped), consistency-placeholders (fail — version + clarity), dependency-feasibility (warn — version + clarity). Bespoke:
current-state-anchors (**pass** — every seam confirmed live), contract-stress (**warn** — the key probe; ratified the
contract + found one real hole).

## Design ratification (the executed proofs)
- **executable-proof** built `readManifest` verbatim per Task 1.1 Step 3 in a throwaway sandbox and ran the 6 plan test
  cases — all pass. The design is implementable as written.
- **contract-stress** independently confirmed the three contract pillars: (a) reusing `validateProvision` yields exactly
  the asserted `/provision\[1\].*non-empty/` error shape; (c) a manifest carrying its own `source` key IS rejected by the
  strict unknown-key check (the **assigned-not-declared** guarantee holds — a repo cannot lie about its authority tier);
  (d) **fail-loud** (`found&&!ok` ⇒ stop, do not fall through to CI) is expressible at the scout call-site given the
  `{found, ok}` shape.

## Finding & resolution applied
- **[Major — RESOLVED] `readManifest` crashes on non-object JSON.** `JSON.parse('null')` / `'[]'` / `'"x"'` / `'42'` all
  parse **without** throwing (no `SyntaxError`), so the plan's `catch → ok:false` does not fire; the next step
  `Object.keys(parsed)` (the strict unknown-key check) then throws an **uncaught `TypeError`** on `null`/scalars. This is
  the `json-parse-catch-misses-valid-scalar` pattern. **Resolution:** patched Task 1.1 Step 3 to add the standard guard
  `if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {found:true, ok:false, errors:[…]}`
  immediately after `JSON.parse`, and added a Step-1 test case (non-object JSON → `ok:false`). Also made explicit that the
  unknown-key check runs **independently of** `validateProvision` so the `source`-key rejection can't be short-circuited.

## Residual risk (notes — non-blocking)
- **[Minor — PATCHED] Task 1.2 reader test over-claimed "manifest beats CI".** `readManifest` reads only
  `.war-provision.json` and never consults `.github/workflows/`, so at the reader level it proves "returns the committed
  manifest list **verbatim**". Reworded Task 1.2 Step 1 accordingly; the manifest-beats-CI **precedence** is the
  **scout-level** golden (Task 2.1), where the fixture's competing CI workflow is the real input. Fixture kept.
- **[adjudicated] Version v0.7.0 (not the spec's v0.6.6).** Roadmap assigns plan 5 → v0.7.0 (minor, net-new capability) on
  plan 4's v0.6.9; the spec's v0.6.6 is the superseded standalone baseline. Plan/roadmap authoritative
  (`redteam-adjudication-is-authoritative-version-source`, `stacked-per-branch-releases-make-main-lag-cumulative`).
- **[Minor — noted] claims-vs-reality "Criticals" are the not-yet-built misfire** (`redteam-claims-vs-reality-misfires-on-impl-plans`):
  the probe graded the plan's own future work (readManifest absent, scout manifest tier absent, manifest-repo fixture
  absent, schemas "deferred-#51" note present) as defects. These ARE the work the plan describes — current-state-anchors
  confirmed every existing SEAM is live and the plan's "reserved-but-unemitted" premise is exactly true. Not defects.
- **[Minor — noted] Phase-0 gate criterion + Phase-4 ordering** clarified in the plan Notes: gate = CLEARED /
  CLEARED-WITH-NOTES (not BLOCKED/INCOMPLETE); T4.2 release lands after T4.1 schemas doc. The scout's "stop on
  `found&&!ok`" is an agent prompt directive, not code-enforced (`red-team-env-gap-warn-is-agent-directive-not-code-enforced`).

**Terminal verdict: CLEARED-WITH-NOTES.** Phase 0 ratified — Phase 1 is unlocked. Ready for `/war`.
