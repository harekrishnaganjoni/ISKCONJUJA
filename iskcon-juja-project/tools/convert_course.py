#!/usr/bin/env python3
"""Turns docs/ISKCON_Juja_Intro_Course_Modules_1-4.md into courses/intro-to-iskcon.json
(the file the Course Editor's "Import" accepts) plus courses/intro-to-iskcon-notes.md
(editor notes, media suggestions and every quote that still needs checking).
Run from iskcon-juja-project/:  python3 tools/convert_course.py
Quotes tagged (check mark) become verified=true, tagged (warning) or untagged stay verified=false."""
import re, json, sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "docs", "ISKCON_Juja_Intro_Course_Modules_1-4.md")
OUT = os.path.join(ROOT, "courses", "intro-to-iskcon.json")
NOTES = os.path.join(ROOT, "courses", "intro-to-iskcon-notes.md")
OK, WARN = "✔", "⚠"
notes = []   # (where, text)
def note(where, t): notes.append((where, t.strip()))

EDITOR_NOTES = [r"\s*\*\(Check local names[^)]*\)\*", r"\s*\*\(An illustrati[^)]*\)\*", r"\s*\*\(No verified quote[^)]*\)\*"]
def clean(t, where):
    for p in EDITOR_NOTES:
        for m in re.finditer(p, t): note(where, m.group(0))
        t = re.sub(p, "", t)
    for m in re.finditer(r"\s*" + WARN + r"\s*(\([^)]*\))?", t):
        note(where, "inline " + WARN + " mark removed: " + t[max(0, m.start()-60):m.start()].strip())
    t = re.sub(r"\s*" + WARN + r"\s*(\([^)]*\))?", "", t)
    t = re.sub(r"\s*" + OK + r"\s*(\(confirm[^)]*\))?", "", t)
    return t.strip()

def strip_md(t): return re.sub(r"\*+", "", t).strip()

def parse_quotes(rest, where):
    """rest = text after '**Quote:**' or a bullet. returns list of quote contents."""
    out = []
    # split after each status mark
    parts = re.split(r"(?<=[" + OK + WARN + r"])", rest)
    for seg in parts:
        seg = seg.strip().lstrip(";").strip()
        if not seg: continue
        status = OK in seg
        if not re.search(r'["“]', seg): continue
        seg2 = re.sub(r"[" + OK + WARN + r"]", "", seg)
        seg2 = re.sub(r"\((?:confirm|check)[^)]*\)", "", seg2).strip()
        m = re.search(r'["“]([^"”]+)["”]', seg2)
        if not m: continue
        qt = m.group(1).strip()
        rem = (seg2[:m.start()] + " " + seg2[m.end():]).strip()
        par = re.findall(r"\(([^)]*)\)", rem)
        ref = par[0] if par else rem
        ref = re.sub(r"\([^)]*\)", "", ref) if not par else ref
        ref = strip_md(ref).strip(" :;,.-")
        ref = re.sub(r"^(from|in)\s+", "", ref)
        ref = re.sub(r"\s+", " ", ref)
        c = {"quote_text": qt, "source_reference": ref, "verified": bool(status)}
        if re.match(r"(Lecture|Interview|Departure talk|Jaladuta|Conversation)", ref): c["speaker"] = "Śrīla Prabhupāda"
        out.append(c)
        if not status: note(where, "QUOTE NOT VERIFIED (hidden from learners): " + qt + " [" + ref + "]")
    return out

def table_block(lines):
    rows = [[strip_md(c) for c in l.strip().strip("|").split("|")] for l in lines]
    rows = [r for r in rows if not all(re.fullmatch(r"-+", c.strip()) for c in r)]
    return {"type": "table", "content": {"headers": rows[0], "rows": rows[1:]}}

