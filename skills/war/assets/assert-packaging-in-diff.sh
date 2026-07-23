#!/usr/bin/env bash
# assert-packaging-in-diff.sh — WAR worker packaging-floor guard (spec §4.1).
#
# Sibling of assert-test-in-diff.sh. Catches the enumerated-COPY class of
# container-packaging blind spot: a task ADDS a file next to source files a
# Dockerfile COPYs one-by-one, but nothing adds the new file to the image —
# the unit gate is green (the file sits beside its siblings in the repo tree),
# the audit is clean, the merge lands, and only the *image* crash-loops at
# deploy (the field incident: `case_metadata.py` added beside `loader.py`,
# `FileNotFoundError: /app/case_metadata.py`).
#
# Usage: assert-packaging-in-diff.sh <integration-base> <task-branch> \
#          [--repo <git-dir>] [--advise-vacuous]
# (--repo is test-only: points git at a fixture repo; production invokes from
#  the task-worktree cwd, exactly like assert-test-in-diff.sh.)
# --advise-vacuous: when the run is structurally vacuous under the ratified
#  scope below (no Dockerfile, or a non-empty diff with zero Added/Renamed/
#  Copied paths), print ONE informational advisory line to stderr citing that
#  scope. Opt-in only (the engine appends it when a plan explicitly declares
#  requiresPackaging: true) — stdout and every exit code stay byte-identical
#  without the flag. An entirely empty diff stays silent even with the flag.
#
# Diff = `git diff --name-status <base>...<branch>` (three-dot symmetric diff).
# ADDED (`A`), RENAME-TARGET (`R`), and COPY-TARGET (`C`) paths only — deletions
# and pure modifications never flag (removing a file a Dockerfile still COPYs is
# a *build* failure the docker gate or CI catches, not a packaging-floor concern).
#
# SCOPE RATIFICATION (ADR 0017 addendum): Added/Renamed/Copied-only is the
# INTENDED scope, not an oversight — this floor exists to catch the enumerated-
# COPY drift where a *new* file is born beside COPY'd siblings but nobody adds it
# to the image. A Modified or Deleted packaging artifact that breaks the image
# (an edited/removed file a Dockerfile still enumerates) surfaces as a docker
# *build* failure — the opt-in docker gate / CI's concern, not this floor's. A
# purely-Modified diff therefore exits 0 by design. See the dated addendum in
# docs/adr/0017-packaging-floor-docker-gate-ratified-backstops.md.
#
# Per added file F, per Dockerfile D (any file matching Dockerfile /
# Dockerfile.* / *.Dockerfile, excluding node_modules/ and .git/) whose
# directory is an ancestor of (or equal to) F's directory:
#   1. Enumerated-COPY style?  D has >=1 COPY/ADD source that is a LITERAL FILE
#      path (no wildcard, not a directory) resolving into F's directory.
#      No such line -> this D never flags F (whole-dir `COPY dir/ .` and
#      `COPY . .` styles are self-maintaining).
#   2. Covered?  F is matched by ANY COPY/ADD source in ANY stage — literal,
#      wildcard glob (`COPY *.py .`), or a directory copy whose tree contains F
#      (incl. `COPY . .`). Covered -> pass.
#   3. Excluded?  the context root's .dockerignore excludes F under the
#      supported subset (literal paths, dir prefixes, single-segment `*`, `**`).
#      Unsupported/unparseable lines (incl. `!` negations) = NOT excluding
#      (D10 fail-closed). Excluded -> pass.
#   4. Otherwise FLAG `F -> D`.
#
# `COPY --from=...` sources are stage copies, not build-context reads — ignored.
#
# # ponytail: context = Dockerfile dir; pipelines passing a foreign context
# # root mis-scope — the docker gate is the definitive check. (spec §4.1, §8)
#
# Exit codes (load-bearing contract, mirrors assert-test-in-diff.sh 0/1/2):
#   0 — nothing flagged (incl. the trivial no-Dockerfile case)
#   1 — flagged F -> D pairs listed on stdout (the "unpackaged" route; not an error)
#   2 — git/ref error (HARD error; NEVER a "nothing flagged" signal — the diff
#       could not be computed, caller must not treat as clean)
#
# macOS bash 3.2.57 compatible (no globstar, no associative arrays, no ${,,}).
# Style mirrors assert-test-in-diff.sh / provision-worktrees.sh.
#
# ---------------------------------------------------------------------------
# Target-repo-agnostic audit (epic #579; #574 item 4, decision C): NO override
# added. Unlike the test-floor pattern — which pins a repo/language-specific
# `*.test.*` convention and so gained a per-phase-resolved `overrides.testPattern`
# (pinned at Setup; under `--afk` a sanity-floor-rejected proposal is re-checked
# at each phase launch and can be adopted monotonically) — this floor is ALREADY
# target-agnostic and needs no such knob:
#   - Discovery keys on Dockerfile *naming* only (`Dockerfile` / `Dockerfile.*`
#     / `*.Dockerfile`; see is_dockerfile), a convention every Docker-packaging
#     repo shares — never on this repo's paths, layout, or file conventions.
#   - COPY-coverage analysis is path-derived from the TARGET's own discovered
#     Dockerfiles (the COPY/ADD sources parsed from each at <branch>), never
#     from a fixed source tree — so the floor adapts to whatever the target
#     packages, in whatever repo it runs against.
# Comment-only: this note records the audit; no executable surface changes.
# ---------------------------------------------------------------------------
set -euo pipefail

