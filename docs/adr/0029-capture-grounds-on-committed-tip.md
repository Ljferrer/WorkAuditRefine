# Capture grounds on the committed tip, not the working tree

**Status:** accepted

Two recorded frictions show a *capture* step — the servitor recording a learning, an auditor forming a
verify-and-close verdict — trusting a surface that does not match the committed tree, so a fact enters the
record naming code that is not there:

- **[[audit-log-finding-can-be-stale-by-land-time]]** — the audit log is the assembled record across a
  task's audit + fix-round history, so a finding can name a defect a fix round already resolved *before*
  land. Three near-duplicate findings named a tautological IIFE test in `campaign-ledger.test.mjs` that did
  not exist at the landed tip. The servitor's D3 verify-on-write confirms the referent *file* exists — not
  that the specific finding still *matches* — so a stale gotcha entered memory with a file/line that no
  longer described the code.
- **[[verify-and-close-claim-can-trace-to-transient-uncommitted-edit]]** — "already remediated" /
  verify-and-close classifications were formed by grepping the **working tree**. A transient uncommitted
  (later reverted) edit produces a grep hit that lies about the committed tree; v0.8.0 #267 read a `grep`-0
  during an uncommitted window and misclassified a real fix as a no-op. A recurring class with
  [[audit-worktree-pre-impl-tip-stale-verdict]].

The through-line: **a capture verdict was computed against a mutable surface (a persisted log line, a
dirty working tree) instead of the committed tip the fact is supposed to describe.** Full mechanics:
[the design spec](../specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md) (frictions 4–5,
§4.4/§4.6) and [the plan](../plans/2026-07-08-memory-and-lessons-learned-hygiene.md).

## Decision

**Every capture verdict grounds on the committed tip, not a mutable surface.** Concretely:

1. **The servitor's D3 gains a finding-match check for audit-log-sourced facts.** Before recording an
   audit finding as a live gotcha, the servitor re-Grep/Reads the **named construct** — the specific
   defect (e.g. the tautological test), not merely the file — at the landed tip. Construct still matches →
   `code-verified`, keep the file/line locate-cue. Construct no longer matches (fixed in-flight) → record
   only the **generic pattern/rule** at `agent-unverified`, **never** the file/line as a current instance,
   with the note *"audit finding resolved in a fix round before land — recorded as pattern, not live
   instance."* This is the servitor's existing Read/Grep capability, no new tool.
2. **The servitor grounds on a threaded landed-tip anchor, not its own working tree.** Running after land
   does not mean seeing the landed tip: the servitor's threaded cwd is a session-scoped checkout frozen at
   provision time ([ADR 0001](0001-explicitly-managed-worktrees.md)), and nothing re-syncs it after land.
   [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] recorded 11 recurrences of that
   failure (2026-07-10 → 2026-07-19, across five campaigns); the **modal** case at wrap-up time is the
   main checkout with **zero live worktrees** — no `.git/worktrees/` entry to read the landed branch from,
   and in the most recent shape not even a locally fetched ref for it. So the engine threads a
   `Landed tip:` line into the Wrap-up dispatch (the handoff block's `tipSha` computation — the landed
   `working_sha`, else the last SHA-shaped `gateHeadSha`, else a named placeholder — hoisted above the
   Wrap-up gate so it is populated on every landed dispatch). Both prompt surfaces
   (`agents/war-servitor.md` and the dispatched Wrap-up prompt in `skills/war/assets/workflow-template.js`)
   carry one shared four-step grounding ladder ahead of any D3/finding-match read: (1) cwd preflight —
   compare the checkout's own HEAD against the threaded tip and working branch; (2) `gitdir`-matched
   worktree lookup — enumerate `.git/worktrees/*` and match by each entry's physical path against this
   plan's slug, never by bare name (names collide across concurrent plans); (3) ref check — a resolvable
   ref with no live worktree is still a dead end for Read, spend no rounds on it; (4) gate-audit fallback
   — trust the pinned `auditSha` verdicts (`gateEvidence:true`) and record anything else
   `agent-unverified` with the checkout-topology evidence in the absence note, never asserting a
   plan/code mismatch from a lagging view. The servitor gains no new capability — still no Bash, still
   Read/Grep/Glob only, [ADR 0002](0002-scope-by-agent-type.md) unwidened — it is told which tip to ground
   against instead of assuming its own cwd already is that tip. Full mechanics:
   [the design spec](../specs/2026-07-22-servitor-wrapup-landed-tip-design.md) and
   [the plan](../plans/2026-07-22-servitor-wrapup-landed-tip.md).
