import React from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Calendar, MessageSquare, FileText, Pill, Video, Clock, Users, BarChart3 as Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedTelehealthRoute } from "@/components/telehealth/ProtectedTelehealthRoute";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { useGetAppointments, useGetMessages } from "@workspace/api-client-react";

export default function ProviderDashboard() {
  const { user, token } = useTelehealthAuth();
  
  const { data: appointments } = useGetAppointments({
    query: { enabled: !!token, queryKey: ["getAppointments"] },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: messages } = useGetMessages(undefined, {
    query: { enabled: !!token, queryKey: ["getMessages"] },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  const today = new Date();
  const todaysAppointments = appointments?.filter(a => {
    const aptDate = new Date(a.scheduledAt);
    return aptDate.getDate() === today.getDate() && 
           aptDate.getMonth() === today.getMonth() && 
           aptDate.getFullYear() === today.getFullYear() &&
           a.status !== "cancelled";
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()) || [];

  const unreadMessages = messages?.filter(m => !m.isRead && m.recipientId === user?.id).length || 0;

  return (
    <ProtectedTelehealthRoute allowedRoles={["provider"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome, Dr. {user?.name.split(' ').pop()}</h1>
          <p className="text-slate-500 mt-1">Here is your schedule and patient overview for today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-secondary shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Today's Appointments</p>
                <h3 className="text-3xl font-bold text-slate-900">{todaysAppointments.length}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-secondary">
                <Calendar className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Active Patients</p>
                <h3 className="text-3xl font-bold text-slate-900">42</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <Users className="w-6 h-6" />
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

          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Pending Refills</p>
                <h3 className="text-3xl font-bold text-slate-900">3</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                <Pill className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-secondary" />
                  Today's Schedule
                </CardTitle>
                <Link href="/telehealth/provider/appointments">
                  <Button variant="ghost" size="sm" className="text-secondary hover:text-secondary/80">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {todaysAppointments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="mb-4">You have no appointments scheduled for today.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaysAppointments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {apt.patientName?.charAt(0) || "P"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{apt.patientName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 font-normal">
                                {apt.type === 'video' ? 'Video Visit' : 'Follow-up'}
                              </Badge>
                              <span className="text-sm font-medium text-secondary">
                                {format(new Date(apt.scheduledAt), "h:mm a")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          {apt.status === "in_progress" ? (
                            <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-white">Join Video</Button>
                          ) : apt.status === "scheduled" ? (
                            <Button size="sm" variant="outline" className="border-secondary text-secondary">Start Visit</Button>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 capitalize">{apt.status}</Badge>
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
                  <Activity className="w-5 h-5 mr-2 text-secondary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/telehealth/provider/patients" className="block w-full">
                  <Button variant="outline" className="w-full justify-start h-12 font-medium">
                    <Users className="w-5 h-5 mr-3 text-slate-500" />
                    Patient Directory
                  </Button>
                </Link>
                <Link href="/telehealth/provider/prescriptions" className="block w-full">
                  <Button variant="outline" className="w-full justify-start h-12 font-medium">
                    <Pill className="w-5 h-5 mr-3 text-slate-500" />
                    Write Prescription
                  </Button>
                </Link>
                <Link href="/telehealth/provider/messages" className="block w-full">
                  <Button variant="outline" className="w-full justify-start h-12 font-medium">
                    <MessageSquare className="w-5 h-5 mr-3 text-slate-500" />
                    Secure Messages
                  </Button>
                </Link>
                <Link href="/telehealth/provider/appointments" className="block w-full">
                  <Button variant="outline" className="w-full justify-start h-12 font-medium">
                    <Calendar className="w-5 h-5 mr-3 text-slate-500" />
                    Schedule Appointment
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