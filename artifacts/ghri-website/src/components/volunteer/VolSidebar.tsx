import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useVolAuth } from "@/contexts/VolunteerAuthContext";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Clock,
  Calendar,
  MessageSquare,
  BarChart3,
  LogOut,
  Heart,
} from "lucide-react";

const navItems = [
  { href: "/volunteers/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/volunteers/training", label: "Training", icon: BookOpen },
  { href: "/volunteers/waivers", label: "Waivers", icon: FileText },
  { href: "/volunteers/hours", label: "My Hours", icon: Clock },
  { href: "/volunteers/events", label: "Events", icon: Calendar },
  { href: "/volunteers/messages", label: "Messages", icon: MessageSquare },
  { href: "/volunteers/impact", label: "Impact", icon: BarChart3 },
];

export function VolSidebar() {
  const [location] = useLocation();
  const { user, logout, isCoordinator } = useVolAuth();

  return (
    <aside className="w-64 min-h-screen bg-[#003F5C] text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center gap-2">
        <Heart className="w-5 h-5 text-[#0093D5]" />
        <span className="font-bold text-lg tracking-tight">GHRI Volunteers</span>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0093D5] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {user?.avatarInitials ?? "?"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-white/50 capitalize">
              {isCoordinator ? "Coordinator" : "Volunteer"}{" "}
              <span className={cn("inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ml-1",
                user?.status === "active" ? "bg-green-500/20 text-green-300" :
                user?.status === "pending" ? "bg-yellow-500/20 text-yellow-300" :
                "bg-red-500/20 text-red-300"
              )}>
                {user?.status}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <span className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
              location === href || location.startsWith(href + "/")
                ? "bg-[#0093D5] text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </span>
          </Link>
        ))}
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
