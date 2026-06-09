import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable, telehealthUsersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  requireTelehealthAuth,
  requireRole,
  type TelehealthAuthRequest,
} from "../middleware/telehealth-auth";
import { logAudit } from "../lib/telehealth-audit";

const router = Router();

// Get patients (provider only)
router.get(
  "/telehealth/patients",
  requireTelehealthAuth,
  requireRole("provider"),
  async (req: TelehealthAuthRequest, res) => {
    const patients = await db
      .select({
        id: telehealthUsersTable.id,
        email: telehealthUsersTable.email,
        name: telehealthUsersTable.name,
        role: telehealthUsersTable.role,
        specialty: telehealthUsersTable.specialty,
        phone: telehealthUsersTable.phone,
        mfaEnabled: telehealthUsersTable.mfaEnabled,
      })
      .from(telehealthUsersTable)
      .where(eq(telehealthUsersTable.role, "patient"));

    await logAudit("LIST_PATIENTS", { userId: req.telehealthUser!.id, req });
    res.json(patients);
  }
);

// Get audit logs for current user
router.get(
  "/telehealth/audit-logs",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const userId = req.telehealthUser!.id;

    const logs = await db
      .select()
      .from(auditLogsTable)
      .where(eq(auditLogsTable.userId, userId))
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(100);

    res.json(
      logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        action: l.action,
        resourceType: l.resourceType,
        resourceId: l.resourceId,
        ipAddress: l.ipAddress,
        details: l.details,
        createdAt: l.createdAt.toISOString(),
      }))
    );
  }
);

export default router;
