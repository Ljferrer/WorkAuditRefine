---
name: weak-test-assertion-passes-without-feature-being-exercised
description: "Delete feature mentally; assert must fail w/o it"
metadata:
  node_type: memory
  type: project
  keywords: [vacuous test, false green, contains substring match, shared exit code, delete and trace, dead regex branch, negative match on undefined, temp-break RED proof, aggregate threshold count, inflated count, padding intro line, single-item removal slack, qualifier lock, anchor-derived region, region includes anchor substring, self-satisfying token, sliced-from-anchor window, hardcoded empty field, inert tiebreak, coincidental fixture ordering, localeCompare no-op, N-of-M emission sites, multi-site coverage gap, count assertion, source-level count, pkg 819 idiom, one-of-three seat coverage, emission site RED-ability, presence-only filename regex, run vs skip discrimination, floor-retry prompt pin, pkg 4.2 retry-merge, tautological length assertion, match length always groupcount plus one, capture group count, non-global match, extraction-equality test, D6 arms length, closed-set header sentence, ordered chain anchor, rung-body coverage gap, five-surface registry row, authority ladder, predicate wiring gap, shared inner predicate, flag-delta vs composition, caller-side substitution, byte-triplicated existence guard, guard bound by one call path only, _hit vs _hit_i, lacks_i wiring unasserted, delete-the-feature mutation, String.replace doesNotMatch, tautological mutation test, self-referential strip-and-assert, both-surfaces D20 idiom, non-vacuity proof, self-referential probe constant, anchoredProbe, construct-then-parse round trip, PLUGIN_ROOT_PREFIX typo, CHANGELOG ordering test, fixture-driven negative control, cmpSemver, only-tests-the-live-file, version-slots.test.mjs, self-citing fixture, non-goal skip arm, incidental substring citation, first sub-case does not discriminate, flattened whole-surface positive detector, pre-existing phrase satisfies key, old-default-absent, DISPOSITION WIDENINGS, unanchored substring key, wrapper message token, input sentinel echo, baseline red check, prune flag full string, bare substring assert]
  provenance: code-verified
  slug: weak-test-assertion-passes-without-feature-being-exercised
  phase: "audit-scheduler-integrity/t4 (latest 2026-09-03-in-band-absorb-default/phase-4 task 4.1 — gateAuditRows engine-stamp precedence untested)"
  date: 2026-07-21
  tags:
    - testing
    - assertion-strength
    - threading
    - workflow-template
    - guard-test
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
  modified: 2026-09-04T15:25:03.491Z
---

# Weak assertions pass without the feature being exercised

**Rule.** Before you trust a green test, mentally delete the guard or feature and trace each assertion.
If every assertion still passes, the test proves "no crash," not "feature works."
This lesson collects about 25 shapes seen across 20+ phases.
Test headers in many files cite this slug, so keep it.

## Shapes and fixes

**Substring and region traps**
- **Contains-assertion on base text.** The asserted text is already in the base string. Assert a token unique to the threaded value.
- **Substring of the old form.** After a reword, a positive `includes` on a substring of the removed form is vacuous. Pair it with an absence assert on the old superset form.
- **Anchor-derived region.** A region sliced from `indexOf(ANCHOR)` always contains the anchor, so a token that is a substring of the anchor cannot fail. Unrelated prose in the region can also satisfy a token. Scope tokens to the trigger sentence, or assert an anchored multi-word phrase.
- **Flattened whole-surface key.** A flattened "new sentence present" scan can match an older, unrelated sentence with the same key phrase. Grep the pre-diff base for the key; if it already matches, anchor to the new sentence's own clause.
- **Presence-only filename pin.** A bare filename regex passes whether the prompt says "run X" or "skip X". Match the run arm's wording.
- **Bare-substring prune assert.** Match the full emitted flag string (for example `-not -path '*/.git/*'`), not a bare `.git`.
- **Token already in the wrapper message.** Match only tokens the new output produces, never tokens the generic error text or the input echoes back. Run the assert against the baseline output first.

