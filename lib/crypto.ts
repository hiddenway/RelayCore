import bcrypt from "bcryptjs";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error("APP_SECRET is not set");
  return scryptSync(secret, "relay-core-salt", 32);
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptToken(ciphertext: string): string {
  const key = getKey();
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// API keys are stored encrypted (not hashed) so they can be revealed in the dashboard.
// encryptToken / decryptToken handle the same AES-256-GCM scheme.
export function encryptApiKey(apiKey: string): string {
  return encryptToken(apiKey);
}

export function decryptApiKey(encrypted: string): string {
  return decryptToken(encrypted);
}

export function verifyApiKey(apiKey: string, encrypted: string): boolean {
  try {
    return decryptToken(encrypted) === apiKey;
  } catch {
    return false;
  }
}

export function generateApiKey(): string {
  return "rck_" + randomBytes(24).toString("hex");
}

export function generateId(): string {
  return randomBytes(8).toString("hex");
}
