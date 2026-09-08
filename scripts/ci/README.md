# Baseline suite collector (T1)

Run from the repository root on Node 24 or newer:

```sh
node scripts/ci/collect.mjs --inventory
node scripts/ci/collect.mjs --run /absolute/new/report-directory
```

The output directory must not exist; its parent must exist. Discovery uses Git's
tracked file inventory under `skills/`, `hooks/`, `adapters/`, `tests/parity/` and
`scripts/ci/`, including staged additions. It does not traverse stale worktrees.
There is no selector that can silently omit a discovered suite. The CLI compares
discovery with the reviewed `scripts/ci/test-inventory.json`; additions/deletions
require an explicit census update in the same PR. `--inventory` prints a candidate
for review but never updates it. The programmatic `inventory` argument is an exact
expected census, not a filter.

Prerequisites are Node >=24, Git, `/bin/bash`, jq and Python 3 with PyYAML for the
existing suites. The dedicated development conda environment is `codex-snipe-port`;
do not install into base. Existing shell tests are executed with `/bin/bash`,
which tests system Bash 3.2 on macOS. Linux execution remains separate evidence.
Tests may use ordinary platform utilities and locally stub their optional tools;
the collector does not install dependencies or activate GitHub workflows.

Each suite has a distinct log directory and recorded literal command, exit code,
signal and timeout/output-limit classification. Collection continues after suite
failure. Node TAP summary counts and skip lines are recorded. Shell suites must
emit nonzero assertion evidence (`ok [number] - description` / failure rows); the
existing redaction-lint wrapper instead has its named `lint: clean` assertion.
Shell counts reflect observed rows, not comments or arbitrary summary claims.
Empty/no-op suites fail. Skip evidence is checked on stdout and stderr.
Only named opt-in host skips in `baseline-skips.json` are allowed and disclosed.
The top-level evidence level is always `baseline`, never parity or compatibility.
The CLI exits nonzero when any suite fails or has unapproved skip evidence.

The collector passes a small child environment, does not forward provider tokens
or live-host opt-in variables, disables Git system configuration and interactive
authentication, and gives each suite its own global Git config. File-only Git
transport prevents inherited Git remotes from contacting production. This is
test hygiene, not an OS network sandbox: execute trusted reviewed tests, preferably
in a disposable checkout. A test can itself spawn arbitrary programs.

Each suite is bounded to ten minutes and 16 MiB combined logs. On timeout/output
overflow the collector kills its owned process group and preserves the failure.
It also terminates remaining group members after a successful parent exit;
cleanup errors cannot produce a passing suite.
Artifacts stay at the requested location; no automatic upload or cleanup occurs.
The report pins the starting SHA, index digest and source-content digest, then
repeats the observation after collection. Any drift fails the run and retains
both observations. Only the collector output directory is excluded from content
hashing. This before/after check does not detect a transient change restored before
the final observation; use a dedicated checkout and no concurrent source writers.
These baseline observations are not exact-release certification. T4–T8 own workflow
integration, production-adapter binding, full parity and release enforcement.
