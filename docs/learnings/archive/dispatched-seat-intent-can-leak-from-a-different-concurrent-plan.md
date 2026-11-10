---
name: dispatched-seat-intent-can-leak-from-a-different-concurrent-plan
description: "A dispatched seat's threaded Commander's Intent (and its adjudication rows) can be from a DIFFERENT plan than the task/phase actually being executed — not a heading-recognition miss (ADR 0014), but the wrong plan file entirely. Observed across an entire audit roster AND independently self-observed in a servitor spawn prompt in the same session."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - "Commander's Intent"
    - intent threading
    - dispatch defect
    - wrong plan
    - mis-threaded intent
    - adjudication rows
    - concurrent plans
    - session branch leak
    - args.intent
    - latitude rule
    - ADR 0013
    - auditor prompt
    - servitor prompt
  provenance: agent-unverified
  slug: dispatched-seat-intent-can-leak-from-a-different-concurrent-plan
  phase: 2026-08-06-done-when-floor-wiring/1.4
  tags: 
    - dispatch
    - orchestration
    - lead-side-defect
    - prompt-assembly
  created: 2026-08-15
  modified: 2026-08-15T11:30:03.491Z
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
---

# A dispatched seat's Commander's Intent can be threaded from the wrong plan entirely

Observed across a full auditor roster AND a servitor spawn in one session (plan
done-when-floor-wiring task 1.4, 2026-08-15): the threaded intent + adjudication rows
described a sibling concurrently-worked plan (the session's ambient checked-out branch),
not the executing task's plan. Not the ADR 0014 heading-recognition class — the wrong
plan file was extracted. Every seat discarded it per ADR 0013's latitude rule and
re-grounded from the pinned blob, so no verdict was affected.

**Why:** a seat that takes the threaded ceiling at face value scores against entirely
wrong End states.

**How to apply:** threaded intent is not self-authenticating — sanity-check its named
files/subsystems against the task's own `Files:` list and plan slug; a mismatch is a
dispatch-side defect to record and discard, never a scope signal. Lead-side: extraction
must key on the executing task's plan slug, never ambient session/branch state.

Related: [[standing-instruction-vs-dispatched-prompt-coverage-split]].

> archived 2026-08-25: resolved — moved to archive
