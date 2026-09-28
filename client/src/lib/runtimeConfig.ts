export interface RuntimeConfig {
  apiUrl?: string;
  siteUrl?: string;
}

declare global {
  interface Window {
    __GOGOTACTICS_CONFIG__?: RuntimeConfig;
  }
}

const fromWindow = (): RuntimeConfig =>
  (typeof window !== "undefined" && window.__GOGOTACTICS_CONFIG__) || {};

export function apiBaseUrl(): string {
  return (
    fromWindow().apiUrl ||
    import.meta.env.VITE_API_URL ||
    "/api/v1"
  );
}

export function siteUrl(): string {
  if (typeof window === "undefined") return "";
  return (
    fromWindow().siteUrl ||
    import.meta.env.VITE_SITE_URL ||
    window.location.origin
  );
}
