---
name: a-git-accepts-check-over-a-pipe-row-needs-pipefail-or-it-checks-only-the-right-side
description: A git-accepts check that evals a pipe row without pipefail tests only the right side of the pipe
metadata:
  node_type: memory
  type: project
  keywords:
    - pipefail
    - git_runs
    - pipe row
    - patch-id empty input
    - hash-object --stdin
    - hook test row
    - left side refused
    - helper relay arm
  provenance: code-verified
  slug: a-git-accepts-check-over-a-pipe-row-needs-pipefail-or-it-checks-only-the-right-side
  phase: 2026-11-08-model-routing-and-prompt-byte-budgets/phase-5 (task 5.2)
  tags:
    - testing
    - shell
    - guard
  created: 2026-11-10
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T06:32:22.973Z
---

# A git-accepts check over a pipe row needs pipefail

**Fact.** Without `pipefail`, a shell pipe's exit status is the right side's alone.
`git patch-id --stable` and `git hash-object --stdin` exit 0 on empty input.
So a row like `git diff <bad flag> | git patch-id --stable` passes a "git accepts this command" check.

**Rule.** If a check runs a pipe row to prove git accepts it, run it as `set -o pipefail; <row>`.
bash 3.2 supports `pipefail`.
Add one control row with a refused left side, and assert the check fails on it.

**Locate.** In `hooks/validate-auditor-git.test.sh`, the HR loop calls `git_runs "set -o pipefail; $_c"`, and a control row uses `git diff --no-such-flag | git patch-id --stable` (verify still present before acting, found at the phase 5 landed tip).

Related: [[hook-test-rows-must-name-commands-git-accepts]], [[weak-test-assertion-passes-without-feature-being-exercised]].
