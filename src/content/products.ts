/**
 * THE product source of truth. Every price, capacity and dimension on the site
 * (cards, model pages, comparison, selector, enquiry summary) is read from here.
 *
 * Values from the brief's "working values" table are status 'working': they are
 * visible in preview builds and omitted from production builds until Operations /
 * Daniel mark them 'approved'. Missing technical fields are null, never zero.
 */
import { field, missing, type Product, type ProductId } from './types';

const PRICE_SCOPE =
  'Starting price for the cabin, including VAT. Delivery and installation scope, and anything that depends on your site, are confirmed in your itemised quotation. It is not a confirmed installed total.';

const STANDARD_PACKAGE = [
  'Cabin',
  'Benches',
  'Approved electric heater package and controls',
  'Standard lighting',
  'Bucket and ladle',
  'Thermometer',
];

const LEAD_TIME =
  'Approximately 8–12 weeks from confirmed specification and order acceptance, subject to production scheduling.';

const COMMERCIAL = 'Requires separate assessment';

export const products: Record<ProductId, Product> = {
  rowan: {
    id: 'rowan',
    slug: 'rowan',
    name: 'The Rowan',
    shortName: 'Rowan',
    position: 'The compact cabin for a smaller garden, whether you sauna alone or as a couple.',
    fit: field('Compact garden, solo use or a couple', 'brief'),
    format: field('Compact rectangular cabin', 'brief'),
    capacity: field({ min: 2, max: 3 }, 'working', 'Operations to confirm comfortable seating'),
    exterior: field({ w: 2.0, d: 2.0, h: 2.4 }, 'working', 'Manufacturer drawings required'),
    interior: field({ w: 1.7, d: 1.7, h: 2.1 }, 'working', 'Approximate sauna-room size'),
    interiorNote: null,
    changingArea: missing('Not described for this model in the supplied range'),
    priceFromMinor: field(895000, 'working', 'Proposed starting price incl. VAT - Daniel to approve'),
    vatStatement: field('Including VAT', 'working'),
    priceScope: field(PRICE_SCOPE, 'brief'),
    electric: field('available', 'working'),
    woodBurning: field('not-offered', 'working', 'Not offered in supplied range'),
    commercial: field(COMMERCIAL, 'brief'),
    leadTime: field(LEAD_TIME, 'working', 'Editable; confirmed in the quotation'),
    weightKg: missing('Manufacturer drawings required'),
    baseRequirement: missing('Operations: approved base size, load and level'),
    accessRequirement: missing('Operations: approved access requirements'),
    clearances: missing('Operations: approved equipment and maintenance clearances'),
    standardPackage: field(STANDARD_PACKAGE, 'working', 'Publish only after approval against this model'),
    highlights: [
      'Sized for solo use or a couple, with comfortable seating for two to three adults.',
      'The smallest footprint in the range, for a compact garden.',
      'Electric heating, for straightforward controls and regular use.',
    ],
    gallery: ['rowan-exterior', 'rowan-interior', 'rowan-detail'],
    heroAsset: 'rowan-exterior',
    seoTitle: 'The Rowan Outdoor Sauna | Alder & Ember',
    seoDescription:
      'The Rowan is a compact outdoor sauna for a smaller garden. See comfortable capacity, working dimensions and how planning and installation work.',
    published: true,
    approval: { status: 'working', lastApproved: null },
  },
  alder: {
    id: 'alder',
    slug: 'alder',
    name: 'The Alder',
    shortName: 'Alder',
    position: 'More room and a glazed front, balancing space and price for a household.',
    fit: field('Household wanting more room and a balance of space and price', 'brief'),
    format: field('Rectangular cabin with glazed front', 'brief'),
    capacity: field({ min: 4, max: 5 }, 'working', 'Operations to confirm comfortable seating'),
    exterior: field({ w: 2.6, d: 2.2, h: 2.4 }, 'working', 'Manufacturer drawings required'),
    interior: field({ w: 2.3, d: 1.9, h: 2.1 }, 'working', 'Approximate sauna-room size'),
    interiorNote: null,
    changingArea: missing('Not described for this model in the supplied range'),
    priceFromMinor: field(1295000, 'working', 'Proposed starting price incl. VAT - Daniel to approve'),
    vatStatement: field('Including VAT', 'working'),
    priceScope: field(PRICE_SCOPE, 'brief'),
    electric: field('available', 'working'),
    woodBurning: field('selected-configurations', 'working', 'Subject to assessment'),
    commercial: field(COMMERCIAL, 'brief'),
    leadTime: field(LEAD_TIME, 'working', 'Editable; confirmed in the quotation'),
    weightKg: missing('Manufacturer drawings required'),
    baseRequirement: missing('Operations: approved base size, load and level'),
    accessRequirement: missing('Operations: approved access requirements'),
    clearances: missing('Operations: approved equipment and maintenance clearances'),
    standardPackage: field(STANDARD_PACKAGE, 'working', 'Publish only after approval against this model'),
    highlights: [
      'Comfortable seating for four to five adults.',
      'A glazed front. Glazing specification is confirmed per configuration.',
      'Electric heating, with wood-burning in selected configurations subject to assessment.',
    ],
    gallery: ['alder-exterior', 'alder-interior', 'alder-detail'],
    heroAsset: 'alder-exterior',
    seoTitle: 'The Alder Outdoor Sauna | Alder & Ember',
    seoDescription:
      'The Alder is a glazed-front outdoor sauna with comfortable seating for four to five adults. See working dimensions, heating options and installation planning.',
    published: true,
    approval: { status: 'working', lastApproved: null },
  },
  ember: {
    id: 'ember',
    slug: 'ember',
    name: 'The Ember',
    shortName: 'Ember',
    position: 'The largest cabin, for a bigger household or regular guests, described with a changing area.',
    fit: field('Larger household, regular guests, or changing-area needs', 'brief'),
    format: field('Larger cabin described with changing area', 'brief'),
    capacity: field({ min: 6, max: 8 }, 'working', 'Operations to confirm comfortable seating'),
    exterior: field({ w: 3.6, d: 2.6, h: 2.5 }, 'working', 'Manufacturer drawings required'),
    interior: field({ w: 2.3, d: 2.3, h: 2.1 }, 'working', 'Sauna room only; changing-area size not supplied'),
    interiorNote: 'plus changing area',
    changingArea: field(
      'Described with a changing area',
      'working',
      'UNRESOLVED: confirm whether the changing area is included, optional, or a separate configuration',
    ),
    priceFromMinor: field(1895000, 'working', 'Proposed starting price incl. VAT - Daniel to approve'),
    vatStatement: field('Including VAT', 'working'),
    priceScope: field(PRICE_SCOPE, 'brief'),
    electric: field('available', 'working'),
    woodBurning: field('selected-configurations', 'working', 'Subject to assessment'),
    commercial: field(COMMERCIAL, 'brief'),
    leadTime: field(LEAD_TIME, 'working', 'Editable; confirmed in the quotation'),
    weightKg: missing('Manufacturer drawings required'),
    baseRequirement: missing('Operations: approved base size, load and level'),
    accessRequirement: missing('Operations: approved access requirements'),
    clearances: missing('Operations: approved equipment and maintenance clearances'),
    standardPackage: field(STANDARD_PACKAGE, 'working', 'Publish only after approval against this model'),
    highlights: [
      'Comfortable seating for six to eight adults.',
      'The largest cabin in the range, described with a changing area. How the changing area is specified is still being confirmed.',
      'Electric heating, with wood-burning in selected configurations subject to assessment.',
    ],
    gallery: ['ember-exterior', 'ember-interior', 'ember-detail'],
    heroAsset: 'ember-exterior',
    seoTitle: 'The Ember Outdoor Sauna | Alder & Ember',
    seoDescription:
      'The Ember is our largest outdoor sauna, with comfortable seating for six to eight adults. See working dimensions, heating options and installation planning.',
    published: true,
    approval: { status: 'working', lastApproved: null },
  },
};

export const productList: Product[] = [products.rowan, products.alder, products.ember];
export const productIds: ProductId[] = ['rowan', 'alder', 'ember'];

export function getProduct(id: string): Product | undefined {
  return (products as Record<string, Product>)[id];
}

export const isProductId = (v: unknown): v is ProductId => typeof v === 'string' && v in products;
