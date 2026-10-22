// Connection tokens for Miro, Mural, monday.com and Trello are stored in the workspace
// state, so they are encrypted with AES-256-GCM under a key derived from TRAINYARD_SECRET
// (falls back to the admin key). Without either, a random key is used for this process
// only and connections do not survive a restart; main.ts says so at start.

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

export class SecretBox {
  private readonly key: Buffer;
  readonly persistent: boolean;

  constructor(secret: string | undefined) {
    this.persistent = !!secret;
    this.key = secret ? scryptSync(secret, "trainyard-connections", 32) : randomBytes(32);
  }

  seal(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${enc.toString("base64url")}`;
  }

  open(sealed: string): string {
    const [v, iv, tag, data] = sealed.split(".");
    if (v !== "v1" || !iv || !tag || !data) throw new Error("unreadable sealed value");
    const decipher = createDecipheriv("aes-256-gcm", this.key, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  }
}
