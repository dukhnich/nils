# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Vite + React 19 + TypeScript, ESLint (typescript-eslint + react-hooks + react-refresh).

## Commands

- `npm install` — install dependencies
- `npm run dev` — start the Vite dev server (default http://localhost:5173)
- `npm run build` — typecheck (`tsc -b`) and produce a production build in `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — run ESLint over the project

No test runner is configured yet. Add one (e.g. Vitest) before documenting single-test invocation.

## Architecture

Single-page app. Entry point is `src/main.tsx`, which mounts `<App />` from `src/App.tsx` into `#root` in `index.html`. Static assets live in `public/` and `src/assets/`. There is no router, state management, or backend wiring — add a note here once those exist and aren't obvious from a quick read.