3. **Auditor verify-and-close / already-done no-op claims ground against the pinned `audit_sha`.** The
   blob read is `git show <audit_sha>:<path>` (already in the allowlist — `show`); history-shaped
   questions use `git log -S<token>` / `git log -G<regex>` (already allowlisted — `log`), chosen per claim
   shape (`-S` answers "when did this token count change", not "is the token present at the path"). The
   working-tree grep may run as an advisory pre-check but **must never be the sole basis** for a
   verify-and-close verdict.
4. **The auditor git allowlist admits `git grep` in policed forms only.** On Claude Code 2.1.304 every
   auditor seat ran with `Read`, `Bash` and `StructuredOutput` only (43 of 43 auditors across two
   workflow runs had no `Grep` tool), so a verify-and-close claim had no search channel but whole-file
   Reads (plan [2026-10-20-rea-artifact-evidence](../plans/2026-10-20-rea-artifact-evidence.md) D21).
   `hooks/validate-auditor-git.sh` therefore admits `git grep` with `-F` (or `--fixed-strings`) or `-E`
   as its regex selector — exactly one of the two is required, so `-E -F` together denies — plus one or
   more `-e <token>` (each value is data, as git reads it), optional `-n`, `-i`, `-l`, `-w`, `-c` (bare or
   in a short cluster parsed letter by letter), the context counts `-A <n>`, `-B <n>`, `-C <n>` and
   `-A<n>` (digits only, each its own token), at most one revision, and an optional
   `-- <pathspec>...` with no glob bytes. A quoted `-e` value that starts with `-` (`-e '- AMEND-'`) is
   masked as its own word and admitted only where the grep parser reads it as an `-e` value, so no flag
   rides in a quote. These stay denied, each for its own reason: `-O` / `--open-files-in-pager` runs a
   pager command, in any spelling or cluster; `-f` / `--file` reads patterns from a file; `--no-index`
   searches files outside the repository; `--recurse-submodules` leaves the repository for its
   submodules; `-P` is a second regex engine, and `-E` covers alternation; `-G` and the long regex
   selectors are refused, so the form keeps one short spelling per selector. Every other token denies by
   shape. The seat rule on the three contract surfaces (`agents/war-auditor.md`, the dispatched READ-ONLY
   GIT GUARD CONTRACT literal, `agents/war-evidence-auditor.md`) is "the Grep tool first; with no Grep
   tool, `git grep -F -e <token>`", and deny messages that point at the Grep tool also name the fallback
   form. `git branch` also admits `--list` followed by one pattern word, bare or quoted; every write flag
   still denies. The live flag list is the `grep_deny` helper in `hooks/validate-auditor-git.sh`; group
   GF of `hooks/validate-auditor-git.test.sh` pins each admitted and denied form and runs every admitted
   form under real git, and group P pins the grammar's deny set (plan
   [2026-11-08-auditor-and-worker-guard-habits](../plans/2026-11-08-auditor-and-worker-guard-habits.md)
   PIN-1 to PIN-5; #1915, #2374, #2581, #2583, #2627). The verb set does not grow, and no write opens.
