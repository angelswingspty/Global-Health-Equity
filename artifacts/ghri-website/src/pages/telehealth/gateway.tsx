import React from "react";
import { Link } from "wouter";
import { Shield, Lock, Activity, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";

export default function TelehealthGateway() {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 py-12 md:py-24">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4 text-primary">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              GHRI Secure Telehealth Portal
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto flex items-center justify-center">
              <Lock className="w-4 h-4 mr-2" />
              This portal uses 256-bit encryption and multi-factor authentication to protect your health information.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Patient Portal Card */}
            <Card className="border-2 border-primary/20 hover:border-primary transition-colors overflow-hidden flex flex-col">
              <div className="h-3 bg-primary w-full" />
              <CardContent className="p-8 flex flex-col items-center text-center flex-1">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-primary">
                  <Activity className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Patient Portal</h2>
                <p className="text-slate-600 mb-8">
                  Access your health records, schedule appointments, request prescriptions, and securely message your providers.
                </p>
                <div className="mt-auto w-full space-y-4">
                  <Link href="/telehealth/login?role=patient">
                    <Button size="lg" className="w-full text-lg">Patient Login</Button>
                  </Link>
                  <p className="text-sm text-slate-600">
                    New patient? <Link href="/telehealth/register?role=patient" className="text-primary hover:underline font-medium">Register here</Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Provider Portal Card */}
            <Card className="border-2 border-secondary/20 hover:border-secondary transition-colors overflow-hidden flex flex-col">
              <div className="h-3 bg-secondary w-full" />
              <CardContent className="p-8 flex flex-col items-center text-center flex-1">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-secondary">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Provider Portal</h2>
                <p className="text-slate-600 mb-8">
                  Manage your patients, review medical documents, schedule follow-ups, and write prescriptions.
                </p>
                <div className="mt-auto w-full space-y-4">
                  <Link href="/telehealth/login?role=provider">
                    <Button size="lg" variant="outline" className="w-full text-lg border-secondary text-secondary hover:bg-secondary hover:text-white">
                      Provider Login
                    </Button>
                  </Link>
                  <p className="text-sm text-slate-600">
                    Provider access requires manual approval.
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>

          <div className="mt-16 flex items-center justify-center gap-4 text-sm text-slate-500">
            <span className="flex items-center"><Shield className="w-4 h-4 mr-1 text-green-600" /> HIPAA Compliant</span>
            <span className="text-slate-300">•</span>
            <span>SOC 2 Type II Certified</span>
            <span className="text-slate-300">•</span>
            <span>End-to-End Encryption</span>
          </div>

        </div>
      </div>
    </Layout>
  );
}