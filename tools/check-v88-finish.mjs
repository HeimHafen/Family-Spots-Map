// FSM V88.1 – deterministic release gates, no DOM dependencies.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const root = process.cwd();
const read = p => fs.readFileSync(path.join(root,p),"utf8");
const sw = read("service-worker.js");
const css = read("css/fsm-v88-finish.css");
assert.match(css,/--fsm-v88-input-focused/);
assert.match(css,/#view-map > \.map-section/);
assert.match(read("js/ui/map-toolbar.js"),/spots: "M20 10c0 5-8 12/);
assert.equal((JSON.parse(read("data/spots.json"))).length,164);
for (const file of ["index.html","en/index.html","da/index.html"]) {
 const html=read(file);
 assert.ok(!html.includes('id="btn-toggle-view-menu"'),`${file}: old menu item still visible`);
 assert.ok(html.includes('id="btn-toggle-view"'),`${file}: internal map toggle lost`);
 assert.ok(html.includes('id="filter-search"'),`${file}: filter lost`);
 assert.ok(html.includes('id="daylog-text"'),`${file}: diary lost`);
 assert.ok(html.includes('css/fsm-v88-finish.css'),`${file}: fix CSS absent`);
 assert.ok(html.includes('js/features/gemeinsam-erleben-rc.js'),`${file}: calendar absent`);
 assert.ok(html.indexOf('css/fsm-v88-finish.css') > html.indexOf('css/gemeinsam-erleben-rc.css'),`${file}: incorrect cascade order`);
}
for(const file of ["index.html","en/index.html","da/index.html","css/fsm-v88-finish.css","js/ui/map-toolbar.js"]){
 const sha=crypto.createHash("sha256").update(fs.readFileSync(path.join(root,file))).digest("hex");
 assert.ok(sw.includes('"'+file+'": "'+sha+'"'),`SW hash missing: ${file}`);
}
assert.ok(sw.includes('"css/fsm-v88-finish.css",'),'offline asset missing');
console.log("FSM V88.1: menu, icon, focus, calendar, offline digests and spots OK.");
