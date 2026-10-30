---
name: a-shell-command-inside-a-prompt-string-needs-a-test-that-runs-the-exact-prompt-spelling-through-bash
description: A git command spelled in a dispatched prompt needs a test that runs that exact text through bash
metadata:
  node_type: memory
  type: project
  keywords:
    - shell quoting
    - unquoted format
    - trailers:key
    - MERGE_FACTS_RULE
    - prompt literal
    - argv fixture
    - bash syntax error
    - runTrailerRead
  provenance: code-verified
  slug: a-shell-command-inside-a-prompt-string-needs-a-test-that-runs-the-exact-prompt-spelling-through-bash
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-2 (task 2.1)
  tags:
    - war-engine
    - tests
    - prompt-surface
    - shell
  created: 2026-10-29
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-10-29T19:14:41.845Z
---

# A shell command inside a prompt string needs a test that runs the exact prompt text

**The trap.** A dispatched prompt can tell a refiner to run a literal git command.
`MERGE_FACTS_RULE` in `skills/war/assets/workflow-template.js` first spelled `git show -s --format=%(trailers:key=WAR-Task) <local target>` unquoted.
In bash or zsh an unquoted `(` in that word is a syntax error.
A refiner that copied the literal got no trailer, so every task-merge confirmation failed closed and the task could hold.

**Why the tests stayed green.** The real-git fixture helper `gitTaskFacts` reads the trailer through a `spawnSync` argv array.
An argv array never meets shell quoting, so it passes with either spelling.
A fix round quoted the format, and a later audit round found that no test would catch a revert.

**The fix pattern.** Extract the command text from the dispatched prompt itself.
Replace its placeholder and run it through `bash`, then assert exit 0 and the expected output.
`runTrailerRead` in `skills/war/assets/workflow-template.test-harness.mjs` does this. `workflow-template.git-3.test.mjs` calls it on the `git-confirm` prompt, and `workflow-template.git-2.test.mjs` calls it on the `merge-reconcile` prompt.

**Rule.** If a prompt string carries a shell command, test the prompt's own spelling through a shell.
A fixture that rebuilds the same command as argv proves the git semantics only, never the quoting.
Check sibling reads too: the other engine trailer reads were already quoted.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]], [[template-defers-runtime-values-to-agent-via-literal-placeholder]].

Locate-cue: verify still present before acting. Search `const MERGE_FACTS_RULE` (quoted form) in `skills/war/assets/workflow-template.js` and `const runTrailerRead` in `skills/war/assets/workflow-template.test-harness.mjs`. Landed at tip 9bcc4fa6 (phase 2).
