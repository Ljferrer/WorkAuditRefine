# A packaging floor, an opt-in docker-build gate, and ratified backstops close the container-packaging blind spot

**Status:** accepted (design ratified 2026-07-06; implementation tracked by the spec below)

A WAR-executed task added a Python module beside `loader.py`; the loader's Dockerfile COPYs its
deps **individually** and was never updated. The unit gate was green (the file sits next to
`loader.py` in the repo tree), the audit was unanimous, the merge landed — and the *image*
crash-looped in the deploy pipeline (field incident, 2026-07-06). The gate is repo-unit-scoped by
design; nothing pre-merge exercises the deployable artifact. Worse, the Lead had flagged
Docker/integ testing as an out-of-scope backstop in free prose — a waiver nobody ratified, nothing
scheduled, and nothing surfaced at land time. A future reader will ask why a heuristic shell guard
inspects Dockerfiles when `docker build` exists, and why plans must carry a backstop section even
when it says `None`; this records it. Full mechanics:
[the design spec](../specs/2026-07-06-container-packaging-blind-spot-design.md).

## Decision

Three complementary mechanisms, one per failure surface:

1. **A deterministic packaging floor** (`assert-packaging-in-diff.sh`, the ADR 0006 idiom): a task
   that adds/renames a file beside individually-COPY'd siblings of a Dockerfile must package it
   (`COPY`), exclude it (`.dockerignore`), or be exempted (`requiresPackaging: false`, fail-closed
   default `true`) before it can merge. Run by the refiner at merge-task alongside the test floor,
   exit contract 0/1/2. A miss is the new `unpackaged` merge outcome — routed like `no-test`
   (bounded fix-worker + **full** re-audit on the shared budget; exhaustion escalates hard, wired
   into both `HARD_ESCALATION_REASONS` mirrors + drift guard). Coarse and heuristic **by design**:
   it proves enumerated packaging kept up with the diff, not that the image builds.
2. **An opt-in docker-build gate**: `/war` Setup's existing ask-once gate detection additionally
   discovers Dockerfiles and probes `docker info`. Daemon reachable → offer appending
   `docker build -f <each>` to the declared base gate (operator confirms/trims; stored in
   `overrides.gate` — no new config key, `resolveGate()` untouched, the gate stays one string run
   verbatim everywhere). Daemon unreachable → the docker gate **degrades into an auto-recorded
   backstop**, never a `gate_failed` that blames the code.
3. **Ratified backstops**: the plan template gains a required `## Deferred validations (backstops)`
   section (explicit `None` allowed), locked by the structure test, graded for legitimacy by
   `/red-team`, threaded as `args.backstops` (a Lead-normalized array merging plan-declared and
   Setup auto-recorded entries), and surfaced as **unexecuted** in every phase report, the final PR
   body, and the machine-readable handoff block (aggregated by the campaign ledger). A
   `/war-machine --afk`-authored section is marked **AI-declared** (the ADR 0014 provenance rule
   applied to waivers) and never renders as operator-ratified. The Lead may never waive a
   validation in prose that is in neither the gate, a floor, nor this section — it escalates
   instead. (Distinct from the ace's release-slot *string backstop*, ADR 0013 — the glossary
   disambiguates.)

## Considered options

- **A mandatory docker-build gate for every repo with a Dockerfile (rejected).** Definitive, but
  forces a docker-daemon dependency on any repo that merely contains a Dockerfile, is slow on big
  images with no operator moment to trim, and misclassifies daemon absence as broken code. The
  opt-in offer + daemon probe keeps the definitive check available without the coupling.
- **An import-aware floor (rejected).** Flag only files a COPY'd file actually imports —
  near-zero false positives but language-specific parsing in a shell guard, and it misses
  non-import runtime needs (data files, schemas).
- **An advisory (non-blocking) floor (rejected).** A hit becomes an audit finding for judgment —
  which reintroduces exactly the judgment gap that let the incident through.
- **A built-in `packaging` roster lens (not built).** The lens namespace is already open; a run can
  mint one ad hoc. Building it would add catalog surface for something the floor + gate cover
  deterministically.
- **Authoring-only backstops (rejected).** Template + red-team ratification without runtime
  surfacing leaves the incident's exact failure — ratified-then-forgotten — possible; nothing
  reminds anyone at land time.

## Consequences

- `MERGE_RESULT.status` gains `unpackaged`; `HARD_ESCALATION_REASONS` gains `unpackaged` (both
  hand-mirrored copies + the drift guard); the task DAG gains `requiresPackaging`; the handoff
  block gains `backstops[]`.
- The floor's false positives are bounded by three one-line clearances, and its `.dockerignore` /
  build-context support is a documented subset that **fails toward flagging** (an unparseable
  pattern never silently excuses a file).
- The plan template contract widens: every newly authored plan states its deferred validations or
  `None`; legacy plans surface a "no backstop section" note rather than failing.
- "Out of scope" stops being a prose waiver and becomes a first-class, ratified, land-time-visible
  artifact — including gates that degrade (docker daemon unavailable) mid-setup.
- The floor and the docker-gate offer share one Dockerfile discovery expression — the ADR 0006
  floor/gate-alignment consequence, applied to packaging.

## References

- Design spec: [`docs/specs/2026-07-06-container-packaging-blind-spot-design.md`](../specs/2026-07-06-container-packaging-blind-spot-design.md)
  — full mechanics, surface changes, validation criteria.
- Field incident (2026-07-06): loader Dockerfile missing `COPY case_metadata.py .` — the
  originating defect.
- [ADR-0006](0006-deterministic-test-floor.md) — the floor idiom (coarse floor / semantic ceiling,
  tested shell guard, fail-closed exemption, routed miss).
- [ADR-0013](0013-commanders-intent-and-disposition-routing.md) — the verbatim-extraction and
  surfaced-disposition precedents `args.backstops` follows.
