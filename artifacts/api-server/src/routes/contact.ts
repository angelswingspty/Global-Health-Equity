import { Router } from "express";
import { db } from "@workspace/db";
import { contactsTable } from "@workspace/db";
import { SubmitContactBody } from "@workspace/api-zod";

const router = Router();

router.post("/contact", async (req, res) => {
  const parsed = SubmitContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { name, email, subject, message } = parsed.data;

  await db.insert(contactsTable).values({
    name,
    email,
    subject: subject ?? null,
    message,
  });

  res.status(201).json({ message: "Your message has been received. We will get back to you soon." });
});

export default router;
