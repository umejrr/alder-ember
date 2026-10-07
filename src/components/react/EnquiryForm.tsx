import { useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/tools.css';
import {
  BUDGETS,
  BUDGET_LABELS,
  TIMINGS,
  TIMING_LABELS,
  contextSummary,
  validateEnquiry,
  type EnquiryInput,
  type FieldErrors,
} from '@/lib/enquiry/schema';
import { parsePreferences } from '@/lib/selector';
import { readPrefs, writePrefs } from '@/lib/prefs-client';
import { track } from '@/lib/analytics';
import type { ModelView } from './ModelView';

interface Props {
  kind: 'residential' | 'commercial';
  models: ModelView[];
  campaignId?: string;
  /** "live" only when the deployment has a configured destination; anything else is labelled as a demo */
  submissionMode: 'demo' | 'live';
  responseTime: string | null;
}

type Values = {
  name: string; email: string; phone: string; postcode: string;
  projectType: 'residential' | 'commercial';
  model: string; description: string;
  budget: string; timing: string; dimensions: string;
  heating: string; people: string; changingArea: string;
  organisation: string; website: string; venueType: string; venueStatus: string;
  usualUsers: string; usageFrequency: string; openingTarget: string; contractors: string;
  marketingOptIn: boolean;
};

const blank = (kind: Props['kind']): Values => ({
  name: '', email: '', phone: '', postcode: '', projectType: kind, model: '', description: '',
  budget: '', timing: '', dimensions: '', heating: '', people: '', changingArea: '',
  organisation: '', website: '', venueType: '', venueStatus: '', usualUsers: '', usageFrequency: '',
  openingTarget: '', contractors: '', marketingOptIn: false,
});

const HEATING_LABEL: Record<string, string> = { electric: 'Electric', wood: 'Wood-burning', advice: 'I need advice' };

type Status =
  | { s: 'idle' }
  | { s: 'submitting' }
  | { s: 'sent'; mode: 'live' | 'demo'; reference?: string; delivery?: string; snapshot: Pick<EnquiryInput, 'model' | 'heating' | 'projectType' | 'people' | 'changingArea'> }
  | { s: 'error'; message: string };

export default function EnquiryForm({ kind, models, campaignId, submissionMode, responseTime }: Props) {
  const [v, setV] = useState<Values>(() => blank(kind));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ s: 'idle' });
  const [prefilled, setPrefilled] = useState(false);
  const startedAt = useRef<number>(0);
  const key = useRef<string>('');
  const tracked = useRef(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Prefill from the URL and this visit's non-personal preferences. Visible and editable, never hidden.
  useEffect(() => {
    startedAt.current = Date.now();
    key.current = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `k${Date.now()}${Math.random().toString(36).slice(2)}`;
    const fromUrl = parsePreferences(new URLSearchParams(window.location.search));
    const saved = readPrefs();
    const p = { ...saved, ...fromUrl };
    const next: Partial<Values> = {};
    if (p.model) next.model = p.model;
    if (p.heating) next.heating = p.heating;
    if (p.people) next.people = String(p.people);
    if (p.changingArea) next.changingArea = p.changingArea;
    if (kind === 'residential' && p.use) next.projectType = p.use;
    if (Object.keys(next).length) {
      setV((cur) => ({ ...cur, ...next }));
      setPrefilled(true);
    }
  }, [kind]);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    if (!tracked.current) {
      tracked.current = true;
      track('start_enquiry', { model_id: v.model || 'none', source_page: window.location.pathname });
    }
    setV((cur) => ({ ...cur, [k]: val }));
    if (errors[k as keyof FieldErrors]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const clearPrefs = () => {
    setV((cur) => ({ ...cur, model: '', heating: '', people: '', changingArea: '' }));
    writePrefs({});
    try { sessionStorage.removeItem('ae-prefs-v1'); } catch { /* ignore */ }
    setPrefilled(false);
  };

  const payload = useMemo(
    () => ({
      ...v,
      people: v.people ? Number(v.people) : undefined,
      marketingOptIn: v.marketingOptIn === true,
      idempotencyKey: key.current || 'pending-key',
      campaignId,
      sourcePage: typeof window === 'undefined' ? undefined : window.location.pathname,
    }),
    [v, campaignId, status],
  );

  const focusSummary = () => requestAnimationFrame(() => summaryRef.current?.focus());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status.s === 'submitting') return;
    const check = validateEnquiry({ ...payload, idempotencyKey: key.current || 'pending-key-00' });
    if (!check.ok) {
      setErrors(check.errors);
      setStatus({ s: 'idle' });
      focusSummary();
      return;
    }
    setErrors({});
    setStatus({ s: 'submitting' });
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...check.value, startedAt: startedAt.current, website_url_confirm: (document.getElementById('enq-hp') as HTMLInputElement | null)?.value ?? '' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        const snapshot = { model: check.value.model, heating: check.value.heating, projectType: check.value.projectType, people: check.value.people, changingArea: check.value.changingArea };
        // Only a live, accepted enquiry counts as a conversion. A demo submission never does.
        if (data.mode === 'live') {
          track('submit_enquiry_success', { model_id: check.value.model, project_type: check.value.projectType, campaign_id: campaignId });
        }
        setStatus({ s: 'sent', mode: data.mode === 'live' ? 'live' : 'demo', reference: data.reference, delivery: data.delivery, snapshot });
        requestAnimationFrame(() => doneRef.current?.focus());
        return;
      }
      if (res.status === 400 && data.error === 'validation' && data.fieldErrors) {
        setErrors(data.fieldErrors);
        setStatus({ s: 'idle' });
        track('enquiry_submission_error', { error_category: 'validation' });
        focusSummary();
        return;
      }
      const message =
        res.status === 429
          ? 'You have sent several enquiries in a short time. Please wait a few minutes and try again.'
          : res.status === 503
            ? 'This form is not able to take enquiries right now, and nothing has been sent. Please try again later.'
            : 'Something went wrong and your enquiry has not been sent. Your answers are still here, so please try again.';
      track('enquiry_submission_error', { error_category: res.status === 429 ? 'rate_limited' : res.status === 503 ? 'unavailable' : 'server' });
      setStatus({ s: 'error', message });
      requestAnimationFrame(() => errorRef.current?.focus());
    } catch {
      track('enquiry_submission_error', { error_category: 'network' });
      setStatus({ s: 'error', message: 'We could not reach the server, so your enquiry has not been sent. Your answers are still here, so please try again.' });
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  };

  // ----- success -----
  if (status.s === 'sent') {
    const ctx = contextSummary(status.snapshot as EnquiryInput);
    return (
      <div className="enq-done">
        {status.mode === 'demo' ? (
          <div className="alert alert--info demo-banner" role="status">
            <h2>Demo mode: nothing was sent</h2>
            <p>This preview checked your answers and showed the confirmation layout, but no enquiry was sent to Alder & Ember and nothing was stored.</p>
          </div>
        ) : null}
        <h2 ref={doneRef} tabIndex={-1}>{status.mode === 'live' ? 'We’ve received your enquiry' : 'This is how the confirmation will look'}</h2>
        {status.mode === 'live' && status.reference && <p className="muted">Your reference is <strong className="tnum">{status.reference}</strong>.</p>}
        <div className="enq__summary">
          <h2>What you told us</h2>
          <ul>{ctx.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
        <div className="prose">
          <h3>What happens next</h3>
          <p>{responseTime ?? 'The team reviews your project and replies as soon as they can.'}</p>
          <p>We will ask about your space and access, and help you confirm the model and the site requirements. Photographs and approximate measurements are a good start, and you can send those when we reply.</p>
          <p><a className="text-link" href="/installation-delivery">View installation guidance <span className="arrow" aria-hidden="true">→</span></a></p>
        </div>
      </div>
    );
  }

  const err = (k: keyof FieldErrors) => errors[k];
  const errList = Object.entries(errors).filter(([, m]) => m) as [keyof FieldErrors, string][];
  const id = (k: string) => `enq-${k}`;
  const fieldProps = (k: keyof FieldErrors, hintId?: string) => ({
    id: id(k),
    'aria-invalid': err(k) ? true : undefined,
    'aria-describedby': [err(k) ? `${id(k)}-err` : '', hintId ?? ''].filter(Boolean).join(' ') || undefined,
  });
  const Err = ({ k }: { k: keyof FieldErrors }) => (err(k) ? <p className="field-error" id={`${id(k)}-err`}>{err(k)}</p> : null);
  const commercial = kind === 'commercial' || v.projectType === 'commercial';
  const busy = status.s === 'submitting';
  const modelName = models.find((m) => m.id === v.model)?.name;

  return (
    <form className="enq" onSubmit={submit} noValidate aria-describedby="enq-next">
      {submissionMode !== 'live' && (
        <div className="alert alert--info demo-banner" role="note">
          <h2>Demo mode</h2>
          <p>This form checks your answers, but in this preview it does not send them anywhere. No enquiry will be sent or stored.</p>
        </div>
      )}

      {errList.length > 0 && (
        <div className="alert alert--error" role="alert" tabIndex={-1} ref={summaryRef}>
          <h2>Please check {errList.length === 1 ? 'one thing' : `${errList.length} things`}</h2>
          <ul>
            {errList.map(([k, m]) => (
              <li key={k}>
                {k === 'form' ? m : <a href={`#${id(k)}`}>{m}</a>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status.s === 'error' && (
        <div className="alert alert--error" role="alert" tabIndex={-1} ref={errorRef}>
          <h2>Not sent</h2>
          <p>{status.message}</p>
        </div>
      )}

      {prefilled && (
        <div className="enq__prefill" role="group" aria-label="Preferences carried from your browsing">
          <span className="label muted">From your browsing</span>
          <p>
            {[modelName ?? (v.model === 'not-sure' ? 'Model: not sure' : null), v.heating ? `${HEATING_LABEL[v.heating]} (a preference)` : null, v.people ? `${v.people === '9' ? 'More than 8' : v.people} people` : null]
              .filter(Boolean)
              .join(' · ')}
            . You can change any of this below.
          </p>
          <button type="button" className="text-link" onClick={clearPrefs} style={{ background: 'none', border: 0, borderBottom: '1px solid currentColor', justifySelf: 'start', cursor: 'pointer' }}>
            Clear these preferences
          </button>
        </div>
      )}

      <fieldset>
        <legend>About you</legend>
        <div className="enq__row enq__row--2">
          <div className={`field${err('name') ? ' has-error' : ''}`}>
            <label htmlFor={id('name')}>Name</label>
            <input className="input" type="text" autoComplete="name" required value={v.name} onChange={(e) => set('name', e.target.value)} {...fieldProps('name')} />
            <Err k="name" />
          </div>
          <div className={`field${err('email') ? ' has-error' : ''}`}>
            <label htmlFor={id('email')}>Email</label>
            <input className="input" type="email" autoComplete="email" required value={v.email} onChange={(e) => set('email', e.target.value)} {...fieldProps('email')} />
            <Err k="email" />
          </div>
        </div>
        <div className="enq__row enq__row--2">
          <div className={`field${err('postcode') ? ' has-error' : ''}`}>
            <label htmlFor={id('postcode')}>Postcode where the sauna would go</label>
            <input className="input" type="text" autoComplete="postal-code" required value={v.postcode} onChange={(e) => set('postcode', e.target.value)} {...fieldProps('postcode', 'enq-postcode-hint')} />
            <span className="hint" id="enq-postcode-hint">We use this to review where you are. A postcode does not on its own confirm we can install there.</span>
            <Err k="postcode" />
          </div>
          <div className={`field${err('phone') ? ' has-error' : ''}`}>
            <label htmlFor={id('phone')}>Phone (optional)</label>
            <input className="input" type="tel" autoComplete="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} {...fieldProps('phone')} />
            <Err k="phone" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Your project</legend>
        {kind === 'residential' && (
          <div className={`field${err('projectType') ? ' has-error' : ''}`}>
            <span className="field-label" id="enq-pt-label" style={{ fontWeight: 600, fontSize: 'var(--fs-small)' }}>This is for</span>
            <div className="choice-group choice-group--row" role="radiogroup" aria-labelledby="enq-pt-label">
              {(['residential', 'commercial'] as const).map((t) => (
                <label className="choice" key={t}>
                  <input type="radio" name="projectType" value={t} checked={v.projectType === t} onChange={() => set('projectType', t)} />
                  <span className="choice-title">{t === 'residential' ? 'A home' : 'A business'}</span>
                </label>
              ))}
            </div>
            <Err k="projectType" />
            {v.projectType === 'commercial' && (
              <p className="hint">
                Business projects are assessed separately. You can carry on here, or use <a href="/commercial#enquire">the commercial form</a>, which asks about use, operation and timing.
              </p>
            )}
          </div>
        )}

        <div className={`field${err('model') ? ' has-error' : ''}`}>
          <label htmlFor={id('model')}>Model of interest</label>
          <select className="select" required value={v.model} onChange={(e) => set('model', e.target.value)} {...fieldProps('model')}>
            <option value="" disabled>Choose one…</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}{m.capacity ? `, ${m.capacity}` : ''}
              </option>
            ))}
            <option value="not-sure">Not sure</option>
          </select>
          <Err k="model" />
        </div>

        <div className={`field${err('description') ? ' has-error' : ''}`}>
          <label htmlFor={id('description')}>{commercial ? 'Tell us about the venue and the project' : 'Tell us about your space'}</label>
          <textarea
            className="textarea"
            required
            value={v.description}
            onChange={(e) => set('description', e.target.value)}
            {...fieldProps('description', 'enq-desc-hint')}
          />
          <span className="hint" id="enq-desc-hint">
            {commercial ? 'What it is for, and anything we should know about the site.' : 'Where in the garden, what the ground is like, and how you would get it in. A few lines is plenty.'}
          </span>
          <Err k="description" />
        </div>
      </fieldset>

      {commercial && (
        <fieldset>
          <legend>About the venue (all optional)</legend>
          <div className="enq__row enq__row--2">
            <div className="field"><label htmlFor={id('organisation')}>Organisation</label><input className="input" type="text" autoComplete="organization" value={v.organisation} onChange={(e) => set('organisation', e.target.value)} {...fieldProps('organisation')} /><Err k="organisation" /></div>
            <div className={`field${err('website') ? ' has-error' : ''}`}><label htmlFor={id('website')}>Website</label><input className="input" type="text" inputMode="url" autoComplete="url" value={v.website} onChange={(e) => set('website', e.target.value)} {...fieldProps('website')} /><Err k="website" /></div>
          </div>
          <div className="enq__row enq__row--2">
            <div className="field"><label htmlFor={id('venueType')}>Type of venue</label><input className="input" type="text" value={v.venueType} placeholder="e.g. holiday cabins, small hotel, wellness studio" onChange={(e) => set('venueType', e.target.value)} {...fieldProps('venueType')} /><Err k="venueType" /></div>
            <div className="field">
              <label htmlFor={id('venueStatus')}>New or existing venue</label>
              <select className="select" value={v.venueStatus} onChange={(e) => set('venueStatus', e.target.value)} {...fieldProps('venueStatus')}>
                <option value="">Choose one…</option><option value="new">A new venue</option><option value="existing">An existing venue</option><option value="not-sure">Not sure</option>
              </select>
            </div>
          </div>
          <div className="enq__row enq__row--2">
            <div className="field"><label htmlFor={id('usualUsers')}>Usual users</label><input className="input" type="text" value={v.usualUsers} placeholder="e.g. couples, groups of up to six" onChange={(e) => set('usualUsers', e.target.value)} {...fieldProps('usualUsers')} /><Err k="usualUsers" /></div>
            <div className="field"><label htmlFor={id('usageFrequency')}>Expected frequency of use</label><input className="input" type="text" value={v.usageFrequency} placeholder="e.g. daily in season" onChange={(e) => set('usageFrequency', e.target.value)} {...fieldProps('usageFrequency')} /><Err k="usageFrequency" /></div>
          </div>
          <div className="enq__row enq__row--2">
            <div className="field"><label htmlFor={id('openingTarget')}>Opening target</label><input className="input" type="text" value={v.openingTarget} onChange={(e) => set('openingTarget', e.target.value)} {...fieldProps('openingTarget')} /><Err k="openingTarget" /></div>
            <div className="field"><label htmlFor={id('contractors')}>Contractors already involved</label><input className="input" type="text" value={v.contractors} onChange={(e) => set('contractors', e.target.value)} {...fieldProps('contractors')} /><Err k="contractors" /></div>
          </div>
          <p className="hint">Please do not include health information about guests.</p>
        </fieldset>
      )}

      <fieldset>
        <legend>A little more, if you can (optional)</legend>
        <div className="enq__row enq__row--2">
          <div className="field">
            <label htmlFor={id('budget')}>Budget range</label>
            <select className="select" value={v.budget} onChange={(e) => set('budget', e.target.value)} {...fieldProps('budget')}>
              <option value="">Choose one…</option>
              {BUDGETS.map((b) => <option key={b} value={b}>{BUDGET_LABELS[b]}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor={id('timing')}>Preferred timing</label>
            <select className="select" value={v.timing} onChange={(e) => set('timing', e.target.value)} {...fieldProps('timing')}>
              <option value="">Choose one…</option>
              {TIMINGS.map((t) => <option key={t} value={t}>{TIMING_LABELS[t]}</option>)}
            </select>
          </div>
        </div>
        <div className="enq__row enq__row--2">
          <div className={`field${err('dimensions') ? ' has-error' : ''}`}>
            <label htmlFor={id('dimensions')}>Approximate space available</label>
            <input className="input" type="text" value={v.dimensions} placeholder="e.g. 4 m × 3 m" onChange={(e) => set('dimensions', e.target.value)} {...fieldProps('dimensions', 'enq-dim-hint')} />
            <span className="hint" id="enq-dim-hint">Please include units (metres). This is a starting point; we check base, clearances and access with you.</span>
            <Err k="dimensions" />
          </div>
          <div className="field">
            <label htmlFor={id('heating')}>Heating preference</label>
            <select className="select" value={v.heating} onChange={(e) => set('heating', e.target.value)} {...fieldProps('heating', 'enq-heat-hint')}>
              <option value="">No preference yet</option>
              <option value="electric">Electric</option>
              <option value="wood" disabled={v.model === 'rowan'}>Wood-burning{v.model === 'rowan' ? ' (not offered on the Rowan)' : ''}</option>
              <option value="advice">I need advice</option>
            </select>
            <span className="hint" id="enq-heat-hint">A preference, not a confirmed configuration.</span>
          </div>
        </div>
        <p className="hint">You can send photographs of the space when we reply. There is no upload here.</p>
      </fieldset>

      <fieldset>
        <legend>Staying in touch</legend>
        <label className="choice">
          <input type="checkbox" checked={v.marketingOptIn} onChange={(e) => set('marketingOptIn', e.target.checked)} />
          <span>
            <span className="choice-title">Send me occasional news from Alder & Ember (optional)</span>
            <span className="choice-note">Separate from your enquiry. Your enquiry is sent either way, and we will only email you news if you tick this.</span>
          </span>
        </label>
      </fieldset>

      {/* honeypot: hidden from people and assistive tech */}
      <div className="enq__hp" aria-hidden="true">
        <label htmlFor="enq-hp">Leave this field empty</label>
        <input id="enq-hp" name="website_url_confirm" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="enq__submit">
        <button className="btn" type="submit" disabled={busy} aria-disabled={busy}>
          {busy ? (<><span className="enq__spinner" aria-hidden="true" /> Sending…</>) : kind === 'commercial' ? 'Send commercial enquiry' : 'Send your enquiry'}
        </button>
        <p id="enq-next" className="muted" style={{ fontSize: 'var(--fs-small)' }}>
          {responseTime ?? 'The team reviews your project and replies as soon as they can.'} Site assessment and your quotation confirm the final specification. See our <a href="/privacy">privacy</a> page for how your details are used.
        </p>
      </div>
    </form>
  );
}
