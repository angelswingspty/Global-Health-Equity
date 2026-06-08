import { Router } from "express";
import { db } from "@workspace/db";
import { volunteersTable } from "@workspace/db";
import { SubmitVolunteerBody } from "@workspace/api-zod";

const router = Router();

router.post("/volunteer", async (req, res) => {
  const parsed = SubmitVolunteerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { name, email, profession, interestArea } = parsed.data;

  await db.insert(volunteersTable).values({
    name,
    email,
    profession,
    interestArea,
  });

  res.status(201).json({ message: "Thank you for your interest in volunteering with GHRI! We will be in touch soon." });
});

export default router;
