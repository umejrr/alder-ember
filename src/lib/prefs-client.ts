/**
 * Non-personal preference state kept in sessionStorage so the chosen model/preferences
 * survive navigation into the enquiry form and back. Never stores name, email, phone,
 * postcode, free text or photos.
 */
import { parsePreferences, preferencesToQuery, type PreferenceState } from './selector';

const KEY = 'ae-prefs-v1';

export function readPrefs(): PreferenceState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return parsePreferences(new URLSearchParams(raw));
  } catch {
    /* storage unavailable */
  }
  return {};
}

export function writePrefs(update: PreferenceState): PreferenceState {
  const merged = { ...readPrefs(), ...update };
  try {
    sessionStorage.setItem(KEY, preferencesToQuery(merged).replace(/^\?/, ''));
  } catch {
    /* storage unavailable: URL params still carry state on navigation */
  }
  return merged;
}

export function clearPrefs() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export const enquiryHref = (p: PreferenceState) => `/plan-your-sauna${preferencesToQuery(p)}`;
