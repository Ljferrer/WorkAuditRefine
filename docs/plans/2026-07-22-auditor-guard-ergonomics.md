# Auditor guard ergonomics — widen the read-only git grammar, teach the guard contract on both surfaces, make `held:workflow-error` self-diagnosing

Source spec: `docs/specs/2026-07-22-auditor-guard-ergonomics-design.md` (from issues #980, #982).

## AI-Commander's Intent

*(AI-declared — ADR 0014: authored under `--afk` from the ratified spec; no operator echo-back occurs on this run. Intent is the ceiling, the plan slice is the floor.)*

- **Purpose:** auditor seats stop paying the guard-discovery tax (831 + 71 measured denials across two
  runs) — the read-only git guard's grammar matches the auditor's idiomatic toolkit, the guard contract
  is taught up front on both prompt surfaces instead of re-learned by denial every phase, and a
  `held:workflow-error` explains itself and names the right recovery — with the fail-closed posture
  unmoved (F03 / ADR 0002).
- **Method:** widen only grammar, never posture — `~` and `%` into the `tr` residue set, `ls-tree` and a
  token-shape-fail-closed read-form `branch` into the verb arms; re-ratify the `git grep` denial (the
  Grep tool is the sweep channel; G6 stays deny, ADR 0029 conserved); teach one guard-contract block on
  both prompt surfaces, drift-locked by a new D3 both-surfaces registry row at an exact no-slack floor;
  micro-teach the sanctioned alternative inside the deny strings themselves; a named entry-parse
  diagnostic plus a universal additive `recovery` field inside the existing catch — no new enum member
  (ADR 0005), `land-decision.mjs` and the mirrored enum copies byte-untouched.
- **End state:**
  1. The guard's shell suite is green with the widened grammar: `git diff HEAD~1`,
     `git log --pretty=format:%H`, `git ls-tree -r HEAD`, `git branch`, and
     `git branch --contains=abc123` allow; `git branch newname` (flagless creation),
     `git branch -d x`, `git branch --contains abc123` (space form), and `git branch -f x HEAD` deny
     with the `WAR:` marker.
  2. `git grep` stays denied: G6 remains `expect_deny` (comment citing the spec's D3 re-ratification),
     and the committed-tree-grounding clause on both surfaces plus its existing registry row are green
     unchanged.
  3. Every pre-existing injection/posture case group in the shell suite — C (metacharacters), E
     (global/output flags), H3/H3a/H5 (`-C` non-widening, `fetch`, bracket/`$()`), I (suffix-anchored
     arm) — passes unmodified: the proof that exactly `~` and `%` were added and nothing else moved.
  4. Deny messages micro-teach: the not-a-git deny names Read/Grep/Glob, the unlisted-verb deny names
     the Grep tool, the `branch` space-form deny names the `=`-attached form — each asserted via stderr
     content in new test cases.
  5. The guard contract is taught on BOTH prompt surfaces — a `## Read-only git guard contract` section
     in `agents/war-auditor.md` and the rewritten grammar clause in `auditPrompt()` — drift-locked by a
     new D3 both-surfaces registry row with the `REGISTRY.length` floor at the new exact row count
     (#693 no-slack); reverting either surface's block alone REDs the row.
  6. The stale partial teach is fully replaced: `grep -rn '%-format'` over
     `skills/war/assets/workflow-template.js` and `agents/war-auditor.md` returns zero matches, and
     that absence is RED-able — the D3 registry test asserts `/%-format/` and `/reflog syntax/`
     match nowhere in either surface (red-team adjudication, ADR 0025); the
     retitled F03 prompt test passes with `@{}` still confined to avoidance context.
  7. A malformed JSON **string** args value (e.g. `'{oops'`) returns `landDecision:
     'held:workflow-error'` whose `workflowError.message` carries the payload char length and a head
     snippet, dispatches zero agents, and renders `phase: null`; the existing scalar-args criterion-2
     test stays green unmodified.
  8. Every catch-path return carries `workflowError.recovery` matching a fresh-Recovery-relaunch phrase
     and a never-`resumeFromRunId` phrase; `HARD_ESCALATION_REASONS` and `KNOWN_LAND_DECISIONS` are
     byte-untouched and their drift guard is green (ADR 0005).
  9. `node --test 'skills/**/*.test.mjs'` and the anchored shell-test loop over `hooks/` + `skills/`
     are green end-to-end.
  10. Release lands last: all four version slots in lock-step at the next free patch above the live
      base.

## Build order (for /war)

1. **Phase 1 — Guard grammar + taught contract + self-diagnosing error path** (waves: 1.1 → 1.2)
2. **Phase 2 — Release** (trailing, own phase)

## Phase 1 — Guard grammar + taught contract + self-diagnosing error path

### Task 1.1: Widen the guard grammar (`~` `%`, `ls-tree`, read-form `branch`) + deny-message micro-teach + shell cases

- Files: `hooks/validate-auditor-git.sh`, `hooks/validate-auditor-git.test.sh`
- Plan slice: **Hook (D1/D2/D4/D6).** In the CHARACTER ALLOWLIST check, widen the `LC_ALL=C tr -d`
  residue set from `'A-Za-z0-9 ./_=:,@^-'` to `'A-Za-z0-9 ./_=:,@^~%-'` (`-` stays last; `~`/`%` are
  literal in `tr`) and update the char-set line in the FAIL-CLOSED CHARACTER ALLOWLIST header block and
  the inline "Permit only:" comment in the same edit. In the subcommand extractor, add an `ls-tree` arm
  beside `ls-files` (the existing post-subcommand `--output`/`-o` scan already covers it). Add a
  `branch` arm running a per-token read-flag loop (bash-3.2-safe `case`; unquoted `for tok in $rest`
  word-split is safe — the char allowlist already excludes quotes and globs): empty rest → allow; every
  token must match the spec-D4 enumerated read-flag set with `=`-attached values (`--contains=<rev>`,
  `--no-contains=<rev>`, `--merged=<rev>`, `--no-merged=<rev>`, `--points-at=<rev>`, `--list`,
  `--all`/`-a`, `--remotes`/`-r`, `--show-current`, `-v`/`-vv`/`--verbose`, `--sort=<key>`); the first
  non-matching token (any bare non-flag token, any unlisted flag — creation and every write flag deny
  without being enumerated) denies with a message naming the `=`-attached read-flag form (D6);
  `--format` is deliberately absent from the set. Micro-teach suffixes at the named `deny()` call
  sites: the not-a-git-command deny appends "auditors use the Read/Grep/Glob tools for file access";
  the unlisted-verb deny's enumerated allowlist gains `ls-tree`/`branch` and appends "for repo-wide
  search use the Grep tool". Update the READ-ONLY SUBCOMMAND ALLOWLIST header comment to the new verb
  list. Unchanged: the suffix-anchored agent-type arm, the global-flag block, the single `-C` peel, the
  post-subcommand `--output`/`-o` scan, every exit code (1 never appears here; deny stays exit 2 with
  the `WAR:` stderr marker). **Mapped test (same diff).** New allow cases: `git diff HEAD~1`;
  `git log --pretty=format:%H`; `git ls-tree -r HEAD`; `git ls-tree HEAD skills/`; `git branch`;
  `git branch -a -v`; `git branch --contains=abc123`; `git branch --show-current`. New deny cases:
  `git branch -d x`; `git branch -D x`; `git branch -m a b`; `git branch newname`;
  `git branch --contains abc123` (space form — asserts the `=`-form micro-teach substring on stderr);
  `git branch -f x HEAD`; `git branch --set-upstream-to=origin/x`; `git branch -av` (combined short
  form — not an enumerated token, so the per-token loop denies it even though separated `-a -v`
  allows; equivalence-class discipline). New deny cases for the non-git and
  unlisted-verb paths assert their sanctioned-alternative substrings on stderr via the existing
  `stderr_of` helper (`expect_deny` keeps asserting the `WAR:` marker; the new payloads carry no
  quote/bracket chars, so the plain `auditor_cmd` builder stays valid — the H5 `jq -nc` caveat applies
  only to quote-bearing payloads). G6 stays `expect_deny`, byte-load-bearing; its comment gains one
  line citing the spec's D3 re-ratification. Header prose ("single git read-subcommand (…)") updates
  to the new verb list. All pre-existing case groups (A/B/C/D/E/F/G/H/I) stay unmodified and green.
  **Sweep (this task's half) + mandatory survey.** The old verb-enumeration token
  `ls-files/cat-file/blame` greps into this task's two files as the only live surfaces (the hook's
  unlisted-verb deny string and header comment; the test-file header prose) — update each; the
  provenance-dated historical artifacts a repo-wide grep also hits are enumerated under
  `## Notes / conscious deviations` and stay byte-untouched (confirmed-correct). Then the manual same-scope survey
  (grep is a floor): hand-scan the hook's PURPOSE / FAIL-CLOSED / READ-ONLY-SUBCOMMAND header blocks
  and every case-group comment in the test file (A/C/E/G/H prose) for same-meaning phrasings ("single
  git read-subcommand", "no shell metacharacters") — update or confirm-correct each, listing stragglers
  as survey-derived corrections in the done report. Spec §10 criteria 1–4.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Both-surface guard-contract teach + D3 registry row + entry-parse diagnostics + `recovery` field

- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-auditor.md`
- Plan slice: **Contract teach (D5, both surfaces, one commit).** In `auditPrompt()`, replace the
  two-sentence partial teach (the `Use allowlist-safe git forms: --name-status, --stat,
  --format=oneline, A...B, HEAD^.` and `Avoid %-format strings … @{} reflog syntax …` pt-fragments —
  half-false once `%` admits) with the D5 guard-contract clause: **one bare git command per Bash call**
  from the verb allowlist (enumerated, including the new `ls-tree` and read-form `branch`); **no
  pipes, chaining, redirects, quotes, globs, braces, or substitution — compose nothing; filter and
  search with the Read/Grep/Glob tools instead**; non-git shell reads (`ls`, `cat`, `wc`, …) always
  deny — use Read/Glob or `git ls-files`/`ls-tree`; `@{}` reflog stays denied (braces) — use
  `git log -g` (keep `@{}` in avoidance context — the F03 prompt test requires it); `branch` takes
  `=`-attached read flags only; `git grep` stays denied — the Grep tool is the sweep channel. Mirror
  the same content as a new `## Read-only git guard contract` section in `agents/war-auditor.md` (the
  existing committed-tree-grounding paragraph is untouched — its "git grep … stays denied" sentence
  remains true under D3); the inline gate-audit seats inherit the contract via the standing card, per
  the registry's established idiom. **Entry-parse diagnostics (D8).** Wrap the string arm of the entry
  parse (the `const A = typeof args === 'string' ? …` construct) in a dedicated try/catch throwing a
  named `Error` carrying the payload length in characters, the engine's own parse message (position
  only when the engine provides one — never fabricated), and a bounded head snippet (~first 60 chars).
  The object arm and the ADR 0034 non-null-object guard below it are untouched; the named error routes
  to `held:workflow-error` via the existing top-level catch — no new enum member, no new return route
  (ADR 0005; never add `held:workflow-error` to `HARD_ESCALATION_REASONS`). **Recovery note (D9).**
  The top-level catch's returned `workflowError` gains an additive `recovery` field:
  `held:workflow-error` is Lead/infra-side — retry via a fresh Recovery relaunch (new runId), never
  `resumeFromRunId` (the journal replays the cached error) — conforming to the already-ratified
  `skills/war/SKILL.md` prose (that file untouched). Existing consumers read
  `workflowError.message`/`stack` and are unaffected. **Mapped tests (same diff, D7 + spec §4).**
  (a) New D3 both-surfaces registry row — surfaces `['war-auditor.md', auditorMd]` +
  `['auditPrompt()', auditP]`, token-anchored case-tolerant on the contract's distinctive fragments,
  including at least one widened-verb token (`/ls-tree/i`) and the composition-ban tokens (e.g.
  `/one bare git/i`, `/no pipes/i`, `/Grep tool/i`); bump the `REGISTRY.length` floor and its
  assertion message to the new exact row count — floor equals true count, no slack (#693); the
  registry's per-surface anchor loop is the delete-the-feature proof (reverting either surface's
  contract block alone REDs the row — verify red-first by temp-revert during development). The same
  test additionally asserts the OLD fragments ABSENT (red-team adjudication, ADR 0025
  replacement-class drift): `/%-format/` and `/reflog syntax/` match NOWHERE in either surface
  (`auditorMd`, `auditP`) — a partial edit that adds the new contract but leaves the stale teach
  co-present REDs the suite, promoting the criterion-6 grep from un-encoded prose to a RED-able
  assertion. (b) Retitle
  and re-anchor the F03 allowlist-steer prompt test to the new contract clause; correct its stale
  "Task-2 guard denies those chars" comment in the same commit (comment-lag duty); keep the
  `@{}`-avoidance-context assertion. (c) New test, sibling of the scalar-args criterion-2 test: a
  malformed JSON string args (e.g. `'{oops'`) returns `held:workflow-error` whose
  `workflowError.message` matches the payload char length and head snippet, dispatches zero agents,
  and renders `phase: null`; the scalar-args test itself stays green unmodified. (d) New test: the
  catch-path return carries `workflowError.recovery` matching both a fresh-relaunch phrase and a
  never-`resumeFromRunId` phrase. **Sweep (this task's half) + mandatory survey.** The `%-format` and
  `reflog syntax` tokens grep into this task's files as the only live surfaces (the `auditPrompt()`
  teach being replaced; the F03 test title and comment); the historical artifacts enumerated under
  `## Notes / conscious deviations` stay byte-untouched — spec criterion 7's absence check is
  `grep -rn '%-format' skills/war/assets/workflow-template.js agents/war-auditor.md` → zero matches.
  Manual same-scope survey: the F03 test's title and comment; `agents/war-auditor.md` prose; the
  byte-coupled comment blocks around `auditPrompt()` (confirm none names the retired teach) — list
  stragglers as survey-derived corrections. Spec §10 criteria 5–9.
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: version bump, all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump all four slots to the next free patch above the live integration base at land time —
  `plugin.json` `version`, `marketplace.json` `metadata.version` and `plugins[0].version`, and the
  README `## Status` line (replace-in-place, no badge). `version-slots.test.mjs` is the arbiter —
  never a resolved v-literal from this plan (version literals in plans are non-authoritative).
  Expected integration base: branch `claude/work-audit-specs-plans-4304cd` — a stacked campaign base
  that will have advanced by land time; resolve the patch from the four slots as they stand at land.
  Standalone fallback: a run through plain `/war` (outside the campaign) resolves the next free patch
  from the four slots itself. Release blurb describes the change additively and precisely — the guard
  admits `~`/`%` and the `ls-tree` + read-form `branch` verbs, the contract is taught on both auditor
  prompt surfaces, and `held:workflow-error` now self-diagnoses with a recovery note; say "the guard
  admits read verbs", never "auditors can now grep" (`git grep` stays denied). No rename; no
  absence-guard interactions expected (criterion 7's absence grep is scoped to the two prompt
  surfaces, not the README).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- The anchored shell-test loop over `hooks/` + `skills/` green at land · why deferred: the
  refiner-dispatched gate has been observed running JS-only — `plan.gate` is dispatched raw, never
  routed through `resolveGate`'s shell-suite discovery (recorded lesson
  `refiner-dispatched-gate-never-resolvegate-composed-shell-suite-blind`) — so End state 9's shell
  half needs a named runner beyond the dispatched gate · runner: refiner gate at land; operator
  spot-check via `/war-review` after land.
- Live denial-rate outcome — measured PreToolUse denial counts from `hooks/validate-auditor-git.sh`
  drop on the next real multi-seat run, and `branch` space-form denials do not dominate the residue
  (if they do, the spec §8/§9 deferred follow-up — a one-token lookahead for `--contains`/`--merged`
  values — activates) · why deferred: needs live telemetry across a real audit roster; not
  fixture-able in CI · runner: operator via `/war-review` after the first post-release `/war` run.
- JavaScriptCore-shaped parse diagnostics — the D8 message renders sanely when the engine supplies no
  position (JSC's `JSON Parse error` carries no offset; CI's Node/V8 always supplies one, so the
  no-offset path is unexercisable in CI; the diagnostic embeds only what the engine provides, never a
  fabricated position) · why deferred: the live Workflow sandbox engine differs from the test engine ·
  runner: operator inspection at the first live `held:workflow-error` parse incident.

## Notes / conscious deviations

- **AFK provenance conversion (ADR 0014):** this plan was converted mid-flight to `--afk`
  provenance — `## AI-Commander's Intent` + `## Deferred validations (backstops — AI-declared)`; no
  operator echo-back occurs. Predecessor-consistency check against
  `docs/plans/2026-07-22-lessons-learned-seed.md`: tone, scope, and standing constraints align
  (terse Purpose / Method-with-guardrails, numbered individually-checkable End state mapped 1:1 to
  the spec's validation criteria, trailing lock-step four-slot release as the final End state item).
  Two divergences, recorded here, never silently: (a) provenance itself — that predecessor's intent
  block is operator-confirmed (`## Commander's Intent`; only its backstops carry the AI-declared
  marker), while this plan's whole intent is AI-declared; (b) consequently the check ran against the
  predecessor's `## Commander's Intent` block — it has no `## AI-Commander's Intent` heading to
  compare against.
- **`deps: [1.1]` on Task 1.2 is a prose-coherence wave edge, not a symbol dependency:** the contract
  clause enumerates verbs (`ls-tree`, read-form `branch`) that are real in the hook only after 1.1
  merges; the wave edge means 1.2's worker and auditors judge the teach against an integrated tip
  where the taught grammar is true. Files are disjoint — this is not a same-file-collision dodge.
- **The stale-grammar token sweep is split along task file-ownership lines:** every grep hit for
  `%-format`, `reflog syntax`, and the old `ls-files/cat-file/blame` enumeration falls inside the two
  tasks' Files sets (verified against the live tree at plan time), so no third sweep task exists;
  each task carries its own mandatory same-scope manual survey with the spec's known stragglers
  (test-file header verb list; hook header allowlist comment; F03 test comment) assigned to the owning
  task. `docs/learnings/` lesson bodies are deliberately excluded (provenance-dated records, spec §9),
  and the same confirmed-correct disposition covers the provenance-dated **historical artifacts** a
  repo-wide grep hits — enumerated, verified at plan time: `docs/plans/2026-06-25-audit-fidelity.md`
  (the original teach's authoring plan — its reflog-syntax prose),
  `docs/specs/2026-07-08-audit-gate-verdict-fidelity-design.md` and
  `docs/specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md` (the old verb enumeration
  quoted in constraint lines), `docs/specs/2026-07-01-auditor-pin-validity-no-fetch-design.md` (the
  same verb set in comma form — `ls-files, cat-file, blame` — which a slash-pattern grep misses;
  added by red-team sweep), `docs/learnings/auditor-grep-tool-unrestricted-by-git-verb-bash-guard.md`,
  plus the self-referential source spec and this plan. All are decision records: **byte-untouched** —
  a worker must not edit history, and an auditor finding them surviving the sweep is confirming the
  design, not catching an omission (`docs/red-team/` was checked and carries zero hits).
- **`skills/red-team/assets/workflow-scaffold.js` is deliberately untouched:** D8 wraps only the
  template's string arm; the scaffold's normalize-to-`{}` posture and the criterion-2 both-sites drift
  test anchor token patterns, not parse-line bytes, and stay green unmodified. An auditor finding the
  scaffold unmodified is confirming the design, not catching an omission.
- **Cross-plan registry serialization (spec §8):** this plan's D7 registry row + floor bump must land
  before the sibling specs' registry edits (audit-adjudication-threading, servitor-wrapup-landed-tip)
  — a roadmap/campaign ordering concern, enforced by the campaign's dependency spine; within this plan
  only Task 1.2 touches `workflow-template.test.mjs`.
- **requiresPackaging: false throughout** — no packaging surface in this repo (the packaging floor is
  Dockerfile-gated and would no-op regardless).
- **No new inline mirror, no MIRROR_REGISTRY row:** the taught contract is a both-surfaces directive
  (D3 registry row, carried in Task 1.2), not a hand-copied canonical export; `land-decision.mjs` and
  the mirrored enum copies are byte-untouched by design (ADR 0005), so their drift guard runs
  unchanged.

## Open decisions

None — the spec's design tree (D1–D9) resolved every fork, including the one ratified-decision
reversal candidate (D3: `git grep` stays denied). The exact prose of the D5 contract block within the
registry-anchored tokens is worker latitude under the intent ceiling, not an open decision.
