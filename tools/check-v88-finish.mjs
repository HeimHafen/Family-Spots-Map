// Historischer Test für V88.6. Für aktuelle Releases gilt tools/check-project.mjs.
// Family Spots Map V88.6 – safe-calendar regression gate.
// Only the new calendar and small shared close-icon may be redesigned;
// no V88 dark-mode hero, navigation hiding or map resize is allowed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = process.cwd();
const read = p => fs.readFileSync(path.join(root,p), 'utf8');
const sw = read('service-worker.js');
const base = read('css/fsm-v88-finish.css');
const premium = read('css/fsm-v88-premium.css');
const palette = read('css/fsm-v884-reference.css');
assert.match(base,/Main-Interaktionsstile/);
assert.doesNotMatch(premium,/\.app-header\s*\{/);
assert.doesNotMatch(premium,/html\.fsm-polished\[data-theme="dark"\]\s*body/);
assert.doesNotMatch(palette,/#fsm-v884-dark-hero/);
for (const property of ['display:', 'position:', 'pointer-events:', 'grid-template', 'z-index:', 'overflow:']) {
  assert.ok(!palette.includes(property),`dark palette must not change structural property: ${property}`);
}
assert.match(premium,/#fse-overlay/);
assert.match(palette,/#tilla-sidebar-text/);
assert.match(read('js/ui/map-toolbar.js'),/spots: "M20 10c0 5-8 12/);
assert.equal(JSON.parse(read('data/spots.json')).length,164);
for (const file of ['index.html','en/index.html','da/index.html']) {
  const html=read(file);
  assert.ok(html.includes('id="btn-toggle-view"'),`${file}: map view toggle lost`);
  assert.ok(html.includes('id="filter-search"'),`${file}: filters lost`);
  assert.ok(html.includes('id="daylog-text"'),`${file}: daylog lost`);
  assert.ok(html.includes('css/fsm-v88-finish.css'),`${file}: compatibility stylesheet not loaded`);
  assert.ok(html.includes('js/features/gemeinsam-erleben-rc.js'),`${file}: calendar lost`);
  assert.ok(!html.includes('fsm-v884-reference-home.js'),`${file}: extra darkmode home still active`);
}
for (const file of ['index.html','en/index.html','da/index.html','css/fsm-v88-finish.css','css/fsm-v88-premium.css','css/fsm-v884-reference.css']) {
  const sha=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
  assert.ok(sw.includes('"'+file+'": "'+sha+'"'),`service worker checksum missing: ${file}`);
}
console.log('FSM V88.6: main-layout guard, calendar isolation, 164 spots and offline hashes passed.');
