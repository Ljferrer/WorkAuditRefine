---
name: tr-escape-single-quote-strips-literal-not-newline
description: "Single-quoted \\n in a shell word is a literal backslash+n, so use ANSI-C quoting $'\\n' when a command needs a real newline byte"
metadata:
  node_type: memory
  type: project
  slug: tr-escape-single-quote-strips-literal-not-newline
  phase: F03/p1-t2
  severity: Nit
  tags:
    - shell
    - bash
    - tr
    - quoting
    - escaping
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# `tr -d '\n'` inside single quotes strips literal backslash+n, not newlines

## Durable rule

In bash/POSIX sh, single-quoted `\n` (also `\t`, etc.) is the two literal characters `\`+`n`,
NOT a control char. `tr -d '\n'`, `printf '\n'`, and friends therefore receive a literal
backslash+n, not 0x0A. To get the actual newline use ANSI-C quoting `$'\n'`, or a literal
newline in the shell word (`tr '\n' ' '` works because that `\n` is a single shell char).

**Why it bites quietly:** the wrong form is usually cosmetic (it scrubbed the wrong bytes),
so exit codes and asserted stderr markers are unaffected and tests stay green — the bug hides.

Fixed in `validate-auditor-git.sh` (the deny-message residue scrubber now uses `tr -d $'\n'`).

> archived 2026-07-04: resolved — moved to archive
