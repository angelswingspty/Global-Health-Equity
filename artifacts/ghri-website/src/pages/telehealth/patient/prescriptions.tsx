import React from "react";
import { format } from "date-fns";
import { Pill, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedTelehealthRoute } from "@/components/telehealth/ProtectedTelehealthRoute";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { useGetPrescriptions } from "@workspace/api-client-react";

export default function PatientPrescriptions() {
  const { token } = useTelehealthAuth();
  
  const { data: prescriptions, isLoading } = useGetPrescriptions({
    query: { enabled: !!token, queryKey: ["getPrescriptions"] },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const sortedPrescriptions = prescriptions ? [...prescriptions].sort((a, b) => new Date(b.prescribedAt).getTime() - new Date(a.prescribedAt).getTime()) : [];

  return (
    <ProtectedTelehealthRoute allowedRoles={["patient"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
              <Pill className="w-8 h-8 mr-3 text-primary" />
              Prescriptions
            </h1>
            <p className="text-slate-500 mt-1">Manage your active medications and past prescriptions.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading prescriptions...</div>
        ) : sortedPrescriptions.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center text-slate-500">
            <Pill className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No prescriptions</h3>
            <p>You don't have any prescriptions on file yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedPrescriptions.map((rx) => {
              const isActive = rx.status === 'active';
              
              return (
                <Card key={rx.id} className={`overflow-hidden border-t-4 ${isActive ? 'border-t-green-500 shadow-md' : 'border-t-slate-300'}`}>
                  <CardContent className="p-0">
                    <div className="p-5 border-b bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-xl text-slate-900">{rx.medication}</h3>
                        <Badge variant="outline" className={`
                          ${rx.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                          ${rx.status === 'completed' ? 'bg-slate-100 text-slate-600 border-slate-200' : ''}
                          ${rx.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                          capitalize
                        `}>
                          {rx.status}
                        </Badge>
                      </div>
                      <p className="text-primary font-medium text-lg mb-1">{rx.dosage}</p>
                      <p className="text-slate-600 font-medium">{rx.frequency}</p>
                    </div>
                    
                    <div className="p-5 bg-slate-50/50 space-y-4">
                      {rx.instructions && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Instructions</p>
                          <p className="text-sm text-slate-800">{rx.instructions}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Prescribed By</p>
                          <p className="text-sm font-medium text-slate-800">Dr. {rx.providerName}</p>
                          <p className="text-xs text-slate-500">{format(new Date(rx.prescribedAt), "MMM d, yyyy")}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Refills Left</p>
                          <div className="flex items-center text-sm font-medium text-slate-800">
                            <RotateCcw className="w-4 h-4 mr-1 text-slate-400" />
                            {rx.refills || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border-t bg-white flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        disabled={!isActive || !rx.refills || rx.refills <= 0}
                      >
                        Request Refill
                      </Button>
                      <Button variant="ghost" size="icon" className="shrink-0 text-slate-400 hover:text-slate-600">
                        <AlertCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedTelehealthRoute>
  );
}