def convert_lesson(title, body, where):
    blocks, buf, i = [], [], 0
    lines = body
    def flush():
        nonlocal buf
        paras, cur_b = [], None
        for ln in buf:
            ln = ln.strip()
            if not ln: cur_b = None; continue
            ln = re.sub(r"^\d+\.\s+", "- ", ln)
            if ln.startswith("- "):
                if cur_b is None: cur_b = []; paras.append(cur_b)
                cur_b.append(ln)
            else:
                cur_b = None; paras.append([ln])
        txt = "\n\n".join("\n".join(x) for x in paras).strip()
        buf = []
        if txt: blocks.append({"type": "text", "content": {"text": txt}})
    n = len(lines)
    while i < n:
        raw = lines[i].rstrip(); l = raw.strip()
        if not l:
            if buf and buf[-1] != "": buf.append("")
            i += 1; continue
        if l.startswith("|"):
            flush(); tl = []
            while i < n and lines[i].strip().startswith("|"): tl.append(lines[i]); i += 1
            blocks.append(table_block(tl)); continue
        if l.startswith(WARN):   # editor's note line
            note(where, l); i += 1; continue
        if re.match(r"\*\(.*\)\*$", l) and ("No verified quote" in l or "Check" in l):
            note(where, l); i += 1; continue
        m = re.match(r"\*\*Media:\*\*\s*(.*)", l)
        if m: note(where, "MEDIA: " + m.group(1)); i += 1; continue
        m = re.match(r"\*\*Key point:\*\*\s*(.*)", l)
        if m: flush(); blocks.append({"type": "key_point", "content": {"text": clean(strip_md(m.group(1)), where)}}); i += 1; continue
        m = re.match(r"\*\*Link to the mission:\*\*\s*(.*)", l)
        if m: flush(); blocks.append({"type": "callout", "content": {"style": "note", "text": "**Link to the mission:** " + clean(m.group(1), where)}}); i += 1; continue
        m = re.match(r"\*\*Reflection[^*]*\*\*\s*(.*)", l)
        if m: flush(); blocks.append({"type": "reflection", "content": {"prompt": clean(strip_md(m.group(1)), where), "allow_private_note": True}}); i += 1; continue
        m = re.match(r"\*\*Quotes?:\*\*\s*(.*)", l)
        if m:
            flush(); rest = m.group(1); i += 1
            while i < n and lines[i].strip().startswith("- "):
                rest += " " + lines[i].strip()[2:]; i += 1
            for c in parse_quotes(rest, where): blocks.append({"type": "quote", "content": c})
            continue
        m = re.match(r"\*\*Analogy[^:*]*:\s*([^*]*)\*\*\s*(.*)", l) or re.match(r"\*\*Analogy[^:*]*:([^*]*)\*\*\s*(.*)", l)
        if m:
            flush(); ttl = m.group(1).strip().rstrip("."); expl = m.group(2).strip(); i += 1
            while i < n and lines[i].strip() and not lines[i].strip().startswith("*In reality") and not lines[i].strip().startswith("**"):
                expl += " " + lines[i].strip(); i += 1
            real = ""
            while i < n and not lines[i].strip(): i += 1
            if i < n and re.match(r"\*(In reality|Analogy mapping):\*", lines[i].strip()):
                real = re.sub(r"^\*[^*]+:\*\s*", "", lines[i].strip()); i += 1
            c = {"title": ttl[:1].upper() + ttl[1:], "explanation": clean(expl, where), "in_reality": clean(real, where)}
            # "A correctional facility." style: heading holds no 'Analogy:' prefix handled below
            blocks.append({"type": "analogy", "content": c}); continue
        m = re.match(r"\*\*(A correctional facility|[^*]+)\.?\*\*\s*$", l)
        if m and i + 1 < n and lines[i + 1].strip().startswith("*In reality"):
            flush(); ttl = m.group(1).strip().rstrip(".")
            real = re.sub(r"^\*[^*]+:\*\s*", "", lines[i + 1].strip()); i += 2
            blocks.append({"type": "analogy", "content": {"title": ttl, "explanation": "", "in_reality": clean(real, where)}}); continue
        m = re.match(r"\*\*Text:\*\*\s*(.*)", l)
        if m:
            if m.group(1).strip(): buf.append(clean(m.group(1), where))
            i += 1; continue
        # ordinary line (paragraph / bullet / bold heading)
        t = clean(raw, where)
        if t: buf.append(t)
        i += 1
    flush()
    return blocks

def split_quiz(lines, where):
    qs = []
    for l in lines:
        m = re.match(r"\d+\.\s+\*\*(.+?)\*\*\s*(.*)", l.strip())
        if not m: continue
        q, rest = m.group(1).strip(), m.group(2).strip()
        mm = re.search(r"\*\(Not (.*?)\)\*", rest)
        correct = re.sub(r"\s*\*\(Not .*?\)\*", "", rest).strip().rstrip(".")
        wrong = []
        if mm:
            t = mm.group(1).strip().rstrip(".")
            t = t.replace('"', "").replace("“", "").replace("”", "")
            wrong = [w.strip() for w in re.split(r"\s+or\s+", t) if w.strip()]
            wrong = [w[:1].upper() + w[1:] for w in wrong]
        qs.append({"prompt": q, "correct": correct[:1].upper() + correct[1:], "wrong": wrong})
    return qs


