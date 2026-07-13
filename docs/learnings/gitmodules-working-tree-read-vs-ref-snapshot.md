---
name: gitmodules-working-tree-read-vs-ref-snapshot
description: ".gitmodules read = working-tree not ref snapshot — FIXED phase 'Floor fixes' 2026-07-12"
metadata:
  node_type: memory
  type: project
  keywords: [git config --blob, submodule guard, checked-out file, diff endpoint mismatch, declared paths misclassified, gitlink check, base vs branch, cat-file -e, ref snapshot fix, floor-script-correctness]
  provenance: agent-unverified
  slug: gitmodules-working-tree-read-vs-ref-snapshot
  phase: submodule-support-increment-1-guard/T1 (origin); Floor fixes/task-3 (fix, 2026-07-12)
  tags:
    - submodule
    - gitmodules
    - shell-guard
    - increment-2
    - ref-snapshot
  created: 2026-06-30
  updated: 2026-07-12
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
---

# `.gitmodules` cross-check reads the working-tree file, not a ref snapshot — FIXED

**Original rule (submodule-support-increment-1-guard/T1, 2026-06-30):** `assert-no-submodule-mutation.sh`
Step 3 resolved submodule paths via `git config -f "$gitmodules_file"` where `gitmodules_file` was the
checked-out working-tree `.gitmodules` — not `.gitmodules` as of `<base>` or `<branch>` in the diff.
Benign for the refuse-all default (the mode-160000 gitlink check fires first), but under the landed
`--declared` mode a task branch editing `.gitmodules` itself could misclassify which paths were
declared, because the read diverged from the diff endpoints.

**Status: fixed in phase "Floor fixes" (plan `docs/plans/2026-07-12-floor-script-correctness.md`,
Task 3), landed on `dev/2026-07-12-floor-script-correctness`, 2026-07-12.** Per that plan's
Commander's Intent Method: Step 3's working-tree read was replaced with a `git cat-file -e` existence
probe against `<branch>:.gitmodules` plus `git config --blob "<branch>:.gitmodules"` (absent →
clean skip; a read failure after a successful probe → exit 2); the working-tree fallback was removed
outright. End-state item 5 required `grep -c 'git config -f' skills/war/assets/assert-no-submodule-mutation.sh`
→ 0, and both this specific gate-audit check and the full task-3 audit (`verdict: approve`,
`gateEvidence:true`, `auditSha a38520a6...`) confirmed it. A residual deferred validation remains:
the plan-ratified premise that a malformed `.gitmodules` blob's `git config` parse failure normalizes
to exit 1 (making the exit-2 die branch "un-manufacturable" in a same-diff fixture) was **flagged by
the auditor as asserted-but-empirically-unconfirmed** (git config parse errors have historically
exited >1, e.g. 128) — backstopped by a /red-team sandbox probe, not blocking.

**Provenance caveat:** this checkout's `HEAD` is on an unrelated branch (worktree-lag — see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]), so the fix was **not** independently
re-Grepped here; this "fixed" status is sourced from the phase's Commander's Intent plus the unanimous
gate-audit `approve` verdicts, not a direct Read of the landed script. Before relying on the exact
`cat-file -e` / `git config --blob` shape, re-Read `skills/war/assets/assert-no-submodule-mutation.sh`
Step 3 on or after `dev/2026-07-12-floor-script-correctness`.

**Why this was durable before the fix, and why the pattern still matters:** working-tree reads
silently diverge from the diff endpoints a guard reasons about — any future path-discrimination
widening on a similar floor/gate script should default to a ref-snapshot read (`git config --blob
"<ref>:<path>"`) from the start, not working-tree, to avoid reintroducing this exact class of gap.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]] (Variant 4),
[[submodule-fixture-protocol-file-allow-discipline]],
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] (why this update is agent-unverified
rather than code-verified).
