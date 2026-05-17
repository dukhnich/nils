import 'dotenv/config';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(express.json());

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

type Message = { role: 'user' | 'assistant'; content: string };

app.post('/api/chat', async (req, res) => {
  const { systemPrompt, messages, temperature, stopSequences } = req.body as {
    systemPrompt: string;
    messages: Message[];
    temperature?: number;
    stopSequences?: string[];
  };

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      temperature,
      stop_sequences: stopSequences,
      system: systemPrompt,
      messages,
    });

    req.on('close', () => stream.abort());

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
