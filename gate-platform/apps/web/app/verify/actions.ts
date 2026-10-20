"use server";

import { publicApi, type CredentialCheck } from "@/lib/public-api";

export type VerifyState = CredentialCheck | null;

export async function verifyBadgeAction(_prev: VerifyState, data: FormData): Promise<VerifyState> {
  const file = data.get("png");
  const jwt = String(data.get("jwt") ?? "").trim();
  let png: string | undefined;
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return { valid: false, reason: "The image is larger than 5 MB." };
    png = Buffer.from(await file.arrayBuffer()).toString("base64");
  }
  if (!png && !jwt) return { valid: false, reason: "Choose the badge image or paste its credential." };
  const r = await publicApi.verifyCredential(png ? { png } : { jwt });
  if (!r.ok) return { valid: false, reason: "The verification service is not reachable right now. Try again in a minute." };
  return r.data;
}
