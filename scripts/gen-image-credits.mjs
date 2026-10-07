// Generates docs/image-credits.md from the asset manifest.   npm run manifest
import { writeFileSync } from 'node:fs';
const { assets } = await import('../src/content/assets.ts');
const stock = assets.filter((a) => a.kind === 'stock-preview');
const rows = stock.map((a) => `| ${a.label} | [${a.credit.title.replace(/\.jpe?g$/i, '')}](${a.credit.sourceUrl}) | ${a.credit.author} | ${a.credit.licenseUrl ? `[${a.credit.license}](${a.credit.licenseUrl})` : a.credit.license} | ${a.credit.adapted} |`);
const md = `# Image credits

Generated from \`src/content/assets.ts\` by \`npm run manifest\`. Do not edit by hand.

The preview site uses openly licensed stock photographs from [Wikimedia Commons](https://commons.wikimedia.org/) in place of Alder & Ember's own photography, which has not been supplied. They are **not** photographs of Alder & Ember's saunas, projects or customers. Each is labelled on the page, and the live site lists them at \`/image-credits\`.

Licences: **CC0** needs no credit; **CC BY** requires credit; **CC BY-SA** requires credit and that adapted copies are shared under the same licence (resizing, cropping and format conversion count as adaptation, so those copies are BY-SA too). Remove or replace an image to be free of its terms.

| Used for | Photograph | Author | Licence | Changes made |
|---|---|---|---|---|
${rows.join('\n')}

## Selection notes

- Photographs were chosen by eye from Commons categories for sauna buildings, interiors, stoves, garden gates and timber cladding.
- A candidate hero photograph turned out to show a competitor's product (OKOPOD) and was excluded, together with two other photographs from the same series. Competitor imagery is not used.
- Photographs of people were avoided. Images showing visible brand marks were avoided where possible.
- None of these may be used as evidence of a Rowan, Alder, Ember or a completed installation.
`;
writeFileSync(new URL('../docs/image-credits.md', import.meta.url), md);
console.log('wrote docs/image-credits.md (' + stock.length + ' credits)');
