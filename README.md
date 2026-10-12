# Nils chat

Chat with six characters from Selma Lagerlöf's *The Wonderful Adventures of Nils*: Nils, Morten the goose, Akka, Smirre the fox, Gorgo the eagle and Dunfin. The app is part of a children's reading course built around the book and the animated series; printable module materials for parents (in Ukrainian) are in [`documentation/`](./documentation).

I built it while preparing for the Claude Certified Architect – Foundations exam, to practise the Claude API end to end: tool use, retrieval, prompt caching, vision and evaluation.

## Features

- **Six characters**, each with its own system prompt, temperature, stop sequences and prefilled opening to keep the voice consistent.
- **Streaming answers** over Server-Sent Events.
- **Tool use**: the server runs a tool loop (up to 5 rounds) before streaming the final answer. Claude can look up character facts, search the book and save or recall memories for the session.
- **Retrieval over the book** (RAG): BM25 via MiniSearch, plus optional VoyageAI multilingual embeddings merged with reciprocal rank fusion.
- **Book illustrations**: pick scans from the gallery and they are sent to Claude as images in the next message.
- **Prompt caching** on the latest user turn.
- **UI in English and Ukrainian.**
- **Evaluation script** (`npm run eval`): asks every character the same question in English, Ukrainian and Russian, checks that the answer is in the same language and lets a second model score how faithful it is to the book.

## Stack

- Frontend: Vite, React 19, TypeScript, ESLint
- Backend: Express 5, `@anthropic-ai/sdk`, run with `tsx`
- Retrieval: MiniSearch (BM25), optional VoyageAI `voyage-multilingual-2`

## Getting started

```bash
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY; VOYAGE_API_KEY is optional
npm run dev            # Vite on :5173 and the API server on :3001
```

### Book texts

The book translations are not in the repository because they are third-party copyrighted texts. Without them the chat still works, but `search_story` finds nothing. To enable retrieval, save the HTML files locally under these names (they are git-ignored):

- `documentation/nils_ua.html` – Ukrainian abridged edition, UTF-8
- `documentation/nils_ru_full.html` – Russian translation by L. Braude (1982), Windows-1251

The sources are listed in [`documentation/08_source_sync.md`](./documentation/08_source_sync.md).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | client and server together |
| `npm run dev:client` / `npm run dev:server` | one side only |
| `npm run build` | type check and production build |
| `npm run lint` | ESLint |
| `npm run eval` | evaluation script (needs `ANTHROPIC_API_KEY`) |

## How it works

`src/components/CharacterChat.tsx` holds the chat state and calls `src/lib/claude.ts`, which posts to `/api/chat` and reads the SSE stream. Vite proxies `/api/*` to the Express server.

`server/index.ts` builds the message list with the character's prefill, runs the tool loop with non-streaming calls until Claude stops asking for tools, then streams the final answer. `server/rag.ts` splits the book texts into overlapping chunks, caches the index in `server/.rag-cache.json` and returns the top 3 passages.

The repository also includes a Claude Code skill, `.claude/skills/sync-origins`, which cross-checks the book against the episode list before any plot-related content is written.
