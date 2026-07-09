# Memory-store hygiene — archive-aware link verification, non-destructive tooling defaults, committed-tree capture

**Status:** proposed. **Severity:** medium. **Enforcement target:** mostly-mechanical — convert prose-only housekeeping discipline into tool-emitted checks (a `war-memory` inbound-link count, a dry-run-by-default `--candidates`, a servitor referent-match obligation, committed-SHA grounding), leaving only the curation *judgment* (which hub to keep, which lesson to compress) to the operator. **Targets** the next free patch (current v0.14.14; version literals here are non-authoritative — resolve at land time from the four release slots).

**Addresses (memory lessons):** retiring-a-resolved-memory-must-check-inbound-links-hubs-stay, dangling-link-verdict-must-check-archive-before-removal, lessons-learned-tooling-traps, audit-log-finding-can-be-stale-by-land-time, verify-and-close-claim-can-trace-to-transient-uncommitted-edit

**Source:** memory cluster mined 2026-07-08 (group *"Protect memory-store integrity: link/archive-aware retirement, safe tooling defaults, committed-tree capture"*). Depends on `docs/specs/2026-07-08-audit-gate-verdict-fidelity-design.md` (build after it — see §8/§9). Respects ADR 0002 (scope-by-agent-type), ADR 0007 (memory provenance), ADR 0008 (git is the resume source of truth), ADR 0015 (files-canonical memory), ADR 0022 (servitor local-root writes / Gate-2 promotion).

---

## 1. Context — the gap / problem

The memory subsystem is files-canonical (ADR 0015): one durable lesson = one Markdown file across a **hot** root and a cold `archive/`, projected into a generated `MEMORY.md`. Housekeeping (`/lessons-learned`) and per-phase capture (the servitor) both mutate that store. Five recorded frictions show the store losing integrity across those passes, and in every case the invariant that *should* have held was carried in prose, not in a tool:

- **[retiring-a-resolved-memory-must-check-inbound-links-hubs-stay]** (local). The retire/merge flow can strip a `resolved` lesson that is still a *concept hub* — a vocabulary node that siblings cite as "same family as …". The 2026-06-30 pass removed two hubs and orphaned ~16 inbound `[[wikilinks]]` (`[[auditor-cannot-execute-the-tests-it-must-verify-pass]]`, 9 refs; `[[done-add-on-soft-failure-unblocks-true-dependents]]`, 7 refs). The Phase-3 hub-link grep exists in `skills/lessons-learned/SKILL.md`, but only as prose the agent may skip.

- **[dangling-link-verdict-must-check-archive-before-removal]** (repo). During a pass, fan-out verifier agents classify a `[[link]]` as "dangling" from a **hot-only** check (`ls <staging>/<slug>.md`), never consulting `archive/`. A 2026-07-04 run would have severed 6 of 7 *live cold links* — links into `archive/<slug>.md` that `safe-swap.sh`'s `resolves_in()` already treats as resolved. The central verify tool is archive-aware; the dispatched verifier *prompt* is not, and it is the verifier that recommends removal.

- **[lessons-learned-tooling-traps]** (repo). `war-memory archive --candidates` reads like a query but is a *mutation*: `cmdArchive` sets `slugs = buildProjection(records).candidates` and archives every one. At a render `refuse` verdict that is the **entire hot set**. The only guard today is the SKILL gotcha "archive explicit slugs only" — prose in front of a loaded gun (behavior unchanged as of v0.14.6).

- **[audit-log-finding-can-be-stale-by-land-time]** (repo). The audit log is the assembled record across a task's audit + fix-round history, so a finding can name a defect a fix round already resolved before landing. Three near-duplicate findings named a tautological IIFE test in `campaign-ledger.test.mjs` that *did not exist at the landed tip*. The servitor's D3 verify-on-write confirms the referent *file* exists — not that the specific finding still matches — so a stale gotcha enters memory with a file/line that no longer describes the code.

- **[verify-and-close-claim-can-trace-to-transient-uncommitted-edit]** (local). "Already remediated / verify-and-close" classifications are formed by grepping the **working tree**. A transient uncommitted (later reverted) edit produces a grep hit that lies about the committed tree — v0.8.0 #267 read a `grep`-0 during an uncommitted window and misclassified a real fix as a no-op. Recurring class with `[[audit-worktree-pre-impl-tip-stale-verdict]]`.

