---
name: endstate-check-artifact-with-exit-0-and-empty-stdout-is-non-substantiating
description: "A grep or pipeline End-state check can log tip_sha plus exit_code 0 with an empty body; treat it as non-substantiating and re-ground on git show <sha>:<path>"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - endstate-check
    - empty stdout
    - exit_code 0
    - non-substantiating
    - artifact
    - grep check
    - pinned blob
  provenance: code-verified
  slug: endstate-check-artifact-with-exit-0-and-empty-stdout-is-non-substantiating
  tags: 
    - engine
    - evidence-capture
    - gate-audit
  relates:
    - "[[endstate-check-dispatch-captures-only-one-command-per-condition-row]]"
---

# An endstate-check artifact with exit 0 and empty stdout proves nothing

## The rule

Exit 0 with empty stdout proves nothing for a grep or pipeline check. Re-read the pinned blob
(`git show <sha>:<path>`) before attesting "met".

## Instance

In phase 2 of `2026-08-06-gate-audit-finding-routing`, `endstate-2-2.log` (End state 16, two
`grep -Fc` invocations) and `endstate-2-6.log` (End state 13,
`git log --no-merges --format=%s <base>..<tip> | grep -vc '#[0-9]'`) were both stamped at the
correct tip with `exit_code: 0`, but held **zero stdout**: just `tip_sha: ...` and
`exit_code: 0`. Both declared checks always print something (`grep -Fc` always prints a count;
the `git log | grep -vc` pipeline prints a count and exits 1 when the count is 0). So exit 0 with
an empty body does not match either command's own shape. Sibling conditions in the same run
captured full output. The empty body correlated with the check being a **pipeline or compound
shell expression** rather than a single bare command.

The same shape recurred in a later plan's phase for a `grep -n` check and a two-`grep -c`
compound check. The gate-audit seat treated both as non-substantiating and re-grounded on the
pinned blob, so the verdicts were still correct.

## How to apply

- An `endstate-*.log` artifact that is tip-stamped and `exit_code: 0` but has NO command output is
  not evidence that the check passed "by exit code".
- Compare the artifact against what its own declared check would print. If they do not match
  (e.g. a `grep -c` or pipeline check that should always print a count, but the artifact is
  silent), treat the artifact as **non-substantiating** and read the content at the pin directly.
- Expect this shape for grep and pipeline checks. The risk is highest for `check:` fields that are
  shell pipelines or compound expressions, not a single bare command or `node --test` invocation.

> archived 2026-08-30: resolved — moved to archive
