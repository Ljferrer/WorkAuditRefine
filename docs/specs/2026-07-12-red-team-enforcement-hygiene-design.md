# Red-team enforcement hygiene — mechanize the env-gap→warn guarantee, fix the scaffold's "discarded" contract prose, and align assert-no-repo-escape's die() default with its exit contract

Issues addressed: #807, #808, #812

## 1. Context — the gap / problem

Three /red-team probe-integrity guarantees are weaker in code than in prose:

1. **#807 (major)** — the executed-probe rule that a failing provision step is an env-gap →
   `status:"warn"` + a note, never a Critical/Major red verdict, exists only as prompt text: the
   `provisionDirective` string in `skills/red-team/assets/workflow-scaffold.js` and the "Provision
   step (executed probes)" bullet in `skills/red-team/references/lenses.md`. The scaffold runs no
   shell and the gate has no demotion keyed on env-gaps, so a disobedient or confused probe agent
   can mis-score a broken environment as a broken plan, injecting false blockers. The deterministic
   enforcement deferred in phase B3 was never built. Worse, the **obedient** path has a live trap:
   the directive says "add a finding noting the env-gap" but never says to grade it — in
   `classify()` (`skills/red-team/assets/red-team-gate.mjs`) a severity-less finding on a non-pass
   probe is force-promoted to `needsDecision:true`, which **always blocks**; a Critical/Major-graded
   note on a `warn` probe blocks too (`probeStatus !== 'pass'`). So even a fully obedient agent's
   env-gap note can produce a false BLOCKED.
2. **#808 (minor)** — the CONTRACTS header comment in `workflow-scaffold.js` says a pass-probe
   Critical/Major is "discarded as a non-defect," but `classify()` only excludes it from the
   `blockers` bucket; the finding stays in `allFindings()` output and threads to downstream
   diagnostics. "Discarded" misleads future workers into expecting it to vanish from the data model.
3. **#812 (minor)** — `assert-no-repo-escape.sh` has a three-code exit contract (0 clean, 1 escape,
   2 git/infra error, never collapsed), but its `die()` helper defaults to `exit "${2:-1}"` — the
   escape code. Every current call site passes 2 explicitly, so behavior is correct today, but a
   future `die "msg"` that omits the code silently reports an infra failure as an escape, and the
   omission looks well-formed in diff review.

## 2. Pivotal constraints

- **The gate stays pure.** `classify()` does no NLP on `reality`/`evidence` strings; any new
  demotion must key on a **typed flag only** (the ratified `deliverableAbsence` precedent, ADR 0032).
- **The scaffold runs no shell.** It assembles prompts; adding a provision-command runner would
  change its safety posture and resurrect the explicitly-deferred B3 harness. Also, the scaffold is
  **copied to a scratch path and edited per run** (bespoke probes), so enforcement placed in the
  scaffold copy is structurally weaker than enforcement in the separately-invoked gate.
- **The ff-topology lens is provision-exempt** (`lenses.md` catalog row): an executed probe may
  legitimately carry a provision failure *and* a genuine Major finding that must still block. Any
  probe-level "provision failed ⇒ demote everything" rule is therefore wrong by construction.
- **Both-surfaces rule:** the dispatched `provisionDirective` string and the standing `lenses.md`
  "Provision step (executed probes)" bullet drift silently unless changed in the same commit
  (existing presence-pair test pattern in `workflow-scaffold.test.mjs` is the lock vehicle).
- **Floor exit-code discipline** (CLAUDE.md): guard scripts' code 2 = infra error and must never
  collapse into the detection code. `die()`'s default must default to the conservative code.
