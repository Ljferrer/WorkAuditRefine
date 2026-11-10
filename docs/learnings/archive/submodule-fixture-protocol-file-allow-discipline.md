---
name: submodule-fixture-protocol-file-allow-discipline
description: file:// submodule fixtures need -c protocol.file.allow=always on every transport cmd
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: submodule-fixture-protocol-file-allow-discipline
  phase: submodule-support-increment-1-guard/T1
  tags: 
    - submodule
    - shell-test
    - git
    - protocol
    - fixture
    - ci
  created: 2026-06-30
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
---

# `-c protocol.file.allow=always` is required on every submodule transport command in shell fixtures

## The rule

Any shell test that uses a local `file://` path (or bare filesystem path) as a submodule
"remote" must pass `-c protocol.file.allow=always` on every `git` invocation that performs
a submodule transport operation:

```sh
git -C "$R" -c protocol.file.allow=always submodule add -q "$SUB_REPO" sub
git -C "$R" -c protocol.file.allow=always submodule update --remote -q sub
```

Verify still present before acting — every `submodule add` / `submodule update --remote`
invocation in the per-case fixture setup of
`skills/war/assets/assert-no-submodule-mutation.test.sh` carries the flag (13 transport
commands as of v0.14.2; the fixture grew from 4 and the discipline held).

## Why

Modern git (≥2.38.1, hardened after CVE-2022-39253) blocks `file://` local-path submodule
transport by default. Any `submodule add`, `submodule update`, or clone that fetches from a
`file://`-equivalent path will fail with a "transport protocol forbidden" error unless the
flag is explicitly set for that command.

## Scope

The flag must travel with **every** transport command in the fixture, not just the first one.
A future fixture edit that adds a new `submodule add` or `submodule update` without the flag
will produce a spurious fixture-setup failure on CI, which silently removes the test case
from the result rather than reporting a test failure — eroding coverage without a red signal.

## The flag does NOT belong in the production guard script

`assert-no-submodule-mutation.sh` runs `git diff --raw` and `git config -f .gitmodules ...`
only — no submodule transport. The flag is a fixture-only concern.

## Cross-links

- [[gitmodules-working-tree-read-vs-ref-snapshot]] — the other Increment 1 Nit about the
  `.gitmodules` cross-check reading the working-tree file.
- [[ci-submodule-fixture-omits-lockfile-to-force-ci-source]] — separate submodule fixture
  discipline (lockfile omission to force CI source resolution).

> archived 2026-07-04: resolved — moved to archive
