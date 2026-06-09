import { Router } from "express";
import { db } from "@workspace/db";
import {
  telehealthUsersTable,
  consentRecordsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  createSession,
  invalidateSession,
  generateMfaSecret,
  getMfaOtpauthUrl,
  verifyMfaToken,
  generateBackupCodes,
} from "../lib/telehealth-crypto";
import {
  requireTelehealthAuth,
  type TelehealthAuthRequest,
} from "../middleware/telehealth-auth";
import { logAudit } from "../lib/telehealth-audit";

const router = Router();

function safeUser(u: typeof telehealthUsersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    specialty: u.specialty,
    phone: u.phone,
    mfaEnabled: u.mfaEnabled,
  };
}

// Register
router.post("/telehealth/auth/register", async (req, res) => {
  const { email, password, name, role, specialty, phone, consentedToTerms } = req.body;

  if (!email || !password || !name || !role) {
    res.status(400).json({ error: "Email, password, name, and role are required" });
    return;
  }
  if (!["patient", "provider"].includes(role)) {
    res.status(400).json({ error: "Role must be patient or provider" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  if (!consentedToTerms) {
    res.status(400).json({ error: "You must consent to the terms and privacy policy" });
    return;
  }

  const existing = await db
    .select({ id: telehealthUsersTable.id })
    .from(telehealthUsersTable)
    .where(eq(telehealthUsersTable.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(telehealthUsersTable)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role,
      specialty: specialty ?? null,
      phone: phone ?? null,
      consentedAt: new Date(),
    })
    .returning();

  // Record consent
  await db.insert(consentRecordsTable).values({
    userId: user.id,
    formType: "terms_and_privacy",
    consented: true,
    ipAddress:
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ??
      req.socket.remoteAddress ??
      null,
  });

  const token = generateToken(user.id, user.role);
  await createSession(
    user.id,
    token,
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.socket.remoteAddress,
    req.headers["user-agent"]
  );

  await logAudit("REGISTER", { userId: user.id, req });

  res.status(201).json({ token, user: safeUser(user) });
});

// Login
router.post("/telehealth/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const users = await db
    .select()
    .from(telehealthUsersTable)
    .where(eq(telehealthUsersTable.email, email.toLowerCase()))
    .limit(1);

  if (users.length === 0) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const user = users[0];
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await logAudit("LOGIN_FAILED", { userId: user.id, req });
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = generateToken(user.id, user.role);
  await createSession(
    user.id,
    token,
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.socket.remoteAddress,
    req.headers["user-agent"]
  );

  await logAudit("LOGIN", { userId: user.id, req });

  res.json({
    token,
    user: safeUser(user),
    mfaRequired: user.mfaEnabled,
    mfaSetupRequired: !user.mfaEnabled,
  });
});

// MFA Setup — generate secret + QR URI
router.post(
  "/telehealth/auth/mfa/setup",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const userId = req.telehealthUser!.id;
    const user = (
      await db
        .select()
        .from(telehealthUsersTable)
        .where(eq(telehealthUsersTable.id, userId))
        .limit(1)
    )[0];

    const secret = generateMfaSecret();
    const backupCodes = generateBackupCodes();

    await db
      .update(telehealthUsersTable)
      .set({ mfaSecret: secret, mfaBackupCodes: JSON.stringify(backupCodes) })
      .where(eq(telehealthUsersTable.id, userId));

    await logAudit("MFA_SETUP_INITIATED", { userId, req });

    res.json({
      secret,
      otpauthUrl: getMfaOtpauthUrl(secret, user.email),
      backupCodes,
    });
  }
);

// MFA Verify
router.post(
  "/telehealth/auth/mfa/verify",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const { code, action = "enable" } = req.body;
    const userId = req.telehealthUser!.id;

    const user = (
      await db
        .select()
        .from(telehealthUsersTable)
        .where(eq(telehealthUsersTable.id, userId))
        .limit(1)
    )[0];

    if (!user.mfaSecret) {
      res.status(400).json({ error: "MFA not set up. Call /mfa/setup first." });
      return;
    }

    const valid = verifyMfaToken(user.mfaSecret, String(code));
    if (!valid) {
      await logAudit("MFA_VERIFY_FAILED", { userId, req });
      res.status(401).json({ error: "Invalid authentication code" });
      return;
    }

    if (action === "enable") {
      await db
        .update(telehealthUsersTable)
        .set({ mfaEnabled: true })
        .where(eq(telehealthUsersTable.id, userId));
    }

    await logAudit("MFA_VERIFIED", { userId, req });

    const token = generateToken(user.id, user.role);
    await createSession(
      user.id,
      token,
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.socket.remoteAddress,
      req.headers["user-agent"]
    );

    res.json({ token, user: safeUser({ ...user, mfaEnabled: true }) });
  }
);

// Me
router.get(
  "/telehealth/auth/me",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const user = (
      await db
        .select()
        .from(telehealthUsersTable)
        .where(eq(telehealthUsersTable.id, req.telehealthUser!.id))
        .limit(1)
    )[0];
    res.json(safeUser(user));
  }
);

// Logout
router.post(
  "/telehealth/auth/logout",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const token = req.headers.authorization!.slice(7);
    await invalidateSession(token);
    await logAudit("LOGOUT", { userId: req.telehealthUser!.id, req });
    res.json({ message: "Logged out successfully" });
  }
);

export default router;
