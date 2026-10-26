---
name: trailing-newline-deny-row-cannot-go-red-test-the-interior-newline-bypass
description: A trailing-newline deny row can never fail; the real bypass is an interior newline joining two commands
metadata:
  node_type: memory
  type: project
  keywords:
    - auditor git guard
    - newline bypass
    - command substitution
    - trailing newline stripped
    - validate-auditor-git
    - 1828
    - chain-operator rule
    - bash 3.2
    - deny test row
  provenance: code-verified
  slug: trailing-newline-deny-row-cannot-go-red-test-the-interior-newline-bypass
  phase: 2026-10-20-rea-artifact-evidence/phase-1
  tags:
    - war
    - hooks
    - auditor-guard
    - test-fixtures
    - bash
  created: 2026-10-20
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-21T06:59:37.384Z
---

# A trailing-newline deny row can never fail; test the interior newline

**Gotcha.** The auditor git guard reads its command with `cmd="$(get '.tool_input.command')"`. Bash strips trailing newlines from `$(...)`. So `git diff HEAD` plus a trailing newline reaches the guard as one bare read command. That is no bypass. A row that asserts exit 2 for it can never go green. An earlier plan listed such a row. The landed tests drop it and say why, in the comment above group N.

**The real bypass (#1828).** A newline joins a second command. The residue assignment also strips a newline-only residue to empty. So the verb parser saw only the first verb. An audit seat read `git log HEAD`, newline, `git push` as allowed at base through the `log\ *` verb arm. That claim came from reading the guard, not from a re-run.

**Fix and tests.**
- `hooks/validate-auditor-git.sh` carries an explicit `case "$cmd" in *$'\n'*)` pre-check before the residue assignment.
- It routes to the chain-operator deny text. No deny-message change rides it.
- `hooks/validate-auditor-git.test.sh` group N pins it: N1 (`log HEAD`, newline, `git push`), N2, N3 (`echo pwned`), N3b (the metacharacter rule is not named) and N4 (the one-bare-git-command teach text).

**Two traps.**
- The pre-check's deny text is a hand copy of the classifier's chain-operator literal. Pin the teach text on the copy too. N4 does.
- Sibling comments saying "the char check is the first check after the empty-command guard" went stale once the pre-check landed. Grep ordering claims when you insert a check.

**Test-writing note.** Write the payload as JSON with an escaped newline inside the printf string. The hook then decodes a real newline.

**Locate-cue (verify still present before acting).** `hooks/validate-auditor-git.sh` (search `#1828`); `hooks/validate-auditor-git.test.sh` (search `N1 newline-deny`). Found at landed tip 4e33b6db.
