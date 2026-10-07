/**
 * Enquiry schema + validation. The SAME function runs in the browser (for usability)
 * and on the server (for trust). Never relax the server run.
 */
export const PROJECT_TYPES = ['residential', 'commercial'] as const;
export const MODEL_CHOICES = ['rowan', 'alder', 'ember', 'not-sure'] as const;
export const HEATING = ['electric', 'wood', 'advice'] as const;
export const BUDGETS = [
  'under-10k', '10k-15k', '15k-20k', '20k-25k', 'over-25k', 'not-sure', 'prefer-to-discuss',
] as const;
export const TIMINGS = ['asap', 'within-3-months', '3-6-months', '6-12-months', 'exploring'] as const;
export const VENUE_STATUS = ['new', 'existing', 'not-sure'] as const;

export const BUDGET_LABELS: Record<(typeof BUDGETS)[number], string> = {
  'under-10k': 'Under £10,000',
  '10k-15k': '£10,000–£15,000',
  '15k-20k': '£15,000–£20,000',
  '20k-25k': '£20,000–£25,000',
  'over-25k': 'Over £25,000',
  'not-sure': 'Not sure',
  'prefer-to-discuss': 'Prefer to discuss',
};
export const TIMING_LABELS: Record<(typeof TIMINGS)[number], string> = {
  asap: 'As soon as possible',
  'within-3-months': 'Within 3 months',
  '3-6-months': '3–6 months',
  '6-12-months': '6–12 months',
  exploring: 'Just exploring',
};

export interface EnquiryInput {
  name: string;
  email: string;
  postcode: string;
  projectType: (typeof PROJECT_TYPES)[number];
  model: (typeof MODEL_CHOICES)[number];
  description: string;
  phone?: string;
  budget?: (typeof BUDGETS)[number];
  timing?: (typeof TIMINGS)[number];
  dimensions?: string;
  heating?: (typeof HEATING)[number];
  // non-personal preference context from the selector
  people?: number;
  changingArea?: 'yes' | 'no' | 'not-important';
  // commercial (all optional)
  organisation?: string;
  website?: string;
  venueType?: string;
  venueStatus?: (typeof VENUE_STATUS)[number];
  usualUsers?: string;
  usageFrequency?: string;
  openingTarget?: string;
  contractors?: string;
  // consent: separate, optional, never bundled
  marketingOptIn: boolean;
  // attribution / plumbing
  campaignId?: string;
  sourcePage?: string;
  idempotencyKey: string;
}

export type FieldErrors = Partial<Record<keyof EnquiryInput | 'form', string>>;
export type ValidationResult = { ok: true; value: EnquiryInput } | { ok: false; errors: FieldErrors };

// UK postcode (outward + inward). Format check only: it does NOT prove we serve the area.
const POSTCODE = /^(GIR 0AA|[A-PR-UWYZ]([0-9]{1,2}|([A-HK-Y][0-9]([0-9ABEHMNPRV-Y])?)|[0-9][A-HJKPS-UW]) ?[0-9][ABD-HJLNP-UW-Z]{2})$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const LIMITS = { name: 100, email: 254, description: 2000, short: 200, phone: 20 } as const;

export function normalisePostcode(raw: string): string {
  const c = raw.replace(/\s+/g, '').toUpperCase();
  return c.length > 3 ? `${c.slice(0, -3)} ${c.slice(-3)}` : c;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max + 1) : '');
const oneOf = <T extends readonly string[]>(list: T, v: unknown): T[number] | undefined =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T[number]) : undefined;

