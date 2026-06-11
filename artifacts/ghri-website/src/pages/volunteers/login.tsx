import React, { useState } from "react";
import { useLocation } from "wouter";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart, AlertCircle, ShieldCheck, ChevronDown } from "lucide-react";
import { Link } from "wouter";

function LoginForm({ isCoordinator }: { isCoordinator: boolean }) {
  const { login } = useVolAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState(isCoordinator ? "coordinator@ghri.org" : "");
  const [password, setPassword] = useState(isCoordinator ? "Coord1234!" : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/volunteers/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed"); return; }
      login(data.token, data.user);
      if (data.user.role === "coordinator") {
        setLocation("/volunteers/coordinator/dashboard");
      } else {
        setLocation("/volunteers/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor={isCoordinator ? "coord-email" : "email"}>Email</Label>
        <Input
          id={isCoordinator ? "coord-email" : "email"}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={isCoordinator ? "coord-password" : "password"}>Password</Label>
        <Input
          id={isCoordinator ? "coord-password" : "password"}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>
      <Button
        type="submit"
        className={`w-full ${isCoordinator ? "bg-[#003F5C] hover:bg-[#002d43]" : "bg-[#0093D5] hover:bg-[#007ab8]"}`}
        disabled={loading}
      >
        {loading ? "Signing in…" : isCoordinator ? "Sign In as Coordinator" : "Sign In"}
      </Button>
    </form>
  );
}

export default function VolLogin() {
  const [showCoordinator, setShowCoordinator] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003F5C] to-[#0093D5] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Volunteer Portal</h1>
          <p className="text-white/70 mt-2">Sign in to access your volunteer account</p>
        </div>

        {/* Volunteer login card */}
        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-[#003F5C]">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm isCoordinator={false} />

            <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
              <p>New volunteer?{" "}
                <Link href="/volunteers/register" className="text-[#0093D5] hover:underline font-medium">Create an account</Link>
              </p>
              <p className="mt-3 text-xs text-muted-foreground/70">
                Demo credentials:<br />
                <span className="font-mono">volunteer@demo.ghri.org / Demo1234!</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Coordinator login section */}
        <div>
          <button
            type="button"
            onClick={() => setShowCoordinator(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-white/80" />
              <span className="text-sm font-medium">Login as Coordinator</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${showCoordinator ? "rotate-180" : ""}`} />
          </button>

          {showCoordinator && (
            <Card className="border-0 shadow-2xl mt-2 border-t-4 border-t-[#003F5C]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#003F5C]" />
                  <CardTitle className="text-[#003F5C] text-base">Coordinator Access</CardTitle>
                </div>
                <CardDescription>For program coordinators and staff only</CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm isCoordinator={true} />
                <p className="mt-4 text-center text-xs text-muted-foreground/70">
                  Demo: <span className="font-mono">coordinator@ghri.org / Coord1234!</span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-center">
          <Link href="/" className="text-white/60 hover:text-white text-sm transition-colors">
            ← Back to GHRI website
          </Link>
        </div>
      </div>
    </div>
  );
}
