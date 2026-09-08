# Codex war-strategy and war-help port plan

Status: proposed implementation sequence, not an operator-ratified execution plan.
Source inspected at `13c7625dc58f3c69904888ff25549f0a4c347fbb`. Reconcile this
snapshot with the live `codex-port` base before implementation. This document does
not authorize installation, paid host evaluations, issue filing, or engine changes.

## Outcome and boundaries

Deliver a Codex planning plugin containing `war-strategy` and a small `war-help`
companion. A user can author a WAR-shaped plan through the maintained interview,
or convert an existing draft, without installing optional interviewing skills or
running the WAR engine. Help accurately distinguishes installed capabilities from
Claude-side workflows and future Codex ports.

Preserve the shared doctrine and extraction-compatible artifact. Adapt runtime
discovery, invocation, evidence access, verifier dispatch and package-relative
resource resolution. Do not simplify away the pin ledger, verifier or confirmation
gates in pursuit of a shorter prompt.

Out of scope: executing plans, implementing red-team/war-room/war/campaigns,
changing shared config/defaults, activating CI, editing the engine campaign,
automatic issue publication, memory migration, visualization, and T5–T8 completion.
Authoring an engine-target plan must not imply the current pre-campaign snapshot
certifies the eventual engine's behavior.

## Source contracts to preserve

The maintained sources are `skills/war-strategy/SKILL.md`, its
`references/plan-interview.md` and `references/strategy-verifier.md`, and
`assets/plan-literal-lint.mjs`. Help currently lives in `skills/war-help/SKILL.md`.
The existing Codex distribution is the explicitly Snipe-only
`adapters/codex/package-snipe.mjs`; it must not silently become a writing plugin.

- Bare invocation interviews; an existing artifact triggers gap review and
  conversion. Optional Grill Me skills are a front door, not a prerequisite.
- Produce one merged decision record plus decomposed phases at
  `docs/plans/YYYY-MM-DD-<slug>.md`; a genuine multi-plan scope produces merged
  plans plus a roadmap, never an accidental spec/plan split.
- Keep flat extraction headings, separate task-field bullets, backticked file
  footprints, dependency waves, one-repository tasks and trailing release phases.
- Preserve evidence provenance, explicit assumptions/backstops, checkable End
  states, PIN landing classes, WAIVE provenance and twice-read marked pins.
- Operator intent and confirmation cannot be fabricated. Keep recommendation-first
  questions, the latitude beat, falsifiers, two closing echo-backs and operator exit.
- Run the existing advisory lint and surface findings; exit zero is not plan
  ratification. Its report-and-confirm duties must survive packaging.
- Preserve all four verifier arming rules, one bounded re-arm, unresolved forks
  and visible unavailable/partial/empty-corpus states. A verifier never ratifies
  intent or grants execution authority.
- Help prints orientation and stops: no file writes, dispatch or execution.

## P1 — Contract inventory and acceptance fixtures

1. Refresh the implementation base after review of the preceding PRs. Read the
   current doctrine, its structure/lint tests, relevant parser consumers and package
   tests. Record source revisions and separate historical engine claims from
   current verified contracts.
2. Enumerate every active resource dependency, including transitive links:
   templates, interview, verifier, lint, optional memory CLI, ADR pointers and help
   links. Classify each as required packaged guidance, optional evidence source,
   or external background documentation. Do not bundle an entire repository to
   make broken links disappear.
3. Build a port map: unchanged doctrine versus exact host substitutions. Explicitly
   cover Claude skill-directory scans, `.claude/war/runs/`, memory-root handling,
   checkout-relative lint commands and unported closing offers.
4. Define independent fixtures before adapter changes: new-plan interview,
   draft conversion, missing optional resources, verifier refutation/degradation,
   pin/waive persistence, incompatible task decomposition and help-only invocation.
   Expected outcomes come from doctrine, not from generated adapter text.

Acceptance: each source obligation has an owner, an observable check and an
explicit evidence level. No mandatory runtime behavior is silently marked optional.

## P2 — Standalone package and doctrine delivery

1. Recommend a separate `work-audit-refine-planning` package for these two skills.
   Preserve the existing Snipe package identity, inventory and read-only promise;
   do not require users to migrate Snipe for this port.
2. Add a small explicit planning-package builder and verifier beside the existing
   builder. Reuse established patterns; extract shared plumbing only if concrete
   duplication warrants it. No plugin framework or generic skill compiler.
3. Choose the narrowest doctrine-delivery mechanism after P1: package canonical
   sections with bounded, checked host substitutions or reference canonical
   host-neutral content. Never hand-maintain a second full doctrine. Check
   substitution cardinality and source-to-package equality outside those edits so
   upstream changes fail visibly rather than drifting unnoticed.
4. Provide Codex entrypoints and UI metadata under
   `adapters/codex/skills/war-strategy/` and `war-help/`. Verify the actual qualified
   invocation names. Preserve normal discovery for these new skills unless the
   operator chooses explicit-only; do not inherit Snipe's special policy blindly.
5. Bundle the canonical advisory lint with its real dependency closure. Execute
   it relative to the installed skill against the target plan, never by assuming
   the target repository contains WAR sources.
6. Inventory capabilities honestly: strategy authors plan files; help does not.
   Select no Claude hooks, engine launchers, credentials or unrelated commands.

Acceptance: build into a fresh directory; verify exact independent inventory,
regular files and contained references; move the package away from the source
checkout and run its lint. Missing doctrine/lint, an escaping symlink, unexpected
component or stale rewrite must fail a targeted negative test.

## P3 — Interview, conversion and evidence adapters

1. Implement the two-mode entrypoint while retaining the shared workflow. Use
   Codex's exposed skill inventory for optional interviewing skills rather than
   crawling Claude plugin caches. If absent, conduct the interview directly.
