#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const htmlFiles = [
  'index.html',
  'privacy-policy.html',
  'cookie-policy.html',
  'termini-condizioni.html',
  'blog/autosufficienza-terza-eta.html',
  'blog/alimentazione-sana-anziani.html',
];

const requiredFooterMarkers = [
  'site-footer',
  'footer-inner',
  'footer-nav',
  'footer-contact-list',
  'footer-social-links',
  'footer-social-btn--facebook',
  'footer-social-btn--whatsapp',
  'footer-bottom',
  'back-to-top',
  'footer-toggle',
];

const requiredAssets = ['style.css', 'script.js'];

function read(filePath) {
  return fs.readFileSync(path.join(root, filePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const errors = [];

for (const file of htmlFiles) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing HTML file: ${file}`);
    continue;
  }

  const content = read(file);
  for (const marker of requiredFooterMarkers) {
    if (!content.includes(marker)) {
      errors.push(`${file}: missing footer marker "${marker}"`);
    }
  }

  if (!content.includes('tel:+393290830072')) {
    errors.push(`${file}: missing phone contact link`);
  }

  if (!content.includes('villaletiziagiaveno@gmail.com')) {
    errors.push(`${file}: missing email contact`);
  }

  if (!content.includes('script.js')) {
    errors.push(`${file}: missing script.js include`);
  }

  if (!content.includes('style.css')) {
    errors.push(`${file}: missing style.css include`);
  }
}

for (const asset of requiredAssets) {
  const assetPath = path.join(root, asset);
  if (!fs.existsSync(assetPath)) {
    errors.push(`Missing asset: ${asset}`);
  }
}

try {
  const style = read('style.css');
  const script = read('script.js');

  assert(style.includes('.site-footer'), 'style.css: missing .site-footer styles');
  assert(style.includes('.footer-social-btn'), 'style.css: missing social button styles');
  assert(style.includes('@media (max-width: 900px)'), 'style.css: missing responsive footer breakpoint');

  assert(script.includes('footer-toggle'), 'script.js: missing footer accordion logic');
  assert(script.includes('back-to-top'), 'script.js: missing back-to-top logic');
} catch (err) {
  errors.push(err.message);
}

if (errors.length > 0) {
  console.error('Site validation failed:\n');
  errors.forEach((error) => console.error(`  - ${error}`));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML pages and core assets.`);
