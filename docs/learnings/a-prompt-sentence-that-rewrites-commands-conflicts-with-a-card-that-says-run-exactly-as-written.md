---
name: a-prompt-sentence-that-rewrites-commands-conflicts-with-a-card-that-says-run-exactly-as-written
description: "A prompt line adding -C to commands conflicts with a run-exactly-as-written card"
metadata:
  node_type: memory
  type: project
  keywords:
    - war-helper
    - relayRepo
    - git -C lead-in
    - run exactly as written
    - double -C denied
    - haiku literal seat
    - submodule wrong repository
    - card vs prompt conflict
  provenance: code-verified
  slug: a-prompt-sentence-that-rewrites-commands-conflicts-with-a-card-that-says-run-exactly-as-written
  phase: 2026-11-08-model-routing-and-prompt-byte-budgets/phase-5 (task 5.3)
  tags:
    - helper
    - prompt-surface
    - guard
  created: 2026-11-10
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T06:32:17.153Z
---

# A prompt sentence that rewrites commands conflicts with a "run exactly as written" card

**Fact.** The snapshot, merge-confirm and pin-confirm relay prompts spell bare `git ...` commands.
They name the repository only in a closing `relayRepo` sentence that asks for `git -C <repo> <command>`.
The helper card first said "run the git commands in your prompt, exactly as written".
A literal haiku seat obeys the card and runs in its own cwd.
For a submodule task that cwd is the wrong repository, and the guard admits both spellings.

**The fix had a second trap.** A plain "add -C" bullet also fires on prompts that already spell `-C` inline (tip-probe, audit-pin, diff-probe).
`hooks/validate-auditor-git.sh` peels only one `-C`, so `git -C X -C X rev-parse` is denied.
The landed bullet ends with "Skip a command that already spells `-C`."

**Rule.** If a dispatched prompt asks the seat to rewrite the commands it spells, the standing card must name that rewrite as an exception.
Scope the exception to the prompts that carry the lead-in, or it breaks the prompts that do not.
Better: put the repository in each spelled command, so no seat has to rewrite anything.

**Locate.** The `-C` bullet in `agents/war-helper.md` and the one-`-C` peel case in `hooks/validate-auditor-git.sh` (verify still present before acting, found at the phase 5 landed tip).

Related: [[standing-instruction-vs-dispatched-prompt-coverage-split]], [[a-shell-command-inside-a-prompt-string-needs-a-test-that-runs-the-exact-prompt-spelling-through-bash]].
