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

type Stage = "loading" | "ready" | "error";

const JITSI_DOMAIN = "meet.jit.si";

function roomNameFor(appointment: Appointment): string {
  const url = appointment.videoRoomUrl;
  if (url) {
    const m = url.match(/meet\.jit\.si\/(.+)$/);
    if (m?.[1]) return m[1];
  }
  return `ghri-appt-${appointment.id}`;
}

export function VideoCallModal({ appointment, userName, userEmail, role, onClose }: VideoCallModalProps) {
  const [stage, setStage] = useState<Stage>("loading");
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  const roomName = roomNameFor(appointment);
  const joinUrl = `https://${JITSI_DOMAIN}/${roomName}`;

  const otherPerson = role === "patient"
    ? `Dr. ${appointment.providerName ?? "Your Provider"}`
    : (appointment.patientName ?? "Your Patient");

  const apptTime = new Date(appointment.scheduledAt).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    let cancelled = false;

    const start = async () => {
      try {
        setStage("loading");
        setError(null);
        await loadJitsiScript();
        if (cancelled) return;
        initJitsi();
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message ?? "Could not start the video call");
        setStage("error");
      }
    };
    start();

    return () => {
      cancelled = true;
      document.body.style.overflow = "";
      try {
        apiRef.current?.dispose();
      } catch {}
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadJitsiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).JitsiMeetExternalAPI) { resolve(); return; }
      const existing = document.getElementById("jitsi-external-api") as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load the video library")));
        return;
      }
      const s = document.createElement("script");
      s.id = "jitsi-external-api";
      s.src = `https://${JITSI_DOMAIN}/external_api.js`;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load the video library — check your network connection"));
      document.head.appendChild(s);
    });
  }

  function initJitsi() {
    const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
    if (!JitsiMeetExternalAPI) throw new Error("Video library not available");
    if (!containerRef.current) throw new Error("Video container not ready");

    const api = new JitsiMeetExternalAPI(JITSI_DOMAIN, {
      roomName,
      parentNode: containerRef.current,
      width: "100%",
      height: "100%",
      userInfo: {
        displayName: userName,
        email: userEmail ?? "",
      },
      configOverwrite: {
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
      },
      interfaceConfigOverwrite: {
        DEFAULT_BACKGROUND: "#0f172a",
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
      },
    });

    apiRef.current = api;
    api.addEventListener("videoConferenceJoined", () => setStage("ready"));
    api.addEventListener("readyToClose", () => onClose());
  }

  const openInNewTab = () => {
    window.open(joinUrl, "_blank", "noopener,noreferrer");
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
            <span>Encrypted call</span>
          </div>
          <Button size="sm" variant="outline" className="text-slate-200 border-slate-600 gap-1.5" onClick={openInNewTab}>
            <ExternalLink className="w-3.5 h-3.5" />
            Open in new tab
          </Button>
          <Button size="sm" onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white gap-1.5">
            <X className="w-4 h-4" /> Leave
          </Button>
        </div>
      </div>

      {/* Video area — Jitsi mounts its iframe into this container */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={containerRef} className="absolute inset-0" />

        {stage === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900 z-10">
            <Loader2 className="w-10 h-10 text-[#0093D5] animate-spin" />
            <div className="text-center">
              <p className="text-white font-semibold">Connecting…</p>
              <p className="text-slate-400 text-sm mt-1">Setting up your secure video room</p>
            </div>
          </div>
        )}

        {stage === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900 z-10 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Could not embed video</p>
              <p className="text-slate-400 text-sm mt-1 max-w-md">{error}</p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center mt-2">
              <Button className="bg-[#0093D5] hover:bg-[#0093D5]/90 gap-2" onClick={openInNewTab}>
                <Video className="w-4 h-4" /> Open call in new tab
              </Button>
            </div>
            <p className="text-slate-500 text-xs">
              Meeting link: <span className="text-slate-400 break-all">{joinUrl}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
