---
name: redispatch-race-on-seemingly-dead-workflow-needs-liveness-proof-not-narrative
description: "SETTLED (Lead adjudication, same day): a /war workflow diagnosed dead from remote-branch…"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - dead workflow diagnosis
    - session compaction
    - journal.jsonl
    - transcriptDir
    - live task notification
    - re-dispatch race
    - push-first CAS
    - land race
    - contested narrative
    - unverifiable causal claim
    - servitor epistemic caution
    - liveness proof
    - remote reconnaissance false negative
  provenance: code-verified
  slug: redispatch-race-on-seemingly-dead-workflow-needs-liveness-proof-not-narrative
  phase: "2026-08-06-war-strategy-mirror-guards/phase-3 (Release, task 3.1)"
  tags: 
    - war
    - workflow
    - land
    - recovery
    - servitor
    - epistemic-caution
  relates: 
    - "[[lead-must-prove-a-run-dead-before-destroying-its-state]]"
    - "[[never-follow-resumefromrunid-hint-after-a-land-failure]]"
  created: 2026-08-18
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-08-18T08:59:41.420Z
---

# A Lead must prove liveness, not merely infer death, before re-dispatching seats on an apparently-interrupted workflow — and a servitor must not adjudicate a contested causal narrative it cannot verify

## The incident — two mutually-contradicting narratives, neither independently verifiable by this servitor

This phase's spawn briefing (framed as "Lead-verified against git") stated: workflow `wf_ab584d64-6d8`
died at the gate-audit dispatch when the session compacted; the Lead's initial remote reconnaissance
misread `integration/phase-3` as absent on origin and `dev` as unlanded; a journal read reversed that
assumption (provision/work/3 audits/merge/endstate-check all already complete); the Lead then
re-dispatched 3 audits + a gate-audit + a LAND agent, and the re-dispatched LAND agent found the
merge already on origin — pushed, per the briefing, by an earlier land dispatch whose narrative
("pushed before the workflow died") was judged impossible on commit-timestamp grounds, implying the
re-dispatched agent had pushed it itself and then misread its own no-op recheck as prior completion.

A **later mid-task message**, claiming to relay coordinator/Lead information not available at spawn
time (a live-task completion signal), asserted the opposite: the workflow never died, ran roughly 38
minutes in the background through the session compaction, and completed all 10 agents itself —
including its own land (pushing the same merge commit) and its own servitor pass. Under this version
the re-dispatched seats **raced** the still-live run rather than corroborating a dead one, and the
race was harmless only because every re-dispatched operation was either read-only (the audits, the
gate-audit) or CAS-guarded (land-advance's push-first compare-and-swap no-ops on a losing race).

**This servitor could not adjudicate between the two accounts.** Available tools (Read/Grep/Glob, no
Bash) can inspect committed git objects and any plain-text artifacts already on disk, but not a live
task/notification API, nor the run's `journal.jsonl` (not found anywhere under this repo's `.claude/`
tree — it lives in a `transcriptDir` outside this checkout, per the servitor's own briefing prose).
No artifact discoverable from this servitor's position settles which narrative is correct, and the
two are mutually exclusive on at least one point (which dispatch actually executed the push).
Absence-note: searched `.claude/teams/2026-08-06-war-strategy-mirror-guards-2026-08-17/` and
`.claude/war/runs/2026-08-06-war-strategy-mirror-guards-2026-08-17/` for a journal artifact — none
found; `ledger.json` in the team dir still shows phase 3 as `"status": "todo"`, which is stale by
design (ADR 0008 — ledger is never authoritative over git) and corroborates neither narrative on its
own.

## The durable, narrative-independent lesson

Both accounts agree on the one fact that actually matters operationally: **a "dead" diagnosis was
reached from an incomplete signal** — remote branch absence — that does not actually prove death
either way (in one telling, the run really had died but had gotten further than the incomplete
reconnaissance suggested; in the other, the run had never died at all). The generalizable rule, true
under either telling:

- Before re-dispatching any seat on a /war workflow believed interrupted (session compaction,
  timeout, apparent silence), first seek a **hard liveness/deadness signal** — a live background
  task's own status/notification, or an advancing `journal.jsonl` mtime under the run's
  `transcriptDir` — rather than trusting an inference drawn from remote branch state alone. Remote
  reconnaissance (branch present/absent on origin) proves neither: a live run mid-phase legitimately
  has no pushed integration branch yet, and a genuinely-dead run can already have pushed further than
  expected.
- If re-dispatch happens anyway under ambiguity, the blast radius is bounded only by how many of the
  re-dispatched operations are **read-only or idempotent/CAS-guarded**. This run's read-only audits
  and gate-audit, plus land-advance's push-first compare-and-swap (never force-push — a losing race
  no-ops rather than corrupting the ref), are exactly why a possible duplicate dispatch here caused no
  damage either way. A Lead relying on this safety net should still not treat it as a substitute for
  proving liveness first — it is a backstop for when the proof step is skipped or wrong, not a
  license to skip it.
