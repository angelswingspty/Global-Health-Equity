import type { Request, Response, NextFunction } from "express";
import { validateSession } from "../lib/telehealth-crypto";
import { db } from "@workspace/db";
import { telehealthUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logAudit } from "../lib/telehealth-audit";

export interface TelehealthAuthRequest extends Request {
  telehealthUser?: {
    id: number;
    role: string;
    email: string;
    name: string;
    mfaEnabled: boolean;
  };
}

export async function requireTelehealthAuth(
  req: TelehealthAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = authHeader.slice(7);
  const session = await validateSession(token);
  if (!session) {
    res.status(401).json({ error: "Session expired or invalid. Please log in again." });
    return;
  }

  const users = await db
    .select({
      id: telehealthUsersTable.id,
      role: telehealthUsersTable.role,
      email: telehealthUsersTable.email,
      name: telehealthUsersTable.name,
      mfaEnabled: telehealthUsersTable.mfaEnabled,
    })
    .from(telehealthUsersTable)
    .where(eq(telehealthUsersTable.id, session.userId))
    .limit(1);

  if (users.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  req.telehealthUser = users[0];

  // Audit every authenticated PHI request
  await logAudit("PHI_ACCESS", {
    userId: users[0].id,
    resourceType: "endpoint",
    resourceId: `${req.method} ${req.path}`,
    req,
  });

  next();
}

export function requireRole(role: string) {
  return (req: TelehealthAuthRequest, res: Response, next: NextFunction): void => {
    if (req.telehealthUser?.role !== role) {
      res.status(403).json({ error: "Access denied: insufficient permissions" });
      return;
    }
    next();
  };
}
