import React from "react";
import { Link, useLocation } from "wouter";
import { useTelehealthAuth } from "@/contexts/TelehealthAuthContext";
import { Shield, LogOut, LayoutDashboard, Calendar, MessageSquare, FileText, Pill, Users, Activity, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SessionTimeoutModal } from "./SessionTimeoutModal";
import logoPath from "@assets/ghri-logo-transparent.png";

export function TelehealthLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useTelehealthAuth();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const isPatient = user.role === "patient";

  const navItems = isPatient
    ? [
        { label: "Dashboard", href: "/telehealth/patient/dashboard", icon: LayoutDashboard },
        { label: "Find a Doctor", href: "/telehealth/patient/find-a-doctor", icon: Stethoscope },
        { label: "Appointments", href: "/telehealth/patient/appointments", icon: Calendar },
        { label: "Messages", href: "/telehealth/patient/messages", icon: MessageSquare },
        { label: "Documents", href: "/telehealth/patient/documents", icon: FileText },
        { label: "Prescriptions", href: "/telehealth/patient/prescriptions", icon: Pill },
        { label: "Audit Log", href: "/telehealth/audit-log", icon: Activity },
      ]
    : [
        { label: "Dashboard", href: "/telehealth/provider/dashboard", icon: LayoutDashboard },
        { label: "Appointments", href: "/telehealth/provider/appointments", icon: Calendar },
        { label: "Patients", href: "/telehealth/provider/patients", icon: Users },
        { label: "Messages", href: "/telehealth/provider/messages", icon: MessageSquare },
        { label: "Prescriptions", href: "/telehealth/provider/prescriptions", icon: Pill },
        { label: "Audit Log", href: "/telehealth/audit-log", icon: Activity },
      ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SessionTimeoutModal />
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col fixed inset-y-0 z-10 hidden md:flex">
        <div className="p-4 border-b">
          <Link href="/">
            <img src={logoPath} alt="GHRI Logo" className="h-10 w-auto" />
          </Link>
        </div>
        <div className="p-4 bg-slate-50 border-b flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 line-clamp-1">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-slate-400")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-slate-600" onClick={logout}>
            <LogOut className="w-5 h-5 mr-3 text-slate-400" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b h-14 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center text-xs text-slate-500 font-medium">
            <Shield className="w-4 h-4 mr-2 text-green-600" />
            HIPAA Compliant Session
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Nav (Bottom) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex items-center justify-around p-2 z-20">
        {navItems.slice(0, 4).map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center p-2">
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-slate-400")} />
                  <span className={cn("text-[10px] mt-1 font-medium", isActive ? "text-primary" : "text-slate-500")}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
        })}
        <div className="flex flex-col items-center p-2" onClick={logout}>
          <LogOut className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] mt-1 font-medium text-slate-500">Out</span>
        </div>
      </nav>
    </div>
  );
}