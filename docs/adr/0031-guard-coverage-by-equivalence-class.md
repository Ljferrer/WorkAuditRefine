# Guard coverage is enumerated by equivalence class and enforced by standing meta-guards

**Status:** accepted (design ratified 2026-07-08; implemented by the spec and plan below)

WAR's confinement guards, merge floors, and guard tests keep shipping a **hand-fixed instance whose
equivalence class recurs on the next verb, key, root, or path shape**. The failure is uniform: a guard
covers the one shape that bit us and passes green while the sibling shapes it never enumerated slip
through, until a later incident on an equivalent form re-opens the same hole. Recorded recurrences are
one class through many lenses — `validate-worktree-scope.sh`'s `..`-reject matched only the embedded and
trailing shapes (`*/../*|*/..`) and missed bare `..` and leading `../*`
([[dotdot-pattern-misses-leading-relative-traversal]]); a git-surface absence guard scanned `checkout`
but not the equivalent `switch` ([[absence-guard-verb-specific-coverage-gap]]); a frontmatter *negation*
check grepped a bare `^tools:` header and would pass a block-style `- Bash` grant that a full block walk
catches ([[frontmatter-tools-negation-check-single-line-only]]); a guard test's `grep -r` rooted at the
repo root swept stale `.claude/worktrees/**` checkouts instead of the narrow subtree
([[absence-guard-search-root-must-anchor-to-subtree]]); and a rename absence guard re-tripped on a
release blurb that merely *described* the renamed-away token
([[release-blurb-describing-a-rename-trips-the-renames-own-absence-guard]]). Each was hand-fixed at the
instance; the class kept recurring. Full mechanics:
[the design spec](../specs/2026-07-08-guard-floor-and-scope-hook-coverage-completeness-design.md) and
[the plan](../plans/2026-07-08-guard-floor-and-scope-hook-coverage-completeness.md).

## Decision

**A guard covers a full equivalence class, not the one instance that bit us, and a standing meta-guard
enforces the authoring convention rather than trusting review.** Five conventions are ratified, each the
class-level form of a recorded per-instance fix:

1. **Traversal equivalence class.** A path-scope guard that rejects `..` traversal rejects the full
   four-shape class — bare `..`, leading `../*`, embedded `*/../*`, trailing `*/..` — and the reject arm
   stays pre-`case` in `validate-worktree-scope.sh` so it binds every agent type (ADR 0002 D5), not a
   per-agent branch. A guard covering a proper subset has a latent sandbox-escape hole even when a
   downstream branch incidentally denies the rest.
