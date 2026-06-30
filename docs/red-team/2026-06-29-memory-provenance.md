# Red Team — memory-provenance (M3) (2026-06-29)

**Verdict:** CLEARED-WITH-NOTES — round 1 returned **BLOCKED** with **six Major blockers** (all adversarially
confirmed); every one was patched into the plan with the red-team's own suggested fix, and a **full round-2 re-verify
confirmed all six resolved** (all six bespoke re-verify probes + the spine `executable-proof` now **pass**). Round 2
surfaced two self-inflicted consistency nits (a stale line-number and a stale "Write matcher" phrase — both fixed) and
two `needsDecision` items on the T2→T3 dependency, both **adjudicated** (the dependency is already phase-enforced; the
manual parity check is the operator-resolved DP2 design, sharpened here with a concrete checklist rather than a code
test). No architectural fork required operator escalation — M3's architecture was settled in the operator's
grill-with-docs session; every finding was an implementation-precision gap.

## Attack surface
- **Spine (5):** claims-vs-reality, executable-proof (executed), coverage-vs-source, consistency-placeholders,
  dependency-feasibility.
- **Bespoke (6):** `value-vocab-collision`, `frontmatter-nesting-fidelity`, `agent-type-overmatch`,
  `memory-index-exemption-edge`, `gate-behavior-sim` (executed), `parity-coverage-split`.
- **Executed in throwaway sandboxes:** executable-proof + gate-behavior-sim (full gate green at tip — 279 `.mjs` + 11
  `*.test.sh`; hook behavior simulated on jq-built payloads in bash 3.2.57). Two rounds; coverage whole both rounds
  (expected 11 / on-target 11 / 0 off-target / 0 dropped).

## Executed proof
- **Round 1 `gate-behavior-sim` (Opus):** built a minimal hook to the plan-as-written and fed it four `jq -nc --arg`
  payloads. Proved the **fail-open** bug: under bare `set -euo pipefail`, a tag-less write's no-match `grep` aborts the
  script at **exit 1** (non-blocking in the PreToolUse contract) — the Write proceeds — instead of the spec-required
  **exit 2**. Adding `|| true` to the extraction restored deny-at-2. Also reproduced the value-vocab collision (a
  nested `provenance: agent-observed` payload denied by the 3-tier check).
- **Round 2 `gate-behavior-sim` (executed):** built the hook to the **patched** spec (tool_name guard + nested
  `metadata.provenance` extraction + `|| true` guard + exact-basename `MEMORY.md`); all payloads behaved correctly —
  tag-less Write → **deny exit 2 with message**, `tool_name:Edit` → pass-through, `MEMORY.md` Write → exempt. **PASS.**
- **executable-proof:** round 1 **warn** (the hooks.json Major); round 2 **pass** (combined-matcher + `tool_name`
  guard resolves it; verified against the real `hooks/hooks.json`).

## Findings — round 1 (all six BLOCKERS patched + re-verify-confirmed resolved)
1. **[Major · needsDecision · executed] hooks.json has no standalone `Write` matcher.** Wiring a content-parsing hook
   into the only Write-bearing matcher (`Write|Edit|NotebookEdit`, shared by `validate-worktree-scope.sh`) fires it on
   `Edit` — which carries `old_string`/`new_string`, **not** `tool_input.content` — so it finds no tag and **denies
   every servitor memory Edit** (D1 dedup-in-place, D4 index row-update), contradicting the plan's own "Edit out of
   scope." **Resolved (chosen option b):** wire into the existing combined matcher **and** add an internal
   `tool_name == "Write"` short-circuit at the top of the hook (Edit/NotebookEdit pass through). Patched into §2.2 spec,
   Step 3 (order), the hooks.json bullet, and a new `tool_name:Edit → pass-through` test case. Round-2 `tool-name-guard-wiring` + `executable-proof`: **pass.**
2. **[Major · needsDecision] Legacy `agent-observed` value collides with the gate's 3-tier set.** A live memory file
   (`land-local-follower-…`) carries `metadata.provenance: agent-observed`, ∉ `{agent-unverified, code-verified,
   user-confirmed}` — the first post-v0.7.5 servitor Write reusing that habitual value would be denied. **Resolved:**
   T2 (a) **retires `agent-observed`** → treat as `agent-unverified` (same tier), never emit it going forward; the
   allowed set stays exactly three (legacy values remapped at write time, not widened — preserving the ladder); the
   legacy file is grandfathered (Edit out of scope, gate fires only on new Writes). Round-2 `value-vocab-collision`: **pass.**
