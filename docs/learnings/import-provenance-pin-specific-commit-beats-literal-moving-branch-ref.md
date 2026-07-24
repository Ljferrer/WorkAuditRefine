---
name: import-provenance-pin-specific-commit-beats-literal-moving-branch-ref
description: "A plan/spec citing an external repo `@ master` for a one-time import is better satisfied by pinning the exact commit actually fetched (and recording why) than by the literal moving-branch citation — verify via the artifact's stated fingerprint invariants, not the branch label"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - import provenance
    - moving branch ref
    - pin commit not master
    - plan literal vs candidate
    - source corpus README
    - fingerprint verification
    - calibration pattern
    - one-time import snapshot
    - external repo not submodule
  provenance: code-verified
  slug: import-provenance-pin-specific-commit-beats-literal-moving-branch-ref
  phase: lessons-learned-seed/phase-1 task 1.2 (landed dev/2026-07-22-lessons-learned-seed)
  tags: 
    - plan-faithfulness
    - provenance
    - documentation
    - calibration
  created: 2026-07-22
  originSessionId: 8a3e4cd6-492f-43ba-b10c-46e460a457b9
  modified: 2026-07-22T20:07:15.493Z
---

# Pinning the exact import commit is more faithful than a plan's literal `@ master`

**What (code-verified — found at `docs/seed/README.md` §Source corpus; verify still present before
acting):** the plan slice and spec (`docs/specs/2026-07-22-lessons-learned-seed-design.md`
§Source corpus, "the 29 scrubbed portable lessons at `Ljferrer/war-game` @ `master`
`docs/learnings/` (~80 KB content bytes ... largest member 7.4 KB)") cite the external corpus by
its **moving branch tip** (`@ master`). The worker instead recorded the **specific commit**
(`5478dba931a6d84250ef5275212a95cb166d863f`, "Scrub WAR-internal cross-refs from seed lessons") and
documented in the README that `war-game`'s `master` has since accumulated unrelated per-run lessons
— so the pinned commit, not the moving label, is the corpus of record. The committed manifest (29
members / 80,068 B / largest 7,387 B) matches the spec's stated fingerprint (~80 KB, largest
7.4 KB), confirming the pinned commit is in fact the state the spec was written against.

**Why this reads correct, not as a deviation:** a one-time import task's actual required output is
"record the source commit" (the plan's own words) — a moving branch label can't satisfy that once
time passes, since the label's target keeps changing. Pinning the immutable SHA that was fetched
*is* recording the source commit; it's strictly more faithful to the plan's intent than restating
the literal `@ master` token. The caveat: the pinned commit itself is unverifiable from a read-only
checkout when the external repo isn't a submodule (no local object to Read/Grep) — but the
corpus-quality invariants that commit claims (member count, byte totals, redaction-clean, zero
`[[wikilinks]]`) are independently gate-enforced by the packer's own `verify` contract, so the
provenance claim doesn't need to be trusted blindly.

**How to apply:** when a plan/spec cites a moving external ref (`@ master`, `@ HEAD`, "the latest
tag") for a one-time snapshot/import, treat the literal ref as a *stand-in* for "whatever state
produces the stated invariants" — check the candidate commit's artifact against the spec's
fingerprint (byte counts, member counts, content hashes) rather than demanding the literal moving
label be reproduced, and don't flag the SHA substitution as a plan-faithfulness violation once the
fingerprint confirms the candidate.
