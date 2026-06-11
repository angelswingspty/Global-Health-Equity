import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import {
  LayoutDashboard,
  Clock,
  Calendar,
  MessageSquare,
  BarChart3,
  LogOut,
  Heart,
  Users,
  CheckSquare,
  ShieldCheck,
  PlusSquare,
} from "lucide-react";

const volunteerNavItems = [
  { href: "/volunteers/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/volunteers/hours", label: "My Hours", icon: Clock },
  { href: "/volunteers/events", label: "Events", icon: Calendar },
  { href: "/volunteers/messages", label: "Messages", icon: MessageSquare },
  { href: "/volunteers/impact", label: "Impact", icon: BarChart3 },
];

const coordinatorNavItems = [
  { href: "/volunteers/coordinator/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/volunteers/coordinator/volunteers", label: "Volunteers", icon: Users },
  { href: "/volunteers/coordinator/hours", label: "Approve Hours", icon: CheckSquare },
  { href: "/volunteers/events", label: "Events", icon: Calendar },
  { href: "/volunteers/messages", label: "Messages", icon: MessageSquare },
  { href: "/volunteers/impact", label: "Impact", icon: BarChart3 },
];

export function VolSidebar() {
  const [location] = useLocation();
  const { user, logout, isCoordinator } = useVolAuth();

  const navItems = isCoordinator ? coordinatorNavItems : volunteerNavItems;

  return (
    <aside className="w-64 min-h-screen bg-[#003F5C] text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center gap-2">
        {isCoordinator
          ? <ShieldCheck className="w-5 h-5 text-[#0093D5]" />
          : <Heart className="w-5 h-5 text-[#0093D5]" />
        }
        <span className="font-bold text-lg tracking-tight">
          {isCoordinator ? "Coordinator" : "GHRI Volunteers"}
        </span>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0",
            isCoordinator ? "bg-[#003F5C] border-2 border-[#0093D5]" : "bg-[#0093D5]"
          )}>
            {user?.avatarInitials ?? "?"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-white/50">
              {isCoordinator ? (
                <span className="text-[#0093D5] font-medium">Coordinator</span>
              ) : (
                <>
                  Volunteer{" "}
                  <span className={cn("inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ml-1",
                    user?.status === "active" ? "bg-green-500/20 text-green-300" :
                    user?.status === "pending" ? "bg-yellow-500/20 text-yellow-300" :
                    "bg-red-500/20 text-red-300"
                  )}>
                    {user?.status}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Coordinator section label */}
      {isCoordinator && (
        <div className="px-6 pt-4 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Management</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location === href || location.startsWith(href + "/");
          return (
            <Link key={href} href={href}>
              <span className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                active
                  ? "bg-[#0093D5] text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </span>
            </Link>
          );
        })}

        {/* Create Event shortcut for coordinators */}
        {isCoordinator && (
          <div className="pt-3 mt-3 border-t border-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3 pb-1">Quick Actions</p>
            <Link href="/volunteers/events">
              <span className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-white/70 hover:bg-white/10 hover:text-white">
                <PlusSquare className="w-4 h-4 flex-shrink-0" />
                Create Event
              </span>
            </Link>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link href="/">
          <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white/90 cursor-pointer transition-colors">
            ← Back to Website
          </span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
