/** Absolute URL helper. PUBLIC_SITE_URL is the approved domain once Daniel supplies it. */
export function absoluteUrl(path: string): string | null {
  const base = import.meta.env.PUBLIC_SITE_URL as string | undefined;
  if (!base) return null;
  return new URL(path, base.endsWith('/') ? base : base + '/').toString();
}
