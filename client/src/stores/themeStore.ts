import { create } from "zustand";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "gogotactics-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage can throw in private mode / blocked storage.
  }
  return "system";
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(DARK_QUERY).matches;
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") return systemPrefersDark() ? "dark" : "light";
  return preference;
}

const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: "#FAF7EE",
  dark: "#14161D",
};

function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLORS[resolved]);
  }
  return resolved;
}

interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",
  resolved: "light",
  setPreference: (preference) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Persisting is best-effort; the class is still applied.
    }
    set({ preference, resolved: applyTheme(preference) });
  },
}));

/**
 * Applies the stored preference (default: follow the OS) and keeps the
 * "system" option live when the OS switches appearance while the tab is open.
 */
export function initTheme(): void {
  const preference = readStoredPreference();
  useThemeStore.setState({
    preference,
    resolved: applyTheme(preference),
  });

  if (typeof window === "undefined" || !window.matchMedia) return;

  const query = window.matchMedia(DARK_QUERY);
  const onChange = () => {
    if (useThemeStore.getState().preference === "system") {
      useThemeStore.setState({ resolved: applyTheme("system") });
    }
  };

  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", onChange);
  } else if (typeof query.addListener === "function") {
    query.addListener(onChange);
  }
}
