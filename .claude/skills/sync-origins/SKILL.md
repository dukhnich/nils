---
name: sync-origins
description: Use this skill any time you are about to work on plot — choosing or quoting a text passage, defining/extending a module's scenes, drafting summaries or questions about events, or otherwise leaning on what happens in the story. Forces a cross-check between the book and the TV episode list before producing content.
---

# Sync Origins Skill

The book and the TV series are not always aligned: episodes reorder events, compress arcs, or invent scenes. Whenever you are about to write or reason about *what happens* in the story, you must first reconcile the two canonical sources defined in `documentation/08_source_sync.md`:

- **Book text:** `documentation/laherlef-selma-dyvovyzhna-podorozh-nilsa-kholhersona-z-dykymy-husakamy-shvetsiieiu-(dyvovyzhni-mandry-nilsa-z-dykymy-husmy)8371.html`
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
2. **Locate the counterpart**
   - Text → episode: scan the IMDB episode synopses to find which episode(s) cover that scene.
   - Episode → text: open the book HTML and find the chapter(s) the episode is drawn from.
3. **Compare** — note any mismatches: reordered events, omitted characters, invented scenes, compressed arcs.
4. **Decide the working scope** — pick the specific text passage *and* the specific episode(s) you will use. If they conflict, follow the rule from `08_source_sync.md`: module logic follows the **real episode plot** and the module's agreed learning focus, not the book where they diverge.
5. **Only now** produce the requested output (quote, summary, question set, scene list, etc.), citing both the text passage and the episode(s) you settled on.

## Rules

- Never produce plot-grounded content from memory or from only one source — always pin both a text passage and an episode reference before writing.
- When citing, give a locatable anchor: chapter title / heading from the HTML for text, `S01E0X` (or episode title) for the series.
- If the two sources clearly disagree, surface the divergence in the output so the user can decide; don't silently pick one.
- Reference `documentation/08_source_sync.md` for the canonical source list rather than re-pasting URLs.
