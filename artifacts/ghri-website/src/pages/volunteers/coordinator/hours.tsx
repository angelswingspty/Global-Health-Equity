import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import { VolSidebar } from "@/components/volunteer/VolSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock, Filter, ChevronDown, ChevronUp } from "lucide-react";

interface HourRow {
  id: number;
  volunteerId: number;
  volunteerName: string | null;
  volunteerInitials: string | null;
  description: string;
  hours: number;
  serviceDate: string;
  status: "pending" | "approved" | "rejected";
  reviewNotes: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

export default function CoordHours() {
  const [, setLocation] = useLocation();
  const { token, isCoordinator } = useVolAuth();
  const [hours, setHours] = useState<HourRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    if (!isCoordinator) { setLocation("/volunteers/login"); return; }
    fetch("/api/volunteers/coordinator/hours", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setHours(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const review = async (id: number, status: "approved" | "rejected") => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/volunteers/hours/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, reviewNotes: notes[id] ?? null }),
      });
      if (res.ok) {
        setHours(hs => hs.map(h => h.id === id ? { ...h, status, reviewNotes: notes[id] ?? null } : h));
        setExpanded(null);
      }
    } catch {} finally {
      setUpdating(null);
    }
  };

  const filtered = hours.filter(h => filter === "all" || h.status === filter);

  const counts = {
    all: hours.length,
    pending: hours.filter(h => h.status === "pending").length,
    approved: hours.filter(h => h.status === "approved").length,
    rejected: hours.filter(h => h.status === "rejected").length,
  };

  const totalPendingHours = hours
    .filter(h => h.status === "pending")
    .reduce((acc, h) => acc + h.hours, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VolSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#003F5C]">Approve Service Hours</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve volunteer-submitted hours
            {counts.pending > 0 && (
              <span className="ml-2 text-amber-600 font-medium">
                · {counts.pending} pending ({totalPendingHours.toFixed(1)}h to review)
              </span>
            )}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {(["pending", "all", "approved", "rejected"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filter === f
                  ? "bg-[#003F5C] text-white border-[#003F5C]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#003F5C]/30"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${filter === f ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <Card><CardContent className="pt-6 text-center text-muted-foreground">Loading…</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="font-medium text-slate-700">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">No {filter === "all" ? "" : filter} hours to review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(h => (
              <Card key={h.id} className="border hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-[#0093D5]/10 text-[#003F5C] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {h.volunteerInitials ?? (h.volunteerName?.[0] ?? "?")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-[#003F5C] text-sm">{h.volunteerName ?? "Volunteer"}</p>
                          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[h.status]}`}>{h.status}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(h.serviceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{h.description}</p>
                        {h.reviewNotes && (
                          <p className="text-xs text-slate-500 mt-1 italic">Note: {h.reviewNotes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#0093D5]">{h.hours}h</p>
                      </div>

                      {h.status === "pending" && (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white gap-1"
                            disabled={updating === h.id}
                            onClick={() => review(h.id, "approved")}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                            disabled={updating === h.id}
                            onClick={() => setExpanded(expanded === h.id ? null : h.id)}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {expanded === h.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rejection panel */}
                  {expanded === h.id && h.status === "pending" && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <p className="text-sm font-medium text-slate-700">Add a note (optional) before rejecting:</p>
                      <Textarea
                        placeholder="Reason for rejection…"
                        rows={2}
                        value={notes[h.id] ?? ""}
                        onChange={e => setNotes(n => ({ ...n, [h.id]: e.target.value }))}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          disabled={updating === h.id}
                          onClick={() => review(h.id, "rejected")}
                        >
                          Confirm Rejection
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setExpanded(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
