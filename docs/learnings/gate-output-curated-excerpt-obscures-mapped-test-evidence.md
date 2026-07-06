---
name: ""
metadata:
  node_type: memory
  slug: gate-output-curated-excerpt-obscures-mapped-test-evidence
  phase: probe-findings-contract/t3.1 + dispatched-gate-run-tmpdir-pin-parity/p2-t2 + fix-worker-result-binding/p3-t3 + submodule-inc1/T2 + submodule-inc2/T2 + servitor-provenance-gate-robustness/t1 + auditor-seat-deliberate-choice-comment/t4 + hygiene-sweep/T4 + gate-audit-integration-sha-validation/T1 + issue-422-nit-sweep/p2-t3
  type: project
  keywords: [green-by-deletion, collapse marker, aggregate PASS line, full test output, grep-filtered snippet, per-test tick line, inference chain, skipped=0]
  provenance: code-verified
  tags:
    - gate-audit
    - gate-evidence
    - auditor
    - test-visibility
    - evidence-standard
  files:
    - skills/red-team/assets/workflow-scaffold.test.mjs
  relates:
    - "[[gate-evidence-severity-not-verdict-gates-hard-path]]"
    - "[[auditor-cannot-execute-the-tests-it-must-verify-pass]]"
    - "[[weak-test-assertion-passes-without-feature-being-exercised]]"
    - "[[prompt-only-clause-grep-guard-must-tolerate-sentence-case]]"
  created: 2026-06-26
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
---

# Curated gate-output excerpts force auditor to reason by inference, not direct evidence

**The gap:** the gate-audit seat is the anti-cheat layer for green-by-deletion (a deleted test
simply does not appear in output; the total drops by N). It can catch deletion only when each
mapped test's own `✔`/PASS line is directly visible. A curated "representative" excerpt, a
collapse marker (`[...all node --test suites passed...]`), or an aggregate exit-0 line forces
inference instead. 10 recorded instances through issue-422-nit-sweep/p2-t3 (2026-07-02), across
BOTH runner families; recurs even on otherwise-zero-finding phases.

**Evidence standard** — gate evidence pasted to the audit seat should satisfy one of:
1. **Full output** — the unabridged run (or its file path as an artifact)
2. **Grep-filtered excerpt** — each mapped test's `✔` line directly visible
3. **Named-summary** — per-file/suite counts with skipped=0

**Grading:** curated excerpt = SOFT, Nit-to-Minor, never a land-halt — but only via an explicit
inference chain, all conditions required:
- pin confirmed (`gateHeadSha === auditSha`, no stale-tip risk)
- mapped tests present and non-vacuous at the pinned sha (read the file at that commit)
- suite directory demonstrably in-glob; total green with skipped=0 / exit 0
- special case: when the diff is provably inert to a runner (version-strings-only change), a
  partial runner list cannot mask a regression that cannot exist — still a reporting Nit

**Runner-family distinction:**
- `.test.sh` runners emit a single aggregate `PASS — N check(s)` line, no per-check TAP output;
  "directly visible named check" is structurally impossible → aggregate PASS + reading the test
  source at the audit_sha (count must equal N) is the strongest available evidence. Grade Nit and
  note the limitation is structural.
- `node --test` CAN emit per-test `✔` lines, so an aggregate-only summary there is a refiner
  authoring choice → Nit/Minor; suggested fix each time: echo the mapped test's own `✔` line or
  paste a grep-filtered snippet.

**Fix status:** #269 added the "Do NOT curate or excerpt…" clause to the three
`gate_output`-population prose sites (`workflow-template.js` merge-task prompt ×2,
`agents/war-refiner.md`). It is scoped to `.test.sh` aggregate-PASS curation and is prompt-only —
a should-do authoring constraint, not structurally enforced — so the `node --test` suite-summary
variant remains an open, accepted, non-blocking gap. See
[[prompt-only-clause-grep-guard-must-tolerate-sentence-case]] for the grep-guard pitfall on that
clause's own verification.

**Anchors (by construct — verify still present before acting):** the three T3.1 probe assertions
live in `skills/red-team/assets/workflow-scaffold.test.mjs` (the runProbe-prompt tests asserting
`'do NOT record'`, `findings:[]`, and the findings-schema `defect` description); recurring
node-variant examples are the test titled `'M1 criterion #6 — catch after a mid-phase throw skips
teardown'` and the `'touches a submodule'` unique-token assertions, both in
`skills/war/assets/workflow-template.test.mjs`.

**Caution:** a routine curated-excerpt Nit can crowd out the real check — whether the task's
primary deliverable is actually present in the diff at all; see
[[in-memory-landed-shas-inert-for-cross-phase-bump]] for a phantom deliverable that co-occurred
with this Nit.

Relates to [[gate-evidence-severity-not-verdict-gates-hard-path]] (what makes evidence HARD vs
SOFT in code), [[auditor-cannot-execute-the-tests-it-must-verify-pass]] (auditor reads, never
runs — curation compounds this), and [[gate-audit-pin-bracket-test-blocked-by-git-guard]]
(stale-tip + collapse-marker combo: the deficiencies compound the inference burden but neither
escalates severity independently).
