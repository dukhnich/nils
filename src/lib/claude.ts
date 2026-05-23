export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function streamChat(
  systemPrompt: string,
  messages: ChatMessage[],
  onText: (delta: string) => void,
  signal?: AbortSignal,
  temperature?: number,
  stopSequences?: string[],
  prefill?: string,
  sessionId?: string,
  images?: string[],
): Promise<void> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, messages, temperature, stopSequences, prefill, sessionId, images }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Server error ${res.status}${body ? `: ${body}` : ''}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      const parsed = JSON.parse(data) as { text?: string; error?: string };
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.text) onText(parsed.text);
    }
  }
}