PROG="assert-packaging-in-diff"
die()  { printf '%s: %s\n' "$PROG" "$1" >&2; exit "${2:-1}"; }

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
[ $# -ge 2 ] || die "usage: $PROG <integration-base> <task-branch> [--repo <dir>] [--advise-vacuous]"

base="$1"
branch="$2"
shift 2

repo_dir=""
advise_vacuous=0          # --advise-vacuous: stderr note on structurally-vacuous no-ops
while [ $# -gt 0 ]; do
  case "$1" in
    --repo)
      [ $# -ge 2 ] || die "--repo requires a path"
      repo_dir="$2"; shift 2 ;;
    --advise-vacuous)
      advise_vacuous=1; shift ;;
    --) shift; break ;;
    -*) die "unknown argument '$1'" ;;
    *)  die "unexpected positional argument '$1'" ;;
  esac
done

# ---------------------------------------------------------------------------
# Safety: reject .. traversal in base or branch args (mirrors assert-test-in-diff.sh:
# a `..` token resolves to a relative path traversal when the arg looks like a
# filesystem path; fail loud before any git op so it cannot silently mis-scope).
# Exit 2 (git/ref error), NOT 1 — a rejected ref is a hard error, never the
# "flagged pairs" signal, so it can never be misread as `unpackaged` and route
# a spurious fix-worker. (The 1-exit is reserved strictly for flagged F -> D.)
# ---------------------------------------------------------------------------
case "$base" in
  *..*)  die "base argument contains '..'; refusing to use potentially unsafe ref: $base" 2 ;;
esac
case "$branch" in
  *..*)  die "branch argument contains '..'; refusing to use potentially unsafe ref: $branch" 2 ;;
esac

# ---------------------------------------------------------------------------
# git runner: `git -C <repo_dir>` when --repo given, else cwd (like the sibling).
# We read blobs at <branch> (git show <branch>:<path>) so the floor works from a
# worktree checked out to any ref — never the working tree, always the branch.
# ---------------------------------------------------------------------------
if [ -n "$repo_dir" ]; then
  GIT() { git -C "$repo_dir" "$@"; }
else
  GIT() { git "$@"; }
fi

# ---------------------------------------------------------------------------
# Diff: A, R, and C target paths only.
# `--name-status` emits, tab-separated:
#   A\t<path>                       (added)
#   M\t<path> / D\t<path>           (modified / deleted — skipped)
#   R<score>\t<old>\t<new>          (rename — we take <new>, the target)
#   C<score>\t<old>\t<new>          (copy — target is a new path; treat like add)
# ---------------------------------------------------------------------------
diff_out="$(GIT diff --name-status "$base...$branch" 2>/dev/null)" || \
  die "git diff failed for '$base...$branch'" 2

