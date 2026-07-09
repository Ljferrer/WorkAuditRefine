# Close the coverage and hermeticity gaps in the confinement guards, merge floors, and worktree write-scoping

Addresses (memory lessons): dotdot-pattern-misses-leading-relative-traversal, frontmatter-tools-negation-check-single-line-only, absence-guard-verb-specific-coverage-gap, absence-guard-search-root-must-anchor-to-subtree, release-blurb-describing-a-rename-trips-the-renames-own-absence-guard, case-glob-star-crosses-slash-prefix-needs-root-plus-nested, floor-script-discovery-set-must-mirror-gate-exclusions, packaging-floor-is-a-noop-without-a-dockerfile-and-ignores-modified-paths, scope-hook-test-nonhermetic-inside-war-task-worktree, edits-land-in-main-not-session-worktree, workflow-agents-cwd-is-main-repo-not-session-worktree

> Design spec — a ratified decision record. It carries **no** dispatch structure (no phases, tasks, `deps`, or build order); `/war` cannot execute it. `/war-machine` converts it to an implementation plan. Version at authoring: 0.14.14 (next free patch resolved from the four slots at land time).

## 1. Context — the gap / problem

WAR's confinement is capability-first (ADR 0002): hooks under `hooks/` and merge-time floors under `skills/war/assets/` are the mechanical backstop behind the prose discipline. Eleven recorded lessons show the *same shape of defect* recurring across those guards — each one is a latent hole that a green run inside a worktree does not disprove, or a prose-only invariant with no standing mechanical check. This spec resolves them together because they share three root patterns: **under-covered equivalence classes**, **search/scope roots that leak into stale worktrees or prose**, and **floor/gate discovery drift**.

The concrete gaps, each grounded in the live surface:

- **`..`-traversal class is incomplete.** The pre-`case` guard in `hooks/validate-worktree-scope.sh` rejects with the pattern `*/../*|*/..`. Verified: `../etc/foo` and bare `..` both fall through to ALLOW — leading-relative and bare traversal escape the guard. It is only harmless today because the servitor/worker branches happen to deny relative paths downstream; the sandbox-escape boundary has an unenforced latent hole. [dotdot-pattern-misses-leading-relative-traversal]
- **YAML negation checks are single-line.** A forbidden-token check that greps only the `^tools:` header silently passes when the token sits on a block-style continuation (`- Bash`). This was fixed *ad hoc* in `hooks/validate-worktree-scope.test.sh` (a bespoke `awk` tools-block extractor) and in `hooks/validate-servitor-provenance.sh`'s `extract_provenance`, but there is no shared, reused convention — the next negation guard authored will repeat the header-only mistake. [frontmatter-tools-negation-check-single-line-only]
- **Absence guards enumerate one verb.** `skills/war/assets/refinery-surface.test.sh` originally scanned only `checkout origin/`; it missed the equivalent `switch origin/`. That specific gap is now closed (ABSENCE CHECK 2 + 3), but by hand — there is no convention that forces new git-surface absence guards to enumerate the whole verb equivalence class, so the class-defect will recur on the next verb. [absence-guard-verb-specific-coverage-gap]
- **Guard tests scan stale worktrees.** A guard test whose search root is the repo root walks `.claude/worktrees/**`, hitting ~100 stale duplicate checkouts of the file under test — producing an environment-dependent false FAIL that reproduces in the main checkout but PASSES inside a task worktree. `provision-worktrees.test.sh` was fixed with `SKILLS_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"`, again by hand and with no lint that forces the narrowest search root. [absence-guard-search-root-must-anchor-to-subtree]
- **Rename absence guards re-trip on their own release blurb.** A rename guard that greps the *old literal token* anywhere in a watched file goes RED when a README `## Status` / changelog line merely *describes* the rename. The only current mitigation is prose discipline ("phrase by effect"). Same guard-scope class as the search-root leak. [release-blurb-describing-a-rename-trips-the-renames-own-absence-guard]
- **Floor pattern dialect footguns.** The test floor (`skills/war/assets/assert-test-in-diff.sh`) matches with bash `case`-fnmatch (no `FNM_PATHNAME`): `**/` tokens miss root-level files and a "fix" like `*test_*.py` substring-over-matches (`latest_results.py` → false floor PASS). `war-config.mjs` `validate()` currently only enforces a charset guard on `overrides.testPattern`; it does not reject malformed `**/` tokens or warn on substring-prone `*token*` shapes. [case-glob-star-crosses-slash-prefix-needs-root-plus-nested]
- **Floor⊆gate parity is trusted, not tested.** `assert-test-in-diff.sh`'s `match_sh_suite` claims byte-for-byte parity with `resolveGate`'s `find … -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.claude/*'` (`war-config.mjs`). The two mechanisms are hand-mirrored with no standing cross-check; either can drift and over- or under-credit test presence. [floor-script-discovery-set-must-mirror-gate-exclusions]
- **Packaging floor no-ops on Modified-only diffs.** `assert-packaging-in-diff.sh` collects only `A`/`R`/`C` diff paths (`M`/`D` are `continue`d), so a purely-Modified diff never flags even with a Dockerfile present. Whether that is a bug or an intentional scope has never been ratified in the script or an ADR. [packaging-floor-is-a-noop-without-a-dockerfile-and-ignores-modified-paths]
- **Gates run non-hermetically inside a `.war-task` worktree.** The scope hook's ancestor walk finds a `.war-task` marker and behaves differently, so a gate run whose scratch dirs land under a worktree can spuriously fail — a `gate_failed` the orchestrator would otherwise trust at face value. The `TMPDIR=$(cd / && mktemp -d)` pin (#95b) is present in `workflow-template.js` and asserted by `refinery-surface.test.sh` PRESENCE CHECK 4, and the environment-vs-introduced gate-failure classification exists — but "re-verify from a clean checkout before trusting `gate_failed`" and "read stderr precondition markers, not just TAP stdout" remain prose, not a codified reader contract. [scope-hook-test-nonhermetic-inside-war-task-worktree]
- **Main-checkout write footgun for non-WAR workflow agents.** Editing an absolute path under the MAIN repo root from a session worktree writes the main checkout; `git diff` in the worktree shows nothing. Workflow-spawned agents inherit cwd = main repo root, so relative writes land off-branch on master and collide with the operator's edits. For a confined `war-worker` this is already blocked (the scope hook denies any write with no `.war-task` ancestor), but general workflow agents (spec-writers, the ones authoring *this* document) run with fail-open scope and no path-contract check. [edits-land-in-main-not-session-worktree, workflow-agents-cwd-is-main-repo-not-session-worktree]

