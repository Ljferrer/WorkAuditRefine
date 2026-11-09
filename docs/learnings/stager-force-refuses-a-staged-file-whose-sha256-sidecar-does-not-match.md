---
name: stager-force-refuses-a-staged-file-whose-sha256-sidecar-does-not-match
description: "stage-workflow --force refuses a hand-edited or sidecar-less staged file, and --discard-injections overwrites it"
metadata:
  node_type: memory
  type: project
  keywords:
    - stage-workflow
    - "--force"
    - "--discard-injections"
    - sidecar
    - sha256
    - injected stage
    - restage
    - staged script
  provenance: code-verified
  slug: stager-force-refuses-a-staged-file-whose-sha256-sidecar-does-not-match
  phase: 2026-11-08-args-floor-and-launch-preflight/1
  tags:
    - war
    - staged-script
    - lead-doctrine
  created: 2026-11-08
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T00:12:38.768Z
---

# `--force` no longer overwrites a staged script unconditionally

`skills/war/assets/stage-workflow.mjs` writes a `<staged>.sha256` digest sidecar beside every staged file (`SIDECAR_SUFFIX`).
`--force` overwrites only if the sidecar matches the file's current bytes.
If the file differs from its sidecar, or has no sidecar, `--force` exits 1 and writes nothing.
The refusal names `--discard-injections` (`DISCARD_FLAG`).
`--discard-injections` overwrites anyway and drops any hand-applied stage.

What this means for a Lead:
- A staged file from before this change has no sidecar, so `--force` refuses it. Use `--discard-injections` only if no injected stage must survive.
- If you hand-edit a staged copy (an injected stage), `--force` now protects it. Re-apply the stage after any `--discard-injections` restage.
- The over-cap remedy also names `--discard-injections`.

Older prose that says "`--force` always overwrites" is stale.
This phase fixed it in `skills/war/references/staged-script.md`, ADR 0037 decision 3 and `GLOSSARY.md`.
A guard test in `skills/war/assets/stage-workflow.test.mjs` ("staged-script doc") binds the flag and suffix names on those surfaces to the stager's exports.

Verify still present before acting: found at `skills/war/assets/stage-workflow.mjs` (`DISCARD_FLAG`, `SIDECAR_SUFFIX`) at landed tip 608887813aa5 of phase 1.
