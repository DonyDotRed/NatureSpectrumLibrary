#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

const [,, inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: NSL_PASSWORD="..." node tools/encrypt_dataset.mjs input.json output.enc.json');
  process.exit(1);
}
const password = process.env.NSL_PASSWORD;
if (!password) {
  console.error('NSL_PASSWORD environment variable is required.');
  process.exit(1);
}

const iterations = 310000;
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(Buffer.from(password, 'utf8'), salt, iterations, 32, 'sha256');
const plaintext = fs.readFileSync(inputPath);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const tag = cipher.getAuthTag();
// WebCrypto AES-GCM expects ciphertext || tag.
const payload = Buffer.concat([encrypted, tag]);
const result = {
  version: 1,
  algorithm: 'AES-256-GCM',
  kdf: 'PBKDF2-HMAC-SHA-256',
  iterations,
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  ciphertext: payload.toString('base64'),
  createdAt: new Date().toISOString()
};
fs.mkdirSync(new URL('.', `file://${outputPath}`).pathname, {recursive:true});
fs.writeFileSync(outputPath, JSON.stringify(result));
console.log(`Encrypted ${plaintext.length} bytes -> ${outputPath}`);
