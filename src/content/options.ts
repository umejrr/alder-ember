/**
 * Options and heater configurations.
 *
 * The brief names options (glazing upgrades, finishes, alternative heaters, Wi-Fi
 * controls, backrests, lighting, entrance platforms, changing area) but supplies no
 * compatibility matrix and no prices. Compatibility is therefore `missing` for all of
 * them, which means NONE is selectable on ANY model until Operations approves it.
 * The UI invites people to discuss preferences instead.
 */
import { field, missing, type Product, type ProductId, type ProductOption } from './types';
import { products } from './products';
import { isVisibleStatus } from '@/lib/mode';
import type { ContentMode } from './types';

const unresolved = (
  id: string,
  label: string,
  group: ProductOption['group'],
  description: string,
): ProductOption => ({
  id,
  label,
  group,
  description,
  compatibleProductIds: missing<ProductId[]>('Operations: compatibility matrix required'),
  kind: 'unresolved',
  priceType: 'unconfirmed',
  priceMinor: missing<number>('Daniel / Operations: option price required'),
  requiresAssessment: true,
  approval: 'missing',
});

export const options: ProductOption[] = [
  {
    id: 'heater-electric',
    label: 'Electric heating',
    group: 'heating',
    description:
      'Suits customers who want straightforward controls and regular use. Equipment sizing and electrical supply follow the approved equipment specification.',
    compatibleProductIds: field<ProductId[]>(['rowan', 'alder', 'ember'], 'working'),
    kind: 'included',
    priceType: 'included',
    priceMinor: missing<number>(),
    requiresAssessment: true,
    approval: 'working',
  },
  {
    id: 'heater-wood',
    label: 'Wood-burning heating',
    group: 'heating',
    description:
      'Selected configurations suit people comfortable tending a fire and managing the associated maintenance and site considerations. Ventilation, flues and clearances follow the approved equipment specification.',
    compatibleProductIds: field<ProductId[]>(['alder', 'ember'], 'working', 'Selected configurations, subject to assessment'),
    kind: 'optional',
    priceType: 'quoted-after-assessment',
    priceMinor: missing<number>(),
    requiresAssessment: true,
    approval: 'working',
  },
  unresolved('glazing-upgrade', 'Glazing upgrades', 'glazing', 'Alternative or additional glazing.'),
  unresolved('exterior-finish', 'Exterior finishes', 'finish', 'Alternative approved exterior finishes.'),
  unresolved('heater-alternative', 'Alternative heaters', 'heating', 'Heaters other than the standard approved package.'),
  unresolved('controls-wifi', 'Wi-Fi controls', 'controls', 'Connected heater control.'),
  unresolved('backrests', 'Backrests', 'comfort', 'Added bench backrests.'),
  unresolved('lighting', 'Lighting options', 'comfort', 'Lighting beyond the standard lighting.'),
  unresolved('entrance-platform', 'Entrance platforms', 'access', 'A platform or step at the cabin door.'),
  unresolved('changing-area', 'Changing area', 'layout', 'Whether a changing area is included, optional or a separate configuration is still being confirmed.'),
];

/** Options a customer may select as a preference: approved compatibility only. */
export function selectableOptions(productId: ProductId): ProductOption[] {
  return options.filter((o) => {
    const c = o.compatibleProductIds;
    return c.status === 'approved' && c.value?.includes(productId) === true;
  });
}

/** Options to talk through: everything not yet approved as selectable for this model. */
export function discussableOptions(productId: ProductId): ProductOption[] {
  const selectable = new Set(selectableOptions(productId).map((o) => o.id));
  return options.filter((o) => o.group !== 'heating' && !selectable.has(o.id));
}

export type HeatingPreference = 'electric' | 'wood' | 'advice';

export interface HeatingChoice {
  value: HeatingPreference;
  label: string;
  /** a preference, never a confirmed configuration */
  note: string;
  disabled: boolean;
}

/**
 * Heating preference choices for a model. 'Need advice' is always available.
 * With no model chosen, both fuel choices are shown and wood is noted as model-dependent.
 */
export function heatingChoices(productId: ProductId | null, mode?: ContentMode): HeatingChoice[] {
  const woodOk = productId ? woodBurningMayBeDiscussed(productId, mode) : true;
  return [
    { value: 'electric', label: 'Electric', note: 'Straightforward controls, suits regular use.', disabled: false },
    {
      value: 'wood',
      label: 'Wood-burning',
      note: woodOk
        ? 'Selected configurations only, subject to site assessment.'
        : 'Not offered on this model in the supplied range.',
      disabled: !woodOk,
    },
    { value: 'advice', label: 'I need advice', note: 'We will talk it through with you.', disabled: false },
  ];
}

export function woodBurningMayBeDiscussed(productId: ProductId, mode?: ContentMode): boolean {
  const f = products[productId].woodBurning;
  // In production only approved/brief values count; otherwise treat as a conversation, not an offer.
  if (f.value === null) return false;
  if (!isVisibleStatus(f.status, mode)) return true; // unknown publicly: do not block, discuss with the team
  return f.value === 'selected-configurations' || f.value === 'available';
}

export function modelHasProduct(p: Product | undefined): p is Product {
  return Boolean(p);
}
