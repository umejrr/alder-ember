/**
 * Photography / asset manifest (brief section 7, "Photography direction").
 *
 * No approved photography has been supplied, so every record is `kind: 'placeholder'`
 * and renders as a clearly labelled preview frame. To swap in a real photograph:
 *   1. drop the file in /public/images/ (or an approved CDN),
 *   2. set `src`, `width`, `height`, real `alt`, `focal`, `rights` and `approval`,
 *   3. flip `kind` to 'photo'.
 * Nothing else in the codebase needs to change.
 *
 * Never use another supplier's image as a Rowan / Alder / Ember. Generated images may
 * only be atmosphere in a preview, never product or project evidence.
 */
import type { ApprovalStatus, ProductId } from './types';

export type AssetRole =
  | 'hero-wide'
  | 'hero-mobile'
  | 'model-exterior'
  | 'model-interior'
  | 'model-detail'
  | 'detail-timber'
  | 'detail-interior-finish'
  | 'detail-construction'
  | 'detail-glazing-heater'
  | 'site-access'
  | 'installation-process'
  | 'project';

export type Ratio = '16:9' | '3:2' | '4:3' | '4:5' | '1:1' | '21:9';
export type Tone = 'forest' | 'timber' | 'mineral' | 'dusk';

export interface Asset {
  id: string;
  role: AssetRole;
  label: string;
  modelId?: ProductId;
  ratio: Ratio;
  alt: string;
  /** 0-100, percent from top-left. Used as object-position for cropping. */
  focal: { x: number; y: number };
  /** separate focal point when the mobile crop differs */
  mobileFocal?: { x: number; y: number };
  intendedCrop: string;
  kind: 'placeholder' | 'photo';
  evidence: 'atmosphere' | 'product-evidence' | 'project-evidence';
  intendedUse: string;
  src?: string;
  width?: number;
  height?: number;
  rights: string | null;
  approval: ApprovalStatus;
  /** visual tone for the placeholder frame only */
  tone: Tone;
}

const ph = (
  a: Omit<Asset, 'kind' | 'rights' | 'approval' | 'focal' | 'evidence'> &
    Partial<Pick<Asset, 'focal' | 'evidence'>>,
): Asset => ({
  kind: 'placeholder',
  rights: null,
  approval: 'missing',
  focal: { x: 50, y: 50 },
  evidence: 'atmosphere',
  ...a,
});