- **Fail-open direction:** an env-gap demotion may only ever *reduce* blocking (false blocker →
  Minor note); it must never drop a finding or clear `needsDecision` (user-owned ambiguity flag).

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| #807: build deterministic enforcement vs ratify-as-prompt-directive | **Build.** Ratification is untenable: the obedient path itself misfires (severity-less env-gap note → forced `needsDecision` → BLOCKED). A typed-flag gate demotion closes both the disobedient and the obedient hole with a ~3-line pure-gate change. |
| Enforcement point: scaffold-side provision runner vs gate-side demotion | **Gate-side** (`classify()` in `red-team-gate.mjs`). Scaffold-side runner rejected: breaks the runs-no-shell posture, and per-run scaffold copies weaken any scaffold-resident guarantee. The B3 deterministic runner stays deferred (§9). |
| Evidence key: finding-level typed flag vs probe-level provision-exit ledger | **Finding-level `envGap: true`** flag, exact `deliverableAbsence` pattern. Probe-level ledger rejected: the provision-exempt ff-topology lens can carry a provision failure plus a genuine blocker, so probe-scoped demotion would suppress real defects. |
| Demotion semantics | `envGap === true` ⇒ `{ ...f, severity: 'Minor' }`, checked **before** the `KNOWN_SEVERITIES` branch (so a severity-less note never reaches the `needsDecision` force-promotion) and adjacent to the `deliverableAbsence` check. `needsDecision` is deliberately **not** cleared (parity with deliverableAbsence; an explicit ambiguity stays user-owned). The finding surfaces as a Minor note — never dropped. |
| #808 fix shape | Comment-only reword of the CONTRACTS "Gate side" bullet: "discarded as a non-defect" → "filtered from `blockers` (it remains in `allFindings()` and downstream diagnostics)". No mechanics change. |
| #812 fix shape | One-character contract alignment: `die()` default `${2:-1}` → `${2:-2}`, plus a helper-adjacent comment naming the rule (default = conservative infra code, never the detection code) and a test locking the default. `escape()` keeps its hardcoded `exit 1` — it *is* the detection path. |
| Tracking lesson | `docs/learnings/red-team-env-gap-warn-is-agent-directive-not-code-enforced.md` is rewritten in the same change: the "don't harden in passing / there is no enforcement point" guidance is superseded by the typed-flag gate demotion; record the residual (the agent must still *set* the flag — same trust boundary as `deliverableAbsence`, fingerprint, scope-lock). |

## 4. Mechanics

### 4.1 `envGap` typed flag — schema + prompt surfaces (#807)

- **`FINDINGS` schema** (`workflow-scaffold.js`): add `envGap: { type: 'boolean' }` to the finding
  item properties, beside `deliverableAbsence`, with a comment scoping it: set true ONLY on the
  finding that records a provision-step failure (the failed command + its output) — never on a
  defect in the artifact under test.
- **`provisionDirective`** (same file): extend the failure sentence so the agent is told to stamp
  the env-gap note finding with `envGap: true` (and keep the existing warn-status + do-not-run-
  baseline instructions verbatim).
- **`lenses.md` "Provision step (executed probes)" bullet**: mirror the same clause in the same
  commit (both-surfaces rule).
- Token sweep (grep is a floor, not a ceiling): `grep -rn 'env-gap\|never a red/fail' skills/red-team/`
  and handle every match — each statement of the env-gap rule must now name the typed flag and the
  gate demotion, not the prompt-only model. **Mandatory manual same-scope survey:** after the grep,
  hand-scan `workflow-scaffold.js`'s full header comments and inline prose, the `lenses.md` gate-side
  contract section, and `red-team-gate.mjs` comments for unmatched restatements of the prompt-only
  enforcement model (paraphrases the tokens miss), and list each straggler as a survey-derived
  correction.

### 4.2 Gate demotion (#807)

In `classify()` (`red-team-gate.mjs`), immediately adjacent to the `deliverableAbsence` demotion and
**before** the `KNOWN_SEVERITIES` check:

- `f.envGap === true` ⇒ return `{ ...f, severity: 'Minor' }`.

