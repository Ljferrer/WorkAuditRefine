---
name: retirement-grep-for-prose-needle-must-be-case-insensitive-or-sentence-initial-capitalization-evades-it
description: "Case-sensitive retirement greps miss sentence-initial capitalization of retired prose; use grep -i"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: retirement-grep-for-prose-needle-must-be-case-insensitive-or-sentence-initial-capitalization-evades-it
  phase: "red-team-gate-cli/1.2 (plan D8b / End states 6 + 8, red-team round 1 R14), landed dev/2026-08-06-red-team-gate-cli @ 765d00f378fc6a6bc04f23ec5b747ab11062aee7"
  keywords: 
    - retirement grep
    - case-insensitive
    - case-sensitive false negative
    - sentence-initial capitalization
    - grep -i
    - OLD-absent guard
    - doc-consistency gate
    - toLowerCase
    - red-team-gate
  tags: 
    - war
    - red-team
    - testing
    - gotcha
  created: 2026-08-14
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-15T00:53:48.536Z
---

# A retired-prose retirement grep must be case-insensitive, or a sentence-initial rewrite evades it

## The pattern

A "does the retired wording still exist anywhere" backstop — whether a hand-run `grep` in a
plan's Deferred-validations section or a committed drift-guard test — is easy to write
case-sensitively, matching only the exact casing the retired sentence originally had (e.g. lowercase
mid-sentence: `... is refused by construction ...`). If the same retired *idea* is later
re-authored as its own sentence — "Refused by construction: the CLI never reaches the read." — the
leading word is now capitalized, and a case-sensitive literal or regex silently misses it. The
retirement floor reports zero hits and passes, while the retired claim is live in the surface it
was supposed to guard.

This is not hypothetical here: `/red-team` round 1 (R14) executed a probe that reproduced exactly
this false negative against a sandbox carrying a sentence-initial rephrasing of the retired
mechanism claim, before red-team-gate-cli/1.2 landed.

## How it was closed here

Verified at landed tip `765d00f378fc6a6bc04f23ec5b747ab11062aee7`:
- The plan's End state 6/8 shell-grep checks are specified as `grep -in` (not `grep -n`) —
  `-i` is called out as "mandatory, not stylistic."
- `skills/red-team/assets/red-team-gate.test.mjs`'s D8b doc-guard row (the
  `doc-guard D8b: the retired refusal-mechanism wording stays absent from the module AND this
  suite (fail-closed)` test) builds its retired-wording needles from split fragments and compares
  them against `text.toLowerCase()` on both `MODULE_SRC` and `SUITE_SRC`, so any casing of the
  retired phrase in either file is caught, not just the original casing.

## How to apply

Any time a plan or test authors a "retired wording must be gone" backstop (a grep floor, a
drift-guard `assert.ok(!text.includes(...))`/`assert.match` absence check), default to
case-insensitive matching (`grep -i`, a regex `/i` flag, or a `.toLowerCase()` comparison) unless
there is a specific reason the casing itself is load-bearing. Treat a bare case-sensitive
retirement grep as under-covering by default — the sentence-initial-capitalization shape is a
cheap, realistic rewrite a future author will make without thinking about the guard at all.

Related: [[backstop-retirement-grep-false-reds-on-sanctioned-replacement-substring]] (the sibling
failure mode — a retirement grep false-*reds* on a sanctioned substring, the mirror image of this
false-*negative* class); [[old-absent-gate-half-relies-on-unrecorded-hand-grep-fails-silently]]
(the OLD-absent half of a doc-consistency gate is generally the weaker, easier-to-silently-fail
half).

> archived 2026-08-25: resolved — moved to archive
