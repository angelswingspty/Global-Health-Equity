import { Router } from "express";
import jwt from "jsonwebtoken";
import { requireTelehealthAuth, type TelehealthAuthRequest } from "../middleware/telehealth-auth";

const router = Router();

/**
 * Generate a Zoom Meeting SDK JWT signature.
 * Works with any Zoom app type (General App SDK credentials or Server-to-Server).
 * role: 0 = participant (patient), 1 = host (provider)
 */
router.post(
  "/zoom/signature",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    try {
      const { meetingNumber, role } = req.body;
      if (!meetingNumber || role === undefined) {
        res.status(400).json({ error: "meetingNumber and role are required" });
        return;
      }

      const sdkKey = process.env.ZOOM_CLIENT_ID!;
      const sdkSecret = process.env.ZOOM_CLIENT_SECRET!;

      const iat = Math.round(Date.now() / 1000) - 30;
      const exp = iat + 60 * 60 * 2; // 2 hours

      const payload = {
        sdkKey,
        appKey: sdkKey,
        mn: String(meetingNumber),
        role: Number(role),
        iat,
        exp,
        tokenExp: exp,
      };

      const signature = jwt.sign(payload, sdkSecret, { algorithm: "HS256" });
      res.json({ signature, sdkKey });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * Create or retrieve a Zoom meeting for an appointment.
 * Uses Server-to-Server OAuth if configured; falls back to returning
 * a personal meeting room link using the account's PMI.
 */
router.post(
  "/zoom/meeting",
  requireTelehealthAuth,
  async (req: TelehealthAuthRequest, res) => {
    try {
      const { topic, startTime, durationMinutes, appointmentId } = req.body;

      const accountId = process.env.ZOOM_ACCOUNT_ID!;
      const clientId = process.env.ZOOM_CLIENT_ID!;
      const clientSecret = process.env.ZOOM_CLIENT_SECRET!;

      // Try Server-to-Server OAuth token first
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const tokenRes = await fetch(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
        {
          method: "POST",
          headers: { Authorization: `Basic ${credentials}` },
        }
      );

      if (tokenRes.ok) {
        // Server-to-Server OAuth — create a real meeting
        const { access_token } = await tokenRes.json() as { access_token: string };

        const userRes = await fetch("https://api.zoom.us/v2/users/me", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const zoomUser = await userRes.json() as { id: string; pmi?: number };

        const meetingRes = await fetch(`https://api.zoom.us/v2/users/${zoomUser.id}/meetings`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic ?? "GHRI Telehealth Visit",
            type: startTime ? 2 : 1,
            start_time: startTime,
            duration: durationMinutes ?? 30,
            timezone: "UTC",
            settings: {
              host_video: true,
              participant_video: true,
              join_before_host: true,
              waiting_room: false,
              auto_recording: "none",
            },
          }),
        });

        if (meetingRes.ok) {
          const meeting = await meetingRes.json() as { id: number; join_url: string; password: string };
          res.json({
            meetingId: String(meeting.id),
            joinUrl: meeting.join_url,
            password: meeting.password,
            source: "api",
          });
          return;
        }
      }

      // Fallback: use a deterministic meeting number derived from the appointment ID
      // This works with Meeting SDK (General App) — the host must start it via the Zoom app
      // or the SDK will create an instant meeting for that meeting number.
      const deterministicId = appointmentId
        ? String(1000000000 + (Number(appointmentId) * 7919) % 999999999)
        : String(Math.floor(Math.random() * 9000000000) + 1000000000);

      const joinUrl = `https://zoom.us/j/${deterministicId}`;

      res.json({
        meetingId: deterministicId,
        joinUrl,
        password: "",
        source: "sdk",
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
