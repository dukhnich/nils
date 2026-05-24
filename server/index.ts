import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { lookupFact } from './knowledge';
import { initRag, searchStory } from './rag';

const app = express();
app.use(express.json({ limit: '50mb' }));

const client = new Anthropic();

// --- Session memory -----------------------------------------------------------

const sessionStore = new Map<string, Map<string, string>>();
const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 h

function getSession(id: string): Map<string, string> {
  if (!sessionStore.has(id)) {
    sessionStore.set(id, new Map());
    setTimeout(() => sessionStore.delete(id), SESSION_TTL);
  }
  return sessionStore.get(id)!;
}

// --- Tool definitions ---------------------------------------------------------

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_character_info',
    description:
      'Look up canon facts about a character, place, or story element in the Nils Holgersson story. Call this before answering questions about specific characters, locations, relationships, or events to make sure your answer is accurate.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            "The character, place, or concept to look up — e.g. 'nils', 'akka', 'smirre', 'kebnekaise', 'tomte', 'migration'.",
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'save_memory',
    description:
      "Save something the reader tells you about themselves so it persists across this session, even when they switch to a different character. Use this when the reader shares their name, a preference, or anything worth remembering.",
    input_schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: "Short label for this memory, e.g. 'reader_name', 'favorite_character'.",
        },
        value: {
          type: 'string',
          description: 'The information to store.',
        },
      },
      required: ['key', 'value'],
    },
  },
  {
    name: 'recall_memory',
    description:
      "Retrieve something previously saved about this reader. Use when the reader asks 'do you remember…?' or references something they told another character.",
    input_schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: "The label used when the memory was saved, e.g. 'reader_name'.",
        },
      },
      required: ['key'],
    },
  },
  {
    name: 'list_memories',
    description:
      'List everything remembered about this reader in the current session. Call this at the start of a conversation to check for relevant context.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'search_story',
    description:
      'Search the full Nils Holgersson book text for relevant passages. Use for questions about specific episodes, events, provinces, minor characters, or anything not covered by get_character_info. Returns up to 3 passages from the Ukrainian and Russian source texts.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural-language search query in any language.',
        },
      },
      required: ['query'],
    },
  },
];

// --- Tool executor ------------------------------------------------------------

async function executeTool(name: string, input: Record<string, string>, sessionId: string): Promise<string> {
  switch (name) {
    case 'get_character_info':
      return lookupFact(input.query ?? '');

    case 'save_memory': {
      getSession(sessionId).set(input.key, input.value);
      return `Saved: ${input.key} = ${input.value}`;
    }

    case 'recall_memory': {
      const val = getSession(sessionId).get(input.key);
      return val !== undefined ? `${input.key}: ${val}` : `No memory found for "${input.key}".`;
    }

    case 'list_memories': {
      const entries = [...getSession(sessionId).entries()];
      return entries.length === 0
        ? 'No memories saved yet for this reader.'
        : entries.map(([k, v]) => `${k}: ${v}`).join('\n');
    }

    case 'search_story':
      return searchStory(input.query ?? '');

    default:
      return `Unknown tool: ${name}`;
  }
}

// --- Chat route ---------------------------------------------------------------

type Message = { role: 'user' | 'assistant'; content: string };

type SupportedMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

