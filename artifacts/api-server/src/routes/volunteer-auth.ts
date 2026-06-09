import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { volUsersTable, volSessionsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET ?? "ghri-vol-secret";
const SESSION_MS = 24 * 60 * 60 * 1000; // 24h for volunteers

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function makeToken(id: number, role: string) {
  return jwt.sign({ sub: id, role, portal: "volunteer" }, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyVolToken(token: string): { sub: number; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { sub: number; role: string; portal: string };
    if (decoded.portal !== "volunteer") return null;
    return decoded;
  } catch {
    return null;
  }
}

// POST /volunteers/auth/register
router.post("/volunteers/auth/register", async (req, res) => {
  const { email, password, name, phone, skills, availability, consentedToTerms } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: "email, password, and name are required" });
    return;
  }
  if (!consentedToTerms) {
    res.status(400).json({ error: "You must consent to the terms" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = await db.select({ id: volUsersTable.id }).from(volUsersTable).where(eq(volUsersTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const [user] = await db.insert(volUsersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    name,
    phone: phone ?? null,
    skills: skills ?? null,
    availability: availability ?? null,
    avatarInitials: initials,
    consentedAt: new Date(),
    status: "pending",
    role: "volunteer",
  }).returning();

  const token = makeToken(user.id, user.role);
  const tokenHash = hashToken(token);
  await db.insert(volSessionsTable).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + SESSION_MS),
    ipAddress: req.ip ?? null,
  });

  res.status(201).json({
    token,
    user: {
      id: user.id, email: user.email, name: user.name, role: user.role,
      status: user.status, avatarInitials: user.avatarInitials,
    },
  });
});

// POST /volunteers/auth/login
router.post("/volunteers/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const users = await db.select().from(volUsersTable).where(eq(volUsersTable.email, email.toLowerCase())).limit(1);
  if (users.length === 0) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const user = users[0];
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = makeToken(user.id, user.role);
  const tokenHash = hashToken(token);
  await db.insert(volSessionsTable).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + SESSION_MS),
    ipAddress: req.ip ?? null,
  });

  res.json({
    token,
    user: {
      id: user.id, email: user.email, name: user.name, role: user.role,
      status: user.status, avatarInitials: user.avatarInitials,
      skills: user.skills, availability: user.availability,
    },
  });
});

// POST /volunteers/auth/logout
router.post("/volunteers/auth/logout", async (req, res) => {
  const auth = req.headers.authorization?.split(" ")[1];
  if (auth) {
    const tokenHash = hashToken(auth);
    await db.delete(volSessionsTable).where(eq(volSessionsTable.tokenHash, tokenHash));
  }
  res.json({ ok: true });
});

// GET /volunteers/auth/me
router.get("/volunteers/auth/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }

  const payload = verifyVolToken(token);
  if (!payload) { res.status(401).json({ error: "Invalid token" }); return; }

  const tokenHash = hashToken(token);
  const sessions = await db.select().from(volSessionsTable)
    .where(and(eq(volSessionsTable.tokenHash, tokenHash), gt(volSessionsTable.expiresAt, new Date())))
    .limit(1);
  if (sessions.length === 0) { res.status(401).json({ error: "Session expired" }); return; }

  const users = await db.select().from(volUsersTable).where(eq(volUsersTable.id, payload.sub)).limit(1);
  if (users.length === 0) { res.status(401).json({ error: "User not found" }); return; }

  const user = users[0];
  res.json({
    id: user.id, email: user.email, name: user.name, role: user.role,
    status: user.status, avatarInitials: user.avatarInitials,
    skills: user.skills, availability: user.availability, bio: user.bio,
  });
});

export default router;
