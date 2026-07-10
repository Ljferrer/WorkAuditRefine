#!/usr/bin/env bash
# assert-issues-filed.sh — WAR issue-lifecycle floor (spec §4.1, ADR 0026).
#
# Reconciles the run's GitHub issue state toward LIVE gh, never trusting the
# ledger alone (C4): at the Checkpoint the Lead runs this floor to confirm the
# ledger's `epic_issue` and every `tasks[].issue` actually exist on gh, and on
# a phase being LANDED that the phase epic is CLOSED + carries `status:done`.
# The floor keys ONLY on the ledger's own fields — it never reads plan prose,
# so a `No GitHub issue filed` audit-finding rationalization can never be
# conflated with reality again.
#
# Usage:
#   assert-issues-filed.sh assert <ledger.json> <phase-id>
#       Verify the phase's epic_issue + every tasks[].issue exist on gh. On a
#       phase whose ledger status is "landed", additionally require the epic to
#       be state:CLOSED AND labelled status:done (the close-coupling teeth).
#
#   assert-issues-filed.sh --close-epic <n> --sha <sha> [--phase <label>]
#       Atomic landed-phase close: `gh issue edit <n> --add-label status:done
#       --remove-label status:in-progress` THEN `gh issue close <n> --reason
#       completed --comment "<phase> landed @ <sha>"` in one call, so
#       `status:done` can never outlive an open epic.
#
# Both modes run `skills/_shared/gh-preflight.sh` FIRST (path resolved relative
# to this script's own dir, cwd-independent) so a mid-run active-account flip
# can never fake a pass. The expected account is read from the `WAR_GH_USER`
# environment variable (the Lead exports `overrides.ghUser`); empty/unset ⇒
# gh-preflight no-ops (exit 0), matching the knob's shipped `null` default —
# a run that never configured ghUser pays nothing and leaks no personal handle.
#
# Exit codes (load-bearing contract — C5; mirrors the assert-*-in-diff.sh
# family; `2` NEVER collapses into `1`):
#   0 — verified (all issues exist; landed epic CLOSED + status:done)
#   1 — named route: `issues-missing` (a ledger issue field is null, or gh
#       reports the issue does not exist) OR `done-but-open` (landed phase epic
#       is not CLOSED / lacks status:done)
#   2 — gh/network/ledger-parse/tooling error — the diff/state could NOT be
#       established; caller must NOT treat as a clean pass (spec §8).
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
# cwd-independent; `die` idiom of the floor family. Lead-invoked, never
# refiner-side — no confined agent gains any gh verb (C2, ADR 0002).
set -euo pipefail

PROG="assert-issues-filed"
die() { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-1}"; }

HERE="$(cd "$(dirname "$0")" && pwd)"
PREFLIGHT="$HERE/../../_shared/gh-preflight.sh"

# ---------------------------------------------------------------------------
# run_preflight: assert the active gh account before any gh write/read batch.
# A non-zero preflight (account mismatch OR gh tooling error) is a TOOLING
# failure for us (exit 2) — never a silent pass, never a `1` route verdict.
# ---------------------------------------------------------------------------
run_preflight() {
  [ -f "$PREFLIGHT" ] || die "gh-preflight.sh not found at $PREFLIGHT" 2
  bash "$PREFLIGHT" "${WAR_GH_USER:-}" \
    || die "gh-preflight failed (account mismatch or gh tooling error) — refusing to proceed" 2
}

# ---------------------------------------------------------------------------
# gh_issue_state <n>: echo "<STATE>\t<comma-labels>" and return 0 if the issue
# exists; return 1 if gh reports it does not exist; return 2 on any OTHER gh
# failure (network/auth/tooling). Exit code alone can't tell not-found from a
# network error — both are non-zero — so we CLASSIFY gh's stderr text. That
# classification is the C5 teeth: a network blip must surface as 2, never as a
# false `issues-missing` (1).
# ---------------------------------------------------------------------------
gh_issue_state() {
  _n="$1"
  _errf="$(mktemp 2>/dev/null || mktemp -t aif)"
  if _out="$(gh issue view "$_n" --json state,labels \
              --jq '.state + "\t" + ([.labels[].name] | join(","))' 2>"$_errf")"; then
    rm -f "$_errf"
    printf '%s' "$_out"
    return 0
  fi
  _err="$(cat "$_errf" 2>/dev/null)"
  rm -f "$_errf"
  case "$_err" in
    *"Could not resolve"*|*"not found"*|*"Not Found"*|*"NOT_FOUND"*)
      return 1 ;;
    *)
      printf '%s: gh issue view #%s failed: %s\n' "$PROG" "$_n" "$_err" >&2
      return 2 ;;
  esac
}

