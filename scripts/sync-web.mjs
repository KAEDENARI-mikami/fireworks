import { mkdirSync, copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'web');

mkdirSync(outDir, { recursive: true });
for(const file of ['index.html','manifest.webmanifest','sw.js','icon.svg','fireworks.config.js','privacy-policy.html','app-ads.txt','ads.txt']){
  const src = resolve(root, file);
  const out = resolve(outDir, file);
  if(!existsSync(src)) continue;
  copyFileSync(src, out);
  console.log(`synced ${src} -> ${out}`);
}

const rewardedAndroidId = process.env.FIREWORKS_ADMOB_REWARDED_ANDROID_ID || '';
const rewardedIosId = process.env.FIREWORKS_ADMOB_REWARDED_IOS_ID || '';
const adsenseClient = process.env.FIREWORKS_ADSENSE_CLIENT_ID || '';
const adsTesting = process.env.FIREWORKS_ADS_TESTING;
if(rewardedAndroidId || rewardedIosId || adsenseClient || adsTesting){
  const testing = adsTesting === undefined ? false : !/^(0|false|no)$/i.test(adsTesting);
  const npa = /^(1|true|yes)$/i.test(process.env.FIREWORKS_ADS_NPA || '');
  const allowLocalhost = /^(1|true|yes)$/i.test(process.env.FIREWORKS_ADSENSE_ALLOW_LOCALHOST || '');
  const config = `window.FireworksAdsConfig = ${JSON.stringify({
    rewardedAdId: rewardedAndroidId || null,
    rewardedAdIds: {
      android: rewardedAndroidId || null,
      ios: rewardedIosId || null
    },
    testing,
    npa
  }, null, 2)};\n\nwindow.FireworksWebAdsConfig = ${JSON.stringify({
    adsenseClient: adsenseClient || null,
    autoAds: !!adsenseClient,
    webOnly: true,
    allowLocalhost
  }, null, 2)};\n`;
  writeFileSync(resolve(outDir, 'fireworks.config.js'), config);
  console.log('generated web/fireworks.config.js from environment');
}
