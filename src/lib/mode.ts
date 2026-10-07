import type { ApprovalStatus, ContentMode, Field } from '@/content/types';

/**
 * PUBLIC_CONTENT_MODE=preview (default) | production
 * See docs/content-editing.md for the consequences of switching.
 */
export function currentMode(): ContentMode {
  const raw = (import.meta.env?.PUBLIC_CONTENT_MODE as string | undefined) ?? 'preview';
  return raw === 'production' ? 'production' : 'preview';
}

export const isPreview = (mode: ContentMode = currentMode()) => mode === 'preview';

const VISIBLE: Record<ContentMode, ApprovalStatus[]> = {
  preview: ['approved', 'brief', 'working'],
  production: ['approved', 'brief'],
};

export function isVisibleStatus(status: ApprovalStatus, mode: ContentMode = currentMode()) {
  return VISIBLE[mode].includes(status);
}

/** Resolve a field for public output. Returns null when it must not be shown. */
export function resolve<T>(f: Field<T>, mode: ContentMode = currentMode()): T | null {
  if (f.value === null || f.value === undefined) return null;
  return isVisibleStatus(f.status, mode) ? f.value : null;
}

/** True when a preview-only (working) value is being shown. Used for the editorial preview markers. */
export function isWorking<T>(f: Field<T>, mode: ContentMode = currentMode()): boolean {
  return mode === 'preview' && f.value !== null && f.status === 'working';
}
