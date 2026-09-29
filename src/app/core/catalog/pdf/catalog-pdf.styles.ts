import { PDF_DESCRIPTION_LINES, PDF_NAME_LINES } from './catalog-pdf.constants';

// The print stylesheet of the price list, in the brand's dress: the cover is its
// business card (the Azul Cristal water, sunflowers down the edge, the white
// logo), the inner pages are white paper with round price labels, and the order
// box closes on the same water. The colours are the site's tokens written out
// (src/styles/tokens.css), because the printer has no stylesheet of ours.
// The cover and the conditions are page-sized; the pieces flow, and the
// browser breaks them into pages: a card or a row of cards never splits, a band
// heading never ends a page, and long texts are clamped so a card keeps its
// shape whatever the owner wrote. Pages have no printer margin: Chrome leaves
// margins white, so the margins are the table head and foot, which it repeats
// on every page.
export const CATALOG_PDF_STYLES = `
:root {
  --paper: #FFFFFF; --tint: #ECFAFB; --tint-line: #AFEBEE;
  --crystal: #008AFF; --crystal-text: #005AAA; --mango: #FFCA00; --coral: #FF9001;
  --ink: #0E223A; --ink-muted: #445D7A; --navy: #071729; --white: #FFFFFF;
  --body: 'Lato', 'Segoe UI', sans-serif;
  --script: 'Great Vibes', cursive;
}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: var(--paper); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: var(--body); font-weight: 400; color: var(--ink); font-size: 10pt; line-height: 1.5; }
.sprite { position: absolute; width: 0; height: 0; overflow: hidden; }
svg { display: block; }

.water { position: absolute; inset: 0; overflow: hidden; }
.water svg { position: absolute; inset: 0; width: 100%; height: 100%; fill: var(--white); }
.water-light { opacity: 0.14; }
.water-glint { opacity: 0.3; }
.daisy { width: 100%; height: auto; aspect-ratio: 360 / 387; }

.cover { width: 210mm; height: 297mm; overflow: hidden; position: relative; background: var(--crystal); color: var(--navy); break-after: page; }
.cover-daisies { position: absolute; left: -16mm; top: -6mm; bottom: -6mm; width: 52mm; }
.cover-daisies .daisy { position: absolute; }
.cover-daisies .daisy:nth-child(1) { top: 0; left: 6mm; width: 36mm; rotate: 12deg; }
.cover-daisies .daisy:nth-child(2) { top: 36mm; left: 24mm; width: 28mm; rotate: -20deg; }
.cover-daisies .daisy:nth-child(3) { top: 64mm; left: 0; width: 38mm; rotate: 26deg; }
.cover-daisies .daisy:nth-child(4) { top: 108mm; left: 22mm; width: 26mm; rotate: -6deg; }
.cover-daisies .daisy:nth-child(5) { top: 134mm; left: 2mm; width: 34mm; rotate: 16deg; }
.cover-daisies .daisy:nth-child(6) { top: 178mm; left: 20mm; width: 30mm; rotate: -18deg; }
.cover-daisies .daisy:nth-child(7) { top: 210mm; left: -2mm; width: 36mm; rotate: 8deg; }
.cover-brand { position: absolute; left: 50mm; right: 16mm; top: 22mm; }
.cover-logo { width: 128mm; height: auto; aspect-ratio: 1200 / 420; fill: var(--white); }
.cover-tagline { margin-top: 5mm; font-weight: 900; font-size: 15pt; line-height: 1.2; }
.cover-lid { position: absolute; left: 62mm; top: 98mm; width: 116mm; }
.lid { width: 116mm; height: 116mm; border-radius: 50%; overflow: hidden; border: 3.5mm solid var(--white); background: var(--tint); box-shadow: 0 16px 36px -18px rgba(0, 40, 100, 0.55); }
.lid img { width: 100%; height: 100%; object-fit: cover; display: block; }
.seal { position: absolute; left: -8mm; bottom: -6mm; width: 40mm; height: 40mm; rotate: -12deg; }
.seal-disc { fill: var(--mango); }
.seal-text { fill: var(--navy); font-family: var(--body); font-weight: 700; font-size: 17px; }
.seal-mark { fill: var(--navy); }
.cover-foot { position: absolute; left: 50mm; right: 16mm; bottom: 16mm; display: flex; align-items: flex-end; justify-content: space-between; gap: 8mm; }
.cover-title { font-family: var(--script); font-weight: 400; font-size: 62pt; line-height: 1; -webkit-text-stroke: 0.014em currentColor; paint-order: stroke fill; }
.cover-sub { margin-top: 2mm; font-weight: 700; font-size: 11.5pt; }
.cover-tag { flex: none; padding: 2.2mm 5mm; border-radius: 99px; background: var(--white); font-weight: 700; font-size: 9.5pt; color: var(--navy); }

.page-head { display: flex; align-items: center; justify-content: space-between; gap: 6mm; padding-bottom: 3mm; border-bottom: 0.6mm solid var(--tint-line); }
.page-logo { width: 34mm; height: auto; aspect-ratio: 1200 / 420; fill: var(--crystal); }
.page-order { display: flex; align-items: baseline; gap: 2.5mm; font-weight: 700; font-size: 9pt; color: var(--crystal-text); }
.page-order strong { color: var(--ink); font-weight: 900; font-size: 11pt; }

.sheet { width: 210mm; border-collapse: collapse; }
.sheet td { vertical-align: top; }
.sheet thead td { padding: 11mm 16mm 2mm; }
.sheet tbody td { padding: 0 16mm; }
.sheet tfoot td { height: 14mm; }

.group-head { display: flex; align-items: center; gap: 3mm; padding-top: 7mm; padding-bottom: 1mm; break-after: avoid; break-inside: avoid; }
.group-daisy { width: 7mm; height: auto; aspect-ratio: 360 / 387; flex: none; }
.group-head h2 { font-weight: 900; font-size: 17pt; line-height: 1.1; }
.group-head .volume { margin-left: auto; padding: 1.4mm 3.6mm; border-radius: 99px; background: var(--tint); font-weight: 700; font-size: 8.5pt; color: var(--crystal-text); white-space: nowrap; }

.row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 9mm; padding-top: 5mm; break-inside: avoid; }
.row + .row { padding-top: 7mm; }

.piece { display: flex; flex-direction: column; break-inside: avoid; }
.photo-wrap { position: relative; }
.photo { width: 100%; aspect-ratio: 4 / 3; border-radius: 5mm; overflow: hidden; background: var(--tint); }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sticker { position: absolute; top: -3mm; right: -3mm; width: 21mm; height: 21mm; border-radius: 50%; background: var(--mango); color: var(--navy); rotate: -8deg; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; box-shadow: 0 6px 14px -8px rgba(0, 40, 100, 0.6); }
.sticker .from { font-weight: 700; font-size: 7pt; line-height: 1; }
.sticker .amount { font-weight: 900; font-size: 15pt; line-height: 1.05; }
.sticker small { font-size: 9.5pt; margin-right: 0.3mm; }
.sticker .each { font-weight: 700; font-size: 6.5pt; line-height: 1; }
.piece h3 { margin-top: 3.5mm; font-weight: 900; font-size: 13.5pt; line-height: 1.15; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${PDF_NAME_LINES}; overflow: hidden; }
.piece p { color: var(--ink-muted); font-size: 9.5pt; line-height: 1.5; margin-top: 1.4mm; overflow-wrap: anywhere; }
.piece p.desc { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${PDF_DESCRIPTION_LINES}; overflow: hidden; }
.piece p.size { color: var(--crystal-text); font-weight: 700; font-size: 8.5pt; margin-top: 1mm; }

.piece--wide { display: grid; grid-template-columns: 1fr 1fr; gap: 9mm; align-items: center; padding-top: 6mm; break-inside: avoid; }
.piece--wide h3 { margin-top: 0; font-size: 16pt; }
.piece--wide .sticker { width: 24mm; height: 24mm; }

.page-conditions { break-before: page; position: relative; height: 296mm; padding: 11mm 16mm 14mm; display: flex; flex-direction: column; }
.conditions-title { margin-top: 10mm; font-family: var(--script); font-weight: 400; font-size: 46pt; line-height: 1.05; color: var(--ink); -webkit-text-stroke: 0.014em currentColor; paint-order: stroke fill; }
.conditions { margin-top: 8mm; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5mm; align-items: start; }
.condition-group { background: var(--tint); border-radius: 5mm; padding: 6mm 5.5mm; }
.condition-title { display: flex; align-items: center; gap: 3mm; font-weight: 900; font-size: 11.5pt; line-height: 1.2; }
.condition-badge { width: 10mm; height: 10mm; flex: none; border-radius: 50%; background: var(--white); color: var(--crystal-text); display: flex; align-items: center; justify-content: center; }
.condition-icon { width: 5.5mm; height: 5.5mm; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.condition-list { list-style: none; margin-top: 5mm; display: flex; flex-direction: column; gap: 3mm; }
.condition-list li { position: relative; padding-left: 4mm; color: var(--ink-muted); font-size: 9.5pt; line-height: 1.5; }
.condition-list li::before { content: ''; position: absolute; left: 0; top: 2.2mm; width: 1.6mm; height: 1.6mm; border-radius: 50%; background: var(--coral); }

.order { position: relative; overflow: hidden; margin-top: auto; border-radius: 7mm; background: var(--crystal); color: var(--navy); padding: 9mm 10mm; display: flex; align-items: center; gap: 8mm; min-height: 58mm; }
.order-daisies { position: absolute; right: -6mm; top: -8mm; bottom: -8mm; width: 44mm; }
.order-daisies .daisy { position: absolute; }
.order-daisies .daisy:nth-child(1) { top: 0; right: 4mm; width: 30mm; rotate: 14deg; }
.order-daisies .daisy:nth-child(2) { top: 26mm; right: 22mm; width: 22mm; rotate: -16deg; }
.order-daisies .daisy:nth-child(3) { top: 42mm; right: -2mm; width: 30mm; rotate: 24deg; }
.order-mark { position: relative; width: 30mm; height: auto; aspect-ratio: 600 / 464; flex: none; fill: var(--white); }
.order-text { position: relative; max-width: 90mm; }
.order h2 { font-weight: 900; font-size: 17pt; line-height: 1.15; }
.order .number { margin-top: 1mm; font-weight: 900; font-size: 26pt; line-height: 1.1; letter-spacing: 0.01em; }
.order p { font-size: 10pt; line-height: 1.5; margin-top: 2.5mm; font-weight: 700; }
`;
