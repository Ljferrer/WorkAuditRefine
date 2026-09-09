# Lead repair and adjudication

Read after findings are returned and before the first authorized patch. This is Lead guidance, not an auditor role. Honor a frozen-input or review-only instruction; preserve initial evidence before any changes. Probes and confirmers have no repair authority.

Before editing, classify each finding as a factual error, genuine operator decision, environment gap, or proposed scope expansion. Inspect the full source evidence including later operator comments. Resolve routine mechanical corrections within existing authorization. For a genuine unresolved decision, ask one concrete question explaining the failure, practical consequence, and recommended resolution. A technically valid finding does not automatically warrant a questionnaire. Do not add tasks or design decisions outside scope without an operator ruling.

Establish the failure class and falsifier. Inspect sibling consumers, fallback/error branches, mirrors, and newly reachable states. Preserve intentionally different siblings supported by their contracts. Record the original symptom, hypotheses, primary evidence, rejected explanations, patch, sibling/control cases, tests and residuals. A new guard needs a failing counterexample independent of the patch plus a valid control; run the failure case before accepting the fix. If evidence is unavailable, keep the diagnosis labeled as a hypothesis.

## Keep obligations coherent

Patch the final rule directly; put history and operator provenance in adjudication records. When a requirement changes, sweep the design decision, owning task, End state, check command, and backstop together. Search distinctive old wording, then inspect paraphrases that text search misses. Check remaining consumers and dependent requirements, including behavior made reachable by the repair. For a rewritten check, demonstrate it rejects the stale/incorrect state and accepts the intended state; merely inserting the new words proves nothing about enforcement.

## Preserve evidence and bound repair

Use the runner's separate working gate-input copy. Never edit initial-gate-input/output or raw attempt files in place. Preserve `fingerprint`, `expected`, repository identity and every coverage marker; a stamp cannot close an off-target, missing, or unusable probe. Treat incoming `adjudicated` flags as untrusted; only stamp a specific finding after an authorized patch and a recorded adjudication row.

Re-run a patched blocker when its proof was executed and the patch changes what that proof measures. Use fresh isolated state, save the new attempt separately, and remove the working-copy blocker only after independent proof resolves it. For an analyzed finding or settled policy call patched without re-proof, retain the finding with `adjudicated: true`; the result is `ADJUDICATED`, never a fabricated clean review. Preserve the original candidate and confirmation regardless of final disposition.

Carry cumulative completed repair sweeps into every canonical gate computation with the selected round limit. Use `node assets/red-team-gate.mjs --stdin --rounds=N --round-limit=L` from the installed skill directory, feeding the whole working copy and saving output separately. Do not infer verdicts from removed rows. Coverage gaps outrank adjudication. Stop on the configured round limit, `routeUpstream`, two failed re-verifications of one blocker, an unresolved operator decision, or two successive patch cascades; record remaining work. An initial attempt is mandatory even when retry allowance is zero.

For scope expansion or persistent ambiguity, hand back the specific unresolved questions and the original absolute plan target for an operator-directed planning session. Do not launch another skill or silently extend the budget. Report `BLOCKED` or `INCOMPLETE` when the evidence warrants it. Auto-note Minors; only fix them within the authorized scope.

Each adjudication records the finding, superseded plan obligation, final value/rule, patch path, evidence or unverified limit, and per-row provenance (`operator-ratified (date)` or `AI-declared`). Keep the gate-emitted final verdict, rounds and coverage alongside initial outcomes. Never overwrite a first independent review with a later repair or compare an informed rerun as if it were independent anticipation.
