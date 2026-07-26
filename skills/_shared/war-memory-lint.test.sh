#!/usr/bin/env bash
# Redaction lint as GATE evidence (#1081, spec §4.1). This file exists to be
# DISCOVERED: the refiner-dispatched gate's own `-name '*.test.sh'` sweep (and the
# documented `find hooks skills -name '*.test.sh'` loop) picks it up with zero
# engine change — no `resolveGate`/composer edit, no floor-script vehicle. The
# lint therefore lands in every captured `.war/gate-<taskId>.log` under a
# `== gate(bash): … ==` banner, so a plan End state citing it is CONFIRMABLE from
# gate evidence instead of a structurally SOFT cannot-confirm. CI
# (.github/workflows/memory-audit.yml) stays the post-push backstop; this is the
# pre-merge enforcement.
#
# Target: `$1` when given — that override exists purely so the meta-tests in
# war-memory.test.mjs can drive the red and missing-dir paths against temp
# fixtures — else the repo's own docs/learnings/. Passing the target explicitly
# is load-bearing: a bare `lint` falls back to the LOCAL memory root (cmdLint's
# `paths.length ? paths : [resolveRoots(argv).local]`), never the intent here.
#
# Existence guard (anti-vacuity; conscious deviation from spec §4.1's "no logic
# beyond path resolution"): cmdLint's `catch { continue }` prints "lint: clean"
# and exits 0 on an absent/unreadable target, so a moved or renamed
# docs/learnings/ would make this gate evidence silently vacuous forever. Fail
# LOUD instead — exit 2 (distinct from the CLI's exit 1 = lint hits), path named
# on stderr. On an existing target the CLI's exit code propagates untouched
# (fail-closed: exit 1 with each hit on stdout naming file + pattern).
#
# Eviction coupling: the default target IS docs/learnings/, so an eviction
# (`/lessons-learned evict`; skills/lessons-learned/references/migration.md
# §Evict) must delete this wrapper in the SAME PR — otherwise the guard above
# reds EVERY discovered gate in this repo. That playbook's "CI's memory-audit
# gate fails open once the dir is absent" is true of CI only.
#
# macOS bash 3.2.57 compatible; cwd-independent (repo root resolved from $0, two
# directories up from skills/_shared/).
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
TARGET="${1:-$ROOT/docs/learnings/}"

if [ ! -d "$TARGET" ] || [ ! -r "$TARGET" ]; then
  printf 'war-memory-lint: target directory does not exist or is not readable: %s\n' "$TARGET" >&2
  printf 'war-memory-lint: refusing to report a vacuous "lint: clean" — restore the path or pass the new one.\n' >&2
  exit 2
fi

exec node "$ROOT/skills/_shared/war-memory.mjs" lint "$TARGET"