5. **The guard admits quoted values at listed token positions (#2374).** Seats wrote `-S"token"`,
   `-G'a[b]'`, `git grep -F -e "two words"` and `'sha:app/[id]/f'`, and a card that said `-e <token>`
   takes one bare word made seats split text (`-e Task 2.7`) or write `&#32;` for a space; local
   transcripts held 13,015 guard denials across plugin versions, and single-token quoting was the largest
   class the guard could admit safely. The Grep tool searches one checkout, so it does not replace `-S`
   or `-G` over a range. `hooks/validate-auditor-git.sh` swaps each admitted quoted value for one plain
   word before every other rule runs, so a value can only sit where a plain word could. A value is
   admitted when its opening quote starts the token or follows `-S`, `-G`, `-L`, `--grep=`, `--format=`,
   `--pretty=` or those last two with `format:` or `tformat:`, its closing quote ends the token, its body
   is not empty, a bare body does not start with `-`, a double-quoted body holds none of `$`, a backtick,
   `\` or `!`, and the command holds at most eight values, and the body holds neither control byte the
   fingerprint hook uses as a stand-in. Anything else stays denied by the residue rule. The `git grep`
   `<token>` and its pathspecs may be one quoted value. Pipes, chains, redirects, `-c`, `--exec-path`,
   `--output` and `fetch` stay denied. The guard denies `--ext-diff`, `--textconv` and `--filters`: each
   runs a command named in git config. `cat-file` reads any unique flag prefix, so the guard denies every
   `--t` and `--fi` spelling on that verb. It also denies `--help`, which starts `man`. A plain
   `git diff` still honors a configured `diff.external`, diff, log, show and blame still honor a
   configured textconv driver, and a signature read still honors `gpg.program`; a seat cannot write that
   config. The guard collapses repeated spaces before its rules run, as the shell does: its `-C` peel and
   flag scans match single spaces, so `git -C  log push` would read as verb `log` and run `push`. The
   residue deny names one of four rules: chain-operator, grouping (redirect, grouping or continuation),
   metacharacter, or the quote rule for a refused quote. The metacharacter and grouping messages print
   the quoted rewrite of the offending word.
6. **The audit tree fingerprint hook is the compensating control.** Admitting a search verb widens what a
   read-only seat can run, so the audit tree fingerprint hook fingerprints the audited worktree at seat
   start and rewrites any verdict returned over a changed tree to `escalate` with an `AUDIT-TAMPER:`
   reason, failing closed when it cannot compute a fingerprint (plan 2026-10-20-rea-artifact-evidence
   Task 6.2). It splits a Bash command by the same quote rule (`quote_words`), so a quoted operand with a
   space still names the worktree it reads. The seat's confinement still rests on the guard; the hook is
   the detector behind it.

## Relationship to prior ADRs

- **Extends [ADR 0007](0007-memory-provenance.md).** The provenance ladder already forbids recording a
  fact as `code-verified` with a live file/line unless its referent is confirmed; the finding-match check
  sharpens "referent exists" into "the finding still matches", degrading an unmatched finding to the
  generic pattern at `agent-unverified`. It adds no new tier.
- **Pairs with [ADR 0024](0024-audit-gate-verdicts-integrated-tip-captured-evidence.md).** The pinned,
  validated `audit_sha` this ADR grounds on is supplied by ADR 0024's pin-to-integrated-tip machinery;
  this cluster **consumes** that SHA, it does not build it (which is why the plan lands after the
  audit-gate-verdict-fidelity plan).
- **Respects [ADR 0002](0002-scope-by-agent-type.md).** The auditor's guard admits only the read-only
  forms above; the servitor gains no Bash and no new capability — it grounds on the threaded landed tip
  (Decision 2), never on the assumption that its working tree reflects the committed tip.
- **Rides [ADR 0025](0025-drift-guard-discipline.md).** The servitor finding-match clause and the auditor
  committed-grounding clause are each dispatched-prompt copies of a standing `agents/*.md` directive; a
  both-surfaces drift-guard in `workflow-template.test.mjs` fails if either surface lacks its clause.
- Prior ADRs are rewritten in place under the living-ADR law ([ADR 0063](0063-living-adrs-git-is-the-archive.md)).

## Considered options

- **Widen the auditor allowlist to add a `grep` verb (rejected — deferred; later admitted in policed
  forms, Decision 4).** A read-only `git grep <sha>` would be convenient, but `git show <sha>:<path>` +
  `git log -S` cover the verify-and-close need, and widening enlarges the auditor read surface for
  marginal convenience. Deferred to a future spec if a real search-shaped verify-and-close case demands
  it. The 2026-07-22 auditor-guard-ergonomics spec (D3) and the 2026-07-26
  [auditor-guard-policy-and-mirror-truth spec](../specs/2026-07-26-auditor-guard-policy-and-mirror-truth-design.md)
  (D2, answering #1138) re-ratified the rejection, the second adding a harder argument: `git grep
  -O<cmd>` / `--open-files-in-pager` executes an arbitrary pager command, and the guard's fail-closed
  character allowlist cannot tell that shape from a benign search, so admitting the verb needs per-flag
  policing. Each rejection rested at least in part on *sufficiency* — the unrestricted Grep tool was the
  sanctioned sweep channel — and that premise failed at dispatch when seats ran with no Grep tool. The
  admitted forms carry the per-flag policing the `-O` argument demanded, and `-O` stays denied by name.
- **Back-fix already-polluted memory (out of scope).** Repairing the existing stale
  `campaign-ledger.test.mjs` finding is a `/lessons-learned` housekeeping pass, not a code change; this
  ADR prevents *new* pollution.
- **One ADR covering both halves of the cluster (rejected — chose two).** The housekeeping-tooling changes
  ([ADR 0028](0028-memory-store-integrity-tool-enforced.md)) and the capture-grounding changes touch
  disjoint subsystems; a reader looking up either should find a scoped record.

## Consequences

- `GLOSSARY.md` gains two of the five new terms in this cluster — **Finding-match check** and
  **Committed-tree grounding** (the other three land with [ADR 0028](0028-memory-store-integrity-tool-enforced.md)).
- Re-Grep per audit finding adds bounded Read/Grep calls at capture time (finding count per phase is
  small); no new tool, no Bash — within existing confinement.
- The doctrine ships to marketplace-pinned users via a version bump of the four release slots.
- Named residual: obedience is prompt-enforced — the drift-guard proves both surfaces carry the clause,
  not that a live servitor/auditor honors it; the first landed phase after this and the next VERIFY-shaped
  `/war` task are the declared backstop runners.

## References

- Design spec:
  [`docs/specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md`](../specs/2026-07-08-memory-and-lessons-learned-hygiene-design.md)
  — frictions 4–5, the resolved design tree, and validation criteria 7–8.
- Implementation plan:
  [`docs/plans/2026-07-08-memory-and-lessons-learned-hygiene.md`](../plans/2026-07-08-memory-and-lessons-learned-hygiene.md).
- [ADR 0007](0007-memory-provenance.md) — the provenance ladder the finding-match check extends
  (`code-verified` → `agent-unverified` degrade for an unmatched finding).
- [ADR 0024](0024-audit-gate-verdicts-integrated-tip-captured-evidence.md) — the pin-to-integrated-tip
  machinery supplying the `audit_sha` this ADR grounds verify-and-close on.
- [ADR 0002](0002-scope-by-agent-type.md) — the auditor read-only allowlist and servitor confinement.
- [ADR 0025](0025-drift-guard-discipline.md) — the both-surfaces discipline the servitor and auditor
  clauses ride.
- [ADR 0028](0028-memory-store-integrity-tool-enforced.md) — the housekeeping-tooling half of this cluster.
- Memory lessons (the originating friction cluster):
  [[audit-log-finding-can-be-stale-by-land-time]], [[verify-and-close-claim-can-trace-to-transient-uncommitted-edit]],
  [[audit-worktree-pre-impl-tip-stale-verdict]], [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]].

## Decision log

- 2026-07-22 · capture grounds on a threaded landed-tip anchor, not the servitor's own working tree · servitor wrap-up landed-tip plan · failed because: "runs after land" never implied "sees the landed tip" — the servitor's cwd lagged the landed phase in 11 recurrences · retired: docs/adr/0029-capture-grounds-on-committed-tip.md @ c0f2f0d3
- 2026-07-26 · D2 third ratification of the grep-verb rejection · #1138 · retired: docs/adr/0029-capture-grounds-on-committed-tip.md @ 525d5e2b
- 2026-10-22 · the auditor git guard admits `git grep -F -e <token>` (fixed-string, one `-e`, optional `-n -i -l -w -c`, one revision, `-- <pathspec>`) and denies every other grep form, `-O` in any spelling or cluster by name; reverses the 2026-07-26 "still no" because no seat had the Grep tool on Claude Code 2.1.304; the audit tree fingerprint hook is the compensating control · plan 2026-10-20-rea-artifact-evidence D21/D22, Task 6.1 · failed because: every rejection rested on the Grep tool's sufficiency, and no seat had the Grep tool · retired: docs/adr/0029-capture-grounds-on-committed-tip.md @ 6964f6d5
- 2026-10-30 · the auditor git guard admits one quoted value at a listed token position, widens the `git grep -F -e` token and pathspecs to one quoted value, denies `--ext-diff`, `--textconv` and `--filters`, and collapses repeated spaces; the fingerprint hook splits commands by the same quote rule · #1915, #2162, #2374 · retired: docs/adr/0029-capture-grounds-on-committed-tip.md @ 8d72625f
- 2026-11-05 · the glossary moved to GLOSSARY.md · #2636 · retired: docs/adr/0029-capture-grounds-on-committed-tip.md @ b31d2203
- 2026-11-08 · the auditor git guard's `git grep` form widens to several `-e`, `-A/-B/-C <n>` and `-A<n>`, `-E` as the second selector and a dash-led quoted `-e` value; `-O`, `-f`, `--no-index`, `--recurse-submodules`, `-P` and `-G` stay denied; `git branch --list` takes one pattern word; the residue deny names one of four rules (chain-operator, grouping, metacharacter, quote) · plan 2026-11-08-auditor-and-worker-guard-habits PIN-1 to PIN-5, #1829, #1915, #2374, #2581, #2583, #2627 · retired: docs/adr/0029-capture-grounds-on-committed-tip.md @ ca47abf5
