import fs from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

interface CloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Re-read Cloudinary keys from .env on each lookup. dotenv snapshots at boot,
 * so this keeps uploads working after .env is filled in without a restart.
 */
function refreshCloudinaryEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  let content: string;
  try {
    content = fs.readFileSync(envPath, "utf8");
  } catch {
    return;
  }
  for (const line of content.split("\n")) {
    const match = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
    if (!match || !match[1].startsWith("CLOUDINARY")) continue;
    const value = match[2].replace(/^["']|["']$/g, "").trim();
    if (value && !process.env[match[1]]) process.env[match[1]] = value;
  }
}

function parseCloudinaryUrl(url: string): CloudinaryCredentials | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "cloudinary:") return null;
    const apiKey = parsed.username;
    const apiSecret = parsed.password;
    const cloudName = parsed.hostname;
    if (!apiKey || !apiSecret || !cloudName) return null;
    return { apiKey, apiSecret, cloudName };
  } catch {
    return null;
  }
}

export function resolveCloudinaryCredentials(): CloudinaryCredentials | null {
  refreshCloudinaryEnv();

  const url = process.env.CLOUDINARY_URL?.trim();
  if (url) {
    const parsed = parseCloudinaryUrl(url);
    if (parsed) return parsed;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }
  return null;
}

let configuredWith: CloudinaryCredentials | null = null;

export function ensureCloudinaryConfigured(): boolean {
  const credentials = resolveCloudinaryCredentials();
  if (!credentials) return false;
  if (
    !configuredWith ||
    configuredWith.cloudName !== credentials.cloudName ||
    configuredWith.apiKey !== credentials.apiKey
  ) {
    cloudinary.config({
      cloud_name: credentials.cloudName,
      api_key: credentials.apiKey,
      api_secret: credentials.apiSecret,
      secure: true,
    });
    configuredWith = credentials;
  }
  return true;
}

export function isCloudinaryConfigured(): boolean {
  return ensureCloudinaryConfigured();
}

export default cloudinary;
