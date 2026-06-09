import React from "react";
import { Link, useLocation } from "wouter";
import { Shield, Activity, Users } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useTelehealthRegister } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  specialty: z.string().optional(),
  phone: z.string().optional(),
  consentedToTerms: z.boolean().refine((val) => val === true, "You must agree to the Terms of Service and Privacy Policy"),
  consentedToPrivacy: z.boolean().refine((val) => val === true, "You must consent to the Notice of Privacy Practices"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function TelehealthRegister() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialRole = searchParams.get("role") === "provider" ? "provider" : "patient";
  const [role, setRole] = React.useState<"patient" | "provider">(initialRole);
  
  const { toast } = useToast();
  const registerMutation = useTelehealthRegister();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      specialty: "",
      phone: "",
      consentedToTerms: false,
      consentedToPrivacy: false,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    registerMutation.mutate(
      { 
        data: {
          name: values.name,
          email: values.email,
          password: values.password,
          role,
          specialty: values.specialty,
          phone: values.phone,
          consentedToTerms: values.consentedToTerms
        } 
      },
      {
        onSuccess: () => {
          toast({
            title: "Registration successful",
            description: "Please set up multi-factor authentication.",
          });
          setLocation("/telehealth/mfa/setup");
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Registration Failed",
            description: err.response?.data?.error || "An error occurred during registration.",
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-primary mb-2">
            {role === "patient" ? <Activity className="w-6 h-6" /> : <Users className="w-6 h-6" />}
          </div>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Register for the GHRI Telehealth Portal
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={role} onValueChange={(v) => setRole(v as any)} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="patient">Patient</TabsTrigger>
              <TabsTrigger value="provider">Provider</TabsTrigger>
            </TabsList>
          </Tabs>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label>Full Name</Label>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <Label>Phone Number (Optional)</Label>
                    <FormControl>
                      <Input type="tel" placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {role === "provider" && (
                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Specialty</Label>
                      <FormControl>
                        <Input placeholder="e.g. Cardiology, General Practice" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Password</Label>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Confirm Password</Label>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3 pt-4 border-t mt-6">
                <FormField
                  control={form.control}
                  name="consentedToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <Label className="text-sm font-normal">
                          I agree to the Terms of Service and Privacy Policy
                        </Label>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consentedToPrivacy"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <Label className="text-sm font-normal">
                          I consent to the use of my health information as described in the Notice of Privacy Practices
                        </Label>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating account..." : "Register"}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex flex-col items-center border-t p-6 gap-2 text-sm text-slate-600">
          <p>
            Already have an account?{" "}
            <Link href={`/telehealth/login?role=${role}`} className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <Shield className="w-3 h-3 mr-1 text-green-600" /> HIPAA Compliant Portal
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}