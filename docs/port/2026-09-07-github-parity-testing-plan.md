# GitHub testing plan for Claude and Codex parity

Date: 2026-09-07. Status: proposed implementation design for discussion; no workflows, GitHub settings, secrets, or releases are changed by this document.

## Accepted direction and working boundary

The user accepted one canonical WorkAuditRefine repository with shared behavior and separate runtime adapters. That decision supersedes the earlier analysis's proposed-only wording on repository ownership. Other architecture and testing choices below remain proposals.

Claude is executing an engine-changing campaign; the user reports 4/14 phases of plan 1/3 complete and expects another 48–72 hours. Treat that as operator-provided context, not a verified campaign status. Do not freeze, rebase, reset, clean, or change requirements on its branches while designing this test system.

The `codex-port` branch was created in a separate worktree from recorded `origin/master` at `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`, matching the analyzed 0.21.12 snapshot. The main local checkout is on a different, older commit with campaign-related changes. The branch is a safe place for documentation and additive test design; its engine is not presumed to be the campaign's eventual result.

Companion: [source analysis and repository strategy](2026-09-07-codex-port-analysis.md).

## Objective: behavior parity, not identical model answers

Both releases must implement the same declared orchestration contracts while retaining their own permission and lifecycle integration. They need not produce identical code, prose, tokens, timing, or model judgments.

Three distinct questions need separate evidence:

1. **Correctness:** does each implementation meet independently specified invariants?
2. **Parity:** given equivalent inputs and controlled agent outcomes, do both implementations make equivalent decisions and preserve equivalent evidence?
3. **Compatibility:** does the actual supported client load and execute the packaged integration with the intended permissions?

Two implementations agreeing is insufficient: both could approve the wrong revision. Running the same engine twice under identical mocks also does not test either host adapter. The report must distinguish common-engine unit tests, adapter contract tests, simulated transport integration, and actual runtime execution.

## Existing foundation

At the pinned snapshot, Git tracks 21 `*.test.mjs` files and 31 `*.test.sh` files. The earlier source analysis ran 1,634 JavaScript cases and four selected shell suites successfully. Those counts are historical evidence, not immutable minimums for future releases.

The only tracked GitHub workflow is `.github/workflows/memory-audit.yml`, which runs memory redaction lint for selected PR paths. It does not run the complete engine suite. `workflow-template.test.mjs` already injects runtime functions and scripted agent results. Several fixtures intentionally synthesize neutral defaults for new dispatch kinds; that preserves old tests but must not become the oracle for new parity tests.

Reuse the existing suites. Add a small test layer beside them, with explicit fixture outcomes and strict unexpected-dispatch failures. Avoid extracting or reorganizing the engine while the campaign is active.

## Proposed test layers

| Layer | Purpose | Runs | Required evidence |
|---|---|---|---|
| Existing regression suites | Preserve current engine, floors, memory, and guard behavior | Every PR and merge group | Real discovered test inventory, exit status, test counts, no unexplained skips |
| Contract and differential tests | Compare adapters against independent expected outcomes | Every PR once both adapters exist | Per-case assertions plus normalized cross-runtime comparison |
| Real git integration | Prove actual refs, files, gates, and crash recovery | Every PR, using local repositories | Git graph, tree checks, command evidence, process termination |
| Package and host compatibility | Prove installed assets and role/hook selection | Static/package checks per PR; actual host checks in supported environment | Installed file inventory, selected components, initialization and denial evidence |
| Live model smoke tests | Catch actual client/model/permission integration failures | Manually approved candidate, then scheduled canary if authorized | Bounded actual runs, objective fixture checks, raw failure evidence |
| Release gate | Bind test evidence to what is distributed | Every release candidate | Exact commit, contract version, package digests, supported runtime results |

During rollout, label the pipeline **baseline CI** until the Codex adapter exists. Do not publish “parity passed” when Codex tests are absent or skipped. Baseline green may permit preparatory work; it cannot authorize a dual-runtime release.

## Contract model and comparison oracle

Give each scenario a stable id, its input plan/fixture, scripted role outcomes, expected invariants, runtime applicability, and minimum evidence level. Keep this in one small reviewed scenario catalog. Do not add a general-purpose testing DSL.

Record observations such as:

```text
caseId, runtime, sourceSha, contractVersion, fixtureVersion
dispatch: task, role, lens, attempt, cwd, expectedRevision
audit: observedRevision, verdict, blockingFindingIds
gate: commandIdentity, revision, exitCode, artifactDigest
integration: taskResult, mergeRelationship, landingResult
recovery: reconciledActions, retainedFindings, remainingWork
effects: changedPaths, createdRefs, externalOperationIds
```