# --- Inline quotes the doc marks as unchecked: take the exact words out of the learner text
# (paraphrase in the sentence) and keep them as hidden, unverified quote blocks to confirm later.
PREACH = ("Prabh", None)
INLINE = [
 ("Householder, businessman, and the first preaching", 'recalled the reply: "You try to preach in English language" (Lecture, February 15, 1971).', "recalled that his guru told him to preach in English.", {"quote_text": "You try to preach in English language", "source_reference": "Lecture, February 15, 1971 (confirm the place)", "speaker": "\u015ar\u012bla Prabhup\u0101da", "verified": False}),
 ("Retirement, renunciation and V\u1e5bnd\u0101vana", 'expressed years earlier: "I had a desire to print some books" (as recorded in *Prabhup\u0101da-l\u012bl\u0101m\u1e5bta*).', "expressed years earlier, to print books.", {"quote_text": "I had a desire to print some books", "source_reference": "as recorded in Prabhup\u0101da-l\u012bl\u0101m\u1e5bta", "verified": False}),
 ("Core Value 2: Self-Discipline", 'why such rules exist: "Just to keep you in goodness" (Lecture on *\u015ar\u012bmad-Bh\u0101gavatam* 7.9.8, Seattle, October 21, 1968).', "that such rules exist to keep us in the mode of goodness.", {"quote_text": "Just to keep you in goodness", "source_reference": "Lecture on \u015ar\u012bmad-Bh\u0101gavatam 7.9.8, Seattle, October 21, 1968", "speaker": "\u015ar\u012bla Prabhup\u0101da", "verified": False}),
 ("Rebirth", 'It is built "so that they may be rectified" (Lecture, San Diego, June 29, 1972), and it', "It is built so that its inmates may be reformed, and it", {"quote_text": "so that they may be rectified", "source_reference": "Lecture, San Diego, June 29, 1972", "speaker": "\u015ar\u012bla Prabhup\u0101da", "verified": False}),
]
EXTRA_WRONG = {
 "How is spiritual knowledge kept pure": ["By teachers adding their own opinions in each generation"],
 "Why is Prabh": ["Because he was only the first president of the society"],
 "What did his guru say": ["Join the independence movement full time"],
 "How is each verse presented": ["Translation only, without any commentary", "Pictures and stories only"],
 "Why is not sharing spiritual": ["Because it makes the person physically ill"],
 "How does consistently eating": ["It makes the mind sharper"],
 "What is the main spiritual benefit": ["Better physical strength", "A higher income"],
 "Why does God provide rules": ["To punish living beings", "To keep living beings busy"],
 "Which of the five factors": ["God", "Time", "Material nature"],
 "What decides the next body": ["The place where the person dies"],
}
def apply_patches(plan):
    for title_part, old, new, qc in INLINE:
        done = False
        for m in plan["modules"]:
            for l in m["lessons"]:
                if title_part not in l["title"]: continue
                for bi, b in enumerate(l["blocks"]):
                    fld = "text" if b["type"] == "text" else ("in_reality" if b["type"] == "analogy" else None)
                    if fld and old in b["content"].get(fld, ""):
                        b["content"][fld] = b["content"][fld].replace(old, new)
                        l["blocks"].insert(bi + 1, {"type": "quote", "content": qc}); note("Module/%s" % l["title"], "QUOTE NOT VERIFIED (hidden from learners): " + qc["quote_text"] + " [" + qc["source_reference"] + "]"); done = True; break
        if not done: sys.exit("patch not applied: " + title_part)
    for m in plan["modules"]:
        for q in m["quiz"]["questions"]:
            for k, extra in EXTRA_WRONG.items():
                if q["prompt"].startswith(k): q["options"] += [{"text": e} for e in extra]

