---
name: bare-interpolation-census-generic-parameter-name-erodes-default-deny-guard
description: A default-deny bare-interpolation census admitting a generic parameter name exempts every future span reusing that name
metadata: 
  node_type: memory
  type: project
  keywords: 
    - BARE_INTERPOLATION_CENSUS
    - default-deny
    - generic parameter name
    - census erosion
    - workflow-template
    - ace ladder
    - bare interpolation
    - wildcard exemption
  provenance: code-verified
  slug: bare-interpolation-census-generic-parameter-name-erodes-default-deny-guard
  phase: 2026-09-11-backward-chain-doctrine/phase-2 (task 2.1)
  tags: 
    - engine
    - structural-test
    - default-deny
    - drift
  created: 2026-09-12
  originSessionId: 5a652d85-60d8-4ec9-9cbf-3333802c7056
  modified: 2026-09-12T23:41:11.431Z
---

`BARE_INTERPOLATION_CENSUS` in `skills/war/assets/workflow-template.test.mjs` is a default-deny
allowlist: a new fallback-free `${...}` interpolation site must be individually classified
(guarded, or added by exact name) or the census-drift assertion fails. During phase 2's ace
re-entry ladder, three separate rounds independently proposed admitting a generic identifier
(`n`, then a single-letter helper parameter, then `file`) into the census. A generic name is a much
weaker admission than a specific one: once `'file'` sits in the list, ANY future `${file}` span
anywhere in the template is silently exempted from the census's classification duty, not just the
one call site the finding was about. The `file` entry landed and is present in the census at land
time (its removal/rename attempt was one of the a6 batch's regressed and forward-reverted findings,
filed as follow-up #1860).

When fixing a bare-interpolation-census finding, prefer renaming the local/parameter to something
specific to its call site over adding the generic name to the allowlist — the census's value is
exactly that it can't be satisfied by a wildcard-shaped identifier.

Locate-cue: verify still present before acting — `'file'` entry in `BARE_INTERPOLATION_CENSUS`,
`skills/war/assets/workflow-template.test.mjs` (~line 12512).