function parseImageBlock(dataUrl: string): Anthropic.ImageBlockParam {
  const comma = dataUrl.indexOf(',');
  const header = dataUrl.slice(0, comma);
  const data = dataUrl.slice(comma + 1);
  const mediaType = (header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg') as SupportedMediaType;
  return { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
}

function buildApiMessages(messages: Message[], images?: string[]): Anthropic.MessageParam[] {
  return messages.map((m, i) => {
    const isLastUser = i === messages.length - 1 && m.role === 'user';
    if (isLastUser && images && images.length > 0) {
      return {
        role: 'user',
        content: [...images.map(parseImageBlock), { type: 'text', text: m.content, cache_control: { type: 'ephemeral' } }],
      };
    }
    if (isLastUser) {
      return { role: 'user', content: [{ type: 'text', text: m.content, cache_control: { type: 'ephemeral' } }] };
    }
    return { role: m.role, content: m.content };
  });
}

// --- Illustration grounding workflow ------------------------------------------
// Step 1: identify the scene with a fast vision call
// Step 2: RAG search for matching story passages
// Returns a context string injected into the system prompt before the main call

async function groundIllustrations(images: string[], titles: string[]): Promise<string> {
  const titlesStr = titles.join(', ');

  // Step 1: RAG search by known title — precise, no inference needed
  const passages = await searchStory(titlesStr);
  const hasPassages = passages && passages !== 'No relevant passages found.' && passages !== 'Story index not initialised.';

  // Step 2: Haiku describes visual atmosphere — identification is already known
  const resp = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: [
        ...images.map(parseImageBlock),
        {
          type: 'text',
          text: `This is an illustration of ${titlesStr} from "The Wonderful Adventures of Nils Holgersson". Describe the visual mood, light, and most striking details. One or two sentences.`,
        },
      ],
    }],
  });

  const visual = resp.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '';

  const parts: string[] = [`Illustration: ${titlesStr}`];
  if (visual) parts.push(`Visual: ${visual}`);
  if (hasPassages) parts.push(`Story context:\n${passages}`);

  return parts.join('\n\n');
}

app.post('/api/chat', async (req, res) => {
  const {
    systemPrompt,
    messages,
    images,
    imageTitles,
    temperature,
    stopSequences,
    prefill,
    sessionId = 'anonymous',
  } = req.body as {
    systemPrompt: string;
    messages: Message[];
    images?: string[];
    imageTitles?: string[];
    temperature?: number;
    stopSequences?: string[];
    prefill?: string;
    sessionId?: string;
  };

  const apiMessages = buildApiMessages(messages, images);
  const seed: Anthropic.MessageParam[] = prefill
    ? [...apiMessages, { role: 'assistant', content: prefill }]
    : apiMessages;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let activeStream: ReturnType<typeof client.messages.stream> | null = null;
  req.on('close', () => activeStream?.abort());

  let effectiveSystemPrompt = systemPrompt;

  try {
    // Illustration grounding workflow — runs before the tool loop when images are present
    if (images && images.length > 0) {
      res.write(`data: ${JSON.stringify({ status: 'grounding' })}\n\n`);
      try {
        const context = await groundIllustrations(images, imageTitles ?? []);
        if (context) {
          effectiveSystemPrompt = `${systemPrompt}\n\n[ILLUSTRATION CONTEXT — the reader has shared an image with you. Use this to inform your response:\n${context}]`;
        }
      } catch {
        // fall through with original system prompt
      }
    }

    // Tool loop — runs non-streaming until Claude stops calling tools
    let currentMessages: Anthropic.MessageParam[] = seed;

    for (let i = 0; i < 5; i++) {
      const resp = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        temperature,
        stop_sequences: stopSequences,
        system: effectiveSystemPrompt,
        messages: currentMessages,
        tools: TOOLS,
      });

      if (resp.stop_reason !== 'tool_use') break;

      currentMessages = [...currentMessages, { role: 'assistant', content: resp.content }];

      const results: Anthropic.ToolResultBlockParam[] = await Promise.all(
        resp.content
          .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
          .map(async (b) => ({
            type: 'tool_result' as const,
            tool_use_id: b.id,
            content: await executeTool(b.name, b.input as Record<string, string>, sessionId),
          })),
      );

      currentMessages = [...currentMessages, { role: 'user', content: results }];
    }

    // Stream the final response (no tools offered → guaranteed text output)
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      temperature,
      stop_sequences: stopSequences,
      system: effectiveSystemPrompt,
      messages: currentMessages,
    });
    activeStream = stream;

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    await stream.finalMessage();
    res.write('data: [DONE]\n\n');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  }

  res.end();
});

const PORT = process.env.PORT ?? 3001;
await initRag();
app.listen(PORT, () => console.log(`API server → http://localhost:${PORT}`));
