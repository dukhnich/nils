import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { lookupFact } from './knowledge';

const app = express();
app.use(express.json());

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
];

// --- Tool executor ------------------------------------------------------------

function executeTool(name: string, input: Record<string, string>, sessionId: string): string {
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

    default:
      return `Unknown tool: ${name}`;
  }
}

// --- Chat route ---------------------------------------------------------------

type Message = { role: 'user' | 'assistant'; content: string };

app.post('/api/chat', async (req, res) => {
  const {
    systemPrompt,
    messages,
    temperature,
    stopSequences,
    prefill,
    sessionId = 'anonymous',
  } = req.body as {
    systemPrompt: string;
    messages: Message[];
    temperature?: number;
    stopSequences?: string[];
    prefill?: string;
    sessionId?: string;
  };

  const seed: Anthropic.MessageParam[] = prefill
    ? [...messages, { role: 'assistant', content: prefill }]
    : messages;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let activeStream: ReturnType<typeof client.messages.stream> | null = null;
  req.on('close', () => activeStream?.abort());

  try {
    // Tool loop — runs non-streaming until Claude stops calling tools
    let currentMessages: Anthropic.MessageParam[] = [...seed];

    for (let i = 0; i < 5; i++) {
      const resp = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        temperature,
        stop_sequences: stopSequences,
        system: systemPrompt,
        messages: currentMessages,
        tools: TOOLS,
      });

      if (resp.stop_reason !== 'tool_use') break;

      currentMessages = [...currentMessages, { role: 'assistant', content: resp.content }];

      const results: Anthropic.ToolResultBlockParam[] = resp.content
        .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
        .map((b) => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: executeTool(b.name, b.input as Record<string, string>, sessionId),
        }));

      currentMessages = [...currentMessages, { role: 'user', content: results }];
    }

    // Stream the final response (no tools offered → guaranteed text output)
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      temperature,
      stop_sequences: stopSequences,
      system: systemPrompt,
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
app.listen(PORT, () => console.log(`API server → http://localhost:${PORT}`));
