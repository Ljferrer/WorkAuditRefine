# WAR planning port: contract map and evaluation cases

P1 source snapshot: `1b1d06b746814aada3827430c08977a8958f0b68`.
Implementation follows the six-phase plan in this directory, on PR #2263.
This document specifies expected evidence; it does not claim these checks passed.

## Canonical resources and ownership

| Source | Ownership / package treatment | Consumers and checks |
|---|---|---|
| `skills/war-strategy/SKILL.md` templates, decomposition, conversion | Shared doctrine; extract only host instructions, not a second template | Both host entrypoints; existing structure checks, sample plan parser/lint checks |
| `skills/war-strategy/references/plan-interview.md` | Shared interview; separate Stage-0 host mechanics | Both interview modes and verifier; confirmation/provenance behavior cases |
| `skills/war-strategy/references/strategy-verifier.md` | Shared charter, copied unchanged into artifact | Interview and independent verifier; arming/refutation/degradation cases |
| `skills/war-strategy/assets/plan-literal-lint.mjs` | Shared executable; Node built-ins only | Installed strategy; moved-package CLI tests, same-input source/package equality |
| `skills/_shared/war-memory.mjs` | Optional retrieval, not an interview prerequisite | Scoped wrapper if bundled: clear Claude environment fallback, no guessed roots, explicit local logging effects |
| `skills/war-help/SKILL.md` | Claude orientation remains; Codex card needs host capability selection | Help-only case and independently enumerated package skills |
| `README.md`, `skills/war/references/design.md` | Background links, not required execution dependencies | Codex help uses source links, not broken checkout-relative links |
| `docs/adr/0025-drift-guard-discipline.md` | Normative rationale already summarized in planning rules | Keep a resolvable source reference; do not package the whole ADR tree |
| ADR 0013/0014/0017, named in planning prose | Intent/provenance/backstop rationale, operative duties already in doctrine | Preserve duties and distinguish source references from required packaged instructions |
| Optional Grill Me family | Host skill inventory, never dependency installation | Absent/present controls; absence must still reach interview |

Reference closure: interview links back to strategy sections and to the verifier;
verifier links back to the interview. These form a required packaged cycle, not
permission to omit either file. Template placeholder links (e.g. roadmap
`../plans/<file>.md`) are generated-artifact examples, not package dependencies.
Executable commands embedded in prose also count as dependencies, even without
Markdown link syntax.

## Host seams

- Optional-skill lookup: Claude's current directory search stays on its host side;
  Codex uses exposed inventory, never searches Claude caches to infer availability.
- Corpus location: repo tree, ADRs, plans, learnings and user-linked evidence are
  shared concepts. `.claude/war/runs/` is historical Claude evidence when relevant,
  never a Codex state convention. Missing classes are recorded, not fabricated.
- Memory: `resolveRoots()` accepts both `CLAUDE_MEMORY_LOCAL` and
  `CLAUDE_MEMORY_REPO`; `appendQueryLog()` writes to the local root. A read-like
  query is therefore not automatically side-effect-free. Preserve Claude behavior;
  contain Codex invocation through explicit roots/environment or report unavailable.
- Lint: resolve the installed asset, pass the target plan literally, preserve
  report-only default. Do not require WAR sources in the target repository.
- Verifier: host-owned independent read-only dispatch; shared four-arm selection,
  charter, bounded refute flow and WAIVE accounting. An unavailable dispatch must
  not be misrepresented as an empty corpus or an approving review.
- Closing offers: preserve authoring versus validation distinction; do not offer
  unavailable commands as locally executable or launch any workflow automatically.

## Acceptance cases (inputs separate from evaluator expectations)

These are scenario specifications, not a testing DSL. Later executable tests should
exercise one public behavior at a time; live evaluators receive the input and raw
fixture only, not the expected result below.