Each runtime must first pass the scenario's assertions. Only then compare normalized observations. Assertions must not be computed by importing the same routing function being tested.

Normalization may replace temporary roots, generated session identifiers, and timestamps. Compare independent parallel work by task identity and causal ordering, not completion order. Within a run, revision equality and ancestry must remain exact. Across independently constructed fixture repositories, compare commit roles, ancestry, and resulting trees rather than requiring timestamps and raw commit hashes to match.

Never normalize away severity, disposition, expected revision, permissions, missing events, retry counts, nonzero gate exits, or lost findings. Unknown event fields can be retained as raw evidence; unknown decision values or unsupported schema versions must fail visibly rather than silently disappear.

Introduce a reviewed capability profile for deliberate runtime differences, such as native UI presentation. It must name scope, rationale, owner, and validation level. An unavailable shared mandatory behavior is a failed release requirement, not a permissive exception. Temporary gaps have an expiry/revisit point and cannot be described as full parity.

## Initial scenario catalog

These are semantic targets. Confirm exact post-campaign routing against maintained contracts before binding expected enum values.

| ID | Stimulus | Required invariant or evidence |
|---|---|---|
| P01 | One task, clean implementation, two approving lenses | Task integrates only after both approve the intended revision; final fixture checks pass |
| P02 | One of two auditors reports a Major defect | No integration while blocking; a corrected revision receives fresh valid approval |
| P03 | Approval names an old or unrelated SHA | Approval rejected; unrelated JSON validity cannot satisfy the pin |
| P04 | Malformed, null, wrong-role, duplicate-seat, or truncated result | Explicit failure or documented bounded retry; no fabricated success or infinite redispatch |
| P05 | Two independent tasks plus a dependent task | Frozen-base semantics retained; dependency observes its required integrated predecessor |
| P06 | Workers and audit panels overlap | Global dispatch bound holds; thrown calls release permits; drain completes without deadlock |
| P07 | Gate fails or promised gate evidence is absent | No merge; evidence binds command, exit, and tested revision |
| P08 | Floor returns requirement failure versus git error | Distinct routing survives adapter translation; neither is treated as a passed floor |
| P09 | Missing test, packaging, acceptance, or other enabled floor | Each applicable floor independently blocks; explicit sanctioned exemption is recorded |
| P10 | Rebase changes relevant code after approval | Current pin-transfer/re-audit rules applied; stale evidence cannot authorize the new tip |
| P11 | Another writer advances remote before land | No force push or lost foreign commit; stale destination differs from a merge conflict |
| P12 | Kill process after worker commit | Existing commit survives; recovery reuses or explicitly reconciles work without destructive reset |
| P13 | Kill after integration / after remote push before ledger write | Recovery recognizes actual git state; no duplicate merge or landing |
| P14 | Ledger ahead, git ahead, unexplained commit | Records repaired toward known git truth; unexplained work halts |
| P15 | Transport loss after issue creation before acknowledgement | Existing correlation id found; no duplicate follow-up issue on retry |
| P16 | Absorb, follow-up, note, ask and carried findings across restart | No loss or silent disposition change; unruled ask retains operator decision requirement |
| P17 | Provisioning fails before work | Worker never starts; environment failure retains its evidence and classification |
| P18 | Auditor attempts mutation through supported tool paths | Attempt demonstrably reaches enforcement and is denied; filesystem and refs unchanged |
| P19 | Worker edits own file, sibling file, main checkout, traversal/symlink target | Legitimate operation succeeds; out-of-scope operation denied under declared policy |
| P20 | Patch adds, updates, deletes or renames multiple files | Every affected path checked, including destination; missing single `file_path` cannot bypass policy |
| P21 | Servitor writes invalid provenance or changes protected existing lesson | Rejected with evidence; valid scoped lesson succeeds; publication applies redaction policy |
| P22 | Cancellation while child process or permission request is pending | No new dispatch after cancellation; descendants terminate and incomplete state remains visible |
| P23 | Submodule task and later superproject gitlink update | Repository ownership and order respected; matching artifact/ancestry evidence retained |
| P24 | Cleanup meets ownership and landing proof / lacks either | Owned completed work can be removed; foreign, dirty, or unexplained work retained |
| P25 | Wrong plugin hooks selected or a runtime asset missing from package | Compatibility gate fails even when client process exits zero |
| P26 | Missing model, unsupported effort, missing credentials, rate limit | Capability/infra classification; no silent model downgrade and no false green |

