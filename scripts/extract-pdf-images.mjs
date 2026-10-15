// Extract embedded images (JPEG via DCTDecode, PNG) from PDFs by scanning raw bytes.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const inputs = ['Assets/Kalye Noir.pdf', 'Assets/Digital Marketing.pdf'];
const outDir = 'public/assets/images/products';
mkdirSync(outDir, { recursive: true });

function carveJPEGs(buf) {
	const imgs = [];
	let i = 0;
	while (i < buf.length - 3) {
		if (buf[i] === 0xff && buf[i + 1] === 0xd8 && buf[i + 2] === 0xff) {
			// find EOI marker
			let j = i + 3;
			while (j < buf.length - 1) {
				if (buf[j] === 0xff && buf[j + 1] === 0xd9) {
					j += 2;
					break;
				}
				j++;
			}
			imgs.push(buf.subarray(i, j));
			i = j;
		} else {
			i++;
		}
	}
	return imgs;
}

function carvePNGs(buf) {
	const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const imgs = [];
	for (let i = 0; i < buf.length - 8; i++) {
		if (buf.compare(sig, 0, 8, i, i + 8) === 0) {
			// find IEND
			const end = buf.indexOf('IEND', i);
			if (end !== -1) {
				imgs.push(buf.subarray(i, end + 8));
				i = end + 8 - 1;
			}
		}
	}
	return imgs;
}

for (const file of inputs) {
	const buf = readFileSync(file);
	const tag = basename(file, '.pdf').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
	const jpegs = carveJPEGs(buf);
	const pngs = carvePNGs(buf);
	console.log(`${file}: ${jpegs.length} JPEG, ${pngs.length} PNG streams found`);

	// Deduplicate by content hash and drop tiny thumbnails/icons (<8KB)
	const seen = new Map();
	let saved = 0;
	for (const [kind, arr] of [['jpg', jpegs], ['png', pngs]]) {
		for (const img of arr) {
			if (img.length < 8192) continue;
			const key = img.length + ':' + img.subarray(0, 64).toString('hex');
			const count = seen.get(key) ?? 0;
			seen.set(key, count + 1);
			if (count > 0) continue; // duplicate
			saved++;
			const name = join(outDir, `${tag}-${String(saved).padStart(2, '0')}.${kind}`);
			writeFileSync(name, img);
		}
	}
	console.log(`  -> saved ${saved} unique images (>=8KB) to ${outDir}`);
}

console.log('mk', outDir, 'done');