2. **Verb equivalence class (absence guard).** A git-surface absence guard enumerates the full verb
   class in a comment (`checkout | switch` today — both re-attach a branch) and scans *every* verb; a new
   equivalent verb is added to both the comment and the scan. Scanning one verb is false coverage the
   moment the surface adopts an equivalent. `refinery-surface.test.sh`'s ABSENCE CHECK 2 (`checkout
   origin/`) + ABSENCE CHECK 3 (`switch origin/`) is the standing reference pattern.
3. **YAML negation blocks.** A frontmatter *negation* check (asserting a forbidden token is absent from a
   capability block) extracts the full fenced block via a block walk, never a bare `^key:` header grep —
   the block-extraction reference implementation in `validate-worktree-scope.test.sh` and
   `validate-servitor-provenance.sh`'s `extract_provenance` are the anchors. A positive capability grant
   stays exempt: a line-scoped miss there fails safe, so the convention targets negation only.
4. **Subtree-anchored search roots.** A guard test's `find`/`grep -r` root resolves to the narrowest
   subtree from `$SCRIPT_DIR` (never the repo root), or excludes `.claude/`, so it cannot scan stale
   `.claude/worktrees/**` checkouts. A repo-root scan without a `.claude` exclusion is
   environment-dependent — a green worktree run does not prove it correct.
5. **Rename prose exclusion.** A rename absence guard scopes its scan to the structural token form
   (`:: <skill-id>`) or strips the README `## Status` / changelog prose region before grepping, so a
   release blurb *describing* a renamed-away token can never re-trip it while a real structural
   reintroduction still fails.

**The meta-guards are the deliberate ceiling.** Two of the five conventions — negation-block extraction
and subtree-anchored search roots — are enforced by a new `hooks/guard-conventions.test.sh` that scans
`hooks/` and `skills/` guard scripts and fails on the antipattern, proven with synthetic RED fixtures
and PASS references. A deliberate exception carries an inline `# guard-conventions: allow <reason>` tag,
and the lint prints suppressed hits for the record (a tag could be abused — that residual is a declared
**backstop** reviewed by `/red-team`, not a silent hole). The other three conventions are enforced by
their own class-covering tests (the traversal-class cases, the verb-class scan, the rename-prose
fixture) plus this doctrine. This is the ratified alternative to trusting human review to remember the
class each time a guard is edited: per-incident hand-fixing is exactly what the recurrence record proves
fails.

## Relationship to prior ADRs

- **Extends [ADR 0002](0002-scope-by-agent-type.md)** — the traversal-class widening stays in the
  pre-`case`, agent-type-agnostic region D5 established, so it binds worker, servitor, refiner, and a
  no-`agent_type` session alike; it adds no new agent branch.
- **Operates within [ADR 0006](0006-deterministic-test-floor.md)** — the meta-guards and class-covering
  tests are deterministic shell/JS gate members (the coarse-floor idiom), not advisory findings.
- **Operates within [ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md)** — every new
  check lives in the gate; the two residual human-judgment gaps (allowlist-tag abuse, guard-suite
  hermeticity across environments) are declared **backstops** with named runners, never waived in prose.
- **Sibling of [ADR 0025](0025-drift-guard-discipline.md)** — 0025 binds a *duplicated fact* to its
  canonical source; 0031 binds a *guard* to its full equivalence class. Both replace hope-by-convention
  with a standing test; neither edits the other's registries.

## Considered options

- **One ADR versus five per-convention records (chosen: one).** The five conventions are one policy —
  cover the class, enforce the convention with a meta-guard — seen through five surfaces; recording it
  once keeps the "why the class, why a meta-guard, why per-incident fixing fails" rationale in one place.
- **A generic guard-linter that infers every equivalence class (rejected).** Auto-discovering the class
  of every guard is a research project whose failure mode is a false sense of coverage. The two textual
  meta-guards plus three class-covering tests plus this doctrine are the ceiling; widen only on
  recurrence.
- **A shared verb-list / helper library (rejected — one consumer).** One live negation site and two
  absence-guard consumers do not justify a shared module; the convention plus the enumerating comment is
  the enforcement. A helper waits for a third distinct consumer.
- **Leaving the packaging floor's Modified/Deleted no-op silent (rejected).** Ratified instead as an
  ADR 0017 addendum — a recorded decision that Added/Renamed/Copied-only is intended, not an unrecorded
  gap.

## Consequences

- `validate-worktree-scope.sh`'s `..`-reject covers the four-shape class pre-`case`; the guard test adds
  leading-relative and bare cases for a confined role and the all-agents path, RED against the old
  pattern.
- A new `hooks/guard-conventions.test.sh` enforces the negation-block and search-root conventions with
  synthetic RED fixtures and an allowlist-tag escape hatch that prints suppressed hits.
- `refinery-surface.test.sh` carries the enumerating verb-class maintenance comment atop its git-surface
  absence block; the two scans are byte-unchanged.
- `war-pipeline-structure.test.sh`'s rename absence guard excludes the README-Status/changelog prose
  region; `assert-test-in-diff.test.sh` gains a floor⊆gate parity arm (ADR 0006, tested not trusted).
- `CONTEXT.md` gains a `### Guard coverage by equivalence class (ADR 0031)` subsection defining five
  terms — **Traversal equivalence class**, **Verb equivalence class (absence guard)**,
  **Subtree-anchored search root**, **Floor⊆gate parity**, **Precondition marker**.
- Named residuals (declared backstops): allowlist-tag discipline and guard-suite hermeticity across
  environments are human-reviewed by `/red-team`, not mechanically proven.

## References

- Design spec:
  [`docs/specs/2026-07-08-guard-floor-and-scope-hook-coverage-completeness-design.md`](../specs/2026-07-08-guard-floor-and-scope-hook-coverage-completeness-design.md)
  — the recorded recurrences, the resolved design tree, the mechanics, and the validation criteria.
- Implementation plan:
  [`docs/plans/2026-07-08-guard-floor-and-scope-hook-coverage-completeness.md`](../plans/2026-07-08-guard-floor-and-scope-hook-coverage-completeness.md).
- [ADR 0002](0002-scope-by-agent-type.md) — the agent-type-agnostic pre-`case` region the traversal
  widening lives in.
- [ADR 0006](0006-deterministic-test-floor.md) — the coarse-floor / tested-shell-guard idiom the
  meta-guards and the parity test follow.
- [ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md) — validation must live in
  gate/floor/backstops or escalate; the packaging-floor scope addendum lands there.
- [ADR 0025](0025-drift-guard-discipline.md) — the sibling discipline binding a duplicated fact to its
  canonical source.
- Memory lessons (the originating recurrence cluster):
  [[dotdot-pattern-misses-leading-relative-traversal]], [[absence-guard-verb-specific-coverage-gap]],
  [[frontmatter-tools-negation-check-single-line-only]], [[absence-guard-search-root-must-anchor-to-subtree]],
  [[release-blurb-describing-a-rename-trips-the-renames-own-absence-guard]],
  [[floor-script-discovery-set-must-mirror-gate-exclusions]].