Prioritize P01–P08, P11–P14, P18–P20, P25 for the first full parity gate. All applicable mandatory cases must be covered before claiming full campaign parity. Map additional floor types and new campaign behavior after the engine settles; this table is not a license to omit newly introduced requirements.

## Prove that the tests can detect regressions

For each critical guard, include a targeted negative control: remove the revision check, change unanimous approval to any approval, return success for a failing gate, bypass patch path validation, omit a carried finding, or accept ledger state over git. The corresponding test must fail for the intended reason.

Include a comparator test where **both runtime outputs contain the same defect**; the independent invariant check must still reject them. Include cases where a disabled dispatch or missing artifact fails before any aggregate count comparison. Treat an unexpected dispatch kind as an error, not a default green response.

Run small targeted mutants in PR CI and broader scheduling seeds in scheduled/manual suites. Do not require a repository-wide mutation framework initially. Existing lessons on vacuous assertions, standing-versus-dispatched instructions, and missing gate artifacts are the rationale for these checks.

## Real integration without provider credentials

Create disposable repositories with local bare remotes, deterministic fixture content, local git identity, and per-test working directories. Use the production adapter entry point with a scripted transport substitute at its external boundary. Fake model events, not the engine's merge or permission decisions. Where Claude's proprietary host cannot be driven with a stub, label the result a contract simulation; actual host evidence belongs in the compatibility/live layer.

Use real git and filesystem observations to verify the refiner's effects. Model command execution through controlled fixtures until a live agent is involved; a refiner JSON claim alone cannot prove a merge happened. Test issue reconciliation against a small local fake service with request recording and injected timeout-after-success. Real GitHub API smoke tests, if later needed, use a dedicated disposable test repository, never the active WAR campaign's issue tracker.

Crash tests kill the process at a named checkpoint and start a new process reading persisted state. Throwing an exception in the same test process is a different test and cannot stand in for crash persistence. Own and terminate child process groups; bound every scenario with a timeout and collect evidence before cleanup.

## GitHub Actions layout

Proposed files, implemented incrementally:

```text
.github/workflows/war-ci.yml            # baseline, deterministic and package checks
.github/workflows/war-runtime-smoke.yml # trusted live candidate/canary execution
.github/workflows/war-release-check.yml # validate exact candidate and evidence
tests/parity/                          # catalog, comparison, adapters and fixtures
scripts/ci/                            # only shared runner/report helpers needed
```

Reuse the repository's Node test runner and existing shell suites; no application package manager is necessary just to collect tests. Keep the current memory audit workflow intact during initial rollout. The new gate can include the same lint independently until consolidation is explicitly reviewed.

### Deterministic CI

Triggers: `pull_request`, `merge_group`, `workflow_dispatch`, and selected pushes to the stable/default and `codex-port` branches. Resolve actual maintained branches during implementation. Do not trigger on every campaign scratch branch. Avoid workflow-level path filtering for a required check; initially run the small complete baseline rather than risk incorrect change classification.

Suggested jobs: inventory, existing JavaScript, existing shell on Linux/macOS, contracts, git integration, package checks, targeted negative controls, and a single final **WAR CI** gate. Use Node 24 initially, pinned action commit SHAs, full git history where version-floor tests need it, and explicit git/jq/Python prerequisites. Run Bash-3.2-sensitive suites using the actual macOS system Bash as well as Linux Bash. Pin supported runner labels and record actual OS, architecture, shell, Node, Git, and client versions; do not conflate Linux success with macOS coverage.

Enumerate tracked tests under `skills/`, `hooks/`, and the added parity directory; never traverse worktrees. Fail an unexpectedly empty inventory, missing test file, or silently reduced scenario coverage. Avoid a brittle permanent assertion that exactly 1,634 tests exist. Require expected case ids and explicit reporting of skips. Preserve test exit codes through logging; when shell pipelines are used, ensure failures cannot be hidden by `tee`.

Set matrix fail-fast to false so both runtimes' failures are visible. The final gate uses `always()` with explicit `needs`, checks every mandatory job is `success`, and rejects skipped, cancelled, missing, or malformed mandatory reports. Check matrix reports against the expected runtime/platform/case set and tested revision, not just the aggregate job status. Upload per-job diagnostics on failure as well as success with collision-free artifact names.

GitHub notes that workflow-level filtering can leave required checks pending, conditional job skips can report success, and merge queues need `merge_group`. The gate design addresses those behaviors. Branch/ruleset enforcement must also require the check: YAML alone is not enforcement. Inspect actual repository settings before configuring it. [Required-check behavior](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks).