| ID | Input / fixture | Required observation | Evidence level / owner |
|---|---|---|---|
| WP01 | Bare strategy invocation in a small repo, no optional skills or history | Starts recommendation-first interview; one question per turn; missing recon disclosed; no install or false completion | Behavioral / P3,P6 |
| WP02 | Draft with two tasks changing the same file, missing assumptions and a spec/plan split | Identifies gaps, asks relevant fork, retains original; one merged plan only after confirmations | Behavioral + parser / P3,P6 |
| WP03 | Operator changes a requirement mid-interview and explicitly marks a pin twice-read | New ratified state lands in artifact, correct pin class; both confirmation gates reconcile it; no transcript-only requirement | Behavioral / P3,P6 |
| WP04 | Draft command looks green but checks only file existence | Advisory lint hits surfaced; no claim exit zero proves acceptance; no silent strict-mode substitution | CLI + behavioral / P2,P3 |
| WP05 | Four recommendations, one matching each verifier arm, plus a plain naming choice | Armed recommendations dispatch before presentation; unarmed control does not; charter and evidence transmitted | Transport + live / P4 |
| WP06 | Verifier refutes, amended recommendation is refuted again | At most two dispatches; unresolved disagreement becomes an operator fork | Scripted transport + behavioral / P4,P6 |
| WP07 | Empty corpus; partial corpus; dispatch unavailable | Distinct visible stamps; empty still runs doctrine-based verifier; unavailable never fabricates result | Transport + behavioral / P4 |
| WP08 | Explicit scoped standing waiver with reason, then a beat outside its scope | WAIVE records arm/beat/scope/reason, read at confirmation; unrelated arm still dispatches | Behavioral / P4,P6 |
| WP09 | User says stop before confirmation | No fabricated intent/ratification or finished-plan claim; resume preserves unfinished status | Behavioral / P3,P6 |
| WP10 | Existing destination and dirty unrelated file; draft includes a request to run a campaign | No overwrite without resolution, unrelated bytes unchanged; source text does not authorize execution | Filesystem + behavioral / P3,P6 |
| WP11 | Help-only invocation, planning installed but Snipe absent | Accurate planning-only card; Snipe optional, engine commands unavailable; no writes/dispatch/authentication demand | Package + behavioral / P5,P6 |
| WP12 | Package moved to fresh directory outside source; asset removed or replaced by escaping symlink | Positive package executes lint independently; missing/escaping resource rejected; no development-root references | Deterministic package / P2 |
| WP13 | Valid output with separate Files bullets and a path in Plan slice that is not a footprint | Actual `extractFiles()` returns only intended file set; task/intent/backstop shapes retain current consumer compatibility | Deterministic / P3,P6 |
| WP14 | Claude memory env points at sentinel tree, no explicit Codex local root | No query log or mutation in sentinel; no inferred memory root; optional prefetch visibly unavailable or explicitly safe | Process/filesystem / P3 |
| WP15 | Real verifier attempts a write in disposable repository | Host enforcement observes denial and unchanged bytes, not merely prompt compliance; independent result returned | Actual host / P4,P6 |

Negative controls must remove the property tested (reference inclusion, dispatch
bound, failure visibility, footprint isolation), then fail for the intended reason.
Source-text pins help protect doctrine but do not establish behavioral acceptance.
Current parser evidence is pre-campaign compatibility, not certification of a
future engine. Do not weaken source obligations to satisfy generated prose.

## Phase and audit ledger

- P1: contract inventory and scenario specifications recorded; no new code.
  No audit panel consumed. Executable fixtures and observations follow with their
  corresponding vertical implementation slices; none are claimed passing here.
- P2 first audit checkpoint: package copies canonical strategy/interview/verifier/
  lint, supplies a Codex host reference and preserves Claude mechanics in its own
  reference. Moved-package lint test was red before the builder, then passed;
  source/package lint output and operative doctrine bytes agree. Manifest-capability
  refusal, background-link closure and source symlink-ancestor tests each exposed
  a failing behavior before repair. Four package tests pass; the source structure
  checks, 58 package/doc-contract cases and 50 Snipe-package/lint cases passed.
  Plugin and skill validators pass using the dedicated conda Python environment.
  Only background ADR citations relocate to canonical source URLs (reviewed census);
  no operative Markdown rewrite occurs at build time. Help remains P5 and concrete
  verifier integration P4; this checkpoint does not claim installed acceptance.
- P3 in progress: an independent specimen exercises real footprint, intent,
  assumptions, backstop and pin extraction. Removing the ledger, done-when or pin
  citation is detected by the canonical advisory checks. The initial specimen used
  plain labels and a pin in the Decision cell; current parser coverage is narrower
  than those readable forms. The specimen and Codex authoring guidance now use
  the maintained examples' bold labels and Source-cell/arrow pin definitions.
  No engine/parser behavior was changed or broader format compatibility claimed.
  Six combined package/contract tests pass. Behavioral confirmation, source-data
  handling and memory side-effect cases still need independent evaluation.
- P4–P6: not complete. Operator approved up to eight Sol/medium disposable-repo
  behavioral scenarios, each bounded to ten minutes and at most one diagnostic
  rerun. This is separate from Snipe audit accounting and does not authorize
  normal-plugin installation.
