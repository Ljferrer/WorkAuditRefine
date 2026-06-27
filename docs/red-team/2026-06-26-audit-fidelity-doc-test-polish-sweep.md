# Red-Team Report — Audit-Fidelity Doc-Drift & Test-Polish Sweep (#117 · #125 · #127 · #136 · #151 · #160)

**Plan:** `docs/plans/2026-06-26-audit-fidelity-doc-test-polish-sweep.md` · **Spec:** `docs/specs/2026-06-26-audit-fidelity-doc-test-polish-sweep.md`
**Date:** 2026-06-26 · **Verdict:** **CLEARED-WITH-NOTES** (2 executable blockers found → patched → resolved)

> Run note: red-teamed against a clean `origin/dev` checkout (`d32c63d`, plans 1–3 landed) per
> `audit-baseline-must-pin-integration-branch-not-main-checkout`. The v0.6.8 release (plan 3 Phase 3) was still in flight,
> so the sandbox read v0.6.7 — see the version adjudication below.

## Attack surface
6 probes, coverage whole (expected 6 / on-target 6). 5 analyzed + 1 executed. Spine: claims-vs-reality (fail→patched),
executable-proof (**fail → 2 blockers**), coverage-vs-source (warn — all downgraded to Minor by adversarial-confirm),
consistency-placeholders (fail → version-adjudicated + doc-drift notes), dependency-feasibility (**pass** — confirmed the
roadmap assigns v0.6.9 + all 11 target files present + sequencing sound). Bespoke: current-state-anchors (every one of the
~18 cited "before" anchors re-verified present/correct at HEAD — the plan's technical scope is accurate).

## Executed proof
`executable-proof` copied the dev checkout to a throwaway sandbox (Node v24.17.0, jq 1.7.1, bash 3.2.57, BSD `tr`);
baseline `node --test 'skills/**/*.test.mjs'` = 246/246 + all 7 `*.test.sh` green, then applied the plan's verbatim Phase-1
edits and re-ran. Two edits broke the gate:

## Findings & resolutions applied
- **[Major — RESOLVED] T1.4 `.claude/worktrees` prune is a no-op.** `walkFiles` prunes by **basename**
  (`pruned.includes(entry.name)`); the slash-bearing `'.claude/worktrees'` never equals any basename, so it prunes
  nothing — the intended `walkFiles`-skips assertion fails, and the weaker "array includes" fallback passes **vacuously**
  (the exact anti-pattern this sweep retires). **Resolution:** patched T1.4 to prune the basename `'worktrees'`, with the
  assertion required to go RED if the entry is dropped.
- **[Major — RESOLVED] T1.6 deleting the bare `'MIRROR of'` reds the meta-guard.** The `workflow-template.js` marker is
  split across two physical lines (line 69 ends `…This is a MIRROR of`; the field tokens are on line 70) and the meta-guard
  scans line-by-line, so the line-69 fragment is classified **only** by a `MIRROR of`-bearing allowlist entry. Plain
  deletion → line 69 unaccounted → gate RED. **Resolution:** patched T1.6 to **anchor** the entry to `'This is a MIRROR of'`
  (marker-specific lead-in, not a bare catch-all) instead of deleting it, with an **exact-membership** assertion that the
  bare `'MIRROR of'` is gone and the anchored entry is present — keeps #127's "no catch-all" intent and the gate green.
  In-scope (war-config.test.mjs only); the rejected alternative (rejoin the comment in workflow-template.js) would expand
  scope into a file plan 2 also touches.

## Residual risk (notes — non-blocking)
- **[adjudicated] Version v0.6.9 (not the spec's v0.6.6).** dependency-feasibility independently confirmed the roadmap
  assigns plan 4 → **v0.6.9** (on plan 3's v0.6.8); the spec's v0.6.6 is the superseded standalone baseline. The sandbox
  read v0.6.7 only because plan 3's v0.6.8 release had not yet landed. Plan/roadmap authoritative over the spec literal
  (`redteam-adjudication-is-authoritative-version-source`, `stacked-per-branch-releases-make-main-lag-cumulative`). No plan
  change; recorded in the plan's Notes.
- **[Minor] T2.3 T2a `tr -d '\n'` is a no-op on BSD/macOS `tr`** (BSD reads the single-quoted `\n` escape as a newline
  byte). The edit is correct for **GNU `tr` (Linux CI)** portability only — kept, with the rationale clarified in the plan
  Notes. Non-blocking (the plan already labels it cosmetic).
- **[Minor] LOGIC_MIRROR_REGISTRY line refs drifted** (plan cites L912-944; live is the `LOGIC_MIRROR_REGISTRY` Map ~L875-885
  + registration loop ~L938-947). Patched T1.7 to locate by the `LOGIC_MIRROR_REGISTRY` symbol, not the stale literal.
- **[Minor] coverage-vs-source confirmations** (optional-item handling, out-of-scope omissions) all adversarially
  downgraded to Minor and verified as faithful spec→plan mapping — not defects.

**Terminal verdict: CLEARED-WITH-NOTES.** Ready for `/war`.
