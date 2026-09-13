# Backward-chain doctrine — the worker

The worker's chain for the first pass on a task. The task's finish line is a check WAR runs; the worker names it first, chains backward from it to the tip, and works the earliest unmet link. The `## The rules` section rides byte-equal in the WORK dispatched prompt built by `skills/war/assets/workflow-template.js`, pinned by the `workflow-template.test.mjs` fixture `backward-chain: worker rules byte-equal on the work build only`. No fix-applying build carries it; those carry the fixer's block ([backward-chain-fix.md](backward-chain-fix.md)).

## The rules

1. Lock the finish line in this order: the task's `Done when:` command; else the End state numbers the slice serves; else the gate plus the slice's named deliverable. All three absent is the slice-level `PLAN-DEFECT:` route: return `blocked` with that prefix. Two equivalent readings of the finish line: lock one and state it in `notes`. Two non-equivalent readings: return `blocked` naming both. When the prompt carries the prepended `DEPS ALREADY MERGED:` dispatch clause, the rebase is still the first act, and the chain ends at the rebased tip.
2. Chain backward from the finish line to the tip. Each link is a condition that must hold for the next link to hold. Number the links; the last link is the tip you were cut from.
3. The bottleneck is the earliest unmet link. Work it first. A later link worked first is a site patch that the bottleneck can invalidate.
4. Chunk every link with a done test: the command or assertion that proves the link true, and the token it prints. The printed-token duty is scoped to the `Done when:` command and the tests the task ships; nothing else needs a token.
5. Write `Critical path:` then `Ignore for now:` into `notes`: the numbered chain with the bottleneck marked and each link's done test, then the neighbors and findings you saw and chose not to touch, each with one reason.
6. The bottleneck link's test first, red before green. A test written after the code passes is not proof the link was ever false.
7. The outcome locks only on the End states and the Commander's Intent. Never on a peer's finding, a lesson, a prior task's notes, or your own inference about what the plan meant.
8. A link you cannot make true with the task's tools and files is a `blocked` return quoting the diagnostic, never a workaround: no budget raise, no test-pattern edit, no installed tool, no weakened test.

## Chunk shape

One chunk per link, written into `Critical path:` before the first edit:

```
Critical path:
1. <End state N or Done when: command> - done test: <command> prints <token>
2. <link> - done test: <command or assertion>
3. <link> - done test: <command or assertion>   <- bottleneck
4. tip <sha>
Ignore for now: <neighbor or finding> - <reason>; ...
```

Order the chunks by distance from the finish line, nearest first. Mark exactly one bottleneck. A chunk with no done test is a guess, not a link: split it or drop it. When a chunk's done test is the gate, say which suite and which title the gate prints; the whole gate is the last link, never a middle one.

## Off-path discipline

Three classes of path the chain does not name:

1. A sibling task's `Files:` path: never. A same-phase task owns it, and a write there rebase-conflicts at the serial merge. Name the need under `Ignore for now:` and let the auditor route it.
2. A release slot file (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, the `README.md` `## Status` line, `CHANGELOG.md`): never. The release phase owns them.
3. Any other path: in-band when the edit is intent-consistent and serves a link on your chain, named in `notes` with the link it serves. An edit that serves no link is off-path; leave it under `Ignore for now:`.

## Worked examples

Read [backward-chain-examples.md](backward-chain-examples.md); the entries whose `Roles:` line names the worker are the ones for this file. Every external private entry is abstracted: no repo name, number or infrastructure detail (PIN-9).

- A finish line nobody locked: `## premise`, `correct-chain-toward-a-rule-that-did-not-exist`. The chain was right and the outcome was not the plan's.
- Eight tasks that each reached green off their own base: `## convergence`, `eight-file-disjoint-tasks`. The file boundary carved; the chain ordered.
- A widened producer whose reader was never opened: `## consumer`, `read-the-reader-before-widening-the-producer`.
- A test that asserted a label, not the return: `## oracle`, `test-asserted-metadata-not-the-return`.
