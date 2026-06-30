#!/usr/bin/env bash
# lessons-learned safe-swap — fault-tolerant backup → stage → verify → atomic swap.
#
# The project memory dir is NOT git-tracked, so a tarball backup is the ONLY
# recovery point. This helper keeps the LIVE memory dir pristine until the very
# end: all edits happen in a sibling `<memdir>.staging` copy, which is verified
# and only then swapped in by two back-to-back `mv`s. If the laptop closes
# mid-run, the live dir is untouched (during stage/verify) or trivially
# recoverable (during the swap) — run `recover`.
#
# Subcommands:
#   stage   <memdir>              backup tarball + create <memdir>.staging copy
#   verify  <dir>                  integrity-check a dir (index<->file, links, budget)
#   commit  <memdir>              verify staging, then atomic-swap it into place
#   recover <memdir>              detect + repair an interrupted swap
#
# Budget (consolidate-memory): MEMORY.md should stay < 200 lines and ~25 KB.
# macOS bash 3.2.57-compatible: no globstar, no associative arrays, no ${,,}.
set -euo pipefail

LINE_BUDGET=200
BYTE_BUDGET=25600   # 25 KiB

die() { printf 'safe-swap: %s\n' "$1" >&2; exit 2; }
abspath() { # portable realpath for an existing dir
  ( cd "$1" 2>/dev/null && pwd ) || die "no such directory: $1"
}
staging_of() { printf '%s.staging' "$1"; }

# --- integrity checks ---------------------------------------------------------
# Prints a report; returns nonzero on any hard failure.
do_verify() {
  dir="$1"
  [ -d "$dir" ] || die "verify: no such dir: $dir"
  mem="$dir/MEMORY.md"
  [ -f "$mem" ] || die "verify: MEMORY.md missing in $dir"
  FAILED=0

  # Indexed slugs (rows): the FIRST [[slug]] of each table row (a `|`-led line).
  # Taking only the first wikilink per row ignores any [[...]] that appears later
  # in a summary cell, so an illustrative link in prose is not mistaken for a row.
  grep -E '^\|' "$mem" 2>/dev/null | grep '\[\[' \
    | sed -E 's/^[^[]*\[\[([a-z0-9-]+)\]\].*/\1/' | sort -u > /tmp/.ll_idx.$$ || true
  # All topic files (basenames without .md), excluding MEMORY.md.
  ( cd "$dir" && ls -1 *.md 2>/dev/null | grep -v '^MEMORY.md$' | sed 's/\.md$//' | sort -u ) > /tmp/.ll_files.$$ || true
  # All wikilink targets anywhere (for dangling detection).
  ( cd "$dir" && grep -rhoE '\[\[[a-z0-9-]+\]\]' *.md 2>/dev/null | sed 's/\[\[//;s/\]\]//' | sort -u ) > /tmp/.ll_links.$$ || true

  echo "== integrity =="

  # HARD FAIL: an index row pointing to a file that does not exist.
  rows_missing=""
  while IFS= read -r s; do
    [ -z "$s" ] && continue
    [ -f "$dir/$s.md" ] || rows_missing="$rows_missing $s"
  done < /tmp/.ll_idx.$$
  if [ -n "$rows_missing" ]; then
    echo "FAIL  index rows point to MISSING files:$rows_missing"; FAILED=1
  else
    echo "ok    every index row maps to a file"
  fi

  # WARNING: a topic file not referenced anywhere in the index.
  unindexed="$(comm -23 /tmp/.ll_files.$$ /tmp/.ll_idx.$$ | tr '\n' ' ')"
  if [ -n "${unindexed// /}" ]; then
    echo "WARN  files not in the index (add a row or confirm intentional):$unindexed"
  else
    echo "ok    every topic file is indexed"
  fi

  # WARNING: a [[link]] whose target file does not exist (dangling / forward-ref).
  dangling=""
  while IFS= read -r s; do
    [ -z "$s" ] && continue
    [ -f "$dir/$s.md" ] || dangling="$dangling $s"
  done < /tmp/.ll_links.$$
  if [ -n "$dangling" ]; then
    echo "WARN  wikilinks with no target file (forward-ref OK; a link to a JUST-DELETED file is rot):$dangling"
  else
    echo "ok    no dangling wikilinks"
  fi

  # Budget.
  lines=$( wc -l < "$mem" | tr -d ' ' )
  bytes=$( wc -c < "$mem" | tr -d ' ' )
  lpct=$(( lines * 100 / LINE_BUDGET ))
  bpct=$(( bytes * 100 / BYTE_BUDGET ))
  echo "size  MEMORY.md = ${lines} lines (${lpct}% of ${LINE_BUDGET}), ${bytes} bytes (${bpct}% of ${BYTE_BUDGET})"
  if [ "$lines" -gt "$LINE_BUDGET" ]; then echo "FAIL  MEMORY.md over the ${LINE_BUDGET}-line budget"; FAILED=1; fi
  if [ "$bytes" -gt "$BYTE_BUDGET" ]; then echo "FAIL  MEMORY.md over the ${BYTE_BUDGET}-byte budget"; FAILED=1; fi

  rm -f /tmp/.ll_idx.$$ /tmp/.ll_files.$$ /tmp/.ll_links.$$
  [ "$FAILED" -eq 0 ] && echo "VERIFY: PASS" || echo "VERIFY: FAIL"
  return "$FAILED"
}

