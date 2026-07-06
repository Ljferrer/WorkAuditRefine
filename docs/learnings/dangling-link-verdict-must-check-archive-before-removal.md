---
name: dangling-link-verdict-must-check-archive-before-removal
description: "6 of 7 'dangling' wikilinks resolved into archive/; adjudicate links against hot set + archive/ before removing"
metadata: 
  node_type: memory
  type: project
  keywords: [cold link, broken wikilink, archived lesson, resolves_in, safe-swap verify, hot root, three-way classification, false dangling]
  provenance: code-verified
  phase: ops/2026-07-04
  tags: 
    - lessons-learned
    - memory-hygiene
    - wikilinks
  originSessionId: 25ba6ce0-3716-47e8-98b6-d39b33de3609
---

During the 2026-07-04 /lessons-learned pass, fan-out verifier agents flagged 7 wikilinks as "dangling — no file in memory.staging" and recommended dropping them. A follow-up check against `memory.staging/archive/` showed **6 of the 7 targets were archived, not deleted** — legal cold links that `safe-swap.sh verify` (`resolves_in()`) treats as resolved. Only 1 link was truly dead. Blindly applying the verifier recommendations would have severed six live graph edges into the cold set.

**Why:** temperature is location — archived lessons still resolve (spec §4.8), so "no file in the hot root" is not "no target". Verifier prompts that say "check the staging dir" get `ls <staging>/<slug>.md` and miss `archive/`.

**How to apply:** any verdict that recommends removing or repointing a wiki-style link must classify the target three ways first: HOT (`<root>/<slug>.md`), COLD (`<root>/archive/<slug>.md` — keep the link, it is legal), or MISSING (neither — safe to drop). Bake the three-way check into the verifier prompt, or run the classification centrally before dispatching editors (as this run did). Same family as [[retiring-a-resolved-memory-must-check-inbound-links-hubs-stay]] — that lesson protects inbound links to a memory being retired; this one protects outbound links whose target merely went cold. See also [[lessons-learned-tooling-traps]] for the same run's swap trap.
