"""UserPromptSubmit: print the reply standard beside every prompt. The model reads it; the member never sees it.

Routing (deterministic):
  a question or an ask for an explanation  -> the whole card
  a build instruction                      -> the Shape half only
  a one-liner with no question             -> one line back
Loop: if the meter scored the previous reply with violations, the card opens by naming them.
"""
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
CARD = (HERE / "card.md").read_text(encoding="utf-8")
LOG = HERE / "meter.log"
QUESTION = re.compile(r"\?|^(why|what|how|should|is|are|can|could|which|do|does|explain|tell me|help me understand)\b", re.I)

prompt = (json.loads(sys.stdin.buffer.read().decode("utf-8", "replace")).get("prompt") or "").strip()
sys.stdout.reconfigure(encoding="utf-8")
words = len(prompt.split())

prefix = ""
if LOG.exists():
    last = LOG.read_text(encoding="utf-8").strip().splitlines()
    if last:
        prev = json.loads(last[-1])
        broke = [f"{k.replace('_', ' ')} x{v}" for k, v in prev.get("violations", {}).items() if v]
        if broke:
            prefix = "Your previous reply broke the standard: " + ", ".join(broke) + ". Not this time."
            print(prefix)
            print()

if QUESTION.search(prompt) or words > 12:
    mode = "full card"
    print(CARD)
elif words <= 6:
    mode = "one line"
    print("REPLY STANDARD: one line back, plain words, American spelling, no preamble.")
else:
    mode = "shape half"
    prose, shape = CARD.split("Shape:", 1)
    print("REPLY STANDARD (read before you answer)\n\nShape:" + shape)

# one line per firing, so a board (or a proof) can show what the model was handed
import datetime  # noqa: E402
with (HERE / "card.log").open("a", encoding="utf-8") as f:
    f.write(json.dumps({"at": datetime.datetime.now().isoformat(timespec="seconds"), "mode": mode, "prefix": prefix, "prompt": prompt[:80]}) + "\n")
sys.exit(0)