Activate required checks only after a successful rollout and after the campaign completes, so existing campaign landing procedures are not disrupted. Protect test-policy and workflow changes through review ownership. If merge queues are not used, retain the event support but do not claim queue validation was exercised. A test PR with an intentional failure must actually be unmergeable under the configured rules before enforcement is considered proven.

### Trust boundaries

PR tests run without provider credentials, with read-only repository permissions and checkout credential persistence disabled. Tests must not rely on ambient user configuration or production remotes. Do not run fork code under a credentialed `pull_request_target` or an elevated downstream artifact consumer. GitHub documents that elevated workflows executing untrusted code expose their secrets. [GitHub event security](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target).

Live jobs use a trusted workflow revision and a reviewed immutable candidate SHA from the canonical repository. A manual trigger alone does not establish candidate trust: validate provenance/allowed ref, and gate credential access through the chosen repository environment controls. Use separate provider test credentials, least privileges, and ephemeral hosted runners. Do not use the operator's Mac or active campaign credentials as CI infrastructure. [Environment configuration](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

Initially isolate client state with dedicated temporary configuration/data directories using each client's supported mechanisms; retain authentication only as explicitly supplied test credentials. Collect synthetic-fixture artifacts, redact secrets, and never upload credential directories or user session caches.

## Actual runtime and live-model checks

First prove headless loading, permissions and workflow invocation for each pinned client version in the intended runner environment. Claude documents programmatic plugin loading and structured `system/init` plugin errors, and background workflow waiting. Inspect those events; process exit zero alone is insufficient. Its workflow keyword is not an opt-in through `-p`, so the exact programmatic invocation of WAR's saved engine must be established rather than relying on a keyword. [Programmatic Claude](https://code.claude.com/docs/en/headless), [Workflow invocation](https://code.claude.com/docs/en/workflows).

For Codex, exercise the selected production transport (`codex exec` initially or App Server later) and packaged role policy. Do not count running a generic model API with equivalent prompts as a test of Codex. Use the inspected protocol capabilities and current client documentation to select version-compatible options; leave exact CLI pins to the feasibility task.

Start with four bounded checks per runtime: package discovery/role setup, one read-only audit of a seeded defect, one tiny repair-and-audit phase with objective assertions, and one denied-write scenario. For denial, a model simply choosing not to attempt the operation is **inconclusive**, not a pass; require observed attempt plus denial evidence or a documented host-level injection harness that exercises the real enforcement path.

No assertions about identical prose or complete agreement on subjective findings. For seeded correctness defects, score required defect detection and resulting tests; retain any missed mandatory defect. Permit at most one classified transient-infrastructure retry initially. Preserve every attempt; do not retry functional failures until a pass appears. Permission escape, stale approval, or corrupted state is always a hard failure.

Proposed operational bounds: at most one live candidate run at a time, four small scenarios per runtime, a 30-minute total workflow ceiling and per-scenario deadlines. These are starting limits to calibrate, not measured estimates. A dollar budget and approved model profiles remain operator choices. No paid calls or scheduled automation are authorized by this design document alone.

After stable manual runs, an opt-in scheduled canary can test pinned supported clients; a separate nonblocking lane can probe newer client versions. Report unavailable credentials or provider outages as blocked/inconclusive. Such a result cannot satisfy a release gate, but should not make ordinary uncredentialed PR checks fail.

## Package provenance and release enforcement

Build both candidate artifacts from the same source checkout. Stamp source SHA, contract/schema version, runtime target, package version and content digest. Verify the shared source assets agree before runtime-specific transformations; for bundled/generated code, verify a reproducible source-to-artifact mapping rather than assuming raw generated bytes match.

Install the packaged artifact into a fresh temporary root, with the source checkout unavailable to runtime resolution. Assert public skill inventory, shared-reference resolution, expected hook selection exactly once, no unintended runtime dependencies, and no escaping symlinks/paths. Include a renamed/missing asset and the wrong hook selection as negative controls. Retain the existing Claude version-slot monotonicity checks and add target-specific release checks without forcing experimental and stable package versions to have identical strings.

Release verification reruns deterministic checks on the exact candidate commit, then requires successful supported-client smoke evidence bound to the exact package digests and test/contract versions. PR merge-commit results or an older candidate's green run are insufficient. Build once, test those bytes, then promote those same bytes; do not rebuild an unverified artifact after the gate.

Two runtime packages may have different release maturity. A shared-engine change cannot be advertised as a compatible pair unless both supported targets pass. During Codex development, an established Claude-only release can continue under its existing policy and must not be labeled dual-runtime certified. A Codex-only adapter release still proves the declared shared contract and runs Claude regression/package checks. Define supported version ranges narrowly from evidence; test the minimum and primary supported versions where different before making broad compatibility claims.

