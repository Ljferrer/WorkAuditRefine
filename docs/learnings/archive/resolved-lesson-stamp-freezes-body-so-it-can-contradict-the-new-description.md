---
name: resolved-lesson-stamp-freezes-body-so-it-can-contradict-the-new-description
description: "A RESOLVED description stamp freezes the body, so the body can contradict it; and an appended ## RESOLVED section is new prose that needs verify-on-write too"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: resolved-lesson-stamp-freezes-body-so-it-can-contradict-the-new-description
  phase: "memory-tooling-hardening/phase-1 tasks 1.1 + 1.3 (audit findings, landed dev/2026-07-24-memory-tooling-hardening 2026-07-26)"
  keywords: 
    - RESOLVED stamp
    - lesson stamp
    - description prefix
    - body untouched
    - stale body
    - contradicts description
    - lesson-stamp convention
    - SUMMARY_CELL_BYTES
    - MEMORY.md truncation
    - servitor recurrence edit
    - stale line anchor
    - RESOLVED section
    - correction channel not self-verifying
    - mode inversion
    - stdin mode bare token
  tags: 
    - memory-system
    - lesson-hygiene
    - process-pattern
  created: 2026-07-26
  modified: 2026-08-15T01:52:12.513Z
  originSessionId: 8e038db9-6931-4633-b7d8-6d7977473ca5
---

# A plan-mandated `RESOLVED (...)` lesson-stamp deliberately freezes the body, so the body can end up flatly contradicting the new description

**Pattern (agent-unverified — audit-log-sourced across two tasks in the same phase, both landed with
`gate-audit:approve`; not a code defect, a documented, repeated process shape):** several plans in
this repo close a lesson with a slice like "prefix the description with a `RESOLVED (<plan-slug>/<task>,
#<issue>)` marker. Body/keywords otherwise untouched." This is a deliberate, narrow diff (one
description line changed) — but it means the lesson's **body** keeps narrating the defect in the
present tense, keeps any "fix if ever picked up" prescription (which can itself be the *wrong* fix —
see [[tighten-target-flag-has-three-independent-silent-degradation-paths]]'s superseded paragraph,
which prescribed exactly the bare-`Number()` shape the real fix avoids), and keeps stale line-number
anchors, all while the description now says the defect is closed. Both instances observed in
`memory-tooling-hardening/phase-1`
(`docs/learnings/tighten-target-flag-has-three-independent-silent-degradation-paths.md`,
`docs/learnings/die-process-exit-inside-try-skips-finally-cleanup.md`) were correctly audited as
Nit/`disposition:note`, non-blocking, and explicitly NOT treated as worker deviations — the plan's
own scope-freeze mandated the frozen body, so touching it would have been the deviation.

**Why it's not a live bug and not fixable in-task:** the `description` field is the mandated
correction channel, not the body — and it's also the only field the `MEMORY.md` projection renders
(truncated at `SUMMARY_CELL_BYTES`), so a description-prefix-first `RESOLVED (...)` marker is what
stays visible to a future reader scanning the index, even truncated. A servitor or a later
housekeeping pass is the sanctioned place to reconcile the body, mirroring the existing convention
already used by prior stamps (e.g. `docs/learnings/cli-main-guard-equality-check-silently-noops-under-relative-invocation.md`,
`docs/learnings/tighten-plan-target-flag-does-not-lower-fixed-warn-bytes-preflight-stop.md`): append a
`## RESOLVED (...)` section below the frozen historical prose rather than editing the historical prose
in place, and mark any now-wrong embedded prescription as superseded inline.

**How to apply:**
1. When a plan slice says "stamp the description RESOLVED, body/keywords otherwise untouched," that
   is not carte blanche to leave the body silently wrong forever — it's scoping *which task* does the
   body correction (not this one).
2. A servitor auditing/writing memory post-land should check: does this phase's landed diff include a
   `RESOLVED (...)`-prefixed description on a lesson whose body still narrates the defect as live? If
   so, and the servitor owns an editable local copy (D1: provenance-tagged, e.g. a prior
   `metadata.promoted`-stamped recurrence-edit target), append the `## RESOLVED` section then, in the
   local copy — do not wait for a dedicated future task that may never come.
3. When reading *any* stamped lesson body for guidance, read the `description` line first — if it
   opens `RESOLVED (...)`, treat every present-tense claim and every prescribed fix in the body below
   it as potentially superseded, and verify against the code before acting on it, never the reverse.

**The appended `## RESOLVED` section is not self-verifying either.** It is new prose. Give it the
same D3 verify-on-write check as any new lesson fact: re-derive the rule from the landed code, not
from memory of what the fix did. When the description and the body disagree, check the code, not
either field. Neither field is right by default.

One instance: the `## RESOLVED` section of
[[stdin-mode-cli-parser-silently-drops-space-separated-flag-with-no-positional-fallback]] swapped
the modes. It said `--stdin` mode tolerates a bare token, but in
`skills/red-team/assets/red-team-gate.mjs` `--stdin` mode refuses every bare token and file mode
takes the first bare token as its path. The description had it right. The error survived an
approve-verdict audit into the repo file.

Related: [[tighten-target-flag-has-three-independent-silent-degradation-paths]],
[[die-process-exit-inside-try-skips-finally-cleanup]] (both instances this pattern was observed in,
and both now carry the `## RESOLVED` correction this lesson recommends).

> archived 2026-08-30: resolved — moved to archive