2. Resolve repository evidence within the target repository and user-selected
   artifacts. Existing Claude run artifacts can be read as explicitly relevant
   history, not treated as Codex state or modified. Record unread sources with
   reasons and preserve fail-open recon.
3. Inspect the memory query's actual effects before bundling or invoking it:
   the current CLI can append query logs under its local root and accepts a
   Claude-specific environment fallback. Do not infer a Codex root or inherit a
   Claude memory location. Use an explicitly scoped supported root if available;
   otherwise disclose unavailable prefetch and continue. No shared config change
   or replacement memory subsystem belongs in this port.
4. Preserve the operator's original draft and unrelated working-tree edits.
   Resolve destination collisions before overwrite. Only author requested plan
   artifacts; suggestions for ADRs do not authorize creating them.
5. Execute the packaged lint, disclose hits and reconcile required confirmations.
   A stopped interview remains visibly unfinished; never invent confirmations
   to produce a superficially complete file.
6. Replace automatic-looking unported handoffs with explicit availability notes.
   A completed plan is suitable for downstream review, not already red-teamed,
   execution-certified or permission to launch a campaign.

Acceptance: fixtures preserve provenance, task footprints and both closing gates;
missing optional tools do not block; plan contents remain input data rather than
instructions to mutate unrelated files or launch tools.

## P4 — Strategy verifier integration

1. Verify which supported Codex dispatch path can provide an independent read-only
   verifier. Prefer an existing suitable host mechanism. Snipe's audit-seat schema
   is not automatically the strategy-verifier contract; do not force-fit it or
   create a broad orchestration engine.
2. Pass the maintained refute charter, the precise recommendation and relevant
   evidence, with unresolved/missing corpus explicitly identified. Package the
   charter so it is available without checkout access.
3. Preserve rule-triggered dispatch before the recommendation is presented,
   bounded amend/re-arm/fork behavior, and the exact consequence/catching-layer
   result. Never silently downgrade models or guess the invoking task profile.
   If explicit configuration is required, obtain it through supported selection.
4. Test empty corpus separately from unavailable dispatch: the former still runs
   doctrine-based verification; the latter proceeds with a visible reason and no
   fabricated verdict. Operator waives retain scope, reason and fired arm.
5. Keep unavailable-verifier behavior functional, but do not call the complete
   verifier port accepted until one real read-only dispatch succeeds. Record the
   host support limitation if that evidence cannot be obtained.

Acceptance: all four arms covered; an unarmed control does not dispatch; a second
refutation becomes a user fork, not a loop; removing the dispatch bound or hiding
failure must fail the corresponding check. Verify actual permission enforcement,
not just a prompt saying read-only.

## P5 — Small, truthful war-help companion

1. Provide a concise card for planning and auditing, using actual package-qualified
   names. The planning package supplies strategy/help; Snipe is separately available
   only when installed. Absence must not be described as a broken installation.
2. Identify war-room, red-team, war and campaigns as unavailable in this Codex
   package. Link maintained background docs without implying those commands work.
3. Distinguish authoring prerequisites from execution prerequisites: a help request
   must not demand clean Git state, GitHub authentication or an execution gate.
4. Resolve packaged links or verified source links; remove accidental dependencies
   on the installed package sitting inside the WAR checkout.

Acceptance: a help-only fixture prints the capability map and performs no writes,
auditor launches, installation, or campaign actions. Capability claims have an
independent package/discovery test rather than a second unchecked command list.

## P6 — Behavioral evaluation, review and installation handoff

1. Run the deterministic tests: existing strategy lint/structure checks, unchanged
   Snipe package checks, new package and adapter tests, parser-compatible sample
   artifacts, reference closure and targeted negative controls. Add new suites to
   the reviewed CI inventory; do not activate the inactive workflow.
2. Run bounded independent behavioral evaluations from the built package in
   disposable target repositories. Give realistic requests and raw inputs, not
   expected answers. Score produced artifacts and observed actions, not heading
   matches alone. Cover interview, conversion, unavailable optional resources,
   bounded verifier disagreements, waives and help-only behavior.
3. Separate scripted transport tests from actual Codex loading and verifier tests.
   Agree the evaluator profile and model-call/audit budget before those runs; the
   previous campaign's seven-panel budget is not a new authorization here.
4. Use Snipe at cohesive implementation checkpoints, with the full #2097 repair
   discipline after findings. Record every panel, including incomplete ones, in
   chronological order. No clean claim based on missing/failed seats.
5. Run one final clean baseline on the exact implementation SHA with the dedicated
   conda environment. Document runtime prerequisites and all approved skips.
6. Submit reviewable stacked PRs. After operator merge and installation approval,
   update only the new Codex package via the supported install flow and test in a
   fresh task against a disposable repository. Verify qualified invocation, source-
   independent references, plan output and advisory lint. Verify Snipe still loads
   and Claude plugin/configuration files are unchanged.

## Proposed PR boundaries and completion bar

- PR A: package foundation, doctrine mapping, strategy entrypoint and deterministic
  contract tests. Depends on the accepted CI preparation base.
- PR B: verifier integration and small help companion, plus relevant tests.
- PR C only if needed: evidence-driven corrections and final acceptance records;
  do not manufacture a third PR solely for symmetry.

Each later branch descends from its predecessor. Keep both dependency order and
incremental review scope explicit; reconcile the integration base after earlier
PRs merge. Do not split same-file work across simultaneous tasks.

Source implementation is done when the full planning contract is preserved,
package isolation and negative tests pass, behavioral evaluations support the
claimed modes, and PRs contain exact-SHA evidence. Installed acceptance is a
separate milestone after merge: successful fresh-task operation using only the
installed package. Neither milestone claims the WAR execution engine is ported.
