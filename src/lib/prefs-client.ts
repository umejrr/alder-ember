/**
 * Non-personal preference state kept in sessionStorage so the chosen model/preferences
 * survive navigation into the enquiry form and back. Never stores name, email, phone,
 * postcode, free text or photos.
 */
import {
  PREFERENCE_PARAMS,
  parsePreferences,
  preferencesToQuery,
  reconcilePreferences,
  type PreferenceState,
} from './selector';
import { pageHref } from './base-url';

const KEY = 'ae-prefs-v1';

/** `reconcile: false` returns what was stored, so a caller can explain a change it is about to make. */
export function readPrefs({ reconcile = true }: { reconcile?: boolean } = {}): PreferenceState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return parsePreferences(new URLSearchParams(raw), { reconcile });
  } catch {
    /* storage unavailable */
  }
  return {};
}

export function writePrefs(update: PreferenceState): PreferenceState {
  // reconcile after merging, so a model change can never leave an unavailable heating preference behind
  const merged = reconcilePreferences({ ...readPrefs(), ...update });
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

/**
 * Removes the preference parameters from the address bar, leaving any other parameters and the
 * fragment untouched. "Clear" must clear the URL too, otherwise a reload brings the choice back.
 */
export function clearUrlPreferences() {
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const k of PREFERENCE_PARAMS) {
      if (url.searchParams.has(k)) {
        url.searchParams.delete(k);
        changed = true;
      }
    }
    if (changed) window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* sandboxed frames may refuse; session and form state are already cleared */
  }
}

export const enquiryHref = (p: PreferenceState) => pageHref(`/plan-your-sauna${preferencesToQuery(p)}`);
