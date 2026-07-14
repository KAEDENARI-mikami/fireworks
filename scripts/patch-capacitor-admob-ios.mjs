import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = resolve(
  'node_modules/@capacitor-community/admob/ios/Sources/AdMobPlugin/Consent/ConsentExecutor.swift'
);

if(!existsSync(file)){
  console.log('AdMob iOS source not installed; compatibility patch skipped.');
  process.exit(0);
}

const source = readFileSync(file, 'utf8');
const replacements = new Map([
  ['UMPRequestParameters', 'RequestParameters'],
  ['UMPDebugSettings', 'DebugSettings'],
  ['UMPDebugGeography', 'DebugGeography'],
  ['parameters.tagForUnderAgeOfConsent', 'parameters.isTaggedForUnderAgeOfConsent'],
  ['UMPConsentInformation.sharedInstance', 'ConsentInformation.shared'],
  ['UMPFormStatus', 'FormStatus'],
  ['UMPConsentForm.load(completionHandler:', 'ConsentForm.load(with:'],
  ['UMPConsentStatus', 'ConsentStatus'],
]);

let patched = source;
for(const [oldName, newName] of replacements){
  patched = patched.replaceAll(oldName, newName);
}

if(patched !== source){
  writeFileSync(file, patched);
  console.log('Applied the Xcode 26 AdMob consent type compatibility patch.');
}else if(source.includes('ConsentInformation.shared') && source.includes('ConsentStatus')){
  console.log('AdMob iOS consent types are already compatible with Xcode 26.');
}else{
  throw new Error('AdMob consent source changed; review the compatibility patch.');
}
