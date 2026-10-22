import type { ApprovalStatus, ContentMode, Field } from '@/content/types';

/**
 * PUBLIC_CONTENT_MODE=production (default) | preview
 * Production shows only approved content. Preview additionally shows draft values with a visible notice, and exists
 * for staging new content before it is approved. See docs/content-editing.md.
 */
export function currentMode(): ContentMode {
  const raw = (import.meta.env?.PUBLIC_CONTENT_MODE as string | undefined) ?? 'production';
  return raw === 'preview' ? 'preview' : 'production';
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
