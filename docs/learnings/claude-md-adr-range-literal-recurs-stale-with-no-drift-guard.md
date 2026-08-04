---
name: claude-md-adr-range-literal-recurs-stale-with-no-drift-guard
description: "CLAUDE.md's hand-maintained 'docs/adr/ (0001-NNNN)' range literal has now gone stale twice (ADR 0042, ADR 0043) with no drift guard binding it — expect and check it on every new ADR landing"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: claude-md-adr-range-literal-recurs-stale-with-no-drift-guard
  phase: 2026-08-02-redteam-doctrine-and-guards/1.3+1.6
  keywords: 
    - CLAUDE.md
    - ADR range
    - ADR count literal
    - drift guard
    - doc-cascade sweep
    - out-of-footprint straggler
    - max-N literal
    - recurring rot
    - docs/adr
  tags: 
    - doc-honesty
    - adr
    - doc-cascade
    - recurrence
  created: 2026-08-03
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-03T08:24:21.145Z
---

# CLAUDE.md's ADR-range upper bound recurs stale on every new ADR — no test binds it

## The fact

CLAUDE.md's "## What this repo is" paragraph states `docs/adr/ (0001-NNNN) records the binding
decisions` — a hand-maintained "current max ADR number" literal with no test or drift guard tying it
to the actual contents of `docs/adr/`. It has now gone stale on landing **at least two** separate
ADRs:

1. When ADR 0042 landed, the range needed its own dedicated follow-up fix commit (`git log -S0042 --
   CLAUDE.md` shows the ADR-0042-authoring commit followed by a commit whose subject explicitly
   includes "bump ADR range").
2. When ADR 0043 landed in the 2026-08-02-redteam-doctrine-and-guards phase, the same literal went
   stale again — flagged as a Minor `follow-up`/`absorb` finding at two separate task gate-audits
   (1.3 and 1.6), both correctly out-of-footprint since no task in that plan owned CLAUDE.md.

Verified at the phase's landed tip (4bba660): CLAUDE.md's line does read `(0001-0043)` — this
occurrence was caught and fixed (task 1.3's finding was `disposition: absorb, phaseClose: true`, and
the phase-close pass applied it) — but the underlying recurrence pattern (no mechanical guard) is
unchanged, and this is now a **confirmed second recurrence** of the same class.

Locate cue: verify still present before acting — found at CLAUDE.md's "## What this repo is"
paragraph; will need bumping again the next time a new ADR lands, since no test asserts the literal
against `docs/adr/`'s real contents.

## The durable rule

Any repo-doc literal recording a "current max N" fact about a directory's contents (ADR count, phase
count, version count, etc.) with no drift guard binding it to the directory's actual state will recur
stale on every addition to that directory. Once a class like this has recurred **twice**, treat the
**next** occurrence as expected rather than surprising: check it proactively during any phase-close or
doc-cascade sweep that adds a new numbered doc, and consider proposing a mechanical guard (e.g. a
doc-contract test asserting the literal's upper bound equals `max(readdirSync('docs/adr'))`) instead of
relying on a third manual catch.
