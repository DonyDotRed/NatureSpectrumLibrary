#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

const file = process.argv[2] || 'site/assets/data/library.enc.json';
const password = process.env.NSL_PASSWORD;
if (!password) { console.error('Set NSL_PASSWORD first.'); process.exit(2); }
const p=JSON.parse(fs.readFileSync(file,'utf8'));
const salt=Buffer.from(p.salt,'base64'), iv=Buffer.from(p.iv,'base64'), all=Buffer.from(p.ciphertext,'base64');
const body=all.subarray(0,all.length-16), tag=all.subarray(all.length-16);
const key=crypto.pbkdf2Sync(Buffer.from(password),salt,p.iterations,32,'sha256');
const d=crypto.createDecipheriv('aes-256-gcm',key,iv); d.setAuthTag(tag);
const obj=JSON.parse(Buffer.concat([d.update(body),d.final()]).toString('utf8'));
const master=(obj.sheets['01_에너지지도_MASTER']?.values||[]).slice(3).filter(r=>typeof r?.[0]==='number');
console.log(JSON.stringify({sheets:Object.keys(obj.sheets||{}).length, masterLines:master.length, minEnergy:master[0]?.[0], maxEnergy:master.at(-1)?.[0]}, null, 2));
