/**
 * Consent store. Analytics and marketing are OFF until a visitor opts in.
 * Only the visitor's choice is stored (no identifiers). Safe when storage is blocked.
 */
export interface Consent {
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
}
const KEY = 'ae-consent-v1';

export function getConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (typeof c?.analytics === 'boolean' && typeof c?.marketing === 'boolean') return c as Consent;
  } catch {
    /* storage blocked or corrupt: treat as undecided */
  }
  return null;
}

export function setConsent(c: Pick<Consent, 'analytics' | 'marketing'>): Consent {
  const full: Consent = { ...c, decidedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(full));
  } catch {
    /* ignore: the choice still applies for this page view via the event below */
  }
  window.dispatchEvent(new CustomEvent('ae:consent', { detail: full }));
  return full;
}

export const analyticsAllowed = () => getConsent()?.analytics === true;
