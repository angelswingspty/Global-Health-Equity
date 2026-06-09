import React from "react";
import { Users, Mail, Phone, Calendar, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProtectedTelehealthRoute } from "@/components/telehealth/ProtectedTelehealthRoute";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { useGetPatients } from "@workspace/api-client-react";

export default function ProviderPatients() {
  const { token } = useTelehealthAuth();
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const { data: patients, isLoading } = useGetPatients({
    query: { enabled: !!token, queryKey: ["getPatients"] },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const filteredPatients = patients?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <ProtectedTelehealthRoute allowedRoles={["provider"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
              <Users className="w-8 h-8 mr-3 text-secondary" />
              Patient Directory
            </h1>
            <p className="text-slate-500 mt-1">View and manage your patient records.</p>
          </div>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex gap-4 bg-slate-50 border-b rounded-t-lg">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search patients by name or email..." 
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">Filter</Button>
          </CardContent>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading patients...</div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p>No patients found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredPatients.map((patient) => (
                  <Card key={patient.id} className="hover:shadow-md transition-shadow hover:border-secondary/50">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-secondary font-bold text-lg shrink-0">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 line-clamp-1" title={patient.name}>{patient.name}</h3>
                          <div className="flex items-center text-sm text-slate-500 mt-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                            Active Patient
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center text-sm text-slate-600">
                          <Mail className="w-4 h-4 mr-2 text-slate-400" />
                          <span className="truncate" title={patient.email}>{patient.email}</span>
                        </div>
                        {patient.phone && (
                          <div className="flex items-center text-sm text-slate-600">
                            <Phone className="w-4 h-4 mr-2 text-slate-400" />
                            {patient.phone}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 pt-4 border-t border-slate-100">
                        <Button variant="outline" size="sm" className="flex-1 border-secondary/20 text-secondary hover:bg-secondary/5">
                          Profile
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 border-secondary/20 text-secondary hover:bg-secondary/5">
                          <Calendar className="w-4 h-4 mr-1" /> Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedTelehealthRoute>
  );
}