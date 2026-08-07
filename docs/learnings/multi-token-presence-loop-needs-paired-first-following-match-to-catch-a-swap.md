---
name: multi-token-presence-loop-needs-paired-first-following-match-to-catch-a-swap
description: "A doc-guard test's multi-token presence-anywhere loop (each anchor merely required to appear somewhere in the extracted text) cannot catch two correlated tokens being swapped with each other — replace with a paired first-following-token regex per correlated pair"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-07-24-drift-guard-and-floor-diagnostic-hardening@phase-1
  slug: multi-token-presence-loop-needs-paired-first-following-match-to-catch-a-swap
  phase: drift-guard-and-floor-diagnostic-hardening/1.1
  tags: 
    - drift-guard
    - test-authoring
    - doc-contract-test
    - skill-doc-contracts
    - regex-fragility
  keywords: 
    - presence-anywhere loop
    - paired first-following-token
    - swapped routing
    - D18
    - D31
    - held:escalation
    - held:land-failed
    - correlated pair discrimination
    - non-vacuous companion loop
    - bounded-gap regex
    - cross-key trigger collision
    - forward reference
  created: 2026-07-25
  originSessionId: 4eee3466-8bcc-44f9-a6c2-754d46624537
  modified: 2026-08-06T00:58:21.386Z
---

# A presence-anywhere multi-token loop cannot discriminate a swapped correlated pairing

**What happened (code-verified — found at `skills/war/assets/skill-doc-contracts.test.mjs`, the
D18 test, @ phase drift-guard-and-floor-diagnostic-hardening/1.1, issue #1040):** the D18 test
originally asserted `merge site`, `land site`, `held:escalation`, `held:land-failed` were each
present **somewhere** in the extracted SKILL.md environment bullet (a four-entry "Non-vacuous
companion" presence loop). That loop is satisfied even if the two exhaustion routes are swapped
between the two sites — a doc where "merge site" routes to `held:land-failed` and "land site"
routes to `held:escalation` still greens, because all four literals remain present in the
bullet, merely paired wrong. Fixed by replacing the loop with paired first-following-route
assertions: for each `[site, expectedRoute]` pair (`['merge site', 'held:escalation']`,
`['land site', 'held:land-failed']`), regex-match `` `${site}[^]*?(held:[a-z-]+)` `` against the
bullet and assert the captured token equals the expected route.

**The general pattern:** any doc/prompt-contract test that checks N tokens for
presence-anywhere, where the tokens actually form **correlated pairs** (site → route, key →
value, condition → outcome) rather than an unordered set, cannot discriminate the pairs being
cross-wired. The fix is always the same shape: capture the value that **immediately follows**
each key/site token and assert equality against the expected pairing, not mere co-occurrence of
all tokens in the region.

**Known residuals of the paired-first-following-token fix (accept, document inline, don't
over-engineer):** (a) it assumes site-before-route ordering within each sentence — true today,
and inherent to "first following token" semantics; a doc rewrite that reorders this within a
sentence reds loudly. (b) a doc edit that introduces an early **joint** mention of both
sites/routes ahead of the real per-site sentences ("at either the merge site or land site …")
makes the first-following grab capture from the joint sentence instead — this reds loudly (a
false red demanding a deliberate re-anchor) *unless* the joint mention itself states both routes
in matching order ahead of the real sentences, which would silently pass a bullet whose real
per-site sentences are swapped underneath it — a narrow, low-probability compound-edit escape
worth naming in the guard's own comment, not worth engineering around.

**Instance 2 — the paired first-following-token FIX ITSELF has a forward-reference residual
(2026-08-05, phase 2026-08-05-precision-chain-and-loop-breaker/1.1, D31 in
`skills/war/assets/skill-doc-contracts.test.mjs`, code-verified — found at that file, lines
1494-1495/1540-1541, verify still present before acting): D31 already applies this lesson's own
prescribed fix — bounded-gap paired keys `D31_INTERACTIVE_ARM = /interactive[\s\S]{0,80}approval\s+gate/i`
and `D31_AFK_ARM = /--afk[\s\S]{0,120}refuses\s+dispatch/i` — over SKILL.md's Done-when intake
sub-bullet (two-arm routing: interactive ⇒ approval gate, `--afk` ⇒ refuses dispatch). Multiple
audit seats independently found the SAME residual: a bullet reworded so the OTHER arm's trigger
token appears **inside** one key's bounded gap defeats both keys simultaneously even though the
routing is inverted — e.g. "`--afk` routes interactive-style review to the approval gate; interactive
runs refuses dispatch" satisfies `D31_INTERACTIVE_ARM` (interactive→approval gate = 21 chars, within
the 80-char gap) AND `D31_AFK_ARM` (--afk→refuses dispatch ≈ 82 chars, within the 120-char gap),
while the routing is swapped. This is a THIRD residual beyond the two already recorded above (site-
before-route ordering; an early joint mention) — a **cross-key trigger-token collision**: the bounded
gap of key A can be satisfied by key B's own trigger+value pair sitting inside it. Not fixed at land
(judged Nit/note both times — the live bullet at the pin is correct and the compound-reword class is
narrow), but confirmed as a real gap in the fix pattern itself, not just in the original presence-
anywhere loop it replaced.

**Updated "how to apply":** a bounded-gap paired first-following-token regex (`` `${keyA}[\s\S]{0,N}${valueA}` ``)
still assumes the region between `keyA` and `valueA` contains no OTHER key/value trigger pair for a
sibling arm. When two arms' trigger tokens are short/generic (here: `interactive`, `--afk`) and their
values share vocabulary, tighten the gap as far as the live prose allows, or add an explicit
negative-reference test (an inverted-arm fixture, `assert.doesNotMatch`) proving the pair actually
discriminates the swap — per [[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]].

Related: [[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]]
(closing residual test-narrowing gaps generally); archived
`structure-test-check-f-locks-presence-anywhere-not-intended-location` (a sibling
presence-anywhere gap, but for location/occurrence-count discrimination rather than
correlated-pairing discrimination — the two gaps are distinct failure modes of the same "presence
somewhere isn't enough" family).
