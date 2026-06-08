import { Router } from "express";
import { db } from "@workspace/db";
import { newslettersTable } from "@workspace/db";
import { SubscribeNewsletterBody } from "@workspace/api-zod";

const router = Router();

router.post("/newsletter", async (req, res) => {
  const parsed = SubscribeNewsletterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { email, name } = parsed.data;

  try {
    await db.insert(newslettersTable).values({
      email,
      name: name ?? null,
    });
    res.status(201).json({ message: "You have been subscribed to our newsletter. Thank you for joining the movement!" });
  } catch {
    res.status(400).json({ error: "This email address is already subscribed." });
  }
});

export default router;
