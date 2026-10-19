import { useEffect, useState } from 'react';
import type { ModelView } from './ModelView';
import { enquiryHref, readPrefs, writePrefs } from '@/lib/prefs-client';
import { reconcileHeating, type HeatingChoice, type HeatingPreference } from '@/content/options';
import { pageHref } from '@/lib/base-url';

interface Props {
  model: ModelView;
  heating: HeatingChoice[];
  compareIds: string[];
  /** estimated lead time, shown after the call to action */
  leadTime?: string | null;
  leadWorking?: boolean;
}

/**
 * Enquiry panel on a model page. A heating choice here is a PREFERENCE carried into the
 * enquiry, not a confirmed configuration, and the panel says so.
 */
export default function ProductPanel({ model, heating, compareIds, leadTime = null, leadWorking = false }: Props) {
  const [pref, setPref] = useState<HeatingPreference | null>(null);
  // said aloud when a heating preference carried from another model is not offered on this one
  const [changed, setChanged] = useState<string | null>(null);

  useEffect(() => {
    const before = readPrefs({ reconcile: false });
    const r = reconcileHeating(model.id, before.heating);
    setChanged(r.adjusted ? r.reason : null);
    writePrefs({ model: model.id });
    const saved = readPrefs().heating;
    const choice = heating.find((h) => h.value === saved && !h.disabled);
    if (choice) setPref(choice.value);
  }, [model.id, heating]);

  const choose = (v: HeatingPreference) => {
    setChanged(null);
    setPref(v);
    writePrefs({ heating: v });
  };

  const href = enquiryHref({ model: model.id, ...(pref ? { heating: pref } : {}) });
  const label = pref ? heating.find((h) => h.value === pref)?.label : null;

  return (
    <div className="ppanel">
      {/* the action sits straight after the price; everything optional follows it */}
      <div className="actions">
        <a className="btn btn--block" href={href} data-enquiry-cta>
          Plan your {model.shortName}
        </a>
        <a className="btn btn--secondary btn--block" href={pageHref(`/compare?m=${compareIds.join(',')}`)}>
          Compare models
        </a>
      </div>
      <p className="ppanel__summary" aria-live="polite">
        <span className="label muted">Your enquiry</span>
        <span className="ppanel__summary-text">
          {model.name}
          {label ? ` · ${label} (a preference)` : ''}
        </span>
      </p>

      {leadTime && (
        <p className="ppanel__lead">
          <span className="label muted">Estimated lead time{leadWorking ? ' (working figure)' : ''}</span>
          <br />
          {leadTime}
        </p>
      )}

      <fieldset className="ppanel__fieldset">
        <legend className="label muted">Heating preference (optional)</legend>
        <div className="ppanel__heat" role="radiogroup">
          {heating.map((h) => (
            <label className={`ppanel__heat-opt${h.disabled ? ' is-off' : ''}`} key={h.value}>
              <input
                type="radio"
                name={`heating-${model.id}`}
                value={h.value}
                checked={pref === h.value}
                disabled={h.disabled}
                onChange={() => choose(h.value)}
              />
              <span>
                {h.label}
                {h.disabled ? <span className="sr-only"> (not offered on this model)</span> : null}
              </span>
            </label>
          ))}
        </div>
        <p className="ppanel__heat-note" aria-live="polite">
          {changed ??
            heating.find((h) => h.value === pref)?.note ??
            (heating.some((h) => h.disabled) ? 'Wood-burning is not offered on this model in the supplied range.' : 'Choose a preference, or leave it blank.')}
        </p>
      </fieldset>

      <p className="ppanel__note">
        Site assessment and your itemised quotation confirm the final specification. A preference here is a starting point
        for the conversation, not a confirmed configuration.
      </p>
    </div>
  );
}
