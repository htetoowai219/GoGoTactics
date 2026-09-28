import { useEffect } from "react";
import { siteUrl as resolveSiteUrl } from "../lib/runtimeConfig";

interface SeoProps {
  title: string;
  description?: string;
  image?: string | null;
  type?: string;
  pathname?: string;
  noIndex?: boolean;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function Seo({
  title,
  description,
  image,
  type = "website",
  pathname = "",
}: SeoProps) {
  useEffect(() => {
    const siteUrl = resolveSiteUrl();
    const fullTitle =
      title === "GoGoTactics"
        ? title
        : `${title} — GoGoTactics`;
    const desc =
      description ||
      "Discover, share and rate community lineups for Magic Chess: Go Go.";

    document.title = fullTitle;
    upsertMeta("name", "description", desc);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:type", type);
    if (image) upsertMeta("property", "og:image", image);
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");

    const url = `${siteUrl}${pathname}`;
    upsertCanonical(url);
    upsertMeta("property", "og:url", url);
  }, [title, description, image, type, pathname]);

  return null;
}
