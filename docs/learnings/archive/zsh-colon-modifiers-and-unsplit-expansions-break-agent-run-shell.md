---
name: zsh-colon-modifiers-and-unsplit-expansions-break-agent-run-shell
description: "In zsh, `$T:path` triggers parameter modifiers and an unquoted `${VAR:+--flag \"$VAR\"}` is not word-split, so brace `\"${T}:path\"` and write two explicit invocation lines instead of a `:+` fence"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  keywords:
    - zsh
    - parameter-modifier
    - git-show
    - sha-colon-path
    - vacuous
    - sweep
    - floor
    - backstop
    - bad-substitution
    - word splitting
    - zsh SH_WORD_SPLIT
    - bash fence
    - TIGHTEN_TARGET
  originSessionId: 4eee3466-8bcc-44f9-a6c2-754d46624537
  modified: 2026-07-25T06:30:17.729Z
---

Running backstop sweeps at a landed tip (`git show $T:hooks/validate-auditor-git.sh`,
`git show $T:skills/...`), zsh interpreted `$T:h` as the **dirname modifier** and `$T:s` as the
**substitute modifier** — one produced `.ooks/<path>` (fatal), the other a `bad substitution`
error. Both failures were **silent at the floor**: the downstream `tr | grep -c` pipeline read
empty input and printed `0`, indistinguishable from the genuine absence the floor was checking.

**The incident (2026-07-24, campaign plan 2 Phase-1 checkpoint).** Three of five integrated-tip
sweep keys were first "measured" against empty files. Caught only because a separate region
extractor returned an impossible empty block, prompting re-verification of the file dumps
themselves (`wc -c` → 283 bytes vs the real 165,959).

**Second zsh trap: unquoted expansions are not word-split.** `skills/lessons-learned/SKILL.md`'s
step-1 fence once threaded a flag as `${TIGHTEN_TARGET:+--target "$TIGHTEN_TARGET"}` inside a
` ```bash ` block. Bash splits the `:+` replacement into two argv words as expected; zsh lacks
`SH_WORD_SPLIT` by default and does **not** word-split the unquoted expansion, so the whole
replacement fuses into **one** argv word (`--target 2000` arrives as a single token). `parseArgv`
keys that as `{"target 2000": true}`, so `argv.target` stays `undefined` — the same silent outcome
as never setting the variable. The fix (#1088) retired the fence: write two explicit invocation
lines (one with the flag, one without) and tell the agent to run exactly one. See
[[tighten-target-flag-has-three-independent-silent-degradation-paths]].

**How to apply:**
- Always write `"${T}:path"` (braces) for `<rev>:<path>` git arguments in zsh — `$T:anything` is
  modifier territory (`:h`, `:s`, `:r`, `:t`, `:e` are all live).
- In a doc fence an agent will run, never thread an optional flag through `${VAR:+--flag "$VAR"}`;
  write two explicit invocation lines.
- A floor/sweep result is evidence only if its producing command succeeded: check the dump's
  `rc` and byte size before trusting a `0` count. A grep floor over a failed redirect is the
  same vacuity class as a wrap-blind grep — it passes on exactly nothing.
- Same discipline as [[reproduce-a-gate-blocker-before-patching-or-escalating]]: verify the
  measurement before acting on it — including your own.

> archived 2026-08-15: resolved — moved to archive
