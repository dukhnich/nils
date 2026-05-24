import { useEffect, useRef, useState } from 'react';
import { characters, type Character } from '../characters';
import { streamChat, type ChatMessage } from '../lib/claude';
import { translations, type Lang, type CharId } from '../lib/i18n';
import { BOOK_IMAGES, type BookImage } from '../lib/images';
import { isCyrillic } from '../lib/lang';
import { ImageGallery } from './ImageGallery';
import './CharacterChat.css';

async function toBase64(img: BookImage): Promise<string> {
  const res = await fetch(img.src);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function CharacterChat() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [lang, setLang] = useState<Lang>(() =>
    localStorage.getItem('nils-lang') === 'uk' ? 'uk' : 'en'
  );
  const [selectedChar, setSelectedChar] = useState<Character>(characters[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const strings = translations[lang];
  const charStrings = strings.characters[selectedChar.id as CharId];

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
    setSelectedImages(new Set());
    inputRef.current?.focus();
  }

  function toggleImage(id: string) {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function sendMessage() {
    const text = draft.trim();
    if (!text || streaming) return;

    setDraft('');
    setError('');
    setStatus('');

    let encodedImages: string[] | undefined;
    let encodedImageTitles: string[] | undefined;
    if (selectedImages.size > 0) {
      const toEncode = BOOK_IMAGES.filter((img) => selectedImages.has(img.id));
      encodedImages = await Promise.all(toEncode.map(toBase64));
      encodedImageTitles = toEncode.map((img) => img.title);
      setSelectedImages(new Set());
      setGalleryOpen(false);
    }

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
        sessionId,
        encodedImages,
        (s) => setStatus(s === 'grounding' ? strings.examiningIllustration : s),
        encodedImageTitles,
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        setMessages((prev) => (prev[prev.length - 1]?.content === '' ? prev.slice(0, -1) : prev));
      }
    } finally {
      setStreaming(false);
      setStatus('');
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  function toggleLang() {
    setLang((prev) => {
      const next: Lang = prev === 'en' ? 'uk' : 'en';
      localStorage.setItem('nils-lang', next);
      return next;
    });
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

  return (
    <div className="cc-root" style={{ '--accent-rgb': selectedChar.accentRgb } as React.CSSProperties}>
      {/* Character picker */}
      <div className="cc-picker-row">
        <nav className="cc-picker" aria-label="Choose a character">
          {characters.map((char) => (
            <button
              key={char.id}
              className={`cc-char-btn ${selectedChar.id === char.id ? 'cc-char-btn--active' : ''}`}
              onClick={() => selectCharacter(char)}
              title={strings.characters[char.id as CharId].tagline}
            >
              <span className="cc-char-emoji" aria-hidden="true">{char.emoji}</span>
              <span className="cc-char-name">{char.name}</span>
            </button>
          ))}
        </nav>
        <button className="cc-lang-btn" onClick={toggleLang} title="Switch language">
          {strings.switchLang}
        </button>
      </div>

      {/* Chat window */}
      <section className="cc-chat" aria-label={`Chat with ${selectedChar.name}`}>
        <div className="cc-chat-header">
          <span className="cc-char-emoji-lg" aria-hidden="true">{selectedChar.emoji}</span>
          <div>
            <strong>{selectedChar.name}</strong>
            <p className="cc-tagline">{charStrings.tagline}</p>
          </div>
        </div>

        <div className="cc-messages" role="log" aria-live="polite">
          {messages.length === 0 && (
            <div className="cc-empty">
              <span className="cc-empty-emoji" aria-hidden="true">{selectedChar.emoji}</span>
              <strong className="cc-empty-name">{selectedChar.name}</strong>
              <p className="cc-empty-hint">{charStrings.hint}</p>
            </div>
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

        <div className="cc-bottom">
          {/* Image gallery panel — always mounted, hidden when closed to avoid remount scroll bugs */}
          <ImageGallery
            isOpen={galleryOpen}
            selected={selectedImages}
            onToggle={toggleImage}
            onClose={() => setGalleryOpen(false)}
            characterName={selectedChar.name}
            lang={lang}
          />

          {/* Selected images strip (when gallery is closed) */}
          {!galleryOpen && selectedImages.size > 0 && (
            <div className="cc-selected-strip">
              {BOOK_IMAGES.filter((img) => selectedImages.has(img.id)).map((img) => (
                <div key={img.id} className="cc-selected-thumb">
                  <img src={img.src} alt={img.title} />
                  <button
                    className="cc-selected-remove"
                    onClick={() => toggleImage(img.id)}
                    aria-label={`Remove ${img.title}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {status && <p className="cc-status">{status}</p>}
          {error && <p className="cc-error cc-error--chat">{error}</p>}

          <div className="cc-input-row">
            <textarea
              ref={inputRef}
              className="cc-textarea"
              rows={2}
              placeholder={strings.inputPlaceholder(selectedChar.name)}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              aria-label="Your message"
            />
            <button
              className={`cc-btn cc-btn-gallery${selectedImages.size > 0 ? ' cc-btn-gallery--active' : ''}`}
              onClick={() => setGalleryOpen((v) => !v)}
              title="Show book illustrations"
              aria-pressed={galleryOpen}
            >
              🖼{selectedImages.size > 0 ? <span className="cc-gallery-badge">{selectedImages.size}</span> : null}
            </button>
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
                {strings.sendButton}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
