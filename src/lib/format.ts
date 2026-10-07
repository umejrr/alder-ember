import type { CapacityRange, Dimensions, Field, Product } from '@/content/types';
import { resolve } from './mode';
import type { ContentMode } from '@/content/types';

/** Prices are stored in minor units (pence) and formatted for display only. */
export function formatGBP(minor: number): string {
  const pounds = minor / 100;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: Number.isInteger(pounds) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(pounds);
}

const m = (n: number) => n.toFixed(1);

/** "2.0 × 2.0 × 2.4 m" - width × depth × height, metres. */
export function formatDimensions(d: Dimensions): string {
  return `${m(d.w)} × ${m(d.d)} × ${m(d.h)} m`;
}

const WORDS: Record<number, string> = {
  1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight',
};

/** "2–3 adults" */
export function formatCapacity(c: CapacityRange): string {
  return `${c.min}–${c.max} adults`;
}

export function capacityInWords(c: CapacityRange): string {
  return `${WORDS[c.min] ?? c.min} to ${WORDS[c.max] ?? c.max} adults`;
}

export interface PublicProduct {
  capacity: string | null;
  capacityRange: CapacityRange | null;
  exterior: string | null;
  interior: string | null;
  price: string | null;
  priceMinor: number | null;
  vat: string | null;
  priceScope: string | null;
  fit: string | null;
  format: string | null;
  leadTime: string | null;
  changingArea: string | null;
}

/**
 * Display-ready values for a product, already filtered for the current content mode.
 * Null means "do not render this claim" (or render the explicit fallback wording).
 */
export function publicProduct(p: Product, mode?: ContentMode): PublicProduct {
  const r = <T,>(f: Field<T>) => resolve(f, mode);
  const cap = r(p.capacity);
  const ext = r(p.exterior);
  const int = r(p.interior);
  const price = r(p.priceFromMinor);
  return {
    capacity: cap ? formatCapacity(cap) : null,
    capacityRange: cap,
    exterior: ext ? formatDimensions(ext) : null,
    interior: int ? formatDimensions(int) + (p.interiorNote ? `, ${p.interiorNote}` : '') : null,
    price: price !== null ? formatGBP(price) : null,
    priceMinor: price,
    vat: r(p.vatStatement),
    priceScope: r(p.priceScope),
    fit: r(p.fit),
    format: r(p.format),
    leadTime: r(p.leadTime),
    changingArea: r(p.changingArea),
  };
}

export const FALLBACK = {
  price: 'Price confirmed in your quotation',
  dimension: 'Confirmed on enquiry',
  unknown: 'To be confirmed',
  assessed: 'Quoted after assessment',
};