The unifying decision: **convert each prose-only invariant into a mechanical check, and harden each under-covered pattern to its full equivalence class**, while keeping every change bash-3.2-safe, cwd-independent, and byte-identical on the absent/clean path.

## 2. Pivotal constraints

- **bash 3.2.57 everywhere.** All hook/floor/test edits must run on macOS bash 3.2.57 — no `globstar`, no associative arrays, no `${,,}`. This is why patterns are `case` globs and extraction is `awk`, not a richer parser.
- **Fail-direction is load-bearing.** Scope/confinement negation guards must fail *closed* (a miss denies); positive capability grants may stay line-scoped because a miss there fails *safe* (denies a legitimate grant, never widens). Floor exit codes keep the 0/1/2 contract: `1` = the named route (`no-test`/`unpackaged`), `2` = git/ref error and must never collapse into the route status.
- **Absent/clean path stays byte-identical.** Widening the `..` class, adding token validation, or adding parity tests must not change behavior for any path/pattern/diff that is already correct today — existing suites pass byte-unchanged.
- **Guards apply by `agent_type`, capability-first (ADR 0002).** The `..` guard is intentionally pre-`case` so it binds all agent types including `war-refiner` and the main session (ADR 0002 D5, `dotdot-guard-applies-to-all-agent-types`). Do not move it inside a per-agent branch.
- **Floor ⊆ gate (ADR 0006) is the invariant, not a coincidence.** The floor must never be satisfiable by a test the gate would not run. Parity between floor discovery and `resolveGate` is a *requirement*, and this spec makes it testable rather than trusted.
- **Two-surface prompt sync.** Auditor/refiner behavior lives in both `agents/*.md` (standing) and `workflow-template.js` (dispatched string-built prompts); any reader-contract change (e.g. the stderr-precondition-marker rule) must land in both surfaces in the same change.
- **Prose→mechanism promotion, not new abstraction.** Where a fix already exists ad hoc (the tools-block `awk`, the switch-verb arm, the `SKILLS_ROOT` anchor, the `TMPDIR` pin), the resolution is to *codify the convention and add a standing guard*, not to introduce a framework. One helper with one caller is not warranted; a lint/parity test that catches the whole class is.

