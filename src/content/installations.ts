/**
 * Real installation stories. EMPTY by design: none were supplied, and the brief forbids
 * invented projects, places, customers or quotes. In production this keeps the
 * "Our installations" route out of the navigation and sitemap.
 *
 * To add one, append a record with customer permission and image rights confirmed.
 */
import type { ApprovalStatus, ProductId } from './types';

export interface Installation {
  slug: string;
  title: string;
  productId: ProductId;
  /** general region only, never an address */
  region: string | null;
  summary: string;
  customerGoal: string | null;
  siteConstraints: string[];
  deliveredScope: string[];
  /** approved customer wording only */
  quotation: { text: string; attribution: string } | null;
  gallery: string[];
  permission: { property: boolean; people: boolean; location: boolean; testimonial: boolean };
  imageRights: string | null;
  approval: ApprovalStatus;
  published: boolean;
}

export const installations: Installation[] = [];