The through-line: **every integrity-preserving step is a remembered discipline, not a mechanical one.** This spec ratifies moving each into the tooling, keeping only genuine curation judgment human.

## 2. Pivotal constraints

1. **Archive is never deletion (ADR 0015 / CONTEXT.md *Temperature*).** A cold lesson in `archive/` stays queryable and its inbound `[[links]]` still resolve. So the *archive* path is already link-safe; the orphaning risk is a true `rm`, and the hub-visibility risk is dropping a concept anchor's **hot index row**. Any fix must not conflate "archive" with "delete".
2. **Files are canonical; `MEMORY.md` is a derived projection (ADR 0015).** Never enforce integrity by hand-editing the index — enforcement lives in `war-memory`/`safe-swap` and re-renders.
3. **The live store is read-only until the verified atomic swap (`safe-swap.sh`).** New checks run against `$STAGING`, never `$MEM`; a failed check blocks the swap, it does not touch the live dir.
4. **Servitor confinement (ADR 0002 / ADR 0022): no Bash.** The servitor's tools are Read/Grep/Glob/Write/Edit. It cannot run `git`. But it runs **after land**, so its working tree *is* the landed committed tip — Read/Grep there already reflects the committed state. Its gap is *semantic* (does the finding still match?), not *tree-freshness*.
5. **Auditor confinement (ADR 0002): read-only git allowlist, `fetch` excluded** (`validate-auditor-git.sh`: `diff/log/show/merge-base/rev-parse/status/ls-files/cat-file/blame`). Committed-tree grounding for the auditor must use verbs already in that set — `git show <sha>:<path>` is allowed; `git grep` is **not** — or explicitly widen the allowlist.
6. **Provenance ladder (ADR 0007).** A finding that cannot be re-confirmed against the landed tip may not be recorded as `code-verified` with a live file/line; it degrades to the generic pattern at `agent-unverified`.
7. **Prose → mechanism where a friction says "not code-enforced"** (project doctrine). Prefer a `war-memory` subcommand / flag default / drift-guarded prompt clause over a new remembered rule.
8. **Ordering:** the committed-tree-capture half depends on the pin-to-integrated-tip + evidence-gated verdict machinery ratified in `2026-07-08-audit-gate-verdict-fidelity-design.md`; build that first (§8/§9).

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| **How to stop retiring a concept hub** ([retiring-a-resolved-memory…]) | Add `war-memory inbound <slug> [--repo]` that counts hot inbound `[[slug]]` refs across both roots, and have `war-memory archive` **emit the inbound count per slug and WARN** (non-zero exit note, does not block) when archiving a slug with ≥2 hot inbound refs. The SKILL Phase-3 grep becomes a *tool call whose count the agent must report*, not a prose step. The downgrade-to-stub decision stays operator/agent judgment, but it is now fed a mechanical count it cannot silently skip. |
| **Whether archiving orphans the links at all** | No — archived links resolve via `resolves_in()`. So the hub concern is purely the lost **hot index row**; the true-`rm` orphan case is already caught by `safe-swap verify`'s archive-aware dangling check. We do **not** add a rm-blocker (the pipeline no longer `rm`s). |
| **Dangling verdict must consult `archive/`** ([dangling-link-verdict…]) | Make `safe-swap.sh verify` (already archive-aware via `resolves_in()`) the **sole authority** on link removal. Fan-out verifier agents are forbidden from recommending link removal on a hot-only `ls`; the SKILL verifier prompt states the three-way **HOT / COLD / MISSING** trichotomy and routes all dangling adjudication through the central check. Lock the archive-aware semantics with a `safe-swap.test.sh` case. |
| **`archive --candidates` is a footgun** ([lessons-learned-tooling-traps]) | Flip the default to **non-destructive**: `--candidates` alone **lists** the ranked candidates and mutates nothing (dry-run); mutation requires an explicit second flag (`--apply`) or an explicit slug list. `archive <slug>…` (explicit slugs) is unchanged. A `war-memory` test asserts `--candidates` without `--apply` moves zero files. |
| **Stale audit-log finding pollutes memory** ([audit-log-finding…]) | Extend the servitor obligation (D3): before recording an **audit finding** as a live gotcha, re-Grep/Read the *named construct* at the landed tip. Match → `code-verified` with the file/line locate-cue. **No match** → record only the **generic pattern** at `agent-unverified`, never the file/line as a current instance. Mirror the clause into the dispatched servitor prompt in `workflow-template.js`. |
| **Verify-and-close grep lies from a dirty tree** ([verify-and-close-claim…]) | Ground "already-done" / verify-and-close claims against a **committed SHA**, not the working tree: `git show <sha>:<path>` (auditor-allowed) for a blob read, `git log -S/-G <sha>` for a search; the working-tree grep is advisory only. The reference SHA is the auditor's pinned `audit_sha` (from the dependency spec's pin-to-integrated-tip machinery). Where a search verb is wanted, either use `git show <sha>:<path>` piped to grep in a follow-up read or widen the auditor allowlist to add `grep` (read-only, safe) — decided in §4. |