export const assets: Asset[] = [
  ph({
    id: 'hero-wide',
    role: 'hero-wide',
    label: 'Hero: wide garden context',
    ratio: '16:9',
    alt: 'An outdoor sauna cabin in a UK garden at low light, with planting and the approach path visible.',
    intendedCrop: 'Full width, cabin in the right two-thirds, sky or planting clear in the lower-left for the headline. Never put the headline across the door.',
    intendedUse: 'Homepage hero (desktop)',
    tone: 'forest',
    focal: { x: 65, y: 55 },
  }),
  ph({
    id: 'hero-mobile',
    role: 'hero-mobile',
    label: 'Hero: mobile crop',
    ratio: '4:5',
    alt: 'An outdoor sauna cabin in a UK garden, cropped to keep the cabin and its door in frame.',
    intendedCrop: 'Portrait crop preserving the cabin, door and ground plane.',
    intendedUse: 'Homepage hero (mobile)',
    tone: 'forest',
    focal: { x: 62, y: 55 },
  }),
  ...(['rowan', 'alder', 'ember'] as const).flatMap((m) => {
    const name = m[0].toUpperCase() + m.slice(1);
    return [
      ph({
        id: `${m}-exterior`,
        role: 'model-exterior',
        modelId: m,
        label: `The ${name}: exterior`,
        ratio: '4:3',
        alt: `Exterior view of The ${name} outdoor sauna in a garden.`,
        intendedCrop: 'Consistent three-quarter exterior angle across all models, door and ground plane visible.',
        intendedUse: 'Model showcase, collection card, product gallery (1st image)',
        tone: m === 'rowan' ? 'mineral' : m === 'alder' ? 'forest' : 'dusk',
        evidence: 'product-evidence',
      }),
      ph({
        id: `${m}-interior`,
        role: 'model-interior',
        modelId: m,
        label: `The ${name}: interior`,
        ratio: '4:3',
        alt: `Interior of The ${name}, showing the benches and usable space.`,
        intendedCrop: 'Benches, seating depth and scale visible; no fake steam.',
        intendedUse: 'Product gallery (2nd image)',
        tone: 'timber',
        evidence: 'product-evidence',
      }),
      ph({
        id: `${m}-detail`,
        role: 'model-detail',
        modelId: m,
        label: `The ${name}: detail`,
        ratio: '3:2',
        alt: `A close detail of The ${name}: timber, glazing or heater controls.`,
        intendedCrop: 'Verified detail specific to this model.',
        intendedUse: 'Product gallery (3rd image)',
        tone: 'timber',
        evidence: 'product-evidence',
      }),
    ];
  }),
  ph({
    id: 'detail-timber',
    role: 'detail-timber',
    label: 'Detail: thermally modified exterior timber',
    ratio: '4:5',
    alt: 'Close-up of the thermally modified exterior timber cladding.',
    intendedCrop: 'Portrait close-up showing grain and board joints.',
    intendedUse: 'Homepage "Considered in every detail" chapter',
    tone: 'timber',
    evidence: 'product-evidence',
  }),
  ph({
    id: 'detail-interior-finish',
    role: 'detail-interior-finish',
    label: 'Detail: smooth sauna-grade interior and benches',
    ratio: '3:2',
    alt: 'Close-up of the smooth interior timber and a finished bench.',
    intendedCrop: 'Bench edge and interior timber surface.',
    intendedUse: 'Homepage craft chapter; product page',
    tone: 'timber',
    evidence: 'product-evidence',
  }),
  ph({
    id: 'detail-construction',
    role: 'detail-construction',
    label: 'Detail: insulated cabin construction',
    ratio: '4:3',
    alt: 'A detail showing the insulated wall construction of the cabin.',
    intendedCrop: 'Cut-away or corner detail, supplied by the manufacturer. No invented thicknesses.',
    intendedUse: 'Homepage craft chapter',
    tone: 'mineral',
    evidence: 'product-evidence',
  }),
  ph({
    id: 'detail-glazing-heater',
    role: 'detail-glazing-heater',
    label: 'Detail: glazing and heater',
    ratio: '4:3',
    alt: 'A detail of the glazed front and the heater with its controls.',
    intendedCrop: 'Only once the approved heater package is confirmed for the model shown.',
    intendedUse: 'Homepage craft chapter; Alder page',
    tone: 'dusk',
    evidence: 'product-evidence',
  }),
  ph({
    id: 'site-access',
    role: 'site-access',
    label: 'Site and access check',
    ratio: '3:2',
    alt: 'A garden gate and path, as checked during a site and access assessment.',
    intendedCrop: 'A real access route: gate, path, steps. Real photography preferred.',
    intendedUse: 'Installation & delivery; homepage process',
    tone: 'mineral',
    evidence: 'atmosphere',
  }),
  ph({
    id: 'installation-process',
    role: 'installation-process',
    label: 'Installation in progress',
    ratio: '3:2',
    alt: 'The team positioning a sauna cabin on its prepared base.',
    intendedCrop: 'Genuine installation photography only.',
    intendedUse: 'Installation & delivery; about',
    tone: 'forest',
    evidence: 'project-evidence',
  }),
];

const byId = new Map(assets.map((a) => [a.id, a]));

export function getAsset(id: string): Asset | undefined {
  return byId.get(id);
}

export function assetsForModel(id: ProductId): Asset[] {
  return assets.filter((a) => a.modelId === id);
}
