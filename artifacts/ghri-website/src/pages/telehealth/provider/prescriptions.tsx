import React, { useState } from "react";
import { format } from "date-fns";
import { Pill, Plus } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProtectedTelehealthRoute } from "@/components/telehealth/ProtectedTelehealthRoute";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { useGetPrescriptions, useGetPatients, useCreatePrescription, getGetPrescriptionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const prescriptionSchema = z.object({
  patientId: z.coerce.number().min(1, "Please select a patient"),
  medication: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  instructions: z.string().optional(),
  refills: z.coerce.number().min(0).optional(),
});

export default function ProviderPrescriptions() {
  const { token } = useTelehealthAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: prescriptions, isLoading } = useGetPrescriptions({
    query: { enabled: !!token, queryKey: ["getPrescriptions"] },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: patients } = useGetPatients({
    query: { enabled: !!token, queryKey: ["getPatients"] },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const createMutation = useCreatePrescription({
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const form = useForm<z.infer<typeof prescriptionSchema>>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      medication: "",
      dosage: "",
      frequency: "",
      instructions: "",
      refills: 0,
    },
  });

  const onSubmit = (values: z.infer<typeof prescriptionSchema>) => {
    createMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: "Prescription created successfully" });
          setIsFormOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getGetPrescriptionsQueryKey() });
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Failed to create prescription",
            description: err.response?.data?.error || "An error occurred",
          });
        }
      }
    );
  };

  const sortedPrescriptions = prescriptions ? [...prescriptions].sort((a, b) => new Date(b.prescribedAt).getTime() - new Date(a.prescribedAt).getTime()) : [];

  return (
    <ProtectedTelehealthRoute allowedRoles={["provider"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
              <Pill className="w-8 h-8 mr-3 text-secondary" />
              Prescriptions
            </h1>
            <p className="text-slate-500 mt-1">Manage and issue new prescriptions for your patients.</p>
          </div>
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary/90">
                <Plus className="w-4 h-4 mr-2" /> Write Prescription
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Write New Prescription</DialogTitle>
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select a patient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patients?.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>
                                {p.name}
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
                    name="medication"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medication Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Amoxicillin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dosage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dosage</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 500mg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="refills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refills</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Twice daily" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g. Take with food" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Authorizing..." : "Authorize & Send to Pharmacy"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg">Recent Prescriptions Issued</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading prescriptions...</div>
            ) : sortedPrescriptions.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Pill className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p>You haven't issued any prescriptions yet.</p>
              </div>
            ) : (
              <div className="divide-y">
                {sortedPrescriptions.map((rx) => (
                  <div key={rx.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                        {rx.patientName?.charAt(0) || "P"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">{rx.medication}</h3>
                          <Badge variant="outline" className={`capitalize text-xs font-normal
                            ${rx.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${rx.status === 'completed' ? 'bg-slate-100 text-slate-600 border-slate-200' : ''}
                            ${rx.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                          `}>
                            {rx.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-1">
                          {rx.dosage} • {rx.frequency}
                        </p>
                        <div className="text-sm text-slate-600">
                          For: <span className="font-semibold text-slate-800">{rx.patientName}</span>
                        </div>
                        {rx.instructions && (
                          <p className="text-sm text-slate-500 mt-2 italic">Inst: {rx.instructions}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 text-sm text-slate-500">
                      <div>Issued {format(new Date(rx.prescribedAt), "MMM d, yyyy")}</div>
                      <div>Refills: {rx.refills || 0}</div>
                      <Button variant="link" size="sm" className="h-8 px-0 text-secondary hover:text-secondary mt-1">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedTelehealthRoute>
  );
}