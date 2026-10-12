import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';
import MiniSearch from 'minisearch';

// iconv-lite is CJS — bridge via createRequire
const _require = createRequire(import.meta.url);
const iconv = _require('iconv-lite') as { decode: (buf: Buffer, enc: string) => string };

const __dir = dirname(fileURLToPath(import.meta.url));

// --- Config ------------------------------------------------------------------

const CHUNK_SIZE = 450;
const CHUNK_OVERLAP = 60;
const TOP_K = 20;       // candidates per retriever before RRF
const RRF_K = 60;
const FINAL_K = 3;      // passages returned to Claude
const VOYAGE_BATCH = 64;

const CACHE_PATH = join(__dir, '.rag-cache.json');

const BOOKS = [
  {
    source: 'uk' as const,
    encoding: 'utf-8',
    path: join(__dir, '../documentation/nils_ua.html'),
  },
  {
    source: 'ru' as const,
    encoding: 'windows-1251',
    path: join(__dir, '../documentation/nils_ru_full.html'),
  },
];

// --- Types -------------------------------------------------------------------

interface Chunk {
  id: number;
  text: string;
  source: 'uk' | 'ru';
}

interface Cache {
  mtimes: Record<string, number>;
  chunks: Chunk[];
  embeddings: number[][];
}

interface RagIndex {
  chunks: Chunk[];
  normEmbeddings: number[][];  // empty when running BM25-only
  miniSearch: MiniSearch<Chunk>;
}

// --- HTML → chunks -----------------------------------------------------------

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#?\w+;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitIntoChunks(text: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + CHUNK_SIZE, text.length);
    let breakAt = end;
    if (end < text.length) {
      const dot = text.lastIndexOf('.', end);
      const nl = text.lastIndexOf('\n', end);
      const boundary = Math.max(dot, nl);
      if (boundary > i + CHUNK_SIZE / 2) breakAt = boundary + 1;
    }
    const chunk = text.slice(i, breakAt).trim();
    if (chunk.length > 60) result.push(chunk);
    i = Math.max(i + 1, breakAt - CHUNK_OVERLAP);
  }
  return result;
}

function buildChunks(): Chunk[] {
  const chunks: Chunk[] = [];
  let id = 0;
  for (const book of BOOKS) {
    // Source texts are not in the repo (third-party translations) — see README
    if (!existsSync(book.path)) {
      console.warn(`RAG: ${book.source} source text not found, skipping: ${book.path}`);
      continue;
    }
    const buf = readFileSync(book.path);
    const html = book.encoding === 'utf-8'
      ? buf.toString('utf-8')
      : iconv.decode(buf, book.encoding);
    for (const text of splitIntoChunks(stripHtml(html))) {
      chunks.push({ id: id++, text, source: book.source });
    }
  }
  return chunks;
}

// --- VoyageAI embeddings -----------------------------------------------------

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: texts, model: 'voyage-multilingual-2' }),
  });
  if (!res.ok) throw new Error(`VoyageAI ${res.status}: ${await res.text()}`);
  const data = await res.json() as { data: { embedding: number[] }[] };
  return data.data.map(d => d.embedding);
}

