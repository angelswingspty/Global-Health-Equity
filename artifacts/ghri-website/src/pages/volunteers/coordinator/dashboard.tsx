import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import { VolSidebar } from "@/components/volunteer/VolSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Clock, Calendar, ArrowRight,
  CheckCircle2, AlertCircle, TrendingUp, BarChart3,
} from "lucide-react";

interface VolunteerRow {
  id: number;
  name: string;
  email: string;
  status: string;
  approvedHours: number;
  createdAt: string;
  avatarInitials?: string | null;
}

interface HourRow {
  id: number;
  volunteerName: string | null;
  volunteerInitials: string | null;
  description: string;
  hours: number;
  serviceDate: string;
  status: string;
}

interface EventRow {
  id: number;
  title: string;
  startTime: string;
  location: string | null;
  status: string;
}

interface ImpactData {
  approvedHours: number;
  eventsAttended: number;
  activeVolunteers?: number;
}

export default function CoordDashboard() {
  const [, setLocation] = useLocation();
  const { token, isCoordinator } = useVolAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [volunteers, setVolunteers] = React.useState<VolunteerRow[]>([]);
  const [hours, setHours] = React.useState<HourRow[]>([]);
  const [events, setEvents] = React.useState<EventRow[]>([]);
  const [impact, setImpact] = React.useState<ImpactData | null>(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    if (!isCoordinator) { setLocation("/volunteers/login"); return; }
    Promise.all([
      fetch("/api/volunteers/coordinator/volunteers", { headers }).then(r => r.json()),
      fetch("/api/volunteers/coordinator/hours", { headers }).then(r => r.json()),
      fetch("/api/volunteers/events", { headers }).then(r => r.json()),
      fetch("/api/volunteers/impact", { headers }).then(r => r.json()),
    ]).then(([vols, hrs, evts, imp]) => {
      setVolunteers(Array.isArray(vols) ? vols : []);
      setHours(Array.isArray(hrs) ? hrs : []);
      setEvents(Array.isArray(evts) ? evts : []);
      setImpact(imp as ImpactData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pendingVolunteers = volunteers.filter(v => v.status === "pending");
  const activeVolunteers = volunteers.filter(v => v.status === "active");
  const pendingHours = hours.filter(h => h.status === "pending");
  const upcomingEvents = events.filter(e => e.status === "upcoming");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VolSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#003F5C]">Coordinator Overview</h1>
          <p className="text-muted-foreground mt-1">Manage volunteers, approve hours, and coordinate events</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: "Active Volunteers", value: activeVolunteers.length, color: "bg-[#0093D5]" },
            { icon: AlertCircle, label: "Pending Approval", value: pendingVolunteers.length, color: "bg-amber-500" },
            { icon: Clock, label: "Hours to Review", value: pendingHours.length, color: "bg-orange-500" },
            { icon: Calendar, label: "Upcoming Events", value: upcomingEvents.length, color: "bg-[#003F5C]" },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#003F5C]">{loading ? "—" : value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pending volunteers */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-[#003F5C] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Pending Volunteer Approvals
                </CardTitle>
                <Link href="/volunteers/coordinator/volunteers">
                  <span className="text-sm text-[#0093D5] hover:underline cursor-pointer flex items-center gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : pendingVolunteers.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" /> No pending approvals
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingVolunteers.slice(0, 4).map(v => (
                    <div key={v.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                          {v.avatarInitials ?? v.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#003F5C]">{v.name}</p>
                          <p className="text-xs text-muted-foreground">{v.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">pending</Badge>
                    </div>
                  ))}
                  {pendingVolunteers.length > 4 && (
                    <p className="text-xs text-muted-foreground">+{pendingVolunteers.length - 4} more</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending hours */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-[#003F5C] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Hours Awaiting Review
                </CardTitle>
                <Link href="/volunteers/coordinator/hours">
                  <span className="text-sm text-[#0093D5] hover:underline cursor-pointer flex items-center gap-1">
                    Review all <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : pendingHours.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" /> All hours reviewed
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingHours.slice(0, 4).map(h => (
                    <div key={h.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#003F5C]">{h.volunteerName ?? "Volunteer"}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{h.description}</p>
                      </div>
                      <span className="text-sm font-semibold text-[#0093D5] shrink-0">{h.hours}h</span>
                    </div>
                  ))}
                  {pendingHours.length > 4 && (
                    <p className="text-xs text-muted-foreground">+{pendingHours.length - 4} more</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Org-wide impact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#003F5C] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0093D5]" />
              Organization-Wide Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-[#0093D5]">{impact?.approvedHours ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Approved Hours</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#003F5C]">{impact?.activeVolunteers ?? activeVolunteers.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Active Volunteers</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-600">{impact?.eventsAttended ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Event Attendances</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
