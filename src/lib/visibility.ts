import { guides } from '@/content/guides';
import { installations } from '@/content/installations';
import { campaigns } from '@/content/campaigns';
import { policies, type Policy } from '@/content/policies';
import type { ContentMode } from '@/content/types';
import { currentMode } from './mode';

/**
 * Route gating. In preview everything renders (with honest preview states).
 * In production a route is only live when it has approved content to show.
 */
export function visibleGuides(mode: ContentMode = currentMode()) {
  return guides.filter((g) => mode === 'preview' || g.approval === 'approved');
}

export function visibleInstallations(mode: ContentMode = currentMode()) {
  return installations.filter(
    (i) => i.published && (mode === 'preview' || i.approval === 'approved'),
  );
}

export function visibleCampaigns(mode: ContentMode = currentMode()) {
  return campaigns.filter((c) => c.published && (mode === 'preview' || c.approval === 'approved'));
}

/** The installations index and nav item exist in preview, or when approved stories exist. */
export function installationsRouteEnabled(mode: ContentMode = currentMode()): boolean {
  return mode === 'preview' || visibleInstallations(mode).length > 0;
}

export function guidesRouteEnabled(mode: ContentMode = currentMode()): boolean {
  return visibleGuides(mode).length > 0;
}

export function policyIsApproved(p: Policy): boolean {
  return p.approval === 'approved' && p.body.length > 0;
}

/** Policy pages are always routable (legal links are needed), but unapproved ones are noindex. */
export function policyList(): Policy[] {
  return Object.values(policies);
}

/** True when an internal link target exists in the current build (guides and installations are gated). */
export function linkAvailable(href: string, mode: ContentMode = currentMode()): boolean {
  const path = href.split('#')[0];
  if (path === '/guides') return guidesRouteEnabled(mode);
  if (path.startsWith('/guides/')) return visibleGuides(mode).some((g) => path === `/guides/${g.slug}`);
  if (path === '/installations') return installationsRouteEnabled(mode);
  if (path.startsWith('/installations/')) return visibleInstallations(mode).some((i) => path === `/installations/${i.slug}`);
  return true;
}

export function shouldIndex(mode: ContentMode = currentMode()): boolean {
  return mode === 'production';
}
