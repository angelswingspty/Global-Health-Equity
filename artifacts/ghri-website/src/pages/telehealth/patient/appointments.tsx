import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar, Video, Clock, Plus, X } from "lucide-react";
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
import { useGetAppointments, useGetProviders, useCreateAppointment, useUpdateAppointment, getGetAppointmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const bookingSchema = z.object({
  providerId: z.coerce.number().min(1, "Please select a provider"),
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

export default function PatientAppointments() {
  const { token, user } = useTelehealthAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<AppointmentRow | null>(null);

  const { data: appointments, isLoading } = useGetAppointments({
    query: { enabled: !!token, queryKey: ["getAppointments"] },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: providers } = useGetProviders({
    query: { enabled: !!token, queryKey: ["getProviders"] },
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
          providerId: values.providerId,
          scheduledAt: new Date(values.scheduledAt).toISOString(),
          type: values.type,
          notes: values.notes,
        }
      },
      {
        onSuccess: () => {
          toast({ title: "Appointment booked successfully" });
          setIsBookingOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Failed to book appointment",
            description: err.response?.data?.error || "An error occurred",
          });
        }
      }
    );
  };

  const handleCancel = (id: number) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    updateMutation.mutate(
      { id, data: { status: "cancelled" } },
      {
        onSuccess: () => {
          toast({ title: "Appointment cancelled" });
          queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
        }
      }
    );
  };

  const handleJoinCall = (apt: AppointmentRow) => {
    setActiveCall(apt);
  };

  const sortedAppointments = appointments
    ? [...(appointments as AppointmentRow[])].sort(
        (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      )
    : [];

  return (
    <ProtectedTelehealthRoute allowedRoles={["patient"]}>
      {activeCall && (
        <VideoCallModal
          appointment={activeCall}
          userName={user?.name ?? "Patient"}
          userEmail={user?.email}
          role="patient"
          onClose={() => setActiveCall(null)}
        />
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
              <Calendar className="w-8 h-8 mr-3 text-primary" />
              Appointments
            </h1>
            <p className="text-slate-500 mt-1">Manage your upcoming and past visits.</p>
          </div>

          <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Book an Appointment</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="providerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a provider" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {providers?.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>
                                Dr. {p.name} ({p.specialty || "General"})
                              </SelectItem>
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
                        <FormLabel>Reason for visit (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Briefly describe your symptoms or reason for the visit" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Booking..." : "Confirm Booking"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading appointments...</div>
            ) : sortedAppointments.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p>You have no appointments yet.</p>
              </div>
            ) : (
              <div className="divide-y">
                {sortedAppointments.map((apt) => {
                  const isPast = new Date(apt.scheduledAt) < new Date() && apt.status !== "in_progress";
                  const isUpcoming = apt.status === "scheduled" || apt.status === "confirmed";
                  const isVideo = apt.type === "video";

                  return (
                    <div
                      key={apt.id}
                      className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isPast ? "bg-slate-50" : "bg-white"}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                          apt.status === "in_progress" ? "bg-blue-600 text-white animate-pulse" :
                          isPast ? "bg-slate-200 text-slate-400" : "bg-blue-100 text-blue-600"
                        }`}>
                          {isVideo ? <Video className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-bold ${isPast ? "text-slate-600" : "text-slate-900"}`}>
                              Dr. {apt.providerName}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`capitalize text-xs font-normal
                                ${apt.status === "scheduled" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : ""}
                                ${apt.status === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
                                ${apt.status === "completed" ? "bg-gray-50 text-gray-700 border-gray-200" : ""}
                                ${apt.status === "cancelled" ? "bg-red-50 text-red-700 border-red-200" : ""}
                                ${apt.status === "confirmed" ? "bg-green-50 text-green-700 border-green-200" : ""}
                              `}
                            >
                              {apt.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 mb-2">{apt.providerSpecialty || "General Practice"}</p>
                          <div className="flex items-center text-sm font-medium text-slate-700">
                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                            {format(new Date(apt.scheduledAt), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                          </div>
                          {apt.notes && (
                            <p className="text-sm text-slate-500 mt-2 italic">"{apt.notes}"</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {apt.status === "in_progress" && isVideo && (
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                            onClick={() => handleJoinCall(apt)}
                          >
                            <Video className="w-4 h-4 mr-2" /> Join Video Visit
                          </Button>
                        )}
                        {isUpcoming && (
                          <Button
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleCancel(apt.id)}
                          >
                            <X className="w-4 h-4 mr-2" /> Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedTelehealthRoute>
  );
}
