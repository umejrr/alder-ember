import { useEffect, useState } from 'react';
import type { ModelView } from './ModelView';
import { enquiryHref, readPrefs, writePrefs } from '@/lib/prefs-client';
import type { HeatingChoice, HeatingPreference } from '@/content/options';

interface Props {
  model: ModelView;
  heating: HeatingChoice[];
  compareIds: string[];
}

/**
 * Enquiry panel on a model page. A heating choice here is a PREFERENCE carried into the
 * enquiry, not a confirmed configuration, and the panel says so.
 */
export default function ProductPanel({ model, heating, compareIds }: Props) {
  const [pref, setPref] = useState<HeatingPreference | null>(null);

  useEffect(() => {
    writePrefs({ model: model.id });
    const saved = readPrefs().heating;
    const choice = heating.find((h) => h.value === saved && !h.disabled);
    if (choice) setPref(choice.value);
  }, [model.id, heating]);

  const choose = (v: HeatingPreference) => {
    setPref(v);
    writePrefs({ heating: v });
  };

  const href = enquiryHref({ model: model.id, ...(pref ? { heating: pref } : {}) });
  const label = pref ? heating.find((h) => h.value === pref)?.label : null;

  return (
    <div className="ppanel">
      <div className="ppanel__summary" aria-live="polite">
        <span className="label muted">Your enquiry</span>
        <p>
          {model.name}
          {label ? ` · ${label} (a preference)` : ''}
        </p>
      </div>

      <div className="actions">
        <a className="btn btn--block" href={href} data-enquiry-cta>
          Plan your {model.shortName}
        </a>
        <a className="btn btn--secondary btn--block" href={`/compare?m=${compareIds.join(',')}`}>
          Compare models
        </a>
      </div>

      <fieldset className="ppanel__fieldset">
        <legend className="label muted">Heating preference (optional)</legend>
        <div className="choice-group">
          {heating.map((h) => (
            <label className="choice" key={h.value}>
              <input
                type="radio"
                name={`heating-${model.id}`}
                value={h.value}
                checked={pref === h.value}
                disabled={h.disabled}
                onChange={() => choose(h.value)}
              />
              <span>
                <span className="choice-title">{h.label}</span>
                <span className="choice-note">{h.note}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="ppanel__note">
        Site assessment and your itemised quotation confirm the final specification. A preference here is a starting point
        for the conversation, not a confirmed configuration.
      </p>
    </div>
  );
}