## 3. Resolved design tree

| Decision | Resolution |
| --- | --- |
| `..` traversal equivalence class | **Widen the reject case to `..\|../*\|*/../*\|*/..`** in `validate-worktree-scope.sh`, closing leading-relative (`../etc/foo`) and bare (`..`) traversal. Add explicit test cases for both. Verified the widened class denies all five traversal shapes and still ALLOWs a clean absolute path. |
| Where else the `..` class must hold | The floors (`assert-test-in-diff.sh`, `assert-packaging-in-diff.sh`) already reject `*..*` on ref args (broader; adequate). `warn-bash-write-scope.sh` skips relative targets by design (advisory). **Only `validate-worktree-scope.sh` changes**; the others are verified adequate. |
| YAML negation extraction | **Standardize a full-fenced-block extraction convention** (header line + all `- ` continuation lines between the `---` fences) for every *forbidden-token* frontmatter check, and add a standing guard test asserting the convention holds. Positive grants may remain line-scoped (miss fails safe). A shared sourced helper is **not** built — there is one live negation site; a documented convention + a meta-test that greps for header-only negation patterns is the lazy mechanical enforcement. |
| Verb equivalence class in absence guards | **Convention: every git-surface absence guard enumerates the full verb equivalence class in a comment and scans ALL verbs** (`checkout`/`switch` today; the comment names the class so a new verb is caught in review). Codify the already-present `refinery-surface.test.sh` two-verb coverage as the reference pattern. No shared verb-list file (speculative; one consumer). |
| Guard-test search-root leak | **Convention + lint: guard test scripts anchor their search root to the narrowest subtree** (resolve from `$SCRIPT_DIR`, verified via `cd`/`pwd`), never the repo root; where a repo-wide scan is unavoidable it MUST exclude `.claude/`. Add a meta-test that scans `hooks/**` and `skills/**` `*.test.sh` for repo-root-anchored `find`/`grep -r` without a `.claude` exclusion. |
| Rename absence guard re-trips on blurb | **Scope rename absence guards to exclude the prose region** — the README `## Status` line and any `CHANGELOG`/changelog section — and/or match on the *structural* token position (e.g. the `::` skill-id form `:: war-survey-corps`, not the bare word). Removes reliance on authors phrasing release blurbs "by effect". |
| Floor pattern token validation | **Extend `war-config.mjs` `validate()`** for `overrides.testPattern`: reject any token containing `**/` (mis-globs under `case`-fnmatch), and reject/downgrade substring-prone `*<word>*` shapes that are not a clean `*.ext` suffix or `pre_*`/`*/pre_*` prefix pair. Keep the existing charset guard. Patterns still come from the encoded per-language table (prior spec `2026-07-07-test-floor-pattern-threading`), not hand-authored. |
| Floor⊆gate parity | **Add a parity test** that mechanically extracts the exclusion/name predicates from `resolveGate` (`war-config.mjs`) and asserts `assert-test-in-diff.sh`'s `match_sh_suite`/`match_default` exclusion arms are exactly `node_modules`, `.git`, `.claude` and the same name globs — the drift-guard idiom already used for `HARD_ESCALATION_REASONS`/`KNOWN_LAND_DECISIONS`. |
| Packaging floor Modified-only scope | **Ratify Added/Renamed/Copied-only as intentional** and say so explicitly in the script header + an ADR 0017 addendum: a Modified/Deleted packaging artifact that breaks the image is a *build* failure the opt-in docker gate / CI catches, not an enumerated-COPY-drift the floor exists to catch. No executable change to the diff-collection arm; the decision is recorded, not left silently no-opping. |
| Non-hermetic gate `gate_failed` trust | **Codify the reader contract**: the gate-failure classification (already in `workflow-template.js`) must (a) re-run the failing gate with a `.war-task`-free `TMPDIR` (present) and (b) treat a `gate_failed` accompanied by a known stderr **precondition marker** (e.g. `REL_GUARD_PRECONDITION_FAILED`) as `environment`, never `introduced`. Land the stderr-marker rule in both the dispatched prompt and `agents/war-refiner.md`. |
| Non-WAR session write footgun | For confined `war-worker`s: **already enforced** (scope hook denies main-root writes lacking a `.war-task` ancestor) — record this as the resolution. For general workflow agents: **inject the absolute worktree root into workflow args and require each returned file path to contain the `.claude/worktrees/<name>/` segment before reporting done** (a path-contract assertion in the workflow done-reporting), making the cwd contract enforced rather than remembered. |

