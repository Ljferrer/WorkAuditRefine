---
name: effective-date-lex-max-over-all-date-shaped-prose-tokens-overprotects
description: "MITIGATED (#989, 2026-07-23): effectiveDate validates every token (UTC round-trip + FUTURE_SKEW_MS); a stray future/invalid token no longer protects a lesson forever"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: effective-date-lex-max-over-all-date-shaped-prose-tokens-overprotects
  phase: lessons-learned-tighten/phase-1 task 1.1 (landed dev/2026-07-21-lessons-learned-tighten)
  created: 2026-07-21
  tags: 
    - memory-system
    - war-memory
    - tighten
    - date-parsing
    - eviction-floor
  keywords: 
    - effectiveDate
    - tighten-plan
    - war-memory.mjs
    - date regex
    - lexicographic max
    - eviction floor
    - prose date
    - protected lesson
    - invalid date
    - future date
    - NaN date
    - ageDays
  originSessionId: 7b990932-4f7c-45ba-a050-29d95817432e
  modified: 2026-07-21T21:00:54.763Z
---

# `effectiveDate` protects on the newest date-*shaped* token anywhere, not the newest real date

**What (code-verified — found at `skills/_shared/war-memory.mjs`, `effectiveDate()`, verify still
present before acting):** the tighten-eviction floor's "lessons younger than 14 days are protected"
check is driven by `effectiveDate([md.created, md.updated, md.modified, md.date, phase,
description])`, which regex-matches `/20\d\d-\d\d-\d\d/g` across **every** source string
(frontmatter date keys AND the free-text `phase`/`description` prose) and returns the
lexicographic max of all matches found. Because ISO dates zero-pad, lex-max == chronological max
for genuinely valid dates — but the regex has no semantic validation:

- A **future or just-large-looking** date-shaped token anywhere in prose (e.g. an issue/PR id or an
  intentionally-cited future date like `2099-01-01`) becomes the lex-max, yields a future
  `effectiveDate`, a negative `ageDays` in `tightenPlan`, and the lesson is **permanently** treated
  as within the 14-day young-window — never eligible for eviction.
- An **invalid-shaped** token (`2026-13-45` — passes the digit-shape regex but isn't a real
  calendar date) can also win the lex-max; `tightenPlan` does `Date.parse(effMs + 'T00:00:00Z')`
  which yields `NaN`, and the resulting `ageDays` comparison behaves as protected too.

**Why this is fine as shipped:** this is the red-team-adjudicated regex (2026-07-21) and the
failure direction is deliberately fail-safe — it only ever **over-protects** (a lesson survives
eviction it might otherwise qualify for), never **false-evicts** a young lesson. Eviction is also
gated behind a later operator-approved strike-list step, so an over-protected lesson merely stays
in the corpus one tighten cycle longer; nothing is silently deleted.

**Why record it anyway:** any future change to `tightenPlan`'s ranking or floors (or a caller that
starts trusting `effectiveDate` as a genuine calendar date rather than a protection signal) should
know the field can be dominated by a coincidental digit-shaped substring in free prose, not just by
the four frontmatter date keys. If ever tightened, validate `month <= 12 && day <= 31` before
treating a prose token as a real date, and/or exclude non-frontmatter sources from consideration.

Related: [[projection-byte-budget-driven-by-descriptions-not-bodies]] (same subsystem — projection
size is driven by description text, not lesson bodies; this fact is the eviction-side analogue).

## MITIGATED — `effectiveDate` UTC round-trip + `FUTURE_SKEW_MS` validation (#989, 2026-07-23)

**Code-verified in this task's rebased worktree** (Task 1.1 landed into the phase-1 integration
tip before this task ran; confirmed at `skills/_shared/war-memory.mjs`, `effectiveDate()`): this
lesson's own "if ever tightened, validate…" advice is now implemented. Every date-shaped token
must survive two checks before it can win the max: (1) a UTC round-trip parse
(`Date.parse(token + 'T00:00:00Z')` must not be `NaN` — this doubles as the month/day range check,
so `2026-13-45`/`2026-00-10`/`2026-12-00` are rejected), and (2) a future bound (the parse must not
exceed `now + FUTURE_SKEW_MS`, 48 h, so a `2099-01-01`-shaped prose token can no longer win). `now`
is injectable, so the boundary is deterministically tested (`skills/_shared/war-memory.test.mjs`:
`effectiveDate: a well-formed-but-invalid token is discarded; an older VALID token wins`,
`effectiveDate: a future token is discarded under injected now; only-future ⇒ null`, and the
end-to-end regression `#989 end-to-end: a stray FUTURE prose stamp no longer protects an old
lesson from eviction`). The fail-safe direction is unchanged: when no token survives,
`effectiveDate` returns `null` and the caller's pre-existing undated-lesson protection applies —
over-protect, never false-evict.

**What's still true (unchanged by the fix):** the underlying observation — that the field can be
dominated by a coincidental digit-shaped substring anywhere in prose, not just the four frontmatter
date keys — remains the durable pattern; only the failure mode changed, from *permanent*
over-protection to a *bounded* (48 h) one.
