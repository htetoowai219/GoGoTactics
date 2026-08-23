import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Swords,
  LayoutGrid,
  Bookmark,
  ShieldHalf,
  LogOut,
  User as UserIcon,
  Settings,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SearchBar } from "./SearchBar";
import { useAuthStore } from "../stores/authStore";
import { authApi } from "../api/endpoints";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-none text-sm font-bold uppercase tracking-wide transition-all ${
      isActive
        ? "text-foreground bg-primary border-2 border-foreground shadow-comic-sm"
        : "text-muted hover:text-foreground hover:bg-elevated"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-foreground bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-none border-2 border-foreground bg-primary shadow-comic-sm -rotate-3 transition-transform hover:rotate-0">
            <Swords className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="hidden sm:block font-display text-xl uppercase tracking-wide">
            GoGo<span className="text-gradient">Tactics</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          <NavLink to="/lineups" className={navLinkClass}>
            <LayoutGrid className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Lineups
          </NavLink>
          {user && (
            <NavLink to="/saved" className={navLinkClass}>
              <Bookmark className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              Saved
            </NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink to="/admin" className={navLinkClass}>
              <ShieldHalf className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex-1 flex justify-center px-2 min-w-0">
          <div className="w-full max-w-md">
            <SearchBar />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Button size="sm" onClick={() => navigate("/create-lineup")} className="hidden sm:inline-flex">
                <Plus /> Create
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
                    <Avatar>
                      {user.avatar?.url ? (
                        <AvatarImage src={user.avatar.url} alt={user.username} />
                      ) : null}
                      <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    @{user.username}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/users/${user.username}`)}>
                    <UserIcon /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/saved")}>
                    <Bookmark /> Saved lineups
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings /> Settings
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <ShieldHalf /> Admin dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="hidden sm:inline-flex">
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate("/register")} className="hidden sm:inline-flex">
                Sign up
              </Button>
            </>
          )}
          <button
            className="md:hidden p-2 text-muted hover:text-foreground cursor-pointer"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <Swords className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border px-4 py-3 space-y-1 animate-fade-in">
          <NavLink to="/lineups" className={navLinkClass} onClick={() => setMobileOpen(false)}>
            Lineups
          </NavLink>
          {user && (
            <NavLink to="/saved" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Saved
            </NavLink>
          )}
          {user ? (
            <>
              <NavLink to="/create-lineup" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                Create lineup
              </NavLink>
              {user.role === "admin" && (
                <NavLink to="/admin" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                  Admin
                </NavLink>
              )}
              <button
                className={navLinkClass({ isActive: false }) + " w-full text-left"}
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                Log in
              </NavLink>
              <NavLink to="/register" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                Sign up
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}