## 4. Mechanics (per component)

### `hooks/validate-worktree-scope.sh` — the `..` equivalence class
Replace the single reject arm with the full class:
```sh
case "$path" in
  ..|../*|*/../*|*/..)
    deny "path '$path' contains a '..' traversal segment; use an absolute canonical path instead."
    ;;
esac
```
The arm stays **pre-`case "$atype"`** (ADR 0002 D5) so it binds every agent type. Update the header comment that currently documents only `/../*` and `/..`. Regression: the four already-covered shapes (`/a/../b`, `/a/..`, `a/../b`, servitor/worker `..` cases in the existing test) still deny; clean absolute paths still allow.

### `hooks/validate-worktree-scope.test.sh` — new `..` cases + block-extraction convention
Add explicit cases for `../etc/foo` (leading-relative) and bare `..` → expect exit 2, for at least one confined role and for the pre-`case` all-agents path (refiner + no-`agent_type`). The existing tools-block `awk` extractor (`/^tools:/{found=1…}` continuation walk) becomes the **named reference implementation** of the block-extraction convention; add a comment tagging it as such.

### YAML forbidden-token convention + meta-guard
Document (in `CONTEXT.md` and the guard-authoring convention) that a *negation* check on frontmatter extracts the whole block between the `---` fences (header + `- ` continuations), never a single `^key:` line. Add a meta-test (a new `hooks/*.test.sh` or an arm in an existing one) that scans guard scripts/tests for a negation grep anchored to a bare `^tools:`/`^<key>:` header without a following block walk, and fails if one is found. `validate-servitor-provenance.sh`'s `extract_provenance` already conforms (it walks `metadata:` → nested `provenance:`); it is the second reference.

### `skills/war/assets/refinery-surface.test.sh` — verb-class convention
Codify the existing ABSENCE CHECK 2 (`checkout origin/`) + ABSENCE CHECK 3 (`switch origin/`) as the reference verb-class pattern: a comment at the top of each git-surface absence block enumerates the equivalence class (`checkout | switch`) and every listed verb is scanned. This is the standing example the convention (§3, §6) points to; no code behavior change beyond the enumerating comment.

