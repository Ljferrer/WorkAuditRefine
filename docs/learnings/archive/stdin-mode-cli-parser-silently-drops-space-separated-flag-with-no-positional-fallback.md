---
name: stdin-mode-cli-parser-silently-drops-space-separated-flag-with-no-positional-fallback
description: "RESOLVED (#1378): a two-input-mode CLI can enforce an argv guarantee in one mode only, by accident."
metadata: 
  node_type: memory
  type: project
  promoted: dev/2026-08-06-red-team-gate-cli@phase-2
  provenance: code-verified
  slug: stdin-mode-cli-parser-silently-drops-space-separated-flag-with-no-positional-fallback
  phase: "precision-chain-and-loop-breaker/4.1 (original defect); RESOLVED by red-team-gate-cli/1.2; body rewritten to current behavior at operator direction 2026-08-15, verified against dev/2026-08-06-red-team-gate-cli @ 1655b98c6c22be7490cc48809b509d3aeaabd16c"
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
    - asymmetric safety across input modes
    - argv channel vs input keys
    - stdin mode zero bare tokens
  tags: 
    - war
    - red-team
    - cli
    - gotcha
  created: 2026-08-06
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-15T03:02:26.443Z
---

# stdin-mode CLI parsers can silently drop a space-separated flag that file-mode refuses only by accident

## The durable pattern

A CLI supporting two input-source modes — a positional file-path argument, and a `--stdin` flag that
reads from stdin instead — can end up with **asymmetric safety** for the exact same operator typo.
The guarantee "malformed flags are refused" gets enforced in one mode only as a *side effect* of that
mode's positional-argument handling, and therefore does not hold at all in the mode that has no
positional scan. A test proving the refusal in the first mode reads as a general guarantee and is not.

This is worth checking in any CLI that grows a second input mode after its argument handling was
written for the first.

## Current behavior in this repo (verified at `1655b98`, v0.17.1)

`skills/red-team/assets/red-team-gate.mjs`'s `main()` opens with a **default-deny argv loop** that
runs *before* mode selection and before the stdin read, so a malformed invocation fails fast without
consuming the pipe:

- Any `--` token outside `{--stdin, --rounds=<n>, --round-limit=<n>}` refuses in **both** modes.
- In `--stdin` mode, **any** bare (non-`--`) token also refuses — stdin mode consumes no positionals.
- Refusal contract: `die` writes the diagnostic to stderr and exits **1**, with nothing on stdout.
  The message names the offending token and the accepted `=`-attached forms.

Two carve-outs are live **by decision**, not oversight:

1. **File mode still ignores surplus bare tokens.** The positional scan
   (`args.find(a => !a.startsWith('--'))`) is only the path-picking mechanism: the first non-`--`
   token is the results path and any further bare token is dropped. Recorded as a non-goal.
2. **The check covers the argv channel only.** `rounds`/`roundLimit` may also arrive as top-level
   keys in the JSON payload, and a typo'd *key* there still resolves `undefined` and silently omits
   `routeUpstream`. This is an explicit Non-goal — the payload is the red-team Workflow's return
   object, whose top-level key space is open by construction, so a default-deny over keys would be
   wrong.

## What the defect actually was (historical, corrected)

Before the fix, `main()` parsed flag values only in their `=`-attached form via the `flagValue`
closure, and nothing validated unknown tokens:

- **`--stdin` mode** had no positional scan to catch a stray token. `--rounds 3` left `rounds`
  resolving to `undefined`, and because the emission condition was
  `rounds !== undefined || roundLimit !== undefined`, `routeUpstream` was silently omitted from the
  output — not defaulted, not erred, just absent and indistinguishable from the flag never being
  passed. `--stdin` is the mode this repo's own doc surfaces prescribe for the re-pipe path, so the
  weaker net sat on the production path.
- **File mode's "loud refusal" was weaker than originally recorded.** This lesson previously stated
  that file mode refused the same typo because `args.find` picked the bare `3` as the results path
  and `readFileSync('3')` threw ENOENT. That holds **only when the stray value precedes the path**.
  In the order the CLI's own usage line documents (`red-team-gate.mjs <results.json> --rounds 3`),
  `args.find` binds the real path, the trailing `3` is dropped, and the run exits **0** with empty
  stderr and no `routeUpstream`. Established by an executed red-team probe at `8ac52d0`; the earlier
  account overstated the accidental net.

## How to apply

When a CLI supports more than one input-source mode (file / stdin / env, …), check whether a given
argv-validation guarantee is enforced by the argument parser itself or is an accidental side effect
of one mode's positional handling. If it is the latter, either (a) add an explicit default-deny
unknown-token check that runs in **every** mode — the option taken here — or (b) name the
guarantee's real scope in the doc and test titles ("refused in file mode", not an unqualified
"refused") so no reader generalizes past what was actually tested. And when you take (a), state
which *channels* it covers: an argv-only check leaves any parallel input channel (env vars, payload
keys) exactly as silent as before, which is fine as a decision and dangerous as an assumption.

## Provenance of this rewrite

The specific claims above were re-derived from the landed module rather than carried forward. Two
prior corrections are folded in and no longer maintained as separate appendices: the RESOLVED
section had inverted which mode allows a bare token (stdin allows none; the single-bare-token
allowance is file mode's), and the historical file-mode account overstated the accidental refusal as
order-independent. Rewritten at operator direction — current behavior is the truth, superseding the
repo's freeze-the-body RESOLVED-stamp convention for this file
([[resolved-lesson-stamp-freezes-body-so-it-can-contradict-the-new-description]],
[[resolved-section-fix-append-can-itself-misstate-which-mode-a-rule-applies-to]]).

> archived 2026-08-17: resolved — moved to archive
