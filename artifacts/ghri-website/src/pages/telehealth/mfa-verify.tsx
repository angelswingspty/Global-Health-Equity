import React from "react";
import { Link, useLocation } from "wouter";
import { Shield, KeyRound } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useTelehealthMfaVerify } from "@workspace/api-client-react";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  code: z.string().min(6, "Code must be at least 6 characters"),
});

export default function MfaVerify() {
  const [, setLocation] = useLocation();
  const { token, login } = useTelehealthAuth();
  const { toast } = useToast();
  
  const verifyMutation = useTelehealthMfaVerify({
    request: { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    verifyMutation.mutate(
      { data: { code: values.code, action: "login" } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          setLocation(data.user.role === "patient" ? "/telehealth/patient/dashboard" : "/telehealth/provider/dashboard");
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Verification Failed",
            description: err.data?.error || err.message || "Invalid code. Please try again.",
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-primary mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the code from your authenticator app
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <Label className="sr-only">Authentication Code</Label>
                    <FormControl>
                      <Input 
                        placeholder="000000" 
                        className="text-center text-2xl tracking-[0.5em] h-14" 
                        autoComplete="one-time-code"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending ? "Verifying..." : "Verify"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-slate-600">
            <button className="text-primary hover:underline font-medium">
              Use a backup code instead
            </button>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col items-center border-t p-6 gap-2 text-sm text-slate-600">
          <div className="flex items-center text-xs text-slate-500">
            <Shield className="w-3 h-3 mr-1 text-green-600" /> Protected by 256-bit encryption
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}