added_files=""
if [ -n "$diff_out" ]; then
  # Read tab-separated status lines; collect A/R/C target paths.
  while IFS="$(printf '\t')" read -r status f1 f2; do
    [ -n "$status" ] || continue
    case "$status" in
      A*)      p="$f1" ;;              # added: first field is the path
      R*|C*)   p="$f2" ;;              # rename/copy: second field is the target
      *)       continue ;;            # M, D, T, U, etc. — never flag
    esac
    [ -n "$p" ] || continue
    added_files="$added_files$p
"
  done <<EOF
$diff_out
EOF
fi

# Trivial no-op: nothing added/renamed -> nothing to flag.
if [ -z "$added_files" ]; then
  # Vacuous shape (b): the diff had changes but ZERO Added/Renamed/Copied paths
  # (a Modified/Deleted-only diff). --advise-vacuous surfaces this to a plan that
  # explicitly asked for the floor — but only when there WAS a diff; an entirely
  # empty diff ($diff_out empty) stays silent (diff_out distinguishes the two).
  if [ "$advise_vacuous" -eq 1 ] && [ -n "$diff_out" ]; then
    printf '%s: advisory: diff has no Added/Renamed/Copied paths (Modified/Deleted only) — packaging floor is structurally vacuous under its ratified scope (2026-07-08 ADR 0017 addendum); nothing new to check for container coverage.\n' "$PROG" >&2
  fi
  exit 0
fi

# ---------------------------------------------------------------------------
# Discover Dockerfiles at <branch> via `git ls-tree -r --name-only`.
# ONE discovery expression (reused by Task 6's Setup prose): basename matches
# Dockerfile / Dockerfile.* / *.Dockerfile, excluding node_modules/ and .git/.
# ---------------------------------------------------------------------------
tree_files="$(GIT ls-tree -r --name-only "$branch" 2>/dev/null)" || \
  die "git ls-tree failed for '$branch'" 2

# is_dockerfile <path> -> 0 if the basename is a Dockerfile per the discovery set.
is_dockerfile() {
  case "$1" in
    node_modules/*|*/node_modules/*) return 1 ;;
    .git/*|*/.git/*)                 return 1 ;;
  esac
  b="${1##*/}"                        # basename
  case "$b" in
    Dockerfile|Dockerfile.*|*.Dockerfile) return 0 ;;
  esac
  return 1
}

dockerfiles=""
if [ -n "$tree_files" ]; then
  while IFS= read -r tf; do
    [ -n "$tf" ] || continue
    if is_dockerfile "$tf"; then
      dockerfiles="$dockerfiles$tf
"
    fi
  done <<EOF
$tree_files
EOF
fi

# No Dockerfile anywhere -> nothing can flag (spec: trivial no-Dockerfile -> 0).
if [ -z "$dockerfiles" ]; then
  # Vacuous shape (a): no Dockerfile discovered, so the floor can never flag.
  # --advise-vacuous surfaces this to a plan that explicitly asked for the floor.
  if [ "$advise_vacuous" -eq 1 ]; then
    printf '%s: advisory: no Dockerfile found at %s — packaging floor is structurally vacuous under its ratified scope (2026-07-08 ADR 0017 addendum); no container build to check coverage against.\n' "$PROG" "$branch" >&2
  fi
  exit 0
fi

# ---------------------------------------------------------------------------
# Path helpers (pure string; POSIX-ish, no realpath — everything is repo-relative).
# ---------------------------------------------------------------------------