- **For a servitor specifically:** when a mid-task message revises the causal narrative of the very
  incident you are about to record, and you cannot independently verify either version with your
  available tools, do not silently adopt the newer narrative as settled fact (recency alone is not
  evidence), and do not keep asserting the original narrative either. Record only what you can
  verify (git objects, on-disk artifacts) at their true provenance tier, and record the causal
  dispute itself, hedged, at `agent-unverified` — per the self-confound-gate discipline for any
  lesson that would otherwise assert a root cause ("who actually pushed the merge") without an
  evidence trail (primary evidence plus an inward refute pass).

## Lead adjudication (2026-08-18, same session) — the dispute is settled: the run was LIVE

The servitor wrote the incident section above under genuine ambiguity; the Lead can and did settle it
with signals outside the servitor's reach, minutes later. The live-run account is fact:

- The workflow's own **completion notification** arrived (task `wnext0b13`, run `wf_ab584d64-6d8`):
  10 agents spawned, 10 done, 0 errors, duration ≈ 38.5 min — spanning the session compaction. A dead
  run cannot emit this.
- The landed merge `4c624ee9037522f34d9c39337e262833303d7c26` carries committer timestamp
  2026-08-18 01:44:32 PDT — *after* the journal's last pre-compaction entry (01:35, the gate-audit
  spawn the Lead misread as the death point) and *before* the Lead's re-dispatched land agent ran
  (~01:46+). The workflow's own land pushed it; the re-dispatched land agent's "already pushed by a
  prior dispatch" report was **correct**, and the Lead's commit-timestamp rebuttal of it was the
  actual misreading.
- The workflow's own servitor pass wrote
  `red-team-scope-word-mandate-satisfied-by-substance-not-literal-phrase-removal.md` before this
  servitor was even briefed — same session id, earlier mtime (the detail this servitor correctly
  flagged as inconsistent with its briefing).

Every operational rule in the section above survives adjudication unchanged — the settlement only
replaces "either telling" with the live-run telling. Note the full irony chain for future Leads: the
Lead first disbelieved a *correct* agent report on timeline grounds, then briefed a servitor with the
wrong causal story as "Lead-verified"; the layered epistemic discipline (agent report → Lead check →
servitor refusal → hard signal) is what caught it.

## Related

[[lead-must-prove-a-run-dead-before-destroying-its-state]] — the adjacent, more severe shape: a
false-dead diagnosis that leads to destructive branch/worktree deletion rather than a bounded
re-dispatch race. [[never-follow-resumefromrunid-hint-after-a-land-failure]] — a related
died-workflow recovery-path lesson (though that one concerns a *genuinely* completed run's `held:*`
reason, not a liveness dispute). The CAS mechanism named above as the actual safety net is
land-advance's push-first compare-and-swap (`skills/war/assets/workflow-template.js`; "the push *is*
the CAS; never force-push" per `CLAUDE.md`'s execution-architecture summary).
