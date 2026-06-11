import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import nottermanPhoto from "@assets/20201207_NottermanD_DJA_006_0_1781195558546.jpg";
import chuPhoto from "@assets/photocache.6083_1781195711753.jpg";
import angelPhoto from "@assets/1769309118371_1781195860238.jpeg";

export default function About() {
  const boardMembers = [
    { name: "Angel Ndubisi", role: "Founder & President", photo: angelPhoto },
    { name: "Dr. Daniel Notterman, MD", role: "Advisory Board", photo: nottermanPhoto },
    { name: "Dr. Larry Chu, MD", role: "Advisory Board", photo: chuPhoto },
    { name: "King-David Ndubisi", role: "Advisory Board", photo: null }
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-secondary text-white py-20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold"
          >
            About Us
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/80"
          >
            We believe that geography should not dictate destiny. Our mission is to bridge the gap between world-class healthcare and the communities that need it most.
          </motion.p>
        </div>
      </section>

      {/* Story, Mission, Vision */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-secondary">Our Story</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                The Global Health Reform Initiative Foundation (GHRI) was founded with a singular conviction: that healthcare disparities are solvable. We began our journey witnessing the stark contrast in health outcomes across different regions, where treatable conditions often became life-threatening due to a lack of access to basic care.
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg">
                By leveraging telemedicine, preventative education, and local partnerships, we've built a scalable model that empowers communities to take charge of their health, providing not just immediate relief, but long-term sustainable solutions.
              </p>
            </div>
            
            <div className="space-y-10">
              <Card className="border-none shadow-lg bg-primary text-white">
                <CardContent className="p-8 space-y-4">
                  <h3 className="text-2xl font-bold">Our Mission</h3>
                  <p className="text-xl italic font-serif">"Healthcare is a human right."</p>
                  <p className="text-white/80">We exist to ensure that every individual, regardless of their circumstances, has access to the medical attention they deserve.</p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-lg bg-secondary text-white">
                <CardContent className="p-8 space-y-4">
                  <h3 className="text-2xl font-bold">Our Vision</h3>
                  <p className="text-xl italic font-serif">"A world where every person has access to quality healthcare regardless of geography or income."</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-secondary">Our Core Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Equity", desc: "Fairness in access to resources and care." },
              { title: "Compassion", desc: "Treating every individual with dignity and respect." },
              { title: "Innovation", desc: "Using technology to solve complex challenges." },
              { title: "Collaboration", desc: "Working with local partners for sustainable impact." },
              { title: "Integrity", desc: "Transparency and accountability in all we do." },
              { title: "Empowerment", desc: "Equipping communities to lead their own health journeys." }
            ].map((value, i) => (
              <div key={i} className="flex gap-4 p-6 bg-white rounded-lg shadow-sm border border-border/50">
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <h4 className="font-bold text-secondary mb-2">{value.title}</h4>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold text-secondary">Leadership</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Our Board of Directors brings together decades of experience in medicine, technology, and global health.</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {boardMembers.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gray-200 flex items-center justify-center overflow-hidden">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover object-top" />
                    ) : (
                      <span className="text-4xl text-gray-400 font-bold tracking-widest uppercase">
                        {member.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    )}
                  </div>
                  <CardContent className="p-6 text-center space-y-2">
                    <h3 className="font-bold text-secondary text-lg group-hover:text-primary transition-colors">{member.name}</h3>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{member.role}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
