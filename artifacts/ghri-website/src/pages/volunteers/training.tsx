import React, { useState } from "react";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import { VolSidebar } from "@/components/volunteer/VolSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetVolTraining, useCompleteVolTraining } from "@workspace/api-client-react";
import { BookOpen, Video, FileText, Globe, CheckCircle2, Clock, ChevronDown, ChevronUp, Star } from "lucide-react";

const typeIcons = { video: Video, document: FileText, quiz: Star, article: Globe } as const;
const typeBadgeColors = { video: "bg-blue-100 text-blue-700", document: "bg-purple-100 text-purple-700", quiz: "bg-orange-100 text-orange-700", article: "bg-emerald-100 text-emerald-700" };

export default function VolTraining() {
  const { token } = useVolAuth();
  const authHeaders = { request: { headers: { Authorization: `Bearer ${token}` } } };
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: resources, refetch } = useGetVolTraining(authHeaders);
  const complete = useCompleteVolTraining({ mutation: { onSuccess: () => refetch() } });

  const required = resources?.filter(r => r.required) ?? [];
  const optional = resources?.filter(r => !r.required) ?? [];
  const done = resources?.filter(r => r.completed).length ?? 0;
  const total = resources?.length ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const handleComplete = (id: number) => {
    complete.mutate({ id, data: {} });
  };

  function ResourceCard({ r }: { r: typeof resources extends readonly (infer T)[] | undefined ? T : never }) {
    if (!r) return null;
    const Icon = typeIcons[r.resourceType as keyof typeof typeIcons] ?? Globe;
    const isOpen = expanded === r.id;
    return (
      <Card className={`overflow-hidden transition-all ${r.completed ? "border-green-200" : ""}`}>
        <div
          className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpanded(isOpen ? null : r.id)}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${r.completed ? "bg-green-100" : "bg-[#0093D5]/10"}`}>
            {r.completed ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Icon className="w-5 h-5 text-[#0093D5]" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-[#003F5C]">{r.title}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${typeBadgeColors[r.resourceType as keyof typeof typeBadgeColors] ?? "bg-gray-100 text-gray-600"}`}>
                {r.resourceType}
              </span>
              {r.required && <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600 px-1.5">Required</Badge>}
              {r.completed && <span className="text-[10px] text-green-600 font-medium">✓ Completed</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.description}</p>
            {r.durationMinutes && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> {r.durationMinutes} min
              </p>
            )}
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        </div>
        {isOpen && (
          <div className="px-5 pb-5 border-t bg-gray-50">
            {r.url && (
              <div className="mb-4 mt-4">
                <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#0093D5] hover:underline font-medium">
                  <Video className="w-4 h-4" /> Open resource ↗
                </a>
              </div>
            )}
            {r.content && (
              <div className="prose prose-sm max-w-none mt-4 text-sm text-[#003F5C]/90 whitespace-pre-wrap leading-relaxed">
                {r.content.split("\n").map((line, i) => {
                  if (line.startsWith("# ")) return <h3 key={i} className="font-bold text-base text-[#003F5C] mt-3 mb-1">{line.slice(2)}</h3>;
                  if (line.startsWith("## ")) return <h4 key={i} className="font-semibold text-sm text-[#003F5C] mt-2 mb-1">{line.slice(3)}</h4>;
                  if (line.startsWith("- ")) return <p key={i} className="ml-3 text-sm">• {line.slice(2)}</p>;
                  if (line.match(/^\d+\. /)) return <p key={i} className="ml-3 text-sm">{line}</p>;
                  return <p key={i} className={`text-sm ${line === "" ? "mt-2" : ""}`}>{line || <span>&nbsp;</span>}</p>;
                })}
              </div>
            )}
            {!r.completed && (
              <Button
                className="mt-5 bg-[#0093D5] hover:bg-[#007ab8] text-sm"
                onClick={() => handleComplete(r.id)}
                disabled={complete.isPending}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark as Complete
              </Button>
            )}
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VolSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#003F5C]">Training</h1>
          <p className="text-muted-foreground mt-1">Complete all required modules to become a certified GHRI volunteer</p>
        </div>

        {/* Progress bar */}
        <Card className="mb-6">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[#003F5C]">Overall Progress</p>
              <p className="text-sm font-bold text-[#0093D5]">{done}/{total} modules</p>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#0093D5] to-[#003F5C] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{pct}% complete</p>
          </CardContent>
        </Card>

        {required.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-[#003F5C] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400" /> Required Modules
            </h2>
            <div className="space-y-3">
              {required.map(r => <ResourceCard key={r.id} r={r} />)}
            </div>
          </div>
        )}

        {optional.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-[#003F5C] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" /> Optional Modules
            </h2>
            <div className="space-y-3">
              {optional.map(r => <ResourceCard key={r.id} r={r} />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
