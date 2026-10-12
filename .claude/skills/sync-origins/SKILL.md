---
name: sync-origins
description: Use this skill any time you are about to work on plot — choosing or quoting a text passage, defining/extending a module's scenes, drafting summaries or questions about events, or otherwise leaning on what happens in the story. Forces a cross-check between the book and the TV episode list before producing content.
allowed-tools: Read, Grep, Glob, Bash, WebFetch, WebSearch
model: sonnet
---

# Sync Origins Skill

The book and the TV series are not always aligned: episodes reorder events, compress arcs, or invent scenes. The Ukrainian book text is also an abridged 17-chapter edition, so it can miss material the episodes draw on. Whenever you are about to write or reason about *what happens* in the story, you must first reconcile the canonical sources defined in `documentation/08_source_sync.md`:

- **Primary book text (UA, abridged, 17 chapters):** `documentation/nils_ua.html`
- **Fallback book text (RU, full Brauде translation, 1982, ~55 chapters):** `documentation/nils_ru_full.html` (windows-1251 encoded); use only when the UA edition is missing the needed scene/passage.
- **Episode synopses:** `https://www.imdb.com/title/tt0296386/episodes/`

## When this skill applies

Trigger on any plot-touching task, e.g.:

- Picking a passage to read aloud or quote in module materials
- Defining or revising module boundaries / episode coverage
- Writing summaries, questions, or activities tied to specific events
- Resolving conflicts between what the book says and what an episode shows

Skip when the task is purely formatting, layout, or non-plot metadata.

## Steps

1. **Identify the anchor** — is the starting point a *text fragment* (chapter, scene, quote) or an *episode range* (e.g. "S01E03")? Write down which you know.
2. **Locate the counterpart in the UA text first**
   - Consult `references/ua_chapters.md` for the chapter index (titles, HTML line numbers, key content) before opening the full HTML.
   - Consult `references/episodes.md` for the episode index and the book↔episode alignment notes before fetching IMDB.
   - Text → episode: use the alignment notes to find which episode(s) cover that scene; confirm against IMDB synopses if needed.
   - Episode → text: use the chapter index to find the HTML line and open that section of the UA book HTML.
3. **If the UA text is missing the needed material, fall back to the RU full edition (Brauде, 1982)**
   - Confirm the gap is real (the scene is not in the UA 17-chapter abridgement, not just under a different chapter title).
   - Consult `references/ru_chapters.md` for the RU chapter index (titles, HTML line numbers, province/theme, UA↔RU alignment table) before opening the full RU HTML.
   - The RU file (`documentation/nils_ru_full.html`) is windows-1251 encoded — read it with `python3 open(..., encoding="windows-1251")`, not plain `cat`.
   - Locate the corresponding passage in the RU full translation referenced in `08_source_sync.md`.
   - When quoting from RU, output the **Russian original** AND an **auto-translation into Ukrainian** side by side, and label both clearly (`оригінал (рос., Брауде 1982)` / `автопереклад укр.`). Never present a Russian-derived passage as if it were the UA canonical text.
4. **Compare** — note any mismatches between book(s) and episode: reordered events, omitted characters, invented scenes, compressed arcs, or content present only in the RU full edition.
5. **Decide the working scope** — pick the specific text passage *and* the specific episode(s) you will use. If they conflict, follow the rule from `08_source_sync.md`: module logic follows the **real episode plot** and the module's agreed learning focus, not the book where they diverge.
6. **Only now** produce the requested output (quote, summary, question set, scene list, etc.), citing the text source (UA or RU+autotranslation) and the episode(s) you settled on.

## Rules

- Never produce plot-grounded content from memory or from only one source — always pin both a text passage and an episode reference before writing.
- **Priority of book sources: UA abridged → RU full.** Reach for RU only after confirming the UA edition does not cover the scene.
- When citing UA, give a locatable anchor: chapter title / heading from the HTML.
- When citing RU, label the quote as `оригінал (рос., Брауде 1982)` and provide a Ukrainian auto-translation directly beneath it; the user reads the UA rendering, the RU is there for traceability.
- For episodes, anchor with `S01E0X` (or episode title) from the IMDB list.
- If the two sources clearly disagree, surface the divergence in the output so the user can decide; don't silently pick one.
- Reference `documentation/08_source_sync.md` for the canonical source list rather than re-pasting URLs.
