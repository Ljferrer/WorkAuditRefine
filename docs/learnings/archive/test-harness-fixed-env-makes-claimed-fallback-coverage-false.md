---
name: test-harness-fixed-env-makes-claimed-fallback-coverage-false
description: "Harness that always sets an env var makes fallback branch untested; add unset case"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: test-harness-fixed-env-makes-claimed-fallback-coverage-false
  phase: campaign-compaction-survival/phase-1-task1
  tags: 
    - test-design
    - coverage
    - shell
    - env-fallback
    - overclaim
  created: 2026-07-03
  originSessionId: 9c57c14a-92ed-4fc9-92d1-27be3d4dbad5
---

# Test-harness fixed env makes a claimed fallback-coverage comment false

**Rule:** a test helper that unconditionally sets an env var the code reads via
`${VAR:-fallback}` makes the fallback branch structurally unreachable — the branches are
mutually exclusive, so a comment claiming the fallback is "implicitly exercised" is false,
not imprecise.

Fixed in `hooks/inject-campaign-state.test.sh`: an `env -u CLAUDE_PROJECT_DIR` case (Case 10)
now exercises the `.cwd` fallback branch of `hooks/inject-campaign-state.sh`; the false
"implicit" comment is gone.

Related: [[node-breadth-assertion-test-js-overclaims]] — that was a glob silently missing
files; here the harness default *actively defeats* the branch it claims to cover.

**Why:** a stale "covered" comment invites a real regression in the fallback path to ship green.
**How to apply:** grep the helper for vars the code reads via `${VAR:-...}`; require one test case that unsets/omits each, else fix the comment.

> archived 2026-07-04: resolved — moved to archive
