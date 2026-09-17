# Snipe self-audit integrity fixes

Scope: the three-seat audit of `af451ab..aaadd92` (the full Codex Snipe port),
following #2097's finding-class, sibling-sweep, independent-oracle and consequence
requirements. The issue body and all seven comments were read before implementation.
This is not engine-campaign or Claude-plugin work. No installed plugin is updated
before operator review and merge.

## Finding classes and consequences

| Class | Correction and sibling scope | Consequence |
| --- | --- | --- |
| Judgment replacement | Remove model-based repair; retain deterministic aliases, original invalid response and valid peers; update operative skill and role, preserve historical report compatibility. | Malformed output stays incomplete, even if another response might have parsed. |
| Contradictory test evidence | Reject absent-plus-inspected and invalid relative paths, including aliases. | Existing-but-uninspected tests remain representable; validation does not prove file existence. |
| Hidden gitlinks | Force ignore-submodules=none at the shared diff/status boundary, including staged/unstaged fingerprints and nested status. | User presentation preferences cannot remove review scope. |
| Replacement objects | Share evidence environment between coordinator, preparation and auditor shells. | Review uses original objects and avoids lazy fetch, hooks and fsmonitor. |
| Origin rewriting | Read unique literal local origin without includes/rewrite expansion. | Repository identity means declared identity, not effective network destination. |
| SSH declaration | Apply user-config checks to literal hosts and aliases; reject active routing overrides and unsupported conditional config. | This is not authentication or full effective SSH evaluation; system config and network routing are not attested. |
| Process lifecycle | Shared idempotent process-group cleanup on exit and failure, discovery resolves only after close; CLI cancellation includes discovery. | Immediate hard termination on cancellation/limits; descendants that deliberately escape a process group are outside this ownership model. |
| Scope resource bounds | Bounded Git calls and regular-file streaming; use same bounded reader for SSH config and working-tree .gitmodules; final fingerprint errors become instability. | Oversized/unreadable scope is a visible refusal or incomplete final check, not truncated evidence. |

## Regression evidence

Observed red before correction: malformed result launched a second process;
valid peer test counted a second invalid-seat launch; absent tests accepted an
inspected path; staged, unstaged and dirty nested content disappeared under ignore
config; rewritten unrelated origin was accepted; literal SSH remap and active
ProxyCommand were accepted; successful catalog left its descendant alive.
Those targeted tests subsequently passed.

The bounded-file unit suite covers exact limit, oversize, directory, symlink,
FIFO, concurrent modification and elapsed deadline. Its initial missing-module
failure is not claimed as behavioral proof. Disposable source mutations now
demonstrate that removing no-follow, regular-file, byte-limit, concurrent-change
or deadline checks admits a corresponding unsafe witness; removing nonblocking
open demonstrably hangs on a FIFO until the test's independent timeout kills it.
Each test-evidence guard has a separate witness accepted only by its mutant.
A hanging Git fixture produces ETIMEDOUT under scope capture; disabling that
timeout in a disposable package changes the outcome and breaks the timeout oracle.

The auditor policy test uses real Git, not the policy constant, as its oracle:
normal Git sees replacement content; the runner-configured shell sees the original
blob. Removing the injection from a disposable standalone package breaks that
oracle. The actual Desktop host regression also passed on bundled CLI 0.153.4,
`gpt-5.6-sol` / `medium`: the auditor found the original invalid-input defect
despite replacement refs that concealed it from normal Git, with an unchanged
repository snapshot. This was a source-candidate test, not a live plugin update.

Discovery descendant tests cover success, malformed JSON, timeout, overflow,
early exit, cancellation and RPC error; auditor success also covers descendants
that close inherited pipes. Local/global origin rewrites have both directions;
committed-only and all dirty gitlink forms have ignore-config regressions. A
failed nested-status wrapper verifies unavailable coverage and instability.
Oversized final capture and report rendering preserve the reason and peer results.

Validation: `node --test 'adapters/codex/**/*.test.mjs'
skills/snipe/assets/snipe-args.test.mjs` — 89 passed, 0 failed, 4 opt-in host tests
skipped. The replacement-ref actual-host test was enabled and passed separately.
The skill validator passed in the dedicated `codex-snipe-port` conda environment;
standalone packaging and dependency-closure tests passed. `git diff --check` passed.

Independent Standards, Spec and cascading-impact reviewers found the stale SSH
doc mirror, failed nested-status consequence and lost final-capture diagnostic;
all were corrected with regressions. Their rechecks report no remaining blockers.
No new engine configuration, Claude plugin changes, automatic merge, or installed
plugin update is included. Keep #2160 open through reviewed merge and installed
release acceptance; the earlier closed leaf issues retain their historical scope.
