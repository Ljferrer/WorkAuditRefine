# Golden result — `ci-submodule-repo` fixture

This is the **documented golden-check** for the read-only setup-scout
([`agents/war-setup-scout.md`](../../../../agents/war-setup-scout.md)) applied to the
[`ci-submodule-repo/`](./ci-submodule-repo) fixture in this directory.

There is **no automated `node:test`** for the scout — it is an LLM agent and its output is not
deterministically assertable. Its safety net is threefold (see the Part B plan, *Scout validation*):
the deterministic `structuralFallback` is unit-tested in
[`../../provision.test.mjs`](../../provision.test.mjs); `validateProvision` rejects malformed output before
it is pinned; the operator reviews the proposed list during war-room Setup. This file is the third
leg: a checked-in fixture + the result a correct scout must reach **by hand**.

## Fixture signals

`ci-submodule-repo/` declares its own setup — the scout reads these, it carries no ecosystem table:

- `.github/workflows/test.yml` — `actions/checkout@v4` with **`submodules: recursive`**, then
  `pnpm install --frozen-lockfile`, then `pnpm test`.
- `.gitmodules` — one submodule (`vendor/engine`), confirming the recursive checkout is real.

No explicit `run.provision` is supplied, and there is no `.devcontainer`, `Makefile`/`Justfile`
`setup` target, nor `package.json` setup script — so authority resolves to **CI** (the second tier,
below explicit operator intent and above onboarding / structural fallback).

## Expected scout result

```json
{
  "provision": [
    "git submodule update --init --recursive",
    "pnpm install --frozen-lockfile"
  ],
  "source": "ci",
  "rationale": "No explicit run.provision and no onboarding signal (.devcontainer / Makefile setup / package.json setup script); .github/workflows/test.yml checks out with submodules: recursive (confirmed by .gitmodules) and installs with `pnpm install --frozen-lockfile`. Derived a submodule-init step (the structuralFallback floor) followed by the CI install step, in that order."
}
```

## Why this exact list, in this order

1. **`git submodule update --init --recursive` first.** The CI checkout uses `submodules: recursive`
   and a real `.gitmodules` is present, so the worktree must initialize submodules before any install
   can see vendored sources. This is exactly the submodule-init line that
   `structuralFallback` (`SUBMODULE_INIT` in [`../../provision.mjs`](../../provision.mjs)) emits — the
   scout reuses that floor verbatim rather than inventing its own command.
2. **`pnpm install --frozen-lockfile` second.** Taken **verbatim from the CI workflow's install
   step** — not from any language/ecosystem assumption the scout holds. (It coincides with the
   `pnpm-lock.yaml → pnpm install --frozen-lockfile` mapping in `structuralFallback`, which is the
   point: CI agrees with the structural floor here, and CI is the cited `source`.)
3. **`source: "ci"`** because the install command was read out of `.github/workflows/`, the
   highest-authority signal present after (absent) explicit operator intent.

## Golden-check procedure

1. Point the scout at `skills/_shared/fixtures/provision/ci-submodule-repo/` as the target repo.
2. Follow the agent prompt's algorithm: explicit list? none → scan `.github/workflows/*.yml` → found.
3. Confirm the emitted object equals the **Expected scout result** above (list contents + order,
   `source: "ci"`, a rationale that cites CI + the submodule signal).
4. Confirm `validateProvision(result.provision).ok === true` (array of non-empty trimmed strings).

---

## Golden — manifest-repo

This is the documented golden-check for `readManifest()` applied to the [`manifest-repo/`](./manifest-repo) fixture.

### Fixture signals

`manifest-repo/` contains **both** a committed manifest **and** a competing CI workflow:

- `.war-provision.json` — `{"provision":["./scripts/bootstrap.sh","cargo build --locked"],"rationale":"committed manifest golden"}`
- `.github/workflows/test.yml` — uses `pnpm install --frozen-lockfile` (a **different** install command, intentionally)

### Expected readManifest result

```json
{
  "found": true,
  "ok": true,
  "provision": ["./scripts/bootstrap.sh", "cargo build --locked"],
  "rationale": "committed manifest golden"
}
```

### Why manifest beats CI here

Authority resolves to **manifest** (tier 1) over **CI** (tier 2). `readManifest` returns the committed
`.war-provision.json` list verbatim — it never consults `.github/workflows/`. The scout would then emit
`source: "manifest"` and skip CI derivation entirely when `found && ok`.

The unique command `./scripts/bootstrap.sh` (absent from the CI workflow) is the assertion anchor in
`provision.test.mjs` — it confirms the reader returns the manifest list, not the CI install.
