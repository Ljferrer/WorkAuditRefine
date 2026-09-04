---
name: safe-shell-quoting-doc-clause-must-name-every-unsafe-form-not-just-the-one-fixed
description: "skills/war/SKILL.md's args-preflight stdin-piping clause was patched to proscribe only the single-quoted shell literal ('never a single-quoted shell literal') and prescribe a quoted heredoc (<<'JSON'), but its own stated rationale is quote breakage (apostrophes in Commander's Intent / plan-slice prose) not injection -- a double-quoted literal or an unquoted <<JSON heredoc, the actual $()/backtick command-injection vectors over AI-authored prose, are left unnamed and would look like valid fixes for the breakage symptom"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - SKILL.md
    - shell quoting
    - heredoc
    - stdin piping
    - command injection
    - args-preflight
    - single-quoted literal
    - AI-authored prose
    - assert-args-complete
  provenance: code-verified
  slug: safe-shell-quoting-doc-clause-must-name-every-unsafe-form-not-just-the-one-fixed
  phase: 2026-08-25-engine-reliability-and-filing-fidelity/3.2
  tags: 
    - war
    - docs
    - security
    - skill-doc
  created: 2026-08-26
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-26T13:46:49.336Z
---

# A doc fix framed around the symptom (quote breakage) can leave the actual hazard (injection) unnamed

**Code-verified at the landed tip** (`73120000ff9fb694292b1b892a56c507a9308d7b` on
`dev/2026-08-25-engine-reliability-and-filing-fidelity`, read via the still-live `p3-polish` task
worktree, branch tip `24480ebc54a41a7ba6f601ce46cf7833fe72f835` — `skills/war/SKILL.md`, the
Args-complete preflight paragraph): the landed clause reads *"if piping instead, feed stdin via a
quoted heredoc (`<<'JSON'`), **never** a single-quoted shell literal — the assembled args embed the
Commander's Intent and plan-slice prose, which reliably contain apostrophes that break out of single
quotes."* The prescription (quoted heredoc) is safe, but the **stated rationale is quote breakage**,
and the explicit "never" proscribes only the single-quoted form. A reader repairing an apostrophe
problem could reasonably reach for a **double-quoted** literal or an **unquoted** `<<JSON` heredoc —
both re-admit `$`, backtick, and `$(...)` command-substitution processing over exactly the payload the
clause names: AI-authored Commander's Intent and verbatim plan-slice prose, which is untrusted text a
Lead did not author. Following the clause verbatim (the quoted heredoc) is safe; the gap is only in
what the "never" excludes. Filed `disposition: follow-up`, unfixed at land (a last-round phase-close
polish finding on the terminal task, so no further sweep drains it).

**Pattern to remember when writing or reviewing a safe-shell-quoting doc clause for piping
AI-generated or otherwise untrusted prose:** frame the rationale as **injection**, not just quote
**breakage**, and enumerate every unsafe form the reader could plausibly reach for as a "fix" to the
named symptom — single-quoted, double-quoted, **and** unquoted heredoc all need to be named, because a
narrower "never" reads as permission for the unnamed alternatives.

**Related:** none yet in this store; first instance of this specific doc-clause-scope gap.

> archived 2026-09-04: resolved — moved to archive
