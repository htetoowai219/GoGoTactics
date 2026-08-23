import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Swords,
  Users,
  Flag,
  Database,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { authApi } from "../api/endpoints";
import { useAuthStore } from "../stores/authStore";
import { cn } from "../lib/utils";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/lineups", label: "Lineups", icon: Swords },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/reports", label: "Reports", icon: Flag },
  { to: "/admin/game-data", label: "Game Data", icon: Database },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      queryClient.clear();
      toast.success("Logged out");
      navigate("/");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r-[3px] border-foreground bg-card">
        <div className="flex items-center gap-2.5 border-b-2 border-foreground px-5 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-none border-2 border-foreground bg-primary shadow-comic-sm -rotate-3">
            <Swords className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div>
            <p className="font-display text-lg uppercase leading-tight tracking-wide">
              GoGoTactics
            </p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
              Admin
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-none px-3 py-2.5 text-sm font-bold uppercase tracking-wide transition-all",
                  isActive
                    ? "bg-primary text-foreground border-2 border-foreground shadow-comic-sm"
                    : "text-muted hover:bg-elevated hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2.5} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t-2 border-foreground p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-none px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-muted transition-colors hover:bg-elevated hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4 shrink-0" /> View site
          </Link>
          <button
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-none px-3 py-2.5 text-left text-sm font-bold uppercase tracking-wide text-muted transition-colors hover:bg-elevated hover:text-danger"
          >
            <LogOut className="h-4 w-4 shrink-0" /> Log out
          </button>
          {user && (
            <p className="truncate px-3 pb-1 pt-2 text-xs font-medium text-muted">
              Signed in as{" "}
              <span className="font-bold text-foreground">
                @{user.username}
              </span>
            </p>
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
