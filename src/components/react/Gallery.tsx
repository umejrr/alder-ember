import { useCallback, useEffect, useRef, useState } from 'react';
import '../../styles/gallery.css';
import type { ModelView } from './ModelView';

type Img = ModelView['asset'];

function Frame({ img, eager = false }: { img: Img; eager?: boolean }) {
  return img.src ? (
    <img
      src={img.src}
      alt={img.alt}
      style={{ objectPosition: img.pos }}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  ) : (
    <div
      className={`pic ph ph--${img.tone}`}
      role="img"
      aria-label={`Placeholder image: ${img.label}. Photography to be supplied.`}
    >
      <span className="ph__tag">Preview image</span>
      <span className="ph__label">{img.label}</span>
    </div>
  );
}

/** Keyboard-operable gallery with an enlarged view that closes explicitly and restores focus. */
export default function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [i, setI] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const n = images.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);
  const img = images[i];

  const open = () => {
    openerRef.current = document.activeElement as HTMLElement;
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => openerRef.current?.focus();
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  };

  return (
    <div className="gal" role="group" aria-roledescription="gallery" aria-label={`${name} images`} onKeyDown={onKey}>
      <div className="gal__stage">
        <div className="gal__frame">
          <Frame img={img} eager={i === 0} />
        </div>
        <button type="button" className="gal__btn gal__zoom" onClick={open}>
          View larger<span className="sr-only">: {img.label}</span>
        </button>
        {n > 1 && (
          <div className="gal__controls">
            <span className="gal__count" aria-hidden="true">
              {i + 1} / {n}
            </span>
            <button type="button" className="gal__btn" onClick={() => go(-1)} aria-label="Previous image">
              ←
            </button>
            <button type="button" className="gal__btn" onClick={() => go(1)} aria-label="Next image">
              →
            </button>
          </div>
        )}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        Image {i + 1} of {n}: {img.label}
      </p>
      {n > 1 && (
        <div className="gal__thumbs">
          {images.map((t, k) => (
            <button
              key={t.id}
              type="button"
              className="gal__thumb"
              aria-current={k === i}
              aria-label={`Show image ${k + 1} of ${n}: ${t.label}`}
              onClick={() => setI(k)}
            >
              {t.src ? (
                <img src={t.src} alt="" style={{ objectPosition: t.pos }} loading="lazy" decoding="async" />
              ) : (
                <div className={`pic ph ph--${t.tone}`} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}

      <dialog ref={dialogRef} className="gal-dialog" aria-label={`${name}: enlarged image`} onKeyDown={onKey}>
        <div className="gal-dialog__inner">
          <div className="gal-dialog__bar">
            <span className="gal__count">
              {i + 1} / {n}
            </span>
            <div className="gal-dialog__nav">
              {n > 1 && (
                <>
                  <button type="button" className="gal__btn" onClick={() => go(-1)} aria-label="Previous image">
                    ←
                  </button>
                  <button type="button" className="gal__btn" onClick={() => go(1)} aria-label="Next image">
                    →
                  </button>
                </>
              )}
              <button type="button" className="gal__btn" onClick={close} autoFocus>
                Close
              </button>
            </div>
          </div>
          <div className="gal__frame">
            <Frame img={img} />
          </div>
        </div>
      </dialog>
    </div>
  );
}
