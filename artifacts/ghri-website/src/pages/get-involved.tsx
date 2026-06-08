import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitVolunteer } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Users, HeartHandshake, Shield, Globe2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  profession: z.string().min(2, "Please enter your profession"),
  interestArea: z.enum([
    "healthcare_professional",
    "student_volunteer",
    "community_outreach",
    "fundraising",
    "technology"
  ], {
    required_error: "Please select an interest area",
  })
});

export default function GetInvolved() {
  const submitVolunteer = useSubmitVolunteer();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      profession: "",
      interestArea: undefined
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    submitVolunteer.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({
            title: "Application Submitted",
            description: "Thank you for volunteering! We'll be in touch soon.",
          });
          form.reset();
        },
        onError: () => {
          toast({
            title: "Submission Failed",
            description: "There was an error submitting your application. Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <Layout>
      <section className="bg-secondary text-white py-20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold">Get Involved</h1>
          <p className="text-xl text-white/80">
            Join a global network of dedicated professionals and community members working to make healthcare a reality for everyone.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-secondary">Why Volunteer With Us?</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Volunteering with GHRI is an opportunity to use your skills for direct, measurable impact. Whether you are a healthcare professional providing telemedicine consultations, a technologist building digital health solutions, or a community organizer helping with outreach, your time saves lives.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: <HeartHandshake className="w-8 h-8 text-primary" />, title: "Direct Impact", desc: "Connect directly with communities in need." },
                  { icon: <Users className="w-8 h-8 text-primary" />, title: "Global Network", desc: "Collaborate with professionals worldwide." },
                  { icon: <Shield className="w-8 h-8 text-primary" />, title: "Meaningful Work", desc: "Tackle systemic healthcare disparities." },
                  { icon: <Globe2 className="w-8 h-8 text-primary" />, title: "Flexible Roles", desc: "Remote and on-the-ground opportunities." }
                ].map((item, i) => (
                  <Card key={i} className="border-none shadow-sm bg-gray-50">
                    <CardContent className="p-6 space-y-4">
                      {item.icon}
                      <h3 className="font-bold text-secondary">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <Card className="border-none shadow-xl">
                <CardContent className="p-8 sm:p-10 space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-secondary">Volunteer Application</h3>
                    <p className="text-muted-foreground">Fill out the form below and our team will get in touch with next steps.</p>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-secondary font-semibold">Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Doe" className="h-12" {...field} />
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
                            <FormLabel className="text-secondary font-semibold">Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="jane@example.com" className="h-12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="profession"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-secondary font-semibold">Profession / Current Role</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Registered Nurse, Software Engineer, Student" className="h-12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="interestArea"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-secondary font-semibold">Area of Interest</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select an area" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="healthcare_professional">Healthcare Professional</SelectItem>
                                <SelectItem value="student_volunteer">Student Volunteer</SelectItem>
                                <SelectItem value="community_outreach">Community Outreach</SelectItem>
                                <SelectItem value="fundraising">Fundraising</SelectItem>
                                <SelectItem value="technology">Technology</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full h-14 text-lg font-bold"
                        disabled={submitVolunteer.isPending}
                      >
                        {submitVolunteer.isPending ? "Submitting..." : "Submit Application"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
