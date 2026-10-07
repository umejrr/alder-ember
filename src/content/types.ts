/**
 * Content status model (brief section 2).
 *
 *  approved - confirmed by the owner named in docs/content-editing.md
 *  brief    - supplied in the discovery answers; fine to build with, not independently verified
 *  working  - approximate / proposed / awaiting approval (prices, dimensions, lead times, ...)
 *  missing  - not supplied. Value must be null. Never rendered as 0 or as a guess.
 *
 * Preview builds show brief + working values (with a visible preview notice).
 * Production builds show approved + brief values only, so an unresolved claim is
 * omitted rather than quietly published.
 */
export type ApprovalStatus = 'approved' | 'brief' | 'working' | 'missing';
export type ContentMode = 'preview' | 'production';

export interface Field<T> {
  value: T | null;
  status: ApprovalStatus;
  /** Editorial note: who must approve it, or what is unresolved. Never rendered publicly. */
  note?: string;
}

export const field = <T>(value: T | null, status: ApprovalStatus, note?: string): Field<T> => ({
  value,
  status,
  ...(note ? { note } : {}),
});

export const missing = <T = never>(note?: string): Field<T> => field<T>(null, 'missing', note);

export type ProductId = 'rowan' | 'alder' | 'ember';

export interface Dimensions {
  /** metres */
  w: number;
  d: number;
  h: number;
}

export interface CapacityRange {
  /** comfortable seated adults - not maximum occupancy */
  min: number;
  max: number;
}

export type Availability = 'available' | 'selected-configurations' | 'not-offered';

export interface Product {
  id: ProductId;
  slug: ProductId;
  name: string;
  shortName: string;
  /** one-sentence position */
  position: string;
  /** who it suits (primary fit) */
  fit: Field<string>;
  format: Field<string>;
  capacity: Field<CapacityRange>;
  exterior: Field<Dimensions>;
  interior: Field<Dimensions>;
  /** extra interior description, e.g. "plus changing area" */
  interiorNote: string | null;
  changingArea: Field<string>;
  priceFromMinor: Field<number>;
  vatStatement: Field<string>;
  priceScope: Field<string>;
  electric: Field<Availability>;
  woodBurning: Field<Availability>;
  commercial: Field<string>;
  leadTime: Field<string>;
  /** unresolved technical fields: null until approved, never zero */
  weightKg: Field<number>;
  baseRequirement: Field<string>;
  accessRequirement: Field<string>;
  clearances: Field<string>;
  standardPackage: Field<string[]>;
  /** feature bullets; they state capacity, so they are 'working' until capacity is approved */
  highlights: Field<string[]>;
  gallery: string[];
  heroAsset: string;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
  approval: { status: ApprovalStatus; lastApproved: string | null };
}

export type OptionGroup =
  | 'heating'
  | 'glazing'
  | 'finish'
  | 'controls'
  | 'comfort'
  | 'access'
  | 'layout';

export interface ProductOption {
  id: string;
  label: string;
  group: OptionGroup;
  description: string;
  /** Selectable only when compatibility is approved for that model. */
  compatibleProductIds: Field<ProductId[]>;
  kind: 'included' | 'optional' | 'unresolved';
  priceType: 'included' | 'quoted-after-assessment' | 'unconfirmed';
  priceMinor: Field<number>;
  requiresAssessment: boolean;
  approval: ApprovalStatus;
}

export interface Faq {
  id: string;
  question: string;
  answer: string[];
  topic: 'base' | 'access' | 'area' | 'price' | 'next-steps' | 'heating' | 'commercial' | 'care';
  linkHref?: string;
  linkLabel?: string;
  approval: ApprovalStatus;
}

export interface GuideSection {
  heading: string;
  body: string[];
  list?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  summary: string;
  topic: string;
  intro: string;
  sections: GuideSection[];
  relatedLinks: { href: string; label: string }[];
  /** technical content needs expert approval before it is published */
  approval: ApprovalStatus;
  reviewer: string | null;
  published: string | null;
  updated: string | null;
}
