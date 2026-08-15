---
name: stdin-mode-cli-parser-silently-drops-space-separated-flag-with-no-positional-fallback
description: "RESOLVED (red-team-gate-cli/1.2, #1378, #1347, #1366): red-team-gate.mjs now runs a default-deny argument check at the top of main(), ahead of mode selection, that refuses every unknown `--` token (and, in --stdin mode, a bare non-flag token) with exit 1 and a stderr diagnostic — the asymmetric-safety gap this lesson documents (file mode refused loudly by an unrelated positional-arg accident; --stdin mode silently dropped the same typo) is closed in both modes. Historical prose below is frozen per the repo's RESOLVED-stamp convention; see the appended ## RESOLVED section for the fix."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: stdin-mode-cli-parser-silently-drops-space-separated-flag-with-no-positional-fallback
  phase: "precision-chain-and-loop-breaker/4.1 (original); RESOLVED by red-team-gate-cli/1.2, landed dev/2026-08-06-red-team-gate-cli @ 765d00f378fc6a6bc04f23ec5b747ab11062aee7"
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
    - RESOLVED
    - default-deny argument check
  tags: 
    - war
    - red-team
    - cli
    - gotcha
  created: 2026-08-06
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-15T00:53:09.580Z
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

## RESOLVED (red-team-gate-cli/1.2, #1378, #1347, #1366)

Verified at landed tip `765d00f378fc6a6bc04f23ec5b747ab11062aee7`
(`skills/red-team/assets/red-team-gate.mjs`): `main()` now opens with a default-deny loop, ahead
of mode selection and the stdin/file read, that walks every argv token and `die()`s (exit 1, a
`unknown argument <token> — accepted forms: …` stderr diagnostic naming the offending token and
the accepted `=`-attached forms) on anything not `--stdin`, a `--rounds=`/`--round-limit=`
`=`-attached flag, or (in `--stdin` mode) the sole recognized bare token. This closes the gap
option (a) from "How to apply" above chose explicitly: one check that runs in every mode, rather
than scoping the doc/test titles narrower. `skills/red-team/assets/red-team-gate.test.mjs` carries
new rows for both the space-separated-value shape and the discriminating bare-token shape in
`--stdin` mode (`node --test skills/red-team/assets/red-team-gate.test.mjs`, 109/109 green at the
tip). The historical prose above still documents the general pattern — the same asymmetric-safety
shape can recur in any CLI adding a second input mode without threading the same default-deny
check through it.