export function validateEnquiry(raw: unknown): ValidationResult {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  const name = str(r.name, LIMITS.name);
  if (name.length < 2) errors.name = 'Enter your name.';
  else if (name.length > LIMITS.name) errors.name = `Keep your name to ${LIMITS.name} characters.`;

  const email = str(r.email, LIMITS.email);
  if (!email) errors.email = 'Enter your email address so we can reply.';
  else if (!EMAIL.test(email) || email.length > LIMITS.email) errors.email = 'Enter an email address like name@example.com.';

  const postcodeRaw = str(r.postcode, 12);
  if (!postcodeRaw) errors.postcode = 'Enter the postcode where the sauna would go.';
  else if (!POSTCODE.test(postcodeRaw.replace(/\s+/g, ' '))) errors.postcode = 'Enter a UK postcode, for example SW1A 1AA.';

  const projectType = oneOf(PROJECT_TYPES, r.projectType);
  if (!projectType) errors.projectType = 'Choose whether this is for a home or a business.';

  const model = oneOf(MODEL_CHOICES, r.model);
  if (!model) errors.model = 'Choose a model, or “Not sure”.';

  const description = str(r.description, LIMITS.description);
  if (description.length < 10) errors.description = 'Tell us a little about the space or project (at least a sentence).';
  else if (description.length > LIMITS.description) errors.description = `Keep this to ${LIMITS.description} characters. You can add more when we reply.`;

  const phoneRaw = str(r.phone, LIMITS.phone);
  if (phoneRaw) {
    const digits = phoneRaw.replace(/\D/g, '');
    if (!/^[\d\s()+-]+$/.test(phoneRaw) || digits.length < 7 || digits.length > 15) errors.phone = 'Enter a phone number with only digits, spaces, + ( ) or -.';
  }

  const website = str(r.website, LIMITS.short);
  if (website && !/^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(website)) errors.website = 'Enter a website address like example.co.uk.';

  const dimensions = str(r.dimensions, 120);
  if (dimensions.length > 120) errors.dimensions = 'Keep this to 120 characters.';

  for (const k of ['organisation', 'venueType', 'usualUsers', 'usageFrequency', 'openingTarget', 'contractors'] as const) {
    if (str(r[k], LIMITS.short).length > LIMITS.short) errors[k] = `Keep this to ${LIMITS.short} characters.`;
  }

  const idempotencyKey = str(r.idempotencyKey, 64);
  if (idempotencyKey.length < 8) errors.form = 'Something went wrong with this form. Please reload the page and try again.';

  if (Object.keys(errors).length) return { ok: false, errors };

  const people = Number(r.people);
  const value: EnquiryInput = {
    name,
    email,
    postcode: normalisePostcode(postcodeRaw),
    projectType: projectType!,
    model: model!,
    description,
    marketingOptIn: r.marketingOptIn === true, // explicit true only; never inferred
    idempotencyKey,
    ...(phoneRaw ? { phone: phoneRaw } : {}),
    ...(oneOf(BUDGETS, r.budget) ? { budget: oneOf(BUDGETS, r.budget) } : {}),
    ...(oneOf(TIMINGS, r.timing) ? { timing: oneOf(TIMINGS, r.timing) } : {}),
    ...(dimensions ? { dimensions } : {}),
    ...(oneOf(HEATING, r.heating) ? { heating: oneOf(HEATING, r.heating) } : {}),
    ...(Number.isInteger(people) && people >= 1 && people <= 20 ? { people } : {}),
    ...(oneOf(['yes', 'no', 'not-important'] as const, r.changingArea) ? { changingArea: oneOf(['yes', 'no', 'not-important'] as const, r.changingArea) } : {}),
    ...(str(r.organisation, LIMITS.short) ? { organisation: str(r.organisation, LIMITS.short) } : {}),
    ...(website ? { website } : {}),
    ...(str(r.venueType, LIMITS.short) ? { venueType: str(r.venueType, LIMITS.short) } : {}),
    ...(oneOf(VENUE_STATUS, r.venueStatus) ? { venueStatus: oneOf(VENUE_STATUS, r.venueStatus) } : {}),
    ...(str(r.usualUsers, LIMITS.short) ? { usualUsers: str(r.usualUsers, LIMITS.short) } : {}),
    ...(str(r.usageFrequency, LIMITS.short) ? { usageFrequency: str(r.usageFrequency, LIMITS.short) } : {}),
    ...(str(r.openingTarget, LIMITS.short) ? { openingTarget: str(r.openingTarget, LIMITS.short) } : {}),
    ...(str(r.contractors, LIMITS.short) ? { contractors: str(r.contractors, LIMITS.short) } : {}),
    ...(str(r.campaignId, 80) ? { campaignId: str(r.campaignId, 80) } : {}),
    ...(str(r.sourcePage, 120) ? { sourcePage: str(r.sourcePage, 120) } : {}),
  };
  return { ok: true, value };
}

/** Plain-language summary of non-personal context, safe to show back to the visitor. */
export function contextSummary(v: Pick<EnquiryInput, 'model' | 'heating' | 'projectType' | 'people' | 'changingArea'>) {
  const out: string[] = [];
  out.push(v.projectType === 'commercial' ? 'Commercial project' : 'Home project');
  out.push(v.model === 'not-sure' ? 'Model: not sure yet' : `Model: The ${v.model[0].toUpperCase()}${v.model.slice(1)}`);
  if (v.heating) out.push(`Heating preference: ${v.heating === 'advice' ? 'would like advice' : v.heating === 'wood' ? 'wood-burning' : 'electric'}`);
  if (v.people) out.push(`Usual number of people: ${v.people > 8 ? 'more than 8' : v.people}`);
  if (v.changingArea === 'yes') out.push('Would like a changing area');
  return out;
}
