import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Donate() {
  const [amount, setAmount] = useState<number | "custom">(50);
  const [customAmount, setCustomAmount] = useState<string>("");

  const impacts = [
    { amount: 25, text: "provides health education materials for a rural classroom." },
    { amount: 50, text: "supports essential screenings for early disease detection." },
    { amount: 100, text: "helps connect a patient to specialized care via telemedicine." },
    { amount: 250, text: "funds a comprehensive community outreach event." },
  ];

  const currentImpact = impacts.find(i => i.amount === amount) || 
    (amount === "custom" && Number(customAmount) > 0 ? 
      { amount: "custom", text: "contributes directly to our life-saving programs worldwide." } : 
      null);

  return (
    <Layout>
      <section className="bg-primary text-white py-20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold"
          >
            Fund the Future of Health
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/90"
          >
            100% of your donation goes directly toward expanding healthcare access, funding telemedicine technology, and supporting preventive care initiatives.
          </motion.p>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            
            {/* Donation Form */}
            <div>
              <Card className="border-none shadow-xl overflow-hidden">
                <div className="bg-secondary p-6 text-white text-center">
                  <h2 className="text-2xl font-bold">Make a Donation</h2>
                </div>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold text-secondary">Select an Amount</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[25, 50, 100, 250].map((val) => (
                        <Button
                          key={val}
                          type="button"
                          variant={amount === val ? "default" : "outline"}
                          className={`h-14 text-lg font-bold ${amount === val ? 'bg-primary text-white' : 'hover:border-primary'}`}
                          onClick={() => {
                            setAmount(val);
                            setCustomAmount("");
                          }}
                        >
                          ${val}
                        </Button>
                      ))}
                      <div className="col-span-2 sm:col-span-2">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                          <Input
                            type="number"
                            placeholder="Custom Amount"
                            className={`h-14 pl-8 text-lg font-bold ${amount === "custom" ? 'border-primary ring-1 ring-primary' : ''}`}
                            value={customAmount}
                            onChange={(e) => {
                              setAmount("custom");
                              setCustomAmount(e.target.value);
                            }}
                            onFocus={() => setAmount("custom")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {currentImpact && (
                    <div className="p-4 bg-primary/10 rounded-lg flex gap-4 items-start">
                      <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                      <p className="text-secondary font-medium leading-relaxed">
                        Your donation of <span className="font-bold">${amount === "custom" ? customAmount : amount}</span> {currentImpact.text}
                      </p>
                    </div>
                  )}

                  <Alert variant="default" className="bg-orange-50 border-orange-200">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-800">Secure Processing Coming Soon</AlertTitle>
                    <AlertDescription className="text-orange-700">
                      We are currently setting up our secure payment gateway. Please check back shortly to complete your donation.
                    </AlertDescription>
                  </Alert>

                  <Button size="lg" className="w-full h-16 text-xl font-bold" disabled>
                    Donate Now
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Why Donate */}
            <div className="space-y-8 lg:py-8">
              <div className="space-y-4">
                <h3 className="text-3xl font-bold text-secondary">Your Impact</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We believe in complete transparency. When you donate to GHRI, you're not just giving money—you're providing tangible resources that save lives and build sustainable healthcare infrastructure in communities that have historically been left behind.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  { title: "Transparent Operations", desc: "We maintain low overhead costs so your money goes where it's needed most." },
                  { title: "Sustainable Solutions", desc: "We don't just treat; we train local providers and build lasting infrastructure." },
                  { title: "Data-Driven Approach", desc: "Our programs are designed and measured based on rigorous clinical evidence." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">{i + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-secondary text-lg">{item.title}</h4>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
}
