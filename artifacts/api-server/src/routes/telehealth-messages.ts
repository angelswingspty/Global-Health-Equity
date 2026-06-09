import { Router } from "express";
import { db } from "@workspace/db";
import { telehealthMessagesTable, telehealthUsersTable } from "@workspace/db";
import { or, eq, and } from "drizzle-orm";
import {
  requireTelehealthAuth,
  type TelehealthAuthRequest,
} from "../middleware/telehealth-auth";
import { encryptMessage, decryptMessage } from "../lib/telehealth-crypto";
import { logAudit } from "../lib/telehealth-audit";

const router = Router();

// Get messages
router.get(
  "/telehealth/messages",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const userId = req.telehealthUser!.id;
    const withUserId = req.query.withUserId ? parseInt(req.query.withUserId as string) : undefined;

    const condition = withUserId
      ? or(
          and(
            eq(telehealthMessagesTable.senderId, userId),
            eq(telehealthMessagesTable.recipientId, withUserId)
          ),
          and(
            eq(telehealthMessagesTable.senderId, withUserId),
            eq(telehealthMessagesTable.recipientId, userId)
          )
        )
      : or(
          eq(telehealthMessagesTable.senderId, userId),
          eq(telehealthMessagesTable.recipientId, userId)
        );

    const msgs = await db
      .select()
      .from(telehealthMessagesTable)
      .where(condition);

    await logAudit("READ_MESSAGES", { userId, resourceType: "messages", req });

    const result = await Promise.all(
      msgs.map(async (m) => {
        const [sender, recipient] = await Promise.all([
          db
            .select({ name: telehealthUsersTable.name })
            .from(telehealthUsersTable)
            .where(eq(telehealthUsersTable.id, m.senderId))
            .limit(1),
          db
            .select({ name: telehealthUsersTable.name })
            .from(telehealthUsersTable)
            .where(eq(telehealthUsersTable.id, m.recipientId))
            .limit(1),
        ]);

        let content = "[Encrypted]";
        try {
          content = decryptMessage(m.contentEncrypted, m.nonce);
        } catch {
          content = "[Unable to decrypt]";
        }

        return {
          id: m.id,
          senderId: m.senderId,
          recipientId: m.recipientId,
          content,
          isRead: m.isRead,
          createdAt: m.createdAt.toISOString(),
          senderName: sender[0]?.name ?? null,
          recipientName: recipient[0]?.name ?? null,
        };
      })
    );

    res.json(result);
  }
);

// Send message
router.post(
  "/telehealth/messages",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    const { recipientId, content } = req.body;
    const senderId = req.telehealthUser!.id;

    if (!recipientId || !content) {
      res.status(400).json({ error: "recipientId and content are required" });
      return;
    }

    const { encrypted, nonce } = encryptMessage(content);

    const [msg] = await db
      .insert(telehealthMessagesTable)
      .values({
        senderId,
        recipientId,
        contentEncrypted: encrypted,
        nonce,
        isRead: false,
      })
      .returning();

    await logAudit("SEND_MESSAGE", {
      userId: senderId,
      resourceType: "message",
      resourceId: msg.id,
      req,
    });

    const [senderUser, recipientUser] = await Promise.all([
      db
        .select({ name: telehealthUsersTable.name })
        .from(telehealthUsersTable)
        .where(eq(telehealthUsersTable.id, senderId))
        .limit(1),
      db
        .select({ name: telehealthUsersTable.name })
        .from(telehealthUsersTable)
        .where(eq(telehealthUsersTable.id, recipientId))
        .limit(1),
    ]);

    res.status(201).json({
      id: msg.id,
      senderId: msg.senderId,
      recipientId: msg.recipientId,
      content,
      isRead: false,
      createdAt: msg.createdAt.toISOString(),
      senderName: senderUser[0]?.name ?? null,
      recipientName: recipientUser[0]?.name ?? null,
    });
  }
);

export default router;