### Guard-test search-root lint
Add a meta-test that walks `hooks/` and `skills/` for `*.test.sh` and flags any `find`/`grep -rn`/`grep -r` whose root is the repo root (`$ROOT`, `$SCRIPT_DIR/../../..`, or `.` from repo root) without a `.claude` exclusion. The canonical safe forms are: anchor to `$SCRIPT_DIR`-derived narrowest subtree (as `provision-worktrees.test.sh` now does with `SKILLS_ROOT`), or grep named files (as `refinery-surface.test.sh` does), or exclude `.claude/` (as `resolveGate` does). `resolveGate`'s `-not -path '*/.claude/*'` is the reference exclusion.

### Rename absence-guard prose exclusion
For guards that assert a renamed-away literal token is absent from a watched file, exclude the prose region before scanning: drop the README `## Status` line and any `CHANGELOG`/`## Changelog` section from the grep input, or match the structural token form (`:: <skill-id>`) rather than the bare word. Reference incident: the `/survey-corps` rename Phase-2 blurb re-tripped `README.md UNEXPECTEDLY has :: war-survey-corps`. This mirrors the `enumerated-file-list-absence-guard-for-rename-with-legitimate-history` pattern (enumerate structure, don't bare-grep).

### `skills/war/assets/war-config.mjs` — floor-pattern token validation
Extend `validate()` for `overrides.testPattern` (after the existing charset guard `^[A-Za-z0-9*?./_ -]+$`): for each space-separated token, **reject** any token containing the substring `**/` (mis-globs under `case`-fnmatch; the correct depth-agnostic form is a bare `*.ext` suffix, and prefix conventions use the `pre_* */pre_*` pair). **Reject** a token of shape `*<word>*` where `<word>` is not bounded by a `.`/`/` (substring-over-match risk, e.g. `*test_*` → `latest_results`). The per-language suggestion table in the prior spec is the encoded source of well-formed tokens; validation makes a hand-authored malformed token fail loud at config time instead of causing a false floor PASS at merge time.

### Floor⊆gate parity test (`assert-test-in-diff.test.sh` or a new drift-guard)
A test that reads `resolveGate` output (or the `war-config.mjs` source) and asserts the floor's discovery arms match: (1) the `*.test.sh` exclusion set is exactly `{node_modules, .git, .claude}` on both sides; (2) the node glob is `skills/**/*.test.mjs` on both sides. Fail loud on any asymmetry. This is the standing cross-check the lesson asks for — the "floor EXACTLY equals gate discovery set" claim in the script header becomes enforced, not inspected.

### `skills/war/assets/assert-packaging-in-diff.sh` — ratify A/R/C-only
Extend the header block that already says "deletions and pure modifications never flag" with an explicit *ratification* note (this is the intended scope, not a gap) and a pointer to the ADR 0017 addendum. The diff-collection arm (`A*` → `$f1`, `R*|C*` → `$f2`, `*` → `continue`) is unchanged. The docker-build gate is the mechanism that catches Modified/Deleted packaging breakage.

### `workflow-template.js` + `agents/war-refiner.md` — hermetic-gate reader contract
The dispatched gate-failure classification prompt and the standing refiner instruction gain the stderr-precondition-marker rule: when a gate run emits a recognized precondition marker (e.g. `REL_GUARD_PRECONDITION_FAILED`) on stderr, classify `environment`, carry the marker in `gate_output` uncurated, and never route it as an `introduced` regression. Both surfaces change in the same commit (standing-instruction-vs-dispatched-prompt-coverage-split). The `TMPDIR=$(cd / && mktemp -d)` pin stays as-is (already present at all gate-run sites).

### Non-WAR workflow-agent path contract
Two parts, both minimal: (1) **Record** that `war-worker` main-root writes are already blocked by the scope hook's `.war-task`-ancestor requirement — no change needed for confined workers. (2) For general workflow agents, the workflow template injects the absolute worktree root into args, and the done-reporting step asserts every returned file path contains the `.claude/worktrees/<name>/` segment (or an operator-declared worktree root), failing loud otherwise. This is a workflow-authoring convention backed by one assertion, not a new hook (these agents are unconfined by design).

## 5. Surface changes (files touched)

| File | Change |
| --- | --- |
| `hooks/validate-worktree-scope.sh` | Widen `..` reject arm to `..\|../*\|*/../*\|*/..`; update header comment. |
| `hooks/validate-worktree-scope.test.sh` | Add leading-relative + bare-`..` cases (confined + all-agents); tag the tools-block `awk` extractor as the block-extraction reference. |
| `hooks/*.test.sh` (new arm or new file) | Meta-guard: fail on any frontmatter *negation* grep anchored to a bare `^key:` header without a block walk. |
| `skills/war/assets/refinery-surface.test.sh` | Enumerating comment naming the `checkout\|switch` verb equivalence class (reference verb-class pattern). |
| `hooks/`/`skills/` guard-test lint (new arm or new file) | Meta-guard: flag repo-root-anchored `find`/`grep -r` in `*.test.sh` without a `.claude` exclusion. |
| rename absence guard(s) (e.g. any `*surface*.test.sh` that greps a renamed-away token) | Exclude README `## Status` + `CHANGELOG` region, or match structural `:: <id>` token. |
| `skills/war/assets/war-config.mjs` | `validate()`: reject `**/` tokens and substring-prone `*word*` tokens in `overrides.testPattern`. |
| `skills/war/assets/war-config.test.mjs` | Validation cases: `**/` rejected; `*test_*` rejected; `*.test.ts`, `test_*.py */test_*.py` accepted. |
| `skills/war/assets/assert-test-in-diff.test.mjs`/`.test.sh` (parity arm) | Floor⊆gate parity: floor exclusion/name predicates == `resolveGate` predicates. |
| `skills/war/assets/assert-packaging-in-diff.sh` | Header: ratify A/R/C-only scope as intentional; pointer to ADR 0017 addendum. |
| `skills/war/assets/workflow-template.js` | Gate-failure classification prompt: stderr-precondition-marker → `environment`; (optional) inject worktree-root arg + done-path assertion for general workflow agents. |
| `agents/war-refiner.md` | Mirror the stderr-precondition-marker classification rule (two-surface sync). |
| `CONTEXT.md` | New terms (§6). |
| `docs/adr/0017-…` | Addendum ratifying the packaging floor's A/R/C-only scope. |
| `docs/adr/00NN-…` (new) | Guard coverage-completeness conventions (§7). |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (×2), `README.md` `## Status` | Version bump (all four slots; next free patch at land time). |