Consequences, all inherited from the existing bucket logic with no further change: the finding can
never enter `blockers`, never hits the malformed-severity `needsDecision` force-promotion, and
surfaces in `minors` (visible in the Lead's grill loop and the report). `allFindings()` is
untouched — the flag rides the finding object it already spreads.

### 4.3 CONTRACTS comment reword (#808)

Reword the "Gate side" bullet of the CONTRACTS header comment in `workflow-scaffold.js`: a pass
probe's Critical/Major is **filtered from `blockers`** (it remains in `allFindings()` and threads to
downstream diagnostics), not "discarded as a non-defect."

- Token sweep (grep is a floor, not a ceiling): `grep -rn 'discard' skills/red-team/assets/ skills/red-team/references/`
  and adjudicate every match — reword only claims that overstate a blockers-filter as a data-model
  drop (the `red-team-gate.mjs` "Off-target findings are discarded before classify" comment
  describes a real pre-classify drop and stands). **Mandatory manual same-scope survey:** after the
  grep, hand-scan the gate-side contract prose in `lenses.md` (the Critical-severity bullet and the
  two-contract summary block) and the `classify()`/`verdict()` comments in `red-team-gate.mjs` for
  synonym phrasings ("dropped", "vanishes", "removed") the token misses; list each straggler as a
  survey-derived correction. (Pre-verified during spec authoring: both `lenses.md` passages say
  "does not block"/"non-blocker" and are accurate — record them as checked, not changed.)

### 4.4 `die()` default alignment (#812)

In `assert-no-repo-escape.sh`:

- Change the `die()` helper's default exit substitution from `${2:-1}` to `${2:-2}` and add a
  helper-adjacent comment: default = the conservative infra code (2) per the header exit contract;
  the escape code (1) is only ever emitted by `escape()`.
- Token sweep (grep is a floor, not a ceiling): `grep -n 'die ' skills/red-team/assets/assert-no-repo-escape.sh`
  and confirm every call site still passes its intended explicit code (all pass 2 today; none may
  silently rely on the new default for an escape signal). **Mandatory manual same-scope survey:**
  after the grep, hand-scan the script's header exit-contract comment block, the `escape()` helper,
  and the existing cases in `assert-no-repo-escape.test.sh` for stale statements of the old default
  or exit-code expectations; list each straggler as a survey-derived correction.
- Add a test case to `assert-no-repo-escape.test.sh` locking the default: a source-level assertion
  that the `die()` line carries `${2:-2}` (behavioral exercise is impossible today precisely because
  no call site omits the code — the lock prevents regression of the default itself).

### 4.5 Tracking-lesson update (#807)