## 4. Mechanics

### 4.1 `skills/_shared/war-memory.mjs` — non-destructive `--candidates` + inbound count

- **`cmdArchive`.** Today: `if (argv.candidates) { slugs = buildProjection(records).candidates }` then moves each. Change: when `argv.candidates` is set and `argv.apply` is **not**, print the ranked candidate list (reuse `archiveCandidates`/`buildProjection`) to stdout and **return without mutating** — a dry-run listing. Mutation happens only with `--candidates --apply`, or with an explicit `argv._.slice(1)` slug list (unchanged path). The render `refuse`/`warn` messages that mention `--candidates` are reworded to say it *lists*; the "`archive <slug>…` archives just the ones you pick" half stays.
- **New `war-memory inbound <slug> [--repo <root>]`.** Walk both roots (reuse `walkCorpus`), count files whose body contains `[[<slug>]]` (exclude the slug's own file). Print the count and the citing slugs. Pure read; `requireLocal` not required (read-only over whatever roots resolve). This is the mechanical form of the SKILL Phase-3 grep.
- **`cmdArchive` inbound WARN.** For each slug about to be archived, compute its hot inbound count; if ≥2, write a `WARN: archiving concept hub '<slug>' (<n> inbound refs) — its index row disappears; consider keep-compress stub` line to stderr. Non-blocking (archive is link-safe; this surfaces the lost hot row for the operator). 
- **Tests (`war-memory.test.mjs`):** (a) `--candidates` without `--apply` archives zero files and lists candidates; (b) `--candidates --apply` archives the ranked set; (c) `inbound` returns the correct count and excludes self; (d) archiving a ≥2-inbound slug emits the hub WARN.

### 4.2 `skills/lessons-learned/assets/safe-swap.sh` — central archive-aware authority (already correct; lock it)

`do_verify`'s `resolves_in()` already treats `<dir>/archive/<slug>.md` as resolved for both the index-row hard-fail and the dangling-link warn. No behavior change needed — this makes it the **single source of truth** for link classification. Add a `safe-swap.test.sh` case (if not already present) asserting: a `[[link]]` whose target lives only in `archive/<slug>.md` is reported `ok    no dangling wikilinks` (not flagged), and a link to a slug in neither hot nor `archive/` **is** flagged. This freezes the archive-aware semantics against future edits.

### 4.3 `skills/lessons-learned/SKILL.md` — verifier prompt trichotomy + tool-emitted hub count

- **Phase-2 verifier prompt (fan-out agents).** State explicitly: a verifier **never** recommends removing a `[[link]]` or index row from a hot-only `ls <staging>/<slug>.md`. Every link target is one of **HOT** (`<root>/<slug>.md` — keep), **COLD** (`<root>/archive/<slug>.md` — keep, legal cold link), or **MISSING** (in neither — the only removal candidate). All dangling/row adjudication is deferred to the central `safe-swap verify`, which is archive-aware. Reword any "check the staging dir" phrasing that currently produces the hot-only `ls`.
- **Phase-3 hub check.** Replace the prose grep with a `war-memory inbound <slug>` call for every `retire`/`merge` candidate; the agent must report the count. The ≥2-refs → keep-compress-stub rule (SKILL lines ~108–111 and gotcha ~186) stays as the decision, now driven by a tool count rather than a remembered grep. The existing "≥2 inbound refs → concept hub, do not delete, downgrade to a `**RESOLVED — kept as concept anchor.**` stub with its index row" text is retained verbatim.

### 4.4 `agents/war-servitor.md` — D3 extended to finding-match, not just referent-existence

Today D3 (verify-on-write) is: referent found → `code-verified` + locate-cue; absent → `agent-unverified` + absence note. Add a clause for **audit-log-sourced facts** specifically: an audit finding names a construct that a later fix round may have already resolved *before* land, and the finding text persists in the log after its referent stops matching. So before recording an audit finding as a live gotcha, re-Grep/Read the **named construct** (the specific defect, e.g. the tautological test, not merely the file) at the landed tip:
- Construct still matches → `code-verified`, keep the file/line locate-cue.
- Construct no longer matches (fixed in-flight) → record only the **generic pattern/rule** at `agent-unverified`; **never** cite the file/line as a current instance. Note "audit finding resolved in a fix round before land — recorded as pattern, not live instance." 

This is the servitor's existing Read/Grep capability (no new tool; its post-land working tree *is* the committed tip, per constraint 4).

### 4.5 `skills/war/assets/workflow-template.js` — mirror the servitor clause into the dispatched prompt

Per the standing-instruction-vs-dispatched-prompt split, the servitor's dispatched prompt is string-built in `workflow-template.js` (near `servitorMemClause`). The §4.4 finding-match obligation must be added there in the same change, or it reaches the standing `agents/war-servitor.md` only. Add the drift-guard/`workflow-template.test.mjs` assertion that both surfaces carry the finding-match clause (mirrors the existing both-surfaces coverage pattern).

### 4.6 Auditor verify-and-close — committed-SHA grounding

The "already remediated / verify-and-close" no-op classification must be computed against the pinned `audit_sha`, not the working tree:
- **Blob read:** `git show <audit_sha>:<path>` — already in the auditor allowlist (`show`). This is the primary mechanism and needs no confinement change.
- **Search:** `git log -S<token> <audit_sha>` / `git log -G<regex> <audit_sha>` — `log` is allowlisted. `git grep <sha>` is **not** allowed (grep excluded from `validate-auditor-git.sh`). **Decision:** do not widen the allowlist for this spec — `git show <sha>:<path>` covers the verify-and-close read, and `git log -S` covers history search. Widening to `grep` is deferred (§9) as it enlarges the auditor surface for marginal convenience.
- The working-tree grep may still run as an advisory pre-check but **must not be the sole basis** for a verify-and-close/no-op verdict. The prompt clause naming `audit_sha` as the ground truth lives in the auditor surface(s) the dependency spec pins; this spec adds the "no-op claims ground against `git show <audit_sha>:<path>`, not the dirty tree" sentence and its both-surfaces mirror. Depends on the dependency spec supplying the pinned, validated `audit_sha` (§8).

## 5. Surface changes (files touched)

- `skills/_shared/war-memory.mjs` — `cmdArchive` (dry-run default for `--candidates`, `--apply` gate, hub WARN); new `inbound` subcommand + dispatch; reworded refuse/warn projection messages.
- `skills/_shared/war-memory.test.mjs` — candidates dry-run, `--apply`, `inbound` count, hub WARN cases.
- `skills/lessons-learned/assets/safe-swap.sh` — no behavior change; freeze archive-aware semantics.
- `skills/lessons-learned/assets/safe-swap.test.sh` — cold-link-not-dangling and true-missing-flagged cases.
- `skills/lessons-learned/SKILL.md` — verifier HOT/COLD/MISSING trichotomy; Phase-3 grep → `war-memory inbound` tool call.
- `agents/war-servitor.md` — D3 finding-match clause for audit-log-sourced facts.
- `skills/war/assets/workflow-template.js` — mirror the servitor finding-match clause into the dispatched prompt.
- `skills/war/assets/workflow-template.test.mjs` — both-surfaces drift guard for the finding-match clause.
- `agents/war-auditor.md` + the auditor dispatched prompt in `workflow-template.js` — verify-and-close claims ground against `git show <audit_sha>:<path>` (coordinated with the dependency spec's pin surface).
- `CONTEXT.md` — new terms (§6).
- `docs/adr/` — new ADR(s) per §7.

## 6. New domain terms (CONTEXT.md)

- **Concept hub** — a lesson that is dead as a bug warning yet load-bearing as a vocabulary anchor (≥2 inbound `[[links]]`). Archived only with an explicit hub WARN; when its rule is resolved, downgraded to a compressed `RESOLVED — kept as concept anchor` stub that retains its hot index row rather than removed. *Avoid:* treating inbound-ref count as staleness.
- **Link trichotomy (HOT / COLD / MISSING)** — the three-way classification of a `[[wikilink]]` target: HOT (`<root>/<slug>.md`, keep), COLD (`<root>/archive/<slug>.md`, keep — a legal cold link), MISSING (neither — the only removal candidate). Adjudicated centrally by `safe-swap verify`, never by a hot-only `ls` in a fan-out verifier.
- **Non-destructive default (`--candidates`)** — a flag that *reads like a query lists like a query*: `war-memory archive --candidates` reports the ranked set and mutates nothing; mutation requires `--apply` or explicit slugs. *Avoid:* a query-shaped flag that mutates by default.
- **Finding-match check** — the servitor's obligation to re-confirm that an audit finding's *named construct* still matches at the landed tip before recording it as a live gotcha; an unmatched finding degrades to a generic pattern at `agent-unverified` (extends D3 verify-on-write, which checks referent existence only).
- **Committed-tree grounding** — resolving an "already-done" / verify-and-close claim against a pinned committed SHA (`git show <audit_sha>:<path>`) rather than the working tree, so a transient uncommitted edit cannot fabricate the verdict.

## 7. Recommended ADRs

- **ADR 0023 — Memory-store integrity is tool-enforced, not prose-enforced.** Ratifies: `--candidates` is non-destructive by default; archive emits inbound-hub counts; the archive-aware `safe-swap verify` is the sole link-removal authority; concept hubs are downgraded-to-stub, never dropped. (One ADR covering the housekeeping-tooling half — frictions 1–3.)
- **ADR 0024 — Capture grounds on the committed tip, not the working tree.** Ratifies: the servitor's finding-match check (record the generic pattern, never a stale file/line) and committed-SHA grounding for verify-and-close claims (`git show <audit_sha>:<path>`). Extends ADR 0007 (provenance) and pairs with the dependency spec's pin-to-integrated-tip ADR. (Capture half — frictions 4–5.)

Two ADRs, not one: the housekeeping-tooling changes and the capture-grounding changes touch disjoint subsystems and land in separate phases; a reader looking up either should find a scoped record.

## 8. Open risks / implementation notes

- **Ordering / dependency.** §4.6 needs a *pinned, validated* `audit_sha` and the evidence-gated verdict surfaces that `2026-07-08-audit-gate-verdict-fidelity-design.md` ratifies. Build this spec **after** it. If sequenced before, the committed-tree-grounding clause has no canonical SHA to reference and the auditor-surface edit will collide with the dependency spec's edits to the same prompt strings.
- **Same-file collision (decomposition).** §4.5 and §4.6 both edit `workflow-template.js` (servitor clause and auditor clause) — they are the same file and must **not** be parallel tasks in one phase (they rebase-conflict at the serial merge). Sequence them, or make one task own both edits. Likewise `agents/war-auditor.md` is touched by both this spec and the dependency spec — coordinate at plan time.
- **Hub WARN is advisory, not blocking.** Archiving is link-safe, so blocking archive on inbound count would be a false gate. The residual risk (an operator archives a hub and loses its hot row despite the WARN) is accepted — the count is surfaced, the decision stays human. A hard block belongs only on a true `rm`, which the pipeline no longer performs.
- **`git log -S` is line-content search, not a full grep.** For a verify-and-close claim about a token's *presence at a path*, `git show <audit_sha>:<path>` is the reliable read; `git log -S` answers "when did this token count change", a different question. The plan must pick the verb per claim shape, not assume `-S` substitutes for grep.
- **Servitor finding-match cost.** Re-Grep per audit finding adds Read/Grep calls at capture time; bounded by the finding count per phase (small). No new tool, no Bash — within existing confinement.
- **`--candidates` default flip is a behavior change.** Any script or doc invoking `archive --candidates` expecting mutation breaks (intended). Sweep `skills/`, `docs/`, and `references/` for the string and update call sites in the same change; the SKILL already says "never run `--candidates`", so the live corpus should have none.

## 9. Non-goals / deferred

- **Not** widening the auditor git allowlist to add `grep` — `git show <audit_sha>:<path>` + `git log -S` cover the verify-and-close need; a `grep` verb enlarges the read surface for marginal convenience. Deferred to a future spec if a real search-shaped verify-and-close case demands it.
- **Not** adding a hard `rm`-blocker or a delete verb to `war-memory` — the pipeline archives, never deletes; there is no delete path to guard.
- **Not** re-architecting the fan-out verifier dispatch — the fix is the prompt trichotomy plus routing removal decisions through the existing central `safe-swap verify`, not a new central-classification service.
- **Not** changing the projection budget, the FTS index, or the two-root routing (ADR 0015) — untouched.
- **Not** the pin-to-integrated-tip / evidence-gated-verdict machinery itself — that is the dependency spec's scope; this spec consumes its `audit_sha`, it does not build it.
- **Not** back-fixing already-polluted memory (e.g. the stale `campaign-ledger.test.mjs` finding) — that is a `/lessons-learned` housekeeping pass, not a code change; this spec prevents *new* pollution.

## 10. Validation criteria (concrete, testable)

1. `node skills/_shared/war-memory.mjs archive --candidates --local <staging>` (no `--apply`) **archives zero files** and prints the ranked candidate list; a following `walkCorpus` shows every candidate still hot. (`war-memory.test.mjs`)
2. `archive --candidates --apply` archives exactly the ranked candidate set; `archive <slug>…` with explicit slugs archives exactly those (unchanged). (`war-memory.test.mjs`)
3. `war-memory inbound <slug>` returns the correct inbound `[[slug]]` count across both roots, excludes the slug's own file, and lists the citing slugs; a slug with zero inbound refs returns 0. (`war-memory.test.mjs`)
4. Archiving a slug with ≥2 hot inbound refs emits the concept-hub WARN to stderr and still exits 0 (advisory, non-blocking). (`war-memory.test.mjs`)
5. `safe-swap.sh verify` reports **no dangling wikilink** for a `[[link]]` whose target exists only in `archive/<slug>.md`, and **flags** a link to a slug present in neither hot nor `archive/`. (`safe-swap.test.sh`)
6. `skills/lessons-learned/SKILL.md` contains the HOT/COLD/MISSING trichotomy in the verifier prompt and no surviving instruction that produces a hot-only `ls <staging>/<slug>.md` removal verdict; the Phase-3 hub check invokes `war-memory inbound`. (doc grep in the lessons-learned doc-contract test)
7. `agents/war-servitor.md` **and** the dispatched servitor prompt in `workflow-template.js` both carry the finding-match clause (audit finding re-confirmed at landed tip → `code-verified` w/ locate-cue; unmatched → generic pattern at `agent-unverified`, never a live file/line). A both-surfaces drift-guard test fails if either lacks it. (`workflow-template.test.mjs`)
8. The auditor surface(s) state that verify-and-close / already-done no-op claims ground against `git show <audit_sha>:<path>`, not the working tree; the working-tree grep is advisory only. `git grep` is absent from `validate-auditor-git.sh` (allowlist unchanged); `git show <sha>:<path>` is accepted by the guard. (`validate-auditor-git.test.sh` + doc grep)
9. Full suite green: `node --test 'skills/**/*.test.mjs'`, the shell test loop over `hooks/`+`skills/`, and `node skills/_shared/war-memory.mjs lint docs/learnings/`.
