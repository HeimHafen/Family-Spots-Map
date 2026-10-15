// Deliberately uncompressed ZIP: JPEGs are already compressed. The strict reader
// accepts archives from this app, bounds every record and checks every CRC.
export const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;
const encoder = new TextEncoder(), decoder = new TextDecoder("utf-8", { fatal: true });
const table = new Uint32Array(256);
for (let n = 0; n < 256; n++) { let c = n; for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
function crc(bytes) { let c = 0xffffffff; for (const n of bytes) c = table[(c ^ n) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
const invalid = () => { const e = new Error("invalid_backup"); e.code = "invalid_backup"; return e; };
const safeName = name => name === "manifest.json" || /^photos\/[a-f0-9]{64}\.jpg$/.test(name);
export async function writeZip(files) {
  if (!Array.isArray(files) || !files.length || files.length > 60001) throw invalid();
  const local = [], central = [], names = new Set(); let offset = 0, centralSize = 0;
  for (const { name, blob } of files) {
    if (!safeName(name) || names.has(name) || !(blob instanceof Blob) || offset + blob.size + 256 > MAX_ARCHIVE_BYTES) throw invalid();
    names.add(name);
    const bytes = new Uint8Array(await blob.arrayBuffer()), filename = encoder.encode(name), checksum = crc(bytes);
    const a = new Uint8Array(30 + filename.length), av = new DataView(a.buffer);
    av.setUint32(0, 0x04034b50, true); av.setUint16(4, 20, true); av.setUint16(6, 0x800, true); av.setUint16(12, 33, true);
    av.setUint32(14, checksum, true); av.setUint32(18, bytes.length, true); av.setUint32(22, bytes.length, true); av.setUint16(26, filename.length, true); a.set(filename, 30);
    const b = new Uint8Array(46 + filename.length), bv = new DataView(b.buffer);
    bv.setUint32(0, 0x02014b50, true); bv.setUint16(4, 20, true); bv.setUint16(6, 20, true); bv.setUint16(8, 0x800, true); bv.setUint16(14, 33, true);
    bv.setUint32(16, checksum, true); bv.setUint32(20, bytes.length, true); bv.setUint32(24, bytes.length, true); bv.setUint16(28, filename.length, true); bv.setUint32(42, offset, true); b.set(filename, 46);
    local.push(a, blob); central.push(b); offset += a.length + bytes.length; centralSize += b.length;
  }
  const end = new Uint8Array(22), view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true); view.setUint16(8, files.length, true); view.setUint16(10, files.length, true); view.setUint32(12, centralSize, true); view.setUint32(16, offset, true);
  if (offset + centralSize + 22 > MAX_ARCHIVE_BYTES) throw invalid();
  return new Blob([...local, ...central, end], { type: "application/zip" });
}
export async function readZip(blob) {
  if (!(blob instanceof Blob) || blob.size < 22 || blob.size > MAX_ARCHIVE_BYTES) throw invalid();
  const bytes = new Uint8Array(await blob.arrayBuffer()), view = new DataView(bytes.buffer), end = bytes.length - 22;
  const u16 = p => view.getUint16(p, true), u32 = p => view.getUint32(p, true);
  try {
    if (u32(end) !== 0x06054b50 || u16(end + 4) || u16(end + 6) || u16(end + 20) || u16(end + 8) !== u16(end + 10)) throw invalid();
    const count = u16(end + 8), start = u32(end + 16);
    if (!count || count > 60001 || start + u32(end + 12) !== end) throw invalid();
    const files = new Map(); let p = start, localEnd = 0;
    for (let i = 0; i < count; i++) {
      if (p + 46 > end || u32(p) !== 0x02014b50 || u16(p + 8) !== 0x800 || u16(p + 10) || u16(p + 30) || u16(p + 32) || u16(p + 34) || u16(p + 36) || u32(p + 38)) throw invalid();
      const length = u16(p + 28), size = u32(p + 24), checksum = u32(p + 16), offset = u32(p + 42);
      if (p + 46 + length > end || size !== u32(p + 20) || offset !== localEnd || offset + 30 > start) throw invalid();
      const name = decoder.decode(bytes.subarray(p + 46, p + 46 + length));
      if (!safeName(name) || files.has(name) || (name === "manifest.json" ? size > 5 * 1024 * 1024 : size > 1024 * 1024)) throw invalid();
      if (u32(offset) !== 0x04034b50 || u16(offset + 6) !== 0x800 || u16(offset + 8) || u32(offset + 14) !== checksum || u32(offset + 18) !== size || u32(offset + 22) !== size || u16(offset + 26) !== length || u16(offset + 28)) throw invalid();
      const from = offset + 30 + length, to = from + size;
      if (to > start || decoder.decode(bytes.subarray(offset + 30, from)) !== name || crc(bytes.subarray(from, to)) !== checksum) throw invalid();
      files.set(name, new Blob([bytes.subarray(from, to)], { type: name === "manifest.json" ? "application/json" : "image/jpeg" }));
      localEnd = to; p += 46 + length;
    }
    if (p !== end || localEnd !== start || !files.has("manifest.json")) throw invalid();
    return files;
  } catch { throw invalid(); }
}
