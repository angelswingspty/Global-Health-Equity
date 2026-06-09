import { Router } from "express";
import { db } from "@workspace/db";
import { medicalDocumentsTable, telehealthUsersTable } from "@workspace/db";
import { or, eq } from "drizzle-orm";
import {
  requireTelehealthAuth,
  type TelehealthAuthRequest,
} from "../middleware/telehealth-auth";
import { logAudit } from "../lib/telehealth-audit";

const router = Router();

// List documents
router.get(
  "/telehealth/documents",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const userId = req.telehealthUser!.id;
    const role = req.telehealthUser!.role;

    const docs = await db
      .select()
      .from(medicalDocumentsTable)
      .where(
        role === "provider"
          ? eq(medicalDocumentsTable.uploadedById, userId)
          : eq(medicalDocumentsTable.patientId, userId)
      );

    await logAudit("LIST_DOCUMENTS", { userId, resourceType: "documents", req });

    const result = await Promise.all(
      docs.map(async (d) => {
        const uploader = await db
          .select({ name: telehealthUsersTable.name })
          .from(telehealthUsersTable)
          .where(eq(telehealthUsersTable.id, d.uploadedById))
          .limit(1);
        return {
          id: d.id,
          patientId: d.patientId,
          uploadedById: d.uploadedById,
          filename: d.filename,
          documentType: d.documentType,
          fileSizeBytes: d.fileSizeBytes,
          createdAt: d.createdAt.toISOString(),
          uploaderName: uploader[0]?.name ?? null,
        };
      })
    );

    res.json(result);
  }
);

// Register document upload
router.post(
  "/telehealth/documents",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const { filename, documentType, patientId, fileSizeBytes } = req.body;
    const uploaderId = req.telehealthUser!.id;
    const role = req.telehealthUser!.role;

    if (!filename || !documentType) {
      res.status(400).json({ error: "filename and documentType are required" });
      return;
    }

    const resolvedPatientId = role === "provider" ? (patientId ?? uploaderId) : uploaderId;

    const [doc] = await db
      .insert(medicalDocumentsTable)
      .values({
        patientId: resolvedPatientId,
        uploadedById: uploaderId,
        filename,
        documentType,
        storageKey: `documents/${resolvedPatientId}/${Date.now()}-${filename}`,
        fileSizeBytes: fileSizeBytes ?? null,
      })
      .returning();

    await logAudit("UPLOAD_DOCUMENT", {
      userId: uploaderId,
      resourceType: "document",
      resourceId: doc.id,
      details: filename,
      req,
    });

    const uploader = await db
      .select({ name: telehealthUsersTable.name })
      .from(telehealthUsersTable)
      .where(eq(telehealthUsersTable.id, uploaderId))
      .limit(1);

    res.status(201).json({
      id: doc.id,
      patientId: doc.patientId,
      uploadedById: doc.uploadedById,
      filename: doc.filename,
      documentType: doc.documentType,
      fileSizeBytes: doc.fileSizeBytes,
      createdAt: doc.createdAt.toISOString(),
      uploaderName: uploader[0]?.name ?? null,
    });
  }
);

export default router;
