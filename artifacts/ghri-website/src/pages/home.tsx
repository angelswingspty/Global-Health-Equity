import React, { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSubscribeNewsletter } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Heart, Stethoscope, Users, MonitorSmartphone, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const subscribe = useSubscribeNewsletter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    subscribe.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          toast({ title: "Subscribed successfully!", description: "Thank you for joining our newsletter." });
          setEmail("");
        },
        onError: () => {
          toast({ title: "Subscription failed", description: "Please try again later.", variant: "destructive" });
        }
      }
    );
  };

  const workCards = [
    {
      icon: <Stethoscope className="w-8 h-8 text-primary" />,
      title: "Telemedicine Access",
      description: "Connecting rural and underserved populations with healthcare professionals."
    },
    {
      icon: <Heart className="w-8 h-8 text-primary" />,
      title: "Preventive Health",
      description: "Screenings, education, and early intervention programs."
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Community Health",
      description: "Empowering communities through outreach and local partnerships."
    },
    {
      icon: <MonitorSmartphone className="w-8 h-8 text-primary" />,
      title: "AI & Digital Health",
      description: "Leveraging technology to reduce healthcare disparities."
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-secondary overflow-hidden min-h-[80vh] flex items-center py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary/40 opacity-90 z-0"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl space-y-6"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              Healthcare <br/><span className="text-primary-foreground">For Everyone.</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl leading-relaxed">
              Expanding access to healthcare through telemedicine, preventive care, and community-centered innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/donate">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 h-auto">Donate</Button>
              </Link>
              <Link href="/volunteers">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 h-auto bg-transparent text-white border-white hover:bg-white hover:text-secondary">Get Involved</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Our Work */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary">Our Work</h2>
            <p className="text-lg text-muted-foreground">Comprehensive solutions for complex global health challenges.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full border-none shadow-md hover:shadow-xl transition-shadow bg-white">
                  <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full mb-2">
                      {card.icon}
                    </div>
                    <h3 className="text-xl font-bold text-secondary">{card.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{card.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Featured Program */}
      <section className="py-24 bg-primary text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-white/80 font-semibold tracking-wider uppercase">Featured Initiative</span>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">Rural Diabetes Detection & Care Access Initiative</h2>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                Providing diabetes screening, education, and care navigation for underserved communities while building pathways to future telemedicine access.
              </p>
              <div className="pt-4">
                <Link href="/programs">
                  <Button variant="secondary" size="lg" className="text-primary font-bold group">
                    Learn More
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              {/* Optional: Add an image here later */}
            </div>
          </div>
        </div>
      </section>
      {/* Newsletter */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary">Stay Connected to the Future of Health Equity</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our community to receive updates on our impact, upcoming initiatives, and ways you can help.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email address" 
              className="h-12 text-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" size="lg" className="h-12 px-8 shrink-0" disabled={subscribe.isPending}>
              {subscribe.isPending ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
        </div>
      </section>
      {/* Final CTA */}
      <section className="py-24 bg-secondary text-center text-white">
        <div className="container mx-auto px-4 md:px-6 space-y-10 max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">Join the Movement for Health Equity</h2>
          <p className="text-xl text-white/80">Every action counts. Whether you donate, volunteer, or partner with us, you are helping to build a healthier world.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
            <Link href="/donate">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold">Donate</Button>
            </Link>
            <Link href="/volunteers">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-transparent text-white border-white hover:bg-white hover:text-secondary">Volunteer</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-transparent text-white border-white hover:bg-white hover:text-secondary">Partner With Us</Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
