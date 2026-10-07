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
 *
 * kind 'stock-preview' = a real, openly licensed photograph (Wikimedia Commons) standing in for imagery
 * that has not been supplied. It is always labelled on the page, carries its credit, is never product or
 * project evidence, and is reported as a launch blocker until replaced. See docs/image-credits.md.
 */
import type { ApprovalStatus, ProductId } from './types';
import { previewPhotos, type PreviewPhoto } from './preview-photos.ts';

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
  kind: 'placeholder' | 'stock-preview' | 'photo';
  evidence: 'atmosphere' | 'product-evidence' | 'project-evidence';
  intendedUse: string;
  src?: string;
  /** responsive candidates, e.g. "/images/x-640.webp 640w, /images/x-1280.webp 1280w" */
  srcset?: string;
  /** smallest variant, for thumbnails */
  thumb?: string;
  width?: number;
  height?: number;
  credit?: PreviewPhoto['credit'];
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

const baseAssets: Asset[] = [
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

interface Stock {
  photo: string;
  alt: string;
  focal: { x: number; y: number };
  mobileFocal?: { x: number; y: number };
}

/** Which stock preview photo fills which slot, with accurate alt text and focal points. */
const STOCK: Record<string, Stock> = {
  'hero-wide': { photo: 'hero', focal: { x: 70, y: 60 }, alt: 'A dark timber A-frame cabin with a large glazed front, standing among pine trees at the edge of a grassy clearing.' },
  'hero-mobile': { photo: 'hero', focal: { x: 72, y: 55 }, mobileFocal: { x: 72, y: 55 }, alt: 'A dark timber A-frame cabin with a large glazed front, standing among pine trees at the edge of a grassy clearing.' },
  'rowan-exterior': { photo: 'rowan-exterior', focal: { x: 50, y: 62 }, alt: 'A compact timber cabin with an arched roof and a door with a small window, on a paved lakeside path.' },
  'alder-exterior': { photo: 'alder-exterior', focal: { x: 56, y: 52 }, alt: 'A modern timber cabin with large glazed corners and a stone chimney stack, set in open moorland with mountains behind.' },
  'ember-exterior': { photo: 'ember-exterior', focal: { x: 72, y: 55 }, alt: 'A larger octagonal timber cabin lit warmly from inside at dusk, on a lawn beside a wooden hot tub.' },
  'rowan-interior': { photo: 'rowan-interior', focal: { x: 50, y: 55 }, alt: 'Inside a small sauna: a long bench along a pine-panelled wall and a stainless heater in the corner.' },
  'alder-interior': { photo: 'alder-interior', focal: { x: 50, y: 50 }, alt: 'A sauna interior panelled in warm timber, with stepped benches and a heater, lit by wall lights.' },
  'ember-interior': { photo: 'ember-interior', focal: { x: 50, y: 58 }, alt: 'A large sauna with wide stepped benches along timber walls, two small windows and a stone-clad heater.' },
  'rowan-detail': { photo: 'rowan-detail', focal: { x: 50, y: 50 }, alt: 'Close-up of vertical larch boards with a knot in the grain.' },
  'alder-detail': { photo: 'alder-detail', focal: { x: 50, y: 40 }, alt: 'Looking out through a tall triangular glazed gable of a timber-lined cabin towards a lake.' },
  'ember-detail': { photo: 'ember-detail', focal: { x: 50, y: 45 }, alt: 'A modern black heater topped with grey sauna stones.' },
  'detail-timber': { photo: 'detail-timber', focal: { x: 62, y: 50 }, alt: 'Weathered timber cladding on a wall with a small window, in low sunlight.' },
  'detail-interior-finish': { photo: 'detail-interior-finish', focal: { x: 55, y: 50 }, alt: 'Smooth timber wall panelling and a bench inside a sauna.' },
  'detail-construction': { photo: 'detail-construction', focal: { x: 50, y: 50 }, alt: 'Two walls of horizontal timber cladding meeting at an outside corner.' },
  'detail-glazing-heater': { photo: 'detail-glazing-heater', focal: { x: 50, y: 50 }, alt: 'Inside a barrel sauna: benches, a heater and an arched window looking out to trees.' },
  'site-access': { photo: 'site-access', focal: { x: 50, y: 64 }, alt: 'A weathered timber gate at the top of stone garden steps between old walls.' },
  'installation-process': { photo: 'installation-process', focal: { x: 50, y: 55 }, alt: 'A small red timber cabin on a twin-axle trailer, parked on a lawn.' },
};

function withStock(a: Asset): Asset {
  const st = STOCK[a.id];
  if (!st) return a;
  const ph = previewPhotos[st.photo];
  const widths = [...ph.widths].sort((x, y) => x - y);
  return {
    ...a,
    kind: 'stock-preview',
    // a stock photograph is atmosphere at best: never evidence of a Rowan, Alder, Ember or a completed project
    evidence: 'atmosphere',
    src: `${ph.file}-${widths[widths.length - 1]}.webp`,
    srcset: widths.map((w) => `${ph.file}-${w}.webp ${w}w`).join(', '),
    thumb: `${ph.file}-${widths[0]}.webp`,
    width: ph.width,
    height: ph.height,
    credit: ph.credit,
    alt: st.alt,
    focal: st.focal,
    ...(st.mobileFocal ? { mobileFocal: st.mobileFocal } : {}),
    rights: `${ph.credit.license}, ${ph.credit.author} (via Wikimedia Commons)`,
    approval: 'working',
  };
}

export const assets: Asset[] = baseAssets.map(withStock);

const byId = new Map(assets.map((a) => [a.id, a]));

const MODEL_NAMES: Record<ProductId, string> = { rowan: 'The Rowan', alder: 'The Alder', ember: 'The Ember' };

/** The visible label a stock preview must carry; null for real photos and placeholders (which label themselves). */
export function previewTag(a: Asset): string | null {
  if (a.kind !== 'stock-preview') return null;
  return a.modelId ? `Stock preview · not ${MODEL_NAMES[a.modelId]}` : 'Stock preview photo';
}

export function getAsset(id: string): Asset | undefined {
  return byId.get(id);
}

export function assetsForModel(id: ProductId): Asset[] {
  return assets.filter((a) => a.modelId === id);
}
