import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import { VolSidebar } from "@/components/volunteer/VolSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Search, Users, Clock, Filter } from "lucide-react";

interface VolunteerRow {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "pending" | "active" | "inactive";
  phone: string | null;
  skills: string | null;
  availability: string | null;
  approvedHours: number;
  createdAt: string;
  avatarInitials?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  inactive: "bg-slate-50 text-slate-500 border-slate-200",
};

export default function CoordVolunteers() {
  const [, setLocation] = useLocation();
  const { token, isCoordinator } = useVolAuth();
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "inactive">("all");
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    if (!isCoordinator) { setLocation("/volunteers/login"); return; }
    fetch("/api/volunteers/coordinator/volunteers", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setVolunteers(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: number, status: "active" | "inactive" | "pending") => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/volunteers/coordinator/volunteers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setVolunteers(vs => vs.map(v => v.id === id ? { ...v, status } : v));
      }
    } catch {} finally {
      setUpdating(null);
    }
  };

  const filtered = volunteers.filter(v => {
    const matchSearch = search === "" ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || v.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: volunteers.length,
    pending: volunteers.filter(v => v.status === "pending").length,
    active: volunteers.filter(v => v.status === "active").length,
    inactive: volunteers.filter(v => v.status === "inactive").length,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VolSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#003F5C]">Volunteer Management</h1>
          <p className="text-muted-foreground mt-1">Review applications, approve volunteers, and manage their status</p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {(["all", "pending", "active", "inactive"] as const).map(f => (
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

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <Card><CardContent className="pt-6 text-center text-muted-foreground">Loading volunteers…</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-muted-foreground">No volunteers found</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(v => (
              <Card key={v.id} className="border hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        v.status === "active" ? "bg-[#0093D5] text-white" :
                        v.status === "pending" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {v.avatarInitials ?? v.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[#003F5C] text-sm">{v.name}</p>
                          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[v.status]}`}>
                            {v.status}
                          </Badge>
                          {v.role === "coordinator" && (
                            <Badge className="text-xs bg-[#003F5C] text-white">coordinator</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{v.email}</p>
                        {v.skills && <p className="text-xs text-slate-500 mt-0.5 truncate">Skills: {v.skills}</p>}
                        {v.availability && <p className="text-xs text-slate-500 truncate">Avail: {v.availability}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-[#003F5C]">{v.approvedHours}h</p>
                        <p className="text-xs text-muted-foreground">approved</p>
                      </div>

                      {v.role !== "coordinator" && (
                        <div className="flex gap-2">
                          {v.status !== "active" && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                              disabled={updating === v.id}
                              onClick={() => updateStatus(v.id, "active")}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Activate
                            </Button>
                          )}
                          {v.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-slate-600 gap-1.5"
                              disabled={updating === v.id}
                              onClick={() => updateStatus(v.id, "inactive")}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Deactivate
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
