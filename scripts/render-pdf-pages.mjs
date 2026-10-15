// Render each page of the Assets PDFs to PNG using pdfjs + @napi-rs/canvas.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { createCanvas, Path2D } = require('@napi-rs/canvas');
// Polyfills required by pdf.js legacy build in Node
globalThis.Path2D = Path2D;

const pdfjsDir = require
	.resolve('pdfjs-dist/package.json')
	.replace(/\\/g, '/')
	.replace('/package.json', '');

const pdfjsLib = await import(
	pathToFileURL(`${pdfjsDir}/legacy/build/pdf.mjs`).href
);
const { getDocument } = pdfjsLib;

const cMapUrl = pathToFileURL(`${pdfjsDir}/cmaps/`).href;
const standardFontDataUrl = pathToFileURL(`${pdfjsDir}/standard_fonts/`).href;

const inputs = ['Assets/Kalye Noir.pdf', 'Assets/Digital Marketing.pdf'];
const outDir = 'public/assets/images/products';
mkdirSync(outDir, { recursive: true });
// clear old carved images
for (const f of ['kalye-noir-01.jpg', 'digital-marketing-01.jpg']) {
	const p = join(outDir, f);
	if (existsSync(p)) rmSync(p);
}

const SCALE = 2; // 2x for crisp rendering

for (const file of inputs) {
	const data = new Uint8Array(readFileSync(file));    const loadingTask = getDocument({
		data,
		cMapUrl,
		standardFontDataUrl,
	});
	const doc = await loadingTask.promise;

	const tag = basename(file, '.pdf')
		.replace(/[^a-z0-9]+/gi, '-')
		.toLowerCase();

	for (let p = 1; p <= doc.numPages; p++) {
		const page = await doc.getPage(p);
		const viewport = page.getViewport({ scale: SCALE });
		const canvas = createCanvas(
			Math.floor(viewport.width),
			Math.floor(viewport.height)
		);
		const ctx = canvas.getContext('2d');
		await page.render({ canvasContext: ctx, viewport, canvas }).promise;
		const out = join(outDir, `${tag}-page-${String(p).padStart(2, '0')}.png`);
		await sharp(canvas.toBuffer('image/png')).png({ quality: 90 }).toFile(out);
		console.log(`${file} page ${p} -> ${out}`);
		page.cleanup();
	}
	await loadingTask.destroy();
}
console.log('DONE');