def build():
    text = open(SRC, encoding="utf-8").read().split("# APPENDIX A")[0]
    lines = text.split("\n")
    modules, cur_mod, cur = [], None, None
    def close():
        nonlocal cur
        if cur is not None and cur_mod is not None:
            cur_mod["_raw"].append(cur); cur = None
    for l in lines:
        m = re.match(r"# MODULE (\d+): (.*)", l)
        if m: close(); cur_mod = {"n": int(m.group(1)), "title": m.group(2).strip(), "_raw": [], "intro": []}; modules.append(cur_mod); continue
        if l.startswith("# Part"): close(); 
        m2 = re.match(r"## (Lesson|Screen) \d+: (.*)", l)
        if m2: close(); cur = {"kind": "lesson", "title": m2.group(2).strip(), "body": []}; continue
        m3 = re.match(r"## Module \d+ quiz", l)
        if m3: close(); cur = {"kind": "quiz", "title": "quiz", "body": []}; continue
        if l.strip() == "---": close(); continue
        if l.startswith("# Part") : cur_mod["intro"].append(l[2:].strip()); continue
        if cur is not None: cur["body"].append(l)
        elif cur_mod is not None: cur_mod["intro"].append(l)
    close()
    course = {"title": "Introduction to ISKCON", "subtitle": "A gentle, self-paced start: who we are, who Prabhupāda was, what we value and what we believe",
              "description": "Four short modules for anyone curious about ISKCON. Each lesson takes about four minutes. Go at your own pace; there are no deadlines and no exams you can fail.",
              "category": "Basics", "level": "beginner", "visibility": "public", "estimated_minutes": 120, "sequential_unlock": False,
              "certificate_enabled": False, "discussion_mode": "ask_question", "lesson_feedback_enabled": True, "reviews_enabled": True}
    plan = {"course": course, "modules": []}
    for mo in modules:
        intro = " ".join(x.strip() for x in mo["intro"] if x.strip() and not x.startswith("**Intro screen"))
        intro = strip_md(intro)[:600]
        mod = {"title": mo["title"], "intro_text": intro if mo["n"] == 4 else None, "lessons": []}
        for r in mo["_raw"]:
            where = "Module %d, %s" % (mo["n"], r["title"])
            if r["kind"] == "quiz":
                qs = split_quiz(r["body"], where)
                mod["quiz"] = {"kind": "review", "graded": False, "questions": [
                    {"type": "multiple_choice", "prompt": q["prompt"], "explanation": None,
                     "options": [{"text": q["correct"], "correct": True}] + [{"text": w} for w in q["wrong"]]} for q in qs]}
            else:
                blocks = convert_lesson(r["title"], r["body"], where)
                mod["lessons"].append({"title": r["title"], "est_minutes": 4, "blocks": blocks})
        plan["modules"].append(mod)
    return plan

if __name__ == "__main__":
    plan = build()
    # Module 2 opens with a timeline (static; link the points to lessons later in the editor)
    tl = [("1896", "Born in Calcutta"), ("1920s", "Gandhi's movement, and meeting his guru (1922)"), ("1933", "Formal initiation"), ("1936", "The final letter from his guru"),
          ("1944", "Starts Back to Godhead magazine"), ("1947", "Receives the title Bhaktivedanta"), ("1950", "Retires from business and family life"),
          ("1959", "Takes the renounced order"), ("1965", "Sails to America"), ("1966", "Founds ISKCON in New York"), ("1977", "Passes away in Vrindavan")]
    m2 = plan["modules"][1]
    m2["lessons"].insert(0, {"title": "His life at a glance", "est_minutes": 2, "blocks": [
        {"type": "text", "content": {"text": "A quick map of Prabhupāda's life before we look at each stage."}},
        {"type": "timeline", "content": {"items": [{"label": a, "title": b} for a, b in tl]}}]})
    apply_patches(plan)
    json.dump(plan, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    with open(NOTES, "w", encoding="utf-8") as f:
        f.write("# Intro to ISKCON: import notes\n\nGenerated by tools/convert_course.py. These are the editor's notes that were taken OUT of the learner text, the media suggestions per lesson, and every quote that is still hidden because it is not verified.\n\n")
        cur = None
        for w, t in notes:
            if w != cur: f.write("\n## " + w + "\n"); cur = w
            f.write("- " + t + "\n")
    n = {"modules": len(plan["modules"]), "lessons": sum(len(m["lessons"]) for m in plan["modules"]),
         "blocks": sum(len(l["blocks"]) for m in plan["modules"] for l in m["lessons"]),
         "quotes": sum(1 for m in plan["modules"] for l in m["lessons"] for b in l["blocks"] if b["type"] == "quote"),
         "unverified": sum(1 for m in plan["modules"] for l in m["lessons"] for b in l["blocks"] if b["type"] == "quote" and not b["content"]["verified"]),
         "questions": sum(len(m.get("quiz", {}).get("questions", [])) for m in plan["modules"])}
    print(n)
