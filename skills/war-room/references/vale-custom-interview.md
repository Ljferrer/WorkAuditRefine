# The custom Vale profile interview (`hooks.valeStyle: "custom"`)

Run this only when the operator picks `custom` for `hooks.valeStyle`. The deliverable is a
self-contained project-side profile at `.claude/war/vale/.vale.ini` (plus any style files it
needs under `.claude/war/vale/styles/`), and `hooks.valeStyle: "custom"` written to
`.claude/war/config.json`. The vale-md hook fail-opens to `workAuditRefine` until the profile
file exists, so a half-finished interview breaks nothing.

## Step 0 — launch the pattern miner FIRST, non-blocking

Before asking the operator anything, spawn ONE read-only subagent in the background
(never wait on it before starting the interview):

> Examine this repository's Markdown prose (README, CLAUDE.md, CONTEXT.md, GLOSSARY.md, skills/, agents/,
> docs/ — skim widely, read representatively). Report compactly on six points. (1) Typical and p90
> sentence length. (2) Entrenched punctuation voice (em dashes, semicolons, parens) with rough
> frequency. (3) Spelling region actually in use. (4) Recurring house vocabulary and proper terms a
> substitution or spelling rule would false-flag (candidate accept-list). (5) Recurring filler or
> slop words worth banning. (6) Any heading or literal conventions a style rule must never touch.
> Return a compact bullet report, no file dumps.

The miner's report arrives mid-interview; fold it in at Step 2. If it has not returned by
then, proceed without it and reconcile when it lands — never block the operator on it.

## Step 1 — interview

Grill one dimension at a time, offering the mined-or-default value in brackets:

1. **Base**: start from one of the vendored styles (`house`, `workAuditRefine`, `google`,
   `microsoftFork`, `writeGood`, `proselint`, `alex`, `readability`, `redhat`) or from nothing. A vendored base
   is COPIED, not referenced (Step 3), so the custom profile survives plugin updates.
2. **Sentence limit**: max words per sentence (house default 25). 0 = rule off.
3. **Passive voice**: flag it or not.
4. **Spelling region**: British, American, or don't police spelling.
5. **Banned words**: additions to (or replacements for) the house SlopWords list.
6. **Accept-list**: project terms no rule may flag (seed from the miner's item 4).
7. **Punctuation voice**: police dashes/semicolons or leave the house voice alone.
8. **Severity floor**: everything as `suggestion`, or keep per-rule levels.

## Step 2 — reconcile the miner's report

When the report lands, present each mined pattern as a proposed setting, not a fact to
accept silently. For example: "your docs run long sentences, p90 ≈ 40 words — keep the 25
limit as an aspiration, or raise it?" Operator answers win over mined evidence, always.

## Step 3 — write the profile

All paths are project-side; never write into the plugin directory (it is replaced wholesale
on every plugin update).

1. `mkdir -p .claude/war/vale/styles`
2. For a vendored base: copy the base style directory (and, for a Fork base, the
   `WorkAuditRefine` house style) from `${CLAUDE_PLUGIN_ROOT}/hooks/vale-md/styles/` into
   `.claude/war/vale/styles/`, LICENSE files included.
3. Author the operator's custom rules as YAML under `.claude/war/vale/styles/Custom/`:
   existence rules for banned words, and an `occurrence` rule for the sentence limit. Write the
   accept-list at `.claude/war/vale/styles/config/vocabularies/Custom/accept.txt`, with
   `Vocab = Custom` in the ini.
4. Write `.claude/war/vale/.vale.ini`. Set `StylesPath = styles`, `MinAlertLevel` per the
   severity answer, and `BasedOnStyles` naming the copied styles + `Custom`. Add one commented
   `= NO` line per rule the interview turned off. Every disable carries a one-line reason, the
   Fork-profile convention.
5. Prove it: run `vale --config .claude/war/vale/.vale.ini --output=JSON <a real repo .md>`
   and show the operator the top rules that fire. A parse error here means fix the profile
   before touching config.json.
6. Set `hooks.valeStyle: "custom"` in `.claude/war/config.json` via the validator
   (`war-config.mjs --stdin --fill-defaults`), like every other override.

Remind the operator that the profile directory is theirs to commit or gitignore. The hook
reads it either way, and deleting it simply fail-opens the hook back to `workAuditRefine`.
