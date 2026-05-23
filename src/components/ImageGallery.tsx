import { useEffect, useRef } from 'react';
import { BOOK_IMAGES } from '../lib/images';
import './ImageGallery.css';

interface Props {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onClose: () => void;
  characterName: string;
}

export function ImageGallery({ selected, onToggle, onClose, characterName }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current) gridRef.current.scrollTop = 0;
  }, []);

  return (
    <div className="ig-panel">
      <div className="ig-header">
        <span className="ig-title">
          Book illustrations — select to share with {characterName}
          {selected.size > 0 && <span className="ig-count">{selected.size} selected</span>}
        </span>
        <button className="ig-close" onClick={onClose} aria-label="Close gallery">✕</button>
      </div>
      <div className="ig-grid" ref={gridRef}>
        {BOOK_IMAGES.map((img) => {
          const isSelected = selected.has(img.id);
          return (
            <button
              key={img.id}
              className={`ig-thumb ${isSelected ? 'ig-thumb--selected' : ''}`}
              onClick={() => onToggle(img.id)}
              title={img.title}
              aria-pressed={isSelected}
            >
              <img src={img.src} alt={img.title} loading="lazy" />
              {isSelected && <span className="ig-check" aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
