/**
 * Campaign landing pages. No offer, discount, countdown or scarcity has been supplied,
 * so the only campaign is a product introduction with no offer terms.
 * Add a real campaign by appending a record; leave `offer` null unless terms are approved.
 */
import type { ApprovalStatus, ProductId } from './types';

export interface Campaign {
  slug: string;
  title: string;
  productId: ProductId;
  headline: string;
  intro: string;
  /** approved offer terms; null = no offer. Never invent one. */
  offer: string | null;
  validFrom: string | null;
  validTo: string | null;
  /** attribution id carried into the enquiry */
  attributionId: string;
  approval: ApprovalStatus;
  published: boolean;
}

export const campaigns: Campaign[] = [
  {
    slug: 'meet-the-alder',
    title: 'Meet the Alder',
    productId: 'alder',
    headline: 'The Alder: a glazed outdoor sauna for the whole household.',
    intro:
      'A rectangular cabin with a glazed front and comfortable seating for four to five adults. See the size, the starting price and what installation involves.',
    offer: null,
    validFrom: null,
    validTo: null,
    attributionId: 'campaign-meet-the-alder',
    approval: 'working',
    published: true,
  },
];
