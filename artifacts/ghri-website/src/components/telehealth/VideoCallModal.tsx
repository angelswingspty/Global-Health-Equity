import React, { useEffect, useRef } from "react";
import { Video, X, Shield, Mic, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Appointment {
  id: number;
  patientName?: string | null;
  providerName?: string | null;
  providerSpecialty?: string | null;
  scheduledAt: string;
  type: string;
}

interface VideoCallModalProps {
  appointment: Appointment;
  userName: string;
  role: "patient" | "provider";
  onClose: () => void;
}

export function VideoCallModal({ appointment, userName, role, onClose }: VideoCallModalProps) {
  const roomName = `ghri-appt-${appointment.id}`;
  const jitsiUrl = `https://meet.jit.si/${roomName}#config.startWithVideoMuted=false&config.startWithAudioMuted=false&config.disableDeepLinking=true&config.prejoinPageEnabled=false&config.disableInviteFunctions=true&config.toolbarButtons=["microphone","camera","closedcaptions","desktop","fullscreen","hangup","tileview","videoquality"]&userInfo.displayName=${encodeURIComponent(userName)}`;

  const otherPerson = role === "patient"
    ? `Dr. ${appointment.providerName ?? "Your Provider"}`
    : (appointment.patientName ?? "Your Patient");

  const apptTime = new Date(appointment.scheduledAt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900" role="dialog" aria-modal="true" aria-label="Video consultation">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/20">
            <Video className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              Video Visit — {otherPerson}
            </p>
            <p className="text-slate-400 text-xs">{apptTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full">
            <Shield className="w-3.5 h-3.5" />
            <span>End-to-end encrypted</span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <X className="w-4 h-4 mr-1.5" />
            Leave Call
          </Button>
        </div>
      </div>

      <div className="flex-1 relative bg-slate-900">
        <iframe
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-read; clipboard-write"
          className="absolute inset-0 w-full h-full border-none"
          title="Video consultation"
        />
      </div>

      <div className="shrink-0 px-4 py-2 bg-slate-800 border-t border-slate-700 flex items-center justify-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5" />
          <span>Allow microphone access if prompted</span>
        </div>
        <span>·</span>
        <div className="flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5" />
          <span>Allow camera access if prompted</span>
        </div>
        <span>·</span>
        <span>Room: <code className="text-slate-400">{roomName}</code></span>
      </div>
    </div>
  );
}
