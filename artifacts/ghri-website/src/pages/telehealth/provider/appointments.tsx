import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar, Video, Clock, Check, X, User } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProtectedTelehealthRoute } from "@/components/telehealth/ProtectedTelehealthRoute";
import { VideoCallModal } from "@/components/telehealth/VideoCallModal";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { useGetAppointments, useGetPatients, useCreateAppointment, useUpdateAppointment, getGetAppointmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const bookingSchema = z.object({
  patientId: z.coerce.number().min(1, "Please select a patient"),
  scheduledAt: z.string().min(1, "Please select a date and time"),
  type: z.enum(["video", "phone", "follow_up"]),
  notes: z.string().optional(),
});

type AppointmentRow = {
  id: number;
  patientId: number;
  providerId: number;
  scheduledAt: string;
  status: string;
  type: string;
  notes?: string | null;
  videoRoomUrl?: string | null;
  patientName?: string | null;
  providerName?: string | null;
  providerSpecialty?: string | null;
};

export default function ProviderAppointments() {
  const { token, user } = useTelehealthAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<AppointmentRow | null>(null);

  const { data: appointments, isLoading } = useGetAppointments({
    query: { enabled: !!token, queryKey: ["getAppointments"] },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: patients } = useGetPatients({
    query: { enabled: !!token, queryKey: ["getPatients"] },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const createMutation = useCreateAppointment({
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const updateMutation = useUpdateAppointment({
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { type: "video", notes: "" },
  });

  const onSubmit = (values: z.infer<typeof bookingSchema>) => {
    createMutation.mutate(
      {
        data: {
          providerId: user!.id,
          scheduledAt: new Date(values.scheduledAt).toISOString(),
          type: values.type,
          notes: `[Patient: ${values.patientId}] ${values.notes || ""}`.trim(),
        }
      },
      {
        onSuccess: () => {
          toast({ title: "Appointment scheduled successfully" });
          setIsBookingOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Failed to schedule appointment",
            description: err.response?.data?.error || "An error occurred",
          });
        }
      }
    );
  };

  const handleUpdateStatus = (
    apt: AppointmentRow,
    status: "confirmed" | "cancelled" | "completed" | "in_progress"
  ) => {
    if (status === "cancelled" && !confirm("Are you sure you want to cancel this appointment?")) return;
    if (status === "completed" && !confirm("Mark this visit as completed?")) return;

    updateMutation.mutate(
      { id: apt.id, data: { status } },
      {
        onSuccess: (updated: any) => {
          toast({ title: `Appointment ${status.replace("_", " ")}` });
          queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });

          if (status === "in_progress" && apt.type === "video") {
            setActiveCall({ ...apt, ...updated, status: "in_progress" });
          }
        }
      }
    );
  };

  const sortedAppointments = appointments
    ? [...(appointments as AppointmentRow[])].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )
    : [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const upcomingAppointments = sortedAppointments.filter(
    (a) => new Date(a.scheduledAt) >= todayStart && a.status !== "cancelled" && a.status !== "completed"
  );
  const pastAppointments = sortedAppointments
    .filter(
      (a) => new Date(a.scheduledAt) < todayStart || a.status === "completed" || a.status === "cancelled"
    )
    .reverse();

  return (
    <ProtectedTelehealthRoute allowedRoles={["provider"]}>
      {activeCall && (
        <VideoCallModal
          appointment={activeCall}
          userName={user?.name ?? "Provider"}
          role="provider"
          onClose={() => setActiveCall(null)}
        />
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
              <Calendar className="w-8 h-8 mr-3 text-secondary" />
              Schedule
            </h1>
            <p className="text-slate-500 mt-1">Manage your schedule and appointments.</p>
          </div>

          <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary/90">
                <Calendar className="w-4 h-4 mr-2" /> Schedule Visit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Schedule Appointment for Patient</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a patient" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patients?.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visit Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="video">Video Visit</SelectItem>
                            <SelectItem value="phone">Phone Call</SelectItem>
                            <SelectItem value="follow_up">In-Person Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date & Time</FormLabel>
                        <FormControl><Input type="datetime-local" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Notes for the visit" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Scheduling..." : "Confirm Schedule"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Upcoming & Active</h2>
            <Card className="shadow-sm">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-slate-500">Loading schedule...</div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-50/50">
                    No active or upcoming appointments found.
                  </div>
                ) : (
                  <div className="divide-y">
                    {upcomingAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className={`p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 ${
                          apt.status === "in_progress" ? "bg-blue-50/50" : "bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold ${
                            apt.status === "in_progress" ? "bg-blue-600 text-white animate-pulse" : "bg-slate-100 text-slate-600"
                          }`}>
                            {apt.status === "in_progress"
                              ? <Video className="w-5 h-5" />
                              : (apt.patientName?.charAt(0).toUpperCase() ?? <User className="w-5 h-5" />)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-slate-900">{apt.patientName}</h3>
                              <Badge
                                variant="outline"
                                className={`capitalize text-xs font-normal
                                  ${apt.status === "scheduled" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : ""}
                                  ${apt.status === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
                                  ${apt.status === "confirmed" ? "bg-green-50 text-green-700 border-green-200" : ""}
                                `}
                              >
                                {apt.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                              <div className="flex items-center text-sm font-medium text-slate-700">
                                <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                                {format(new Date(apt.scheduledAt), "EEE, MMM d")}
                              </div>
                              <div className="flex items-center text-sm font-medium text-slate-700">
                                <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                                {format(new Date(apt.scheduledAt), "h:mm a")}
                              </div>
                              <div className="flex items-center text-sm font-medium text-slate-700">
                                {apt.type === "video" ? <Video className="w-4 h-4 mr-1.5 text-slate-400" /> : <User className="w-4 h-4 mr-1.5 text-slate-400" />}
                                {apt.type === "video" ? "Video Visit" : apt.type === "phone" ? "Phone Call" : "In-Person"}
                              </div>
                            </div>
                            {apt.notes && (
                              <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded border">
                                Notes: {apt.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-4 xl:mt-0">
                          {apt.status === "scheduled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-200 text-green-700 hover:bg-green-50"
                              onClick={() => handleUpdateStatus(apt, "confirmed")}
                            >
                              <Check className="w-4 h-4 mr-1" /> Confirm
                            </Button>
                          )}
                          {(apt.status === "scheduled" || apt.status === "confirmed") && (
                            <Button
                              size="sm"
                              className="bg-secondary hover:bg-secondary/90 text-white"
                              onClick={() => handleUpdateStatus(apt, "in_progress")}
                              disabled={updateMutation.isPending}
                            >
                              <Video className="w-4 h-4 mr-1" />
                              {apt.type === "video" ? "Start Visit" : "Begin Visit"}
                            </Button>
                          )}
                          {apt.status === "in_progress" && (
                            <>
                              {apt.type === "video" && (
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => setActiveCall(apt)}
                                >
                                  <Video className="w-4 h-4 mr-1" /> Rejoin Video
                                </Button>
                              )}
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleUpdateStatus(apt, "completed")}
                              >
                                Mark Completed
                              </Button>
                            </>
                          )}
                          {apt.status !== "in_progress" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleUpdateStatus(apt, "cancelled")}
                            >
                              <X className="w-4 h-4 mr-1" /> Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {pastAppointments.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Past & Completed</h2>
              <Card className="shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y">
                    {pastAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 opacity-75 hover:opacity-100 transition-opacity"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 font-bold flex items-center justify-center">
                            {apt.patientName?.charAt(0).toUpperCase() ?? <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-700">{apt.patientName}</h3>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-sm text-slate-500">
                                {format(new Date(apt.scheduledAt), "MMM d, yyyy • h:mm a")}
                              </span>
                              <Badge
                                variant="outline"
                                className={`capitalize text-[10px] py-0 h-4 font-normal ${
                                  apt.status === "completed" ? "bg-gray-100 text-gray-600" : "bg-red-50 text-red-600"
                                }`}
                              >
                                {apt.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </div>
    </ProtectedTelehealthRoute>
  );
}
