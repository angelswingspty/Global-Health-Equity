import { Router } from "express";
import { db } from "@workspace/db";
import { patientIntakeFormsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireTelehealthAuth, type TelehealthAuthRequest } from "../middleware/telehealth-auth";
import { encryptMessage, decryptMessage } from "../lib/telehealth-crypto";
import { logAudit } from "../lib/telehealth-audit";

const router = Router();

function encryptSection(data: unknown): { enc: string; nonce: string } {
  const { encrypted, nonce } = encryptMessage(JSON.stringify(data));
  return { enc: encrypted, nonce };
}

function decryptSection(enc: string | null | undefined, nonce: string | null | undefined): unknown {
  if (!enc || !nonce) return null;
  try {
    return JSON.parse(decryptMessage(enc, nonce));
  } catch {
    return null;
  }
}

router.get(
  "/telehealth/intake",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const userId = req.telehealthUser!.id;
    const role = req.telehealthUser!.role;

    const patientId = role === "patient" ? userId : parseInt((req.query["patientId"] as string) ?? "0");
    if (!patientId) {
      res.status(400).json({ error: "patientId required for providers" });
      return;
    }

    const rows = await db
      .select()
      .from(patientIntakeFormsTable)
      .where(eq(patientIntakeFormsTable.patientId, patientId))
      .limit(1);

    if (rows.length === 0) {
      res.json(null);
      return;
    }

    const form = rows[0];
    await logAudit("VIEW_INTAKE_FORM", { userId, resourceType: "intake_form", resourceId: form.id, req });

    res.json({
      id: form.id,
      patientId: form.patientId,
      bloodType: form.bloodType,
      emergencyContactName: form.emergencyContactName,
      emergencyContactPhone: form.emergencyContactPhone,
      medicalHistory: decryptSection(form.medicalHistoryEnc, form.medicalHistoryNonce),
      allergies: decryptSection(form.allergiesEnc, form.allergiesNonce),
      currentMedications: decryptSection(form.medicationsEnc, form.medicationsNonce),
      insuranceInfo: decryptSection(form.insuranceEnc, form.insuranceNonce),
      completedAt: form.completedAt?.toISOString() ?? null,
      updatedAt: form.updatedAt.toISOString(),
    });
  }
);

router.post(
  "/telehealth/intake",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const userId = req.telehealthUser!.id;
    if (req.telehealthUser!.role !== "patient") {
      res.status(403).json({ error: "Only patients can submit intake forms" });
      return;
    }

    const {
      bloodType,
      emergencyContactName,
      emergencyContactPhone,
      medicalHistory,
      allergies,
      currentMedications,
      insuranceInfo,
    } = req.body;

    const mhEnc = medicalHistory ? encryptSection(medicalHistory) : { enc: null, nonce: null };
    const alEnc = allergies ? encryptSection(allergies) : { enc: null, nonce: null };
    const medEnc = currentMedications ? encryptSection(currentMedications) : { enc: null, nonce: null };
    const insEnc = insuranceInfo ? encryptSection(insuranceInfo) : { enc: null, nonce: null };

    const existing = await db
      .select({ id: patientIntakeFormsTable.id })
      .from(patientIntakeFormsTable)
      .where(eq(patientIntakeFormsTable.patientId, userId))
      .limit(1);

    let form;
    if (existing.length > 0) {
      const [updated] = await db
        .update(patientIntakeFormsTable)
        .set({
          bloodType: bloodType ?? null,
          emergencyContactName: emergencyContactName ?? null,
          emergencyContactPhone: emergencyContactPhone ?? null,
          medicalHistoryEnc: mhEnc.enc,
          medicalHistoryNonce: mhEnc.nonce,
          allergiesEnc: alEnc.enc,
          allergiesNonce: alEnc.nonce,
          medicationsEnc: medEnc.enc,
          medicationsNonce: medEnc.nonce,
          insuranceEnc: insEnc.enc,
          insuranceNonce: insEnc.nonce,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(patientIntakeFormsTable.patientId, userId))
        .returning();
      form = updated;
    } else {
      const [created] = await db
        .insert(patientIntakeFormsTable)
        .values({
          patientId: userId,
          bloodType: bloodType ?? null,
          emergencyContactName: emergencyContactName ?? null,
          emergencyContactPhone: emergencyContactPhone ?? null,
          medicalHistoryEnc: mhEnc.enc,
          medicalHistoryNonce: mhEnc.nonce,
          allergiesEnc: alEnc.enc,
          allergiesNonce: alEnc.nonce,
          medicationsEnc: medEnc.enc,
          medicationsNonce: medEnc.nonce,
          insuranceEnc: insEnc.enc,
          insuranceNonce: insEnc.nonce,
          completedAt: new Date(),
        })
        .returning();
      form = created;
    }

    await logAudit("SUBMIT_INTAKE_FORM", { userId, resourceType: "intake_form", resourceId: form.id, req });

    res.status(201).json({
      id: form.id,
      patientId: form.patientId,
      completedAt: form.completedAt?.toISOString() ?? null,
      updatedAt: form.updatedAt.toISOString(),
    });
  }
);

export default router;
