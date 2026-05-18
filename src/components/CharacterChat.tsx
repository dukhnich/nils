import { useEffect, useRef, useState } from 'react';
import { characters, type Character } from '../characters';
import { streamChat, type ChatMessage } from '../lib/claude';
import { isCyrillic } from '../lib/lang';
import './CharacterChat.css';

export function CharacterChat() {
  const [selectedChar, setSelectedChar] = useState<Character>(characters[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function selectCharacter(char: Character) {
    if (streaming) return;
    setSelectedChar(char);
    setMessages([]);
    setError('');
    inputRef.current?.focus();
  }

  async function sendMessage() {
    const text = draft.trim();
    if (!text || streaming) return;

    setDraft('');
    setError('');

    const prefill = isCyrillic(text) ? '— ' : (selectedChar.prefill ?? '');
    const userMsg: ChatMessage = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages([...history, { role: 'assistant', content: prefill }]);
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      await streamChat(
        selectedChar.systemPrompt,
        history,
        (delta) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = { ...last, content: last.content + delta };
            return updated;
          });
        },
        ctrl.signal,
        selectedChar.temperature,
        selectedChar.stopSequences,
        prefill || undefined,
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        // Remove the empty assistant placeholder on error
        setMessages((prev) => (prev[prev.length - 1]?.content === '' ? prev.slice(0, -1) : prev));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // — Main chat UI —
  return (
    <div className="cc-root">
      {/* Character picker */}
      <nav className="cc-picker" aria-label="Choose a character">
        {characters.map((char) => (
          <button
            key={char.id}
            className={`cc-char-btn ${selectedChar.id === char.id ? 'cc-char-btn--active' : ''}`}
            onClick={() => selectCharacter(char)}
            title={char.tagline}
          >
            <span className="cc-char-emoji" aria-hidden="true">{char.emoji}</span>
            <span className="cc-char-name">{char.name}</span>
          </button>
        ))}
      </nav>

      {/* Chat window */}
      <section className="cc-chat" aria-label={`Chat with ${selectedChar.name}`}>
        <div className="cc-chat-header">
          <span className="cc-char-emoji-lg" aria-hidden="true">{selectedChar.emoji}</span>
          <div>
            <strong>{selectedChar.name}</strong>
            <p className="cc-tagline">{selectedChar.tagline}</p>
          </div>
        </div>

        <div className="cc-messages" role="log" aria-live="polite">
          {messages.length === 0 && (
            <p className="cc-empty">
              Say hello to {selectedChar.name}! Ask about the journey, the animals, or what it's
              like to see Sweden from the air.
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`cc-msg cc-msg--${msg.role}`}>
              {msg.role === 'assistant' && (
                <span className="cc-msg-avatar" aria-hidden="true">{selectedChar.emoji}</span>
              )}
              <div className="cc-msg-bubble">
                {msg.content || (msg.role === 'assistant' && streaming ? <span className="cc-cursor" /> : null)}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {error && <p className="cc-error cc-error--chat">{error}</p>}

        <div className="cc-input-row">
          <textarea
            ref={inputRef}
            className="cc-textarea"
            rows={2}
            placeholder={`Message ${selectedChar.name}… (Enter to send, Shift+Enter for new line)`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            aria-label="Your message"
          />
          {streaming ? (
            <button className="cc-btn cc-btn-stop" onClick={stopStreaming} title="Stop">
              ⏹
            </button>
          ) : (
            <button
              className="cc-btn cc-btn-primary"
              onClick={sendMessage}
              disabled={!draft.trim()}
            >
              Send
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