3. **[Major] Nested-extraction not mandated (vacuous-test risk).** Task 1 said "scan the full frontmatter block" but
   never required extracting the **nested** `metadata.provenance` value — a test using a top-level `provenance:` key
   (a format the servitor never writes) would pass yet be vacuous. **Resolved:** §2.2 + Steps 1/3 + the Test-plan row
   now mandate nested extraction and real-shape (`metadata:`→`provenance:`) payloads. Round-2 `frontmatter-nesting-fidelity`: **pass.**
4. **[Major · needsDecision] MEMORY.md exemption path-match unspecified.** A substring/glob match could false-exempt
   `MEMORY.md.bak` or a `…/MEMORY.md/x` directory component. **Resolved:** exact-basename match
   `[[ "$(basename "$fp")" == "MEMORY.md" ]]`, specified in §2.2 + Step 3. Round-2 `memory-index-exemption-edge`: **pass.**
5. **[Major · needsDecision] "byte-parallel" undefined.** A literal byte-copy of standing `war-servitor.md` prose into
   a dispatched template string is a context mismatch. **Resolved:** DP1 now defines **"byte-parallel" = directive-
   parallel** — the same directives adapted to each surface's form, parity = directive/semantic equivalence (not
   byte-identity); T3 Files + Step 2 say "restate (adapted)" not "copy." Round-2 `parity-coverage-split`: **pass.**
6. **[Major · needsDecision] D2 reframe not quoted.** `war-servitor.md` D2 still reads "User corrections outrank agent
   assertions" (the frame the spec rejects for the autonomous path). **Resolved:** T2 Step 2 now instructs **replacing**
   it with the tier-order frame ("a higher tier supersedes a lower; a `user-confirmed` fact outranks any agent write;
   never overwrite a higher-tier fact with a lower-tier one"). Round-2 `parity-coverage-split`: **pass.**

## Findings — round 2 (post-patch; resolved/adjudicated)
- **[Minor · self-inflicted, fixed] Line-number inconsistency.** A patch left `:464-468` in T3 Step 1 while the Files
  line said `~:548-551`. Fixed T3 Step 1 to `~:548-551` (construct-anchored). Also fixed a stale "wire … on the `Write`
  matcher" in T1 Step 4 (now the combined-matcher + guard wording) and split the combined Step 4/5 bullet.
- **[Major · needsDecision · adjudicated] T2→T3 sequencing.** Probe: the build order didn't visibly forbid parallel
  T2/T3. **Adjudicated — already phase-enforced:** T2=Phase 2, T3=Phase 3; `/war` runs one Workflow per phase serially,
  so T3 reads T2's *landed* `war-servitor.md` (cross-phase dep satisfied by Phase 3's integration base). Made explicit
  in the build order ("Run SERIAL — Phase 3 starts only after Phase 2 lands; one task per phase"). The probe's
  alternative (a deterministic diff test) is rejected — see next.
- **[Major · needsDecision · adjudicated] Manual parity is non-deterministic.** Probe: "semantic equivalence" is
  auditor judgment. **Adjudicated — this is the operator-resolved DP2 design** (criteria #5-6 are prompt-level, no
  deterministic gate; the gate is structural, not semantic — §5). Adding a code test would contradict DP2, so instead
  the manual check was **sharpened** with a concrete **Audit parity checklist** (the four directives + the three tier
  names verbatim must appear in both surfaces). The residual (manual, not code-gated) is documented as an accepted
  ceiling in Out-of-scope.
- **[non-findings]** The probe's "T2 D2 replace" and "spec §3/§6 ref" items self-concluded "no fix needed."

## Residual risk
- **Post-landing prose-parity drift** (`war-servitor.md` ↔ the wrap-up restatement) is guarded by the T3 audit's
  manual directive-parity checklist, not an executable test — the operator-resolved DP2 ceiling; a `consolidate-memory`
  sync task backfills if drift is later observed.
- **Structural-not-semantic gate** — the hook proves a tag is *present*, never *honest* (§5). Accepted; prompt-layer.
- **~87 grandfathered memory files** (untagged or legacy `agent-observed`) are not re-gated (gate fires on new Writes;
  Edit out of scope); remap is a separate `consolidate-memory` job.
- **Spec hygiene (not patched):** spec §2.2 phrases the hook as "gates Write only" — the mechanism is now the
  `tool_name` guard on the combined matcher (same outcome). Plan is authoritative; a spec-doc Minor to clean up separately.
