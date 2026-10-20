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
 *
 * kind 'supplied-preview' = an image handed over for review whose origin and rights are not yet confirmed
 * (it may be a photograph, a render or a reference). It is labelled "awaiting approval", is atmosphere only,
 * and stays a launch blocker until its source, licence and what it shows are recorded and it is approved:
 * only then does it become kind 'photo'.
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
  | 'closing'
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
  kind: 'placeholder' | 'stock-preview' | 'supplied-preview' | 'photo';
  evidence: 'atmosphere' | 'product-evidence' | 'project-evidence';
  intendedUse: string;
  src?: string;
  /** responsive candidates, e.g. "/images/x-640.webp 640w, /images/x-1280.webp 1280w" */
  srcset?: string;
  /** AVIF candidates for the same widths; the browser prefers these when it can decode them */
  srcsetAvif?: string;
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
    ratio: '21:9',
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
    ratio: '1:1',
    alt: 'An outdoor sauna cabin in a UK garden, cropped to keep the cabin and its door in frame.',
    intendedCrop: 'Square or portrait crop preserving the whole cabin, door and ground plane, with the top quarter quiet for the header and the bottom third dark enough to fade into the text panel.',
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
  ph({
    id: 'closing-warmth',
    role: 'closing',
    label: 'Closing: a warm interior or an evening garden',
    ratio: '4:3',
    alt: 'A warmly lit sauna interior, the benches and timber glowing in low light.',
    intendedCrop: 'A warm interior or evening garden composition. Approved photography only; never a staged installation claim.',
    intendedUse: 'Homepage closing',
    tone: 'dusk',
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
  'rowan-exterior': { photo: 'rowan-exterior', focal: { x: 50, y: 52 }, alt: 'A compact, weathered log sauna with a white-framed window and a metal chimney, standing among birch and spruce trees.' },
  'alder-exterior': { photo: 'alder-exterior', focal: { x: 48, y: 58 }, alt: 'A dark timber cabin with a steep gable and a large glazed front, at the edge of a grassy clearing among pine trees.' },
  'ember-exterior': { photo: 'ember-exterior', focal: { x: 72, y: 55 }, alt: 'A larger octagonal timber cabin lit warmly from inside at dusk, on a lawn beside a wooden hot tub.' },
  'rowan-interior': { photo: 'rowan-interior', focal: { x: 50, y: 55 }, alt: 'Inside a small sauna: a long bench along a pine-panelled wall and a stainless heater in the corner.' },
  'alder-interior': { photo: 'alder-interior', focal: { x: 50, y: 50 }, alt: 'A sauna interior panelled in warm timber, with stepped benches and a heater, lit by wall lights.' },
  'ember-interior': { photo: 'ember-interior', focal: { x: 50, y: 58 }, alt: 'A large sauna with wide stepped benches along timber walls, two small windows and a stone-clad heater.' },
  'rowan-detail': { photo: 'rowan-detail', focal: { x: 50, y: 50 }, alt: 'Close-up of vertical larch boards with a knot in the grain.' },
  'alder-detail': { photo: 'alder-detail', focal: { x: 50, y: 40 }, alt: 'Looking out through a tall triangular glazed gable of a timber-lined cabin towards a lake.' },
  'ember-detail': { photo: 'ember-detail', focal: { x: 50, y: 45 }, alt: 'A modern black heater topped with grey sauna stones.' },
  'detail-timber': { photo: 'detail-timber', focal: { x: 62, y: 50 }, alt: 'Weathered timber cladding on a wall with a small window, in low sunlight.' },
  'detail-interior-finish': { photo: 'detail-interior-finish', focal: { x: 50, y: 50 }, alt: 'Close-up of a smooth timber bench against the pine-panelled wall of a sauna.' },
  'detail-construction': { photo: 'detail-construction', focal: { x: 50, y: 50 }, alt: 'Two walls of horizontal timber cladding meeting at an outside corner.' },
  'detail-glazing-heater': { photo: 'detail-glazing-heater', focal: { x: 50, y: 50 }, alt: 'Inside a barrel sauna: benches, a heater and an arched window looking out to trees.' },
  'site-access': { photo: 'site-access', focal: { x: 50, y: 64 }, alt: 'A weathered timber gate at the top of stone garden steps between old walls.' },
  'closing-warmth': { photo: 'alder-interior', focal: { x: 50, y: 50 }, alt: 'A sauna interior panelled in warm timber, with stepped benches and a heater, lit by wall lights.' },
  'installation-process': { photo: 'installation-process', focal: { x: 50, y: 55 }, alt: 'A small red timber cabin on a twin-axle trailer, parked on a lawn.' },
};

/** Images supplied by the owner. Labelled previews until an approval record travels with the photograph; atmosphere until the model shown is recorded. */
const SUPPLIED: Record<string, Stock> = {
  'hero-wide': {
    photo: 'hero',
    focal: { x: 92, y: 50 },
    mobileFocal: { x: 50, y: 45 },
    alt: 'A dark timber garden sauna with a glazed front, lit warmly from inside at dusk, on gravel at the end of a lawn, with a clipped hedge and silver birch trees behind.',
  },
  'hero-mobile': {
    photo: 'hero-mobile',
    focal: { x: 50, y: 30 },
    alt: 'A dark timber garden sauna with a glazed front, lit warmly from inside at dusk, on gravel at the end of a lawn, with a clipped hedge and silver birch trees behind.',
  },
};

function withPhoto(a: Asset): Asset {
  const supplied = SUPPLIED[a.id];
  const st = supplied ?? STOCK[a.id];
  if (!st) return a;
  const ph = previewPhotos[st.photo];
  const widths = [...ph.widths].sort((x, y) => x - y);
  const common: Asset = {
    ...a,
    // a stock or supplied image is atmosphere at best: never evidence of a Rowan, Alder, Ember or a completed project
    evidence: 'atmosphere',
    src: `${ph.file}-${widths[widths.length - 1]}.webp`,
    srcset: widths.map((w) => `${ph.file}-${w}.webp ${w}w`).join(', '),
    ...(ph.avif ? { srcsetAvif: widths.map((w) => `${ph.file}-${w}.avif ${w}w`).join(', ') } : {}),
    thumb: `${ph.file}-${ph.thumbWidth ?? widths[0]}.webp`,
    width: ph.width,
    height: ph.height,
    alt: st.alt,
    focal: st.focal,
    ...(st.mobileFocal ? { mobileFocal: st.mobileFocal } : {}),
    approval: 'working',
  };
  if (supplied) {
    // once the owner has approved it (the record travels with the photograph), it is their photograph; until then it is a labelled preview.
    // Approval is not product evidence: that also needs the model it shows, so `evidence` stays 'atmosphere'.
    if (ph.approval) return { ...common, kind: 'photo', rights: ph.approval.rights, approval: 'approved' };
    return { ...common, kind: 'supplied-preview', rights: null };
  }
  if (!ph.credit) throw new Error(`Stock photo "${st.photo}" has no credit; a photograph without a licence is a supplied image`);
  return { ...common, kind: 'stock-preview', credit: ph.credit, rights: `${ph.credit.license}, ${ph.credit.author} (via Wikimedia Commons)` };
}

export const assets: Asset[] = baseAssets.map(withPhoto);

const byId = new Map(assets.map((a) => [a.id, a]));

const MODEL_NAMES: Record<ProductId, string> = { rowan: 'The Rowan', alder: 'The Alder', ember: 'The Ember' };

/** The visible label an unapproved image must carry; null for real photos and placeholders (which label themselves). */
export function previewTag(a: Asset): string | null {
  if (a.kind === 'supplied-preview') return 'Preview image · awaiting approval';
  if (a.kind !== 'stock-preview') return null;
  return a.modelId ? `Stock preview · not ${MODEL_NAMES[a.modelId]}` : 'Stock preview photo';
}

export function getAsset(id: string): Asset | undefined {
  return byId.get(id);
}

export function assetsForModel(id: ProductId): Asset[] {
  return assets.filter((a) => a.modelId === id);
}
