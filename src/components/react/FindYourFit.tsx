import { useEffect, useId, useMemo, useRef, useState } from 'react';
import '../../styles/find-your-fit.css';
import type { ModelView } from './ModelView';
import { enquiryHref, readPrefs, writePrefs } from '@/lib/prefs-client';

interface Props {
  models: ModelView[];
  initial?: string;
  /** collection page lists all three fully, so the compare link can preselect all */
}

function Img({ m, active }: { m: ModelView; active: boolean }) {
  const a = m.asset;
  return (
    <div className={`fyf__img${active ? ' is-active' : ''}`} aria-hidden={!active}>
      {a.src ? (
        <img src={a.src} alt={active ? a.alt : ''} style={{ objectPosition: a.pos }} loading="lazy" decoding="async" />
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
 * "Find your fit": photographic three-model showcase. Tabs change the selected model only
 * (never navigate); the image and data always come from the same product record.
 */
export default function FindYourFit({ models, initial = 'alder' }: Props) {
  const baseId = useId();
  const [selected, setSelected] = useState(initial);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const current = useMemo(() => models.find((m) => m.id === selected) ?? models[0], [models, selected]);

  // restore the model chosen earlier in this visit (non-personal, sessionStorage)
  useEffect(() => {
    const saved = readPrefs().model;
    if (saved && saved !== 'not-sure' && models.some((m) => m.id === saved)) setSelected(saved);
  }, [models]);

  const choose = (id: string, focus = false) => {
    setSelected(id);
    writePrefs({ model: id as never });
    if (focus) tabRefs.current[id]?.focus();
  };

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
  const announce = `Showing ${m.name}${m.capacity ? `, comfortable capacity ${m.capacity}` : ''}${m.price ? `, from ${m.price}` : ''}.`;

  return (
    <div className="fyf" data-model={m.id}>
      <div className="fyf__stage">
        {models.map((x) => (
          <Img key={x.id} m={x} active={x.id === selected} />
        ))}
      </div>

      <div className="fyf__rail">
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
            >
              <span className="fyf__tab-name">
                <span className="sr-only">The </span>
                {x.shortName}
              </span>
              <span className="fyf__tab-meta">{x.capacity ?? 'See model'}</span>
            </button>
          ))}
        </div>

        <div
          className="fyf__panel"
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-${m.id}`}
          tabIndex={-1}
        >
          <div>
            <h3 className="fyf__title">{m.name}</h3>
            <p className="fyf__position">{m.position}</p>
          </div>

          <dl className="facts">
            {m.fit && (
              <div>
                <dt>Suits</dt>
                <dd>{m.fit}</dd>
              </div>
            )}
            <div>
              <dt>Comfortable capacity</dt>
              <dd>{m.capacity ?? <span className="pending">Confirmed on enquiry</span>}</dd>
            </div>
            <div>
              <dt>External footprint</dt>
              <dd>
                {m.exterior ? (
                  <>
                    {m.exterior}
                    <span className="sub">Width × depth × height</span>
                  </>
                ) : (
                  <span className="pending">Confirmed on enquiry</span>
                )}
              </dd>
            </div>
          </dl>

          <div className="fyf__price">
            <span className="label muted">Starting price</span>
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
            <p className="fyf__scope">
              {m.priceScope ??
                'Delivery and installation scope are confirmed in your itemised quotation.'}
            </p>
          </div>

          <div className="fyf__actions">
            <div className="fyf__actions-row">
              <a className="btn" href={`/saunas/${m.id}`}>
                Explore the {m.shortName}
              </a>
              <a className="btn btn--secondary" href={`/compare?m=${models.map((x) => x.id).join(',')}`}>
                Compare models
              </a>
            </div>
            <a className="text-link" href={enquiryHref({ model: m.id })} style={{ justifySelf: 'start' }}>
              Plan your {m.shortName} <span className="arrow" aria-hidden="true">→</span>
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
