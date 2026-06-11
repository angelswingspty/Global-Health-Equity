import React, { useMemo, useState } from "react";
import { Stethoscope, Search, Calendar, Plus } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProtectedTelehealthRoute } from "@/components/telehealth/ProtectedTelehealthRoute";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { useGetProviders, useCreateAppointment, getGetAppointmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const bookingSchema = z.object({
  scheduledAt: z.string().min(1, "Please select a date and time"),
  type: z.enum(["video", "phone", "follow_up"]),
  notes: z.string().optional(),
});

type Provider = {
  id: number;
  name: string;
  specialty?: string | null;
  email?: string;
};

export default function FindADoctor() {
  const { token } = useTelehealthAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);

  const { data: providers, isLoading } = useGetProviders({
    query: { enabled: !!token, queryKey: ["getProviders"] },
    request: { headers: { Authorization: `Bearer ${token}` } },
  });

  const createMutation = useCreateAppointment({
    request: { headers: { Authorization: `Bearer ${token}` } },
  });

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { type: "video", notes: "" },
  });

  const filtered = useMemo(() => {
    const list = (providers as Provider[]) ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.specialty ?? "").toLowerCase().includes(q)
    );
  }, [providers, search]);

  const openBooking = (provider: Provider) => {
    form.reset({ type: "video", notes: "" });
    setBookingProvider(provider);
  };

  const onSubmit = (values: z.infer<typeof bookingSchema>) => {
    if (!bookingProvider) return;
    createMutation.mutate(
      {
        data: {
          providerId: bookingProvider.id,
          scheduledAt: new Date(values.scheduledAt).toISOString(),
          type: values.type,
          notes: values.notes,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Appointment booked successfully" });
          setBookingProvider(null);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Failed to book appointment",
            description: err.response?.data?.error || "An error occurred",
          });
        },
      }
    );
  };

  return (
    <ProtectedTelehealthRoute allowedRoles={["patient"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
            <Stethoscope className="w-8 h-8 mr-3 text-primary" />
            Find a Doctor
          </h1>
          <p className="text-slate-500 mt-1">
            Browse our care team and book an appointment with the right provider for you.
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or specialty"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading doctors...</div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-12 text-center text-slate-500">
              <Stethoscope className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p>{search ? "No doctors match your search." : "No doctors are available right now."}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <Card key={p.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">Dr. {p.name}</h3>
                      <Badge variant="outline" className="mt-1 font-normal text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {p.specialty || "General Practice"}
                      </Badge>
                    </div>
                  </div>
                  <Button className="w-full mt-auto" onClick={() => openBooking(p)}>
                    <Plus className="w-4 h-4 mr-2" /> Book Appointment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!bookingProvider} onOpenChange={(open) => !open && setBookingProvider(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Book with Dr. {bookingProvider?.name}
            </DialogTitle>
          </DialogHeader>
          {bookingProvider && (
            <p className="text-sm text-slate-500 -mt-2">
              {bookingProvider.specialty || "General Practice"}
            </p>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
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
    </ProtectedTelehealthRoute>
  );
}
