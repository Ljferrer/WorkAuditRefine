---
name: two-part-negated-scan-regex-key-can-have-one-unproven-fragment-despite-suite-green
description: "A regex key combining a live-token trigger anchor with a negated-scan gap (e.g. /trigger(?:(?!other)[\\s\\S]){0,N}target/i) can pass every wired negative-reference fixture while only the anchor half is load-bearing — mentally scratch-delete EACH fragment separately against ALL negative references, not just the pair-level assert, to find an unproven half"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: two-part-negated-scan-regex-key-can-have-one-unproven-fragment-despite-suite-green
  phase: 2026-08-06-structural-pin-extractors/1.2
  keywords: 
    - negated lookahead gap
    - both-ways proof
    - regex tightening fragment
    - scratch deletion
    - unfixtured shape
    - D31 arm keys
    - residual recorded not waived
    - fragment-level coverage gap
  tags: 
    - structural-test
    - audit-finding
    - regex
    - coverage-gap
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T19:31:01.998Z
---

# One half of a two-fragment regex tightening can be dead weight even when the suite is green

**The instance (2026-08-06-structural-pin-extractors/1.2, Minor, disposition absorb — recorded,
not closed):** `D31_INTERACTIVE_ARM` in `skills/war/assets/skill-doc-contracts.test.mjs` —
verify still present before acting, found at that file's D31 key-array block — is
`/interactive\s+runs(?:(?!--afk)[\s\S]){0,80}approval\s+gate/i`, carrying two tightening
fragments: the live-token trigger anchor (`interactive\s+runs`) and the negated-scan gap
(`(?!--afk)`). Traced by mentally deleting each fragment separately against both negative
reference fixtures (`D31_ARMS_SWAPPED`, `D31_ARMS_COLLIDED`): deleting the anchor makes the key
match the collided fixture (reds the `doesNotMatch` assert — proven load-bearing). Deleting
`(?!--afk)` instead reds **nothing** — on `ARMS_SWAPPED` the `interactive runs` → `approval gate`
distance is already ~165 chars, past the `{0,80}` bound on its own; on `ARMS_COLLIDED` no
`approval gate` follows the fixture's one `interactive runs` token at all. The mirror key,
`D31_AFK_ARM`'s `(?!interactive)` gap, IS proven (deleting it makes the key match `ARMS_COLLIDED`
at a measured 111-char gap, inside its `{0,120}` bound). The suite stays green either way — this
is a genuine coverage gap, not a wrong test — because no fixture exercises the shape the gap is
meant to reject (`interactive runs` ... `--afk` ... `approval gate`, all within 80 chars).

**The durable rule:** when a regex key is built from more than one tightening fragment (anchor +
negated gap being the common WAR shape — see the D22/D30 "both halves must each red their own
scratch-deletion" discipline), suite-green is not proof each fragment is load-bearing. Prove each
fragment **individually** by scratch-deleting it and checking every wired negative reference still
reds at least one assert; a fragment that survives deletion against every fixture guards a real
but currently-unfixtured shape. The accepted resolution when closing the gap is out of scope (as
it was here) is to **record the residual explicitly** (this repo's convention, e.g. a `RESIDUAL,
recorded rather than waived:` comment naming exactly which shape would close it) rather than either
silently shipping the unproven half or blocking the phase over it — a Minor absorb disposition that
lands as documentation, not a fix, is a legitimate outcome when the closing fixture is a genuinely
separate unit of work.
