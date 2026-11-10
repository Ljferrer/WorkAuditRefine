---
name: bsd-mktemp-ignores-tmpdir-gnu-only
description: "BSD mktemp -d ignores the TMPDIR env var; a TMPDIR=... mktemp -d pin is a macOS no-op and only takes effect on GNU coreutils (Linux CI)"
metadata:
  node_type: memory
  slug: bsd-mktemp-ignores-tmpdir-gnu-only
  phase: guard-hermeticity/tC
  type: project
  tags:
    - war
    - platform
    - mktemp
    - tmpdir
    - bsd
    - gnu
    - macOS
    - hermeticity
    - refiner
  files:
    - agents/war-refiner.md
  relates:
    - "[[standing-instruction-vs-dispatched-prompt-coverage-split]]"
  created: 2026-06-26
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
---

# BSD mktemp ignores TMPDIR — TMPDIR pin is a macOS no-op

## What was found (guard-hermeticity #95b / tC — Nit, ratified)

`agents/war-refiner.md` step 2 (verify still present before acting) instructs:

```
TMPDIR=$(cd / && mktemp -d)
```

The intent is to isolate the refiner's scratch work from the caller's `$TMPDIR`, preventing
interference from inherited env. On **GNU coreutils** (Linux, typical CI) `mktemp -d` honors
`TMPDIR` and the pin changes where the temp dir lands. On **BSD** (macOS, Darwin) `mktemp -d`
**ignores `TMPDIR` entirely** — it always uses `/tmp` regardless of the env var.

The plan explicitly acknowledged this (docs/plans/2026-06-26-guard-and-test-hermeticity.md
lines 192-194): the change is described as "forward-looking defense-in-depth" for GNU CI, and
the macOS no-op is ratified. The implementation is correct given the stated scope.

## The portable pattern

If you need `mktemp -d` that actually respects a custom base directory on both macOS and Linux,
use the explicit `-t` flag with `TMPDIR` set as a base **only on GNU**, or use the long-form
`mktemp -d /path/to/base/XXXXXX` instead:

```bash
# Portable: explicit prefix path, no reliance on TMPDIR honor
scratch=$(mktemp -d /desired/base/XXXXXX)
```

or, if you only need isolation on the refiner's known macOS/Linux hosts:

```bash
# macOS-friendly: isolate via explicit root, TMPDIR still ignored on BSD but harmless
mkdir -p /var/tmp/war-scratch && scratch=$(mktemp -d /var/tmp/war-scratch/XXXXXX)
```

## Durable rule

> Any script that sets `TMPDIR=...` and then calls `mktemp -d` expecting it to land under
> that directory must not rely on that behavior on macOS. Verify behavior is load-bearing on
> GNU before treating the pin as a correctness guarantee.

Relates to [[standing-instruction-vs-dispatched-prompt-coverage-split]] (the directive where
this pin lives, and its partial coverage scope).

> archived 2026-07-04: resolved — moved to archive
