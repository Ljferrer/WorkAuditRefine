---
name: stdin-mode-cli-parser-silently-drops-space-separated-flag-with-no-positional-fallback
description: "A CLI that accepts both a file-path positional arg and a --stdin mode can be loudly-refusing on a typo'd space-separated flag in file mode (the positional scan grabs the bad value and the file read throws) while silently dropping the same typo in --stdin mode (no positional scan exists to catch it) — the two modes give asymmetric safety for byte-identical operator error"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: stdin-mode-cli-parser-silently-drops-space-separated-flag-with-no-positional-fallback
  phase: precision-chain-and-loop-breaker/4.1
  keywords: 
    - stdin mode
    - flag parsing
    - space-separated flag
    - silent drop
    - positional scan
    - CLI argv parsing
    - red-team-gate
    - flagValue
    - loop-breaker
  tags: 
    - war
    - red-team
    - cli
    - gotcha
  created: 2026-08-06
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-06T21:22:37.364Z
---

# stdin-mode CLI parsers can silently drop a space-separated flag that file-mode refuses loudly

## The pattern

A CLI supporting two input modes — a positional file-path argument, and a `--stdin` flag that
reads from stdin instead — can end up with **asymmetric safety** for the exact same operator
typo. `skills/red-team/assets/red-team-gate.mjs`'s `main()` only supports `=`-attached flag
values (`--rounds=3`); a space-separated form (`--rounds 3`) is not itself parsed:

- **File mode**: `args.find(a => !a.startsWith('--'))` picks the bare `3` as the positional
  results-file path, `readFileSync('3')` throws ENOENT, and the process exits non-zero with no
  verdict on stdout — a loud (if accidental) refusal, and the mapped test the plan mandated
  (`Task 4.1 test row "=-attached flag parsing in file mode"`) pins exactly this outcome.
- **`--stdin` mode**: there is no positional scan to catch the stray `3` token. `flagValue()`
  (verify still present before acting — found at
  `skills/red-team/assets/red-team-gate.mjs`, the closure inside `main()` reading
  `args.find(a => a.startsWith(`--${name}=`))`) simply finds no `--rounds=` match, so `rounds`
  resolves to `undefined`. Because the emission gate is `rounds !== undefined || roundLimit !==
  undefined`, the whole feature this flag drives (here: `routeUpstream`) is silently omitted from
  the output — not defaulted, not erred, just absent, indistinguishable from "the flag was never
  passed at all."

`--stdin` is exactly the mode this repo's own doc surfaces prescribe for the re-pipe path
(`skills/red-team/SKILL.md` Steps 4–5), so the mode with the weaker accidental safety net is also
the one actually used in production.

## Why it's easy to miss

The file-mode refusal test genuinely passes and genuinely proves "space-separated flags are
refused" — but only because of an *unrelated* mechanism (the positional-arg fallback), not
because the flag parser itself validates its input shape. A reviewer skimming test titles sees
"space-separated flag value is refused" and reasonably assumes the guarantee holds everywhere the
flag is documented to work. It does not hold in the mode that lacks a positional fallback.

## How to apply

When a CLI supports more than one input-source mode (file / stdin / env, etc.), check whether a
given argv-validation guarantee is actually enforced by the flag parser itself, or is an
accidental side effect of a *different* mode's positional-argument handling. If it's the latter,
either (a) add an explicit unknown-bare-token check that runs in every mode, or (b) name the
guarantee's actual scope in the doc/test title (e.g. "refused in file mode" rather than the
unqualified "refused") so a reader does not generalize past what was actually tested.
