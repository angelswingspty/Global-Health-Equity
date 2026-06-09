import React from "react";
import { format } from "date-fns";
import { Activity, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedTelehealthRoute } from "@/components/telehealth/ProtectedTelehealthRoute";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { useGetAuditLogs } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AuditLog() {
  const { token } = useTelehealthAuth();
  
  const { data: logs, isLoading } = useGetAuditLogs({
    query: { enabled: !!token, queryKey: ["getAuditLogs"] },
    request: { headers: { Authorization: `Bearer ${token}` } }
  });

  return (
    <ProtectedTelehealthRoute>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center">
              <Activity className="w-8 h-8 mr-3 text-primary" />
              Activity Log
            </h1>
            <p className="text-slate-500 mt-1">Review your recent portal activity and access records.</p>
          </div>
          <div className="flex items-center text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border">
            <Shield className="w-4 h-4 mr-2 text-green-600" />
            Immutable Audit Trail
          </div>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading audit records...</div>
            ) : !logs || logs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No activity recorded yet.</div>
            ) : (
              <div className="rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-[180px]">Date & Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead className="text-right">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log, i) => (
                      <TableRow key={log.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                        <TableCell className="font-medium text-slate-600 text-sm whitespace-nowrap">
                          {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-100 text-slate-700 font-normal">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.resourceType && (
                            <span className="text-sm text-slate-600">
                              {log.resourceType} <span className="text-slate-400">#{log.resourceId}</span>
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate-500 font-mono">
                          {log.ipAddress || "Unknown"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedTelehealthRoute>
  );
}