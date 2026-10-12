#!/usr/bin/env python3
"""Extract chapter titles, line numbers, and opening snippets from the RU Brauде HTML.

The file is windows-1251 encoded — this script handles that automatically.

Usage:
    python3 extract_ru_chapters.py [path/to/nils_ru_full.html]

Defaults to documentation/nils_ru_full.html relative to the repo root.
Prints a Markdown table suitable for references/ru_chapters.md.
"""

import re
import sys
from pathlib import Path

DEFAULT = "documentation/nils_ru_full.html"

# Roman numerals I–LV followed immediately by a Cyrillic title (no space in the HTML)
CHAPTER_RE = re.compile(
    r"^(I{1,3}|IV|VI{0,3}|IX|XI{0,3}|XIV|XV|XVI{0,3}|XIX|XX{1,3}|"
    r"XXI{0,3}|XXIV|XXV|XXVI{0,3}|XXIX|XXX{1,2}|XXXI{0,3}|XXXIV|XXXV|"
    r"XXXVI{0,3}|XXXIX|XL|XLI{0,3}|XLIV|XLV|XLVI{0,3}|XLIX|L|LI{0,3}|LIV|LV)"
    r"([А-ЯЁ][А-ЯЁа-яёЁ\s\-\[\]0-9,\.]+)$"
)

DATE_RE = re.compile(
    r"(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|"
    r"октября|ноября|декабря|понедельник|вторник|среда|четверг|пятница|"
    r"суббота|воскресенье)",
    re.IGNORECASE,
)


def strip_tags(s):
    return re.sub(r"<[^>]+>", "", s).strip()


def extract(path: Path):
    with open(path, encoding="windows-1251", errors="replace") as f:
        lines = f.readlines()

    chapters = []
    for i, line in enumerate(lines, 1):
        t = strip_tags(line).strip()
        m = CHAPTER_RE.match(t)
        if m:
            num = m.group(1)
            title = m.group(2).strip()[:80]
            # look for a short subtitle on the next non-empty, non-date line
            subtitle = ""
            for j in range(i, min(i + 4, len(lines))):
                s = strip_tags(lines[j]).strip()
                if s and len(s) < 80 and not CHAPTER_RE.match(s) and not DATE_RE.search(s):
                    subtitle = s
                    break
            chapters.append((i, num, title, subtitle))

    # find body snippet: first substantial paragraph after heading+subtitle+date
    print("| # | Title (RU) | HTML line | Theme / location |")
    print("|---|-----------|-----------|-----------------|")

    for lineno, num, title, subtitle in chapters:
        sub_str = f" [{subtitle}]" if subtitle and subtitle != title[: len(subtitle)] else ""
        # gather a short body snippet
        snippet_parts = []
        skip_header = True
        for line in lines[lineno : lineno + 30]:
            t = strip_tags(line).strip()
            if not t:
                continue
            if skip_header and (CHAPTER_RE.match(t) or DATE_RE.search(t) or t == subtitle):
                continue
            skip_header = False
            snippet_parts.append(t)
            if sum(len(x) for x in snippet_parts) > 180:
                break
        snippet = " ".join(snippet_parts)[:180].replace("|", "\\|")
        display_title = f"{title}{sub_str}"
        print(f"| {num} | {display_title} | {lineno} | {snippet} |")


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(DEFAULT)
    if not path.exists():
        sys.exit(f"File not found: {path}")
    extract(path)
