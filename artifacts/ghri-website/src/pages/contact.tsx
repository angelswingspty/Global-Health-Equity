import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitContact } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Mail, Globe, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters")
});

export default function Contact() {
  const submitContact = useSubmitContact();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: ""
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    submitContact.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({
            title: "Message Sent",
            description: "Thank you for reaching out. We will get back to you shortly.",
          });
          form.reset();
        },
        onError: () => {
          toast({
            title: "Failed to send message",
            description: "Please try again later.",
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
          <h1 className="text-4xl md:text-6xl font-bold">Contact Us</h1>
          <p className="text-xl text-white/80">
            Have questions about our programs, partnerships, or donations? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            
            {/* Contact Info & Map */}
            <div className="space-y-10">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-secondary">Get in Touch</h2>
                <p className="text-lg text-muted-foreground">
                  Our team is ready to answer your questions and explore how we can work together to advance health equity globally.
                </p>
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-sm">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Email</p>
                      <a href="mailto:info.ghrif@gmail.com" className="text-lg font-bold text-secondary hover:text-primary transition-colors">
                        info.ghrif@gmail.com
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Website</p>
                      <a href="https://ghrif.org" target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-secondary hover:text-primary transition-colors">
                        www.ghrif.org
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Map Placeholder */}
              <div className="w-full h-64 bg-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-500 space-y-2 border border-gray-300">
                <MapPin className="w-8 h-8" />
                <span className="font-semibold">Global Health Reform Initiative Foundation</span>
                <span className="text-sm">Headquarters</span>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="font-bold text-secondary mb-4">Follow Our Journey</h3>
                <div className="flex gap-4">
                  {[
                    { icon: <Facebook className="w-6 h-6" />, label: "Facebook" },
                    { icon: <Twitter className="w-6 h-6" />, label: "Twitter" },
                    { icon: <Linkedin className="w-6 h-6" />, label: "LinkedIn" },
                    { icon: <Instagram className="w-6 h-6" />, label: "Instagram" }
                  ].map((social, i) => (
                    <a key={i} href="#" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-secondary hover:bg-primary hover:text-white transition-all shadow-sm">
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Form */}
            <div>
              <Card className="border-none shadow-xl">
                <CardContent className="p-8 sm:p-10">
                  <h3 className="text-2xl font-bold text-secondary mb-8">Send a Message</h3>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-secondary font-semibold">Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" className="h-12" {...field} />
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
                              <Input type="email" placeholder="your@email.com" className="h-12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-secondary font-semibold">Subject (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="How can we help?" className="h-12" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-secondary font-semibold">Message</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Write your message here..." className="min-h-[150px] resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full h-14 text-lg font-bold"
                        disabled={submitContact.isPending}
                      >
                        {submitContact.isPending ? "Sending..." : "Send Message"}
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
