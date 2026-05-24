# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Frontend**: Vite + React 19 + TypeScript, ESLint (typescript-eslint + react-hooks + react-refresh)
- **Backend**: Express 5 + `@anthropic-ai/sdk`, run with `tsx`
- **RAG**: MiniSearch (BM25) + optional VoyageAI hybrid embeddings (`voyage-multilingual-2`)

## Commands

- `npm run dev` — start both Vite (port 5173) and the Express API server (port 3001) concurrently
- `npm run dev:client` / `npm run dev:server` — run either side independently
- `npm run build` — typecheck (`tsc -b`) and produce a production build in `dist/`
- `npm run lint` — run ESLint over the project
- `npm run eval` — run `scripts/eval.ts` (evaluation harness)

No test runner is configured yet.

## Environment variables

Create a `.env` file in the project root:
- `ANTHROPIC_API_KEY` — required for all chat functionality
- `VOYAGE_API_KEY` — optional; enables hybrid BM25+semantic RAG (falls back to BM25-only if absent)

## Architecture

**Frontend** (`src/`): Single-page app. `src/main.tsx` → `<App />` → `<CharacterChat />`. All chat state lives in `CharacterChat.tsx`. `src/characters.ts` defines the six playable characters (Nils, Morten, Akka, Smirre, Gorgo, Dunfin) with their system prompts, temperatures, stop sequences, and prefill strings. `src/lib/claude.ts` POSTs to `/api/chat` and consumes SSE. Vite proxies `/api/*` to `localhost:3001`.

**Backend** (`server/`): Express server exposing `POST /api/chat`.
- Runs a **tool loop** (up to 5 iterations) using non-streaming `client.messages.create` until Claude stops calling tools, then streams the final response via SSE.
- Tools available to Claude: `get_character_info` (keyword lookup in `server/knowledge.ts`), `search_story` (RAG via `server/rag.ts`), `save_memory` / `recall_memory` / `list_memories` (in-memory session store, 2 h TTL).
- Prefill assistant turns are injected into the message array before the API call to guide character voice.
- Prompt caching: the last user message always gets `cache_control: { type: 'ephemeral' }`.

**RAG** (`server/rag.ts`): Indexes two HTML source texts from `documentation/` (Ukrainian UTF-8 + Russian Windows-1251). On startup, chunks them, optionally embeds with VoyageAI, and caches to `server/.rag-cache.json`. Search uses RRF to merge BM25 and cosine-similarity rankings, returning up to 3 passages.

**Book images** (`public/images/band1/`, `public/images/band2/`): Scanned illustrations served as static files. `src/lib/images.ts` exports `BOOK_IMAGES`. The gallery (`ImageGallery.tsx`) is always mounted (never unmounted) to avoid browser auto-scroll bugs; images selected in the gallery are base64-encoded and sent as vision blocks in the next message.
