import { PDF_DESCRIPTION_LINES, PDF_NAME_LINES } from './catalog-pdf.constants';

// The print stylesheet of the price list. The cover and the conditions are
// page-sized; the pieces flow, and the browser breaks them into pages: a card
// or a row of cards never splits, a band heading never ends a page, and long
// texts are clamped so a card keeps its shape whatever the owner wrote.
// Pages have no printer margin: Chrome leaves margins white, so the margins
// are the table head and foot, which it repeats on every page.
export const CATALOG_PDF_STYLES = `
:root {
  --surface: #F5F8FB; --panel: #FFFFFF; --tint: #EAF1F8; --line: #B9CFE7;
  --azul: #4E6E90; --azul-text: #3B5876; --ink: #151D26; --ink-muted: #5C6C7D; --vino: #8C2F3C;
  --display: 'Italiana', 'Didot', 'Times New Roman', serif;
  --body: 'Karla', 'Segoe UI', sans-serif;
  --script: 'Parisienne', cursive;
}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: var(--surface); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: var(--body); font-weight: 300; color: var(--ink); font-size: 10.5pt; line-height: 1.55; }

.wordmark { font-family: var(--script); font-weight: 400; color: var(--vino); font-size: 46pt; line-height: 1.1; letter-spacing: 0.005em; }

.sheet { width: 210mm; border-collapse: collapse; }
.sheet td { vertical-align: top; }
.sheet thead td { padding: 12mm 16mm 3mm; }
.sheet thead .wordmark { font-size: 26pt; }
.sheet tbody td { padding: 0 16mm; }
.sheet tfoot td { height: 14mm; }

.group-head { display: flex; align-items: baseline; justify-content: space-between; gap: 6mm; padding-top: 6mm; padding-bottom: 2.2mm; border-bottom: 1px solid var(--line); break-after: avoid; break-inside: avoid; }
.group-head h2 { font-family: var(--display); font-weight: 400; font-size: 19pt; line-height: 1.1; }
.group-head .volume { font-weight: 500; font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--azul-text); white-space: nowrap; }

.row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 8mm; padding-top: 4mm; break-inside: avoid; }
.row + .row { padding-top: 5mm; }

.piece { display: flex; flex-direction: column; break-inside: avoid; }
.photo { width: 100%; aspect-ratio: 4 / 3; border-radius: 10px; overflow: hidden; border: 1px solid var(--line); background: var(--panel); }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.piece-head { display: flex; align-items: baseline; justify-content: space-between; gap: 4mm; margin-top: 2.5mm; }
.piece h3 { font-family: var(--display); font-weight: 400; font-size: 15.5pt; line-height: 1.15; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${PDF_NAME_LINES}; overflow: hidden; }
.price { display: inline-flex; align-items: baseline; gap: 1.6mm; white-space: nowrap; flex: none; }
.price .from { font-weight: 500; font-size: 7.5pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--azul-text); }
.price .amount { font-family: var(--display); font-size: 20pt; line-height: 1; }
.price small { font-size: 12pt; margin-right: 1px; }
.piece p { color: var(--ink-muted); font-size: 9.5pt; line-height: 1.5; margin-top: 1.4mm; overflow-wrap: anywhere; }
.piece p.desc { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${PDF_DESCRIPTION_LINES}; overflow: hidden; }
.piece p.size { color: var(--azul-text); font-weight: 500; font-size: 8.5pt; margin-top: 0.8mm; }

.piece--wide { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; align-items: center; padding-top: 5mm; break-inside: avoid; }
.price-block { display: flex; align-items: baseline; gap: 2.5mm; margin-top: 2mm; }
.piece--wide .price .amount { font-size: 26pt; }
.piece--wide .price small { font-size: 15pt; }
.price-unit { color: var(--ink-muted); font-size: 9.5pt; }

.cover { width: 210mm; height: 297mm; overflow: hidden; position: relative; background: var(--surface); break-after: page; }
.cover-bg { position: absolute; inset: 0; width: 210mm; height: 297mm; display: block; }
.cover-brand { position: absolute; left: 18mm; top: 16mm; text-align: left; }
.cover .wordmark { font-size: 40pt; line-height: 1.05; }
.cover-sub { font-weight: 500; font-size: 8pt; letter-spacing: 0.22em; text-transform: uppercase; color: var(--azul-text); margin-top: 1mm; margin-left: 2mm; }
.cover-frame { position: absolute; left: 50%; top: 58mm; transform: translateX(-50%); width: 120mm; }
.cover-photo { width: 100%; aspect-ratio: 4 / 5; border-radius: 12px; overflow: hidden; border: 1px solid var(--line); background: var(--panel); box-shadow: 0 18px 40px -24px rgba(21, 29, 38, 0.45); }
.cover-photo img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; display: block; }
.cover-title { position: absolute; left: 18mm; top: 226mm; font-family: var(--display); font-weight: 400; font-size: 44pt; line-height: 1; letter-spacing: 0.04em; color: #FFFFFF; }
.cover-lead { position: absolute; left: 18mm; top: 248mm; width: 130mm; font-size: 10.5pt; line-height: 1.55; color: #ECF2F8; }
.cover-tag { position: absolute; right: 18mm; bottom: 14mm; font-weight: 500; font-size: 8pt; letter-spacing: 0.22em; text-transform: uppercase; color: #D7E3EF; }

.page-conditions { break-before: page; height: 296mm; padding: 12mm 16mm 14mm; display: flex; flex-direction: column; }
.page-conditions .brand { display: flex; align-items: baseline; justify-content: space-between; }
.page-conditions .brand .wordmark { font-size: 26pt; }
.order-wrap { margin-top: auto; padding-top: 6mm; }
.order { background: var(--tint); border-radius: 8px; padding: 6mm 8mm; }
.order-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8mm; }
.order h2 { font-family: var(--display); font-weight: 400; font-size: 18pt; line-height: 1.15; }
.order .number { font-family: var(--display); font-size: 20pt; line-height: 1.1; letter-spacing: 0.02em; }
.order p { color: var(--ink-muted); font-size: 9.5pt; line-height: 1.55; margin-top: 1.5mm; max-width: 62ch; }

.conditions { margin-top: 9mm; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 9mm; align-items: start; }
.condition-title { display: flex; align-items: center; gap: 2.5mm; font-family: var(--body); font-weight: 500; font-size: 8.5pt; letter-spacing: 0.22em; text-transform: uppercase; color: var(--azul-text); }
.condition-icon { width: 6mm; height: 6mm; flex: none; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.condition-list { list-style: none; margin-top: 4mm; border-top: 1px solid var(--line); }
.condition-list li { padding: 3.5mm 0; border-bottom: 1px solid var(--line); color: var(--ink-muted); font-size: 10pt; line-height: 1.55; }
`;
