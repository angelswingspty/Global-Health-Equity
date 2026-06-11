import React from "react";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import { VolSidebar } from "@/components/volunteer/VolSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Clock, Calendar, BarChart3, ArrowRight, FileText } from "lucide-react";
import { useGetVolHours, useGetVolEvents, useGetVolImpact } from "@workspace/api-client-react";

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#003F5C]">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VolDashboard() {
  const { user, token, isCoordinator } = useVolAuth();
  const authHeaders = { request: { headers: { Authorization: `Bearer ${token}` } } };

  const { data: hours } = useGetVolHours(authHeaders);
  const { data: events } = useGetVolEvents(authHeaders);
  const { data: impact } = useGetVolImpact(authHeaders);

  const pendingHours = hours?.filter(h => h.status === "pending").length ?? 0;
  const upcomingEvents = events?.filter(e => e.status === "upcoming" && e.registered).length ?? 0;

  const quickActions = [
    { href: "/volunteers/hours", label: "Log Hours", icon: Clock, desc: `${pendingHours} pending review` },
    { href: "/volunteers/events", label: "Browse Events", icon: Calendar, desc: `${upcomingEvents} registered` },
    { href: "/volunteers/messages", label: "Messages", icon: FileText, desc: "View your messages" },
    { href: "/volunteers/impact", label: "My Impact", icon: BarChart3, desc: "See your contribution" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VolSidebar />
      <main className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#003F5C]">Welcome back, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-muted-foreground mt-1">
            {isCoordinator ? "Coordinator Dashboard — manage volunteers and programs" : "Track your volunteering journey with GHRI Foundation"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Clock} label="Approved Hours" value={impact?.approvedHours ?? 0} color="bg-[#0093D5]" />
          <StatCard icon={Calendar} label="Events Attended" value={impact?.eventsAttended ?? 0} color="bg-[#003F5C]" />
          <StatCard icon={FileText} label="Hours Pending" value={pendingHours} color="bg-orange-500" />
          {isCoordinator
            ? <StatCard icon={BarChart3} label="Active Volunteers" value={impact?.activeVolunteers ?? 0} color="bg-purple-500" />
            : <StatCard icon={Calendar} label="Events Registered" value={upcomingEvents} color="bg-emerald-500" />
          }
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {quickActions.map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border hover:border-[#0093D5]/30">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0093D5]/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#0093D5]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#003F5C] text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Upcoming events */}
        {(events?.filter(e => e.status === "upcoming").length ?? 0) > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-[#003F5C]">Upcoming Events</CardTitle>
                <Link href="/volunteers/events">
                  <span className="text-sm text-[#0093D5] hover:underline cursor-pointer">View all</span>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events?.filter(e => e.status === "upcoming").slice(0, 3).map(event => (
                  <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#003F5C]">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.startTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {event.location && ` · ${event.location}`}
                      </p>
                    </div>
                    {event.registered && (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Registered</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
