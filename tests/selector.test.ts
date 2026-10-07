import { describe, expect, it } from 'vitest';
import {
  modelForPeople, runSelector, parsePreferences, preferencesToQuery, type SelectorInput,
} from '@/lib/selector';

const base: SelectorInput = { use: 'residential', people: null, model: 'not-sure', heating: 'advice', changingArea: 'not-important' };
const run = (o: Partial<SelectorInput>) => runSelector({ ...base, ...o });

describe('model suggestion by comfortable capacity', () => {
  it('maps group sizes to the smallest sufficient model', () => {
    expect(modelForPeople(1)).toBe('rowan');
    expect(modelForPeople(3)).toBe('rowan');
    expect(modelForPeople(4)).toBe('alder');
    expect(modelForPeople(5)).toBe('alder');
    expect(modelForPeople(6)).toBe('ember');
    expect(modelForPeople(8)).toBe('ember');
    expect(modelForPeople(9)).toBeNull();
  });

  it('recommends with reasons for a clear residential case', () => {
    const r = run({ people: 4, heating: 'electric' });
    expect(r.kind).toBe('recommend');
    if (r.kind === 'recommend') {
      expect(r.model).toBe('alder');
      expect(r.reasons.join(' ')).toMatch(/4–5 adults/);
    }
  });
});

describe('selector refuses to over-promise', () => {
  it('sends commercial use to assessment, never a model', () => {
    expect(run({ use: 'commercial', people: 4 }).kind).toBe('commercial');
  });

  it('gives advice, not a forced answer, beyond the range', () => {
    expect(run({ people: 12 }).kind).toBe('advice');
  });

  it('gives advice when there is nothing to decide on', () => {
    expect(run({}).kind).toBe('advice');
  });

  it('flags a model of interest that is too small for the group', () => {
    const r = run({ model: 'rowan', people: 6 });
    expect(r.kind).toBe('advice');
  });

  it('honours a larger model than needed', () => {
    const r = run({ model: 'ember', people: 2 });
    expect(r.kind).toBe('recommend');
    if (r.kind === 'recommend') expect(r.model).toBe('ember');
  });

  it('advises on wood-burning for the Rowan', () => {
    expect(run({ people: 2, heating: 'wood' }).kind).toBe('advice');
    const ok = run({ people: 4, heating: 'wood' });
    expect(ok.kind).toBe('recommend');
    if (ok.kind === 'recommend') expect(ok.caveats.join(' ')).toMatch(/selected configurations/i);
  });

  it('treats a changing-area need as advice unless the group already points to the Ember', () => {
    expect(run({ people: 2, changingArea: 'yes' }).kind).toBe('advice');
    const r = run({ people: 7, changingArea: 'yes' });
    expect(r.kind).toBe('recommend');
    if (r.kind === 'recommend') expect(r.caveats.join(' ')).toMatch(/still|confirm/i);
  });

  it('never says a model "fits" and always caveats approximate space', () => {
    const r = run({ people: 2, space: '3m x 3m' });
    expect(r.kind).toBe('recommend');
    if (r.kind === 'recommend') {
      const text = [...r.reasons, ...r.caveats].join(' ').toLowerCase();
      expect(text).not.toMatch(/\bfits\b/);
      expect(text).toContain('base');
    }
  });
});

describe('preference state is non-personal and safe to share', () => {
  it('round-trips valid preferences', () => {
    const q = preferencesToQuery({ model: 'alder', use: 'residential', people: 4, heating: 'electric', changingArea: 'no' });
    expect(parsePreferences(new URLSearchParams(q))).toEqual({
      model: 'alder', use: 'residential', people: 4, heating: 'electric', changingArea: 'no',
    });
  });

  it('drops unknown values and ignores personal fields', () => {
    const p = parsePreferences(new URLSearchParams('model=nope&use=x&people=999&heating=steam&email=a@b.c&name=Sam&postcode=SW1A1AA'));
    expect(p).toEqual({});
    expect(preferencesToQuery({ model: 'rowan' })).not.toMatch(/email|name|postcode/);
  });
});