# dir_of <path> -> directory portion, or "" for a repo-root file (no slash).
dir_of() {
  case "$1" in
    */*) printf '%s' "${1%/*}" ;;
    *)   printf '' ;;
  esac
}

# join_ctx <ctx> <rel> -> normalize <ctx>/<rel> for context-relative sources.
# ctx "" (root) -> rel as-is. A leading "./" on rel is stripped. "." -> ctx.
join_ctx() {
  jc="$1"; jr="$2"
  case "$jr" in
    ./*) jr="${jr#./}" ;;
    .)   jr="" ;;
  esac
  if [ -z "$jc" ]; then
    printf '%s' "$jr"
  elif [ -z "$jr" ]; then
    printf '%s' "$jc"
  else
    printf '%s/%s' "$jc" "$jr"
  fi
}

# is_ancestor_dir <ancestor> <descendant-or-equal>
#   0 if <descendant> == <ancestor> or lives under <ancestor>/.
#   Root ancestor ("") is an ancestor of everything.
is_ancestor_dir() {
  a="$1"; d="$2"
  [ -z "$a" ] && return 0             # root context contains all
  [ "$a" = "$d" ] && return 0
  case "$d" in
    "$a"/*) return 0 ;;
  esac
  return 1
}

# has_glob <str> -> 0 if str contains a shell glob metachar (* ? [).
has_glob() {
  case "$1" in
    *"*"*|*"?"*|*"["*) return 0 ;;
  esac
  return 1
}

# ---------------------------------------------------------------------------
# COPY/ADD source extraction.
#
# A COPY/ADD instruction is: `COPY [--flag ...] src... dest`. The LAST token is
# dest; every token before it (after option flags) is a source. We:
#   - lowercase-match the leading COPY/ADD keyword (Dockerfile keywords are
#     case-insensitive; `tr` the first word only),
#   - DROP any line carrying `--from` (stage copy, not a context read; spec),
#   - strip other `--flag`/`--flag=val` option tokens,
#   - treat all-but-last remaining tokens as sources.
#
# JSON-array form (`COPY ["a","b"]`) is NOT parsed — deferred with heredocs
# (spec §9); shell form covers the incident and every §10.1 case.
# # ponytail: shell-form COPY/ADD only; JSON/heredoc form is spec §9 deferred.
#
# Emits, for a Dockerfile D with context dir CTX, two newline-lists via globals:
#   D_LIT_DIRS  — context-resolved DIR of each LITERAL-FILE source (enumerated
#                 -style probe: source has no glob and does not end in `/`)
#   D_COVERS    — every source, context-resolved, tagged for coverage matching:
#                   "L<path>"  literal file/glob path (match/glob vs F)
#                   "D<path>"  directory copy (source ended in `/`, or was `.`);
#                              covers F if F lives under <path>/ (or path=="" -> all)
# ---------------------------------------------------------------------------
parse_dockerfile() {
  pd_path="$1"
  pd_ctx="$(dir_of "$pd_path")"
  D_LIT_DIRS=""
  D_COVERS=""

  pd_body="$(GIT show "$branch:$pd_path" 2>/dev/null)" || return 0

  # -------------------------------------------------------------------------
  # Continuation join (spec §4.A): fold physical lines whose LAST non-whitespace
  # character is `\` into single-space-joined logical lines, so the tokenizing
  # loop below sees each COPY/ADD instruction whole. Full-line `#` comments met
  # while a continuation is open are dropped (Docker strips comments before
  # joining continuations). A dangling `\` on the file's LAST line terminates
  # the logical line at EOF (no hang, no dropped tokens).
  # # ponytail: "last non-whitespace char is `\`" is the continuation test —
  # # laxer than strict BuildKit, where a trailing backslash FOLLOWED BY spaces
  # # is NOT a continuation; a `\` that is merely line-final inside a quoted
  # # token is also read as a continuation marker (quoted-token backslash is a
  # # documented ceiling, no fixture). Heredoc/JSON COPY forms stay deferred
  # # (spec §9), same as the shell-form-only tokenizer below.
  pd_joined=""
  pd_cont=""             # logical line accumulated while a continuation is open
  pd_open=0              # 1 while the previous physical line ended in `\`
  while IFS= read -r pline; do
    pl_lead="${pline#"${pline%%[![:space:]]*}"}"   # ltrim (comment test only)
    if [ "$pd_open" -eq 1 ]; then
      # Mid-continuation: drop a full-line comment, stay open.
      case "$pl_lead" in \#*) continue ;; esac
    else
      # Not continuing: a full-line comment is passed through verbatim (the
      # tokenizer skips it) and never STARTS a continuation, even if it ends
      # in `\` (Docker treats a comment line as a comment, not a splice).
      case "$pl_lead" in \#*) pd_joined="$pd_joined$pline
"; continue ;; esac
    fi
    pl_trim="${pline%"${pline##*[![:space:]]}"}"   # rtrim (continuation test)
    case "$pl_trim" in
      *\\)
        seg="${pl_trim%\\}"                          # drop the trailing backslash
        seg="${seg%"${seg##*[![:space:]]}"}"          # rtrim the joined segment
        if [ "$pd_open" -eq 1 ]; then pd_cont="$pd_cont $seg"; else pd_cont="$seg"; fi
        pd_open=1 ;;
      *)
        if [ "$pd_open" -eq 1 ]; then
          pd_joined="$pd_joined$pd_cont $pline
"
        else
          pd_joined="$pd_joined$pline
"
        fi
        pd_cont=""; pd_open=0 ;;
    esac
  done <<EOF
$pd_body
EOF
  # Dangling `\` on the final physical line: emit the accumulated tokens at EOF.
  if [ "$pd_open" -eq 1 ]; then
    pd_joined="$pd_joined$pd_cont
"
  fi

  while IFS= read -r line; do
    # Trim leading whitespace; skip blanks and comments.
    line="${line#"${line%%[![:space:]]*}"}"
    [ -n "$line" ] || continue
    case "$line" in \#*) continue ;; esac

    # Keyword = first token, case-insensitive. Only COPY/ADD carry sources.
    kw="${line%%[[:space:]]*}"
    kw_lc="$(printf '%s' "$kw" | tr 'A-Z' 'a-z')"
    case "$kw_lc" in
      copy|add) ;;
      *) continue ;;
    esac

    rest="${line#"$kw"}"

    # `--from=...` (or `--from ...`) => stage copy, ignore the whole line.
    case " $rest " in
      *" --from="*|*" --from "*) continue ;;
    esac

    # Tokenize the remainder (word-split; noglob so a literal `*.py` source is
    # NOT expanded against the cwd). Drop leading --flag / --flag=val tokens.
    set -f
    # shellcheck disable=SC2086
    set -- $rest
    set +f
    toks_n=$#
    # Need at least src + dest (2 tokens) to have any source.
    [ "$toks_n" -ge 2 ] || continue

    # Collect positional tokens into an index we can slice; drop --flags.
    i=0
    srcs=""            # newline list of source tokens (dest excluded below)
    last=""
    for t in "$@"; do
      case "$t" in
        --*) continue ;;            # option flag (e.g. --chown=..); skip
      esac
      last="$t"                      # track final non-flag token = dest
      srcs="$srcs$t
"
      i=$((i + 1))
    done
    [ "$i" -ge 2 ] || continue       # fewer than src+dest after flag strip

    # Re-walk srcs, dropping the LAST entry (dest). Everything else is a source.
    n=0
    while IFS= read -r s; do
      [ -n "$s" ] || continue
      n=$((n + 1))
      [ "$n" -eq "$i" ] && break     # reached dest; stop
      # De-quote a simply-quoted token ("src" or 'src').
      case "$s" in
        \"*\") s="${s#\"}"; s="${s%\"}" ;;
        \'*\') s="${s#\'}"; s="${s%\'}" ;;
      esac

      # Directory copy? source is "." or ends in "/".
      if [ "$s" = "." ]; then
        D_COVERS="${D_COVERS}D$(join_ctx "$pd_ctx" ".")
"
        continue
      fi
      case "$s" in
        */)
          dpath="$(join_ctx "$pd_ctx" "${s%/}")"
          D_COVERS="${D_COVERS}D${dpath}
