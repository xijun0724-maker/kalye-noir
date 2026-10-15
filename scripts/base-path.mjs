// Build a copy of dist/ that works when served from a subpath (GitHub Pages
// project sites live at /<repo>/). Astro can prefix its own asset URLs, but not
// arbitrary string literals like href="/products", so we patch the output.
//
// Usage:  node scripts/base-path.mjs /kalye-noir      (after `astro build`)
// Output: dist-pages/   (dist/ is left untouched for Netlify / preview)
//
// ponytail: regex over built HTML/JS, run once per build. If this ever needs to
// grow past a handful of rules, move the paths into source with
// import.meta.env.BASE_URL instead.
import { readFileSync, writeFileSync, readdirSync, rmSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = (process.argv[2] || '').replace(/\/+$/, '');
if (!base) {
	console.log('base-path: no base given, nothing to do');
	process.exit(0);
}

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const out = fileURLToPath(new URL('../dist-pages/', import.meta.url));

rmSync(out, { recursive: true, force: true });
cpSync(dist, out, { recursive: true });
writeFileSync(join(out, '.nojekyll'), ''); // stop Pages running Jekyll

const prefix = (s) => s.replace(/="\/(?!\/)/g, `="${base}/`).replace(/url\(\/(?!\/)/g, `url(${base}/`);

let patched = 0;
(function walk(dir) {
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) {
			walk(p);
			continue;
		}
		let next;
		if (p.endsWith('.html')) next = prefix(readFileSync(p, 'utf8'));
		// the empty-cart link is the only root-relative path emitted from JS
		else if (p.endsWith('.js')) next = readFileSync(p, 'utf8').replace(/href="\/products"/g, `href="${base}/products"`);
		else continue;
		writeFileSync(p, next);
		patched++;
	}
})(out);

console.log(`base-path: wrote ${out} with base "${base}/" (${patched} files)`);
