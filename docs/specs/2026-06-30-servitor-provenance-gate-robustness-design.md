# Servitor provenance gate: indent-agnostic extractor, accurate `|| true` comment, plan-prose reconciliation

**Status:** proposed — targets **v0.7.10** (latent-correctness + comment-accuracy + doc-fidelity). **Severity: LOW.**
**Source:** issues [#247](../../hooks/validate-servitor-provenance.sh), [#248](../../hooks/validate-servitor-provenance.sh), [#249](../../docs/plans/2026-06-29-memory-provenance.md). Memory slugs: `yaml-extraction-indent-coupling-in-shell-gate`, `awk-sed-exit-zero-on-no-match-comment-trap`, `plan-prose-top-level-vs-nested-key-impl-mismatch`, `verify-task-no-op-is-correct-when-already-covered`, `frontmatter-tools-negation-check-single-line-only`.

All three are nits. They batch here because all three live in or around [`hooks/validate-servitor-provenance.sh`](../../hooks/validate-servitor-provenance.sh) and its companion plan, same fail-closed-YAML-extraction root-cause family. One cohesive memory-provenance shell-gate sweep, three tasks in one file. Live repo is v0.7.7; this lands serially at landOrder 3 (v0.7.8 and v0.7.9 land first).

## Problem

The provenance gate is a `PreToolUse` hook that denies a servitor `Write` to a memory/learnings file unless its frontmatter carries a valid nested `metadata.provenance` tier. Three latent/cosmetic defects sit in and around it.

**#247 — extractor hard-codes 2-space indent (fail-closed latent).** Step (3)'s extractor, [`awk '/^metadata:/{found=1; next} found && /^  provenance:/{print; exit} found && /^[^ ]/{exit}'`](../../hooks/validate-servitor-provenance.sh), matches `provenance:` only at *exactly two* literal leading spaces. The indent is not part of the security model — any valid YAML child indent (4-space, tab) is a legitimate `metadata.provenance` — yet a non-2-space tag produces an empty match and routes to the deny arm (exit 2). The companion [`sed 's/.*provenance:[[:space:]]*//'`](../../hooks/validate-servitor-provenance.sh) is already whitespace-agnostic, and the block-exit guard `/^[^ ]/{exit}` on the same line already treats *any* leading-space line as still-inside the block. So the `/^  provenance:/` token is the lone over-specific anchor. Harmless today (real memory files and the test fixtures all use 2-space indent) but a future reindent silently locks out every servitor write. No test exercises a non-2-space fixture — [`content_with_tier()`](../../hooks/validate-servitor-provenance.test.sh) only ever emits `"  provenance: $1"` (2 spaces, confirmed at test L61, L76).

**#248 — `|| true` comment over-claims a grep rescue.** The comment block above the extractor ([`# Guard the extraction pipeline with || true so grep's no-match exit (1) ...`](../../hooks/validate-servitor-provenance.sh) and the `ponytail:` line that follows) says `|| true` is "load-bearing (exit-2-must-block)" and that without it `set -euo pipefail` "aborts the hook at grep exit 1". But the live pipeline is `awk | sed` (frontmatter extract, then provenance extract) — **no grep anywhere**, and the `get()` helper already carries its own `|| true`. awk and sed exit 0 on no-match (unlike grep, which exits 1), so a tag-less write yields an empty `$provenance` and is denied by the empty-string `*)` arm of the tier-membership `case` — *not* because `|| true` rescued a grep exit-1. The gate is correct; only the comment's causal story is wrong.

**#249 — stale, already fixed (stillValid:false).** The issue claims the plan's prose describes a *top-level* `provenance:` key while impl/spec use *nested* `metadata.provenance`. At HEAD this is no longer true: commit [`ea5e132`](../../docs/plans/2026-06-29-memory-provenance.md) ("redteam(M3): harden memory-provenance — ... nested provenance extract ...") already reconciled it. Every provenance reference in [`docs/plans/2026-06-29-memory-provenance.md`](../../docs/plans/2026-06-29-memory-provenance.md) now says nested `metadata.provenance`, and the only surviving top-level mentions are explicit *disclaimers* ("**never** a top-level `provenance:` key" at plan L90, L101). Captured in MEMORY.md as `plan-prose-top-level-vs-nested-key-impl-mismatch` (memory-provenance/p1-t1). This is a verify-and-close task, not a re-implementation (`verify-task-no-op-is-correct-when-already-covered`).

## Decisions

| # | Decision | Choice | Rejected alternative |
|---|----------|--------|----------------------|
| 1 (#247) | How to accept non-2-space indent | Relax the one awk token: `/^  provenance:/` → `/^[[:space:]]+provenance:/`. Add one ACCEPT fixture with 4-space (or tab) indent so the relaxation is load-bearing. | Leave hard-coded (latent lockout survives); parse YAML with a real parser (no dep, over-engineered for a one-token fix). |
| 2 (#248) | Fix the wrong `|| true` comment | Reword the comment block to state the real mechanism (awk/sed exit 0 on no-match → empty `$provenance` → denied by the `*)` arm). Keep `|| true` as cheap defense-in-depth, drop the "load-bearing / aborts at grep exit 1" claim. No code change. | Delete `|| true` (would matter if a future stage uses grep; cheap to keep); leave the comment (perpetuates the wrong control-flow story). |
| 3 (#249) | Re-implement vs verify-and-close | Verify-and-close. Re-grep the plan for residual top-level `provenance:` wording; if none (expected), close #249 as resolved-by-`ea5e132`. No file edit. | Re-reword the plan (the reword already landed in `ea5e132`; editing again is churn). |

## Surface changes

| File | Change |
|------|--------|
| [`hooks/validate-servitor-provenance.sh`](../../hooks/validate-servitor-provenance.sh) | #247: change the step-(3) awk pattern `/^  provenance:/` → `/^[[:space:]]+provenance:/` (one token). #248: reword the two comment blocks above the extractor to describe the real awk/sed-exit-0 deny path; keep `|| true`. |
| [`hooks/validate-servitor-provenance.test.sh`](../../hooks/validate-servitor-provenance.test.sh) | #247: add one ACCEPT case feeding a 4-space- (or tab-) indented `provenance:` tier, asserting exit 0. Makes the relaxation load-bearing — a future re-tightening to `/^  provenance:/` fails this test. |
| [`docs/plans/2026-06-29-memory-provenance.md`](../../docs/plans/2026-06-29-memory-provenance.md) | #249: no edit. Verify-only (re-grep for residual top-level wording), then close #249. |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (×2), `README.md` ## Status | Version bump to v0.7.10 (the four canonical slots — see below). |

## Alternatives considered

- **Status quo (do nothing).** Rejected for #247: the fail-closed lockout is a real robustness ceiling that bites silently on any memory-format reindent. Rejected for #248: a comment naming the wrong control-flow primitive misleads the next maintainer reading the gate's most security-relevant block. Accepted in spirit for #249 — the *code/doc* is already correct; only the issue needs closing.
- **YAML-parse the frontmatter properly (#247).** Rejected: no YAML dep in this bash-3.2 hook, and the fix is a single character-class swap. The extractor's job is "find the nested provenance child"; `/^[[:space:]]+provenance:/` does exactly that with the existing two-step awk.
- **Delete `|| true` (#248).** Rejected: it is harmless and would become load-bearing the day a future stage uses grep. Keep it as documented defense-in-depth; only the prose is wrong.
- **Re-reword the plan for #249.** Rejected: the reword already landed in `ea5e132`. Editing prose that is already correct is churn (`verify-task-no-op-is-correct-when-already-covered`).

## Validation criteria

1. **#247** — In `validate-servitor-provenance.test.sh`, a new case feeds servitor `Write` content whose frontmatter nests `provenance: code-verified` under `metadata:` at **4-space (or tab) indent**; the hook exits **0** (ACCEPT). Reverting the production pattern to `/^  provenance:/` makes this case fail (deny exit 2), proving the relaxation is load-bearing. The existing 2-space ACCEPT, no-metadata DENY (exit 2), and bad-tier DENY (exit 2) cases still pass.
2. **#248** — The comment block above the step-(3) extractor in `validate-servitor-provenance.sh` no longer attributes the deny path to a grep exit-1 rescue: `grep -n 'grep' hooks/validate-servitor-provenance.sh` returns no line inside the extractor comment (the file uses awk/sed only). The reworded comment names the real mechanism (awk/sed exit 0 on no-match → empty `$provenance` → `*)` deny arm). `|| true` is still present on both extraction stages. No behavioral change: the full `*.test.sh` suite is unchanged-green.
3. **#249** — `grep -nE '(\ba |^)top-level .provenance' docs/plans/2026-06-29-memory-provenance.md` returns only *disclaimer* lines ("never a top-level `provenance:` key"), no line *describing* the field as top-level. On that confirmation, issue #249 is closed as resolved-by-`ea5e132` with no file edit.

## Gate

Run the full project gate at the release commit: `node --test "skills/**/*.test.mjs"` plus all 12 `*.test.sh` runners (the 11 discovered at HEAD — six `hooks/*.test.sh`, five `skills/**/*.test.sh` — plus any added in the serial stack ahead of this land). The only behavioral surface here is `validate-servitor-provenance.test.sh`; it must stay green with the new 4-space ACCEPT case.

## Version serialization

A release bump replaces the four canonical version slots in lockstep (no badge): [`.claude-plugin/plugin.json`](../../.claude-plugin/plugin.json) `version`, [`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) `metadata.version` **and** `plugins[0].version`, and the [`README.md`](../../README.md) `## Status` line (replace-in-place, not append). Lands serially at landOrder 3 on the landed tip of the prior plan (v0.7.8 → v0.7.9 → **v0.7.10**); confirm all four slots by hand at the release commit, since no cross-slot consistency test exists.

## Open risks / non-goals

- **Non-goal:** semantic honesty of the provenance tier. The gate proves the tag is *present and in-tier*, never *honest* (a servitor could stamp `code-verified` without checking) — that stays prompt-layer (T2/T3), unchanged here.
- **Non-goal:** tab-vs-space normalization beyond "accept any leading whitespace". `/^[[:space:]]+provenance:/` accepts both; the gate does not enforce a canonical indent (out of scope — the security model never cared about indent).
- **Risk (low):** #249 closes without a file change. If a residual top-level-wording line surfaces in criterion 3's grep, fall back to the one-line reword (qualify `provenance:` as nested `metadata.provenance`) in the same task — but the grep is expected to find only disclaimers.

## Coverage

| Issue | Decision | Severity |
|-------|----------|----------|
| #247 | D1 — relax extractor to `/^[[:space:]]+provenance:/` + load-bearing 4-space ACCEPT fixture | NIT (latent-correctness) |
| #248 | D2 — reword `|| true` comment to the real awk/sed deny mechanism; keep `|| true` | NIT (comment-accuracy) |
| #249 | D3 — verify-and-close as resolved-by-`ea5e132`; no re-implementation | NIT (doc-fidelity, stale) |
