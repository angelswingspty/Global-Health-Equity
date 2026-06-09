import { Router } from "express";
import { db } from "@workspace/db";
import { prescriptionsTable, telehealthUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  requireTelehealthAuth,
  requireRole,
  type TelehealthAuthRequest,
} from "../middleware/telehealth-auth";
import { logAudit } from "../lib/telehealth-audit";

const router = Router();

async function withNames(rx: typeof prescriptionsTable.$inferSelect) {
  const [patient, provider] = await Promise.all([
    db
      .select({ name: telehealthUsersTable.name })
      .from(telehealthUsersTable)
      .where(eq(telehealthUsersTable.id, rx.patientId))
      .limit(1),
    db
      .select({ name: telehealthUsersTable.name })
      .from(telehealthUsersTable)
      .where(eq(telehealthUsersTable.id, rx.providerId))
      .limit(1),
  ]);
  return {
    id: rx.id,
    patientId: rx.patientId,
    providerId: rx.providerId,
    medication: rx.medication,
    dosage: rx.dosage,
    frequency: rx.frequency,
    instructions: rx.instructions,
    refills: rx.refills,
    status: rx.status,
    prescribedAt: rx.prescribedAt.toISOString(),
    patientName: patient[0]?.name ?? null,
    providerName: provider[0]?.name ?? null,
  };
}

// List prescriptions
router.get(
  "/telehealth/prescriptions",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const userId = req.telehealthUser!.id;
    const role = req.telehealthUser!.role;

    const rxs = await db
      .select()
      .from(prescriptionsTable)
      .where(
        role === "provider"
          ? eq(prescriptionsTable.providerId, userId)
          : eq(prescriptionsTable.patientId, userId)
      );

    await logAudit("LIST_PRESCRIPTIONS", { userId, resourceType: "prescriptions", req });

    res.json(await Promise.all(rxs.map(withNames)));
  }
);

// Write prescription (provider only)
router.post(
  "/telehealth/prescriptions",
  requireTelehealthAuth,
  requireRole("provider"),
  async (req: TelehealthAuthRequest, res) => {
    const { patientId, medication, dosage, frequency, instructions, refills } = req.body;
    const providerId = req.telehealthUser!.id;

    if (!patientId || !medication || !dosage || !frequency) {
      res.status(400).json({ error: "patientId, medication, dosage, and frequency are required" });
      return;
    }

    const [rx] = await db
      .insert(prescriptionsTable)
      .values({
        patientId,
        providerId,
        medication,
        dosage,
        frequency,
        instructions: instructions ?? null,
        refills: refills ?? 0,
        status: "active",
        prescribedAt: new Date(),
      })
      .returning();

    await logAudit("CREATE_PRESCRIPTION", {
      userId: providerId,
      resourceType: "prescription",
      resourceId: rx.id,
      details: medication,
      req,
    });

    res.status(201).json(await withNames(rx));
  }
);

export default router;
