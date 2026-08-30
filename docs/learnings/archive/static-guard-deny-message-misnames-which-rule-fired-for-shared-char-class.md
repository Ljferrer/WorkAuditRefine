---
name: static-guard-deny-message-misnames-which-rule-fired-for-shared-char-class
description: "A static deny message naming one rule fires for every denial sharing its check"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - guard message
    - deny message
    - allowlist vs denylist framing
    - validate-auditor-git.sh
    - metacharacter
    - forbidden character
    - mis-attribution
    - character residue check
    - message design
  provenance: code-verified
  slug: static-guard-deny-message-misnames-which-rule-fired-for-shared-char-class
  phase: 2026-08-06-gate-audit-finding-routing/2.2
  tags: 
    - hooks
    - guard-design
    - message-design
  created: 2026-08-15
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-16T02:54:14.136Z
---

# A static deny message covering multiple denial causes can over-attribute which rule fired

## What happened

`hooks/validate-auditor-git.sh`'s forbidden-character deny (verify still present before acting —
found at :90-91, landed tip `06020944b884d2e2860ccf2fe698ef3d5ba4868e`) is a single character-
ALLOWLIST residue check: any byte outside `[A-Za-z0-9 ./_=:,@^~%+-]` denies. Task 2.2 (#1412 fix
1) appended one static clause to that ONE deny message: "the metacharacter rule fired:
glob/alternation/expansion metacharacters are refused outright".

But the residue check fires for ANY out-of-allowlist byte, not just glob/alternation/expansion
metacharacters — a `&&`/`;` chain operator, a stray `#`, a tab, or a non-ASCII path/rev char all
trigger the SAME message, so a seat denied for a pure chain operator now reads "the metacharacter
rule fired" even though the byte that actually fired is a chain operator, not a metacharacter in
the glob/alternation/expansion sense. This is a milder instance of the exact pathology #1412
exists to cure (a message naming the wrong rule).

Not a security defect and not a hold: no deny decision, exit code, char set, or verb allowlist
moved; the message still echoes the actual offending residue (`head -c 20`) so the seat can see
the real character; and the wording is plan-mandated (the Task 2.2 slice specified this exact
clause at this one site).

## Durable rule

- When appending a NEW named-failure-mode clause to an EXISTING shared deny message (one message
  covering a whole check, not per-cause branching), the new clause inherits every denial cause the
  underlying check covers, not just the one it was written to describe. Either (a) accept the
  over-attribution as a known, scoped tradeoff (message text only, no branching), or (b) branch
  per-cause if precision matters more than the added complexity.
- A message that shifts from an allowlist framing ("only these characters are permitted") to a
  denylist framing ("this class of character is refused") for the same underlying check is
  strictly a superset claim — true whenever it fires, but not necessarily the PRECISE cause.
  Recognize this pattern rather than reflexively "fixing" it — the plan-mandated wording here was
  a deliberate choice, not an oversight.

## Locate cue

`hooks/validate-auditor-git.sh` :90-91 (the `residue=` allowlist check + the deny message
appending "the metacharacter rule fired") — verify still present before acting.

> archived 2026-08-30: resolved — moved to archive
