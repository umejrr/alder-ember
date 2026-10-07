# Photography and asset manifest

Generated from `src/content/assets.ts` by `npm run manifest`. Do not edit by hand.

**Status today:** no photography has been supplied or commissioned. Every record is a clearly labelled **placeholder** (tonal frame with faint board lines, never a drawn cabin) so the layouts can be reviewed. No generated imagery is used as product or project evidence, and no other supplier's or competitor's image is used for a Rowan, Alder or Ember.

| ID | Role | Model | Ratio | Evidence type | Kind | Rights / credit | Approval | Focal point | Intended use |
|---|---|---|---|---|---|---|---|---|---|
| `hero-wide` | hero-wide | any | 16:9 | atmosphere | placeholder | MISSING | missing | 65% 55% | Homepage hero (desktop) |
| `hero-mobile` | hero-mobile | any | 4:5 | atmosphere | placeholder | MISSING | missing | 62% 55% | Homepage hero (mobile) |
| `rowan-exterior` | model-exterior | rowan | 4:3 | product-evidence | placeholder | MISSING | missing | 50% 50% | Model showcase, collection card, product gallery (1st image) |
| `rowan-interior` | model-interior | rowan | 4:3 | product-evidence | placeholder | MISSING | missing | 50% 50% | Product gallery (2nd image) |
| `rowan-detail` | model-detail | rowan | 3:2 | product-evidence | placeholder | MISSING | missing | 50% 50% | Product gallery (3rd image) |
| `alder-exterior` | model-exterior | alder | 4:3 | product-evidence | placeholder | MISSING | missing | 50% 50% | Model showcase, collection card, product gallery (1st image) |
| `alder-interior` | model-interior | alder | 4:3 | product-evidence | placeholder | MISSING | missing | 50% 50% | Product gallery (2nd image) |
| `alder-detail` | model-detail | alder | 3:2 | product-evidence | placeholder | MISSING | missing | 50% 50% | Product gallery (3rd image) |
| `ember-exterior` | model-exterior | ember | 4:3 | product-evidence | placeholder | MISSING | missing | 50% 50% | Model showcase, collection card, product gallery (1st image) |
| `ember-interior` | model-interior | ember | 4:3 | product-evidence | placeholder | MISSING | missing | 50% 50% | Product gallery (2nd image) |
| `ember-detail` | model-detail | ember | 3:2 | product-evidence | placeholder | MISSING | missing | 50% 50% | Product gallery (3rd image) |
| `detail-timber` | detail-timber | any | 4:5 | product-evidence | placeholder | MISSING | missing | 50% 50% | Homepage "Considered in every detail" chapter |
| `detail-interior-finish` | detail-interior-finish | any | 3:2 | product-evidence | placeholder | MISSING | missing | 50% 50% | Homepage craft chapter; product page |
| `detail-construction` | detail-construction | any | 4:3 | product-evidence | placeholder | MISSING | missing | 50% 50% | Homepage craft chapter |
| `detail-glazing-heater` | detail-glazing-heater | any | 4:3 | product-evidence | placeholder | MISSING | missing | 50% 50% | Homepage craft chapter; Alder page |
| `site-access` | site-access | any | 3:2 | atmosphere | placeholder | MISSING | missing | 50% 50% | Installation & delivery; homepage process |
| `installation-process` | installation-process | any | 3:2 | project-evidence | placeholder | MISSING | missing | 50% 50% | Installation & delivery; about |

## How to replace a placeholder

1. Put the file in `public/images/` (or an approved CDN). Prefer AVIF/WebP with a JPEG fallback, with a sensible set of widths.
2. In `src/content/assets.ts` set `src`, `width`, `height`, a real `alt`, the `focal` point (and `mobileFocal` if the mobile crop differs), `rights`, `approval: 'approved'`, and `kind: 'photo'`.
3. Rebuild. Nothing else changes: product cards, the model showcase, galleries and the hero all read this manifest.

## Image pipeline (to wire when photos exist)

`Picture.astro` renders a single `src` with focal-point cropping and correct loading priority (the hero is eager and high priority; everything else lazy). Responsive `srcset`, AVIF/WebP generation and explicit intrinsic sizes still need to be wired to Astro's image optimisation once real photographs are in the repository. This is untested because no real images exist yet.

## Image brief (outstanding)

- **Hero (wide, 16:9):** a believable UK garden with the sauna, planting and approach path visible; directional natural light. Cabin in the right two-thirds with clear space lower-left for the headline. **Never put the headline across the door, heater features or a face.**
- **Hero (mobile, 4:5):** a deliberate crop that keeps the cabin, door and ground plane.
- **Per model (Rowan, Alder, Ember):** one consistent three-quarter exterior (4:3), an interior showing usable benches and scale (4:3), and a detail (3:2). Same angle and crop across the three so they can be compared.
- **Details:** thermally modified exterior timber (portrait), smooth interior timber and bench edge, insulated construction (manufacturer-supplied; no invented thicknesses), glazing and heater with controls (only once the approved heater package is confirmed).
- **Process:** a real site-and-access image (gate, path, steps) and genuine installation photography.
- **Projects:** completed-installation photography only, with written permission for property, people, location and testimonial.
- Avoid heavy orange grading, fake steam and dramatic scenes that hide the product. Warmth should come from real material and light.
