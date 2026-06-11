---
name: Telehealth video visits use Jitsi
description: Why telehealth video calls run on Jitsi Meet, not Zoom, and how rooms are derived
---

# Telehealth video visits run on Jitsi Meet (not Zoom)

Video visits embed Jitsi Meet via `meet.jit.si/external_api.js`. The room is the
appointment's `videoRoomUrl`, set at booking time to `https://meet.jit.si/ghri-appt-<id>`
for `type === "video"` appointments. `VideoCallModal` extracts the room name from that URL
(falls back to `ghri-appt-<id>`).

**Why:** The original implementation used Zoom. The `ZOOM_*` secrets in the environment are
**Meeting SDK** credentials — they generate valid join signatures but do NOT support the
`account_credentials` OAuth grant, so the Zoom REST call to *create* a meeting returns
`unsupported_grant_type`. The code then fell back to a fabricated `zoom.us/j/<deterministic-id>`
link for a meeting that never existed, so nothing opened. Real Zoom meeting creation would
require a separate Server-to-Server OAuth app. The user chose Jitsi instead (free, no account,
no API keys, works instantly).

**How to apply:** Keep video on Jitsi unless the user explicitly sets up a Zoom Server-to-Server
OAuth app and provides those credentials. The old `/zoom/*` routes (`zoom.ts`) were deleted; do
not reintroduce a fake-meeting fallback. The `ZOOM_*` secrets are currently unused — leave them
alone, don't reference them.
