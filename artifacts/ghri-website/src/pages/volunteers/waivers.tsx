import React, { useState } from "react";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import { VolSidebar } from "@/components/volunteer/VolSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetVolWaivers, useSignVolWaiver } from "@workspace/api-client-react";
import { FileText, CheckCircle2, ChevronDown, ChevronUp, PenLine } from "lucide-react";

export default function VolWaivers() {
  const { token } = useVolAuth();
  const authHeaders = { request: { headers: { Authorization: `Bearer ${token}` } } };
  const [expanded, setExpanded] = useState<number | null>(null);
  const [signing, setSigning] = useState<number | null>(null);

  const { data: waivers, refetch } = useGetVolWaivers(authHeaders);
  const sign = useSignVolWaiver({ mutation: { onSuccess: () => { refetch(); setSigning(null); } } });

  const required = waivers?.filter(w => w.required) ?? [];
  const optional = waivers?.filter(w => !w.required) ?? [];
  const signed = waivers?.filter(w => w.signed).length ?? 0;
  const totalRequired = required.length;

  function WaiverCard({ w }: { w: typeof waivers extends readonly (infer T)[] | undefined ? T : never }) {
    if (!w) return null;
    const isOpen = expanded === w.id;
    const isSigning = signing === w.id;

    return (
      <Card className={`overflow-hidden ${w.signed ? "border-green-200" : ""}`}>
        <div
          className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpanded(isOpen ? null : w.id)}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${w.signed ? "bg-green-100" : "bg-[#0093D5]/10"}`}>
            {w.signed ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <FileText className="w-5 h-5 text-[#0093D5]" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-[#003F5C]">{w.title}</p>
              <Badge variant="outline" className="text-[10px] border-gray-300 text-gray-500">
                {w.version}
              </Badge>
              {w.required && <Badge variant="outline" className="text-[10px] border-orange-300 text-orange-600">Required</Badge>}
              {w.signed && <span className="text-[10px] text-green-600 font-medium">✓ Signed {w.signedAt ? new Date(w.signedAt).toLocaleDateString() : ""}</span>}
            </div>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        </div>

        {isOpen && (
          <div className="border-t bg-gray-50">
            <div className="px-5 py-4 max-h-80 overflow-y-auto">
              <pre className="text-xs text-[#003F5C]/80 whitespace-pre-wrap font-sans leading-relaxed">{w.content}</pre>
            </div>
            {!w.signed && (
              <div className="px-5 pb-5 border-t bg-white">
                {!isSigning ? (
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      onClick={() => setSigning(w.id)}
                      className="bg-[#0093D5] hover:bg-[#007ab8] text-sm"
                    >
                      <PenLine className="w-4 h-4 mr-2" />
                      Sign This Waiver
                    </Button>
                    <p className="text-xs text-muted-foreground">By signing, you confirm you have read and agree to this document</p>
                  </div>
                ) : (
                  <div className="pt-4">
                    <p className="text-sm font-medium text-[#003F5C] mb-3">
                      By clicking below, you acknowledge that you have read the entire document and agree to its terms.
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => sign.mutate({ id: w.id, data: { signatureData: "digital_consent" } })}
                        disabled={sign.isPending}
                        className="bg-green-600 hover:bg-green-700 text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Confirm & Sign
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSigning(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
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
          <h1 className="text-2xl font-bold text-[#003F5C]">Waivers & Agreements</h1>
          <p className="text-muted-foreground mt-1">Review and sign all required agreements before participating in GHRI programs</p>
        </div>

        {/* Summary */}
        <Card className={`mb-6 border-2 ${signed >= totalRequired ? "border-green-300 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            {signed >= totalRequired
              ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              : <FileText className="w-5 h-5 text-amber-600 flex-shrink-0" />
            }
            <p className="text-sm font-medium">
              {signed >= totalRequired
                ? "All required waivers signed — thank you!"
                : `${signed} of ${totalRequired} required waivers signed`}
            </p>
          </CardContent>
        </Card>

        {required.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-[#003F5C] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400" /> Required Agreements
            </h2>
            <div className="space-y-3">
              {required.map(w => <WaiverCard key={w.id} w={w} />)}
            </div>
          </div>
        )}

        {optional.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-[#003F5C] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" /> Optional Agreements
            </h2>
            <div className="space-y-3">
              {optional.map(w => <WaiverCard key={w.id} w={w} />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
