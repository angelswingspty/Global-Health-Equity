import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, BookOpen, Clock, Calendar, FileText, MessageSquare, BarChart3, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const features = [
  { icon: BookOpen, title: "Training Modules", desc: "Complete HIPAA, cultural competency, and program-specific training modules at your own pace." },
  { icon: FileText, title: "Digital Waivers", desc: "Sign all required agreements digitally. Track your onboarding status in one place." },
  { icon: Clock, title: "Service Hours", desc: "Log and track volunteer service hours. Get them reviewed and approved by coordinators." },
  { icon: Calendar, title: "Events", desc: "Browse and register for health fairs, outreach events, training sessions, and orientations." },
  { icon: MessageSquare, title: "Messaging", desc: "Communicate directly with coordinators. Get updates and support whenever you need it." },
  { icon: BarChart3, title: "Impact Dashboard", desc: "See the difference you're making. Visualize your hours, events, and contributions." },
];

export default function VolunteersLanding() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#003F5C] to-[#0093D5] text-white py-24">
          <div className="container mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-6">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Volunteer with GHRI</h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join our community of dedicated volunteers helping to bring equitable healthcare to those who need it most. Every hour you give makes a lasting difference.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/volunteers/register">
                <Button size="lg" className="bg-white text-[#003F5C] hover:bg-white/90 font-semibold text-base px-8">
                  Become a Volunteer
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/volunteers/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold text-base px-8">
                  Sign In
                </Button>
              </Link>
            </div>
            <div className="mt-6">
              <Link href="/volunteers/login">
                <button className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors border border-white/20 rounded-full px-4 py-2 hover:bg-white/10">
                  <ShieldCheck className="w-4 h-4" />
                  Coordinator Login
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#003F5C] mb-3">Everything you need to volunteer</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">Our volunteer portal makes it easy to onboard, track your service, and stay connected with the GHRI team.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#0093D5]/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-[#0093D5]" />
                    </div>
                    <h3 className="font-semibold text-[#003F5C] mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-[#003F5C] mb-4">Ready to make a difference?</h2>
            <p className="text-muted-foreground text-lg mb-8">Create your volunteer account in minutes and start your journey with GHRI Foundation.</p>
            <Link href="/volunteers/register">
              <Button size="lg" className="bg-[#0093D5] hover:bg-[#007ab8] font-semibold text-base px-10">
                Get Started Today
              </Button>
            </Link>
          </div>
        </section>

        {/* Coordinator access */}
        <section className="py-10 bg-[#003F5C]">
          <div className="container mx-auto px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-[#0093D5]" />
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">Coordinator Access</p>
                  <p className="text-white/60 text-sm">Staff and program coordinators — manage volunteers, approve hours, and oversee events.</p>
                </div>
              </div>
              <Link href="/volunteers/login">
                <Button className="bg-[#0093D5] hover:bg-[#007ab8] text-white font-semibold px-8 shrink-0">
                  Coordinator Login
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
