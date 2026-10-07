import { useRef, useState } from 'react';
import '../../styles/tools.css';
import type { ModelView } from './ModelView';
import {
  CLOSING_SENTENCE,
  runSelector,
  type ChangingAreaPref,
  type ModelInterest,
  type SelectorInput,
  type SelectorResult,
  type UseType,
} from '@/lib/selector';
import type { HeatingPreference } from '@/content/options';
import { enquiryHref, writePrefs } from '@/lib/prefs-client';
import { track } from '@/lib/analytics';

const PEOPLE = [
  { v: '', label: 'Not sure' },
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ v: String(n), label: `${n}` })),
  { v: '9', label: 'More than 8' },
];

/**
 * A shortlist helper, not a configurator: it never approves a site, never says a model
 * "fits", and never produces a price. Non-personal answers can travel into the enquiry.
 */
export default function ModelSelector({ models }: { models: ModelView[] }) {
  const [use, setUse] = useState<UseType>('residential');
  const [people, setPeople] = useState('');
  const [model, setModel] = useState<ModelInterest>('not-sure');
  const [space, setSpace] = useState('');
  const [heating, setHeating] = useState<HeatingPreference>('advice');
  const [changing, setChanging] = useState<ChangingAreaPref>('not-important');
  const [result, setResult] = useState<SelectorResult | null>(null);
  const started = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const begin = () => {
    if (started.current) return;
    started.current = true;
    track('start_model_selector', { entry_page: window.location.pathname });
  };

  const input = (): SelectorInput => ({
    use,
    people: people ? Number(people) : null,
    model,
    heating,
    changingArea: changing,
    space,
  });

  const submit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    const i = input();
    const r = runSelector(i);
    setResult(r);
    // non-personal answers only (never the free-text space)
    writePrefs({
      use: i.use,
      heating: i.heating,
      changingArea: i.changingArea,
      ...(i.people ? { people: i.people } : {}),
      ...(r.kind === 'recommend' ? { model: r.model } : i.model !== 'not-sure' ? { model: i.model } : {}),
    });
    track('complete_model_selector', {
      suggested_model_id: r.kind === 'recommend' ? r.model : 'none',
      project_type: i.use,
      result_kind: r.kind,
    });
    requestAnimationFrame(() => resultRef.current?.focus());
  };

  const name = (id: string) => models.find((m) => m.id === id)?.name ?? id;
  const i = input();

  return (
    <div className="sel">
      <form className="sel" onSubmit={submit} onChange={begin} noValidate>
        <div className="sel__grid">
          <fieldset>
            <legend>What is the sauna for?</legend>
            <div className="choice-group choice-group--row">
              {(['residential', 'commercial'] as const).map((v) => (
                <label className="choice" key={v}>
                  <input type="radio" name="use" value={v} checked={use === v} onChange={() => setUse(v)} />
                  <span className="choice-title">{v === 'residential' ? 'A home' : 'A business'}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="sel-people">Usual number of people</label>
            <select id="sel-people" className="select" value={people} onChange={(e) => setPeople(e.target.value)} aria-describedby="sel-people-hint">
              {PEOPLE.map((p) => (
                <option key={p.v} value={p.v}>
                  {p.label}
                </option>
              ))}
            </select>
            <span className="hint" id="sel-people-hint">Adults sitting at once. We describe models by comfortable seating.</span>
          </div>

          <fieldset>
            <legend>Model of interest</legend>
            <div className="choice-group choice-group--row">
              {[{ id: 'not-sure', n: 'Not sure' }, ...models.map((m) => ({ id: m.id, n: m.shortName }))].map((m) => (
                <label className="choice" key={m.id}>
                  <input type="radio" name="model" value={m.id} checked={model === m.id} onChange={() => setModel(m.id as ModelInterest)} />
                  <span className="choice-title">{m.n}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="sel-space">Approximate available space (optional)</label>
            <input
              id="sel-space"
              className="input"
              type="text"
              value={space}
              onChange={(e) => setSpace(e.target.value)}
              placeholder="e.g. 4 m × 3 m"
              autoComplete="off"
              aria-describedby="sel-space-hint"
            />
            <span className="hint" id="sel-space-hint">
              A starting point only. The cabin also needs a base, clearances and a route in, which we check with you.
            </span>
          </div>

          <fieldset>
            <legend>Heating preference</legend>
            <div className="choice-group choice-group--row">
              {([
                ['electric', 'Electric'],
                ['wood', 'Wood-burning'],
                ['advice', 'I need advice'],
              ] as const).map(([v, l]) => (
                <label className="choice" key={v}>
                  <input type="radio" name="heating" value={v} checked={heating === v} onChange={() => setHeating(v)} />
                  <span className="choice-title">{l}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>A changing area (optional)</legend>
            <div className="choice-group choice-group--row">
              {([
                ['yes', 'I would like one'],
                ['no', 'No'],
                ['not-important', 'Not important'],
              ] as const).map(([v, l]) => (
                <label className="choice" key={v}>
                  <input type="radio" name="changing" value={v} checked={changing === v} onChange={() => setChanging(v)} />
                  <span className="choice-title">{l}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="actions">
          <button className="btn" type="submit">Show a starting point</button>
        </div>
      </form>

      <div ref={resultRef} tabIndex={-1} aria-live="polite" className="sel__live">
        {result && (
          <div className="sel__result">
            {result.kind === 'recommend' && (
              <>
                <span className="label muted">A starting point</span>
                <h3>{name(result.model)}</h3>
                <ul>{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                <ul>{result.caveats.map((r) => <li key={r} className="muted">{r}</li>)}</ul>
                <p className="sel__closing">{CLOSING_SENTENCE}</p>
                <div className="actions">
                  <a className="btn" href={enquiryHref({ model: result.model, use: i.use, heating: i.heating, changingArea: i.changingArea, ...(i.people ? { people: i.people } : {}) })}>
                    Plan your {name(result.model).replace('The ', '')}
                  </a>
                  <a className="btn btn--secondary" href={`/saunas/${result.model}`}>See {name(result.model)}</a>
                </div>
              </>
            )}
            {result.kind === 'advice' && (
              <>
                <span className="label muted">Worth talking through</span>
                <h3>We would like to help you choose</h3>
                <ul>{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                <p className="sel__closing">{CLOSING_SENTENCE}</p>
                <div className="actions">
                  <a className="btn" href={`/compare?m=${[...new Set(result.compare)].join(',')}`}>Compare these models</a>
                  <a className="btn btn--secondary" href={enquiryHref({ use: i.use, heating: i.heating, ...(i.people ? { people: i.people } : {}) })}>Plan your sauna</a>
                </div>
              </>
            )}
            {result.kind === 'commercial' && (
              <>
                <span className="label muted">Commercial project</span>
                <h3>A separate assessment</h3>
                <ul>{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                <p className="sel__closing">{CLOSING_SENTENCE}</p>
                <div className="actions">
                  <a className="btn" href="/commercial">Discuss a commercial project</a>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
