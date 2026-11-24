// Copies an image into the viewer's data folder (image() only loads paths inside Herdr's home)
// and prints {file, width, height}. usage: node image.mjs <src> <outDir>
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

export function imageSize(buf, ext) {
  const u32 = (o) => buf.readUInt32BE(o), u16 = (o) => buf.readUInt16BE(o);
  if (buf.slice(1, 4).toString() === "PNG") return { width: u32(16), height: u32(20) };
  if (buf.slice(0, 3).toString() === "GIF") return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  if (buf.slice(0, 2).toString() === "BM") return { width: buf.readInt32LE(18), height: Math.abs(buf.readInt32LE(22)) };
  if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") {
    const kind = buf.slice(12, 16).toString();
    if (kind === "VP8X") return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    if (kind === "VP8L") { const b = buf.readUInt32LE(21); return { width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff) }; }
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (u16(0) === 0xffd8) {
    for (let o = 2; o + 9 < buf.length;) {
      const marker = u16(o), len = u16(o + 2);
      if (marker >= 0xffc0 && marker <= 0xffcf && ![0xffc4, 0xffc8, 0xffcc].includes(marker)) return { width: u16(o + 7), height: u16(o + 5) };
      o += 2 + len;
    }
  }
  if (ext === ".svg") {
    const head = buf.slice(0, 4096).toString();
    const attr = (n) => Number((new RegExp(`<svg[^>]*\\s${n}="([\\d.]+)(px)?"`).exec(head) ?? [])[1]);
    const box = /viewBox="[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)"/.exec(head);
    const width = attr("width") || Number(box?.[1]) || 800, height = attr("height") || Number(box?.[2]) || 600;
    return { width, height };
  }
  return null;
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const [src, outDir] = process.argv.slice(2);
  try {
    const ext = extname(src).toLowerCase();
    const size = imageSize(readFileSync(src), ext);
    if (!size) throw new Error("unknown image format");
    mkdirSync(outDir, { recursive: true });
    const file = `image${ext}`;
    copyFileSync(src, join(outDir, file));
    console.log(JSON.stringify({ file, ...size }));
  } catch (e) {
    console.error(String(e?.message ?? e));
    process.exit(1);
  }
}