**Exit-code and control-flow traps**
- **Shared exit code.** The guard and a fallback path (for example an empty diff) both exit 1. Build a fixture where only the guard gives that exit.
- **Multi-step guard.** A case that step N satisfies masks every later step. Add a case only the target step can satisfy.
- **Wrong loop-exit path.** A test named for one guard can exit through another branch. Trace it end to end.
- **Dead regex alternate.** A branch that embeds a literal `${...}` never matches rendered output. Drop it, or test the template before render.
- **Negative match on a missing key.** `/x/.test(undefined)` is false. Assert presence first.

**Count and coverage traps**
- **Aggregate count with a padding line.** "Each of N items has P" written as `count >= N` stays green when an intro line also carries P and one item loses it. Check P inside each item's own anchored span (the `qualifierPerRuleWindows` fix in the workflow-template topic test files).
- **N-of-M emission sites.** A construct added at N call sites, with a test at one site, leaves N-1 sites unowned. Add a source-level `count === N` assert over the template source (the `pkg #819` idiom).
- **Closed-set header sentence.** An ordered chain anchor over a set's names is satisfied by the header that lists them, so deleting one member's whole body stays green. Give every member a body-content assert.
- **Tautological `match.length`.** A non-global `match` always has length 1 + group count. Count the source's own delimiters instead.
- **Shared inner predicate.** A control that proves an inner predicate's flag matters does not prove which predicate each outer helper calls (`_hit` vs `_hit_i` in `war-pipeline-structure.test.sh`). Route a fixture through the outer helper. A guard block copied into N helpers is bound only where a control runs it.

**Fixture traps**
- **Hardcoded-empty fixture field.** A shared fixture helper that sets one sort key to `''` makes that tiebreak inert, so an order-equivalence assert passes by coincidence. Give each row a distinct value, or add a fixture only the tiebreak can pass.
- **Spread order with no contested keys.** An engine-wins spread such as `{ ...seatRow, task, seat, lens, sha }` (`routeGateAuditRows`) is untested when the fixture builder (`gaAbsorb()`) never sets those keys. Add a fixture with spoofed keys and assert the engine values win. See [[auditor-supplied-provenance-keys-trusted-verbatim-in-followup-collapse-and-ask-parking]].
- **Self-citing first sub-case.** A skip-arm fixture whose own prose contains the pin it tests passes through the fallback. Only a sub-case without that substring discriminates.
- **Positive-only check on the live file.** An ordering test that reads only the live, already-correct `CHANGELOG.md` never proves the loop catches a violation. Add an in-memory fixture that must fail.
- **Table setup runs at build time.** Setup calls inside a `runs` array literal all run before the first case, so two writes to one path leave only the last. Give each payload its own path. See [[setup-calls-inside-a-test-runs-array-literal-all-run-before-the-first-case]].

**Self-satisfying mutation proofs**
- **`text.replace(re, 'X')` then `doesNotMatch(re)`.** A global replace removes every match by construction, so the assert holds for any input. The mutation step must be independent of the assertion.
- **Construct-then-parse round trip.** A probe built from `PLUGIN_ROOT_PREFIX` and then stripped of it (`anchoredProbe` in `reference-link-integrity.test.mjs`) cannot catch a typo in the constant. Spell the expected literal on its own.

## Why / How to apply

**Why.** Green no-op tests survive feature deletion and rot silently.
**How to apply.** Run delete-and-trace on every new guard or threading assertion.
Pair positives with negatives, and negatives with presence guards.
For each assert, ask what input could make it fail; if none exists, it is not a test.
Stale audit prose can describe a pre-fix draft, so re-read the file at HEAD first ([[audit-log-finding-can-be-stale-by-land-time]]).

Related: [[gitmodules-working-tree-read-vs-ref-snapshot]], [[land-local-follower-ref-can-lag-sync-before-next-phase]], [[gate-audit-pin-bracket-test-blocked-by-git-guard]], [[shared-string-constant-quote-literal-byte-anchor-fragility]], [[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]], [[process-recipe-lesson-body-is-not-drift-guarded-by-any-test]], [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]].
