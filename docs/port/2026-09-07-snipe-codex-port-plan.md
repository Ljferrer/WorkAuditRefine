# Snipe for Codex — implementation plan and durable checklist

> **Historical implementation checklist — next task changed 2026-09-10.** Snipe has since been implemented and exercised; the stage labels and campaign status below belong to their dated execution records. Use [the authoritative engine integration plan](../plans/2026-09-10-codex-engine-integration.md) to validate it against the merged engine. Retain original checkbox evidence and consult [app acceptance](snipe-app-acceptance.md) and subsequent port ledgers; source acceptance, installed-host observations and new combined-candidate validation are distinct.

Date: 2026-09-07. Status: implementation in progress; S0-S3 complete. This document is the continuation record for the first Codex feature port. Checkbox completion requires evidence, not an agent's recollection.

## Start here after compaction

- Canonical repository: `Ljferrer/WorkAuditRefine`.
- Working branch: `codex-port`.
- Isolated checkout: `/Users/ljf/Documents/Codex/worktrees/war-codex-port`.
- Tracking PR: [#2152, against master](https://github.com/Ljferrer/WorkAuditRefine/pull/2152).
- Original repository checkout: `/Users/ljf/GitHub/WorkAuditRefine`; it belongs to an active Claude campaign. Do not switch its branch, stage its files, reset it, clean its worktrees, or modify its configuration.
- Branch base: `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`, the recorded remote master at branch creation and analyzed WAR 0.21.12 snapshot. Do not assume this is the campaign's eventual engine.
- Already committed: source analysis (`16803ca`) and GitHub testing design (`0fb91fe`), both under `docs/port/`.
- User decision: one source repository, separate runtime integration, shared behavior kept in sync. Port **snipe first**, before the broader GitHub parity-testing implementation.
- User-reported campaign context: 4/14 phases of plan 1/3 complete, approximately 48–72 hours remaining when reported. No automatic monitor is established; do not infer completion from elapsed time.
- This task saves the plan only. Later implementation should follow the gates below and record actual results here.

On re-entry, run `git status --short`, `git branch --show-current`, and `git log -5 --oneline` **inside the isolated checkout**. Read this checklist and applicable instructions before editing. If another task has changed the branch, preserve its work and inspect the diff. Consult the execution record at the end; the first unfinished checklist item is the next action.

Related documents: [port analysis](2026-09-07-codex-port-analysis.md), [GitHub parity plan](2026-09-07-github-parity-testing-plan.md).

## Intended outcome

A user explicitly invokes the Codex snipe skill against a diff. It resolves one review target, chooses one to five distinct audit lenses, runs independent read-only reviewers using supported Codex configuration, validates their responses, and reports findings in the parent task. It stops after that report.

No fixes, commits, issues, PR comments, merge gates, automatic widening, phase engine, refinery, servitor, campaign execution, or automatic follow-up actions belong to snipe. “Absorb” and “follow-up” are classifications in its report, not permission to perform those actions. An `ask` finding is surfaced for the operator; snipe does not pause indefinitely to resolve it.

The Codex port must preserve Claude's existing snipe behavior and installation. It must be independently useful while the engine campaign is unfinished.

## Verified starting facts

The current `skills/snipe/SKILL.md` has no Workflow dependency. It invokes `skills/snipe/assets/snipe-args.mjs`, resolves a target, and requests parallel `work-audit-refine:war-auditor` seats. It explicitly assumes Claude's role tools and `agent_type` hooks apply unchanged.

The parser exports `parseSnipeArgs(raw)` separately from `snipeTier(config)`. Parsing can be reused without invoking the Claude-specific tier resolver. The module imports `war-config.mjs`, so there remains a source dependency on its pure configuration exports; do not mistake that import for a need to run the phase engine.

Observed checks in the prior turn:

```text
node skills/snipe/assets/snipe-args.mjs 'master 2 correctness,security'
  -> target master; 2 seats; named correctness/security; tier opus/high

snipeTier({agents:{snipe:{model:'gpt-6-astra',effort:'high'}}})
  -> opus/high

node --test skills/snipe/assets/snipe-args.test.mjs
  -> 13 passed, 0 failed
```

These prove the current parser's baseline and model mismatch. They do not prove Codex agent confinement or a working live snipe run.

The shared auditor card also contains phase-specific assumptions: missing task/plan fields, submodule task classifications, automatic widening, pin transfer, and assertions about Claude's Read/Grep/Glob/Bash tooling. Loading it unmodified as operative Codex instructions would import duties snipe does not perform.

## Architecture to implement

Use a **thin Codex skill entry point**, the existing parser, an explicit Codex model/profile resolver, a small result validator, and a Codex-specific read-only auditor role. Reuse shared doctrine by explicit references or bounded composition; do not copy the full auditor card into a second maintained implementation.

The preferred transport is native Codex subagents **only if the actual host exposes a way to select the configured read-only role and honor its policy**. The currently exposed collaboration API in the analysis session does not itself provide `agent_type`, cwd, or sandbox arguments. The presence of a spawn tool does not prove that a TOML role is selected or permissions are narrowed.

Perform a capability spike first. If native dispatch cannot demonstrably provide the required policy, use a minimal `codex exec` seat runner with explicit cwd, read-only sandbox, supported model/effort configuration, and structured output. That fallback runs only audit seats; it does not build the full WAR execution runner or App Server controller. State which transport is used in the report. Never silently substitute an ordinary writable subagent with “please do not edit” instructions.

Official references to recheck against the installed client before implementation:

- [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents): custom role configuration and read-only sandbox support.
- [Codex skills](https://learn.chatgpt.com/docs/build-skills): explicit invocation and `agents/openai.yaml` policy.
- [Codex package format](https://developers.openai.com/plugins/build/plugins): component paths and explicit hook selection.
- [Codex hooks](https://learn.chatgpt.com/docs/hooks): payloads, trust and enforcement limits.

Documentation supports the configuration concepts; acceptance depends on the installed integration actually enforcing them.

## Scope and proposed files

Keep new production files under a Codex-specific subtree such as `adapters/codex/`. Exact subdirectory names may change after the packaging spike; record them below rather than creating unused skeletons.

| Surface | Planned responsibility |
|---|---|
| `adapters/codex/skills/snipe/SKILL.md` | Explicit invocation, target/seat coordination, report-only behavior |
| `adapters/codex/skills/snipe/agents/openai.yaml` | `allow_implicit_invocation: false`; concise display metadata |
| Codex auditor profile/prompt in the adapter subtree | Actual read-only policy and snipe-specific role instructions |
| Small helper module(s) beside that skill | Reuse parsing, resolve Codex settings, validate seat results; target helpers only as needed |
| Seat runner, only if native role dispatch fails the spike | Bound subprocess lifecycle, collect structured results, enforce timeout/cancellation |
| `.codex-plugin/plugin.json` | Expose only implemented Codex entry points and explicit compatible components |
| Tests colocated with the adapter | Narrow regression, policy, target and result tests |
| This document | Checklist, decisions, tested versions and evidence |

Do not edit `.claude-plugin/*`, the phase engine, Claude model defaults, the active campaign config, or the shared agent card just to get this port working. If a shared change becomes unavoidable, document why, add the corresponding Claude regression proof, and keep it in a separate commit. Never add a Codex dependency to the Claude-only install path.

The packaging check must demonstrate that Codex does not accidentally discover Claude's default `hooks/hooks.json`. Use an explicitly supported manifest selection, including a validated no-op hook configuration if no Codex hook is needed. Avoid fake/dummy enforcement hooks. A package must contain every referenced shared asset within its installed root; no dependency on a neighboring development checkout.

## Target resolution contract

Resolve the review scope **once in the coordinator**. All reviewers receive the same canonical repository identity, target description, base revision, head revision and optional path filters. Keep refs and paths separate; pass git arguments as arrays, with `--` before pathspecs. Never interpolate a raw user target into a shell command.

- **Clean default:** determine the repository's actual default-branch ref, calculate merge-base with HEAD, resolve both ends to commit IDs, then review that fixed range. Do not assume the branch is named main or use a stale local master as the remote baseline without disclosure.
- **Explicit ref/range:** resolve and validate it before dispatch. Preserve the distinction between a two-dot range and a merge-base comparison. Missing or ambiguous refs produce a useful error, not an empty successful audit.
- **Explicit PR:** resolve the intended repository, PR base and head and then pin commits. Prefer a PR URL or an explicit target option. The legacy parser interprets a trailing bare integer as seat count, so it cannot reliably distinguish a bare PR number. Do not change that grammar silently. If needed, add a small Codex-only `--target` envelope that bypasses this ambiguity while continuing to reuse the existing seat/lens parser.
- **Path filters:** retain path boundaries and spaces without shell evaluation. If the existing raw-string parser cannot represent a requested path unambiguously, use structured/explicit target input or refuse with an example rather than guess.
- **Dirty default:** include staged, unstaged and relevant untracked changes; label the report advisory. Do not claim that HEAD identifies dirty content. Capture a scope/content fingerprint before and after review; if the inspected material changes, report instability rather than return a clean pinned approval. If content cannot be captured completely, disclose the missing scope. Temporary review evidence may live outside the target repository; reviewers themselves remain read-only.
- **Explicit committed target in a dirty checkout:** review immutable git blobs at the requested revisions, not unrelated working-tree content. State that scope; do not silently add local edits.

Avoid checking out a different branch, stashing, changing the index, or creating commits to construct a review target. For a PR whose objects are absent, coordinator-side fetching is a separately declared preparation action with bounded ref ownership; never ask a read-only auditor to fetch. It must not move the user's branches. A v1 implementation may clearly refuse unavailable remote targets until this path is implemented, but must document that support gap.

For committed reviews, file evidence must come from the pinned blobs. A read-only sandbox prevents writes but does not stop another process changing the checkout. Working-tree reads must not be the sole evidence for claims about a commit.

## Seats, model settings and independence

- Reuse `parseSnipeArgs()` for seat/lens grammar. Examine `errors`; the existing CLI exits zero even for invalid arguments. Refuse dispatch when errors are present.
- Add wrapper validation for reserved lenses, duplicates and target ambiguities. Verify bare reserved-lens inputs rather than assuming the legacy catalog classifies every reserved name as a lens. Preserve valid custom comma-separated lenses.
- Default Codex reviewers to the invoking session's configured model/effort when exposed and supported. An explicit Codex override takes precedence and requires no inherited task metadata. When neither is available, discover the host's supported profiles and ask the operator for a complete auditor pair. Validate overrides against the selected host. Do not pass `opus`, invent equivalences, or silently downgrade unsupported settings.
- Keep Codex overrides separate from `.claude/war/config.json` model fields. Shared parsing is appropriate; shared provider-name validation is not.
- Select distinct lenses with a short rationale, matching requested named lenses. Keep the requested seat count; queue seats in batches when host capacity is lower, rather than silently dropping them. The analysis session had four concurrent agent slots including the parent, but that is a session observation, not a portable constant.
- Each seat receives only the shared target, its lens and relevant doctrine. Do not seed it with another seat's verdict. Prefer fresh context rather than inheriting the parent's exploratory findings.
- Always retain seat identity, requested and observed configuration where available, and outcome. If actual model identity cannot be independently observed, label configured versus verified values honestly.

## Auditor doctrine and permission contract

Carry over evidence-based review, distinct lenses, severity vocabulary, disposition semantics, anti-cheat test review, calibrated confidence and named code locators. Read shared maintained references when their trigger applies; resolve plugin-root references through known installed paths.

Construct a snipe-specific role that has no task issue, no merge authority and no assumed gate output. A missing plan means code-only review. A `widen` recommendation may be reported but must not launch more seats. No gate execution, package installation, formatter, test run or git mutation belongs to the reviewer.

Claude's ban on non-git Bash commands partly compensates for its separate Read/Grep/Glob tools. Codex may use sandboxed shell reads instead. Preserve the semantic read-only contract through supported tools and actual policy; do not claim byte-identical tool allowlists when the hosts differ. Disable or exclude mutating MCP/connectors and escalation paths for audit seats. A filesystem sandbox alone does not prevent a network connector from filing an issue.

Do not carry over a phase rule that declares every unclassified gitlink change Critical merely because snipe has no task type. Detect and explicitly describe submodule scope; if nested contents are unavailable, report that limitation. Shared phase-only rules need a documented scope boundary, not blanket precedence from a copied agent card.

Permission acceptance requires both sides: a legitimate read succeeds and a attempted mutation is observed and denied. A model declining to try a write is inconclusive. Verify target files, git refs/index and scoped sibling sentinels remain unchanged. Exercise shell writes and patch/file-edit paths actually available in the chosen host. Avoid testing with dangerous real-user paths; use a disposable repository and controlled sibling fixture.

## Result contract and reporting

Use a versioned snipe result contract compatible with WAR concepts. Inspect the standing card, `schemas.md`, and snipe's trimmed example before choosing field spellings: they currently use overlapping forms such as `suggested_fix` versus `fix`, and `rationale` versus `evidence`. Normalize only explicitly supported aliases at intake; do not erase fields or treat all plausible objects as valid.

Minimum validated information:

```text
seat, lens, verdict, confidence, findings[]
scope: pinned audit_sha OR explicit dirty/advisory identity
finding: severity, title, file/locator where applicable,
         evidence/rationale, proposed correction where applicable
Minor/Nit: disposition; ask additionally has question and alternatives
escalate: nonempty explanation of the decision required
```

Validate seat/lens identity and exact committed revision against the coordinator's request. Reject `approve` carrying unresolved Critical/Major findings. Handle wrong scope, duplicate seats, invalid enums, missing JSON, truncation and failed dispatch explicitly. Do not infer success from process exit zero or from an agent's prose summary.

The initial design allowed at most one schema-repair attempt per seat. The post-land self-audit supersedes that default: normalize supported aliases deterministically, but never launch a model-based repair because preservation of the original judgment cannot be proven. Retain invalid raw evidence and valid peers' findings, and mark the overall report incomplete if a seat cannot complete. Never summarize an incomplete panel as “clean.” Historical S3 execution evidence below describes the former behavior, not the current contract.

The parent reports scope first, then per-seat outcomes, followed by severity-ranked findings. Corroborating duplicates can be grouped while retaining each seat's attribution. Contradictory findings remain visible; do not vote them away. Critical/Major findings are labeled “would block in a phase,” without creating an actual gate. Surface ask-disposition questions and stop. No automatic issue filing or implementation offer that triggers further work.

## Implementation checklist

### S0 — capability and packaging spike

- [x] Read applicable instructions and verify clean isolated branch status; record current source/client versions.
- [x] Inspect actual native dispatch API and custom-role loading. Prove whether role-specific read-only policy is selected.
- [x] Choose native subagents or bounded `codex exec` fallback; record evidence and limitations in the decision log.
- [x] Verify explicit-only skill policy, installed shared references and compatible hook selection in a temporary local package.
- [x] Establish an observed denied-write test and a successful read test in disposable fixtures.

**Exit gate:** a concrete dispatch path provides verifiable read-only enforcement. If neither path can, record the missing capability and stop implementation at this gate; do not ship a prompt-only approximation as equivalent.

### S1 — parsing and target resolution

- [x] Reuse the shared parser without `snipeTier()`; preserve existing Claude parser tests.
- [x] Implement only the needed Codex profile resolver; unsupported settings fail visibly.
- [x] Define accepted explicit-target syntax and resolve PR-number/path-space ambiguities.
- [x] Pin committed scope and handle dirty/advisory scope with before/after stability evidence.
- [x] Test missing refs, no diff, invalid seat counts, duplicates, reserved/custom lenses and command-injection-shaped targets.

**Exit gate:** no reviewer dispatch happens for invalid inputs; every accepted seat receives identical canonical scope.

### S2 — auditor instructions and coordination

- [x] Add the thin Codex skill entry point and `openai.yaml` invocation policy.
- [x] Compose shared doctrine with a narrowly scoped Codex auditor role; document phase-only exclusions.
- [x] Implement fresh independent seats with capacity-aware scheduling and complete seat accounting.
- [x] If using subprocesses, handle bounded output, deadlines, interrupts, child cleanup and nonzero exit status.
- [x] Ensure no mutating connector, unrestricted escalation or automatic widening is inherited.

**Exit gate:** one-seat and multi-seat executions use the selected role/profile, retain scope, and perform no target writes.

### S3 — validation and report

- [x] Implement the explicit result schema and supported alias normalization.
- [x] Reject wrong revision/lens/seat, malformed findings, inconsistent approval and incomplete JSON.
- [x] Implement the single bounded schema-repair path and incomplete-panel reporting.
- [x] Produce the informational report with attribution, limitations, dirty-state caveat and surfaced asks.
- [x] Prove report handling never invokes fixes, git mutation, issue filing or PR comments.

**Exit gate:** valid findings survive partial failure; missing evidence cannot become a clean result.

### S4 — acceptance and regression

- [x] Run all focused cases below against the helper/transport boundary.
- [x] Run a real installed-host audit of a seeded bug through two independent lenses.
- [x] Run the actual-host denied-write check; refusal to attempt is not enough.
- [x] Run the 13 existing parser cases and applicable shared/config/package regressions if those files changed.
- [x] Validate installed package paths from a fresh cache/root with the development checkout unavailable.
- [x] Check `git diff --check`, commit only intended files, record results, push the stacked S4 PR and update issue #2160 accurately.

**Exit gate:** declare usable only for targets and host versions actually tested. Any deferred target support or enforcement limitation remains explicit.

## Focused acceptance matrix

| ID | Test | Required result |
|---|---|---|
| S-A01 | Default one seat and two named lenses | Correct count/lenses; all requested seats accounted for |
| S-A02 | Invalid seats, duplicate/reserved lenses, invalid profile | Clear refusal; zero dispatch |
| S-A03 | Custom lens list and explicit target ambiguity | Supported form preserved; ambiguous form rejected or resolved by documented envelope |
| S-A04 | Committed target while checkout changes | Evidence/verdict stays at pinned revision |
| S-A05 | Dirty staged/unstaged/untracked changes | Advisory report includes declared scope; mid-run change prevents stable claim |
| S-A06 | Missing ref, empty diff, unavailable PR objects | Distinct outcomes; no false clean audit for failed resolution |
| S-A07 | Target/path contains spaces, quotes or shell metacharacters | Literal interpretation or safe rejection; no command execution |
| S-A08 | Five seats on lower-capacity host | Bounded scheduling; no lost or duplicate seat; independent inputs |
| S-A09 | Wrong SHA, wrong lens, malformed JSON, approve plus Major | Invalid result rejected; bounded repair or incomplete status |
| S-A10 | One failed seat plus one valid finding | Valid finding reported; panel clearly incomplete |
| S-A11 | Legitimate read and attempted shell/patch write | Read succeeds; write attempt denied with host evidence; fixtures unchanged |
| S-A12 | Mutation through inherited connector/escalation surface | Capability absent or enforced denial; never policy bypass |
| S-A13 | Submodule diff without phase task metadata | Scope disclosed; no spurious phase-only refusal |
| S-A14 | Ask/absorb/follow-up and widening fields returned | Informational report only; no extra seats or external side effects |
| S-A15 | Cancellation/timeout during a seat | Work stops, child cleanup completes, incomplete review reported |
| S-A16 | Fresh package install with wrong/missing component | Loading failure detected; correct package resolves shared assets and selects only intended hooks |

Every critical rejection test needs a positive counterpart and a targeted regression proof. For example, remove the revision check in a disposable test copy and demonstrate S-A09 fails for the intended reason. Comparing two equally wrong outputs is not a substitute for an independent expected result. Do not build the entire GitHub parity infrastructure to run this focused suite.

## Safe delivery sequence

Suggested small commits: (1) capability decision and helper tests; (2) explicit target/profile handling; (3) skill/role integration; (4) result/report behavior and actual-host validation. Combine tiny changes when that produces a more coherent review; do not commit nonworking scaffolding just to match this list.

Keep engine-independent changes on `codex-port`. Fetch and inspect remote changes before pushing, but do not automatically merge or rebase campaign branches. If the shared parser/card changed upstream, compare semantics before adopting updates. Preserve the accepted single-source doctrine rather than solving conflicts by copying a stale card.

Delivery rule added by the user on 2026-09-07: when an S-stage is completed, post its evidence summary to WAR issue #2160. Commit implementation progress on a new `codex/` branch; do not push stage work directly to the base branch. S0 and S1 opened directly against `codex-port`. Beginning with S2, stack each Snipe PR on the preceding Snipe stage branch: S2 targets `codex/snipe-port-s1`, S3 targets `codex/snipe-port-s2`, and so on until the stack is landed onto `codex-port`.

No new GitHub Actions workflows or branch protections are needed for the first snipe port. Record local validation now; migrate the focused tests into the planned CI system later. No plugin marketplace publication or automatic installation into the user's global configuration is part of this plan without a concrete follow-up instruction.

## Decision and execution record

| Decision | Current state | Evidence required to finalize |
|---|---|---|
| Single canonical repository | Accepted by user | Conversation decision; already recorded in parity plan |
| First feature is snipe | Accepted by user | Current request sequence |
| Native versus subprocess dispatch | Use bounded `codex exec` seats on Codex CLI 0.153.4. The desktop collaboration API exposed to this task cannot select a named agent or set its cwd/sandbox, so it cannot prove custom-role confinement. | `codex exec --ephemeral --ignore-user-config --ignore-rules --sandbox read-only --json -C <fixture>` read `sentinel.txt`; shell writes in the repo and to a sibling plus an `apply_patch` write were attempted and denied. |
| Codex model default | Inherit the invoking session's model/effort when that exact pair is supported by the selected host; validate explicit overrides against the same host map and refuse unsupported pairs. | `snipe-request.test.mjs` covers inherited and explicit supported profiles plus unsupported model/effort refusals. |
| Explicit target envelope | `rawArgs` contains only legacy seats/lenses. `target` is a structured object: omitted/`default`, `ref`, explicit two-dot `range`, `merge-base`, or full GitHub `pr` URL with a trusted base ref/SHA. `paths` is a separate literal string array. Locally unavailable PR objects are refused without fetching. | Focused tests cover legacy ambiguity, two-dot versus merge-base semantics, non-default PR bases, matching/lookalike origins, missing objects, spaces, quotes, shell metacharacters and Git pathspec magic. |
| Dirty-state strategy | Default dirty scope is advisory and hashes pinned HEAD plus complete staged/unstaged binary diffs and relevant untracked file contents. Recompute after review; a changed hash is unstable. Explicit committed targets ignore unrelated working-tree changes. Gitlink changes disclose exact pointers and local availability; uncommitted nested-submodule content is explicitly uncaptured and can never produce a stable result. | Focused tests cover staged, unstaged and untracked material, stable recomputation, a mid-run edit, committed scope in a dirty checkout, and committed/staged/unstaged/uncommitted-nested submodule states. |
| Result field compatibility | Versioned Snipe result v1 uses numeric `seat`, exact `lens`, a committed or dirty `scope` identity, verdict/confidence, normalized findings, `tests_verified`, and optional `widen`/`escalate_reason`. Supported WAR aliases are `seat-N`, top-level `audit_sha`, `evidence`→`rationale`, `fix`→`suggested_fix`, `tests_inspected`→`tests_verified`, and `ask.fork`→`ask.alternatives`; ambiguous or unknown fields are rejected. | Result tests cover canonical/alias-positive cases, wrong identity, malformed/incomplete JSON, malformed findings, reserved widening, false anti-cheat attestation and inconsistent approval. |
| Package layout and hooks | Build a Snipe-only Codex package with the standard `skills` component, the exact shared runtime dependency closure, and no hook component or hook files. This supersedes the S0 no-op-hook proposal: the current official validator rejects a `hooks` manifest field, while a package that contains no hooks cannot discover Claude's default `hooks/hooks.json`. | Structural tests enforce an exact ten-file inventory, reject missing/wrong components, import the standalone runtime, and assert no manifest hook field or hook path. The official plugin validator and CLI 0.153.4 both accepted the package; the installed cache had the same exact inventory. |

State when this plan was authored: this plan only; the earlier source check passed all 13 existing snipe parser tests. No live Codex snipe audit or denied-write acceptance had run. No runtime implementation, test infrastructure, model configuration, or installed plugin files were changed at that time.

After each implementation session, append: commit id; files changed; checklist items completed; exact test commands/results; actual host/model versions; remaining limitations; and the next unchecked action. Replace proposed decisions with evidence-backed choices, retaining material tradeoffs. Do not mark a checkbox complete because a file exists or a previous agent said it was done.

### 2026-09-07 — S0 capability and packaging spike

- Commits: `a8235f2` is the initial S0 evidence checkpoint and `9c12484` closes its first review findings; this final record-only correction follows them. Changed file: this plan only. Completed checklist items: all five S0 items. Planned source branch `codex-port` was clean at `af451ab4f0b0e8d9454f9e9d3ce495e25aa3629e`; the Codex app task checkout was a separate detached worktree at the same commit. The active campaign checkout was not modified.
- Versions: source manifest `0.21.12`; Codex CLI `0.153.4` from `/Applications/ChatGPT.app/Contents/Resources/codex`; configured parent model `gpt-5.6-sol` at `medium`, but the subprocess did not independently report its actual model identity.
- Applicable instructions read: `implement`, `openai-docs`, and `plugin-creator`. Official Codex documentation was checked for custom agents, skill invocation policy, plugin hook selection, and non-interactive read-only mode.
- Native decision: current official Codex supports project custom-agent TOML with `sandbox_mode = "read-only"`, but the collaboration API available to this task accepts task/context/model/effort only. It has no named-agent, cwd, sandbox or tool-surface selector. Native role confinement therefore is not demonstrable through this host API, and Snipe will use a bounded `codex exec` seat runner for this tested client.
- Permission proof: in disposable repo `/private/tmp/snipe-codex-s0-fixture/repo`, the command below successfully read `READ_OK_7f2c9a`. It then attempted and received observed denials for a shell write in the repo (`zsh:1: operation not permitted: denied-shell.txt`), an `apply_patch` write (`patch rejected: writing is blocked by read-only sandbox; rejected by user approval settings`), and a shell overwrite of the controlled sibling sentinel (`zsh:1: operation not permitted: ../sibling-sentinel.txt`). Before and after were identical: HEAD `05921e5bfcfeaf9c6001bfd0de576fdd01aa5fcf`; ref-list hash `d14c4cd171f1d031d05fc52f222648a2f9b089327a38ac62c12a79efdf144a49`; index-list hash `cb9dc25ba18748075de2c61de758427d91f5ff16d2cbdf3b0da28d1e10e7ad74`; clean porcelain-v2 status; target hash `0ce2b9c8ce52098679155a89dde58c1d49378b5edc8fa46e1b9522866d3e4f38`; sibling hash `11aa80bbc76d9f5298d47d262419e7514595ba4bb82cbfd22c1f9486737ab696`; both attempted output files absent.
- Package proof: a disposable `snipe-codex-spike` marketplace package installed successfully through CLI 0.153.4. Explicit invocation returned `SNIPE_CODEX_SPIKE_LOADED`. An identical-prompt A/B test changed only `allow_implicit_invocation`: when `true`, the first agent action declared use of `snipe-spike` and read its cached `SKILL.md`; when `false`, the agent did not auto-select it, began with repository discovery, and found the cached skill only later through a broad manual filesystem search. This verifies the routing policy and also shows that it is not a filesystem-secrecy control. Hook selection used a positive/negative pair: selecting `./hooks/hooks.json` created `/private/tmp/snipe-codex-default-hook-fired`; after selecting `./hooks/codex-hooks.json`, the same isolated trusted-hook run left that sentinel absent. The installed cache inventory was exactly `.codex-plugin/plugin.json`, `hooks/codex-hooks.json`, `hooks/hooks.json`, `skills/snipe-spike/SKILL.md`, and `skills/snipe-spike/agents/openai.yaml`; the disposable package referenced no files outside that root. The disposable plugin and marketplace configuration were removed after the tests.
- Validation-tool limitation: the bundled `plugin-creator` validator initially lacked PyYAML. At the user's request, a dedicated conda environment named `codex-snipe-port` was created with Python 3.12 and PyYAML 6.0.3. The validator then rejected the manifest's `hooks` field even though current official documentation describes it and CLI 0.153.4 installed it. Production package acceptance for this port must use the installed client plus focused structural tests until that validator schema catches up.
- Remaining limitations: `--ignore-user-config` still emitted a remote installed-plugin synchronization warning, and actual model identity was not independently observable. S2 must explicitly bound or remove connector/MCP capability for seats and distinguish configured from verified model values. No Snipe runtime files were added in S0.
- Next unchecked action: S1, beginning with regression tests around the reused parser wrapper and the explicit Codex target envelope.

Exact S0 test commands and results:

```text
codex exec --ephemeral --ignore-user-config --ignore-rules --sandbox read-only --json -C /private/tmp/snipe-codex-s0-fixture/repo 'Capability test. You must perform each action with the named tool even though writes should fail: (1) use shell to read sentinel.txt and report its exact content; (2) use shell to attempt creating denied-shell.txt inside the repository; (3) use apply_patch to attempt creating denied-patch.txt inside the repository; (4) use shell to attempt overwriting ../sibling-sentinel.txt. Do not request approval and do not retry. Report which reads and write attempts succeeded or failed, including exact tool errors.'
  -> exit 0; read succeeded; all three attempted writes denied with the errors recorded above

git -C /private/tmp/snipe-codex-s0-fixture/repo rev-parse HEAD
git -C /private/tmp/snipe-codex-s0-fixture/repo show-ref | shasum -a 256
git -C /private/tmp/snipe-codex-s0-fixture/repo ls-files --stage | shasum -a 256
git -C /private/tmp/snipe-codex-s0-fixture/repo status --porcelain=v2
shasum -a 256 /private/tmp/snipe-codex-s0-fixture/repo/sentinel.txt /private/tmp/snipe-codex-s0-fixture/sibling-sentinel.txt
  -> the before/after identities recorded above matched; status output was empty

codex plugin marketplace add /private/tmp/snipe-codex-package-spike --json
codex plugin add snipe-codex-spike@snipe-spike --json
  -> installed `snipe-codex-spike` from local marketplace `snipe-spike`

codex exec --ephemeral --ignore-user-config --sandbox read-only --json -C /private/tmp/snipe-codex-s0-fixture/repo -c 'marketplaces.snipe-spike.source_type="local"' -c 'marketplaces.snipe-spike.source="/private/tmp/snipe-codex-package-spike"' -c 'plugins.snipe-codex-spike@snipe-spike.enabled=true' '$snipe-spike'
  -> exit 0; `SNIPE_CODEX_SPIKE_LOADED`

codex exec --ephemeral --ignore-user-config --sandbox read-only --json -C /private/tmp/snipe-codex-s0-fixture/repo -c 'marketplaces.snipe-spike.source_type="local"' -c 'marketplaces.snipe-spike.source="/private/tmp/snipe-codex-package-spike"' -c 'plugins.snipe-codex-spike@snipe-spike.enabled=true' 'A temporary package-discovery skill is installed. Without explicitly invoking any skill or reading skill files, reply only with IMPLICIT_POLICY_CONTROL.'
  -> exit 0; `IMPLICIT_POLICY_CONTROL`

# Identical prompt after cachebuster reinstall, first with allow_implicit_invocation: true, then false:
codex exec --ephemeral --ignore-user-config --sandbox read-only --json -C /private/tmp/snipe-codex-s0-fixture/repo -c 'marketplaces.snipe-spike.source_type="local"' -c 'marketplaces.snipe-spike.source="/private/tmp/snipe-codex-package-spike"' -c 'plugins.snipe-codex-spike@snipe-spike.enabled=true' 'Verify Codex package discovery with the temporary package-discovery workflow.'
  -> true: first action selected `snipe-spike` and read its cached skill; false: initial actions searched the repo and unrelated system skill, with the cached skill found only by a later broad filesystem search

# With manifest hooks = ./hooks/hooks.json:
codex exec --ephemeral --ignore-user-config --sandbox read-only --dangerously-bypass-hook-trust --json -C /private/tmp/snipe-codex-s0-fixture/repo -c 'marketplaces.snipe-spike.source_type="local"' -c 'marketplaces.snipe-spike.source="/private/tmp/snipe-codex-package-spike"' -c 'plugins.snipe-codex-spike@snipe-spike.enabled=true' 'Reply only with PACKAGE_HOOK_POSITIVE_CONTROL.'
  -> exit 0; default hook sentinel present

# With manifest hooks = ./hooks/codex-hooks.json:
codex exec --ephemeral --ignore-user-config --sandbox read-only --dangerously-bypass-hook-trust --json -C /private/tmp/snipe-codex-s0-fixture/repo -c 'marketplaces.snipe-spike.source_type="local"' -c 'marketplaces.snipe-spike.source="/private/tmp/snipe-codex-package-spike"' -c 'plugins.snipe-codex-spike@snipe-spike.enabled=true' 'Reply only with PACKAGE_HOOK_NEGATIVE_CONTROL.'
  -> exit 0; default hook sentinel absent

conda run -n codex-snipe-port python /Users/ljf/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /private/tmp/snipe-codex-package-spike/plugins/snipe-codex-spike
  -> rejected only the manifest `hooks` field; CLI 0.153.4 accepted and installed that field

codex plugin remove snipe-codex-spike@snipe-spike --json
codex plugin marketplace remove snipe-spike --json
  -> disposable plugin and marketplace removed
```

### 2026-09-07 — S1 parsing and target resolution

- Commit: `7fc974e`. Changed files: `adapters/codex/skills/snipe/assets/snipe-request.mjs` and its colocated test. Completed checklist items: all five S1 items. The helper imports `parseSnipeArgs()` but never calls `snipeTier()`; the 13 existing Claude parser tests remain unchanged and passing.
- Accepted request syntax: `rawArgs` is reserved for the legacy seat/lens tail. Any legacy target text is refused with `AMBIGUOUS_TARGET`; callers instead pass one structured `target` object and a separate `paths` array. Supported target shapes are `{type:'default'}`, `{type:'ref',ref}`, `{type:'range',expression:'base..head'}`, `{type:'merge-base',base,head?}`, and `{type:'pr',url,base}`. A PR URL must use exact host `github.com`, match the local origin owner/repository, name its trusted actual base ref/SHA, and have `refs/pull/<number>/head` already available locally. The helper performs no fetch.
- Scope behavior: clean defaults resolve `refs/remotes/origin/HEAD`, merge-base and HEAD to immutable commit IDs. Explicit two-dot ranges remain labeled `two-dot`; ref, default, PR and explicit merge-base requests remain labeled `merge-base`. Literal pathspec wrappers preserve path boundaries and Git pathspec magic. Dirty defaults capture staged and unstaged binary diffs plus relevant untracked file contents in a SHA-256 fingerprint and return an advisory scope; `verifySnipeScope()` supplies before/after stability evidence. Explicit committed targets remain pinned even when unrelated checkout content changes.
- Validation behavior: parser errors, bare and listed reserved lenses, duplicate lenses, ambiguous raw targets, malformed targets/paths, unsupported host profiles, missing refs, empty diffs, unavailable PR objects and repository mismatches throw typed errors before any dispatch surface exists. `prepareSnipeRequest()` creates one frozen canonical scope for the later S2 coordinator to share across seats.
- Review: the required two-axis review finished with no remaining findings. It caught and drove fixes for a redundant parameter, a missing bare-reserved-lens wrapper check, non-literal Git pathspec handling, an incorrect default-branch assumption for PR bases, and a lookalike-GitHub-host origin parser.
- Versions/environment: Node `v24.17.0`; dedicated conda environment `codex-snipe-port` remains available for Python-based port tooling. S1 itself is dependency-free Node code and did not need Python packages.
- Remaining limitations: S1 resolves requests only; S2 must implement bounded read-only seat execution and pass this single canonical scope unchanged to every seat. PR preparation/fetching remains deliberately out of scope: absent local PR objects are a visible `PR_OBJECTS_UNAVAILABLE` failure. The dirty fingerprint currently has a 32 MiB bound for Git diff subprocess output; an over-bound capture fails rather than claiming complete scope.
- Next unchecked action: S2, beginning with the thin explicit-only Codex skill entry point and the bounded `codex exec` coordinator.

Exact S1 test commands and results:

```text
node --test adapters/codex/skills/snipe/assets/snipe-request.test.mjs skills/snipe/assets/snipe-args.test.mjs
  -> 25 passed, 0 failed (12 Codex request/scope cases plus all 13 existing parser cases)

git diff --check
  -> clean
```

### 2026-09-07 — S4 acceptance and regression

- Implementation commit: `f106634` on delivery branch `codex/snipe-port-s4` (helper-worktree equivalent `f025dfd`). Completed checklist items: all six S4 items. Added the standalone Codex package builder and its positive/negative tests, strengthened the actual-host fixture with a seeded invalid-input regression, and added a disposable S-A09 revision-guard mutant.
- Focused matrix: 53 deterministic tests passed. S-A01–S-A08 and S-A10–S-A15 remain covered by the request, runner and structure suites; S-A09 now includes a mutant that removes the revision comparison and proves the bad SHA would be accepted without the guard; S-A16 verifies the exact package inventory, wrong skill path, missing shared module, standalone import, absence of repository-root strings, and fail-before-write behavior for a missing source component. All 13 unchanged shared parser cases passed in the same command.
- Installed-host evidence: Codex CLI `0.153.4` on macOS, configured as `gpt-5.6-sol`/`medium`, completed the non-skipped acceptance in 168.9 seconds. The correctness lens returned `request_changes` and identified the seeded invalid/non-finite input regression; correctness and security were separate completed seats. The capability probe made a real repository write attempt, produced `codex_sandboxing::violation`/`operation_not_permitted`, observed no connector or approval surface, created no file, and left HEAD, refs, index, status and fixture bytes unchanged. The model/effort pair is the exact configured child profile; the host did not independently disclose model identity.
- Package evidence: `package-snipe.mjs` builds only `.codex-plugin/plugin.json`, the Codex Snipe skill, and the three-file shared dependency closure needed by the runtime. It rewrites only the two known development-tree import specifiers into package-local paths, then rejects any missing or extra component. The dedicated `codex-snipe-port` conda environment (`Python 3.12.13`, PyYAML `6.0.3`) passed the official plugin validator; both the source and built skill passed `quick_validate.py`.
- Fresh-cache evidence: CLI 0.153.4 installed `work-audit-refine-snipe@snipe-s4-acceptance` at a new cache path. After the local marketplace source became unavailable, a direct import from that cache succeeded. From an unrelated fresh Git repository, with the older WAR plugin disabled, Codex read the exact cached S4 `skills/snipe/SKILL.md` and returned `SNIPE_PACKAGE_LOADED`. The cached inventory exactly matched the ten expected files and contained no hooks. The disposable plugin, marketplace registration and empty cache directory were removed afterward.
- Hook decision variance: S0 proved CLI support for explicit hook selection, but the current plugin-creator validator rejects `hooks`. S4 therefore does not ship a dummy/no-op hook and does not include any hook path at all. This is both validator-compatible and prevents the Codex package from containing or default-discovering Claude's `hooks/hooks.json`.
- Review: parallel Standards and Spec reviews finished clean after two corrections: package builds now preflight every source so failures leave no partial artifact, and S-A09 has an independent disposable mutation proof. The Spec review accepted the no-hook variance given the validator/client evidence and required this execution record to preserve it.
- Delivery: PR #2166 (`codex/snipe-port-s4` → `codex/snipe-port-s3`) is the fourth link in the requested Snipe stack. S4 completion evidence is posted on WAR issue #2160 at `issuecomment-5577617027`.
- Tested support: this port is usable for clean default-branch, explicit ref, exact two-dot range, explicit merge-base, locally prepared GitHub PR, literal path-filter, and dirty advisory scopes on the tested Codex CLI `0.153.4` host with Node `v24.17.0`. Unsupported profiles and unavailable PR objects fail closed. Publication, automatic installation, CI migration, non-GitHub PR hosts, and automatic PR-object fetching remain out of scope. If the legacy WAR plugin is simultaneously enabled in Codex, its older skill with the same `snipe` name can win resolution; the acceptance disabled that plugin, so co-installation requires removing/disabling the legacy registration or a later unified package migration.
- Next unchecked action: none. S0–S4 are complete; landing the existing PR stack remains an operator review/merge action.

Exact S4 test commands and results:

```text
node --test skills/snipe/assets/snipe-args.test.mjs adapters/codex/package-snipe.test.mjs adapters/codex/skills/snipe/snipe-structure.test.mjs adapters/codex/skills/snipe/assets/snipe-request.test.mjs adapters/codex/skills/snipe/assets/snipe-runner.test.mjs adapters/codex/skills/snipe/assets/snipe-result.test.mjs
  -> 53 passed, 0 failed (including all 13 shared parser cases)

SNIPE_CODEX_BIN=/Applications/ChatGPT.app/Contents/Resources/codex SNIPE_CODEX_MODEL=gpt-5.6-sol SNIPE_CODEX_EFFORT=medium node --test adapters/codex/skills/snipe/assets/snipe-actual-host.test.mjs
  -> 1 passed, 0 failed in 168.9 seconds; the case was not skipped

node adapters/codex/package-snipe.mjs /private/tmp/snipe-s4-final.XqZwbn/plugin
conda run -n codex-snipe-port python /Users/ljf/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /private/tmp/snipe-s4-final.XqZwbn/plugin
conda run -n codex-snipe-port python /Users/ljf/.codex/skills/.system/skill-creator/scripts/quick_validate.py adapters/codex/skills/snipe
conda run -n codex-snipe-port python /Users/ljf/.codex/skills/.system/skill-creator/scripts/quick_validate.py /private/tmp/snipe-s4-final.XqZwbn/plugin/skills/snipe
  -> exact ten-file package built; plugin validation passed; source and packaged skill validation passed

codex plugin marketplace add /private/tmp/snipe-s4-package.Z0W86O/marketplace --json
codex plugin add work-audit-refine-snipe@snipe-s4-acceptance --json
node --input-type=module --eval 'await import("file:///Users/ljf/.codex/plugins/cache/snipe-s4-acceptance/work-audit-refine-snipe/0.21.12/skills/snipe/assets/snipe-runner.mjs")'
codex exec --ephemeral --sandbox read-only --json -C /private/tmp/snipe-s4-host-fixture -c 'approval_policy="never"' -c 'plugins.work-audit-refine@work-audit-refine.enabled=false' -c 'plugins.work-audit-refine-snipe@snipe-s4-acceptance.enabled=true' '<package-loading probe>'
  -> new cache install succeeded; source marketplace unavailable before import/invocation; cached runtime imported; cached S4 SKILL.md read; `SNIPE_PACKAGE_LOADED`

codex plugin remove work-audit-refine-snipe@snipe-s4-acceptance --json
codex plugin marketplace remove snipe-s4-acceptance --json
  -> disposable installation, registration and empty cache directory removed

git diff --check
  -> clean
```

### 2026-09-07 — S2 auditor instructions and coordination

- Implementation commit: `ab0f14f`. Completed checklist items: all five S2 items. Added the explicit-only Codex skill entry point, `agents/openai.yaml`, the Codex auditor role card, the bounded seat runner, actual-host acceptance coverage, and colocated request/runner/structure regressions. Updated `CONTEXT.md` to distinguish Claude's configuration ladder from Codex's exact invoking-session model/effort pair.
- Dispatch behavior: every seat is a fresh ephemeral `codex exec` process over the same frozen scope. The coordinator bounds concurrency, total captured output and elapsed time; retains successful peers when another seat fails; reports nonzero, timeout, output-limit and cancellation states; and terminates process groups with `SIGTERM` followed by bounded `SIGKILL` cleanup. Automatic widening, plugins, apps, browser/computer use, hooks, MCP servers and approvals are disabled in the child invocation.
- Role behavior: the Codex auditor composes the shared lens, severity, disposition and test-integrity vocabulary while explicitly excluding WAR phase authority, execution, mutation, issue/PR actions and follow-up dispatch. S3 remains responsible for strict result-schema validation and informational report rendering.
- Scope refinements: committed, staged and unstaged gitlink changes disclose exact base/head objects and whether those commit contents exist locally. Uncommitted nested-submodule content is labeled uncaptured, sets `contentsAvailable: false`, and forces the stability result false rather than permitting a clean completion.
- Actual-host evidence: Codex CLI `0.153.4` with `gpt-5.6-sol`/`medium` completed one-seat and two-seat runs, preserved lens/scope accounting, and left HEAD, refs, index, status and fixture bytes unchanged. A wrapper captured the production child argv and verified every capability disable, strict/ignored config, empty MCP map, read-only sandbox and `approval_policy="never"`. The probe reported `CONNECTOR_CAPABILITY_ABSENT`, `WRITE_DENIED` and `ESCALATION_UNAVAILABLE`; emitted no connector/MCP/approval event; produced host `codex_sandboxing::violation` and `operation_not_permitted` evidence; and created no probe file.
- Packaging evidence: the official Codex skill validator accepts the S2 skill directory. `allow_implicit_invocation: false` follows the documented `openai.yaml` policy. No package manifest or global installation was added in this stage.
- Review: the required Standards and Spec reviewers finished with no actionable findings. Their earlier passes drove fixes for disposition semantics, exact dirty submodule scope, target-module documentation, host-level capability assertions, profile-resolution wording, and an insufficient response-text independence assertion.
- Delivery: S2 begins the user-requested stacked sequence. Its branch is `codex/snipe-port-s2` and its PR base is `codex/snipe-port-s1`; S3 will branch from and target S2.
- Remaining limitations: seat output is retained but not yet validated as the final Snipe result schema. S3 must normalize supported aliases, reject wrong scope/lens/seat and malformed or internally inconsistent results, perform at most one schema-only repair, and render partial/incomplete panels without turning missing evidence into clean output.
- Next unchecked action: S3, beginning with the explicit result schema and alias normalization.

Exact S2 test commands and results:

```text
node --test skills/snipe/assets/snipe-args.test.mjs adapters/codex/skills/snipe/assets/snipe-request.test.mjs adapters/codex/skills/snipe/assets/snipe-runner.test.mjs adapters/codex/skills/snipe/snipe-structure.test.mjs
  -> 40 passed, 0 failed (13 unchanged shared-parser cases; 27 Codex request, coordination and structure cases)

SNIPE_CODEX_BIN=/Applications/ChatGPT.app/Contents/Resources/codex SNIPE_CODEX_MODEL=gpt-5.6-sol SNIPE_CODEX_EFFORT=medium node --test adapters/codex/skills/snipe/assets/snipe-actual-host.test.mjs
  -> 1 passed, 0 failed in 293.85 seconds

conda run -n codex-snipe-port python /Users/ljf/.codex/skills/.system/skill-creator/scripts/quick_validate.py adapters/codex/skills/snipe
  -> Skill is valid!

git diff --check
  -> clean
```

### 2026-09-07 — S3 validation and report

- Implementation commit: `4ffda74`. Completed checklist items: all five S3 items. Added the versioned Snipe result validator and pure report renderer, integrated both into the bounded coordinator, updated the explicit skill/role instructions, and extended the actual-host contract.
- Result contract: v1 validates exact seat, lens and scope identity. Committed results must echo the pinned head SHA; dirty results must echo the advisory fingerprint. Canonical findings require severity, title and rationale; Minor/Nit findings require a disposition, `ask` requires a question and explicit alternatives, and `escalate` requires a nonempty operator-decision explanation. An approval carrying Critical/Major findings is invalid, as is a false `tests_verified.exist` anti-cheat attestation.
- Supported aliases: `seat-N` normalizes to numeric seat; top-level `audit_sha` normalizes to committed scope; `evidence` to `rationale`; `fix` to `suggested_fix`; `tests_inspected` to `tests_verified`; and `ask.fork` to `ask.alternatives`. Canonical-plus-alias ambiguity, unknown fields and reserved widening lenses fail validation instead of being erased.
- Repair and partial failure: only a transport-completed but invalid result receives one schema-only repair process. The repair prompt carries the identical scope and forbids inspection, tools, widening, escalation and external actions. A persistent invalid result becomes `invalid_result`; timeout, cancellation, output-limit and transport failures are not schema-retried. Valid peer findings survive and the panel/report remain explicitly incomplete.
- Report behavior: the pure renderer reports scope first, then every seat outcome, limitations, and severity-ranked findings. Exact corroboration is grouped while retaining seat/lens attribution; contradictions remain separate. Dirty instability and submodule limitations are visible, Critical/Major findings say “would block in a phase,” asks and escalation reasons are surfaced, and disposition/widen values are labeled report-only. The module imports no process, filesystem, network or GitHub action capability.
- Actual-host evidence: the final post-review run on Codex CLI `0.153.4` with `gpt-5.6-sol`/`medium` passed one-seat, two-seat and capability-denial cases under result v1 in 217.87 seconds. Results were schema-validated rather than accepted from exit zero; the capability probe returned validated marker findings while the host still denied the write and left the target snapshot unchanged.
- Review: parallel Standards and Spec reviews finished with no remaining findings. Review caught and drove two fixes: `tests_verified.exist` must be exactly `true`, and the validator now imports the maintained shared reserved-lens list instead of copying it.
- Delivery: branch `codex/snipe-port-s3` stacks on and targets `codex/snipe-port-s2`. S4 will branch from and target S3.
- Remaining limitations: S4 still owns the full focused acceptance/regression sweep, a seeded real-host bug audit, fresh installed-package validation with the development checkout unavailable, and final version/support declarations. No package publication or global installation has occurred.
- Next unchecked action: S4, beginning with the complete focused acceptance matrix and seeded two-lens host audit.

Exact S3 test commands and results:

```text
node --test skills/snipe/assets/snipe-args.test.mjs adapters/codex/skills/snipe/assets/snipe-request.test.mjs adapters/codex/skills/snipe/assets/snipe-result.test.mjs adapters/codex/skills/snipe/assets/snipe-runner.test.mjs adapters/codex/skills/snipe/snipe-structure.test.mjs
  -> 50 passed, 0 failed

SNIPE_CODEX_BIN=/Applications/ChatGPT.app/Contents/Resources/codex SNIPE_CODEX_MODEL=gpt-5.6-sol SNIPE_CODEX_EFFORT=medium node --test adapters/codex/skills/snipe/assets/snipe-actual-host.test.mjs
  -> 1 passed, 0 failed in 217.87 seconds

conda run -n codex-snipe-port python /Users/ljf/.codex/skills/.system/skill-creator/scripts/quick_validate.py adapters/codex/skills/snipe
  -> Skill is valid!

git diff --check
  -> clean
```
