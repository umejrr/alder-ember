import type { Availability, Product } from '@/content/types';
import { getAsset } from '@/content/assets';
import { publicProduct } from './format';
import { resolve } from './mode';
import type { ModelView } from '@/components/react/ModelView';

const AVAIL: Record<Availability, string> = {
  available: 'Available',
  'selected-configurations': 'Selected configurations, subject to assessment',
  'not-offered': 'Not offered in the supplied range',
};

/** Build the display-ready view of a product for the current content mode. */
export function toModelView(p: Product, assetId: string = p.heroAsset): ModelView {
  const pub = publicProduct(p);
  const a = getAsset(assetId);
  if (!a) throw new Error(`Unknown asset ${assetId}`);
  const electric = resolve(p.electric);
  const wood = resolve(p.woodBurning);
  return {
    id: p.id,
    name: p.name,
    shortName: p.shortName,
    position: p.position,
    fit: pub.fit,
    format: pub.format,
    capacity: pub.capacity,
    capacityMin: pub.capacityRange?.min ?? null,
    capacityMax: pub.capacityRange?.max ?? null,
    exterior: pub.exterior,
    interior: pub.interior,
    price: pub.price,
    vat: pub.vat,
    priceScope: pub.priceScope,
    leadTime: pub.leadTime,
    changingArea: pub.changingArea,
    electric: electric ? AVAIL[electric] : null,
    wood: wood ? AVAIL[wood] : null,
    commercial: resolve(p.commercial),
    asset: {
      id: a.id,
      label: a.label,
      tone: a.tone,
      alt: a.alt,
      src: a.kind === 'photo' && a.src ? a.src : null,
      ratio: a.ratio.replace(':', ' / '),
      pos: `${a.focal.x}% ${a.focal.y}%`,
      placeholder: a.kind !== 'photo',
    },
  };
}
