import React, { useEffect, useRef, useState } from "react";
import { Video, X, Shield, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Appointment {
  id: number;
  patientName?: string | null;
  providerName?: string | null;
  scheduledAt: string;
  type: string;
  videoRoomUrl?: string | null;
}

interface VideoCallModalProps {
  appointment: Appointment;
  userName: string;
  userEmail?: string;
  role: "patient" | "provider";
  onClose: () => void;
}

type Stage = "loading" | "sdk_ready" | "sdk_error";

interface MeetingData {
  meetingId: string;
  password: string;
  joinUrl: string;
  signature: string;
  sdkKey: string;
  source: "api" | "sdk";
}

export function VideoCallModal({ appointment, userName, userEmail, role, onClose }: VideoCallModalProps) {
  const [stage, setStage] = useState<Stage>("loading");
  const [error, setError] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const sdkMounted = useRef(false);

  const token = localStorage.getItem("telehealth_token");

  const otherPerson = role === "patient"
    ? `Dr. ${appointment.providerName ?? "Your Provider"}`
    : (appointment.patientName ?? "Your Patient");

  const apptTime = new Date(appointment.scheduledAt).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    startMeeting();
    return () => {
      document.body.style.overflow = "";
      cleanupZoom();
    };
  }, []);

  function cleanupZoom() {
    try {
      const ZoomMtg = (window as any).ZoomMtg;
      if (ZoomMtg && sdkMounted.current) {
        ZoomMtg.leaveMeeting({});
      }
    } catch {}
    // Remove Zoom-injected DOM node if present
    const zoomRoot = document.getElementById("zmmtg-root");
    if (zoomRoot) {
      zoomRoot.style.display = "none";
    }
  }

  async function startMeeting() {
    try {
      setStage("loading");
      setError(null);

      // 1. Get/create meeting via API
      let meetingId: string;
      let password = "";
      let joinUrl = "";
      let source: "api" | "sdk" = "sdk";

      if (appointment.videoRoomUrl && /zoom\.us\/j\/(\d+)/.test(appointment.videoRoomUrl)) {
        const m = appointment.videoRoomUrl.match(/\/j\/(\d+)/);
        const p = appointment.videoRoomUrl.match(/[?&]pwd=([^&]+)/);
        meetingId = m?.[1] ?? "";
        password = p?.[1] ?? "";
        joinUrl = appointment.videoRoomUrl;
      } else {
        const r = await fetch("/api/zoom/meeting", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            topic: `GHRI Telehealth — ${otherPerson}`,
            appointmentId: appointment.id,
            startTime: appointment.scheduledAt,
            durationMinutes: 30,
          }),
        });
        if (!r.ok) throw new Error("Failed to set up video room");
        const d = await r.json() as { meetingId: string; password: string; joinUrl: string; source: "api" | "sdk" };
        meetingId = d.meetingId;
        password = d.password;
        joinUrl = d.joinUrl;
        source = d.source;

        // Persist URL on appointment
        await fetch(`/api/telehealth/appointments/${appointment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ videoRoomUrl: joinUrl }),
        }).catch(() => {});
      }

      // 2. Get SDK signature
      const sigR = await fetch("/api/zoom/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ meetingNumber: meetingId, role: role === "provider" ? 1 : 0 }),
      });
      if (!sigR.ok) throw new Error("Failed to get meeting token");
      const { signature, sdkKey } = await sigR.json() as { signature: string; sdkKey: string };

      const meetingData: MeetingData = { meetingId, password, joinUrl, signature, sdkKey, source };
      setMeeting(meetingData);

      // 3. Load and init Zoom Web SDK
      await loadZoomSDK();
      await initZoom(meetingData);

    } catch (err: any) {
      setError(err.message ?? "Could not start video call");
      setStage("sdk_error");
    }
  }

  function loadZoomSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).ZoomMtg) { resolve(); return; }

      const addScript = (src: string) => {
        const s = document.createElement("script");
        s.src = src;
        document.head.appendChild(s);
        return s;
      };
      const addStyle = (href: string) => {
        const l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = href;
        document.head.appendChild(l);
      };

      addStyle("https://source.zoom.us/3.9.0/css/bootstrap.css");
      addStyle("https://source.zoom.us/3.9.0/css/react-select.css");
      addScript("https://source.zoom.us/3.9.0/lib/vendor/react.min.js");
      addScript("https://source.zoom.us/3.9.0/lib/vendor/react-dom.min.js");
      const main = addScript("https://source.zoom.us/zoom-meeting-3.9.0.min.js");
      main.onload = () => resolve();
      main.onerror = () => reject(new Error("Failed to load Zoom SDK — check your network connection"));
    });
  }

  function initZoom(data: MeetingData): Promise<void> {
    return new Promise((resolve, reject) => {
      const ZoomMtg = (window as any).ZoomMtg;
      if (!ZoomMtg) { reject(new Error("Zoom SDK not loaded")); return; }

      ZoomMtg.setZoomJSLib("https://source.zoom.us/3.9.0/lib", "/av");
      ZoomMtg.preLoadWasm();
      ZoomMtg.prepareWebSDK();

      // Show Zoom's container
      const zoomRoot = document.getElementById("zmmtg-root");
      if (zoomRoot) zoomRoot.style.display = "block";

      ZoomMtg.init({
        leaveUrl: window.location.href,
        isSupportAV: true,
        isSupportNonverbal: false,
        isSupportQA: false,
        isSupportCC: false,
        screenShare: true,
        success: () => {
          ZoomMtg.join({
            meetingNumber: data.meetingId,
            userName,
            userEmail: userEmail ?? "",
            signature: data.signature,
            sdkKey: data.sdkKey,
            passWord: data.password,
            success: () => {
              sdkMounted.current = true;
              setStage("sdk_ready");
              resolve();
            },
            error: (err: any) => {
              reject(new Error(`Join failed (${err?.errorCode ?? err}). Try opening in the Zoom app instead.`));
            },
          });
        },
        error: (err: any) => {
          reject(new Error(`SDK init failed (${err?.errorCode ?? err})`));
        },
      });
    });
  }

  const openInZoomApp = () => {
    if (meeting?.joinUrl) window.open(meeting.joinUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900" role="dialog" aria-modal="true">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Video Visit — {otherPerson}</p>
            <p className="text-slate-400 text-xs">{apptTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full">
            <Shield className="w-3.5 h-3.5" />
            <span>Zoom encrypted</span>
          </div>
          {meeting?.joinUrl && (
            <Button size="sm" variant="outline" className="text-slate-200 border-slate-600 gap-1.5" onClick={openInZoomApp}>
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Zoom
            </Button>
          )}
          <Button size="sm" onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white gap-1.5">
            <X className="w-4 h-4" /> Leave
          </Button>
        </div>
      </div>

      {/* Video area — Zoom SDK mounts into #zmmtg-root which exists at page root */}
      <div className="flex-1 relative overflow-hidden">
        {stage === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900 z-10">
            <Loader2 className="w-10 h-10 text-[#0093D5] animate-spin" />
            <div className="text-center">
              <p className="text-white font-semibold">Connecting to Zoom…</p>
              <p className="text-slate-400 text-sm mt-1">Setting up your secure video room</p>
            </div>
          </div>
        )}

        {stage === "sdk_error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900 z-10 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Could not embed video</p>
              <p className="text-slate-400 text-sm mt-1 max-w-md">{error}</p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center mt-2">
              {meeting?.joinUrl && (
                <Button className="bg-[#0093D5] hover:bg-[#0093D5]/90 gap-2" onClick={openInZoomApp}>
                  <Video className="w-4 h-4" /> Join in Zoom App
                </Button>
              )}
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800" onClick={() => {
                sdkMounted.current = false;
                startMeeting();
              }}>
                Retry
              </Button>
            </div>
            {meeting?.joinUrl && (
              <p className="text-slate-500 text-xs">
                Meeting link: <span className="text-slate-400 break-all">{meeting.joinUrl}</span>
              </p>
            )}
          </div>
        )}

        {stage === "sdk_ready" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <p className="text-slate-400 text-sm">Zoom is running in embedded mode</p>
          </div>
        )}
      </div>
    </div>
  );
}
