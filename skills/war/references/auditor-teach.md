# Auditor teach — guard-contract mirror architecture, submodule / gitlink-bump pre-flight arms

Verbatim evictions from `agents/war-auditor.md` (prompt-surface simplification, spec §4.3; each
moved block was byte-identical to its pre-eviction card text at eviction time — the Gitlink-bump
`pin-validity` lens section's step-4 citation has since been repaired to name its doctrine's real
home, `submodule-flows.md`, this pass). Positional words inside the moved
blocks ("below", "above") refer to their original card positions — "the branch flag enumeration
below" is the card's Read-only git guard contract bullet list, and the two pre-flight arms sat
between the card's Step 1 task-type triage and its regular-task refusal arm.

## Guard-contract mirror architecture

Trigger: you are editing the read-only git guard contract (the card section, the dispatched
prompt literal, or `hooks/validate-auditor-git.sh`) and need the drift-guard wiring; a seat
merely operating within the grammar does not need this. On the card this block completed the
sentence "Work within its grammar so you never pay the discovery tax — ":

this contract is carried on both surfaces (this standing card and your dispatched audit prompt, edited together in one commit); the both-surfaces registry row in `skills/war/assets/workflow-template.test.mjs` anchors the shared tokens, and the extraction-equality test beside it reads the hook's own `branch` deny string and is the arbiter for the branch flag enumeration below (the hook string is canonical; both prompt surfaces are followers)

## Submodule-task diff scope

Trigger: your spawn prompt identifies the task as a **submodule task** (Step 1 of the card's
Submodule pre-flight).

**If this is a submodule task** — the task implements changes *inside* a submodule. Compute the diff **from inside the submodule worktree**:
```
git -C <submodule-task-worktree> diff <sub-integration>...<branch>
```
This produces real file diffs (no gitlink entries). Proceed with your lens normally on those file diffs. The superproject diff for a submodule task carries no gitlink change (the pin move is the paired gitlink-bump task's job).

## Gitlink-bump `pin-validity` lens

Trigger: your spawn prompt identifies the task as a **gitlink-bump task** (Step 1 of the card's
Submodule pre-flight).

**If this is a gitlink-bump task** — the task's entire purpose is to advance the superproject's gitlink for one declared submodule. Apply the **pin-validity** lens:
1. Compute the diff: `git diff <integrationBranch>...<branch>` — it must be **gitlink-only** (only `Subproject commit` lines, no other file changes).
2. Extract the new SHA from the diff (`+Subproject commit <oid>`).
3. **Authoritative check — the new SHA equals the dep submodule task's landed SHA** (read from the ledger, `ledger.json`). This is the in-seat check you own. A mismatch → **Critical / `request_changes`**. The SHA need not be on the default branch — a submodule legitimately pinned to a feature branch is allowed (DP4).
4. **Remote-reachability is already established upstream — do NOT re-verify it here.** The SHA was pushed by the dep submodule task's land, and the Lead's pre-flight reconciliation (`submodule-flows.md`, section "Resume — submodule remote as co-source-of-truth") confirms the ledger SHA against the remote before the bump task is dispatched. So the ledger match in Step 3 already implies reachability. Do **not** `git fetch` here — the read-only auditor guard denies `fetch` by design (network write-adjacent, outside the read allowlist), and the object need not be fetched into this read-only checkout. Optionally, as a **best-effort, non-blocking** sanity confirmation, you *may* run `git -C <submodule> cat-file -e <oid>` (a permitted read verb) if the object already exists locally; its **absence is not a finding** — never false-block a legitimate pin on a local object miss.

If the ledger check fails — the new SHA does not match the dep task's landed SHA — emit a **Critical** finding and return `verdict: "request_changes"`. Otherwise `approve` (no other lens needed for a pure pin move).
