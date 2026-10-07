/**
 * Lightweight model preference selector (brief section 14).
 *
 * This is a shortlist helper, NOT a configurator. It never states that a model
 * "fits" a space, never calculates electrical suitability or flue compliance, and
 * never produces a price. Comfortable capacity is the only numeric rule.
 */
import type { ProductId } from '@/content/types';
import { products, productList } from '@/content/products';
import type { HeatingPreference } from '@/content/options';
import { woodBurningMayBeDiscussed } from '@/content/options';

export type UseType = 'residential' | 'commercial';
export type ModelInterest = ProductId | 'not-sure';
export type ChangingAreaPref = 'yes' | 'no' | 'not-important';

export interface SelectorInput {
  use: UseType;
  /** usual number of adults; null = not sure */
  people: number | null;
  model: ModelInterest;
  heating: HeatingPreference;
  changingArea: ChangingAreaPref;
  /** free text, optional; never used to decide */
  space?: string;
}

export type SelectorResult =
  | { kind: 'recommend'; model: ProductId; reasons: string[]; caveats: string[] }
  | { kind: 'advice'; reasons: string[]; compare: ProductId[] }
  | { kind: 'commercial'; reasons: string[] };

export const CLOSING_SENTENCE = "A useful starting point. We'll confirm the model and site requirements with you.";

const MAX_COMFORTABLE = 8;

/** Smallest model whose comfortable capacity covers `people`. Null if beyond the range. */
export function modelForPeople(people: number): ProductId | null {
  if (people > MAX_COMFORTABLE) return null;
  for (const p of productList) {
    const cap = p.capacity.value;
    if (cap && people <= cap.max) return p.id;
  }
  return null;
}

const SPACE_CAVEAT =
  'Your approximate space is a starting point only. A model also needs a base, clearances around it and a route in for delivery, which we check with you.';

export function runSelector(input: SelectorInput): SelectorResult {
  if (input.use === 'commercial') {
    return {
      kind: 'commercial',
      reasons: [
        'Commercial projects are assessed individually, looking at use, occupancy, maintenance and equipment suitability.',
      ],
    };
  }

  const { people, model, heating, changingArea } = input;
  const reasons: string[] = [];
  const caveats: string[] = [];

  if (people !== null && people > MAX_COMFORTABLE) {
    return {
      kind: 'advice',
      reasons: [
        `The range seats up to ${MAX_COMFORTABLE} adults comfortably, so a group of ${people} is beyond what we can suggest here. It is worth a conversation about what you need.`,
      ],
      compare: ['ember'],
    };
  }

  const byPeople = people !== null ? modelForPeople(people) : null;
  let chosen: ProductId | null = null;

  if (model !== 'not-sure') {
    const interest = products[model];
    const cap = interest.capacity.value;
    if (people !== null && cap && people > cap.max) {
      return {
        kind: 'advice',
        reasons: [
          `You mentioned ${interest.name}, which seats ${cap.min}–${cap.max} adults comfortably, for a usual group of ${people}. ${byPeople ? `${products[byPeople].name} may suit that group size better, ` : ''}so it is worth comparing before you decide.`,
        ],
        compare: byPeople ? [model, byPeople] : [model],
      };
    }
    chosen = model;
    reasons.push(`You are interested in ${interest.name}.`);
    if (people !== null && cap) {
      reasons.push(`It seats ${cap.min}–${cap.max} adults comfortably, which covers a usual group of ${people}.`);
    }
  } else if (byPeople) {
    chosen = byPeople;
    const cap = products[byPeople].capacity.value;
    reasons.push(
      `${products[byPeople].name} seats ${cap?.min}–${cap?.max} adults comfortably, the smallest model that covers a usual group of ${people}.`,
    );
  } else {
    return {
      kind: 'advice',
      reasons: [
        'Without a usual group size or a model in mind, we cannot sensibly suggest one yet. A short conversation, or the comparison page, is the best next step.',
      ],
      compare: ['rowan', 'alder', 'ember'],
    };
  }

  // Changing-area preference: only the Ember is described with one, and how it is specified is unresolved.
  if (changingArea === 'yes') {
    if (chosen !== 'ember') {
      return {
        kind: 'advice',
        reasons: [
          'You would like a changing area. Only the Ember is described with one, and how that is specified is still being confirmed, so we would rather talk it through than guess.',
        ],
        compare: ['ember', chosen],
      };
    }
    caveats.push('The Ember is described with a changing area. We will confirm exactly how it is specified for your project.');
  }

  if (heating === 'wood') {
    if (!woodBurningMayBeDiscussed(chosen)) {
      return {
        kind: 'advice',
        reasons: [
          `Wood-burning is not offered on ${products[chosen].name} in the supplied range. The Alder and Ember have selected wood-burning configurations, subject to assessment, so it is worth comparing them.`,
        ],
        compare: ['alder', 'ember'],
      };
    }
    caveats.push(
      'Wood-burning is available in selected configurations only, and depends on your site. Ventilation, flues and clearances follow the approved equipment specification.',
    );
  } else if (heating === 'electric') {
    reasons.push('Electric heating is available, with straightforward controls.');
  } else {
    caveats.push('You would like advice on heating. We will talk through electric and, where offered, wood-burning.');
  }

  if (input.space && input.space.trim()) caveats.push(SPACE_CAVEAT);
  caveats.push('This is a shortlist, not an approval of your site or a confirmed installed price.');

  return { kind: 'recommend', model: chosen, reasons, caveats };
}

/**
 * Non-personal preference state, safe for URL / sessionStorage.
 * Deliberately excludes name, email, phone, postcode and free text.
 */
export interface PreferenceState {
  model?: ProductId | 'not-sure';
  use?: UseType;
  people?: number;
  heating?: HeatingPreference;
  changingArea?: ChangingAreaPref;
}

const HEATING_VALUES: HeatingPreference[] = ['electric', 'wood', 'advice'];
const USE_VALUES: UseType[] = ['residential', 'commercial'];
const CHANGING_VALUES: ChangingAreaPref[] = ['yes', 'no', 'not-important'];

/** Parse and validate preference params; unknown/invalid values are dropped. */
export function parsePreferences(params: URLSearchParams | Record<string, string | undefined>): PreferenceState {
  const get = (k: string) => (params instanceof URLSearchParams ? params.get(k) : params[k]) ?? undefined;
  const out: PreferenceState = {};
  const model = get('model');
  if (model === 'not-sure' || (model && model in products)) out.model = model as PreferenceState['model'];
  const use = get('use');
  if (use && (USE_VALUES as string[]).includes(use)) out.use = use as UseType;
  const people = Number(get('people'));
  if (get('people') && Number.isInteger(people) && people >= 1 && people <= 20) out.people = people;
  const heating = get('heating');
  if (heating && (HEATING_VALUES as string[]).includes(heating)) out.heating = heating as HeatingPreference;
  const ca = get('changing');
  if (ca && (CHANGING_VALUES as string[]).includes(ca)) out.changingArea = ca as ChangingAreaPref;
  return out;
}

export function preferencesToQuery(p: PreferenceState): string {
  const q = new URLSearchParams();
  if (p.model) q.set('model', p.model);
  if (p.use) q.set('use', p.use);
  if (p.people) q.set('people', String(p.people));
  if (p.heating) q.set('heating', p.heating);
  if (p.changingArea) q.set('changing', p.changingArea);
  const s = q.toString();
  return s ? `?${s}` : '';
}
