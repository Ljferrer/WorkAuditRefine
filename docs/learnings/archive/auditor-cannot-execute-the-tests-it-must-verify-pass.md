---
name: auditor-cannot-execute-the-tests-it-must-verify-pass
description: "[RESOLVED] capability-vs-prompt gap family anchor"
metadata: 
  node_type: memory
  type: project
  originSessionId: e7523bdc-9e44-4a06-803d-587632bc5e63
---

**RESOLVED (instance) — kept as family anchor** for "an agent asked to do what its capability
allowlist forbids." The auditor was told to verify mapped tests "EXIST and PASS" while holding
only Read/Grep/Glob — it structurally cannot run a test, so "PASS" invited asserted-without-
execution; the only genuine gate run is the refiner's at merge. Fixed in `war-auditor.md`: now
reads "verify tests are present in the diff and uncompromised, not to assert they passed", the
seat got read-only git Bash to self-serve the correct `git diff <integrationBranch>...<task.branch>`
baseline, and a post-merge gate-audit execution-evidence pass was added.

**Why:** enforcement-by-prompt gaps — a prompt demanding a forbidden capability, or promising an
input never supplied — same family as [[scope-hook-blind-to-bash-write-path]].
**How to apply:** when auditing an agent spec, diff each prompt demand against the seat's tool
allowlist; reword demands to what the tools can prove, and route real execution to a seat that
has it. Baseline mis-pin sibling: [[audit-baseline-must-pin-integration-branch-not-main-checkout]].
