---
name: guard-deny-string-blanket-adjective-mismatches-mixed-flag-shapes
description: "A guard's own deny message (and the release blurb that mirrors it) called a mixed set of value-attached and bare flags uniformly '=-attached' — a self-contradicting generalization present in shipped code, not just prose"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: guard-deny-string-blanket-adjective-mismatches-mixed-flag-shapes
  phase: "auditor-guard-ergonomics/phase-2 (Release, task 2.1)"
  keywords: 
    - deny string
    - guard error message
    - flag enumeration
    - blanket adjective
    - attached flag
    - bare flag
    - parenthetical enumeration
    - release blurb mirror
    - prose precision
    - self-contradicting generalization
    - branch read-form guard
  tags: 
    - guard-hooks
    - release
    - prose-precision
    - audit-finding
  created: 2026-07-22
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-22T22:23:46.812Z
---

# A guard's deny string can generalize a mixed flag set with one adjective that contradicts its own parenthetical

**What happened (code-verified — Read at the phase's landed task worktree, resolved via
`.git/worktrees/p2-2.11/gitdir` -> `.claude/war/wt/2026-07-22-auditor-guard-ergonomics-2026-07-22/p2-2.1/`
after this servitor's own cwd proved stale; see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]):**
task 2.1's release blurb (README.md `## Status`) reads "every token must be an enumerated
`=`-attached read flag (`--contains=<rev>`, `--merged=<rev>`, `--points-at=<rev>`, `--list`, `-a`,
`-r`, `--show-current`, `-v`)" — but five of the eight enumerated flags (`--list`, `-a`, `-r`,
`--show-current`, `-v`) are bare flags, not `=`-attached. The blurb is not inventing this: it mirrors
the guard's own deny string verbatim. `hooks/validate-auditor-git.sh`'s `branch` read-form loop denies
a bad token with "git branch takes only =-attached read flags (--contains=<rev>, --merged=<rev>,
--points-at=<rev>, --list, -a, -r, --show-current, -v)" — the identical blanket adjective, the
identical mixed enumeration, in the **shipped guard code's own user-facing error text**, not just
release prose. The guard's *behavior* is correct (the allow-list in the `case` arms above the deny
string correctly accepts both flag shapes); only the describing adjective in the message overclaims.

**The pattern:** when a deny/help/status message enumerates an allowed set that mixes two flag
shapes (value-attached like `--foo=<x>` and bare like `-a`/`--all`), do not summarize the whole set
with a single adjective that only fits one shape — the parenthetical enumeration right next to it
will visibly contradict the summary word. This is a distinct failure mode from
[[release-blurb-overstates-guard-semantics]] (which is about describing the wrong *trigger surface* —
diff vs. topology); here the enumeration is accurate and complete, only the one-word characterization
of the whole set is wrong.

**Disposition:** rated Nit, `disposition: note` in both the task audit and the gate-audit — correctly
non-blocking (the guard's actual allow/deny behavior is unaffected; this is user-facing message
precision only). Left unfixed at land: the suggested fix ("every token must be an enumerated read
flag, with `=`-attached values for the rev-taking ones ... plus the bare read flags ...") applies
equally to `hooks/validate-auditor-git.sh` line ~182's deny string, which is out of any one task's
`Files:` list to touch incidentally — a future task that touches this guard's `branch` read-form
arm again is the natural place to fix both copies together.

**How to apply:** when drafting or reviewing a deny string / help text / release blurb that
enumerates a flag set spanning both shapes, check the summary adjective against every enumerated
member before landing, not just against the majority — and remember a Status blurb quoting a guard's
error text verbatim inherits any imprecision already present in that guard's own message, so fixing
only the blurb without the source string leaves the two back in sync but the underlying language
still wrong in both.

Related: [[release-blurb-overstates-guard-semantics]] (sibling family: release-blurb prose
imprecision about guard semantics, different failure mode). [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]
(how this fact was confirmed against the actual landed tip rather than a stale cwd).
