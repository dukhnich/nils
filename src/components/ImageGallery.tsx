import { useEffect, useRef } from 'react';
import { BOOK_IMAGES } from '../lib/images';
import './ImageGallery.css';

interface Props {
  isOpen: boolean;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onClose: () => void;
  characterName: string;
}

export function ImageGallery({ isOpen, selected, onToggle, onClose, characterName }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    // rAF fires after layout/paint, after Chrome's scroll-to-focused-element pass
    const id = requestAnimationFrame(() => {
      if (gridRef.current) gridRef.current.scrollTop = 0;
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  return (
    <div className="ig-panel" hidden={!isOpen}>
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
              aria-pressed={isSelected}
            >
              <div className="ig-thumb-img">
                <img src={img.src} alt={img.title} loading="lazy" />
                {isSelected && <span className="ig-check" aria-hidden="true">✓</span>}
              </div>
              <span className="ig-thumb-title">{img.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