# --- subcommands --------------------------------------------------------------
cmd="${1:-}"; [ -n "$cmd" ] || die "usage: safe-swap.sh stage|verify|commit|recover <dir>"
shift || true

case "$cmd" in
  stage)
    raw="${1:-}"; [ -n "$raw" ] || die "stage: need <memdir>"
    mem="$(abspath "$raw")"
    [ -f "$mem/MEMORY.md" ] || die "stage: $mem has no MEMORY.md — is this the memory dir?"
    staging="$(staging_of "$mem")"
    [ -e "$staging" ] && die "stage: $staging already exists — run 'recover' or remove it first (a prior run was interrupted)."
    parent="$(dirname "$mem")"; base="$(basename "$mem")"
    ts="$(date -u +%Y%m%dT%H%M%SZ)"
    backup="$parent/lessons-learned.bak.$ts.tgz"
    tar czf "$backup" -C "$parent" "$base"
    cp -R "$mem" "$staging"
    echo "BACKUP=$backup"
    echo "STAGING=$staging"
    echo "stage: live dir is untouched; do ALL edits in STAGING, then 'commit'."
    ;;
  verify)
    raw="${1:-}"; [ -n "$raw" ] || die "verify: need <dir>"
    do_verify "$(abspath "$raw")"
    ;;
  commit)
    raw="${1:-}"; [ -n "$raw" ] || die "commit: need <memdir>"
    mem="$(abspath "$raw")"
    staging="$(staging_of "$mem")"
    [ -d "$staging" ] || die "commit: no staging dir at $staging — run 'stage' first."
    echo "commit: verifying staging before swap…"
    if ! do_verify "$staging"; then
      die "commit: staging FAILED verification — NOT swapping. Fix staging, re-verify, retry."
    fi
    ts="$(date -u +%Y%m%dT%H%M%SZ)"
    prev="$mem.prev.$ts"
    mv "$mem" "$prev"      # window 1: live -> .prev
    mv "$staging" "$mem"   # window 2: staging -> live  (recover handles a crash between these)
    echo "PREV=$prev"
    echo "commit: swapped. New memory dir is live; previous state kept at PREV and in the backup tarball."
    ;;
  recover)
    raw="${1:-}"; [ -n "$raw" ] || die "recover: need <memdir>"
    # Can't abspath a possibly-missing dir; resolve parent.
    parent="$(cd "$(dirname "$raw")" && pwd)"; base="$(basename "$raw")"
    mem="$parent/$base"; staging="$mem.staging"
    if [ -f "$mem/MEMORY.md" ]; then
      if [ -d "$staging" ]; then
        echo "recover: live dir intact AND a stale staging exists at $staging."
        echo "recover: the run was interrupted before commit. Discard staging to restart cleanly:"
        echo "         rm -rf '$staging'"
      else
        echo "recover: live dir intact, no staging — nothing to recover."
      fi
    else
      if [ -d "$staging" ]; then
        echo "recover: live dir MISSING but staging present — swap was interrupted. Restoring staging → live."
        mv "$staging" "$mem"
        echo "recover: restored. Re-verify with: safe-swap.sh verify '$mem'"
      else
        latest="$(ls -1t "$parent"/lessons-learned.bak.*.tgz 2>/dev/null | head -1 || true)"
        [ -n "$latest" ] || die "recover: live dir missing, no staging, no backup tarball found — manual recovery needed."
        echo "recover: live dir missing and no staging; restore from the newest backup tarball:"
        echo "         tar xzf '$latest' -C '$parent'"
      fi
    fi
    ;;
  *)
    die "unknown subcommand '$cmd' (stage|verify|commit|recover)"
    ;;
esac
