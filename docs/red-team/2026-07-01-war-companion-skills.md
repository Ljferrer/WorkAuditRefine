# Red Team — WAR companion skills (`/war-help`, `/war-strategy`, `/war-campaign`) (2026-07-01)
**Verdict:** CLEARED-WITH-NOTES — all four blockers patched into the plan and re-proven on real fixtures; two confirmed Minors auto-fixed; residual boundary notes below.

## Attack surface
Spine: claims-vs-reality · executable-proof · coverage-vs-source · consistency-placeholders ·
dependency-feasibility. Bespoke: retarget-on-delete (spec §10 GitHub retarget assumption),
ledger-files-parse-fixture (contention semantics on 3 real plan fixtures), frontmatter-key-honored
(`disable-model-invocation` harness support), gate-discovery (gate command verbatim + self-discovery of
both new test paths), dep-check-find (T2 probe behavior on the real machine), readme-anchors (T1/T4/T5
preconditions). Round 1: 11/11 on-target, 0 dropped. Round 2 (post-patch re-verify): dep-check-find-v2,
ledger-files-parse-fixture-v2, patched-plan-consistency — 3/3 on-target.
Executed in sandbox: executable-proof, ledger-files-parse-fixture(+v2), gate-discovery, dep-check-find(+v2).

## Executed proof
- Full gate verbatim in a sandbox repo copy → 321/321 `node --test` pass + all 13 `.test.sh` suites green;
  sentinel `skills/war-campaign/assets/campaign-ledger.test.mjs` self-discovered (322 tests) and sentinel
  `skills/war-strategy/war-strategy-structure.test.sh` picked up by the find sweep; failing sentinel → exit 1
  (RED propagates). No gate edits needed — confirmed.
- GitHub PR retarget-on-delete (spec §10) confirmed against GitHub docs — pass.
- `disable-model-invocation: true` confirmed a real, honored skill-frontmatter key — pass.
- All repo-state anchors confirmed: 4 version slots @0.8.14, Grill-Me blockquote, trilogy sentence,
  `## Status` slot, `skills/war/references/design.md`, CONTEXT.md six campaign terms, ADR 0011, spec Rev 1 §§.
- Corrected dep-check command (round 2): finds both symlinked skills on the real machine (stdout, silent
  stderr), reaches plugin-cache depth-6 fixture, clean-empty when nothing installed — pass.
- Patched extraction spec (round 2): ~55-line prototype per T3 Step 2 on 3 real plans — wrapped continuation
  captured, T5 footprint exactly 3 files with zero junk tokens, markdown-link line recovered, release-slot
  overlap correctly named. ALL ASSERTIONS PASS.

## Findings
### Major (all resolved by in-place plan patches, re-proven in round 2)
- [Major] T2 dep-check `find` "empty → warn" → **triple-broken on the reference machine**: `-type d` misses
  symlinked skills (both ARE installed as symlinks → permanent false warning), `-maxdepth 4` cannot reach
  plugin-cache depth 6, missing roots exit 1 noisily. Evidence: verbatim run → empty + exit 1; `find -L` →
  both found. Resolution: patched to `find -L … -maxdepth 6 … 2>/dev/null`, emptiness judged on stdout only;
  plan states it supersedes the spec §6.1 verbatim command.
- [Major] T3 "anchored, line-based `Files:` extraction" → **truncates wrapped lists** (this plan's own T3/T5
  entries lose files; footprint non-empty-but-wrong silently bypasses the refusal path). Resolution: patched
  to anchored block-based extraction (consume continuation lines until blank/construct) + wrapped-list test
  fixture.
- [Major] Backticked annotation tokens (`version`, `## Status`, `metadata.version`) are shape-indistinguishable
  from paths → junk footprints and false overlaps. Resolution: patched token policy (strip annotation
  clauses first; accept only path-shaped tokens) + annotated-line test fixture from T5's own entry.
- [Major/needsDecision] Contention "refuses to leave them unordered" undefined while **overlap is the norm**
  (every release-bearing plan shares the 3 release slots; "errors" reading would refuse essentially every
  real campaign). Adjudicated (AFK): an explicitly given order (init list position, sweep append order)
  satisfies the check; refusal/deterministic serialization only when no order is derivable; release-slot
  overlap added as a named fixture.

### Minor
- [Minor] Plan's inline dep-check quote dropped the spec's `2>/dev/null` → folded into the corrected command.
- [Minor] Anchor must tolerate spec §6.2's indented `- Files:` template form → folded into the patched anchor.
- [Minor/needsDecision] "`/improve-codebase-architecture` (does not exist)" is factually false on the
  reference machine. Adjudicated (AFK): exclusion kept, rationale corrected to install-set/portability.
- [Minor, round 2, CONFIRMED] Anchor missed the house singular `**File:**` form (3 landed plans use it;
  silent-miss is the unsafe direction). Auto-fixed: `Files?:` in the anchor + fixture note.
- [Minor, round 2, CONFIRMED] Paren-strip discarded the ``(`path`)`` bare-path form (real file lost from a
  legacy fixture's footprint). Auto-fixed: keep a parenthetical whose content is exactly one backticked
  path-shaped token.

## Resolutions applied (grill decisions — self-adjudicated under `--afk` per standing operator instruction)
- dep-check probe → corrected command baked into T2 Step 1; plan supersedes spec §6.1 verbatim text.
- Wrapped-list truncation → block-based extraction + fixtures baked into T3 Step 2.
- Annotation-token pollution → token policy + T5 fixture baked into T3 Step 2.
- Contention semantics → given-order-satisfies + no-derivable-order refusal/serialization baked into T3
  Step 1 with three named fixtures.
- `/improve-codebase-architecture` rationale → corrected in T2 closing offer (exclusion retained).

## Residual risk
- Extraction boundary accepted: a junk extension-shaped token from prose (e.g. `.gitmodules` mentioned in a
  legacy plan's annotation) can enter a footprint — errs in the SAFE direction (false-positive contention →
  serialize/name, never silent-miss). New plans authored from the §6.2 template are clean by construction.
- The spec file (`docs/specs/2026-07-01-war-companion-skills-design.md` §6.1) still carries the old
  dep-check command verbatim; the plan explicitly supersedes it. Consider a spec touch-up in a future
  prose-drift pass (out of scope for this file-disjoint plan).
- The 2-plan AFK campaign end-to-end behavior (stacked PRs, bottom-up merge report) remains integration
  behavior — its mechanical premise (GitHub retarget-on-delete) is confirmed; the rest is exercised by the
  first live campaign.
