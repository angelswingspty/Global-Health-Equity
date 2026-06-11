import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Shield, Lock } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useTelehealthLogin } from "@workspace/api-client-react";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function TelehealthLogin() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialRole = searchParams.get("role") === "provider" ? "provider" : "patient";
  const [role, setRole] = useState<"patient" | "provider">(initialRole);
  
  const { login } = useTelehealthAuth();
  const { toast } = useToast();
  
  const loginMutation = useTelehealthLogin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          
          if (data.mfaSetupRequired) {
            setLocation("/telehealth/mfa/setup");
          } else if (data.mfaRequired) {
            setLocation("/telehealth/mfa");
          } else {
            setLocation(`/telehealth/${data.user.role}/dashboard`);
          }
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: err.data?.error || err.message || "Invalid credentials. Please try again.",
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
            <Lock className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Secure Sign In</CardTitle>
          <CardDescription>
            Access the GHRI Telehealth Portal
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={role} onValueChange={(v) => setRole(v as any)} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="patient">Patient</TabsTrigger>
              <TabsTrigger value="provider">Provider</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="bg-slate-100 p-3 rounded-md mb-6 text-xs text-slate-600 border flex items-start gap-2">
            <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>Demo credentials: <strong>{role}@demo.ghri.org</strong> / <strong>Demo1234!</strong></p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label>Email address</Label>
                    <FormControl>
                      <Input type="email" placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <Label>Password</Label>
                      <Link href="#" className="text-xs text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex flex-col items-center border-t p-6 gap-2 text-sm text-slate-600">
          <p>
            Don't have an account?{" "}
            <Link href={`/telehealth/register?role=${role}`} className="text-primary font-medium hover:underline">
              Register here
            </Link>
          </p>
          <Link href="/telehealth" className="text-slate-400 hover:text-slate-600 mt-2">
            &larr; Back to portal selection
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}