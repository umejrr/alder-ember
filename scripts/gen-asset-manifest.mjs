// Generates docs/asset-manifest.md from src/content/assets.ts (so the doc cannot drift from the data).
//   npm run manifest
import { writeFileSync } from 'node:fs';
const { assets } = await import('../src/content/assets.ts');
const rows = assets.map((a) =>
  `| \`${a.id}\` | ${a.role} | ${a.modelId ?? 'any'} | ${a.ratio} | ${a.evidence} | ${a.kind} | ${a.rights ?? 'MISSING'} | ${a.approval} | ${a.focal.x}% ${a.focal.y}% | ${a.intendedUse} |`,
);
const md = `# Photography and asset manifest

Generated from \`src/content/assets.ts\` by \`npm run manifest\`. Do not edit by hand.

**Status today:** no photography has been supplied or commissioned. Every record is a clearly labelled **placeholder** (tonal frame with faint board lines, never a drawn cabin) so the layouts can be reviewed. No generated imagery is used as product or project evidence, and no other supplier's or competitor's image is used for a Rowan, Alder or Ember.

| ID | Role | Model | Ratio | Evidence type | Kind | Rights / credit | Approval | Focal point | Intended use |
|---|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}

## How to replace a placeholder

1. Put the file in \`public/images/\` (or an approved CDN). Prefer AVIF/WebP with a JPEG fallback, with a sensible set of widths.
2. In \`src/content/assets.ts\` set \`src\`, \`width\`, \`height\`, a real \`alt\`, the \`focal\` point (and \`mobileFocal\` if the mobile crop differs), \`rights\`, \`approval: 'approved'\`, and \`kind: 'photo'\`.
3. Rebuild. Nothing else changes: product cards, the model showcase, galleries and the hero all read this manifest.

## Image brief (outstanding)

- **Hero (wide, 16:9):** a believable UK garden with the sauna, planting and approach path visible; directional natural light. Cabin in the right two-thirds with clear space lower-left for the headline. **Never put the headline across the door, heater features or a face.**
- **Hero (mobile, 4:5):** a deliberate crop that keeps the cabin, door and ground plane.
- **Per model (Rowan, Alder, Ember):** one consistent three-quarter exterior (4:3), an interior showing usable benches and scale (4:3), and a detail (3:2). Same angle and crop across the three so they can be compared.
- **Details:** thermally modified exterior timber (portrait), smooth interior timber and bench edge, insulated construction (manufacturer-supplied; no invented thicknesses), glazing and heater with controls (only once the approved heater package is confirmed).
- **Process:** a real site-and-access image (gate, path, steps) and genuine installation photography.
- **Projects:** completed-installation photography only, with written permission for property, people, location and testimonial.
- Avoid heavy orange grading, fake steam and dramatic scenes that hide the product. Warmth should come from real material and light.
`;
writeFileSync(new URL('../docs/asset-manifest.md', import.meta.url), md);
console.log('wrote docs/asset-manifest.md');
