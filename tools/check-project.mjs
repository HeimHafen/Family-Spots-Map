// Dependency-free checks for the published application. Fails the GitHub job on errors.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
const fail = text => { console.error(text); failures++; };
const read = name => fs.readFileSync(path.join(root, name), "utf8");
function files(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}
for (const name of [...files("js"), ...files("tools"), "service-worker.js"]) {
  if (!/\.(?:m?js)$/.test(name)) continue;
  const result = spawnSync(process.execPath, ["--check", path.join(root, name)], { encoding: "utf8" });
  if (result.status !== 0) fail(`${name}: ${result.stderr}`);
}
for (const name of [...files("data"), ".eslintrc.json", "htmlhint.json", "manifest.webmanifest"]) {
  if (!/\.(?:json|webmanifest)$/.test(name)) continue;
  try { JSON.parse(read(name)); } catch (error) { fail(`${name}: ${error.message}`); }
}
function flatten(object, prefix = "", result = {}) {
  for (const [key, value] of Object.entries(object)) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") result[name] = value;
    else if (value && !Array.isArray(value) && typeof value === "object") flatten(value, name, result);
  }
  return result;
}
const translations = Object.fromEntries(["de", "en", "da"].map(lang => [lang, flatten(JSON.parse(read(`data/i18n/${lang}.json`)))]));
const allKeys = new Set(Object.values(translations).flatMap(table => Object.keys(table)));
for (const [lang, table] of Object.entries(translations)) {
  for (const key of allKeys) if (!table[key]?.trim()) fail(`Translation ${lang} missing: ${key}`);
}
const reached = new Set();
function checkModule(name) {
  if (reached.has(name)) return;
  reached.add(name);
  const source = read(name).replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, "");
  for (const match of source.matchAll(/(?:import|export)\s+(?:[^;]*?\s+from\s+)?["'](\.[^"']+)["']/g)) {
    const target = path.resolve(root, path.dirname(name), match[1].split("?")[0]);
    if (!fs.existsSync(target)) fail(`Missing module: ${name} -> ${match[1]}`);
    else checkModule(path.relative(root, target));
  }
}
for (const entry of ["js/app.js", "js/sw-register.js"]) checkModule(entry);
const assetsMatch = read("service-worker.js").match(/const ASSETS = (\[[\s\S]*?\]);/);
const assets = vm.runInNewContext(assetsMatch[1]);
for (const name of reached) if (!assets.includes(name)) fail(`Module not available offline: ${name}`);
for (const name of assets) if (name !== "./" && !fs.existsSync(path.join(root, name))) fail(`Missing offline asset: ${name}`);
const manifest = JSON.parse(read("manifest.webmanifest"));
for (const item of [...manifest.icons, ...(manifest.screenshots || [])]) if (!fs.existsSync(path.join(root, item.src))) fail(`Missing manifest image: ${item.src}`);
const payload = JSON.parse(read("data/spots.json"));
const spots = Array.isArray(payload) ? payload : payload.spots;
const ids = new Set();
for (const spot of spots) {
  if (!spot.id || ids.has(spot.id)) fail(`Missing or duplicate spot id: ${spot.id}`);
  ids.add(spot.id);
  const lat = Number(spot.lat ?? spot.location?.lat), lng = Number(spot.lng ?? spot.lon ?? spot.location?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) fail(`Invalid coordinates: ${spot.id}`);
  for (const lang of ["de", "en", "da"]) if (!spot[`summary_${lang}`]?.trim()) fail(`Missing summary ${lang}: ${spot.id}`);
}
for (const idea of JSON.parse(read("data/play-ideas.json"))) for (const lang of ["de", "en", "da"]) if (!(idea.texts?.[lang] || idea[lang])?.trim()) fail(`Missing play idea ${lang}: ${idea.id}`);
console.log(`${spots.length} spots, ${allKeys.size} translation keys per language, ${assets.length} offline assets. ${failures} errors.`);
process.exitCode = failures ? 1 : 0;
