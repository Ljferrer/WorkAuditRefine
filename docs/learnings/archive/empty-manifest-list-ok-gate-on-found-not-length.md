---
name: empty-manifest-list-ok-gate-on-found-not-length
description: "readManifest empty list = found+ok; consumers gate on found&&ok, never length"
metadata: 
  node_type: memory
  slug: empty-manifest-list-ok-gate-on-found-not-length
  phase: readManifest-golden/t1
  type: project
  tags: 
    - provision
    - readManifest
    - scout
    - empty-list
    - consumer-contract
    - footgun
  relates: 
    - "[[run-provision-config-not-yet-mirrored-into-template]]"
    - "[[ci-submodule-fixture-omits-lockfile-to-force-ci-source]]"
  created: 2026-06-26
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
---

# Empty provision list is ok:true — gate on `found`, not `provision.length`

`readManifest({provision:[]})` in `skills/_shared/provision.mjs` returns `{found:true, ok:true, provision:[]}` — distinct from missing-manifest `{found:false}`. An empty array is valid ("[] = no steps"): the author's explicit no-steps intent must beat CI derivation.

**Rule:** a consumer's manifest-tier short-circuit gates on `found && ok`, never on `provision.length` — a length check silently hands an intentional empty manifest to CI.

Landed: the at-risk setup-scout consumer shipped with the correct `found && ok` gate.

**Why:** empty-list and absent-manifest are different author intents; a length check conflates them.
**How to apply:** for any found/ok/list return shape, branch on `found && ok`; treat `[]` as an honored answer, not absence.

Related: [[run-provision-config-not-yet-mirrored-into-template]], [[ci-submodule-fixture-omits-lockfile-to-force-ci-source]]

> archived 2026-07-04: resolved — moved to archive
