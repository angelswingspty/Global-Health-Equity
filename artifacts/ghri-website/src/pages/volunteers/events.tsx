import React, { useState } from "react";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import { VolSidebar } from "@/components/volunteer/VolSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetVolEvents,
  useRegisterVolEvent,
  useCancelVolEventRegistration,
  useCreateVolEvent,
  useUpdateVolEvent,
  useDeleteVolEvent,
  getVolEventRegistrations,
} from "@workspace/api-client-react";
import type { VolEventRegistrant } from "@workspace/api-client-react";
import { Calendar, MapPin, Users, Clock, Plus, CheckCircle2, Pencil, Trash2, XCircle, ChevronDown } from "lucide-react";

const categoryColors: Record<string, string> = {
  "Health Fair": "bg-blue-100 text-blue-700",
  "Training": "bg-purple-100 text-purple-700",
  "Outreach": "bg-green-100 text-green-700",
  "Orientation": "bg-amber-100 text-amber-700",
};

type EventForm = { title: string; description: string; location: string; startTime: string; endTime: string; maxVolunteers: string; category: string };
const emptyForm: EventForm = { title: "", description: "", location: "", startTime: "", endTime: "", maxVolunteers: "", category: "" };

// datetime-local needs "YYYY-MM-DDTHH:mm"
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function VolEvents() {
  const { token, isCoordinator } = useVolAuth();
  const authHeaders = { request: { headers: { Authorization: `Bearer ${token}` } } };
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);

  const { data: events, refetch } = useGetVolEvents(authHeaders);
  const register = useRegisterVolEvent({ ...authHeaders, mutation: { onSuccess: () => refetch() } });
  const cancel = useCancelVolEventRegistration({ ...authHeaders, mutation: { onSuccess: () => refetch() } });
  const create = useCreateVolEvent({ ...authHeaders, mutation: { onSuccess: () => { refetch(); closeForm(); } } });
  const update = useUpdateVolEvent({ ...authHeaders, mutation: { onSuccess: () => { refetch(); closeForm(); } } });
  const remove = useDeleteVolEvent({ ...authHeaders, mutation: { onSuccess: () => refetch() } });

  const upcoming = events?.filter(e => e.status === "upcoming" || e.status === "active") ?? [];
  const past = events?.filter(e => e.status === "completed" || e.status === "cancelled") ?? [];

  function closeForm() {
    setShowCreate(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowCreate(true);
  }

  function openEdit(event: NonNullable<typeof events>[number]) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description ?? "",
      location: event.location ?? "",
      startTime: toLocalInput(event.startTime),
      endTime: toLocalInput(event.endTime),
      maxVolunteers: event.maxVolunteers != null ? String(event.maxVolunteers) : "",
      category: event.category ?? "",
    });
    setShowCreate(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      maxVolunteers: form.maxVolunteers ? parseInt(form.maxVolunteers) : undefined,
    };
    if (editingId != null) {
      update.mutate({ id: editingId, data: payload });
    } else {
      create.mutate({ data: payload });
    }
  };

  function CoordinatorControls({ event }: { event: NonNullable<typeof events>[number] }) {
    const [showRegs, setShowRegs] = useState(false);
    const [regs, setRegs] = useState<VolEventRegistrant[] | null>(null);
    const [loadingRegs, setLoadingRegs] = useState(false);

    const toggleRegs = async () => {
      const next = !showRegs;
      setShowRegs(next);
      if (next && regs === null) {
        setLoadingRegs(true);
        try {
          const data = await getVolEventRegistrations(event.id, { headers: { Authorization: `Bearer ${token}` } });
          setRegs(data);
        } finally {
          setLoadingRegs(false);
        }
      }
    };

    return (
      <div className="mt-4 pt-3 border-t border-dashed">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleRegs}
            className="flex items-center gap-1.5 text-xs font-medium text-[#0093D5] hover:text-[#007ab8]"
          >
            <Users className="w-3.5 h-3.5" />
            {event.registrationCount ?? 0} registered
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRegs ? "rotate-180" : ""}`} />
          </button>
          <div className="flex-1" />
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openEdit(event)}>
            <Pencil className="w-3 h-3 mr-1" /> Edit
          </Button>
          {event.status !== "cancelled" && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => update.mutate({ id: event.id, data: { status: "cancelled" } })}
            >
              <XCircle className="w-3 h-3 mr-1" /> Cancel Event
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => {
              if (confirm(`Delete "${event.title}"? This removes it for all volunteers and cannot be undone.`)) {
                remove.mutate({ id: event.id });
              }
            }}
          >
            <Trash2 className="w-3 h-3 mr-1" /> Delete
          </Button>
        </div>

        {showRegs && (
          <div className="mt-3 rounded-lg bg-gray-50 p-3">
            {loadingRegs ? (
              <p className="text-xs text-muted-foreground">Loading registrants…</p>
            ) : regs && regs.length > 0 ? (
              <ul className="space-y-2">
                {regs.map(r => (
                  <li key={r.id} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#0093D5] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                      {r.avatarInitials ?? r.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#003F5C] truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No volunteers registered yet.</p>
            )}
          </div>
        )}
      </div>
    );
  }

  function EventCard({ event }: { event: NonNullable<typeof events>[number] }) {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const hours = ((end.getTime() - start.getTime()) / 3600000).toFixed(1);
    const catColor = event.category ? (categoryColors[event.category] ?? "bg-gray-100 text-gray-600") : "bg-gray-100 text-gray-600";
    const isCancelled = event.status === "cancelled";
    const isFull = event.maxVolunteers != null && (event.registrationCount ?? 0) >= event.maxVolunteers;

    return (
      <Card className={`overflow-hidden transition-all ${event.registered ? "border-[#0093D5]/40" : ""} ${isCancelled ? "opacity-60" : ""}`}>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {event.category && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${catColor}`}>{event.category}</span>
                )}
                {isCancelled && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700">Cancelled</span>
                )}
                {event.registered && !isCancelled && (
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
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  {event.registrationCount ?? 0}{event.maxVolunteers ? ` / ${event.maxVolunteers}` : ""} registered
                </span>
              </div>
            </div>
            {!isCoordinator && (
              <div className="flex-shrink-0">
                {(event.status === "upcoming" || event.status === "active") && (
                  event.registered ? (
                    <Button size="sm" variant="outline" className="text-xs border-red-300 text-red-600 hover:bg-red-50" onClick={() => cancel.mutate({ id: event.id })}>
                      Cancel
                    </Button>
                  ) : isFull ? (
                    <Button size="sm" variant="outline" className="text-xs" disabled>
                      Full
                    </Button>
                  ) : (
                    <Button size="sm" className="text-xs bg-[#0093D5] hover:bg-[#007ab8]" onClick={() => register.mutate({ id: event.id })}>
                      Register
                    </Button>
                  )
                )}
              </div>
            )}
          </div>

          {isCoordinator && <CoordinatorControls event={event} />}
        </CardContent>
      </Card>
    );
  }

  const saving = create.isPending || update.isPending;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VolSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#003F5C]">Events</h1>
            <p className="text-muted-foreground mt-1">
              {isCoordinator
                ? "Publish events for volunteers and track who's registered"
                : "Browse and register for upcoming volunteer events"}
            </p>
          </div>
          {isCoordinator && (
            <Button onClick={() => (showCreate ? closeForm() : openCreate())} className="bg-[#0093D5] hover:bg-[#007ab8]">
              <Plus className="w-4 h-4 mr-2" /> Create Event
            </Button>
          )}
        </div>

        {isCoordinator && showCreate && (
          <Card className="mb-6 border-[#0093D5]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[#003F5C]">{editingId != null ? "Edit Event" : "New Event"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
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
                  <Button type="submit" className="bg-[#0093D5] hover:bg-[#007ab8]" disabled={saving}>
                    {saving ? "Saving…" : editingId != null ? "Save Changes" : "Publish Event"}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
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
            <h2 className="text-base font-semibold text-muted-foreground mb-3">Past &amp; Cancelled Events</h2>
            <div className="space-y-4 opacity-80">
              {past.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}

        {events?.length === 0 && (
          <div className="py-16 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">No events scheduled yet</p>
            {isCoordinator && (
              <Button onClick={openCreate} className="mt-4 bg-[#0093D5] hover:bg-[#007ab8]">
                <Plus className="w-4 h-4 mr-2" /> Create the first event
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
