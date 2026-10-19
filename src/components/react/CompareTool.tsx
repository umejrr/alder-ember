import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/tools.css';
import type { ModelView } from './ModelView';
import { track } from '@/lib/analytics';
import { enquiryHref, writePrefs } from '@/lib/prefs-client';
import { pageHref } from '@/lib/base-url';

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

const NARROW = '(max-width: 40rem)';

export default function CompareTool({ models }: { models: ModelView[] }) {
  const ids = useMemo(() => models.map((m) => m.id), [models]);
  const [selected, setSelected] = useState<string[]>(ids);
  const [narrow, setNarrow] = useState(false);
  const interacted = useRef(false);
  // short, polite explanation when a choice cannot be applied or something was replaced
  const [note, setNote] = useState('');
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

  const commit = (next: string[]) => {
    setSelected(next);
    sync(next);
    track('compare_models', { model_ids: next });
  };

  const toggle = (id: string) => {
    interacted.current = true;
    setNote('');
    if (selected.includes(id)) {
      if (selected.length <= 2) {
        setNote('A comparison needs at least two models. Select another model to swap one out.');
        return;
      }
      commit(selected.filter((x) => x !== id));
    } else {
      commit(ids.filter((x) => x === id || selected.includes(x)));
    }
  };

  /** Narrow screens compare exactly two, chosen explicitly. Picking the other slot's model swaps them. */
  const pick = (slot: 0 | 1, id: string) => {
    interacted.current = true;
    const a = selected[0] ?? ids[0];
    const b = selected[1] ?? ids[1];
    let next: string[] = slot === 0 ? [id, b] : [a, id];
    if (next[0] === next[1]) {
      next = slot === 0 ? [id, a] : [b, id];
      setNote(`${models.find((m) => m.id === id)?.name} is now in this slot, and the other model moved across.`);
    } else {
      setNote('');
    }
    commit(next);
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
        {/* both control sets are always rendered and CSS shows one, so hydration never changes the layout */}
        <div className="cmp__pickers">
          {([0, 1] as const).map((slot) => (
            <div className="field" key={slot}>
              <label htmlFor={`cmp-pick-${slot}`}>{slot === 0 ? 'Compare' : 'with'}</label>
              <select id={`cmp-pick-${slot}`} className="select" value={selected[slot] ?? ids[slot]} onChange={(e) => pick(slot, e.target.value)}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div role="group" aria-label="Choose models to compare" className="cmp__toggles">
          {models.map((m) => (
            <button
              key={m.id}
              type="button"
              className="cmp__toggle"
              aria-pressed={selected.includes(m.id)}
              aria-describedby="cmp-hint"
              onClick={() => toggle(m.id)}
            >
              {m.name}
            </button>
          ))}
        </div>
        <div className="actions">
          <span className="cmp__hint" id="cmp-hint" role="status" aria-live="polite">
            {note || (
              <>
                <span className="cmp__hint-wide">Compare two or three models.</span>
                <span className="cmp__hint-narrow">Comparing two models at a time on a narrow screen.</span>
              </>
            )}
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
                  <a href={pageHref(`/saunas/${m.id}`)}>{m.name}</a>
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
                  <a className="btn" href={enquiryHref({ model: m.id })} onClick={() => writePrefs({ model: m.id as never })}>
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
                    {v.sub && <span className="cmp__sub" style={{ fontSize: '0.8125rem', color: 'var(--c-muted)', display: 'block' }}>{v.sub}</span>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        <div className="cmp-stack__actions">
          {shown.map((m) => (
            <a key={m.id} className="btn" href={enquiryHref({ model: m.id })}>
              Plan your {m.shortName}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