"
          continue ;;
      esac

      rpath="$(join_ctx "$pd_ctx" "$s")"
      D_COVERS="${D_COVERS}L${rpath}
"
      # Enumerated-style probe: literal file (no glob) contributes its DIR.
      if ! has_glob "$s"; then
        D_LIT_DIRS="${D_LIT_DIRS}$(dir_of "$rpath")
"
      fi
    done <<INNER
$srcs
INNER
  done <<EOF
$pd_joined
EOF
}

# ---------------------------------------------------------------------------
# .dockerignore (supported subset, spec §4.1 step 3 + D10):
#   literal paths, directory prefixes, single-segment `*`, `**`.
#   `!` negations and anything else unparseable => treated as NOT excluding.
# Read from the context root at <branch>. Returns 0 (excluded) / 1 (not).
# ---------------------------------------------------------------------------
dockerignore_excludes() {
  di_ctx="$1"; di_file="$2"          # di_file is repo-relative (context-resolved)
  di_path="$(join_ctx "$di_ctx" ".dockerignore")"
  di_body="$(GIT show "$branch:$di_path" 2>/dev/null)" || return 1

  # Pattern paths in .dockerignore are context-relative; F is repo-relative.
  # Reduce F to its context-relative form for matching.
  di_rel="$di_file"
  if [ -n "$di_ctx" ]; then
    case "$di_file" in
      "$di_ctx"/*) di_rel="${di_file#"$di_ctx"/}" ;;
      *) return 1 ;;                  # F outside context -> ignore file can't cover it
    esac
  fi

  while IFS= read -r pat; do
    pat="${pat#"${pat%%[![:space:]]*}"}"      # ltrim
    pat="${pat%"${pat##*[![:space:]]}"}"      # rtrim
    [ -n "$pat" ] || continue
    case "$pat" in \#*) continue ;; esac
    case "$pat" in !*) continue ;; esac       # negation: unsupported -> not excluding
    pat="${pat#./}"                            # leading ./ is noise
    pat="${pat#/}"                             # leading / anchors to context root
    [ -n "$pat" ] || continue

    # `**` anywhere -> treat as match-all-descendants of the fixed prefix.
    case "$pat" in
      "**")  return 0 ;;                       # ** alone excludes everything
      "**/"*)
        suf="${pat#**/}"
        case "$di_rel" in *"$suf") return 0 ;; esac
        continue ;;
      *"/**")
        pre="${pat%/**}"
        case "$di_rel" in "$pre"/*|"$pre") return 0 ;; esac
        continue ;;
    esac

    # Single-segment `*` glob (e.g. `*.py`, `secret*`): match one path segment.
    if has_glob "$pat"; then
      case "$pat" in
        *"*"*)
          # Match against di_rel's basename OR the whole di_rel if single-segment.
          base_rel="${di_rel##*/}"
          # shellcheck disable=SC2254
          case "$base_rel" in $pat) return 0 ;; esac
          case "$di_rel"   in $pat) return 0 ;; esac
          continue ;;
        *) continue ;;                         # `?`/`[` unsupported -> not excluding
      esac
    fi

    # Directory prefix or literal path.
    case "$pat" in
      */)                                       # explicit dir prefix
        dp="${pat%/}"
        case "$di_rel" in "$dp"/*|"$dp") return 0 ;; esac ;;
      *)                                        # literal file OR dir prefix
        case "$di_rel" in "$pat"|"$pat"/*) return 0 ;; esac ;;
    esac
  done <<EOF
$di_body
EOF
  return 1
}

# covers_file: does D's parsed source set cover F (repo-relative)?
# Uses D_COVERS from the current Dockerfile's parse (the main loop parses each
# Dockerfile exactly once, in the outer loop, then reuses D_COVERS per added F).
covers_file() {
  cf_f="$1"
  while IFS= read -r c; do
    [ -n "$c" ] || continue
    tag="${c%"${c#?}"}"              # first char
    val="${c#?}"                     # remainder
    case "$tag" in
      D)                              # directory copy: covers F if under val/ (or val=="" -> all)
        if [ -z "$val" ]; then
          return 0                    # `COPY . .` — whole context
        fi
        case "$cf_f" in "$val"/*|"$val") return 0 ;; esac ;;
      L)                              # literal-or-glob source path
        if has_glob "$val"; then
          # Single-segment glob coverage: compare against F's basename when the
          # glob and F share a directory (docker globs don't cross `/`).
          gdir="$(dir_of "$val")"
          fdir="$(dir_of "$cf_f")"
          if [ "$gdir" = "$fdir" ]; then
            gbase="${val##*/}"
            fbase="${cf_f##*/}"
            # shellcheck disable=SC2254
            case "$fbase" in $gbase) return 0 ;; esac
          fi
        else
          [ "$val" = "$cf_f" ] && return 0    # exact literal match
        fi ;;
    esac
  done <<EOF
