---
name: backtick-pair-scanner-flips-parity-after-a-fence-assert-the-live-line
description: "A backtick-pair verb scanner flips parity after a code fence, so a new doc line can skip its check"
metadata:
  node_type: memory
  type: project
  keywords:
    - doc-cli-consistency
    - claimedVerbs
    - backtick pairing
    - code fence
    - parity flip
    - non-vacuity
    - verb scan
    - ensure-exclude
    - live corpus assertion
    - FENCE_RE
  provenance: agent-unverified
  slug: backtick-pair-scanner-flips-parity-after-a-fence-assert-the-live-line
  phase: 2026-10-20-rea-artifact-evidence/phase-1 task 1.3
  tags:
    - war
    - tests
    - doc-parsing
    - fence-blindness
  created: 2026-10-20
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-21T07:00:18.044Z
---

# A backtick-pair verb scanner flips parity after a code fence

Audit finding resolved in a fix round before land. Recorded as pattern, not live instance.

**What happened.** The verb scanner in `skills/_shared/doc-cli-consistency.test.mjs` paired backticks left to right with a global `` `[^`]+` `` match. A triple-backtick fence adds three backticks. That flips the pairing: real code spans fall outside the matches and prose falls inside. Task 1.3 added `provision-worktrees.sh ensure-exclude $MAIN` to two new doctrine files. Each file has a fence before that line. At the audit pin neither line reached the verb scan. A comment promised that renaming the subcommand would fail the suite. It would not have.

**Why the suite missed it.** The sanity test and the delete-and-trace fixture ran only on synthetic text. They proved the scanner, not the corpus.

**The fix (second ace round).** `claimedVerbs` now scans each fence body whole, handles a stray unmatched fence, and scans inline spans on the text with fences removed. Two non-vacuity asserts run on the live files: `claimedVerbs(src(<file>), 'provision-worktrees.sh')` must include `ensure-exclude` for `artifact-evidence.md` and for `plan-interview.md`.

**Rule.** If a plan adds a doc file to a scanner's corpus, add one assertion on the live file. Target the exact line the plan depends on. A widened scan also reaches every other file in the corpus, so re-run the whole gate.

**Fix anchor (verified present at landed tip 4e33b6db).** `FENCE_RE`, `claimedVerbs` and the two live-corpus asserts in `skills/_shared/doc-cli-consistency.test.mjs`.

**Related.** [[collectblocks-files-anchor-scan-is-fence-blind-while-sibling-parser-in-same-file-is-fence-aware]] is another fence-blind doc parser in this repo. [[weak-test-assertion-passes-without-feature-being-exercised]] is the general check.

> archived 2026-10-30: resolved — moved to archive
