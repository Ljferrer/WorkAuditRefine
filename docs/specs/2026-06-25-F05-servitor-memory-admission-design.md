# F05 — Servitor memory admission discipline — Design

**Status:** proposed — targets **v0.5.1** (prompt). **Severity: MEDIUM.**
**Source:** agent-architecture-audit F5.

## Problem — the servitor writes persistent memory with no admission policy

The servitor distills a run's audit findings into persistent memory files that re-enter **future** sessions as
`<system-reminder>` background context. Its instructions
([war-servitor.md:15-16](../../agents/war-servitor.md), [workflow-template.js:310-317](../../skills/war/assets/workflow-template.js))
say "capture signal not noise" but never tell it to: check for an existing covering file, prefer user corrections
over agent assertions, bound growth, or stamp facts so they don't rot. Result: `MEMORY.md` already holds ~21
entries and grows each phase, and several encode stale architectural claims ("X defined but never called") a
future agent could act on as current. The main assistant's memory protocol (in `MEMORY.md`'s own header) has these
rules; the servitor does not follow them.

## Decisions

- **D1 — Dedup before write.** Before writing, the servitor MUST scan the memory dir (Glob), read the `MEMORY.md`
  index, and read related candidate files; **update an existing covering file** rather than create a duplicate.
  Create a new file only when no existing file covers the fact.
- **D2 — Correction priority.** A new fact that contradicts an existing memory **supersedes** it — update/replace
  the stale file and note the supersession. User feedback/corrections outrank agent assertions.
- **D3 — Verification stamping.** Any fact that names a file/function/flag/line is phrased as a durable *learning*
  with a "verify still present before acting" cue — not a snapshot that rots.
- **D4 — Index hygiene.** Update the `MEMORY.md` pointer in place (don't append a duplicate row); cross-link with
  `[[slug]]`.
- **D5 — Align to the existing protocol.** Mirror the main assistant's memory rules already stated in the
  `MEMORY.md` header so the servitor and the main loop admit memory the same way.

## Solution shape

Additions to the servitor agent doc + the Wrap-up prompt (a short admission checklist). No code.

## Affected files

`agents/war-servitor.md` (admission checklist) · `skills/war/assets/workflow-template.js` (Wrap-up prompt) ·
optionally `skills/war/references/servitor-memory.md` (the checklist as a referenced doc).

## Alternatives considered

- **Code-gate admission with a dedup linter** — heavier; deferred. Memory is inherently prompt-mediated, so a
  prompt-layer policy is proportionate here (unlike F01, where the guarantee is a security boundary).
- **Cap entry count** — crude; would drop durable facts.

## Validation criteria

- A servitor run on a fact already covered → **updates** the existing file (no duplicate created; no duplicate
  `MEMORY.md` row).
- A contradicting fact → supersedes the stale file with a note.
- A new file naming a file/flag includes a verify cue.

## Open decisions

1. Whether to add a lightweight **dedup test** (grep `MEMORY.md` for duplicate slugs/rows in CI) now or defer to a
   later hardening pass (recommend a tiny meta-test now — cheap).