$D_COVERS
EOF
  return 1
}

# lit_dir_into: does any literal-file COPY source resolve into F's directory?
# (enumerated-COPY-style probe). Uses D_LIT_DIRS from the current Dockerfile's
# parse (the main loop parses each Dockerfile exactly once, in the outer loop).
lit_dir_into() {
  ld_dir="$1"                         # F's directory (repo-relative, "" for root)
  while IFS= read -r d; do
    # NB: an empty line here is a genuine root-dir ("") literal source, so we
    # cannot skip blanks; compare every line including the empty one.
    if [ "$d" = "$ld_dir" ]; then
      return 0
    fi
  done <<EOF
$D_LIT_DIRS
EOF
  return 1
}

# ---------------------------------------------------------------------------
# Main: for each Dockerfile D, parse it EXACTLY ONCE, then for each added F
# whose dir is contained by D's context dir, apply steps 1-4. Collect flagged
# "F -> D" pairs. Nesting is Dockerfile-outer / added-file-inner so each
# Dockerfile parses once (O(#Dockerfiles), not the old O(#files × #Dockerfiles)
# re-parse). The flagged-pair SET is loop-order-independent — the inversion may
# reorder pairs on stdout but never drops or adds one (the test proves this via
# a sort-both-sides set-equality plus pair-count check).
# ---------------------------------------------------------------------------