# ---------------------------------------------------------------------------
# Argument parsing — dispatch on the leading mode token.
# ---------------------------------------------------------------------------
[ $# -ge 1 ] || die "usage: $PROG assert <ledger.json> <phase-id> | --close-epic <n> --sha <sha>" 2
mode="$1"; shift

case "$mode" in
  # -------------------------------------------------------------------------
  # --close-epic <n> --sha <sha> [--phase <label>] — atomic label+close.
  # -------------------------------------------------------------------------
  --close-epic)
    _n=""; _sha=""; _phase_label=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --sha)   [ $# -ge 2 ] || die "--sha requires a value" 2; _sha="$2"; shift 2 ;;
        --phase) [ $# -ge 2 ] || die "--phase requires a value" 2; _phase_label="$2"; shift 2 ;;
        --)      shift; break ;;
        -*)      die "unknown flag '$1'" 2 ;;
        *)       if [ -z "$_n" ]; then _n="$1"; shift; else die "unexpected argument '$1'" 2; fi ;;
      esac
    done
    [ -n "$_n" ]   || die "--close-epic requires an epic issue number" 2
    [ -n "$_sha" ] || die "--close-epic requires --sha <sha>" 2

    run_preflight
    # Order is load-bearing: label FIRST, then close — one atomic action so
    # status:done and the CLOSED state land together (never one without other).
    gh issue edit "$_n" --add-label status:done --remove-label status:in-progress \
      || die "gh issue edit (labels) failed for epic #$_n" 2
    gh issue close "$_n" --reason completed \
      --comment "${_phase_label:+$_phase_label }landed @ $_sha" \
      || die "gh issue close failed for epic #$_n" 2
    exit 0
    ;;

  # -------------------------------------------------------------------------
  # assert <ledger.json> <phase-id>
  # -------------------------------------------------------------------------
  assert)
    [ $# -eq 2 ] || die "usage: $PROG assert <ledger.json> <phase-id>" 2
    ledger="$1"; phase="$2"
    case "$ledger" in
      *..*) die "ledger path contains '..'; refusing potentially unsafe path: $ledger" 2 ;;
    esac
    [ -f "$ledger" ] || die "ledger file not found: $ledger" 2

    run_preflight

    # Parse the ledger via node (repo requires Node >= 24; the nested
    # phases[]/tasks[] shape wants a real JSON parser, not grep). Emits one
    # tab-delimited record per line:
    #   status<TAB><phase-status>
    #   epic<TAB><epic_issue-or-empty>
    #   task<TAB><task-id><TAB><task-issue-or-empty>   (one per task)
    # A parse failure or missing phase → node exits non-zero → we map to 2.
    parsed="$(node -e '
      const fs = require("fs");
      const led = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      const phase = process.argv[2];
      const ph = (led.phases || []).find(p => String(p.id) === phase);
      if (!ph) { process.stderr.write("phase not found in ledger: " + phase + "\n"); process.exit(3); }
      const out = [];
      out.push("status\t" + (ph.status == null ? "" : ph.status));
      out.push("epic\t" + (ph.epic_issue == null ? "" : ph.epic_issue));
      for (const t of (ph.tasks || [])) {
        out.push("task\t" + (t.id == null ? "" : t.id) + "\t" + (t.issue == null ? "" : t.issue));
      }
      process.stdout.write(out.join("\n") + "\n");
    ' "$ledger" "$phase")" || die "ledger parse failed or phase '$phase' not found" 2

    phase_status=""
    epic_seen=0

    # Same-shell heredoc loop (no pipe subshell) so an inner `die` exits.
    while IFS=$'\t' read -r kind a b; do
      case "$kind" in
        status)
          phase_status="$a"
          ;;
        epic)
          epic_seen=1
          [ -n "$a" ] || die "issues-missing: epic_issue is null/missing for phase $phase" 1
          rc=0
          info="$(gh_issue_state "$a")" || rc=$?
          case "$rc" in
            1) die "issues-missing: epic issue #$a does not exist on gh (phase $phase)" 1 ;;
            2) die "gh tooling error verifying epic issue #$a (phase $phase)" 2 ;;
          esac
          if [ "$phase_status" = "landed" ]; then
            epic_state="${info%%$'\t'*}"
            epic_labels="${info#*$'\t'}"
            [ "$epic_state" = "CLOSED" ] \
              || die "done-but-open: landed phase $phase epic #$a is state '$epic_state' (expected CLOSED)" 1
            case ",$epic_labels," in
              *,status:done,*) : ;;
              *) die "done-but-open: landed phase $phase epic #$a is CLOSED but missing label status:done" 1 ;;
            esac
          fi
          ;;
        task)
          _tid="$a"; _tissue="$b"
          [ -n "$_tissue" ] \
            || die "issues-missing: task $_tid has a null/missing issue in the ledger (phase $phase)" 1
          rc=0
          gh_issue_state "$_tissue" >/dev/null || rc=$?
          case "$rc" in
            1) die "issues-missing: task $_tid issue #$_tissue does not exist on gh (phase $phase)" 1 ;;
            2) die "gh tooling error verifying task $_tid issue #$_tissue (phase $phase)" 2 ;;
          esac
          ;;
      esac
    done <<LEDGER_RECORDS
$parsed
LEDGER_RECORDS

    [ "$epic_seen" -eq 1 ] || die "ledger phase $phase has no epic record" 2
    exit 0
    ;;

  *)
    die "unknown mode '$mode' (expected: assert | --close-epic)" 2
    ;;
esac