A release report contains the scenario coverage matrix and evidence level, not just a badge. Keep release evidence with the release or a durable artifact store; short-lived Actions logs alone are insufficient for posterity. Signing/attestation can be added where available, but digests and exact-candidate checks are the initial requirement.

## Work sequence while the engine settles

| Step | Work and proposed ownership boundary | Completion criterion | Timing |
|---|---|---|---|
| T1 | Inventory existing suites and environment needs; author CI collector under `scripts/ci/` | Empty inventory, omitted test and swallowed exit each fail a fixture; existing suites run with logs | Can prepare now in isolated branch |
| T2 | Define scenario catalog, normalized observations and independent oracle in `tests/parity/` | Valid records pass; same-bug-on-both-sides, missing evidence and nondeterministic-order cases behave correctly | Can prepare now without engine edits |
| T3 | Add disposable git/fake-service fixtures and process failure controls | Fixture proves after-push-before-record recovery observation; no access to real remote | Can prepare now; bind production recovery after campaign |
| T4 | Draft `war-ci.yml`, package inventory policy and final-gate checks | Workflow lint passes; failed/skipped/cancelled matrix simulations reject; planned check naming stable | Branch-only preparation; no live ruleset changes |
| T5 | Reconcile completed campaign changes and wire the harness to maintained engine contracts | All new/changed dispatches explicitly mapped; existing regression suites pass; no neutral success fallbacks | After campaign lands |
| T6 | Integrate Claude and Codex adapter contract tests | Both adapters satisfy mandatory cases independently and differentially; critical mutants fail | With adapter implementation |
| T7 | Prove real client packaging, authentication, sandboxing and live smoke | Both supported clients execute intended path; bounded runs produce objective evidence | After credentials/model/budget choices |
| T8 | Enable required PR check and release certification | Intentional failed PR blocked; wrong-SHA/digest/old report rejected; correct exact candidate accepted | After campaign and stable CI rollout |

T1–T4 can be reviewed independently of engine internals. Author fixtures and expected behavior first; no need to wait 72 hours to design those. Avoid introducing engine hooks just to make tests easy during the campaign. When it finishes, merge/rebase the development branch deliberately and review semantic differences against this catalog; do not update expected outputs automatically to match whatever the new engine does.

Each implementation change should record its targeted red/green proof and exact coverage. Broad file coverage percentages and source-text matching are supplementary, not acceptance criteria. Keep tests small enough that a failure names the runtime, case, expected invariant, actual transition, and evidence path.

## Compute budget and GitHub account requirements

The GitHub API confirmed on 2026-09-07 that `Ljferrer/WorkAuditRefine` is public and owned by a personal account, with `master` as the default branch. **No GitHub plan upgrade is needed for the proposed standard-runner test compute.** GitHub states that standard hosted runner usage is free for public repositories. Larger runners remain paid, and artifact/cache storage has separate allowances and billing. [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [Runner pricing](https://docs.github.com/en/billing/reference/actions-runner-pricing).

Use standard Linux and macOS runners; avoid larger runners, GPUs and custom images unless measurements justify them. Start with seven-day retention for routine diagnostic uploads, compact JSON summaries and no dependency cache until it is useful. Store durable release evidence separately from routine run logs. Measure actual runtime, queue delay and retained artifact volume before considering extra paid capacity. Concurrent-job limits may affect queue time even when compute minutes are free.

Live model tests need separately supplied provider credentials and budget; a GitHub subscription does not fund those calls. Proposed initial policy remains credential-free PR tests and bounded live candidate tests. Do not purchase capacity or change budgets automatically. Reassess account requirements if repository visibility, runner class, or required administration features change. The repository owner's subscription and current storage consumption were not established; they are not necessary to conclude that standard public-repository compute needs no upgrade.

## Choices and limitations to resolve before activation

- Confirm primary supported operating systems. Proposed baseline: Linux deterministic suites plus macOS shell compatibility; actual Mac host enforcement needs Mac evidence.
- Choose provider test credentials, supported models, and live-run spend limit. Proposed initial policy: manual/release smoke only; scheduling opt-in after calibration.
- Verify repository ruleset/environment features and administrator access. No remote GitHub settings were inspected or modified for this plan.
- Choose release packaging layout and transport after feasibility evidence. Tests should enforce installed behavior rather than lock speculative folder names.
- Reconcile new campaign contracts before declaring the case catalog complete. Historical pre-campaign test counts do not certify the landed engine.

The immediate deliverable is an additive, credential-free test foundation. The eventual gate certifies shared behavior and real host compatibility without tying normal PR iteration to probabilistic model output or provider availability.
