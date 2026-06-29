import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'web');

mkdirSync(outDir, { recursive: true });
for(const file of ['index.html','manifest.webmanifest','sw.js','icon.svg','fireworks.config.js']){
  const src = resolve(root, file);
  const out = resolve(outDir, file);
  if(!existsSync(src)) continue;
  copyFileSync(src, out);
  console.log(`synced ${src} -> ${out}`);
}
