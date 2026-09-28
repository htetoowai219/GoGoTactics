import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "../lib/utils";
import {
  useThemeStore,
  type ThemePreference,
} from "../stores/themeStore";

const OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeSwitcher({ className }: { className?: string }) {
  const preference = useThemeStore((s) => s.preference);
  const resolved = useThemeStore((s) => s.resolved);
  const setPreference = useThemeStore((s) => s.setPreference);

  const activeLabel =
    OPTIONS.find((o) => o.value === preference)?.label ??
    (resolved === "dark" ? "Dark" : "Light");

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "inline-flex items-center gap-1 rounded-none border-2 border-foreground bg-card p-1 shadow-comic-sm",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            title={`${label} theme`}
            onClick={() => setPreference(value)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-none border-2 px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition-all",
              selected
                ? "border-foreground bg-primary text-bright-ink shadow-comic-sm"
                : "border-transparent text-muted hover:border-foreground hover:bg-elevated hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sr-only sm:hidden">{label}</span>
          </button>
        );
      })}
      <span className="sr-only" aria-live="polite">
        {activeLabel} theme active
      </span>
    </div>
  );
}
