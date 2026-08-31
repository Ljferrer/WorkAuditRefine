"""Stop hook: score the reply that just finished and write one line to meter.log, beside this file. Never blocks, prints nothing.

The counter is SimpleEnglish's ste_lint.py (AminBlg/SimpleEnglish, MIT), unchanged in what it counts, plus two house rules
reported beside the STE total (American spelling, no dashes). A regex pass, not a grammar parser: the same for every reply.
"""
import json
import pathlib
import re
import sys

BANNED_MODALS = re.compile(r"\b(should|would|may|might|could)\b", re.I)
PERFECT = re.compile(r"\b(has|have|had)\s+been\b|\b(has|have)\s+\w+ed\b", re.I)
CONTRACTION = re.compile(r"\b\w+(n't|'ll|'re|'ve|'d)\b|\bit's\b|\byou're\b", re.I)
ING_CLAUSE = re.compile(r",\s*(mak|allow|enabl|ensur|highlight|creat|provid|offer|help|reduc|improv|lead|caus|result)ing\b", re.I)
LATIN = re.compile(r"\b(e\.g\.|i\.e\.|etc\.?)(?=[\s,)]|$)", re.I)
SLOP = re.compile(
    r"\b(simply|seamlessly|effortlessly|robust|leverag\w*|utiliz\w*|"
    r"comprehensive|powerful|blazingly|streamlin\w*|facilitat\w*|"
    r"performant|plethora|myriad|delve|crucial|pivotal)\b", re.I)
TRAILING_COND = re.compile(r"\w[^.!?\n]{3,}\s\b(if|when)\b\s", re.I)
ROTATION_SETS = [
    ("check-verify", re.compile(r"\b(check|verify|confirm|validate|ensure)\w*\b", re.I)),
    ("config-settings", re.compile(r"\b(config|configuration|settings)\b", re.I)),
]
# ours. The -ise arm is stem-listed, not \w+is\w*: a bare \w+ would flag American words
# like wise, otherwise, exercise, promise. "analyses" stays unflagged (valid American noun).
BRITISH = re.compile(
    r"\b((?:organ|recogn|real|apolog|initial|normal|optim|priorit|minim|maxim|summar|"
    r"standard|custom|serial|synchron|categor|special|author|item)is(e|es|ed|ing|ation|ations)|"
    r"colours?|behaviours?|favours?|flavours?|honours?|neighbours?|centres?|metres?|litres?|"
    r"analys(e|ed|ing)|catalogue|licence|defence|offence|artefacts?|grey|whilst|amongst)\b", re.I)
DASH = re.compile("[—–]| -- ")
LIMITS = {"procedural": 20, "descriptive": 25}


def strip_code(text):
    text = re.sub(r"```.*?```", " ", text, flags=re.S)
    text = re.sub(r"`[^`\n]+`", " CODESPAN ", text)  # one word per Rule 8.6
    text = re.sub(r"^#+\s.*$", " ", text, flags=re.M)  # headings exempt (titles, 8.6)
    text = re.sub(r"https?://\S+", " URL ", text)
    return text


def sentences(text):
    text = re.sub(r"^\s*([-*]|\d+\.)\s+", "", text, flags=re.M)  # list markers
    parts = re.split(r"(?<=[.!?:])\s+", text)
    return [p.strip() for p in parts if len(p.strip().split()) >= 2]


def lint(text, text_type="descriptive"):
    body = strip_code(text)
    sents = sentences(body)
    limit = LIMITS[text_type]
    counts = {}
    lengths = [len(s.split()) for s in sents]
    counts["sentence_over_limit"] = sum(1 for n in lengths if n > limit)
    counts["contraction"] = len(CONTRACTION.findall(body))
    counts["banned_modal"] = len(BANNED_MODALS.findall(body))
    counts["perfect_tense"] = len([m for m in PERFECT.finditer(body)])
    counts["ing_clause"] = len(ING_CLAUSE.findall(body))
    counts["semicolon"] = body.count(";")
    counts["latin_abbrev"] = len(LATIN.findall(body))
    counts["slop_word"] = len(SLOP.findall(body))
    counts["trailing_condition"] = sum(
        1 for s in sents if TRAILING_COND.search(s) and not re.match(r"^(if|when)\b", s, re.I))
    rotation = 0
    for _, rx in ROTATION_SETS:
        stems = {m.group(1).lower().rstrip("s") for m in rx.finditer(body)}
        if len(stems) > 1:
            rotation += len(stems) - 1
    counts["synonym_rotation"] = rotation
    words = max(1, len(body.split()))
    ste_total = sum(counts.values())
    # ours, reported beside the STE total, never inside it
    house = {"british_spelling": len(BRITISH.findall(body)), "dash": len(DASH.findall(body))}
    return {
        "type": text_type,
        "words": words,
        "sentences": len(sents),
        "mean_sentence_words": round(sum(lengths) / max(1, len(lengths)), 1),
        "longest_sentence_words": max(lengths, default=0),
        "violations": counts,
        "violations_total": ste_total,
        "violations_per_100w": round(100.0 * ste_total / words, 2),
        "house": house,
    }


HERE = pathlib.Path(__file__).resolve().parent
data = json.loads(sys.stdin.buffer.read().decode("utf-8", "replace"))
text = data.get("last_assistant_message") or ""
if text.strip():
    row = lint(text, "descriptive")
    row["session_id"] = data.get("session_id")
    with (HERE / "meter.log").open("a", encoding="utf-8") as f:
        f.write(json.dumps(row) + "\n")
sys.exit(0)
