# Auditor pin-validity lens drops the denied `git -C <sub> fetch`: ledger-match authoritative, remote-reachability delegated upstream

**Status:** proposed — targets **v0.8.10** (auditor/guard reconciliation). **Severity: MEDIUM.**
**Source:** issue #310. Memory: [[guard-c-peel-resolves-pin-blocker-but-scoped-to-read-verbs-only]], [[auditor-cannot-execute-the-tests-it-must-verify-pass]], [[submodule-phase-repo-derived-from-task-targetrepo]], [[in-memory-landed-shas-inert-for-cross-phase-bump]], [[absence-guard-verb-specific-coverage-gap]].
Group: standalone (behavioral spec, auditor-guard family). Sibling of the **landed** spec 4 (#222, v0.8.4) but a **separate decision** — #222 taught the guard the read-only `-C <path>` peel; this issue is about the `fetch` verb #222 deliberately did **not** admit. Files disjoint from the pending stack except the shared version slots; lands serially (landOrder 10).

## Problem

The v0.8.0 first-class submodule support added a **pin-validity lens** to the WAR auditor for `gitlink-bump-task`s ([`agents/war-auditor.md`](../../agents/war-auditor.md), Step 3 at ~L33). It instructs the **read-only auditor seat** to run:

```
git -C <submodule> fetch
git -C <submodule> cat-file -e <oid>
```

But the auditor's `PreToolUse` guard [`hooks/validate-auditor-git.sh`](../../hooks/validate-auditor-git.sh) allows only a fixed read-only verb set — `{diff, log, show, merge-base, rev-parse, status, ls-files, cat-file, blame}` (subcommand extractor ~L115-131). **`fetch` is not in the allowlist** and falls to default-deny (*"git subcommand 'fetch' is not in the read-only allowlist"*). So on any `gitlink-bump-task` the lens cannot complete: `fetch` is denied, the auditor can't confirm the pin, and a legitimate pin move is blocked / escalated.

**Two v0.8.0 features collided and were never reconciled:** the submodule auditor lens (wants a network `fetch`) and the deliberately local-read-only guard (`fetch` writes to `.git` **and** hits the network, so it was correctly excluded — [[guard-c-peel-resolves-pin-blocker-but-scoped-to-read-verbs-only]] records that `fetch` is *deliberately* out, and spec 4's plan explicitly deferred this to #310).

**Key realization — the auditor's `fetch` is redundant, not essential.** Remote-reachability of the pinned gitlink SHA is **already established by full-tools actors** before/around the audit:

- **The dep submodule task's *land*** is what pushes the SHA to the submodule remote (2A) or opens a PR on it (2B → `held:submodule-pr`). The gitlink-bump's SHA must **equal the dep task's landed SHA** (lens Step 4, a ledger read — already an allowed operation).
- **The refiner** already runs `git -C <submodule-_refinery> fetch` ([`agents/war-refiner.md`](../../agents/war-refiner.md) ~L86).
- **The Lead pre-flight reconciliation** ([`skills/war/SKILL.md`](../../skills/war/SKILL.md) ~L65, submodule-as-co-source-of-truth) independently verifies `submodule_merge_sha` reachability on the submodule remote (`git -C <sub> fetch && cat-file -e <submodule_merge_sha>`); a non-reachable pin is treated as ledger-ahead (class A) and surfaced before re-landing.
- **Spec 4 (v0.8.4, landed) already makes `git -C <sub> cat-file -e <oid>` work** — the `-C <path>` peel + `cat-file` is an allowed read verb. So **only** the `fetch` line is denied today; the sibling object-store check already passes.

The auditor re-fetching therefore duplicates a guarantee the dep task's land + refiner + pre-flight reconciliation already provide. This mirrors the standing division of labor: [[auditor-cannot-execute-the-tests-it-must-verify-pass]] — the read-only auditor verifies what it can locally; the authoritative network/merge guarantees belong to the full-tools refiner and the Lead pre-flight.

## Decisions

| # | Decision | Choice | Rejected alternative |
|---|----------|--------|----------------------|
| D1 | Resolve the denied `fetch` | **Drop the `git -C <sub> fetch` from the auditor lens** (Option 1). No guard change; the auditor stays truly read-only-local. | (2) Narrow `fetch` allowance in the guard — weakens the read-only contract the #222/#310 family exists to protect (`fetch` writes refs/objects to `.git` + network); needs its own threat review. (3) `ls-remote` reachability probe — still adds a network verb to the guard allowlist and proves only "OID is a remote ref tip." |
| D2 | What Step 3 becomes | **Ledger-match is the authoritative in-seat pin check:** the new SHA must equal the dep submodule task's landed SHA (ledger read). **Remote-reachability is explicitly delegated** to the dep task's land + the Lead pre-flight reconciliation (cited in the lens). A read-only `git -C <sub> cat-file -e <oid>` runs as a **non-blocking sanity confirmation** *if* the object is present locally — it **never false-blocks** when the gitlink-bump worker pinned the ledger SHA without fetching the object into the auditor's checkout. | Require local `cat-file -e` to pass (false-blocks a legitimate pin whenever the object isn't in the auditor's read-only checkout — a new spurious escalation); drop the object check entirely (loses the cheap in-seat sanity confirmation where the object *is* present). |
| D3 | Guard change | **None.** `validate-auditor-git.sh` is unchanged. Add a **deny-test pinning that `git -C <sub> fetch` STAYS denied** (and bare `git fetch`), so a future edit can't quietly admit `fetch`. | Widen the verb allowlist (D1-rejected). |
| D4 | Keep the pin-validity guarantee honest | The lens still emits **Critical / `request_changes`** when the new SHA does **not** match the dep task's landed SHA (Step 4 unchanged). The *reachability* half is anchored upstream and cited, not re-verified in-seat. | Silently weaken pin-validity to "trust the ledger blindly" with no cross-reference to the reconciliation that corroborates it. |

### Mechanics

**Auditor lens ([`agents/war-auditor.md`](../../agents/war-auditor.md), pin-validity Step 3).** Reword from the `fetch`+`cat-file` block to:

```
3. Verify the new SHA is the dep submodule task's landed SHA (read `<submodule>_merge_sha`
   / the dep task's landed SHA from the ledger) — this is the authoritative in-seat check.
   Its reachability on the submodule remote is established upstream: the dep task's land
   pushed it (or opened its PR), and the Lead pre-flight reconciliation (SKILL.md,
   submodule co-source-of-truth) verifies remote reachability of the recorded pin. Do NOT
   `git fetch` here — the auditor is read-only (the guard denies it, by design).
   Optionally, if the submodule object is already present in your checkout, a read-only
   `git -C <submodule> cat-file -e <oid>` confirms it — but its ABSENCE is not a finding
   (the object need not be fetched into the read-only checkout).
```

Step 4 (SHA == dep task's landed SHA) folds into the new Step 3 as the load-bearing check; a mismatch → **Critical / `request_changes`** (unchanged). The gitlink-only diff (Step 1) and SHA extraction (Step 2) are unchanged.

**Guard test ([`hooks/validate-auditor-git.test.sh`](../../hooks/validate-auditor-git.test.sh)).** Add deny-cases asserting `git -C /abs/sub fetch` and bare `git fetch` exit 2 with a `WAR:` deny marker — pinning that the resolution is "drop the call," not "allow the verb" ([[absence-guard-verb-specific-coverage-gap]]: enumerate the `-C`-prefixed form too, since spec 4's peel now lets `-C <path>` through to the subcommand extractor).

## Affected files

| File | Change |
|------|--------|
| [`agents/war-auditor.md`](../../agents/war-auditor.md) | D1/D2/D4: reword the pin-validity lens Step 3 — drop `git fetch`; ledger-match authoritative; cite the upstream reconciliation for remote-reachability; local `cat-file -e` best-effort/non-blocking. |
| [`hooks/validate-auditor-git.test.sh`](../../hooks/validate-auditor-git.test.sh) | D3: deny-tests for `git -C <sub> fetch` and bare `git fetch` (pin the decision; `-C` form matters post-spec-4 peel). |
| [`docs/specs/2026-06-29-submodule-support-design.md`](2026-06-29-submodule-support-design.md) *(cross-note only, if it claims the auditor verifies remote-reachability)* | Align the one-line description so it doesn't assert an in-seat `fetch` the auditor no longer does. Verify-and-touch only if such a claim exists. |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (×2), `README.md` `## Status` | Version bump to **0.8.10** (four canonical slots, replace-in-place). |

**No change to `validate-auditor-git.sh`** — the guard is correct; the lens was asking for a verb the guard rightly denies.

## Alternatives considered

- **Narrow `fetch` allowance in the guard (Option 2).** Rejected — D1; `fetch` mutates `.git` and hits the network, weakening the read-only contract that is the guard's entire purpose. The redundancy finding removes any need to take that risk.
- **`ls-remote` reachability probe (Option 3).** Rejected — still a network verb in the auditor's allowlist (smaller weakening than `fetch`, but non-zero) and it proves only "OID is a remote ref tip," which is narrower than what the ledger-match + pre-flight already establish.
- **Require the local `cat-file -e` to pass.** Rejected — D2; false-blocks a legitimate pin when the object isn't in the read-only checkout (the worker can pin the ledger SHA without fetching the object).
- **Trust the ledger with no cross-reference.** Rejected — D4; the lens cites the pre-flight reconciliation that corroborates the ledger, keeping the guarantee auditable rather than blind.

## Validation criteria

1. **(#310 — fetch stays denied)** `bash hooks/validate-auditor-git.test.sh` passes with new deny-cases: `git -C /abs/sub fetch` → exit 2 with `WAR:`; bare `git fetch` → exit 2 with `WAR:`. The existing read-verb allow-cases (`-C <path> rev-parse`, `-C <path> cat-file`, `-C <path> show`) still pass — proving the resolution did **not** widen the allowlist.
2. **(#310 — lens no longer requires fetch)** `agents/war-auditor.md`'s pin-validity lens no longer instructs `git -C <submodule> fetch` (grep: no `fetch` in the pin-validity block); Step 3 names the **dep-task landed-SHA ledger match** as the authoritative check and cites the Lead pre-flight reconciliation for remote-reachability; the `cat-file -e` sanity check is described as non-blocking on object-absence.
3. **(#310 — pin-validity still enforced)** The lens still specifies **Critical / `request_changes`** when the new SHA ≠ the dep task's landed SHA (the load-bearing check is preserved, only the reachability *mechanism* changed).
4. **(gate)** Full suite green at the release commit: `node --test "skills/**/*.test.mjs"` plus every `*.test.sh` runner self-discovered by `find` (run all post-merge, including `validate-auditor-git.test.sh` — [[gate-under-covers-after-cross-branch-merge-new-runner]]).

## Open risks / non-goals

- **Non-goal: changing the guard.** `validate-auditor-git.sh` stays byte-identical; this spec only stops asking it for `fetch` and pins that decision with a test.
- **Trust-model note.** The auditor now delegates *remote-reachability* to the dep task's land + the Lead pre-flight reconciliation, verifying only the ledger SHA match in-seat. This is consistent with the existing division of labor ([[auditor-cannot-execute-the-tests-it-must-verify-pass]]) — the refiner owns network/merge; the read-only auditor verifies what it can locally. If the ledger's `submodule_merge_sha` could be wrong *and* the pre-flight skipped, the pin would go unverified — but the pre-flight reconciliation is the designated corroboration and is not in scope to change here.
- **Risk: the `-C fetch` form post-spec-4.** Spec 4's `-C <path>` peel means `git -C <sub> fetch` now reaches the subcommand extractor as `fetch` → default-deny (correct). The deny-test must cover the `-C`-prefixed form, not only bare `git fetch` ([[absence-guard-verb-specific-coverage-gap]]).
- **Version literal not authoritative** — resolve to the next free patch off the actual landed baseline at land time ([[stacked-release-plan-version-literal-lags-operator-target]], [[war-branch-base-off-latest-master-not-prior-tip]]).

## Coverage

| Issue | Decisions | Validation |
|-------|-----------|------------|
| #310  | D1, D2, D3, D4 | 1, 2, 3 (gate: 4) |
