---
name: git-diff-name-only-hides-a-rename-source-so-scope-checks-need-no-renames
description: "git diff --name-only prints only a rename's destination, so a footprint check needs --no-renames"
metadata:
  node_type: memory
  type: project
  keywords:
    - no-renames
    - name-only
    - rename detection
    - file footprint
    - scopeBreach
    - tip probe
    - delta-scale
    - changed files
  provenance: code-verified
  slug: git-diff-name-only-hides-a-rename-source-so-scope-checks-need-no-renames
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-1
  tags:
    - git
    - engine
    - audit
    - scope
  created: 2026-10-29
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-10-29T13:13:25.095Z
---

# `git diff --name-only` is rename-blind on the source side

**Fact.** Porcelain `git diff` detects renames by default.
With `--name-only` it then prints only the destination path.
A file deleted by a rename drops out of the list.

**Why it matters here.** The ace delta-scale decision reads a changed-file list and transfers seat approvals when the list sits inside the findings' footprint.
A worker can rename a file from outside the footprint onto a path a finding names.
The list then shows only footprint files, and seats never re-judge the lost file.
The seat's independent re-check used the same rename-blind command, so it missed the rename too.

**Rule.** Every name-only diff that feeds a scope, footprint or ownership decision uses `--no-renames`.
Keep the worker cross-check command and the engine source command identical, or a rename forces a needless full panel.

**Locate-cue (verify still present before acting).** Found @ phase 1 landed tip b0c2e25:
- `tipProbe` in `skills/war/assets/workflow-template.js` asks for `files=git diff --no-renames --name-only PRE TIP`.
- `aceScopeClause` in the same file tells the seat to run `diff --no-renames --name-only <pre> <sha>`.
- `skills/war/assets/task-integrated.sh` already used `--no-renames --name-only` for owned paths, the precedent the audit cited.
