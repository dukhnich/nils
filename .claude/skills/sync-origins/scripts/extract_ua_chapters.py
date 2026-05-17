#!/usr/bin/env python3
"""Extract chapter titles and opening snippets from the UA abridged HTML.

Usage:
    python3 extract_ua_chapters.py [path/to/ua.html]

Defaults to documentation/laherlef-selma-*.html relative to the repo root.
Prints a Markdown table suitable for references/ua_chapters.md.
"""

import re
import sys
from pathlib import Path

DEFAULT = (
    "documentation/laherlef-selma-dyvovyzhna-podorozh-nilsa-kholhersona-"
    "z-dykymy-husakamy-shvetsiieiu-(dyvovyzhni-mandry-nilsa-z-dykymy-husmy)8371.html"
)

UA_CHAPTER_RE = re.compile(
    r"Розділ (перший|другий|третій|четвертий|п.ятий|шостий|сьомий|восьмий|"
    r"дев.ятий|десятий|одинадцятий|дванадцятий|тринадцятий|чотирнадцятого|"
    r"чотирнадцятий|п.ятнадцятий|шістнадцятий|сімнадцятий)"
)


def strip_tags(s):
    return re.sub(r"<[^>]+>", "", s).strip()


def extract(path: Path):
    with open(path, encoding="utf-8", errors="replace") as f:
        lines = f.readlines()

    chapters = []
    for i, line in enumerate(lines, 1):
        t = strip_tags(line).strip()
        if UA_CHAPTER_RE.search(t):
            chapters.append((i, t))

    print("| # | Title (UA) | HTML line | Opening scene / key content |")
    print("|---|-----------|-----------|------------------------------|")

    for idx, (lineno, title) in enumerate(chapters, 1):
        snippet_parts = []
        for line in lines[lineno : lineno + 25]:
            text = strip_tags(line).strip()
            if text and text not in ("", "\xa0"):
                snippet_parts.append(text)
            if sum(len(x) for x in snippet_parts) > 200:
                break
        snippet = " ".join(snippet_parts)[:200].replace("|", "\\|")
        print(f"| {idx} | {title} | {lineno} | {snippet} |")


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(DEFAULT)
    if not path.exists():
        sys.exit(f"File not found: {path}")
    extract(path)