# Pre-filter the added files ONCE. Build-control files are never deployable
# artifacts: docker auto-excludes `.dockerignore` and the `-f` Dockerfile from
# what a COPY would need to pick up, so an ADDED one never wants a COPY line
# (adding a Dockerfile or a .dockerignore must never itself trip the floor).
# Filtering here, rather than per (F,D) pair, is behavior-identical to the old
# per-F skip.
scan_files=""
while IFS= read -r F; do
  [ -n "$F" ] || continue
  bF="${F##*/}"
  case "$bF" in
    .dockerignore) continue ;;
  esac
  if is_dockerfile "$F"; then
    continue
  fi
  scan_files="$scan_files$F
"
done <<EOF
$added_files
EOF

flagged=""

while IFS= read -r D; do
  [ -n "$D" ] || continue
  ctx="$(dir_of "$D")"

  # Parse this Dockerfile EXACTLY ONCE (fills D_LIT_DIRS / D_COVERS), then reuse
  # the result across every added file below.
  parse_dockerfile "$D"

  while IFS= read -r F; do
    [ -n "$F" ] || continue
    fdir="$(dir_of "$F")"

    # Dockerfile's context must contain F (ancestor-or-equal).
    is_ancestor_dir "$ctx" "$fdir" || continue

    # Step 1: enumerated-COPY style? >=1 literal-file source into F's dir.
    lit_dir_into "$fdir" || continue

    # Step 2: covered by any source (literal / glob / dir copy)?
    covers_file "$F" && continue

    # Step 3: excluded by context-root .dockerignore (supported subset)?
    dockerignore_excludes "$ctx" "$F" && continue

    # Step 4: flag.
    flagged="${flagged}${F} -> ${D}
"
  done <<EOF
$scan_files
EOF
done <<EOF
$dockerfiles
EOF

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
if [ -n "$flagged" ]; then
  printf '%s' "$flagged"             # F -> D pairs on stdout (already newline-terminated)
  exit 1
fi
exit 0
