#!/usr/bin/env python3
"""Adds Module 5 ("Common questions about ISKCON") from courses/module-5-lessons.md to courses/intro-to-iskcon.json.
Run from iskcon-juja-project/ AFTER tools/convert_course.py:   python3 tools/convert_module5.py
Safe to re-run (replaces an existing Module 5). Writes courses/module-5-import-notes.md.
Quotes import as verified=false (hidden from learners) until the owner confirms each in the Course Editor."""
import re, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "courses", "module-5-lessons.md")
OUT = os.path.join(ROOT, "courses", "intro-to-iskcon.json")
NOTES = os.path.join(ROOT, "courses", "module-5-import-notes.md")
TITLE = "Common questions about ISKCON"
notes = []
ILLUS = re.compile(r"\s*\*\((An illustration|Check|No verified)[^)]*\)\*")

def strip_md(t): return re.sub(r"\*+", "", t).strip()

def parse_quote(lines, where):
    body = [l[1:].strip() for l in lines]
    ref = ""
    if body and body[-1].startswith("—"): ref = strip_md(body.pop()[1:]).strip()
    text = " ".join(x for x in body if x).strip()
    c = {"quote_text": text, "source_reference": ref, "verified": False}
    if re.match(r"(Lecture|Interview|Press|Pandal|Departure|Conversation|Morning|Room|Letter)", ref): c["speaker"] = "Śrīla Prabhupāda"
    notes.append("%s: HIDDEN until confirmed: \"%s\" [%s]" % (where, text[:90], ref))
    return {"type": "quote", "content": c}

def table_block(lines):
    rows = [[strip_md(c) for c in l.strip().strip("|").split("|")] for l in lines]
    rows = [r for r in rows if not all(re.fullmatch(r"-*:?-*", c.strip()) for c in r)]
    return {"type": "table", "content": {"headers": rows[0], "rows": rows[1:]}}

def lesson(title, body, where):
    blocks, buf, i, n = [], [], 0, len(body)
    def flush():
        nonlocal buf
        txt = "\n".join(buf).strip(); buf = []
        txt = re.sub(r"\n{3,}", "\n\n", txt)
        if txt: blocks.append({"type": "text", "content": {"text": txt}})
    while i < n:
        raw = body[i].rstrip(); l = raw.strip()
        if l.startswith("MEDIA:"): notes.append(where + ": MEDIA suggestion: " + l[6:].strip()); i += 1; continue
        if l.startswith("|"):
            flush(); t = []
            while i < n and body[i].strip().startswith("|"): t.append(body[i]); i += 1
            blocks.append(table_block(t)); continue
        if l.startswith(">"):
            flush(); q = []
            while i < n and body[i].strip().startswith(">"): q.append(body[i].strip()); i += 1
            if q[-1].lstrip("> ").startswith("—"): blocks.append(parse_quote(q, where))
            else: blocks.append({"type": "key_point", "content": {"text": "\n".join(strip_md(x[1:].strip()) for x in q)}} if False else {"type": "text", "content": {"text": "\n".join(x[1:].strip() for x in q)}})
            continue
        m = re.match(r"###\s+(.*)", l)
        if m: buf.append("**" + m.group(1) + "**"); i += 1; continue
        for mm in ILLUS.finditer(raw): notes.append(where + ": note removed from learner text: " + mm.group(0).strip())
        raw = ILLUS.sub("", raw)
        if l == "---": i += 1; continue
        buf.append(raw); i += 1
    flush()
    return blocks

def quiz(body):
    qs, cur = [], None
    for l in body:
        l = l.strip()
        m = re.match(r"\*\*Question \d+\.\*\*\s*(.*)", l)
        if m: cur = {"type": "multiple_choice", "prompt": strip_md(m.group(1)), "explanation": None, "options": []}; qs.append(cur); continue
        m = re.match(r"- \[( |x)\]\s*[A-Z]\)\s*(.*)", l)
        if m and cur is not None:
            o = {"text": m.group(2).strip().strip('"').replace("*", "")}
            if m.group(1) == "x": o["correct"] = True
            cur["options"].append(o)
    return {"kind": "review", "graded": False, "questions": qs}

def main():
    lines = open(SRC, encoding="utf-8").read().split("\n")
    parts, cur = [], None
    for l in lines:
        m = re.match(r"## (Lesson \d+: (.*)|Knowledge check)", l)
        if m:
            cur = {"title": (m.group(2) or "quiz").strip(), "quiz": m.group(1) == "Knowledge check", "body": []}; parts.append(cur); continue
        if cur is not None: cur["body"].append(l)
    mod = {"title": TITLE, "intro_text": None, "lessons": []}
    for p in parts:
        if p["quiz"]: mod["quiz"] = quiz(p["body"])
        else: mod["lessons"].append({"title": p["title"], "est_minutes": 4, "blocks": lesson(p["title"], p["body"], "Module 5, " + p["title"])})
    for q in mod.get("quiz", {}).get("questions", []):
        if sum(1 for o in q["options"] if o.get("correct")) != 1: sys.exit("quiz question without exactly one correct answer: " + q["prompt"])
    plan = json.load(open(OUT, encoding="utf-8"))
    plan["modules"] = [m for m in plan["modules"] if m["title"] != TITLE] + [mod]
    json.dump(plan, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    with open(NOTES, "w", encoding="utf-8") as f:
        f.write("# Module 5: import notes\n\nGenerated by tools/convert_module5.py. Quotes below are imported HIDDEN (verified = off). Check each against Vedabase, then switch it to verified in the Course Editor to show it to learners.\n\n")
        for t in notes: f.write("- " + t + "\n")
    print({"lessons": len(mod["lessons"]), "blocks": sum(len(l["blocks"]) for l in mod["lessons"]), "quotes": sum(1 for l in mod["lessons"] for b in l["blocks"] if b["type"] == "quote"), "questions": len(mod["quiz"]["questions"]), "modules_in_course": len(plan["modules"])})
main()
