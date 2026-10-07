import type { ProductId } from '@/content/types';

/** Serialisable, display-ready product data passed from Astro (already mode-filtered) to islands. */
export interface ModelView {
  id: ProductId;
  name: string;
  shortName: string;
  position: string;
  fit: string | null;
  format: string | null;
  capacity: string | null;
  capacityMin: number | null;
  capacityMax: number | null;
  exterior: string | null;
  interior: string | null;
  price: string | null;
  vat: string | null;
  priceScope: string | null;
  leadTime: string | null;
  changingArea: string | null;
  electric: string | null;
  wood: string | null;
  commercial: string | null;
  asset: {
    id: string;
    label: string;
    tone: string;
    alt: string;
    src: string | null;
    ratio: string;
    pos: string;
    placeholder: boolean;
  };
}
