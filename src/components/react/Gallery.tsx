import { useCallback, useState } from 'react';
import '../../styles/gallery.css';
import type { ModelView } from './ModelView';
import { assetSrcset, assetUrl } from '@/lib/base-url';

type Img = ModelView['asset'];

const STAGE_SIZES = '(min-width: 60rem) 58vw, 100vw';
const THUMB_SIZES = '(min-width: 60rem) 20vw, 33vw';

function Picture({ img, sizes, eager = false, alt }: { img: Img; sizes: string; eager?: boolean; alt: string }) {
  return (
    <picture>
      {img.srcsetAvif && <source type="image/avif" srcSet={assetSrcset(img.srcsetAvif)} sizes={sizes} />}
      <img
        src={assetUrl(img.src!)}
        srcSet={assetSrcset(img.srcset)}
        sizes={sizes}
        alt={alt}
        style={{ objectPosition: img.pos }}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        decoding="async"
      />
    </picture>
  );
}

function Frame({ img, eager = false }: { img: Img; eager?: boolean }) {
  return img.src ? (
    <>
      <Picture img={img} sizes={STAGE_SIZES} eager={eager} alt={img.alt} />
      {img.tag && <span className="pic__tag">{img.tag}</span>}
    </>
  ) : (
    <div className={`pic ph ph--${img.tone}`} role="img" aria-label={`Placeholder image: ${img.label}. Photography to be supplied.`}>
      <span className="ph__label">{img.label}</span>
    </div>
  );
}

/**
 * A model has only a few photographs, so there is no enlarged view: the selected image is large, and the others sit
 * below it at a size worth looking at, spanning the full width of the gallery. Arrow keys and the buttons move one
 * image at a time and wrap.
 */
export default function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [i, setI] = useState(0);
  const n = images.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);
  const img = images[i];

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
        <div className="gal__thumbs" style={{ ['--n' as string]: n }}>
          {images.map((t, k) => (
            <button
              key={t.id}
              type="button"
              className="gal__thumb"
              aria-current={k === i}
              aria-label={`Show image ${k + 1} of ${n}: ${t.label}`}
              onClick={() => setI(k)}
            >
              {t.src ? <Picture img={t} sizes={THUMB_SIZES} alt="" /> : <div className={`pic ph ph--${t.tone}`} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
