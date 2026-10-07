/**
 * Policy pages are templates only. The brief says not to generate apparently final
 * legal terms from assumptions about the UK market, so no policy body is written here.
 * When approved text is supplied, set `body` and `approval: 'approved'`.
 */
import type { ApprovalStatus } from './types';

export interface Policy {
  slug: 'privacy' | 'cookies' | 'terms' | 'warranty';
  title: string;
  seoTitle: string;
  summary: string;
  /** Approved policy paragraphs (headings + text). Empty until supplied. */
  body: { heading: string; paragraphs: string[] }[];
  approval: ApprovalStatus;
  approver: string;
  /** Open decisions the approved text must cover (from brief section 25) */
  openItems: string[];
}

export const policies: Record<Policy['slug'], Policy> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy',
    seoTitle: 'Privacy | Alder & Ember',
    summary: 'How enquiry details and website data are used and kept.',
    body: [],
    approval: 'missing',
    approver: 'Daniel / appropriate adviser',
    openItems: [
      'Who the data controller is and how to contact them',
      'What is collected through the enquiry form and why',
      'Retention periods for enquiries and any uploaded photos',
      'How marketing consent is recorded (it is a separate, optional choice)',
      'Which providers (CRM, email, analytics, booking) process data',
    ],
  },
  cookies: {
    slug: 'cookies',
    title: 'Cookies',
    seoTitle: 'Cookies | Alder & Ember',
    summary: 'What this website stores in your browser, and how to change your choices.',
    body: [],
    approval: 'missing',
    approver: 'Daniel / appropriate adviser',
    openItems: [
      'The approved list of cookies and storage actually used',
      'The consent configuration for analytics and marketing',
      'Retention of consent choices',
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Terms',
    seoTitle: 'Terms | Alder & Ember',
    summary: 'Terms for using this website and for sales, once approved.',
    body: [],
    approval: 'missing',
    approver: 'Daniel / appropriate adviser',
    openItems: [
      'Sale and cancellation terms',
      'Bespoke orders (manufacturer confirmation before quotation)',
      'Deposit treatment and payment structure',
      'Responsibility for customer-prepared work (ground, electrical, access)',
      'Equipment manufacturer terms',
    ],
  },
  warranty: {
    slug: 'warranty',
    title: 'Warranty',
    seoTitle: 'Warranty | Alder & Ember',
    summary: 'Cabin workmanship cover, equipment cover and how to make a claim, once approved.',
    body: [],
    approval: 'missing',
    approver: 'Daniel / appropriate adviser',
    openItems: [
      'Coverage and exclusions for the cabin',
      'How equipment is covered under each manufacturer’s terms',
      'Customer responsibilities and the claim procedure',
      'The first point of contact for aftercare',
    ],
  },
};
