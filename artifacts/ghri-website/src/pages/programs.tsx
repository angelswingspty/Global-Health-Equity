import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Activity, Stethoscope, HeartPulse, Globe2, ArrowRight } from "lucide-react";

export default function Programs() {
  const programs = [
    {
      id: "diabetes",
      icon: <Activity className="w-12 h-12 text-primary" />,
      title: "Rural Diabetes Detection & Care Access Initiative",
      objectives: "To provide comprehensive diabetes screening, education, and care navigation for underserved communities.",
      beneficiaries: "Rural populations with limited access to diagnostic facilities.",
      impact: "Early detection of pre-diabetes, reduction in diabetes-related complications, and building pathways to future telemedicine access."
    },
    {
      id: "telemedicine",
      icon: <Stethoscope className="w-12 h-12 text-primary" />,
      title: "Telemedicine Expansion Initiative",
      objectives: "To connect patients in remote areas with specialized healthcare professionals via digital platforms.",
      beneficiaries: "Patients in regions with severe doctor shortages.",
      impact: "Reduced travel time and cost for patients, immediate access to specialist consultations, and improved chronic disease management."
    },
    {
      id: "preventive",
      icon: <HeartPulse className="w-12 h-12 text-primary" />,
      title: "Preventive Health & Wellness Programs",
      objectives: "To educate communities on disease prevention, nutrition, and healthy lifestyle choices.",
      beneficiaries: "Schools, community centers, and families in low-income neighborhoods.",
      impact: "Lower incidence of preventable diseases, empowered communities taking charge of their health."
    },
    {
      id: "global",
      icon: <Globe2 className="w-12 h-12 text-primary" />,
      title: "Global Community Health Partnerships",
      objectives: "To build capacity by partnering with local clinics, training health workers, and providing medical supplies.",
      beneficiaries: "Local healthcare providers and their patient populations.",
      impact: "Strengthened local health systems capable of sustaining long-term community care."
    }
  ];

  return (
    <Layout>
      <section className="bg-secondary text-white py-20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold"
          >
            Our Programs
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/80"
          >
            Targeted initiatives designed to break down barriers to healthcare access, focusing on early intervention, technology, and community empowerment.
          </motion.p>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 space-y-24">
          {programs.map((program, i) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="grid lg:grid-cols-12 gap-8 items-stretch"
            >
              <div className="lg:col-span-5 bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-border/50 flex flex-col justify-center space-y-6">
                <div className="p-4 bg-primary/10 rounded-2xl inline-flex w-fit">
                  {program.icon}
                </div>
                <h2 className="text-3xl font-bold text-secondary">{program.title}</h2>
                <Link href="/donate">
                  <Button size="lg" className="w-fit mt-4 group">
                    Support this Program
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
              
              <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6">
                <Card className="bg-white border-none shadow-sm h-full">
                  <CardContent className="p-8 space-y-3">
                    <h3 className="font-bold text-primary text-lg uppercase tracking-wide">Objectives</h3>
                    <p className="text-muted-foreground leading-relaxed">{program.objectives}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border-none shadow-sm h-full">
                  <CardContent className="p-8 space-y-3">
                    <h3 className="font-bold text-primary text-lg uppercase tracking-wide">Beneficiaries</h3>
                    <p className="text-muted-foreground leading-relaxed">{program.beneficiaries}</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm sm:col-span-2">
                  <CardContent className="p-8 space-y-3">
                    <h3 className="font-bold text-primary text-lg uppercase tracking-wide">Expected Impact</h3>
                    <p className="text-muted-foreground leading-relaxed">{program.impact}</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-24 bg-primary text-white text-center">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold">Help Us Expand Our Reach</h2>
          <p className="text-xl text-white/90">
            Every program we run relies on the generosity of donors and the dedication of volunteers. You can make a direct impact today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/donate">
              <Button variant="secondary" size="lg" className="h-14 px-8 text-lg text-primary font-bold">Donate Now</Button>
            </Link>
            <Link href="/get-involved">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg text-white border-white hover:bg-white hover:text-primary font-bold">Volunteer</Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
