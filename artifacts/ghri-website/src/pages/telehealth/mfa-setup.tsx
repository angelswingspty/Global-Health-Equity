import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Shield, Copy, Download, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useTelehealthMfaSetup, useTelehealthMfaVerify } from "@workspace/api-client-react";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  code: z.string().length(6, "Code must be exactly 6 digits").regex(/^\d+$/, "Code must contain only numbers"),
});

export default function MfaSetup() {
  const [, setLocation] = useLocation();
  const { user, token, login } = useTelehealthAuth();
  const { toast } = useToast();
  
  const setupMutation = useTelehealthMfaSetup({
    request: { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  });
  
  const verifyMutation = useTelehealthMfaVerify({
    request: { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  });

  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string; backupCodes: string[] } | null>(null);

  useEffect(() => {
    setupMutation.mutate(undefined, {
      onSuccess: (data) => {
        setSetupData(data);
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Setup Failed",
          description: err.response?.data?.error || "Failed to initialize MFA setup.",
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    verifyMutation.mutate(
      { data: { code: values.code, action: "enable" } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          toast({
            title: "MFA Enabled",
            description: "Your account is now more secure.",
          });
          setLocation(data.user.role === "patient" ? "/telehealth/patient/dashboard" : "/telehealth/provider/dashboard");
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Verification Failed",
            description: err.response?.data?.error || "Invalid code. Please try again.",
          });
        }
      }
    );
  };

  const copyBackupCodes = () => {
    if (setupData) {
      navigator.clipboard.writeText(setupData.backupCodes.join("\n"));
      toast({ title: "Copied to clipboard" });
    }
  };

  const downloadBackupCodes = () => {
    if (setupData) {
      const blob = new Blob([setupData.backupCodes.join("\n")], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ghri-telehealth-backup-codes.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center space-y-2 pb-6 border-b">
          <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-primary mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Secure Your Account</CardTitle>
          <CardDescription>
            Set up Multi-Factor Authentication (MFA)
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">1</div>
              Scan QR Code
            </h3>
            <p className="text-sm text-slate-600">
              Open your authenticator app (like Google Authenticator or Authy) and scan this QR code.
            </p>
            
            <div className="flex justify-center p-4 bg-white border rounded-lg max-w-[240px] mx-auto">
              {setupData ? (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.otpauthUrl)}`} 
                  alt="QR Code"
                  className="w-48 h-48"
                />
              ) : (
                <Skeleton className="w-48 h-48" />
              )}
            </div>
            
            {setupData && (
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Or enter this code manually:</p>
                <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono text-slate-800 tracking-wider">
                  {setupData.secret}
                </code>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">2</div>
              Save Backup Codes
            </h3>
            <p className="text-sm text-slate-600">
              Save these codes in a secure place. You can use them to sign in if you lose access to your authenticator app.
            </p>
            
            <div className="bg-slate-50 border rounded-lg p-4">
              {setupData ? (
                <div className="grid grid-cols-2 gap-2 mb-4 font-mono text-sm">
                  {setupData.backupCodes.map((code, i) => (
                    <div key={i} className="text-slate-700">{code}</div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-5 w-24" />)}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={copyBackupCodes} disabled={!setupData}>
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={downloadBackupCodes} disabled={!setupData}>
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">3</div>
              Verify Code
            </h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Enter 6-digit code from your app</Label>
                      <FormControl>
                        <Input placeholder="000000" className="text-center text-lg tracking-widest" maxLength={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={verifyMutation.isPending || !setupData}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {verifyMutation.isPending ? "Verifying..." : "Verify and Enable MFA"}
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}