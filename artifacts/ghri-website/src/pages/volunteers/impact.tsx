import React from "react";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import { VolSidebar } from "@/components/volunteer/VolSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetVolImpact, useGetVolHours, useGetVolEvents } from "@workspace/api-client-react";
import { Clock, Calendar, BarChart3, Heart, TrendingUp, Users } from "lucide-react";

export default function VolImpact() {
  const { token, user, isCoordinator } = useVolAuth();
  const authHeaders = { request: { headers: { Authorization: `Bearer ${token}` } } };

  const { data: impact } = useGetVolImpact(authHeaders);
  const { data: hours } = useGetVolHours(authHeaders);
  const { data: events } = useGetVolEvents(authHeaders);

  const approvedHours = impact?.approvedHours ?? 0;
  const eventsAttended = impact?.eventsAttended ?? 0;

  // Calculate stats from hours list
  const monthlyHours = new Map<string, number>();
  hours?.filter(h => h.status === "approved").forEach(h => {
    const month = new Date(h.serviceDate).toLocaleDateString("en-US", { year: "numeric", month: "short" });
    monthlyHours.set(month, (monthlyHours.get(month) ?? 0) + Number(h.hours));
  });
  const monthEntries = Array.from(monthlyHours.entries()).slice(-6);
  const maxHours = Math.max(...monthEntries.map(([, v]) => v), 1);

  const registeredEvents = events?.filter(e => e.registered) ?? [];
  const categories = events?.reduce((acc, e) => {
    if (e.category && e.registered) acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VolSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#003F5C]">Your Impact</h1>
          <p className="text-muted-foreground mt-1">
            {isCoordinator ? "Program-wide volunteer impact metrics" : `See the difference you're making, ${user?.name?.split(" ")[0]}`}
          </p>
        </div>

        {/* Hero metric */}
        <Card className="mb-6 bg-gradient-to-br from-[#003F5C] to-[#0093D5] text-white border-0">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Heart className="w-10 h-10 text-white/60" />
            </div>
            <div className="text-center">
              <p className="text-6xl font-bold text-white">{approvedHours.toFixed(1)}</p>
              <p className="text-white/70 text-lg mt-1">Total Approved Hours</p>
              <p className="text-white/50 text-sm mt-2">
                {isCoordinator ? "Across all GHRI volunteers" : "Your contribution to GHRI's mission"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-5 pb-5 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-[#0093D5]" />
              <div>
                <p className="text-2xl font-bold text-[#003F5C]">{eventsAttended}</p>
                <p className="text-sm text-muted-foreground">Events Attended</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold text-[#003F5C]">{monthEntries.length}</p>
                <p className="text-sm text-muted-foreground">Active Months</p>
              </div>
            </CardContent>
          </Card>
          {isCoordinator && (
            <Card>
              <CardContent className="pt-5 pb-5 flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-[#003F5C]">{impact?.activeVolunteers ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Active Volunteers</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly hours chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[#003F5C] flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Monthly Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthEntries.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No approved hours yet</div>
              ) : (
                <div className="space-y-3">
                  {monthEntries.map(([month, hrs]) => (
                    <div key={month} className="flex items-center gap-3">
                      <p className="text-xs text-muted-foreground w-16 flex-shrink-0">{month}</p>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0093D5] to-[#003F5C] rounded-full transition-all duration-500"
                          style={{ width: `${(hrs / maxHours) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs font-semibold text-[#003F5C] w-10 text-right">{hrs.toFixed(1)}h</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Events by category */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[#003F5C] flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Events by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(categories ?? {}).length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Register for events to see your activity breakdown</div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(categories ?? {}).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#003F5C]">{cat}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0093D5] rounded-full"
                            style={{ width: `${(count / Math.max(...Object.values(categories ?? {}))) * 100}%` }}
                          />
                        </div>
                        <p className="text-sm font-bold text-[#003F5C] w-4">{count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent approved hours */}
          {hours && hours.filter(h => h.status === "approved").length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-[#003F5C] flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Recent Approved Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {hours.filter(h => h.status === "approved").slice(0, 5).map(h => (
                    <div key={h.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium text-[#003F5C]">{h.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(h.serviceDate).toLocaleDateString()}</p>
                      </div>
                      <span className="text-sm font-bold text-[#0093D5]">{Number(h.hours).toFixed(1)} hrs</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
