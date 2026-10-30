---
name: sha12-manifest-key-has-no-code-deriving-it-so-unguarded-prose-defines-its-source-digest
description: "No code cuts the manifest key from the declared digest, so prose that no test binds is its only definition"
metadata:
  node_type: memory
  type: project
  keywords:
    - sha12
    - MANIFEST_PATH_TEMPLATE
    - declared sha256
    - measured digest
    - plan slug
    - placeholder derivation
    - doc-token guard
    - digest manifest
  provenance: code-verified
  slug: sha12-manifest-key-has-no-code-deriving-it-so-unguarded-prose-defines-its-source-digest
  phase: "2026-10-20-rea-artifact-evidence/phase-5 (task 5.1, p5-polish)"
  tags:
    - war
    - rea
    - drift-guard
    - doc-truth
    - test-gap
  created: 2026-10-22
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-23T00:34:07.593Z
---

# The `<sha12>` manifest key has no code behind it

## Fact

The manifest path is `docs/plans/evidence/<plan-slug>/<task-id>.<sha12>.manifest.json`. The export is `MANIFEST_PATH_TEMPLATE`. Three actors fill its three placeholders.

- The engine fills `<plan-slug>` and `<task-id>`. The helper is `manifestPathOf` in `skills/war/assets/workflow-template.js`.
- The worker and the evidence seat each cut `<sha12>`. It is the first 12 hex of the declared sha256 of one cited artifact. The engine leaves it a placeholder, because it does not know which artifacts a task cites.
- The `/war-strategy` recon lane fills `<plan-slug>` for the bundle directory at Stage 0. The plan file does not exist yet at that point.

No production code cuts `<sha12>`. The only code that does is the `resolve` helper inside a test in `skills/war/assets/target-artifacts.test.mjs`. Its distinctness asserts prove the template shape. They prove no behavior.

## What defines the cut

Prose only. A test binds some of that prose and not the rest.

- Bound: the worker clause and the evidence-seat skeleton. A substring assert in `skills/war/assets/workflow-template.engine-1.test.mjs` checks both (test "rea clause and evidence skeleton: one manifest per cited artifact").
- Bound: the `Manifest path:` and `Manifest keys:` lines of `skills/war-strategy/references/artifact-evidence.md`. The doc-token guard extracts and compares them.
- Not bound: the home's sentence that defines `<sha12>`, its `Plan slug:` line, its recon-lane `Digest first:` clause, and the inputs bullet in `agents/war-evidence-auditor.md`. No test file mentions them. Only the plan's End state 28 covers `Plan slug:` and `Digest first:`, as a one-time grep.

## Why the wording matters

"Declared" and "measured" differ when the file on disk drifted from the plan row. The seat finds the manifest through the declared row. A key cut from a measured digest names a file the seat never opens. The card reads a cited artifact with no manifest as SOFT. The seat cannot compare what it cannot find, so the HOLD check does not run for that artifact.

## What happened in phase 5

Task 5.1 landed two operator rulings. D23 made one manifest per cited artifact, keyed by `<sha12>`. D24 made the recon lane digest-first and defined `<plan-slug>` as the plan basename with its date prefix.

Four audit seats found the same gap in one round. Both dispatched prompts said "declared sha256". The doctrine home, the card bullet and the export header comment said only "sha256". Ace round a3 added the word to all three.

Audit finding resolved in a fix round before land, recorded as pattern, not live instance. The missing test is live. A grep for `declared sha256` under test files hits only `skills/war/assets/workflow-template.engine-1.test.mjs`, plus a comment in `skills/war/assets/workflow-template.test-harness.mjs`.

## How to apply

- When you change how a placeholder is derived, edit four surfaces in one commit: the dispatched prompts, the standing card, the doctrine home and the export comment. This is the mirror rule in [[standing-instruction-vs-dispatched-prompt-coverage-split]].
- To stop drift for good, add an extraction guard for the home's `<sha12>` sentence. Copy the way the doc-token guard extracts `Manifest path:`. If you skip it, name the gap in the plan.
- Do not trust a distinctness test whose resolver lives in the test.
- Same blind-spot class: [[doc-token-guard-over-mapped-surfaces-cannot-see-an-unmapped-surface-restating-the-literal]]. Both guards read the value and never the prose around it.

## Locate-cue (verify still present before acting)

- `skills/war-strategy/references/artifact-evidence.md`: search `is the first 12 hex of that artifact's declared sha256`, `Plan slug:` and `Digest first:`.
- `agents/war-evidence-auditor.md`: the inputs bullet that names `<sha12>`.
- `skills/war/assets/workflow-template.js`: search `const manifestPathOf`.
- `skills/war/assets/workflow-template.engine-1.test.mjs`: search `rea clause and evidence skeleton: one manifest per cited artifact`.
- `skills/war/assets/target-artifacts.test.mjs`: search `const resolve =`.

Found at landed tip 82cef9c9, read through the run's `_refinery` worktree. Its HEAD equals the landed tip, so grounding rung 2 held. The cwd checkout was on another branch.
