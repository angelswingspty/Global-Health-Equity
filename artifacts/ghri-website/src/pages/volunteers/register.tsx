import React, { useState } from "react";
import { useLocation } from "wouter";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function VolRegister() {
  const { login } = useVolAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "", skills: "", availability: "" });
  const [consented, setConsented] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (!consented) { setError("You must agree to the terms to register"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/volunteers/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, consentedToTerms: consented }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed"); return; }
      login(data.token, data.user);
      setLocation("/volunteers/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003F5C] to-[#0093D5] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Join as a Volunteer</h1>
          <p className="text-white/70 mt-2">Create your GHRI volunteer account</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-[#003F5C]">Create account</CardTitle>
            <CardDescription>Fill in your information to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Jane Doe" required />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jane@example.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Min. 8 characters" required minLength={8} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder="Repeat password" required />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="skills">Skills & Interests (optional)</Label>
                  <Input id="skills" value={form.skills} onChange={e => set("skills", e.target.value)} placeholder="e.g. First Aid, Community Outreach, Translation" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="availability">Availability (optional)</Label>
                  <Input id="availability" value={form.availability} onChange={e => set("availability", e.target.value)} placeholder="e.g. Weekends, Tue/Thu evenings" />
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox id="consent" checked={consented} onCheckedChange={(v) => setConsented(!!v)} className="mt-0.5" />
                <Label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to the GHRI Volunteer{" "}
                  <a href="#" className="text-[#0093D5] hover:underline">Terms of Service</a> and{" "}
                  <a href="#" className="text-[#0093D5] hover:underline">Privacy Policy</a>, and consent to my information being used for volunteer coordination.
                </Label>
              </div>

              <Button type="submit" className="w-full bg-[#0093D5] hover:bg-[#007ab8]" disabled={loading}>
                {loading ? "Creating account…" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/volunteers/login" className="text-[#0093D5] hover:underline font-medium">Sign in</Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">
            ← Back to GHRI website
          </Link>
        </div>
      </div>
    </div>
  );
}
