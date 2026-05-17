import Anthropic from '@anthropic-ai/sdk';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

let client: Anthropic | null = null;

export function initClient(apiKey: string): void {
  client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export function isClientReady(): boolean {
  return client !== null;
}

export async function streamChat(
  systemPrompt: string,
  messages: ChatMessage[],
  onText: (delta: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!client) throw new Error('Anthropic client not initialised — provide an API key first.');

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-0',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  // Abort support: cancel the underlying request if the signal fires
  signal?.addEventListener('abort', () => stream.abort());

  stream.on('text', onText);
  await stream.finalMessage();
}
