# Lead adjudication — 2026-09-09

Finding: `isolation-package-evidence-failure-paths#1` (initial Major; independently reproduced).

Classification: explicitness gap in a required identity outcome, with a reproduced baseline mechanism. The plan already forbids off-target success and grants broad runtime latitude; the finding does not establish that every conforming implementation would be defective. The minimal correction makes that existing outcome concrete and testable. No new product decision or migration implementation is introduced.

Superseded wording: End state 3 required distinguishable input identities; Task 1 required recording original bytes/hash and revision or dirty snapshot identity, without naming per-result validation and separate mismatch controls.

Final rule: each probe and confirmer attests the opened plan content hash and repository snapshot identity; acceptance validates these against the run fingerprint. A matching path/title cannot rescue a stale hash, stale snapshot identity, or absent identity. Tests reject each mismatch independently and accept the exact-identity control. Adapter validation may wrap the shared gate, preserving the existing small-adapter/shared-consumer guardrail.

Patch: [plan.patch](plan.patch). Provenance: **AI-declared**, under the operator's instruction to resolve routine mechanics within granted latitude. No operator ratification is claimed. No question was needed: rejecting a different input is already required, and the validation location remains an implementation choice.

Evidence: the original probe and independent confirmation reproduce the stale baseline identity behavior with exact-identity and wrong-title controls. This is an analyzed plan finding (its read-only reproduction invokes the baseline gate); the patch changes future plan requirements, not the baseline gate or proof mechanism. No fresh independent review of the patched plan was run. Therefore the row remains present with `adjudicated:true`; it is not removed or reported as re-proven clean.

Consequence sweep: checked the Context's baseline limitation, PIN-8/PIN-11/PIN-14, Binding guardrails, End states 2–3, Task 1 isolation/evidence/vacuity clauses, Task 2 package and diagnostic duties, Task 3 record preservation, B1 frozen-input requirements and authoring delivery. The baseline description remains historically true. End state 3 and the owning Task 1 now state the exact rule; other references remain consistent and do not need duplicate wording. Original input remains retained at the starting commit and in initial-run/original-plan.md. Planned tests remain owned by Task 1; none of the absent migration files were created here.

Validation: full plan diff read; `git diff --check`; preserved initial file hashes checked against their manifest; final gate recomputed with all original expected/fingerprint/diagnostic markers intact, rounds=1, roundLimit=3. Final verdict: **INCOMPLETE**. No stamp closes the unusable probe or linked-source gaps.
