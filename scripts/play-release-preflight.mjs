import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const TEST_PUBLISHER = 'ca-app-pub-3940256099942544';

function env(name){
  return process.env[name] || '';
}

function fail(list, message){
  list.push(message);
}

function looksLikeAdMobAppId(value){
  return /^ca-app-pub-\d{16}~\d{10}$/.test(value);
}

function looksLikeRewardedId(value){
  return /^ca-app-pub-\d{16}\/\d{10}$/.test(value);
}

const errors = [];
const warnings = [];

const appId = env('FIREWORKS_ADMOB_APP_ID');
const rewardedAndroidId = env('FIREWORKS_ADMOB_REWARDED_ANDROID_ID');
const storeFile = env('FIREWORKS_RELEASE_STORE_FILE');
const versionCode = Number(env('FIREWORKS_VERSION_CODE') || '0');
const versionName = env('FIREWORKS_VERSION_NAME');

if(!looksLikeAdMobAppId(appId)) fail(errors, 'FIREWORKS_ADMOB_APP_ID must be a production AdMob app ID like ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy.');
if(appId.startsWith(TEST_PUBLISHER)) fail(errors, 'FIREWORKS_ADMOB_APP_ID is still using Google test publisher ID.');
if(!looksLikeRewardedId(rewardedAndroidId)) fail(errors, 'FIREWORKS_ADMOB_REWARDED_ANDROID_ID must be a rewarded ad unit ID like ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy.');
if(rewardedAndroidId.startsWith(TEST_PUBLISHER)) fail(errors, 'FIREWORKS_ADMOB_REWARDED_ANDROID_ID is still using Google test publisher ID.');

for(const name of ['FIREWORKS_RELEASE_STORE_FILE','FIREWORKS_RELEASE_STORE_PASSWORD','FIREWORKS_RELEASE_KEY_ALIAS','FIREWORKS_RELEASE_KEY_PASSWORD']){
  if(!env(name)) fail(errors, `${name} is required for a Play upload AAB.`);
}
if(storeFile && !existsSync(storeFile)) fail(errors, `FIREWORKS_RELEASE_STORE_FILE does not exist: ${storeFile}`);
if(!Number.isInteger(versionCode) || versionCode < 1) fail(errors, 'FIREWORKS_VERSION_CODE must be a positive integer.');
if(!versionName) fail(errors, 'FIREWORKS_VERSION_NAME is required.');
if(!existsSync(resolve(root, 'privacy-policy.html'))) fail(errors, 'privacy-policy.html is required for the Play listing privacy policy URL.');

const config = readFileSync(resolve(root, 'capacitor.config.json'), 'utf8');
if(!config.includes('"appId": "com.mikamiatsushiya.fireworks"')) fail(warnings, 'Capacitor appId has changed; confirm this is intentional before first Play upload.');

if(warnings.length){
  console.warn('Play release preflight warnings:');
  for(const warning of warnings) console.warn(`- ${warning}`);
}
if(errors.length){
  console.error('Play release preflight failed:');
  for(const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Play release preflight passed.');
