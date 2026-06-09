import React, { useState } from "react";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import { VolSidebar } from "@/components/volunteer/VolSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useGetVolHours, useLogVolHours, useReviewVolHours } from "@workspace/api-client-react";
import { Clock, Plus, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const statusBadge = {
  pending: { class: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: AlertCircle, label: "Pending" },
  approved: { class: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, label: "Approved" },
  rejected: { class: "bg-red-100 text-red-700 border-red-200", icon: XCircle, label: "Rejected" },
};

export default function VolHours() {
  const { token, isCoordinator } = useVolAuth();
  const authHeaders = { request: { headers: { Authorization: `Bearer ${token}` } } };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: "", hours: "", serviceDate: "" });

  const { data: hours, refetch } = useGetVolHours(authHeaders);
  const log = useLogVolHours({ mutation: { onSuccess: () => { refetch(); setShowForm(false); setForm({ description: "", hours: "", serviceDate: "" }); } } });
  const review = useReviewVolHours({ mutation: { onSuccess: () => refetch() } });

  const totalApproved = hours?.filter(h => h.status === "approved").reduce((sum, h) => sum + Number(h.hours), 0) ?? 0;
  const totalPending = hours?.filter(h => h.status === "pending").reduce((sum, h) => sum + Number(h.hours), 0) ?? 0;

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.hours || !form.serviceDate) return;
    log.mutate({ data: { description: form.description, hours: parseFloat(form.hours), serviceDate: form.serviceDate } });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VolSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#003F5C]">{isCoordinator ? "Service Hours — All Volunteers" : "My Service Hours"}</h1>
            <p className="text-muted-foreground mt-1">Log and track your volunteer service hours</p>
          </div>
          {!isCoordinator && (
            <Button onClick={() => setShowForm(!showForm)} className="bg-[#0093D5] hover:bg-[#007ab8]">
              <Plus className="w-4 h-4 mr-2" /> Log Hours
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-5 pb-5 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-[#003F5C]">{totalApproved.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Approved Hours</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5 flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-[#003F5C]">{totalPending.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Log form */}
        {showForm && (
          <Card className="mb-6 border-[#0093D5]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[#003F5C]">Log Service Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLog} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="description">Description *</Label>
                  <Input id="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your volunteer activity" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hours">Hours *</Label>
                  <Input id="hours" type="number" min="0.5" max="24" step="0.5" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="e.g. 2.5" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="serviceDate">Date *</Label>
                  <Input id="serviceDate" type="date" value={form.serviceDate} onChange={e => setForm(f => ({ ...f, serviceDate: e.target.value }))} required />
                </div>
                <div className="col-span-2 flex gap-3">
                  <Button type="submit" className="bg-[#0093D5] hover:bg-[#007ab8]" disabled={log.isPending}>
                    {log.isPending ? "Logging…" : "Submit Hours"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Hours list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[#003F5C]">Hours Log</CardTitle>
          </CardHeader>
          <CardContent>
            {!hours || hours.length === 0 ? (
              <div className="py-10 text-center">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No hours logged yet</p>
                {!isCoordinator && <Button onClick={() => setShowForm(true)} variant="outline" className="mt-3 text-sm">Log Your First Hours</Button>}
              </div>
            ) : (
              <div className="space-y-3">
                {hours.map(h => {
                  const st = statusBadge[h.status as keyof typeof statusBadge] ?? statusBadge.pending;
                  const StatusIcon = st.icon;
                  return (
                    <div key={h.id} className="flex items-start justify-between py-3 border-b last:border-0 gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#0093D5]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Clock className="w-4 h-4 text-[#0093D5]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#003F5C] truncate">{h.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(h.serviceDate).toLocaleDateString()} · <span className="font-semibold">{Number(h.hours).toFixed(1)} hrs</span>
                          </p>
                          {h.reviewNotes && (
                            <p className="text-xs text-red-600 mt-0.5 italic">Note: {h.reviewNotes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={`text-xs ${st.class} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />{st.label}
                        </Badge>
                        {isCoordinator && h.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => review.mutate({ id: h.id, data: { status: "approved" } })}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50" onClick={() => review.mutate({ id: h.id, data: { status: "rejected" } })}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