async function embedAll(chunks: Chunk[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (let i = 0; i < chunks.length; i += VOYAGE_BATCH) {
    const batch = chunks.slice(i, i + VOYAGE_BATCH);
    process.stdout.write(`\rRAG: embedding ${i + batch.length}/${chunks.length}…`);
    embeddings.push(...await embedBatch(batch.map(c => c.text)));
  }
  process.stdout.write('\n');
  return embeddings;
}

// --- Cosine similarity -------------------------------------------------------

function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm === 0 ? v : v.map(x => x / norm);
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

// --- Cache -------------------------------------------------------------------

function bookMtimes(): Record<string, number> {
  return Object.fromEntries(BOOKS.map(b => [b.source, existsSync(b.path) ? statSync(b.path).mtimeMs : 0]));
}

function isCacheValid(cache: Cache): boolean {
  const current = bookMtimes();
  return BOOKS.every(b => cache.mtimes[b.source] === current[b.source]);
}

// --- Init & search -----------------------------------------------------------

let index: RagIndex | null = null;

function buildMiniSearch(chunks: Chunk[]): MiniSearch<Chunk> {
  const ms = new MiniSearch<Chunk>({
    fields: ['text'],
    idField: 'id',
    storeFields: ['text', 'source'],
  });
  ms.addAll(chunks);
  return ms;
}

export async function initRag(): Promise<void> {
  const hasVoyage = Boolean(process.env.VOYAGE_API_KEY);

  if (!hasVoyage) {
    console.warn('RAG: VOYAGE_API_KEY not set — running BM25-only mode');
    const chunks = buildChunks();
    index = { chunks, normEmbeddings: [], miniSearch: buildMiniSearch(chunks) };
    console.log(`RAG ready (BM25-only) — ${chunks.length} chunks`);
    return;
  }

  let chunks: Chunk[];
  let embeddings: number[][] | null = null;

  // Load or build chunks (fast — no API calls)
  if (existsSync(CACHE_PATH)) {
    const cache: Cache = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
    if (isCacheValid(cache) && cache.embeddings.length > 0) {
      console.log('RAG: cache hit — loading hybrid index');
      index = {
        chunks: cache.chunks,
        normEmbeddings: cache.embeddings.map(normalize),
        miniSearch: buildMiniSearch(cache.chunks),
      };
      console.log(`RAG ready (hybrid) — ${cache.chunks.length} chunks`);
      return;
    }
    if (isCacheValid(cache)) {
      chunks = cache.chunks; // BM25-only cache, try to add embeddings
    } else {
      chunks = buildChunks();
    }
  } else {
    chunks = buildChunks();
  }

  // Attempt embedding — fall back to BM25-only on failure
  try {
    console.log(`RAG: embedding ${chunks.length} chunks via VoyageAI…`);
    embeddings = await embedAll(chunks);
    writeFileSync(CACHE_PATH, JSON.stringify({ mtimes: bookMtimes(), chunks, embeddings }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`RAG: embedding failed (${msg.slice(0, 120)}) — falling back to BM25-only`);
  }

  index = {
    chunks,
    normEmbeddings: embeddings ? embeddings.map(normalize) : [],
    miniSearch: buildMiniSearch(chunks),
  };
  const mode = embeddings ? 'hybrid' : 'BM25-only';
  console.log(`RAG ready (${mode}) — ${chunks.length} chunks`);
}

export async function searchStory(query: string): Promise<string> {
  if (!index) return 'Story index not initialised.';

  const { chunks, normEmbeddings, miniSearch } = index;

  // BM25
  const bm25Results = miniSearch.search(query, { limit: TOP_K });
  const bm25Ranked = bm25Results.map(r => r.id as number);

  // Semantic (only when embeddings available)
  let semanticRanked: number[] = [];
  if (normEmbeddings.length > 0) {
    const [qEmbed] = await embedBatch([query]);
    const qNorm = normalize(qEmbed);
    semanticRanked = normEmbeddings
      .map((e, i) => ({ i, score: dot(qNorm, e) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K)
      .map(s => s.i);
  }

  // RRF merge
  const scores = new Map<number, number>();
  const addRanked = (ranked: number[]) =>
    ranked.forEach((id, rank) =>
      scores.set(id, (scores.get(id) ?? 0) + 1 / (RRF_K + rank + 1)),
    );
  addRanked(bm25Ranked);
  addRanked(semanticRanked);

  const topIds = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, FINAL_K)
    .map(([id]) => id);

  if (topIds.length === 0) return 'No relevant passages found.';

  return topIds
    .map(id => `[${chunks[id].source.toUpperCase()}] ${chunks[id].text}`)
    .join('\n\n---\n\n');
}
