// Minimal zip reader for uploaded exports (iObeya, PowerPoint decks and similar): reads the
// central directory and inflates stored or deflated entries. No zip64, encryption or
// multi-disk archives; those are refused with a readable error. Sizes are capped so a small
// upload cannot inflate into gigabytes.

import { inflateRawSync } from "node:zlib";

export interface ZipEntry {
  name: string;
  size: number;
  read(): Buffer;
}

const MAX_ENTRY = 64 * 1024 * 1024;

export function isZip(buf: Buffer): boolean {
  return buf.length > 4 && buf.readUInt32LE(0) === 0x04034b50;
}

export function readZip(buf: Buffer): ZipEntry[] {
  // End of central directory: last 22 bytes plus up to 64 KB of comment.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65_535); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("not a zip file (no end-of-directory record)");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  if (p === 0xffffffff) throw new Error("zip64 archives are not supported; export the board again or upload the .csv inside");
  const entries: ZipEntry[] = [];
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("damaged zip central directory");
    const flags = buf.readUInt16LE(p + 8);
    const method = buf.readUInt16LE(p + 10);
    const compressed = buf.readUInt32LE(p + 20);
    const size = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString(flags & 0x800 ? "utf8" : "latin1");
    p += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith("/")) continue;
    entries.push({
      name,
      size,
      read() {
        if (flags & 0x1) throw new Error(`${name} is encrypted`);
        if (size > MAX_ENTRY) throw new Error(`${name} is larger than ${MAX_ENTRY / 1024 / 1024} MB uncompressed`);
        if (buf.readUInt32LE(local) !== 0x04034b50) throw new Error("damaged zip entry");
        const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
        const data = buf.subarray(start, start + compressed);
        if (method === 0) return Buffer.from(data);
        if (method === 8) return inflateRawSync(data, { maxOutputLength: MAX_ENTRY });
        throw new Error(`${name} uses an unsupported compression method (${method})`);
      },
    });
  }
  return entries;
}

/** Decode text by its byte-order mark: UTF-16 LE/BE or UTF-8 (iObeya writes UTF-16 LE). */
export function decodeText(buf: Buffer): string {
  if (buf[0] === 0xff && buf[1] === 0xfe) return new TextDecoder("utf-16le").decode(buf.subarray(2));
  if (buf[0] === 0xfe && buf[1] === 0xff) return new TextDecoder("utf-16be").decode(buf.subarray(2));
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return buf.subarray(3).toString("utf8");
  // UTF-16 without a BOM: every other byte is zero in ASCII-heavy text.
  if (buf.length > 3 && buf[1] === 0 && buf[3] === 0) return new TextDecoder("utf-16le").decode(buf);
  return buf.toString("utf8");
}
