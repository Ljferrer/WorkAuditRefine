---
name: a-refusal-remedy-shared-by-every-arm-can-tell-the-user-to-launder-the-input-it-refused
description: One remedy line printed for every refusal arm can tell the user to restamp a foreign row and pass the floor
metadata:
  node_type: memory
  type: project
  keywords:
    - remedy hint
    - refusal message
    - launder
    - foreign row
    - restamp
    - provenance floor
    - error message per arm
  provenance: agent-unverified
  slug: a-refusal-remedy-shared-by-every-arm-can-tell-the-user-to-launder-the-input-it-refused
  phase: 2026-11-08-args-floor-and-launch-preflight/1
  tags:
    - war
    - pattern
    - error-messages
    - audit
  created: 2026-11-08
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T00:12:45.552Z
---

# A remedy hint must match the refusal arm that fired

Audit finding resolved in a fix round before land, recorded as pattern, not live instance.

The pattern: a floor has several refusal arms, and the CLI prints one fixed remedy after any refusal.
Some arms then get a remedy that cannot clear them.
Worse, one arm can get a remedy that clears the check by hiding the problem.
In this case, "stamp the row with this run's stamp" on a foreign-plan row would launder a cross-plan leak.
The right remedy for that arm is "drop the row".

How to avoid it:
- Key each remedy clause on the arm's own refusal wording.
- Give a "foreign input" arm a drop remedy, never a restamp remedy.
- Add one test that feeds the foreign arm and asserts the output does not suggest the laundering fix.

A count-only test ("exactly one remedy line") stays green through this defect.
Assert the remedy's content per arm, not only its presence.

Related: [[the-args-preflight-runs-the-templates-own-provenance-floor-slice-so-floor-edits-must-keep-its-markers-and-bindings]], [[weak-test-assertion-passes-without-feature-being-exercised]].
