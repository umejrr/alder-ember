/**
 * Global settings: company description, navigation, process stages, coverage copy,
 * contact channels. Contact details, domain and registered identity were NOT supplied,
 * so they are `missing` and are never rendered. See docs/launch-dependencies.md.
 */
import { field, missing } from './types';

export const site = {
  name: 'Alder & Ember',
  promise: 'Premium outdoor saunas, planned around your space and installed with care.',
  description:
    'Alder & Ember is a UK supplier and installer of premium outdoor saunas. We work with a specialist European manufacturing partner who builds the core range to agreed specifications. We look after the range, consultation, site assessment, installation coordination, quality checks and aftercare.',
  shortDescription: 'Premium outdoor saunas, planned around your space and installed with care.',
  // Contact: not supplied. Never invented. Keep null until Daniel approves.
  contact: {
    email: missing<string>('APPROVED_SUPPORT_EMAIL_REQUIRED'),
    phone: missing<string>('APPROVED_PHONE_REQUIRED'),
    address: missing<string>('APPROVED_ADDRESS_REQUIRED'),
    domain: missing<string>('APPROVED_DOMAIN_REQUIRED'),
  },
  responseTime: field(
    'The team reviews your project and aims to respond within one business day during working hours.',
    'brief',
    'Operational target, not a guaranteed response contract',
  ),
  coverage: field(
    'We install in England and Wales. Scotland needs an individual postcode assessment. Northern Ireland, islands and other locations need separate arrangements.',
    'working',
    'Initial coverage; confirm with Operations before it is shown as a promise',
  ),
  social: [] as { label: string; href: string }[],
};

export interface NavItem {
  label: string;
  href: string;
  /** production-only gate: hidden until real content exists */
  requires?: 'installations';
}

export const primaryNav: NavItem[] = [
  { label: 'Saunas', href: '/saunas' },
  { label: 'Installation & delivery', href: '/installation-delivery' },
  { label: 'Our installations', href: '/installations', requires: 'installations' },
  { label: 'Commercial', href: '/commercial' },
  { label: 'About', href: '/about' },
];

export const saunaSubNav: NavItem[] = [
  { label: 'The Rowan', href: '/saunas/rowan' },
  { label: 'The Alder', href: '/saunas/alder' },
  { label: 'The Ember', href: '/saunas/ember' },
  { label: 'Compare models', href: '/compare' },
];

export const footerNav: { heading: string; links: (NavItem & { gate?: 'guides' | 'policy' })[] }[] = [
  {
    heading: 'Saunas',
    links: [
      { label: 'The Rowan', href: '/saunas/rowan' },
      { label: 'The Alder', href: '/saunas/alder' },
      { label: 'The Ember', href: '/saunas/ember' },
      { label: 'Compare models', href: '/compare' },
    ],
  },
  {
    heading: 'Plan',
    links: [
      { label: 'Plan your sauna', href: '/plan-your-sauna' },
      { label: 'Installation & delivery', href: '/installation-delivery' },
      { label: 'Planning guides', href: '/guides', gate: 'guides' },
      { label: 'Care & support', href: '/care-support' },
      { label: 'Commercial projects', href: '/commercial' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Alder & Ember', href: '/about' },
      { label: 'Warranty', href: '/warranty', gate: 'policy' },
    ],
  },
];

export const legalNav: { label: string; href: string }[] = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Cookies', href: '/cookies' },
  { label: 'Terms', href: '/terms' },
];

export interface ProcessStage {
  n: number;
  title: string;
  body: string;
}

/** The four customer-facing stages (brief section 10E). */
export const stages: ProcessStage[] = [
  {
    n: 1,
    title: 'Find your model',
    body: 'Compare the three models by comfortable seating, size and starting price, or tell us about your space and we will help you shortlist.',
  },
  {
    n: 2,
    title: 'Check the space and access',
    body: 'Photographs and approximate measurements start the review. Straightforward sites may be assessed from photos or a video call; more complex ones may need a visit.',
  },
  {
    n: 3,
    title: 'Confirm the specification and quote',
    body: 'Your itemised quotation sets out the specification, what we will do, and what you or your contractors need to prepare.',
  },
  {
    n: 4,
    title: 'Arrange installation and handover',
    body: 'We confirm the schedule and site readiness before delivery, then complete installation checks and a handover with you.',
  },
];

/** Internal-only: shown as a short editorial note on preview builds. */
export const previewNotice =
  'Preview build: prices, dimensions and lead times are working values awaiting approval, and images are placeholders. Nothing here is a confirmed offer.';
