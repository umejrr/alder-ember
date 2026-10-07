import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/tools.css';
import type { ModelView } from './ModelView';
import { track } from '@/lib/analytics';
import { writePrefs } from '@/lib/prefs-client';

const TBC = 'To be confirmed';

interface Row {
  key: string;
  label: string;
  get: (m: ModelView) => { text: string; sub?: string; pending?: boolean };
}

const val = (v: string | null, sub?: string) => (v ? { text: v, sub } : { text: TBC, pending: true });

const ROWS: Row[] = [
  { key: 'capacity', label: 'Comfortable capacity', get: (m) => val(m.capacity, 'Seated comfortably, not maximum occupancy') },
  { key: 'format', label: 'Format and glazing', get: (m) => val(m.format) },
  {
    key: 'changing',
    label: 'Changing area',
    get: (m) =>
      m.changingArea
        ? { text: m.changingArea, sub: 'How it is specified is still being confirmed' }
        : { text: 'Not described for this model' },
  },
  { key: 'exterior', label: 'External size (W × D × H)', get: (m) => val(m.exterior, 'Not the installation footprint') },
  { key: 'interior', label: 'Approximate sauna-room size', get: (m) => val(m.interior) },
  {
    key: 'price',
    label: 'Starting price',
    get: (m) =>
      m.price
        ? { text: `From ${m.price}`, sub: `${m.vat ?? ''}${m.vat ? '. ' : ''}Delivery and installation scope are confirmed in your quotation.` }
        : { text: 'Confirmed in your quotation', pending: true },
  },
  { key: 'electric', label: 'Electric heating', get: (m) => val(m.electric) },
  { key: 'wood', label: 'Wood-burning', get: (m) => val(m.wood) },
  { key: 'commercial', label: 'Commercial use', get: (m) => val(m.commercial) },
  { key: 'fit', label: 'Suggested residential use', get: (m) => val(m.fit) },
];

const NARROW = '(max-width: 640px)';

export default function CompareTool({ models }: { models: ModelView[] }) {
  const ids = useMemo(() => models.map((m) => m.id), [models]);
  const [selected, setSelected] = useState<string[]>(ids);
  const [narrow, setNarrow] = useState(false);
  const interacted = useRef(false);
  const max = narrow ? 2 : 3;

  const sync = useCallback((next: string[]) => {
    const q = next.length === ids.length ? '' : `?m=${next.join(',')}`;
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${q}${window.location.hash}`);
    } catch {
      /* sandboxed or embedded frames may refuse; the comparison still works */
    }
  }, [ids.length]);

  // initial: URL (shareable) -> otherwise a sensible default for the screen
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const fromUrl = (new URLSearchParams(window.location.search).get('m') ?? '')
      .split(',')
      .filter((x) => ids.includes(x as never));
    const unique = ids.filter((id) => fromUrl.includes(id));
    const limit = mq.matches ? 2 : 3;
    setNarrow(mq.matches);
    const start = unique.length >= 2 ? unique.slice(0, limit) : ids.slice(0, limit);
    setSelected(start);
    const onChange = (e: MediaQueryListEvent) => {
      setNarrow(e.matches);
      if (e.matches) setSelected((s) => s.slice(0, 2));
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [ids]);

  const toggle = (id: string) => {
    interacted.current = true;
    setSelected((cur) => {
      let next: string[];
      if (cur.includes(id)) {
        if (cur.length <= 2) return cur; // a comparison needs at least two
        next = cur.filter((x) => x !== id);
      } else {
        next = ids.filter((x) => x === id || cur.includes(x));
        if (next.length > max) next = next.filter((x) => x !== cur[0]); // narrow: drop the oldest
      }
      sync(next);
      track('compare_models', { model_ids: next });
      return next;
    });
  };

  const reset = () => {
    const next = ids.slice(0, max);
    setSelected(next);
    sync(next);
  };

  const shown = models.filter((m) => selected.includes(m.id));

  return (
    <div className="cmp">
      <div className="cmp__bar">
        <div role="group" aria-label="Choose models to compare" className="cmp__toggles">
          {models.map((m) => (
            <button
              key={m.id}
              type="button"
              className="cmp__toggle"
              aria-pressed={selected.includes(m.id)}
              onClick={() => toggle(m.id)}
            >
              {m.name}
            </button>
          ))}
        </div>
        <div className="actions">
          <span className="cmp__hint" id="cmp-hint">
            {narrow ? 'Comparing two at a time on a narrow screen.' : 'Compare two or three models.'}
          </span>
          <button type="button" className="text-link" onClick={reset} style={{ background: 'none', border: 0, borderBottom: '1px solid currentColor', cursor: 'pointer' }}>
            Reset
          </button>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        Comparing {shown.map((m) => m.name).join(', ')}.
      </p>

      {/* Desktop / tablet: real table */}
      <div className="cmp-table table-wrap">
        <table className="data">
          <caption>Comparison of {shown.map((m) => m.name).join(', ')}. Working values until approved.</caption>
          <thead>
            <tr>
              <td />
              {shown.map((m) => (
                <th key={m.id} scope="col">
                  <a href={`/saunas/${m.id}`}>{m.name}</a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.label}</th>
                {shown.map((m) => {
                  const v = r.get(m);
                  return (
                    <td key={m.id} className={v.pending ? 'is-pending' : undefined}>
                      <span className={r.key === 'price' && !v.pending ? 'cmp__price' : undefined}>{v.text}</span>
                      {v.sub && <span className="cmp__sub">{v.sub}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Next step</th>
              {shown.map((m) => (
                <td key={m.id}>
                  <a className="btn" href={`/plan-your-sauna?model=${m.id}`} onClick={() => writePrefs({ model: m.id as never })}>
                    Plan your {m.shortName}
                  </a>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Narrow: stacked, every value labelled with its model */}
      <div className="cmp-stack" style={{ ['--n' as string]: shown.length }}>
        {ROWS.map((r) => (
          <section key={r.key} aria-labelledby={`cs-${r.key}`}>
            <h3 id={`cs-${r.key}`}>{r.label}</h3>
            <div className="cmp-stack__cells">
              {shown.map((m) => {
                const v = r.get(m);
                return (
                  <div key={m.id}>
                    <span className="cmp-stack__name">{m.shortName}</span>
                    <span className={`cmp-stack__val${v.pending ? ' is-pending' : ''}`}>{v.text}</span>
                    {v.sub && r.key !== 'price' && <span className="cmp__sub" style={{ fontSize: '0.8125rem', color: 'var(--c-muted)', display: 'block' }}>{v.sub}</span>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        <div className="cmp-stack__actions">
          {shown.map((m) => (
            <a key={m.id} className="btn" href={`/plan-your-sauna?model=${m.id}`}>
              Plan your {m.shortName}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
