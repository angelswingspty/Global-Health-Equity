import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, telehealthUsersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import {
  requireTelehealthAuth,
  type TelehealthAuthRequest,
} from "../middleware/telehealth-auth";
import { logAudit } from "../lib/telehealth-audit";

const router = Router();

async function withUserNames(appt: typeof appointmentsTable.$inferSelect) {
  const [patient, provider] = await Promise.all([
    db
      .select({ name: telehealthUsersTable.name })
      .from(telehealthUsersTable)
      .where(eq(telehealthUsersTable.id, appt.patientId))
      .limit(1),
    db
      .select({ name: telehealthUsersTable.name, specialty: telehealthUsersTable.specialty })
      .from(telehealthUsersTable)
      .where(eq(telehealthUsersTable.id, appt.providerId))
      .limit(1),
  ]);
  return {
    id: appt.id,
    patientId: appt.patientId,
    providerId: appt.providerId,
    scheduledAt: appt.scheduledAt.toISOString(),
    status: appt.status,
    type: appt.type,
    notes: appt.notes,
    videoRoomUrl: appt.videoRoomUrl,
    createdAt: appt.createdAt.toISOString(),
    patientName: patient[0]?.name ?? null,
    providerName: provider[0]?.name ?? null,
    providerSpecialty: provider[0]?.specialty ?? null,
  };
}

// List appointments for current user
router.get(
  "/telehealth/appointments",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const userId = req.telehealthUser!.id;
    const role = req.telehealthUser!.role;

    const appts = await db
      .select()
      .from(appointmentsTable)
      .where(
        role === "provider"
          ? eq(appointmentsTable.providerId, userId)
          : eq(appointmentsTable.patientId, userId)
      );

    await logAudit("LIST_APPOINTMENTS", { userId, req, resourceType: "appointments" });

    const withNames = await Promise.all(appts.map(withUserNames));
    res.json(withNames);
  }
);

// Book appointment (patient)
router.post(
  "/telehealth/appointments",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const { providerId, scheduledAt, type, notes } = req.body;
    const patientId = req.telehealthUser!.id;

    if (!providerId || !scheduledAt || !type) {
      res.status(400).json({ error: "providerId, scheduledAt, and type are required" });
      return;
    }

    const [appt] = await db
      .insert(appointmentsTable)
      .values({
        patientId,
        providerId,
        scheduledAt: new Date(scheduledAt),
        type,
        notes: notes ?? null,
        status: "scheduled",
        videoRoomUrl:
          type === "video"
            ? `https://meet.ghri.org/room/${Math.random().toString(36).slice(2, 9)}`
            : null,
      })
      .returning();

    await logAudit("CREATE_APPOINTMENT", {
      userId: patientId,
      resourceType: "appointment",
      resourceId: appt.id,
      req,
    });

    res.status(201).json(await withUserNames(appt));
  }
);

// Update appointment status
router.patch(
  "/telehealth/appointments/:id",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const id = parseInt(req.params["id"] as string);
    const { status, notes, videoRoomUrl } = req.body;
    const userId = req.telehealthUser!.id;

    const existing = await db
      .select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, id))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: "Appointment not found" });
      return;
    }

    const appt = existing[0];
    if (appt.patientId !== userId && appt.providerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const updates: Partial<typeof appointmentsTable.$inferInsert> = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (videoRoomUrl !== undefined) updates.videoRoomUrl = videoRoomUrl;

    const [updated] = await db
      .update(appointmentsTable)
      .set(updates)
      .where(eq(appointmentsTable.id, id))
      .returning();

    await logAudit("UPDATE_APPOINTMENT", {
      userId,
      resourceType: "appointment",
      resourceId: id,
      req,
    });

    res.json(await withUserNames(updated));
  }
);

// List providers
router.get(
  "/telehealth/providers",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const providers = await db
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
      .where(eq(telehealthUsersTable.role, "provider"));

    res.json(providers);
  }
);

export default router;