Rewrite `docs/learnings/red-team-env-gap-warn-is-agent-directive-not-code-enforced.md`: the rule is
now enforced by the `envGap` typed flag + `classify()` demotion; the "don't audit for an enforcement
point / don't harden in passing" guidance is superseded. Keep the file (inbound `relates:` links),
record the residual trust boundary (flag-setting is agent-side, like `deliverableAbsence`), and note
the B3 deterministic provision runner remains deferred.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/red-team/assets/workflow-scaffold.js` | `FINDINGS` schema `envGap` property; `provisionDirective` clause; CONTRACTS "Gate side" bullet reword |
| `skills/red-team/assets/red-team-gate.mjs` | `classify()` envGap demotion branch (adjacent to `deliverableAbsence`) |
| `skills/red-team/assets/red-team-gate.test.mjs` | envGap demotion cases mirroring the D3 `deliverableAbsence` suite |
| `skills/red-team/assets/workflow-scaffold.test.mjs` | presence-pair lock: `envGap` in schema + directive + `lenses.md` bullet; updated CONTRACTS wording anchor if one exists |
| `skills/red-team/references/lenses.md` | "Provision step (executed probes)" bullet gains the `envGap` flag clause |
| `skills/red-team/assets/assert-no-repo-escape.sh` | `die()` default `${2:-2}` + helper-adjacent comment |
| `skills/red-team/assets/assert-no-repo-escape.test.sh` | default-exit lock case |
| `docs/learnings/red-team-env-gap-warn-is-agent-directive-not-code-enforced.md` | rewritten as resolved-by-typed-flag with residual note |

## 6. New domain terms (CONTEXT.md)

- **env-gap finding** — a probe finding flagged `envGap: true`, recording a provision-step failure;
  mechanically demoted to a Minor note by the red-team gate, never a blocker. (Only if CONTEXT.md
  already carries red-team gate vocabulary; otherwise no entry.)

## 7. Recommended ADRs

None. The typed-flag demotion extends the existing ADR 0032 (`deliverableAbsence`) pattern rather
than establishing a new decision; #812 applies the already-binding floor exit-code discipline.

## 8. Open risks / implementation notes

- **Flag misuse:** a probe could stamp `envGap: true` on a genuine defect to smuggle it out of
  `blockers`. Bounded: the directive scopes the flag to provision-step failures only, the demoted
  finding stays visible as a Minor in the grill loop, and the risk profile is identical to the
  ratified `deliverableAbsence` flag. Do not add gate-side heuristics to police it (purity
  constraint).
- **Flag omission:** a confused agent may file a Critical without the flag — the pre-existing
  residual, now narrowed to agents that disobey both the warn instruction *and* the flag
  instruction. Record in the lesson, not in code.
- The `classify()` branch ordering is load-bearing: the envGap check must precede the
  `KNOWN_SEVERITIES` branch or the severity-less obedient-path trap survives. Anchor the test on
  this (a finding with `envGap: true` and **no** `severity` on a `fail`-status probe must land in
  `minors`, not `needsDecision`).
- The CONTRACTS comment lives in a file that Leads copy per run; old copies under scratch paths will
  retain stale wording — out of scope, they are throwaway.

## 9. Non-goals / deferred

- **Scaffold-side deterministic provision runner** (run the pinned commands, mechanically emit
  `warn` on non-zero exit): stays deferred. It would end the scaffold's runs-no-shell posture and
  duplicates what the gate demotion now guarantees at verdict time.
- No change to `escape()` or to the guard's detection logic; no widening of blocker semantics for
  any non-`envGap` finding; no `classify()` behavior change for existing flags.
- Worker/servitor hook-layer confinement residuals (#809, #810) are a different guard surface —
  separate spec.
- No retro-edit of per-run scaffold copies under scratch/worktree paths.

## 10. Validation criteria

1. `node --test skills/red-team/assets/red-team-gate.test.mjs` passes, including new cases: (a) a
   Critical `envGap: true` finding is absent from `blockers` regardless of probe status; (b) it
   surfaces in `minors` (never silently dropped); (c) a severity-less `envGap: true` finding on a
   non-pass probe lands in `minors`, not `needsDecision`; (d) control — the same finding without the
   flag blocks exactly as before (mirror of the existing D3 no-flag control).
2. `node --test skills/red-team/assets/workflow-scaffold.test.mjs` passes, with the presence-pair
   lock proving `envGap` appears in the `FINDINGS` schema, the `provisionDirective` failure clause,
   and the `lenses.md` provision bullet.
3. `grep -c 'discarded as a non-defect' skills/red-team/assets/workflow-scaffold.js` returns 0; the
   replacement "filtered from `blockers`" wording is present in the CONTRACTS comment.
4. `bash skills/red-team/assets/assert-no-repo-escape.test.sh` passes, including the new lock that
   `die()`'s default substitution is `${2:-2}`; the full suite still proves the 0/1/2 contract
   (escape cases exit 1, infra cases exit 2, clean exits 0).
5. Every call site found by the §4.4 `die` sweep passes an explicit exit code; the sweep's manual
   same-scope survey stragglers (if any) are listed in the implementing PR as survey-derived
   corrections — likewise for the §4.1 and §4.3 sweeps.
6. The tracking lesson no longer instructs "don't audit for an enforcement point"; it names
   `classify()` as the enforcement point and records the flag-omission residual.
