---
name: ""
metadata:
  node_type: memory
  slug: ci-submodule-fixture-omits-lockfile-to-force-ci-source
  phase: B2
  type: project
  keywords: [pnpm-lock.yaml, frozen-lockfile, golden ambiguity, structural fallback, setup scout, source enum, install step derivation, load-bearing absence]
  tags:
    - war
    - provisioning
    - fixtures
    - setup-scout
    - golden-test
    - design-rationale
    - do-not-break
  files:
    - skills/_shared/fixtures/provision/ci-submodule-repo/.github/workflows/test.yml
    - skills/_shared/fixtures/provision/ci-submodule-repo/.gitmodules
    - skills/_shared/fixtures/provision/EXPECTED.md
    - agents/war-setup-scout.md
  relates:
    - "[[run-provision-config-not-yet-mirrored-into-template]]"
    - "[[provision-barrier-refiner-owned-not-worker-self-create]]"
  created: 2026-06-25
  originSessionId: 53421d17-5351-48da-baf8-7d315d56c7b5
---

# The ci-submodule-repo fixture deliberately has NO lockfile — adding one breaks the golden

## The design (what landed in B2 / T3, #73)

T3 added `agents/war-setup-scout.md`, a read-only scout that derives `run.provision` from repo
signals in a fixed precedence: **explicit → manifest → CI → onboarding → structural** (the
`manifest` step — a committed `.war-provision.json` — was inserted after B2; see the scout's
`source` enum). The scout holds **no ecosystem table**; the structural floor is delegated to
`provision.mjs#structuralFallback`.

To exercise the **read-the-signal (`source:'ci'`) path** rather than the structural floor, the
fixture `skills/_shared/fixtures/provision/ci-submodule-repo/` ships a `.github/workflows/test.yml`
and a `.gitmodules`, **but intentionally NO lockfile**. The golden lives one directory up at
`skills/_shared/fixtures/provision/EXPECTED.md` (its `ci-submodule-repo` section) and expects the
install step `pnpm install --frozen-lockfile`.

## Why the omission is load-bearing (do NOT add a lockfile)

`pnpm install --frozen-lockfile` can **only** be sourced by *reading the CI workflow* — there is
no `pnpm-lock.yaml` in the fixture for a structural heuristic to key off. That forces
`source:'ci'` and proves the scout actually read the signal.

If you add a lockfile to this fixture, the structural floor could *also* legitimately produce a
pnpm install step, so the golden becomes **ambiguous between `ci` and `structural`** — the test
would pass even if the scout fell back to the floor instead of reading CI, silently killing its
discriminating power. The fixture's value is precisely that the only path to the expected output
runs through the CI-read branch.

## How to apply

- **Do not add `pnpm-lock.yaml` (or any lockfile) to `ci-submodule-repo/`.** The absence is the
  test design, not an oversight.
- Fixtures for other sources live **separately** so each golden stays unambiguous about which
  `source` it proves — this now exists: `pnpm-repo/` (lockfile only, structural floor) and
  `manifest-repo/` sit alongside `ci-submodule-repo/` under `skills/_shared/fixtures/provision/`.
- The `.gitmodules` is there to confirm submodule-aware behavior coexists with CI-derived install
  steps; it is not the install-step source and should not be conflated with one.

> archived 2026-07-11: resolved — moved to archive
