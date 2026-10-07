import { describe, expect, it } from 'vitest';
import { productList, products } from '@/content/products';
import { options, selectableOptions, heatingChoices, discussableOptions } from '@/content/options';
import { publicProduct, formatGBP } from '@/lib/format';
import { resolve } from '@/lib/mode';
import { visibleGuides, installationsRouteEnabled, visibleInstallations } from '@/lib/visibility';
import { assets, getAsset } from '@/content/assets';

describe('product data is the single source and agrees with the brief', () => {
  it('matches the supplied working values', () => {
    const p = (id: keyof typeof products) => publicProduct(products[id], 'preview');
    expect(p('rowan')).toMatchObject({ capacity: '2–3 adults', exterior: '2.0 × 2.0 × 2.4 m', price: '£8,950' });
    expect(p('alder')).toMatchObject({ capacity: '4–5 adults', exterior: '2.6 × 2.2 × 2.4 m', price: '£12,950' });
    expect(p('ember')).toMatchObject({ capacity: '6–8 adults', exterior: '3.6 × 2.6 × 2.5 m', price: '£18,950' });
    expect(p('ember').interior).toContain('plus changing area');
  });

  it('stores price in minor units and formats it', () => {
    expect(products.rowan.priceFromMinor.value).toBe(895000);
    expect(formatGBP(1295000)).toBe('£12,950');
  });

  it('leaves unresolved technical fields null, never zero', () => {
    for (const p of productList) {
      for (const f of [p.weightKg, p.baseRequirement, p.accessRequirement, p.clearances]) {
        expect(f.value).toBeNull();
        expect(f.status).toBe('missing');
      }
    }
  });

  it('comfortable capacity ranges do not overlap and ascend', () => {
    const caps = productList.map((p) => p.capacity.value!);
    for (let i = 1; i < caps.length; i++) expect(caps[i].min).toBeGreaterThan(caps[i - 1].max);
  });
});

describe('production mode omits unresolved claims', () => {
  it('shows no working price, dimensions or capacity in production', () => {
    for (const p of productList) {
      const pub = publicProduct(p, 'production');
      expect(pub.price).toBeNull();
      expect(pub.exterior).toBeNull();
      expect(pub.interior).toBeNull();
      expect(pub.capacity).toBeNull();
      expect(pub.leadTime).toBeNull();
    }
  });

  it('still shows brief-supplied positioning in production', () => {
    expect(publicProduct(products.alder, 'production').fit).toContain('balance of space and price');
  });

  it('resolve() never returns a missing value', () => {
    expect(resolve(products.rowan.weightKg, 'preview')).toBeNull();
    expect(resolve(products.rowan.weightKg, 'production')).toBeNull();
  });

  it('hides unapproved guides and the empty installations route in production only', () => {
    expect(visibleGuides('preview').length).toBeGreaterThan(0);
    expect(visibleGuides('production')).toHaveLength(0);
    expect(installationsRouteEnabled('preview')).toBe(true);
    expect(installationsRouteEnabled('production')).toBe(false);
    expect(visibleInstallations('preview')).toHaveLength(0); // no invented projects, ever
  });
});

describe('options and compatibility', () => {
  it('no option is selectable on any model until compatibility is approved', () => {
    for (const p of productList) expect(selectableOptions(p.id)).toHaveLength(0);
  });

  it('every unresolved option has null (not zero) pricing and missing compatibility', () => {
    for (const o of options.filter((x) => x.kind === 'unresolved')) {
      expect(o.priceMinor.value).toBeNull();
      expect(o.compatibleProductIds.status).toBe('missing');
    }
  });

  it('invites discussion of unresolved options, including the changing area', () => {
    const ids = discussableOptions('ember').map((o) => o.id);
    expect(ids).toContain('changing-area');
    expect(ids).toContain('glazing-upgrade');
  });

  it('does not offer wood-burning on the Rowan, but does on Alder and Ember', () => {
    const wood = (id: 'rowan' | 'alder' | 'ember') => heatingChoices(id, 'preview').find((c) => c.value === 'wood')!;
    expect(wood('rowan').disabled).toBe(true);
    expect(wood('alder').disabled).toBe(false);
    expect(wood('ember').disabled).toBe(false);
    expect(heatingChoices('rowan').find((c) => c.value === 'advice')!.disabled).toBe(false);
  });
});

describe('asset manifest', () => {
  it('has no fake photos: every record is a labelled placeholder until real rights exist', () => {
    for (const a of assets) {
      if (a.kind === 'photo') {
        expect(a.src && a.rights && a.approval === 'approved').toBeTruthy();
      } else {
        expect(a.rights).toBeNull();
      }
    }
  });

  it('every product gallery and hero asset exists', () => {
    for (const p of productList) {
      expect(getAsset(p.heroAsset)).toBeDefined();
      for (const id of p.gallery) expect(getAsset(id)?.modelId).toBe(p.id);
    }
  });
});

import { linkAvailable } from '@/lib/visibility';
describe('link availability follows gated routes', () => {
  it('does not link to unapproved guides or empty installations in production', () => {
    expect(linkAvailable('/guides/planning-base-and-access', 'production')).toBe(false);
    expect(linkAvailable('/guides', 'production')).toBe(false);
    expect(linkAvailable('/installations', 'production')).toBe(false);
    expect(linkAvailable('/guides/planning-base-and-access', 'preview')).toBe(true);
    expect(linkAvailable('/compare', 'production')).toBe(true);
  });
});