## 6. New domain terms (CONTEXT.md)

- **Traversal equivalence class** — the full set of `..`-bearing path shapes a scope guard must reject: bare `..`, leading `../*`, embedded `*/../*`, and trailing `*/..`. A guard covering a proper subset has a latent sandbox-escape hole even when downstream branches incidentally deny the rest.
- **Verb equivalence class (absence guard)** — the set of git verbs that express one forbidden behavior (e.g. `checkout` and `switch` both re-attach a branch). A git-surface absence guard enumerates the class in a comment and scans every verb; scanning one verb is false coverage the moment the surface adopts an equivalent.
- **Subtree-anchored search root** — a guard test's grep/find root resolved to the narrowest subtree from `$SCRIPT_DIR` (never the repo root), so it cannot scan stale `.claude/worktrees/**` checkouts. A repo-root scan that omits a `.claude/` exclusion is environment-dependent and a green worktree run does not prove it correct.
- **Floor⊆gate parity** — the tested (not inspected) equality between the test floor's discovery predicates (`assert-test-in-diff.sh`) and the gate's (`resolveGate`). Any asymmetry over- or under-credits test presence.
- **Precondition marker** — a specific loud stderr token (e.g. `REL_GUARD_PRECONDITION_FAILED`) a guard emits when its environment is non-isolatable. A `gate_failed` carrying one is classified `environment`, never `introduced` — the reader consults stderr markers, not just TAP stdout.

## 7. Recommended ADRs

- **00NN — Guard coverage is enumerated by equivalence class and enforced by standing meta-guards.** Records the convention behind five of these lessons: `..` traversal, git verbs, YAML negation blocks, subtree search roots, and rename prose exclusion each cover a full equivalence class, and a meta-test enforces the pattern rather than trusting review. Hard to reverse (guards proliferate), and the alternative (per-incident hand-fixing) is exactly what these recurrences prove fails.
- **ADR 0017 addendum — the packaging floor is Added/Renamed/Copied-only by design.** Ratifies that Modified/Deleted packaging artifacts are the docker-build gate's concern, not the enumerated-COPY-drift floor's; closes the "silent no-op on Modified diffs" question with a recorded decision.
- (No new ADR for floor pattern validation or floor⊆gate parity — both are mechanical enforcements of the *existing* ADR 0006 floor⊆gate invariant, not new decisions.)

## 8. Open risks / implementation notes

