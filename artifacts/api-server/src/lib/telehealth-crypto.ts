import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as otplib from "otplib";
import { db } from "@workspace/db";
import { telehealthSessionsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

const JWT_SECRET =
  process.env.SESSION_SECRET ?? "ghri-telehealth-secret-change-in-production";
const ENCRYPTION_KEY = crypto.scryptSync(
  process.env.SESSION_SECRET ?? "dev-secret-change-in-production",
  "ghri-salt",
  32
);

const SESSION_DURATION_MS = 15 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, role: string): string {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: "15m" });
}

export function verifyToken(token: string): { sub: number; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as {
      sub: number;
      role: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: number,
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(telehealthSessionsTable).values({
    userId,
    tokenHash,
    expiresAt,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
  });
}

export async function validateSession(
  token: string
): Promise<{ userId: number; role: string } | null> {
  const payload = verifyToken(token);
  if (!payload) return null;

  const tokenHash = hashToken(token);
  const now = new Date();

  const sessions = await db
    .select()
    .from(telehealthSessionsTable)
    .where(
      and(
        eq(telehealthSessionsTable.tokenHash, tokenHash),
        gt(telehealthSessionsTable.expiresAt, now)
      )
    )
    .limit(1);

  if (sessions.length === 0) return null;

  await db
    .update(telehealthSessionsTable)
    .set({ lastActive: new Date() })
    .where(eq(telehealthSessionsTable.tokenHash, tokenHash));

  return { userId: payload.sub, role: payload.role };
}

export async function invalidateSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db
    .delete(telehealthSessionsTable)
    .where(eq(telehealthSessionsTable.tokenHash, tokenHash));
}

export function encryptMessage(plaintext: string): { encrypted: string; nonce: string } {
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: Buffer.concat([encrypted, tag]).toString("base64"),
    nonce: nonce.toString("base64"),
  };
}

export function decryptMessage(encryptedB64: string, nonceB64: string): string {
  const nonce = Buffer.from(nonceB64, "base64");
  const data = Buffer.from(encryptedB64, "base64");
  const tag = data.slice(data.length - 16);
  const encrypted = data.slice(0, data.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function generateMfaSecret(): string {
  return otplib.generateSecret({ length: 20 });
}

export function getMfaOtpauthUrl(secret: string, email: string): string {
  return otplib.generateURI({
    label: email,
    issuer: "GHRI Telehealth",
    secret,
    strategy: "totp",
  });
}

export function verifyMfaToken(secret: string, token: string): boolean {
  try {
    const result: unknown = otplib.verifySync({ secret, token, strategy: "totp" });
    if (typeof result === "boolean") return result;
    if (result && typeof result === "object" && "valid" in result) {
      return !!(result as { valid: boolean }).valid;
    }
    return !!result;
  } catch {
    return false;
  }
}

export function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );
}
