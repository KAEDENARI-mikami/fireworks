import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const publisherId = process.env.FIREWORKS_ADMOB_PUBLISHER_ID || '';
if(!/^pub-\d{16}$/.test(publisherId)){
  console.error('FIREWORKS_ADMOB_PUBLISHER_ID must look like pub-0000000000000000.');
  process.exit(1);
}

const root = resolve(import.meta.dirname, '..');
const line = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;
writeFileSync(resolve(root, 'app-ads.txt'), line);
console.log('wrote app-ads.txt');
