# Gate-failure classification — evicted from `agents/war-refiner.md` (ADR 0042)

Read this file when the gate is red on a merge-task or land-phase dispatch (the card's trigger pointer names it). The section below moved here byte-identical from `agents/war-refiner.md` at eviction time; it still speaks in the card's own voice, and its step numbers resolve against the card.

## Gate-failure classification

On **any** gate failure — merge-task step 3 or the land-phase gate — **classify** the failure into `gate_failure_class` BEFORE returning `status: "gate_failed"`, by re-running the FAILING gate at the **classification base** (spec §6 / ADR 0019). The re-run happens in `_refinery` (already gate-capable — never a throwaway worktree).

- **Per-site classification base:**
  - **merge-task** — the **phase integration base**: the cut point of `integration/<slug>/phase-N` (e.g. its `git merge-base` with the working branch).
  - **land-phase** — the **detached `origin/<working>` tip** the merge lands onto (a stacked working branch carries prior plans' content the integration base lacks, so the land classifies against the working tip, NOT the integration base).
- **Base re-run + re-attach:** when the classification requires the base re-run, read ${CLAUDE_PLUGIN_ROOT}/skills/war/references/refiner-recovery.md (§ Base re-run + re-attach); your dispatched prompt carries the re-attach procedure.
- **Precondition-marker short-circuit** (spec §9): consult the gate **stderr**, not just the TAP stdout. If it carries a recognized **precondition marker** — `REL_GUARD_PRECONDITION_FAILED` is the live example, emitted when a guard's meta-test cannot isolate a clean scratch dir — the gate could not establish its own preconditions ⇒ classify `environment` **DIRECTLY** (never `introduced`), carry that marker line UNCURATED in `gate_output`, and **skip the base re-run**. Otherwise proceed to the base re-run + classify below.
- **Classify** (JUDGMENT, not parsing — carry the base-run evidence in `gate_output` UNCURATED):
  1. base **RED** with the **same** failing identifiers ⇒ `baseline`;
  2. base **GREEN** AND the failure does **NOT reproduce** on a second run at the task tip in a **fresh environment** (fresh TMPDIR/shell) ⇒ `environment` — **reproducibility**, not file-disjointness, is the trigger (a diff-disjoint but reproducing failure is a normal introduced regression and stays `introduced`);
  3. otherwise ⇒ `introduced`.
  An **absent** class ⇒ treated as `introduced` (the permanent fail-safe).
- On a **`baseline`** classification also report the classified failing identifiers in `gate_failing_ids` (array) and the classification base sha in `gate_base_sha`.
- **The two `*-proceed` dispatch flavors are NOT symmetric** — before executing either recovery flavor, read [budget-raise-floor.md](${CLAUDE_PLUGIN_ROOT}/skills/war/references/budget-raise-floor.md) (§ the evicted asymmetry block, verbatim): baseline-proceed proceeds over only the named pre-existing debt; environment-proceed waives nothing. Your dispatched re-merge/re-land prompt carries the operative rules.
- **Debt reuse:** the dispatched prompt threads a **KNOWN BASELINE GATE DEBT** list (the run's already-classified pre-existing failures). If your gate failure's failing identifiers are **covered** by an entry, classify `baseline` DIRECTLY — report the covered identifiers and **do NOT re-run the base** (one base re-run per unique debt per phase, never per task).

