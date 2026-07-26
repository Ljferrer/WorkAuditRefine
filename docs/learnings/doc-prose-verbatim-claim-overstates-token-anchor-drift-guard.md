---
name: doc-prose-verbatim-claim-overstates-token-anchor-drift-guard
description: "RESOLVED (drift-guard-and-floor-diagnostic-hardening/1.4, #1080): A standing-doc sentence claiming a mirrored block is carried 'verbatim' on another surface overstated what the backing D3/D5 registry row actually enforces (regex token-anchor presence, not byte-identity) — the claim is now retired and locked by a committed absence assertion"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-07-22-auditor-guard-ergonomics@phase-1
  slug: doc-prose-verbatim-claim-overstates-token-anchor-drift-guard
  phase: auditor-guard-ergonomics/phase-1 task 1.2
  keywords:
    - mirrored verbatim
    - byte-identity claim
    - token-anchor drift guard
    - D3 registry row
    - REGISTRY anchors
    - doc prose overstatement
    - both-surfaces coupling
    - war-auditor.md
    - auditPrompt
    - drift-guard enforcement mode
    - carried on both surfaces
    - assert.doesNotMatch retired claim lock
  tags:
    - war
    - documentation-accuracy
    - drift-guard
    - test-design
    - workflow-template
    - auditor
  files:
    - agents/war-auditor.md
    - skills/war/assets/workflow-template.test.mjs
  relates:
    - "[[gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity]]"
    - "[[mirror-registry-verification-mode-by-construct-kind]]"
    - "[[standing-instruction-vs-dispatched-prompt-coverage-split]]"
  created: 2026-07-22
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-26T03:06:07.789Z
---

# "Mirrored verbatim" in a standing doc can overstate a regex-anchor drift guard

**Found (code-verified — read at the phase's own `_refinery` worktree, physical path
`.claude/war/wt/2026-07-22-auditor-guard-ergonomics-2026-07-22/_refinery/`, located via the
`.git/worktrees/*/gitdir` technique after the servitor's own cwd proved stale — see
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] Recurrence 12):**
`agents/war-auditor.md`'s "## Read-only git guard contract" section reads "this contract is
mirrored verbatim into your dispatched audit prompt (both surfaces, one commit)". The backing
drift guard — the new `REGISTRY` row in `skills/war/assets/workflow-template.test.mjs` ("read-only
git guard contract (D5)") — does not assert byte-identity between the two surfaces. It asserts four
independent regex anchors (`/one bare git/i`, `/no pipes/i`, `/ls-tree/i`, `/Grep tool/i`) each
match on *both* `auditorMd` and `auditP` separately. The two surfaces' prose could diverge freely
outside those four anchor phrases without the test noticing — "verbatim" is stronger than what is
actually enforced.

**Why this is a real but Nit-only finding, not a defect:** the drift-guard's actual job here is to
catch a full single-surface removal (revert either surface's block and the row REDs), not to lock
wording. Anchor-mode is the deliberately weaker, appropriate choice for free-form teaching prose —
see [[mirror-registry-verification-mode-by-construct-kind]]'s three-mode taxonomy (`deepEqual` /
`subset` / `behavioral`); a fourth informal mode, "anchor-presence on both surfaces", is common for
prose blocks and is correct for this row. The bug is purely in the doc's own self-description
("verbatim" should read "mirrored" or "carried on both surfaces").

**The pattern — check before trusting a "verbatim"/"byte-identical" claim in a standing WAR doc:**
grep the D3/registry test file for the row backing that claim and read its `mode` (if the registry
uses typed modes) or its anchor list (if it uses regex presence). A claim of byte-identity is only
true when the row does `deepEqual` on extracted literal text (compare
[[gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity]], where a pointer line
*was* upgraded to a dedicated byte-identity test) — anywhere else, soften the doc's self-description
to avoid setting a false expectation for the next editor who reads it and skips the registry check
because the prose already promised byte-identity.

Related: [[standing-instruction-vs-dispatched-prompt-coverage-split]] (the general two-surface
mirroring rule this contract follows), [[mirror-registry-verification-mode-by-construct-kind]] (mode
taxonomy), [[gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity]] (the sibling
case where a presence-only claim WAS strengthened to true byte-identity).

**RESOLVED (2026-07-25, phase "Guard discrimination + diagnostic truth" on plan
`drift-guard-and-floor-diagnostic-hardening`, Task 1.4, #1080):** the sentence is retired
(code-verified — found at `agents/war-auditor.md`, the "## Read-only git guard contract" intro,
re-locate by grepping the section heading, not a cached line number). It no longer says
"mirrored verbatim"; it now reads "...this contract is carried on both surfaces (this standing
card and your dispatched audit prompt, edited together in one commit); the both-surfaces
registry row in `skills/war/assets/workflow-template.test.mjs` anchors the shared tokens and is
the drift arbiter" — stating the mechanism (token-anchor presence) instead of a byte-identity
claim the mechanism never enforced. The opening clause (guard name, fail-closed denial,
read-only-git scope) survives in substance; byte-identity of the opening was deliberately NOT
required (no test pins it). The retirement is now also locked by a committed
`assert.doesNotMatch(auditorMd, /mirrored verbatim/i)` in `skills/war/assets/workflow-template.test.mjs`,
beside the file's pre-existing retired-fragment absence idiom (the `%-format` / `reflog syntax`
asserts) — so the "verbatim" overclaim cannot silently return on this sentence. The general
pattern above ("check the registry row's mode before trusting a verbatim/byte-identical doc
claim") stays live for the next standing-doc sentence describing a mirrored construct; this
instance is closed. A sibling straggler on the SAME two auditor surfaces (`#1085`'s
`=`-attached bare-flag mischaracterization) was deliberately NOT touched by this fix and remains
live — a distinct claim, tracked separately, not reopening this one.
