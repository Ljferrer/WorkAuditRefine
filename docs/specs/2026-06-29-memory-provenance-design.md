# Memory provenance — stop unverified agent monologue from calcifying as fact

**Status:** proposed (design) — from the 2026-06-29 agent-architecture audit (finding M3), resolved by grilling

The servitor's only inputs are `JSON.stringify(auditLog)` + `JSON.stringify(escalated)` ([`workflow-template.js:460-461`](../../skills/war/assets/workflow-template.js#L460)) — LLM-authored auditor rationale and escalation text, never re-confirmed against the repo. It distills these into durable memory files with no write-time verification, and those files auto-inject into every future session as recalled context (proven by this very session's own memory block). The D1–D4 admission checklist ([`war-servitor.md:19-29`](../../agents/war-servitor.md#L19)) is **100% prompt-enforced** — the scope hook gates the write *path*, never *content*. So a mistaken auditor rationale (the known `redteam-claims-vs-reality-misfires` / `stale-tip-verdict` false-positive classes) calcifies into a recalled "fact" that future agents cite and re-affirm.

**The honest frame, up front:** *semantic truth is not code-gateable* — the servitor can't run the gate, and "is this learning true" can't be a hook. So M3 is not about verifying truth; it is about **provenance** — making each fact's (un)verified-ness legible and consequential for recall-weighting and correction.

## 1. Resolved design tree

| # | Decision | Choice | Rejected alternative |
|---|---|---|---|
| 1 | Enforcement posture | **Prompt discipline + a structural provenance gate** — a PreToolUse check rejects a servitor fact-file write whose frontmatter lacks a provenance field. Code-enforces that provenance is *present* (structural), not that the fact is *true* (semantic) | Pure prompt-layer (audit's rec) — smallest, but it's the prompt-only-rule pattern that erodes silently; D3's verify-cue is already "under-applied", with nothing to catch it |
| 2 | Provenance model | **A single 3-tier `metadata.provenance` ladder** that *is* a precedence order: `agent-unverified` (distilled from monologue — default) < `code-verified` (servitor Read/Grep-confirmed the named referent exists) < `user-confirmed` (a human/Lead decision fed it) | Multi-field (`source`+`verified`+`sha`) — more precise but more to populate/gate, and precedence must be derived from a combination |
| 3 | Verify-on-write | A fact naming a concrete file/flag/symbol reaches `code-verified` only if Read/Grep finds it. **Absent referent → admit at `agent-unverified` with an absence-note** ("referent not found @ phase X — verify before acting"); a fact naming no symbol stays `agent-unverified` unless user-confirmed | Refuse the write on an absent referent — loses legitimate "X was removed/absent" learnings; the servitor often can't tell "absent because wrong" from "absent because removed" |
| 4 | Correction (D2) | **Tier precedence: a higher tier supersedes a lower** — uniform across the autonomous and manual-land paths. Resolves D2's "no user-feedback channel on the autonomous path" without inventing one | Keep D2 as prose "user corrections outrank agent assertions" — unenforceable on the autonomous path, which has no user input |
| 5 | Growth | **Reuse the existing `consolidate-memory` skill**; grandfather the ~87 existing files (the gate fires only on new servitor writes); optional backfill via consolidate-memory | Build eviction / a hard cap — YAGNI until the index actually bites |

**The ladder is the spine:** it is simultaneously the recall-weight order (a reader trusts `code-verified` over `agent-unverified`), the correction rule (decision 4), and the verify-on-write outcome (decision 3). One vocabulary, three jobs.

## 2. Mechanics

### 2.1 Provenance field

Every servitor-written fact file carries `metadata.provenance: agent-unverified | code-verified | user-confirmed` in its frontmatter (alongside the existing `metadata.type`). `type` is the *category* (user/feedback/project/reference); `provenance` is orthogonal — *how trustworthy*. Verify detail (phase, sha, the absence-note) stays **body prose** in the existing verify-cue style, not structured fields — keeping the gate a one-field check.

### 2.2 The structural gate ([`hooks/`](../../hooks/), new `validate-servitor-provenance.sh`)

A PreToolUse hook on **Write**, scoped to `agent_type` matching `*war-servitor*` and a `file_path` under the memory/learnings target **but not the `MEMORY.md` index**:
- Parse the `tool_input.content` frontmatter; if it has no `provenance:` key, or its value is not one of the three tiers → **deny** (exit 2) with a message naming the required field + tiers.
- The index file (`MEMORY.md`) and any non-fact path are exempt (the index carries pointers, not facts).
- macOS bash 3.2.57-compatible; has its own `validate-servitor-provenance.test.sh`.
- **Scope:** gates **Write** only (full content available). Edits to an *existing* fact file (D1 dedup-in-place) are covered by prompt discipline + the fact that the file already carries provenance — a structural gate on `Edit` can't see the merged result, so it is out of scope (documented, not silently skipped).

### 2.3 Servitor prompt discipline ([`war-servitor.md`](../../agents/war-servitor.md) D1–D4 + [`workflow-template.js`](../../skills/war/assets/workflow-template.js#L464) wrap-up restatement)

- **Tag provenance** on every write (default `agent-unverified` — the input *is* monologue).
- **Verify-on-write (extends D3):** before recording a fact that names a file/flag/symbol, Read/Grep to confirm it exists. Found → `code-verified` + cue. Absent → keep `agent-unverified` + the absence-note (decision 3). The servitor already holds Read/Grep/Glob — no new capability.
- **Correction (reframe D2):** never overwrite a higher-tier fact with a lower-tier one; a `user-confirmed` fact outranks any agent write. State the precedence as the tier order, not as "user input wins" (which the autonomous path can't honor).

### 2.4 Recall weighting (advisory, honest)

The harness injects `MEMORY.md` + fact files into future sessions; we cannot change that injection. So recall-weighting is realized by **making the tier visible** — `provenance` in each file's frontmatter and a tier marker in the `MEMORY.md` index row — so the reading assistant naturally trusts `code-verified`/`user-confirmed` over `agent-unverified`. This is advisory (the reader weights it), not harness-enforced; the spec is explicit about that ceiling.

## 3. Surface changes

| File | Change |
|---|---|
| `hooks/validate-servitor-provenance.sh` (new) | The structural gate (§2.2). |
| `hooks/validate-servitor-provenance.test.sh` (new) | Cases: missing field → deny; valid tier → allow; bad tier → deny; `MEMORY.md` index → allow; non-servitor agent_type → pass-through; no-path → allow. |
| [`hooks/hooks.json`](../../hooks/hooks.json) | Wire the new hook on the `Write` matcher. |
| [`agents/war-servitor.md`](../../agents/war-servitor.md) | Provenance tagging, verify-on-write (D3 extension), absence-note, D2 reframed as tier precedence; document the provenance frontmatter field. |
| [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) | The wrap-up prompt's D1–D4 restatement (`~:464-468`) gains provenance tagging + verify-on-write + the absent-note rule. |
| [`CONTEXT.md`](../../CONTEXT.md) | On ratification, add the §4 terms. |
| [`docs/adr/0007-memory-provenance.md`](../adr/0007-memory-provenance.md) | **Written** (accepted) — ratifies decisions 1/2/3 (structural-gate posture, 3-tier ladder, admit-with-note on absent). |

## 4. New domain terms (for CONTEXT.md)

**Memory provenance**:
The trust tier of a durable learning — `agent-unverified` < `code-verified` < `user-confirmed` — recording how the fact was established. The ladder is also the recall-weight order and the correction-precedence order: a higher tier supersedes a lower.
_Avoid_: source, confidence (overloaded); accuracy (provenance records *how established*, not *how correct*).

**Verify-on-write**:
The servitor's discipline of Read/Grep-confirming a named file/flag/symbol exists before recording a fact about it: found → `code-verified`; absent → `agent-unverified` with an absence-note. Distinct from running the gate (which the servitor cannot do).
_Avoid_: fact-checking, validation (it confirms *existence*, not *truth*).

## 5. Open risks / non-goals

- **Recall-weighting is advisory** (§2.4) — we cannot make the harness rank by tier; we only make the tier visible. Accepted ceiling.
- **The gate is structural, not semantic** — it proves a provenance tag is *present*, never that the tag is *honest* (a servitor could stamp `code-verified` without checking). That residual is prompt-layer; the gate stops the silent *erosion* of the discipline (a tag-less write), which is the realistic failure mode.
- **Existing ~87 files are grandfathered** — untagged; backfill is a `consolidate-memory` job, not part of this change.
- **Non-goal:** a truth-verification harness (semantic truth isn't code-gateable — the audit's explicit guidance).
- **Non-goal:** eviction / a hard index cap (reuse `consolidate-memory`).
- **Non-goal:** extending the gate to the main assistant's own memory writes (no `agent_type`); the main protocol *may* adopt the ladder voluntarily, but that is out of scope.

## 6. Validation criteria

1. **Tag-less servitor write is denied.** A `war-servitor` Write of a fact file with no `metadata.provenance` → hook exits 2.
2. **Valid tier passes; bad tier denied.** `provenance: code-verified` → allowed; `provenance: banana` → denied.
3. **Index is exempt.** A `war-servitor` Edit/Write of `MEMORY.md` → allowed.
4. **Non-servitor pass-through.** A non-`war-servitor` agent_type (or the main session) → hook is a no-op.
5. **Verify-on-write tiers (prompt-level, fixture).** A fact naming a present symbol → `code-verified`; naming an absent symbol → `agent-unverified` + absence-note.
6. **Correction precedence.** A `user-confirmed` fact on a topic is not overwritten by a later `agent-unverified` write on the same topic.
