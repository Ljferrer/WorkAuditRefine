---
name: admitting-a-risky-verb-to-a-read-only-guard-needs-default-deny-by-token-shape-with-cluster-expansion
description: Admit a verb that carries an exec flag by default-denying every token shape and expanding short clusters letter by letter
metadata:
  node_type: memory
  type: project
  keywords:
    - git grep
    - validate-auditor-git
    - "-O pager"
    - open-files-in-pager
    - flag cluster
    - token shape
    - default-deny
    - narrow form
    - compensating control
    - ADR 0029 amendment
  provenance: code-verified
  slug: admitting-a-risky-verb-to-a-read-only-guard-needs-default-deny-by-token-shape-with-cluster-expansion
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.1
  tags:
    - war
    - hooks
    - guard-design
    - auditor
    - adr
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-23T09:44:44.983Z
---

# How the auditor git guard now admits `git grep` without opening the pager hole

**ADR record.** ADR 0029 Amendment 2026-10-22 (plan D21, task 6.1) reverses the 2026-07-26 "still no". The reason: no seat had the Grep tool on Claude Code 2.1.304, so the auditors had no search channel. The compensating control is the audit tree fingerprint hook (D22).

**Why the verb stayed out for so long.** `git grep -O<cmd>` (`--open-files-in-pager`) runs an arbitrary command. A verb allowlist cannot admit `grep` while that flag exists.

**The design (repeat it for any risky verb).** The grep block in `hooks/validate-auditor-git.sh` admits ONE shape: `-F` (or `--fixed-strings`) plus exactly one `-e <token>`, optional `n i l w c`, at most one bare revision, and an optional `-- <pathspec>`. It denies every other token by shape and does not enumerate the option space:
- Any other long flag: `--no-index`, `--recurse-submodules`, `--file`, the regex selectors.
- A short cluster is parsed letter by letter. That is the only way to catch `-nO` or `-Ovim`. `O`, `E`, `G`, `P`, `f` and `e` inside a cluster all deny.
- The `-e` value is consumed as data, as git does, so `-e -O` searches for the literal "-O".
- The deny message names `-O` explicitly.

The `git branch` read-form loop beside it uses the same default-deny-by-shape idea.

**Test insight.** Group P of `hooks/validate-auditor-git.test.sh` pins the opening fragment of the deny message and the "-O runs a pager command" clause, so reshape both together. The plan's End state 24 greps the exact labels: `git grep -F -e token allowed`, `git grep without -F denied`, `git grep -O denied`, `git grep -nO cluster denied`, `git grep --no-index denied`.

**Locate-cue (verify still present before acting).** The "NARROW-FORM grep enforcement" block in `hooks/validate-auditor-git.sh` and the Amendment 2026-10-22 section of `docs/adr/0029-capture-grounds-on-committed-tip.md`, found at landed tip d66961d9 on `dev/2026-10-20-rea-artifact-evidence`.

Related: [[allowlist-catch-all-token-defeats-meta-guard]], [[auditor-seat-can-lack-grep-glob-tools-leaving-no-search-channel]], [[auditor-grep-tool-unrestricted-by-git-verb-bash-guard]], [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]].
