import React, { useState } from "react";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import { VolSidebar } from "@/components/volunteer/VolSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useGetVolEvents, useRegisterVolEvent, useCancelVolEventRegistration, useCreateVolEvent } from "@workspace/api-client-react";
import { Calendar, MapPin, Users, Clock, Plus, CheckCircle2 } from "lucide-react";

const categoryColors: Record<string, string> = {
  "Health Fair": "bg-blue-100 text-blue-700",
  "Training": "bg-purple-100 text-purple-700",
  "Outreach": "bg-green-100 text-green-700",
  "Orientation": "bg-amber-100 text-amber-700",
};

export default function VolEvents() {
  const { token, isCoordinator } = useVolAuth();
  const authHeaders = { request: { headers: { Authorization: `Bearer ${token}` } } };
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", location: "", startTime: "", endTime: "", maxVolunteers: "", category: "" });

  const { data: events, refetch } = useGetVolEvents(authHeaders);
  const register = useRegisterVolEvent({ mutation: { onSuccess: () => refetch() } });
  const cancel = useCancelVolEventRegistration({ mutation: { onSuccess: () => refetch() } });
  const create = useCreateVolEvent({ mutation: { onSuccess: () => { refetch(); setShowCreate(false); } } });

  const upcoming = events?.filter(e => e.status === "upcoming") ?? [];
  const past = events?.filter(e => e.status !== "upcoming") ?? [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      data: {
        ...form,
        maxVolunteers: form.maxVolunteers ? parseInt(form.maxVolunteers) : undefined,
      }
    });
  };

  function EventCard({ event }: { event: NonNullable<typeof events>[number] }) {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const hours = ((end.getTime() - start.getTime()) / 3600000).toFixed(1);
    const catColor = event.category ? (categoryColors[event.category] ?? "bg-gray-100 text-gray-600") : "bg-gray-100 text-gray-600";

    return (
      <Card className={`overflow-hidden transition-all ${event.registered ? "border-[#0093D5]/40" : ""}`}>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {event.category && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${catColor}`}>{event.category}</span>
                )}
                {event.registered && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#0093D5]/10 text-[#0093D5] flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Registered
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-[#003F5C]">{event.title}</h3>
              {event.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>}

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({hours}h)
                </span>
                {event.location && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />{event.location}
                  </span>
                )}
                {event.maxVolunteers && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />Max {event.maxVolunteers} volunteers
                  </span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              {event.status === "upcoming" && (
                event.registered ? (
                  <Button size="sm" variant="outline" className="text-xs border-red-300 text-red-600 hover:bg-red-50" onClick={() => cancel.mutate({ id: event.id })}>
                    Cancel
                  </Button>
                ) : (
                  <Button size="sm" className="text-xs bg-[#0093D5] hover:bg-[#007ab8]" onClick={() => register.mutate({ id: event.id })}>
                    Register
                  </Button>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VolSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#003F5C]">Events</h1>
            <p className="text-muted-foreground mt-1">Browse and register for upcoming volunteer events</p>
          </div>
          {isCoordinator && (
            <Button onClick={() => setShowCreate(!showCreate)} className="bg-[#0093D5] hover:bg-[#007ab8]">
              <Plus className="w-4 h-4 mr-2" /> Create Event
            </Button>
          )}
        </div>

        {isCoordinator && showCreate && (
          <Card className="mb-6 border-[#0093D5]/30">
            <CardHeader className="pb-3"><CardTitle className="text-base text-[#003F5C]">New Event</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" required />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Venue address" />
                </div>
                <div className="space-y-1.5">
                  <Label>Start Time *</Label>
                  <Input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>End Time *</Label>
                  <Input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Volunteers</Label>
                  <Input type="number" min="1" value={form.maxVolunteers} onChange={e => setForm(f => ({ ...f, maxVolunteers: e.target.value }))} placeholder="Leave blank for unlimited" />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Health Fair, Training" />
                </div>
                <div className="col-span-2 flex gap-3">
                  <Button type="submit" className="bg-[#0093D5] hover:bg-[#007ab8]" disabled={create.isPending}>
                    {create.isPending ? "Creating…" : "Create Event"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {upcoming.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-[#003F5C] mb-3">Upcoming Events</h2>
            <div className="space-y-4">
              {upcoming.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-muted-foreground mb-3">Past Events</h2>
            <div className="space-y-4 opacity-70">
              {past.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}

        {events?.length === 0 && (
          <div className="py-16 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">No events scheduled yet</p>
          </div>
        )}
      </main>
    </div>
  );
}
