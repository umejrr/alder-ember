import { useEffect, useId, useMemo, useRef, useState } from 'react';
import '../../styles/find-your-fit.css';
import type { ModelView } from './ModelView';
import { enquiryHref, readPrefs, writePrefs } from '@/lib/prefs-client';
import { assetSrcset, assetUrl, pageHref } from '@/lib/base-url';

interface Props {
  models: ModelView[];
  initial?: string;
}

const SIZES = '(min-width: 960px) 66vw, 100vw';
const SCOPE = 'Delivery and installation are confirmed in your itemised quotation.';

function Img({ m, active }: { m: ModelView; active: boolean }) {
  const a = m.asset;
  return (
    <div className={`fyf__img${active ? ' is-active' : ''}`} aria-hidden={!active}>
      {a.src ? (
        <>
          <picture>
            {a.srcsetAvif && <source type="image/avif" srcSet={assetSrcset(a.srcsetAvif)} sizes={SIZES} />}
            <img
              src={assetUrl(a.src)}
              srcSet={assetSrcset(a.srcset)}
              sizes={SIZES}
              alt={active ? a.alt : ''}
              style={{ objectPosition: a.pos }}
              loading="lazy"
              decoding="async"
            />
          </picture>
          {a.tag && <span className="pic__tag">{a.tag}</span>}
        </>
      ) : (
        <div
          className={`pic ph ph--${a.tone}`}
          style={{ ['--ratio' as string]: a.ratio }}
          role={active ? 'img' : undefined}
          aria-label={active ? `Placeholder image: ${a.label}. Photography to be supplied.` : undefined}
        >
          <span className="ph__tag">Preview image</span>
          <span className="ph__label">
            {a.label}
            <span className="ph__ratio"> · {a.ratio.replace(' / ', ':')}</span>
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * The model explorer: a stage with a fixed aspect ratio, a rail of all three models, and a concise panel.
 *
 * `selected` is the rail state; `shown` is what the stage and panel display. They differ only while the next
 * image is being fetched and decoded, so the image, facts, links and selected state never describe different
 * models. Only the visible model's image is loaded up front; the others load when a visitor shows interest.
 */
export default function FindYourFit({ models, initial = 'alder' }: Props) {
  const baseId = useId();
  const [selected, setSelected] = useState(initial);
  const [shown, setShown] = useState(initial);
  const [ready, setReady] = useState<string[]>([initial]);
  const [busy, setBusy] = useState(false);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const latest = useRef(initial);
  const inflight = useRef<Record<string, Promise<void>>>({});
  const current = useMemo(() => models.find((m) => m.id === shown) ?? models[0], [models, shown]);

  /** Fetch and decode a model's image ahead of showing it. Never rejects: a slow image must not block the choice. */
  const prefetch = (id: string): Promise<void> => {
    if (ready.includes(id)) return Promise.resolve();
    const pendingFetch = inflight.current[id] as Promise<void> | undefined;
    if (pendingFetch) return pendingFetch;
    const m = models.find((x) => x.id === id);
    const a = m?.asset;
    const done = () => setReady((r) => (r.includes(id) ? r : [...r, id]));
    if (!a?.src) {
      done();
      return Promise.resolve();
    }
    inflight.current[id] = new Promise<void>((resolve) => {
      const im = new Image();
      im.sizes = SIZES;
      // fetch the same file the <picture> will choose: AVIF where the browser can decode it, otherwise WebP
      const avif = a.srcsetAvif && typeof document !== 'undefined' && document.createElement('canvas').toDataURL('image/avif').startsWith('data:image/avif');
      const ss = assetSrcset(avif ? a.srcsetAvif : a.srcset);
      if (ss) im.srcset = ss;
      im.src = assetUrl(a.src) ?? '';
      const finish = () => {
        done();
        resolve();
      };
      const timer = window.setTimeout(finish, 2500); // never hold the visitor's choice hostage to a slow network
      (im.decode ? im.decode() : Promise.resolve()).catch(() => undefined).then(() => {
        window.clearTimeout(timer);
        finish();
      });
    });
    return inflight.current[id];
  };

  const choose = (id: string, focus = false) => {
    latest.current = id;
    setSelected(id);
    writePrefs({ model: id as never });
    if (focus) tabRefs.current[id]?.focus();
    if (ready.includes(id)) {
      setBusy(false);
      setShown(id);
      return;
    }
    setBusy(true);
    prefetch(id).then(() => {
      if (latest.current !== id) return; // a newer choice has taken over
      setShown(id);
      setBusy(false);
    });
  };

  // restore the model chosen earlier in this visit (non-personal, sessionStorage)
  useEffect(() => {
    const saved = readPrefs().model;
    if (saved && saved !== 'not-sure' && saved !== initial && models.some((m) => m.id === saved)) choose(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = models.findIndex((m) => m.id === selected);
    let next = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % models.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + models.length) % models.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = models.length - 1;
    else return;
    e.preventDefault();
    choose(models[next].id, true);
  };

  const m = current;
  const announce = busy
    ? `Loading ${models.find((x) => x.id === selected)?.name ?? ''}.`
    : `Showing ${m.name}${m.capacity ? `, comfortable capacity ${m.capacity}` : ''}${m.price ? `, from ${m.price}` : ''}.`;

  return (
    <div className="fyf" data-model={m.id}>
      <div className="fyf__tabs" role="tablist" aria-label="Choose a sauna model" onKeyDown={onKeyDown}>
        {models.map((x) => (
          <button
            key={x.id}
            ref={(el) => {
              tabRefs.current[x.id] = el;
            }}
            id={`${baseId}-tab-${x.id}`}
            role="tab"
            type="button"
            className="fyf__tab"
            aria-selected={x.id === selected}
            aria-controls={`${baseId}-panel`}
            tabIndex={x.id === selected ? 0 : -1}
            onClick={() => choose(x.id)}
            onPointerEnter={() => void prefetch(x.id)}
            onFocus={() => void prefetch(x.id)}
          >
            <span className="fyf__tab-name">
              <span className="sr-only">The </span>
              {x.shortName}
            </span>
            <span className="fyf__tab-meta">{x.capacity ?? 'See model'}</span>
          </button>
        ))}
      </div>

      <div className="fyf__stage" data-busy={busy || undefined} aria-busy={busy}>
        {models
          .filter((x) => ready.includes(x.id))
          .map((x) => (
            <Img key={x.id} m={x} active={x.id === shown} />
          ))}
        <span className="fyf__loading" aria-hidden="true" />
      </div>

      <div
        className="fyf__panel"
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${selected}`}
        tabIndex={-1}
      >
        <div className="fyf__head">
          <h3 className="fyf__title">{m.name}</h3>
          <p className="fyf__position">{m.position}</p>
        </div>

        <dl className="fyf__facts">
          <div>
            <dt>Comfortable capacity</dt>
            <dd>{m.capacity ?? <span className="pending">Confirmed on enquiry</span>}</dd>
          </div>
          <div>
            <dt>External size, W × D × H</dt>
            <dd>{m.exterior ?? <span className="pending">Confirmed on enquiry</span>}</dd>
          </div>
        </dl>

        <div className="fyf__price">
          <span className="label muted">Starting price{m.priceWorking ? ' (working figure)' : ''}</span>
          <span className="fyf__price-value">
            {m.price ? (
              <>
                From {m.price}
                {m.vat && <small>{m.vat.toLowerCase()}</small>}
              </>
            ) : (
              <span className="pending">Confirmed in your quotation</span>
            )}
          </span>
          <p className="fyf__scope">{SCOPE}</p>
          {m.priceScope && (
            <details className="fyf__more">
              <summary>What the price covers</summary>
              <p>{m.priceScope}</p>
            </details>
          )}
        </div>

        <div className="fyf__actions">
          <a className="btn" href={pageHref(`/saunas/${m.id}`)}>
            Explore the {m.shortName}
          </a>
          <div className="fyf__links">
            <a className="text-link" href={pageHref(`/compare?m=${models.map((x) => x.id).join(',')}`)}>
              Compare models
            </a>
            <a className="text-link" href={enquiryHref({ model: m.id })}>
              Plan your {m.shortName}
            </a>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite" role="status">
        {announce}
      </p>
    </div>
  );
}
