import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/gogotactics"),
  JWT_SECRET: z.string().default("dev-only-secret-change-me-in-production!"),
  JWT_EXPIRES_IN_DAYS: z.coerce.number().default(7),
  CLIENT_URL: z.string().default("http://localhost:5173"),
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

if (env.NODE_ENV === "production") {
  const required: (keyof typeof env)[] = [
    "JWT_SECRET",
    "MONGODB_URI",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const missing = required.filter((k) => !env[k]);
  if (missing.length > 0 && !env.CLOUDINARY_URL) {
    throw new Error(
      `Missing required production env variables: ${missing.join(", ")}`,
    );
  }
  if (env.JWT_SECRET === "dev-only-secret-change-me-in-production!") {
    throw new Error("JWT_SECRET must be changed in production");
  }
}

export default env;
