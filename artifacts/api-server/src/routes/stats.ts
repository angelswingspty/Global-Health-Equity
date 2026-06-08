import { Router } from "express";

const router = Router();

router.get("/stats", (_req, res) => {
  res.json({
    ruralCommunitiesReached: 250,
    healthcarePartnerships: 48,
    volunteerProfessionals: 320,
    livesImpacted: 15000,
  });
});

export default router;
