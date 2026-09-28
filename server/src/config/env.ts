import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
  HOST: z.string().default("0.0.0.0"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/gogotactics"),
  JWT_SECRET: z.string().default("dev-only-secret-change-me-in-production!"),
  JWT_EXPIRES_IN_DAYS: z.coerce.number().default(7),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  CLIENT_URLS: z.string().optional(),
  ALLOW_ANY_ORIGIN: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  REQUIRE_CLOUDINARY: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? true : v === "true")),
  TRUST_PROXY: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? true : v === "true")),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  TRENDING_GRAVITY: z.coerce.number().default(1.5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

const env = parsed.data;

/** Placeholder shipped with docker-compose so the stack boots in one command. */
export const LOCAL_JWT_SECRET = "local-only-change-me-before-deploying";

if (env.NODE_ENV === "production") {
  const required: (keyof typeof env)[] = [
    "JWT_SECRET",
    "MONGODB_URI",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = required.filter((k) => !env[k]);
  if (env.REQUIRE_CLOUDINARY && missing.length > 0 && !env.CLOUDINARY_URL) {
    throw new Error(
      `Missing required production env variables: ${missing.join(", ")}`,
    );
  }
  if (env.JWT_SECRET === "dev-only-secret-change-me-in-production!") {
    throw new Error("JWT_SECRET must be changed in production");
  }
  if (env.JWT_SECRET === LOCAL_JWT_SECRET) {
    console.warn(
      "[env] WARNING: JWT_SECRET is the bundled local placeholder — set your own before exposing this API.",
    );
  }
}

export const allowedOrigins: string[] = [
  ...new Set(
    [env.CLIENT_URL, ...(env.CLIENT_URLS ?? "").split(",")]
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean),
  ),
];

export default env;
