import React from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Calendar, MessageSquare, FileText, Pill, Video, Clock, BarChart3 as Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedTelehealthRoute } from "@/components/telehealth/ProtectedTelehealthRoute";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { useGetAppointments, useGetMessages } from "@workspace/api-client-react";

export default function PatientDashboard() {
  const { user, token } = useTelehealthAuth();
  
  const { data: appointments } = useGetAppointments({
    query: { enabled: !!token, queryKey: ["getAppointments"] },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: messages } = useGetMessages(undefined, {
    query: { enabled: !!token, queryKey: ["getMessages"] },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const upcomingAppointments = appointments?.filter(a => a.status === "scheduled" || a.status === "in_progress")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3) || [];

  const unreadMessages = messages?.filter(m => !m.isRead && m.recipientId === user?.id).length || 0;

  return (
    <ProtectedTelehealthRoute allowedRoles={["patient"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {user?.name.split(' ')[0]}</h1>
          <p className="text-slate-500 mt-1">Here is an overview of your health information.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Upcoming Appointments</p>
                <h3 className="text-3xl font-bold text-slate-900">{upcomingAppointments.length}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Active Prescriptions</p>
                <h3 className="text-3xl font-bold text-slate-900">2</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                <Pill className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Unread Messages</p>
                <h3 className="text-3xl font-bold text-slate-900">{unreadMessages}</h3>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                <MessageSquare className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Documents</p>
                <h3 className="text-3xl font-bold text-slate-900">4</h3>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                <FileText className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-primary" />
                  Upcoming Appointments
                </CardTitle>
                <Link href="/telehealth/patient/appointments">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="mb-4">You have no upcoming appointments.</p>
                    <Link href="/telehealth/patient/appointments">
                      <Button>Book Appointment</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            {apt.type === 'video' ? <Video className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Dr. {apt.providerName}</p>
                            <p className="text-sm text-slate-500">{apt.providerSpecialty || "General Practice"}</p>
                            <p className="text-sm font-medium text-primary mt-1">
                              {format(new Date(apt.scheduledAt), "EEEE, MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                        <div>
                          {apt.status === "in_progress" ? (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Join Video</Button>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/telehealth/patient/appointments" className="block w-full">
                  <Button variant="outline" className="w-full justify-start h-12 font-medium">
                    <Calendar className="w-5 h-5 mr-3 text-slate-500" />
                    Book Appointment
                  </Button>
                </Link>
                <Link href="/telehealth/patient/messages" className="block w-full">
                  <Button variant="outline" className="w-full justify-start h-12 font-medium">
                    <MessageSquare className="w-5 h-5 mr-3 text-slate-500" />
                    Message Provider
                  </Button>
                </Link>
                <Link href="/telehealth/patient/documents" className="block w-full">
                  <Button variant="outline" className="w-full justify-start h-12 font-medium">
                    <FileText className="w-5 h-5 mr-3 text-slate-500" />
                    Upload Document
                  </Button>
                </Link>
                <Link href="/telehealth/patient/prescriptions" className="block w-full">
                  <Button variant="outline" className="w-full justify-start h-12 font-medium">
                    <Pill className="w-5 h-5 mr-3 text-slate-500" />
                    View Prescriptions
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedTelehealthRoute>
  );
}