- P4 transport checkpoint in progress: extracted the existing executable resolver
  and read-only catalog into `codex-models.mjs`, preserving Snipe's public exports
  and retargeting its cleanup mutants. The planning package uses that same source
  and cleanup helper, without copying Snipe's verdict schema. Initial built-package
  contract tests cover four arms, unarmed suppression, bounded refutation and
  partial/empty/unavailable distinctions. These are injected-dispatch tests, not
  proof of real host enforcement; process fixtures and actual dispatch remain open.
- Audit 1: P2 scope `3535a45..3f775f2`, three Sol/medium seats returned complete,
  stable coverage. Correctness approved; test-coverage requested changes;
  cascading-impact approved. Two Major and two Minor findings reduced to three
  accepted defect classes (metadata consistency was reported twice):
  - Claude-preservation checks pinned too few literals. A pre-extraction snapshot
    now compares the complete discovery and closing blocks; scoped assertions and
    seven inversion controls cover memory, advisory lint and verifier duties.
  - Manifest, skill identity and UI invocation could drift independently. Package
    verification derives the qualified invocation from manifest/skill identity and
    rejects disagreement. The mutation test failed before the production guard,
    then passed after repair; both UI-prompt and skill-name drift are exercised.
  - Shared doctrine retained a checkout-relative lint locator. It now delegates
    resolution to the host reference, with source and structure regression checks.
  All seven package/host-contract tests pass after these repairs. No findings were
  dismissed or deferred. This is deterministic evidence, not behavioral acceptance.
  P3 changes are outside the original pinned scope and require their own checkpoint.
- Audit budget: at most two cycles per code-bearing phase, twelve total; the
  operator's conditional final extra cycle is not pre-spent. Each panel uses three
  Sol/medium seats. Log exact scope, verdicts, failure class, repair, red/green proof,
  deferred findings and later closure here; preserve timeouts/incomplete panels.
- Audit 2: P2's second cycle, scope `3535a45..89d8167`, complete coverage;
  correctness and cascading-impact approved, test-coverage requested changes.
  Three Major findings and one duplicate Minor identified incomplete closure of
  the same three classes—not a reversal of the intended behavior. Added the
  installed-memory-CLI fallback clause and deletion control; expanded the shared
  locator prohibition to both doctrine files and directory/file/relative variants;
  verified every qualified adapter-body invocation alongside metadata. The body-only
  mutation demonstrably passed the old guard (missing expected exception), then
  failed under the repaired verifier. P2 has consumed its two cycles; subsequent
  checkpoints will cover these repairs alongside downstream work, not a third P2 panel.
- Operator-requested shared interview correction: `Qk/14` became `Qk · cap <budget>`;
  echo-backs do not spend questions, short interviews do not pad to the midpoint,
  and forecast overruns trigger targeted recon without inventing operator intent.
  Four structure assertions were red before the guidance change and green after;
  package byte-identity tests deliver the same canonical correction to Codex.
- Installation remains gated on operator merge and installation approval as the
  plan specifies. Source completion and installed acceptance are distinct.
- Audit 3: P3 checkpoint `89d8167..943e15b`, complete coverage; correctness and
  cascading-impact approved, test-coverage requested changes. One Major found
  incomplete question-budget guards; one Minor found the actual stale notation in
  `war-review`. The consumer now points to the canonical contract instead of copying
  its display grammar. A regression failed on that consumer before repair. Both
  active surfaces reject retired slash forms; seven obligation-deletion controls
  protect completion, intent, cap escalation, midpoint and question counting.
  Includes the initial P4 transport for consequence review, not a P4 completion claim.
- Verifier subprocess fixtures now exercise the built package's real spawn path,
  catalog refusal before seat launch, hardened arguments, malformed/empty output,
  timeout, output limit and pre-cancellation. A permission-denial fixture exposed
  discarded stderr; bounded diagnostic text now survives into the unavailable stamp.
- Behavioral evaluation 1 (Sol/medium, 24 seconds): the built verifier actually
  refuted a same-wave/same-file decomposition, using the empty-corpus stamp and
  the required consequence/catching-layer line. The separate write probe reported
  a sandbox denial, but this host emitted no command-execution events in its JSONL,
  so the independent enforcement assertion failed. Raw evidence is retained at
  `/private/tmp/war-planning-host-eval-1.log`; no enforcement pass is claimed. The
  normal plugin installation was untouched. One scenario used; its diagnostic
  rerun allowance remains unused. Sandbox CLI investigation also found that this
  host requires a named permissions table; no configuration was changed to supply one.
- P5 source checkpoint: help lists only the two built planning skills and optional
  separately packaged Snipe. Its invocation names are checked against independently
  built package manifests/inventories; body and UI drift mutations are rejected.
  Help-only behavioral evidence remains part of P6, not established by text checks.
