---
name: two-part-negated-scan-regex-key-can-have-one-unproven-fragment-despite-suite-green
description: "A regex key combining a live-token trigger anchor with a negated-scan gap (e.g"
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
    - D22 ordered span
    - residual recorded not waived
    - fragment-level coverage gap
    - N-arm ordered key
    - residual comment retirement risk
  tags: 
    - structural-test
    - audit-finding
    - regex
    - coverage-gap
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-18T12:00:18.544Z
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

**Second instance (2026-08-06-gate2-publication-guard/1.1, Minor×2, disposition follow-up — the
gate-audit's own ES5 attestation confirms this shape landed, Escalations: [], gateEvidence:true at
auditSha `835d8c8e97e50c6450283c864d7efc5b9ebc1c3e` — checkout-topology note: no live worktree for
the phase branch existed at write time, cwd HEAD was `master`@`a7a54dab`, so this instance is
recorded from the pinned gate-audit's own quoted diffs, not a direct Read):** the same blind spot
recurs at **N-arm** scale, not just 2-fragment. `D22_ORDERED_SPAN` in
`skills/war/assets/skill-doc-contracts.test.mjs` (verify still present before acting) is a
9-fragment ordered-span key (`docs(learnings): phase N` → `fetch origin` → `git log --name-only`
→ … → `ensure-origin` push invocation, chained by `[\s\S]*?`). Scratch-deleting each of the nine
fragments separately against all eight wired negative references proved seven fragments
load-bearing, but two survive deletion against every negative and red nothing: the
`do\s+\*{0,2}not\*{0,2}\s+push` refusal clause (every one of the eight negatives still carries
`do **not** push`) and the leading `docs\(learnings\): phase N` position anchor (every negative
also opens with that line). Both are asserted load-bearing by the row's own failure message ("the
probe without the refusal is advice"), yet neither has a both-ways proof. **The new nuance this
instance adds:** the same diff that closed two *other* fragments' gaps ((d) command-form, (e)
revert-routing) also **retired the RESIDUAL-tracking comment** that had been this file's mechanism
for keeping such gaps visible — its replacement text is scoped precisely to the closed pair and
records no residual at all. Nothing false is stated (the file never claims the refusal/anchor
fragments are proven), but a reader now sees no signal that two fragments remain unproven — closing
a subset of a residual can silently erase visibility into the rest unless the tracking comment is
rewritten to enumerate what's *still* open, not just what closed.

**The durable rule:** when a regex key is built from more than one tightening fragment — a
2-fragment anchor+negated-gap pair, or an N-arm ordered span chaining several literal/regex
fragments — suite-green is not proof each fragment is load-bearing. Prove each fragment
**individually** by scratch-deleting it and checking every wired negative reference still reds at
least one assert; a fragment that survives deletion against every fixture guards a real but
currently-unfixtured shape (or, per the second instance, a fragment every negative fixture happens
to share verbatim — a fixture-design gap, not a regex-design one). The accepted resolution when
closing the gap is out of scope (as it was in both instances) is to **record the residual
explicitly** (this repo's convention, e.g. a `RESIDUAL, recorded rather than waived:` comment
naming exactly which shape would close it) rather than either silently shipping the unproven half
or blocking the phase over it — a Minor/follow-up disposition that lands as documentation, not a
fix, is a legitimate outcome when the closing fixture is a genuinely separate unit of work. **When
a later diff closes only some of a recorded residual's gaps, rewrite the tracking comment to name
the gaps that remain — do not let "residual closed" language read as "fully proven" while other
arms of the same key are still unproven.**