- **Meta-guard false positives.** The negation-grep and search-root lints scan guard scripts textually; a legitimate header-anchored *positive* grant or a `.claude`-excluded scan must not trip them. The lints target the specific antipatterns (negation without block walk; repo-root root without `.claude` exclusion) and carry an allowlist comment convention for deliberate exceptions.
- **Token-validation strictness.** Rejecting `*word*` shapes could reject a legitimately-intended substring pattern; none is known (the suggestion table has none), and the charset already forbids injection. Widen only on a concrete repo need (matches the prior spec's "widen the charset later" stance).
- **Floor⊆gate parity test coupling.** The parity test reads `resolveGate` output/source; a benign refactor of `resolveGate` that preserves semantics must not break it. Prefer asserting on `resolveGate`'s *output string* (the `find … -not -path` clause) over its source text.
- **Stderr-marker rule is prompt-layer.** The refiner is a model following prompt text; the marker rule reduces but does not eliminate a misclassified `gate_failed`. It is defense-in-depth behind the `TMPDIR` pin, not a replacement.
- **Non-WAR path assertion is a convention.** General workflow agents are unconfined by design; the done-path assertion is best-effort authoring discipline plus one check, not a hook. Confined `war-worker`s remain the mechanically-enforced case.
- Line numbers rot across the serial merge queue — the plan derived from this spec must anchor every reference by named construct (function/case-arm/CHECK label), never line number.

## 9. Non-goals / deferred

- **No shared sourced helper library for YAML/verb extraction** — one live negation site and two absence-guard consumers; a documented convention + meta-guard is the enforcement. Build a helper only when a third distinct consumer appears.
- **No per-worktree exact worker confinement** — the sibling-write residual stays ratified (ADR 0002, E1); this spec does not reopen it.
- **No change to the packaging floor's diff-collection arm** — A/R/C-only is ratified as-is; Modified-path inspection is explicitly declined.
- **No auto-derivation of the floor pattern** — closed by the prior spec (`2026-07-07-test-floor-pattern-threading`); this spec only validates the operator-declared value.
- **No new hook for non-WAR session writes** — those agents are unconfined by design; enforcement is the workflow path-contract assertion, not confinement.
- **No `..`-class widening in the floors or the advisory Bash hook** — verified adequate (`*..*` on refs; relative targets skipped advisorily).

## 10. Validation criteria

1. **`..` class closed.** `hooks/validate-worktree-scope.sh` denies (exit 2) `../etc/foo` and bare `..` for a `war-worker`, a `war-servitor`, a `war-refiner`, and a no-`agent_type` main session; still denies `/a/../b`, `/a/..`, `a/../b`; still allows a clean absolute path. New cases in `validate-worktree-scope.test.sh` are RED against the pre-change `*/../*|*/..` pattern and GREEN after.
2. **YAML negation meta-guard.** The new meta-test FAILS against a synthetic guard that greps a bare `^tools:` header for a forbidden token, and PASSES against the current `validate-worktree-scope.test.sh` (block walk) and `validate-servitor-provenance.sh` (`extract_provenance`). Deleting the block-walk from the tools-block extractor makes the servitor-Bash negation case pass a block-style `- Bash` (delete-the-feature check).
3. **Verb-class comment present.** `refinery-surface.test.sh` scans both `checkout origin/` and `switch origin/` and carries the enumerating verb-class comment; grep-checkable.
4. **Search-root lint.** The lint FAILS against a synthetic `*.test.sh` doing `grep -rn <token> "$ROOT"` (repo-root, no `.claude` exclusion) and PASSES against `provision-worktrees.test.sh` (`SKILLS_ROOT`), `refinery-surface.test.sh` (named files), and any `.claude`-excluded scan. A run of the real guard suite inside a `.war-task` worktree and in the main checkout yields the same verdict.
5. **Rename-blurb guard.** Adding a README `## Status` / changelog line that names a renamed-away token does NOT turn the rename absence guard RED; a real reintroduction of the token in a code/structural position still does.
6. **Floor-pattern token validation.** `war-config.mjs validate()` rejects `overrides.testPattern` values `"**/*.test.ts"`, `"*test_*.py"`, and `""`; accepts `null`, `"*.test.ts *.test.tsx"`, and `"test_*.py */test_*.py"`. Config test covers each.
7. **Floor⊆gate parity.** The parity test asserts `assert-test-in-diff.sh`'s `*.test.sh` exclusion set equals `resolveGate`'s (`node_modules`, `.git`, `.claude`) and the node glob equals `skills/**/*.test.mjs`; mutating either side (e.g. dropping `.claude` from the floor) turns it RED.
8. **Packaging floor scope ratified.** `assert-packaging-in-diff.sh`'s header explicitly states A/R/C-only is intentional and points to the ADR 0017 addendum; the ADR addendum exists. A purely-Modified fixture diff exits 0 (unchanged), now documented as intended.
9. **Hermetic-gate reader contract.** Both `workflow-template.js`'s gate-failure classification prompt and `agents/war-refiner.md` instruct classifying a `gate_failed` bearing a stderr precondition marker as `environment` (never `introduced`) and carrying it uncurated in `gate_output`; grep-checkable on both surfaces.
10. **Non-WAR path contract.** A `war-worker` write to an absolute path under the main repo root (no `.war-task` ancestor) is denied by the scope hook (regression-guarded, already true). Where the workflow template injects a worktree root, its done-reporting asserts each returned path contains the `.claude/worktrees/<name>/` segment and fails loud otherwise (fixture check).
11. **Meta-repo suites green.** `node --test 'skills/**/*.test.mjs'` and every `hooks/**` + `skills/**` `*.test.sh` pass byte-unchanged for all pre-existing cases; the redaction lint (`war-memory.mjs lint docs/learnings/`) passes.
