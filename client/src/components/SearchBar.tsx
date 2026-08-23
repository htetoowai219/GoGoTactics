import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Swords, User as UserIcon, Sparkles, Shield, Zap } from "lucide-react";
import { searchApi } from "../api/endpoints";
import { useDebounce } from "../hooks/useDebounce";
import type { Suggestion } from "../types";

const typeIcons: Record<Suggestion["type"], React.ReactNode> = {
  lineup: <Swords className="h-4 w-4 text-primary" />,
  hero: <Sparkles className="h-4 w-4 text-gold" />,
  commander: <Shield className="h-4 w-4 text-accent" />,
  synergy: <Zap className="h-4 w-4 text-foreground" />,
  user: <UserIcon className="h-4 w-4 text-muted" />,
};

export function SearchBar() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(value, 250);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: ["suggest", debounced],
    queryFn: async () => {
      const res = await searchApi.suggest(debounced);
      return res.data.data.suggestions;
    },
    enabled: debounced.trim().length >= 2,
  });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const go = (s: Suggestion) => {
    setOpen(false);
    setValue("");
    if (s.type === "lineup") navigate(`/lineups/${s.slug}`);
    else if (s.type === "user") navigate(`/users/${s.slug}`);
    else if (s.type === "hero") navigate(`/lineups?hero=${s.slug}`);
    else if (s.type === "commander") navigate(`/lineups?commander=${s.slug}`);
    else if (s.type === "synergy") navigate(`/lineups?synergy=${s.slug}`);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted pointer-events-none" />
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setOpen(false);
            navigate(
              value.trim()
                ? `/lineups?q=${encodeURIComponent(value.trim())}`
                : "/lineups",
            );
          }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search lineups, heroes, commanders…"
        className="h-9 w-full rounded-none border-2 border-foreground bg-surface pl-9 pr-8 text-sm font-medium placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus-visible:ring-offset-background"
      />
      {query.isFetching && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
      )}

      {open && debounced.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl animate-fade-in">
          {query.data && query.data.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto p-1">
              {query.data.map((s) => (
                <li key={`${s.type}-${s.id}`}>
                  <button
                    onClick={() => go(s)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-elevated cursor-pointer"
                  >
                    {s.image ? (
                      <img
                        src={s.image}
                        alt=""
                        loading="lazy"
                        className="h-8 w-8 rounded-md object-cover bg-elevated"
                      />
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-md bg-elevated">
                        {typeIcons[s.type]}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{s.label}</span>
                      <span className="block text-xs capitalize text-muted">
                        {s.meta ?? s.type}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-muted">
              {query.isLoading ? "Searching…" : "No matches found."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
