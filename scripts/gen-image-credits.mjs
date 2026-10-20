// Generates docs/image-credits.md from the asset manifest.   npm run manifest
import { writeFileSync } from 'node:fs';
const { assets } = await import('../src/content/assets.ts');
const stock = assets.filter((a) => a.kind === 'stock-preview');
const supplied = assets.filter((a) => a.kind === 'supplied-preview');
const rows = stock.map((a) => `| ${a.label} | [${a.credit.title.replace(/\.jpe?g$/i, '')}](${a.credit.sourceUrl}) | ${a.credit.author} | ${a.credit.licenseUrl ? `[${a.credit.license}](${a.credit.licenseUrl})` : a.credit.license} | ${a.credit.adapted} |`);
const md = `# Image credits

Generated from \`src/content/assets.ts\` by \`npm run manifest\`. Do not edit by hand.

Apart from the supplied image described below, the preview site uses openly licensed stock photographs from [Wikimedia Commons](https://commons.wikimedia.org/) in place of Alder & Ember's own photography, which has not been supplied. They are **not** photographs of Alder & Ember's saunas, projects or customers. Each is labelled on the page, and the live site lists them at \`/image-credits\`.

Licences: **CC0** needs no credit; **CC BY** requires credit; **CC BY-SA** requires credit and that adapted copies are shared under the same licence (resizing, cropping and format conversion count as adaptation, so those copies are BY-SA too). Remove or replace an image to be free of its terms.

| Used for | Photograph | Author | Licence | Changes made |
|---|---|---|---|---|
${rows.join('\n')}

## Supplied image awaiting approval

${supplied.length ? supplied.map((a) => `- ${a.label} (\`${a.id}\`)`).join('\n') + '\n\nOne image was supplied for review (`scripts/images/sources/hero-supplied.webp`, 1884 × 835). Its source, licence and what it shows (a photograph of a real sauna, a render, or a reference) have **not** been confirmed, so it carries no credit, is labelled "Preview image · awaiting approval", is atmosphere only, and stays a launch blocker. To approve it: record who made it, the rights, and whether it shows an Alder & Ember product; then set its asset record to `photo` with `approved`.' : 'None.'}

## Selection notes

- Photographs were chosen by eye from Wikimedia Commons categories and searches for sauna buildings, interiors, stoves, garden gates and timber cladding. Where a slot needed a particular composition the photograph is cropped at export, not by CSS. \`npm run images\` rebuilds them from \`scripts/images/preview-photos.manifest.json\`.
- A candidate hero photograph turned out to show a competitor's product (OKOPOD) and was excluded, together with two other photographs from the same series. Competitor imagery is not used.
- Photographs whose subject is a person were avoided (one exterior shows someone seated outside the cabin, incidentally). Images showing visible brand marks were avoided where possible.
- None of these may be used as evidence of a Rowan, Alder, Ember or a completed installation.
`;
writeFileSync(new URL('../docs/image-credits.md', import.meta.url), md);
console.log('wrote docs/image-credits.md (' + stock.length + ' credits)');
